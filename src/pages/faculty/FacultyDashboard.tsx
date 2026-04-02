import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { computeAttendanceStats } from '@/lib/attendance-engine';

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: students, isLoading: ls } = useQuery({
    queryKey: ['faculty-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: attendance, isLoading: la } = useQuery({
    queryKey: ['faculty-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = ls || la;

  const analysis = React.useMemo(() => {
    if (!students?.length || !attendance?.length) return { atRisk: [], myRecords: 0 };
    const atRisk = students
      .map(s => {
        const records = attendance.filter(a => a.student_id === s.id);
        const stats = computeAttendanceStats(records, s.full_name);
        return { ...s, stats };
      })
      .filter(s => s.stats.status === 'At Risk');

    const myRecords = attendance.filter(a => a.marked_by === user?.id).length;
    return { atRisk, myRecords };
  }, [students, attendance, user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-muted-foreground">Manage attendance and view reports</p>
        </div>

        {isLoading ? <LoadingSpinner message="Loading dashboard..." /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent><div className="text-3xl font-bold text-foreground">{students?.length ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">My Records</CardTitle>
                  <ClipboardList className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent><div className="text-3xl font-bold text-foreground">{analysis.myRecords}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent><div className="text-3xl font-bold text-foreground">{analysis.atRisk.length}</div></CardContent>
              </Card>
            </div>

            {analysis.atRisk.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" /> At-Risk Students (&lt;70%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.atRisk.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
                        <div>
                          <p className="font-medium text-foreground">{s.full_name}</p>
                          <p className="text-sm text-muted-foreground">{s.register_number} — {s.department}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{s.stats.percentage}%</Badge>
                          <span className="text-xs text-muted-foreground capitalize">{s.stats.trend !== 'no-data' ? s.stats.trend : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
