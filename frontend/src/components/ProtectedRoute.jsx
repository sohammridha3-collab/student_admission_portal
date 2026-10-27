import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProtectedRoute({ children, allowedRoles = [], requiredPermission }) {
  const { user, role, loading, permissions } = useAuth();
  const toast = useToast();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      toast.error(`Access Denied: ${role} account cannot access that dashboard.`);
    }
  }, [loading, user, role, allowedRoles, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Not Authenticated: Redirect to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Authorization Check
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Determine proper fallback destination
    let fallback = '/';
    if (role === 'STUDENT') fallback = '/student/dashboard';
    else if (role === 'OFFICER') fallback = '/officer/dashboard';
    else if (role === 'ADMIN') fallback = '/admin/dashboard';

    return <Navigate to={fallback} replace />;
  }

  // 3. Granular Permission Check (if applicable)
  if (requiredPermission && role !== 'ADMIN') {
    if (!permissions || !permissions[requiredPermission]) {
      return <Navigate to="/officer/dashboard" replace />;
    }
  }

  return children;
}
