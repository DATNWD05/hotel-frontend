import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  permission?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, children }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const navType = useNavigationType(); // PUSH, POP, REPLACE

  // Hiển thị toast mỗi khi dùng link (PUSH) truy cập route không có quyền
  useEffect(() => {
    if (permission && user && !hasPermission(permission) && navType === 'PUSH') {
      toast.error('Bạn không có quyền truy cập vào trang này');
    }
  }, [permission, user, hasPermission, navType]);

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Không có quyền → không render component
  if (permission && !hasPermission(permission)) {
    return null;
  }

  // Có quyền → render children
  return <>{children}</>;
};

export default ProtectedRoute;
