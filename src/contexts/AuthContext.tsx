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
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        // Nếu role_id === 1 (Owner), gán toàn quyền
        if (parsedUser.role_id === 1) {
          const superUser = { ...parsedUser, permissions: ['*'] };
          setUser(superUser);
          localStorage.setItem('auth_user', JSON.stringify(superUser));
        } else if (!parsedUser.permissions?.length) {
          // Với các role khác, fetch permission
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
      const updated = { ...(user as User), permissions };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    } catch (err: any) {
      console.error('Lỗi khi lấy quyền:', err);
      toast.warn('Không thể lấy quyền, sử dụng mặc định');
      const updated = { ...(user as User), permissions: [] };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      // Lưu token
      localStorage.setItem('auth_token', token);
      // Khởi tạo user với permissions rỗng
      const initialUser = { ...userData, permissions: [] };
      setUser(initialUser);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(initialUser));

      // Nếu Owner
      if (userData.role_id === 1) {
        const superUser = { ...initialUser, permissions: ['*'] };
        setUser(superUser);
        localStorage.setItem('auth_user', JSON.stringify(superUser));
      } else {
        await fetchPermissions(userData.role_id);
      }

      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
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
    if (!user) return false;
    // Owner với '*' luôn có quyền
    if (user.permissions.includes('*')) return true;
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
  if (!context) throw new Error('useAuth phải được dùng trong AuthProvider');
  return context;
};
