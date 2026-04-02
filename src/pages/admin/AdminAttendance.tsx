import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination, { usePagination } from '@/components/Pagination';

const AdminAttendance: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['admin-attendance-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, students(full_name, register_number, department)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = React.useMemo(() => {
    if (!attendance) return [];
    if (!search.trim()) return attendance;
    const q = search.toLowerCase();
    return attendance.filter(a => {
      const student = a.students as any;
      return (
        a.subject.toLowerCase().includes(q) ||
        a.date.includes(q) ||
        student?.full_name?.toLowerCase().includes(q) ||
        student?.register_number?.toLowerCase().includes(q)
      );
    });
  }, [attendance, search]);

  const { paginatedItems, currentPage, totalPages, setCurrentPage } = usePagination(filtered, 15);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Records</h1>
          <p className="text-muted-foreground">
            {attendance ? `${attendance.length} records total` : 'Loading...'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by student name, register number, subject, or date..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="max-w-md" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner message="Loading attendance records..." /> : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Register No.</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                      ) : (
                        paginatedItems.map(a => (
                          <TableRow key={a.id}>
                            <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{(a.students as any)?.full_name ?? '—'}</TableCell>
                            <TableCell>{(a.students as any)?.register_number ?? '—'}</TableCell>
                            <TableCell>{a.subject}</TableCell>
                            <TableCell>
                              <Badge variant={a.status === 'present' ? 'default' : 'destructive'}>
                                {a.status}
                              </Badge>
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

export default AdminAttendance;
