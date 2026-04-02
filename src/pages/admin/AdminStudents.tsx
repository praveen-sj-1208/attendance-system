import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination, { usePagination } from '@/components/Pagination';

interface StudentForm {
  full_name: string;
  register_number: string;
  department: string;
  email: string;
}

const emptyForm: StudentForm = { full_name: '', register_number: '', department: '', email: '' };

const AdminStudents: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = React.useMemo(() => {
    if (!students) return [];
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.register_number.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const { paginatedItems, currentPage, totalPages, setCurrentPage } = usePagination(filtered, 10);

  const createMutation = useMutation({
    mutationFn: async (form: StudentForm) => {
      const { error } = await supabase.from('students').insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast({ title: 'Student added successfully' });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: StudentForm }) => {
      const { error } = await supabase.from('students').update(form).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast({ title: 'Student updated' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast({ title: 'Student deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.register_number.trim() || !form.department.trim() || !form.email.trim()) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (student: NonNullable<typeof students>[number]) => {
    setForm({
      full_name: student.full_name,
      register_number: student.register_number,
      department: student.department,
      email: student.email,
    });
    setEditId(student.id);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
            <p className="text-muted-foreground">
              {students ? `${students.length} students total` : 'Loading...'}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Student</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Student name" />
                </div>
                <div className="space-y-2">
                  <Label>Register Number</Label>
                  <Input value={form.register_number} onChange={e => setForm(f => ({ ...f, register_number: e.target.value }))} placeholder="REG001" />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@college.edu" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editId ? 'Update Student' : 'Add Student'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, register number, department, or email..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="max-w-md" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner message="Loading students..." /> : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Register No.</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No students found</TableCell></TableRow>
                      ) : (
                        paginatedItems.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell>{s.register_number}</TableCell>
                            <TableCell>{s.department}</TableCell>
                            <TableCell>{s.email}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

export default AdminStudents;
