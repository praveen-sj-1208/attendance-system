import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination, { usePagination } from '@/components/Pagination';

const AdminNotifications: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { paginatedItems, currentPage, totalPages, setCurrentPage } = usePagination(notifications, 20);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {notifications ? `${notifications.length} notifications total` : 'Loading...'}
          </p>
        </div>

        {isLoading ? <LoadingSpinner message="Loading notifications..." /> : (
          <>
            <div className="space-y-3">
              {paginatedItems.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No notifications</CardContent></Card>
              ) : (
                paginatedItems.map(n => (
                  <Card key={n.id} className={n.is_read ? 'opacity-60' : ''}>
                    <CardContent className="flex items-start gap-3 py-4">
                      <Bell className={`h-5 w-5 mt-0.5 shrink-0 ${
                        n.type === 'warning' ? 'text-destructive' :
                        n.type === 'success' ? 'text-success' : 'text-primary'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleString()} · {n.type}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;
