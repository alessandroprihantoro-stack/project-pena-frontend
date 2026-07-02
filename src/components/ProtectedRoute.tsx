import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

// PERHATIKAN: Kita gunakan 'export const ProtectedRoute' agar presisi dengan { ProtectedRoute } di App.tsx
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-indigo-400 font-mono text-sm animate-pulse">
        [PENA_GUARD]: Memeriksa KTP digital ke satelit...
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const ruteMarkas: Record<UserRole, string> = {
      ADMIN: '/admin/dashboard', 
      PENGAWAS: '/pengawas/dashboard',
      SEKOLAH: '/sekolah/dashboard',
    };
    return <Navigate to={ruteMarkas[profile.role] || '/login'} replace />;
  }

  return <Outlet />;
};