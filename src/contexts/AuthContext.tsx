import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (!parsedUser.role_id) throw new Error('Thiếu role_id');

        setUser(parsedUser);
        setIsAuthenticated(true);

        if (!parsedUser.permissions?.length) {
          fetchPermissions(parsedUser.role_id);
        }
      } catch (err) {
        console.error('Lỗi khi parse người dùng:', err);
        toast.error('Dữ liệu người dùng không hợp lệ, vui lòng đăng nhập lại');
        logout();
      }
    }
  }, []);

  const fetchPermissions = async (roleId: number) => {
    try {
      const response = await api.get(`/roles/${roleId}`);
      const permissions = response.data.role?.permissions?.map((p: any) => p.name) || [];

      const updatedUser = { ...user, permissions } as User;
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err: any) {
      console.error('Lỗi khi lấy quyền:', err);
      toast.warn('Không thể lấy quyền, sử dụng mặc định');
      const updatedUser = { ...user, permissions: [] } as User;
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // ✅ Lưu token TRƯỚC khi gọi API fetch permission
      localStorage.setItem('auth_token', token);

      const initialUser = { ...userData, permissions: [] };
      localStorage.setItem('auth_user', JSON.stringify(initialUser));
      setUser(initialUser);
      setIsAuthenticated(true);

      await fetchPermissions(userData.role_id);

      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      toast.error('Đăng nhập thất bại: ' + (err.response?.data?.message || err.message));
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const hasPermission = (permission: string) => {
    if (!user || !Array.isArray(user.permissions)) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, hasPermission, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider');
  }
  return context;
};
