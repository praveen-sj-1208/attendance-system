import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Database } from '@/integrations/supabase/types';

type AttendanceStatus = Database['public']['Enums']['attendance_status'];

const MarkAttendance: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const { data: students, isLoading } = useQuery({
    queryKey: ['faculty-students-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').order('full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: existingAttendance } = useQuery({
    queryKey: ['existing-attendance', date, subject],
    queryFn: async () => {
      if (!subject) return [];
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date)
        .eq('subject', subject);
      return data ?? [];
    },
    enabled: !!subject,
  });

  // Get unique departments for filter
  const departments = React.useMemo(() => {
    if (!students) return [];
    return [...new Set(students.map(s => s.department))].sort();
  }, [students]);

  // Filter students
  const filteredStudents = React.useMemo(() => {
    if (!students) return [];
    return students.filter(s => {
      const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;
      const matchesSearch = !search.trim() ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.register_number.toLowerCase().includes(search.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [students, departmentFilter, search]);

  React.useEffect(() => {
    if (students && existingAttendance) {
      const newStatuses: Record<string, AttendanceStatus> = {};
      students.forEach(s => {
        const existing = existingAttendance.find(a => a.student_id === s.id);
        newStatuses[s.id] = existing?.status ?? 'present';
      });
      setStatuses(newStatuses);
    }
  }, [students, existingAttendance]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim()) throw new Error('Subject is required');
      if (!user) throw new Error('Not authenticated');

      const records = filteredStudents.map(s => ({
        student_id: s.id,
        date,
        subject: subject.trim(),
        status: statuses[s.id] ?? ('present' as AttendanceStatus),
        marked_by: user.id,
      }));

      const { error } = await supabase.from('attendance').upsert(records, {
        onConflict: 'student_id,date,subject',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existing-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['faculty-attendance'] });
      toast({ title: 'Attendance saved successfully ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggleStatus = (studentId: string) => {
    setStatuses(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAllPresent = () => {
    const newStatuses = { ...statuses };
    filteredStudents.forEach(s => { newStatuses[s.id] = 'present'; });
    setStatuses(newStatuses);
  };

  const markAllAbsent = () => {
    const newStatuses = { ...statuses };
    filteredStudents.forEach(s => { newStatuses[s.id] = 'absent'; });
    setStatuses(newStatuses);
  };

  const presentCount = filteredStudents.filter(s => statuses[s.id] === 'present').length;
  const absentCount = filteredStudents.length - presentCount;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
          <p className="text-muted-foreground">Record student attendance for a class</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="e.g., Mathematics" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? <LoadingSpinner message="Loading students..." /> : !subject ? (
              <p className="text-muted-foreground text-center py-8">Enter a subject to start marking attendance</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      Present: <strong className="text-success">{presentCount}</strong> | Absent: <strong className="text-destructive">{absentCount}</strong>
                    </span>
                    <Button variant="outline" size="sm" onClick={markAllPresent}>All Present</Button>
                    <Button variant="outline" size="sm" onClick={markAllAbsent}>All Absent</Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Register No.</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No students found</TableCell></TableRow>
                      ) : (
                        filteredStudents.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell>{s.register_number}</TableCell>
                            <TableCell>{s.department}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(s.id)}
                                className={statuses[s.id] === 'present' ? 'text-success' : 'text-destructive'}
                              >
                                {statuses[s.id] === 'present' ? <Check className="h-5 w-5 mr-1" /> : <X className="h-5 w-5 mr-1" />}
                                {statuses[s.id] === 'present' ? 'Present' : 'Absent'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} size="lg">
                    {submitMutation.isPending ? 'Saving...' : `Save Attendance (${filteredStudents.length} students)`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
