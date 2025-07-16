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

// eslint-disable-next-line react-refresh/only-export-components
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

        // Nếu Owner
        if (parsedUser.role_id === 1) {
          const superUser = { ...parsedUser, permissions: ['*'] };
          setUser(superUser);
          localStorage.setItem('auth_user', JSON.stringify(superUser));
          localStorage.setItem('auth_user_id', parsedUser.id.toString()); // ✅ lưu user_id
        } else {
          if (!parsedUser.permissions?.length) {
            fetchPermissions(parsedUser.role_id);
          }
          localStorage.setItem('auth_user_id', parsedUser.id.toString()); // ✅ lưu user_id
        }
      } catch (err) {
        console.error('Lỗi khi parse người dùng:', err);
        toast.error('Dữ liệu người dùng không hợp lệ, vui lòng đăng nhập lại');
        logout();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPermissions = async (roleId: number) => {
    try {
      const response = await api.get(`/roles/${roleId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permissions = response.data.role?.permissions?.map((p: any) => p.name) || [];
      const updated = { ...(user as User), permissions };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Lưu token và user info
      localStorage.setItem('auth_token', token);
      const initialUser = { ...userData, permissions: [] };
      setUser(initialUser);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(initialUser));
      localStorage.setItem('auth_user_id', userData.id.toString()); // ✅ lưu user_id

      if (userData.role_id === 1) {
        const superUser = { ...initialUser, permissions: ['*'] };
        setUser(superUser);
        localStorage.setItem('auth_user', JSON.stringify(superUser));
        localStorage.setItem('auth_user_id', userData.id.toString()); // ✅ lưu lại user_id cho owner
      } else {
        await fetchPermissions(userData.role_id);
      }

      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      toast.error('Đăng nhập thất bại: ' + (err.response?.data?.message || err.message));
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_id'); // ✅ xoá user_id khi logout
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, hasPermission, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng trong AuthProvider');
  return context;
};
