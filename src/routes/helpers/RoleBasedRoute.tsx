import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  permission: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, permission }) => {
  const { user, hasPermission, loading } = useAuth();
  const navigate = useNavigate();

  console.log('RoleBasedRoute - User:', user, 'Required Permission:', permission, 'Loading:', loading);

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user, redirecting to /login');
      toast.error('Vui lòng đăng nhập để truy cập');
      navigate('/login', { replace: true });
    } else if (!loading && permission && !hasPermission(permission)) {
      console.log('Permission denied:', { user, permission });
      toast.error('Bạn không có quyền truy cập vào trang này');
      navigate('/unauthorized', { replace: true });
    }
  }, [user, loading, hasPermission, permission, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;