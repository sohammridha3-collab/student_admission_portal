import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import ApplicationWorkflow from './pages/student/ApplicationWorkflow';
import ApplicationStatus from './pages/student/ApplicationStatus';
import PaymentReceipt from './pages/student/PaymentReceipt';

// Officer pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import ApplicationQueue from './pages/officer/ApplicationQueue';
import ApplicationReviewDetail from './pages/officer/ApplicationReviewDetail';
import OfficerReports from './pages/officer/OfficerReports';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogs from './pages/admin/AuditLogs';
import AdminReports from './pages/admin/AdminReports';

function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Admission Portal...
          </p>
        </div>
      </div>
    );
  }

  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPage = publicRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar />

      <div className="flex-1 flex">
        {user && !isPublicPage && <Sidebar />}

        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student Protected Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/workflow"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <ApplicationWorkflow />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/status"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <ApplicationStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/receipt"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <PaymentReceipt />
                </ProtectedRoute>
              }
            />

            {/* Officer Protected Routes */}
            <Route
              path="/officer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                  <OfficerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/queue"
              element={
                <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                  <ApplicationQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/review/:id"
              element={
                <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                  <ApplicationReviewDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/reports"
              element={
                <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                  <OfficerReports />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <RoleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SystemSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
