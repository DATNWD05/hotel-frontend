// src/routes/helpers/RoleBasedRoute.tsx
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  allowedRoleIds: number[];
}

const RoleBasedRoute = ({ children, allowedRoleIds }: Props) => {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    const roleId = user.role_id;

    if (!allowedRoleIds.includes(roleId)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children;
  } catch (error) {
    console.error("Failed to parse user JSON", error);
    return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRoute;
