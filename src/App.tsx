import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminSetupPage from "./pages/AdminSetupPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminNotifications from "./pages/admin/AdminNotifications";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import MarkAttendance from "./pages/faculty/MarkAttendance";
import FacultyReports from "./pages/faculty/FacultyReports";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentNotifications from "./pages/student/StudentNotifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin-setup" element={<AdminSetupPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendance /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><AdminRoles /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />

            {/* Faculty routes */}
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/mark-attendance" element={<ProtectedRoute allowedRoles={['faculty']}><MarkAttendance /></ProtectedRoute>} />
            <Route path="/faculty/reports" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyReports /></ProtectedRoute>} />

            {/* Student routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
