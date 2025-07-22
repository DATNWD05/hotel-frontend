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
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasPermission: (p: string) => boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
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
        const parsed: User = JSON.parse(userData);
        setUser(parsed);
        setIsAuthenticated(true);

        if (parsed.role_id === 1) {
          const superUser = { ...parsed, permissions: ['*'] };
          setUser(superUser);
          localStorage.setItem('auth_user', JSON.stringify(superUser));
          localStorage.setItem('auth_user_id', String(parsed.id));
        } else {
          if (!parsed.permissions?.length) {
            fetchPermissions(parsed.role_id, parsed);
          }
          localStorage.setItem('auth_user_id', String(parsed.id));
        }
      } catch (err) {
        console.error('Parse user error:', err);
        toast.error('Dữ liệu người dùng không hợp lệ, vui lòng đăng nhập lại');
        logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPermissions = async (roleId: number, currentUser: User | null = user) => {
    try {
      const res = await api.get(`/roles/${roleId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permissions = (res.data.role?.permissions || []).map((p: any) => p.name);
      const updated = { ...(currentUser as User), permissions };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Get permission error:', err);
      toast.warn('Không thể lấy quyền, dùng mặc định');
      const updated = { ...(currentUser as User), permissions: [] };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      localStorage.setItem('auth_token', token);
      const initial = { ...userData, permissions: userData.permissions || [] };
      setUser(initial);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(initial));
      localStorage.setItem('auth_user_id', String(userData.id));

      if (userData.role_id === 1) {
        const superUser = { ...initial, permissions: ['*'] };
        setUser(superUser);
        localStorage.setItem('auth_user', JSON.stringify(superUser));
        localStorage.setItem('auth_user_id', userData.id.toString()); // ✅ lưu lại user_id cho owner
      } else {
        await fetchPermissions(userData.role_id, initial);
      }

      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Đăng nhập thất bại: ' + (err.response?.data?.message || err.message));
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_id');
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
    <AuthContext.Provider value={{ user, isAuthenticated, hasPermission, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng trong AuthProvider');
  return ctx;
};
