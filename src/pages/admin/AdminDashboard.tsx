import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList, AlertTriangle, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { computeAttendanceStats } from '@/lib/attendance-engine';

const AdminDashboard: React.FC = () => {
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['admin-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = loadingStudents || loadingAttendance;

  const studentAnalysis = React.useMemo(() => {
    if (!students?.length || !attendance?.length) return { atRisk: [], perfect: [], total: students?.length ?? 0 };
    const analyzed = students.map(s => {
      const records = attendance.filter(a => a.student_id === s.id);
      const stats = computeAttendanceStats(records, s.full_name);
      return { ...s, stats };
    });
    return {
      atRisk: analyzed.filter(s => s.stats.status === 'At Risk'),
      perfect: analyzed.filter(s => s.stats.status === 'Perfect'),
      total: students.length,
    };
  }, [students, attendance]);

  const cards = [
    { title: 'Total Students', value: studentAnalysis.total, icon: Users, color: 'text-primary' },
    { title: 'Attendance Records', value: attendance?.length ?? 0, icon: ClipboardList, color: 'text-primary' },
    { title: 'At Risk (<70%)', value: studentAnalysis.atRisk.length, icon: AlertTriangle, color: 'text-destructive' },
    { title: 'Perfect (100%)', value: studentAnalysis.perfect.length, icon: Award, color: 'text-success' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of the attendance management system</p>
        </div>

        {isLoading ? <LoadingSpinner message="Loading dashboard..." /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map(card => (
                <Card key={card.title} className="animate-slide-up">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{card.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {studentAnalysis.atRisk.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    At-Risk Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {studentAnalysis.atRisk.map(s => (
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

export default AdminDashboard;
