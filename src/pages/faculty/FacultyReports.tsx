import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination, { usePagination } from '@/components/Pagination';
import { computeAttendanceStats, getTrendIcon } from '@/lib/attendance-engine';

const FacultyReports: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: students, isLoading: ls } = useQuery({
    queryKey: ['faculty-students'],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*').order('full_name');
      return data ?? [];
    },
  });

  const { data: attendance, isLoading: la } = useQuery({
    queryKey: ['faculty-attendance'],
    queryFn: async () => {
      const { data } = await supabase.from('attendance').select('*');
      return data ?? [];
    },
  });

  const isLoading = ls || la;

  const studentReports = React.useMemo(() => {
    if (!students || !attendance) return [];
    return students.map(s => {
      const records = attendance.filter(a => a.student_id === s.id);
      const stats = computeAttendanceStats(records, s.full_name);
      return { ...s, stats };
    });
  }, [students, attendance]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return studentReports;
    const q = search.toLowerCase();
    return studentReports.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.register_number.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  }, [studentReports, search]);

  const { paginatedItems, currentPage, totalPages, setCurrentPage } = usePagination(filtered, 15);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Reports</h1>
          <p className="text-muted-foreground">Student attendance analysis with AI trends</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner message="Analyzing attendance data..." /> : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Register No.</TableHead>
                        <TableHead>Present/Total</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students found</TableCell></TableRow>
                      ) : (
                        paginatedItems.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell>{s.register_number}</TableCell>
                            <TableCell>{s.stats.present}/{s.stats.total}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={s.stats.percentage} className="w-20 h-2" />
                                <span className="text-sm font-medium">{s.stats.percentage}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                s.stats.status === 'At Risk' ? 'destructive' :
                                s.stats.status === 'Perfect' ? 'default' :
                                s.stats.status === 'No Data' ? 'secondary' : 'default'
                              }>
                                {s.stats.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`text-sm font-medium capitalize ${
                                s.stats.trend === 'improving' ? 'text-success' :
                                s.stats.trend === 'declining' ? 'text-destructive' :
                                s.stats.trend === 'stable' ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {s.stats.trend === 'no-data' ? '—' : `${getTrendIcon(s.stats.trend)} ${s.stats.trend}`}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FacultyReports;
