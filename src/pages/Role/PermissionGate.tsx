import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

type PermissionGuardProps = {
  permission: string;
  children: React.ReactNode;
};

const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, children }) => {
  const context = useContext(AuthContext);

  if (!context) {
    // Optionally handle missing context
    return <div>Auth context not available</div>;
  }

  const { hasPermission, loading } = context;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PermissionGuard;