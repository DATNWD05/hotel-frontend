// src/routes/helpers/ProtectedRoute.tsx
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  allowedRoles?: number[]; // nếu không truyền thì cho phép tất cả vai trò
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const token = localStorage.getItem("auth_token");
  const userJson = localStorage.getItem("user");

  // Nếu chưa đăng nhập
  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    const roleId = user.role_id;

    // Nếu có quy định vai trò nhưng vai trò người dùng không hợp lệ
    if (allowedRoles && !allowedRoles.includes(roleId)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error("Lỗi phân tích user từ localStorage:", error);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
