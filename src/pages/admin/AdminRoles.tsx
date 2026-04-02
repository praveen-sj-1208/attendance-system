import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination, { usePagination } from '@/components/Pagination';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const AdminRoles: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['admin-users-roles'],
    queryFn: async () => {
      const { data: roles, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      const { data: profiles } = await supabase.from('profiles').select('*');
      return (roles ?? []).map(r => ({
        ...r,
        profile: profiles?.find(p => p.id === r.user_id),
      }));
    },
  });

  const filtered = React.useMemo(() => {
    if (!usersWithRoles) return [];
    if (!search.trim()) return usersWithRoles;
    const q = search.toLowerCase();
    return usersWithRoles.filter(u =>
      u.profile?.full_name?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  }, [usersWithRoles, search]);

  const { paginatedItems, currentPage, totalPages, setCurrentPage } = usePagination(filtered, 10);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').update({ role }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-roles'] });
      toast({ title: 'Role updated successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default' as const;
      case 'faculty': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Role Management</h1>
          <p className="text-muted-foreground">
            {usersWithRoles ? `${usersWithRoles.length} users total` : 'Loading...'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="max-w-sm" />
            </div>

            {isLoading ? <LoadingSpinner message="Loading users..." /> : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Change Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                      ) : (
                        paginatedItems.map(u => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{u.profile?.full_name || 'Unknown User'}</p>
                                <p className="text-xs text-muted-foreground">{u.profile?.department || 'No department'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={roleBadgeVariant(u.role)} className="capitalize">
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={u.role}
                                onValueChange={(val: AppRole) => updateRoleMutation.mutate({ userId: u.user_id, role: val })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="faculty">Faculty</SelectItem>
                                  <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                              </Select>
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

export default AdminRoles;
