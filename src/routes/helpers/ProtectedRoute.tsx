import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  permission?: string;
  permissions?: string[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, permissions, children }) => {
  const { user, hasPermission, loading } = useAuth();
  const location = useLocation();
  const navType = useNavigationType();

  const hasAnyPermission = () => {
    if (!user) return false;
    if (permission) return hasPermission(permission);
    if (permissions && permissions.length > 0) {
      return permissions.some(p => hasPermission(p));
    }
    return true;
  };

  useEffect(() => {
    if (!loading && user && !hasAnyPermission() && navType === 'PUSH') {
      toast.error('Bạn không có quyền truy cập vào trang này');
    }
  }, [permission, permissions, user, hasPermission, navType, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAnyPermission()) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;