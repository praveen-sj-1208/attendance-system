import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, Bell, LogOut, GraduationCap,
  UserCheck, BarChart3, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = React.useMemo(() => {
    if (role === 'admin') return [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/students', icon: Users, label: 'Students' },
      { to: '/admin/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/admin/roles', icon: UserCheck, label: 'Manage Roles' },
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    ];
    if (role === 'faculty') return [
      { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/faculty/mark-attendance', icon: ClipboardList, label: 'Mark Attendance' },
      { to: '/faculty/reports', icon: BarChart3, label: 'Reports' },
    ];
    return [
      { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/student/attendance', icon: ClipboardList, label: 'My Attendance' },
      { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    ];
  }, [role]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <GraduationCap className="h-8 w-8 text-sidebar-primary" />
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">AttendAI</h1>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{role} Panel</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 mb-3 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 p-4 border-b border-border bg-card lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">AttendAI</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
