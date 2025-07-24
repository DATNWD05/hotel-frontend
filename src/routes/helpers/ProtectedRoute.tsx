import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  permission?: string; // dùng cho 1 quyền
  permissions?: string[]; // dùng cho nhiều quyền (ít nhất 1 đúng là pass)
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, permissions, children }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const navType = useNavigationType(); // PUSH, POP, REPLACE

  // Hàm kiểm tra quyền hợp lệ
  const hasAnyPermission = () => {
    if (!user) return false;

    if (permission) return hasPermission(permission);
    if (permissions && permissions.length > 0) {
      return permissions.some(p => hasPermission(p));
    }

    return true; // Không yêu cầu quyền nào cả
  };

  // Hiển thị toast khi không có quyền và truy cập bằng PUSH
  useEffect(() => {
    if (user && !hasAnyPermission() && navType === 'PUSH') {
      toast.error('Bạn không có quyền truy cập vào trang này');
    }
  }, [permission, permissions, user, hasPermission, navType]);

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Không có quyền → không render component
  if (!hasAnyPermission()) {
    return null;
  }

  // Có quyền → render children
  return <>{children}</>;
};

export default ProtectedRoute;
