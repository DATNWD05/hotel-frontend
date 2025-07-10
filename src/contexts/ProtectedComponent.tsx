import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedComponentProps {
  children: React.ReactNode;
  permission?: string;
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({ children, permission }) => {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('ProtectedComponent must be used within an AuthProvider');
  }
  const { isAuthenticated, hasPermission, user } = auth;

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to /login');
    toast.error('Vui lòng đăng nhập để tiếp tục');
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    console.log(`User lacks permission: ${permission}, available permissions: ${JSON.stringify(user?.permissions || [])}`);
    toast.error(`Không có quyền truy cập: ${permission}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedComponent;