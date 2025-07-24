import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

/** ================== CONFIG SHARE ================== */
const DEFAULT_AVATAR = '/default-avatar.png';
const FILES_URL = import.meta.env.VITE_FILES_URL || 'http://127.0.0.1:8000';
const resolvePath = (p?: string) => {
  if (!p) return DEFAULT_AVATAR;
  const path = p.replace(/^storage\/app\/public\//, '');
  if (path.startsWith('storage/')) return `${FILES_URL}/${path}`;
  return `${FILES_URL}/storage/${path}`;
};
/** =================================================== */

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  permissions: string[];
  avatarUrl?: string;
  avatarVer?: number; // dùng để ép Topbar re-render
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasPermission: (p: string) => boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // ===== Helper: fetch avatar of current user if missing =====
  const fetchAvatarForCurrentUser = async (uid: number) => {
    try {
      const res = await api.get('/employees', { params: { page: 1 } });
      const emps: any[] = res.data.data;
      const me = emps.find(e => e.user_id === uid);
      if (me?.face_image) {
        const url = resolvePath(me.face_image);
        setUser(u => {
          if (!u) return u;
          const nu = { ...u, avatarUrl: url, avatarVer: Date.now() };
          localStorage.setItem('auth_user', JSON.stringify(nu));
          return nu;
        });
      }
    } catch (err) {
      console.warn('Fetch avatar fail:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');

    if (token && userData) {
      try {
        const parsed: User = JSON.parse(userData);
        setUser(parsed);
        setIsAuthenticated(true);

        if (parsed.role_id === 1) {
          const superUser: User = { ...parsed, permissions: ['*'] };
          setUser(superUser);
          localStorage.setItem('auth_user', JSON.stringify(superUser));
          localStorage.setItem('auth_user_id', String(parsed.id));
        } else {
          if (!parsed.permissions?.length) {
            fetchPermissions(parsed.role_id, parsed);
          }
          localStorage.setItem('auth_user_id', String(parsed.id));
        }

        // Nếu chưa có avatarUrl => gọi fetch avatar
        if (!parsed.avatarUrl) {
          fetchAvatarForCurrentUser(parsed.id);
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
      const permissions = (res.data.role?.permissions || []).map((p: any) => p.name);
      const updated = { ...(currentUser as User), permissions };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    } catch (err) {
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
      const initial: User = { ...userData, permissions: userData.permissions || [] };
      setUser(initial);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(initial));
      localStorage.setItem('auth_user_id', String(userData.id));

      if (userData.role_id === 1) {
        const superUser: User = { ...initial, permissions: ['*'] };
        setUser(superUser);
        localStorage.setItem('auth_user', JSON.stringify(superUser));
      } else {
        await fetchPermissions(userData.role_id, initial);
      }

      // Lấy avatar ngay khi login nếu chưa có
      await fetchAvatarForCurrentUser(userData.id);

      navigate('/dashboard');
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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng trong AuthProvider');
  return ctx;
};
