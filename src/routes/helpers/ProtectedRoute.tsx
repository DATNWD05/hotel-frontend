import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  permission?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, children }) => {
  const { user, hasPermission, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    toast.error('Vui lòng đăng nhập để truy cập');
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    toast.error('Bạn không có quyền truy cập vào trang này');
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;