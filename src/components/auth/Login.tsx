import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import '../../css/Login.css';

// Kiểu dữ liệu cho form
interface LoginInputs {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  permissions: string[];
}

interface LoginResponse {
  token: string;
  user: User;
}

const backgroundImages = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  'https://images.unsplash.com/photo-1606402179428-a57976d71fa4?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.1.0',
  'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0',
];

const Login: React.FC = () => {
  const [background, setBackground] = useState('');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { user, isAuthenticated, login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();

  useEffect(() => {
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    setBackground(randomImage);
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate('/', { replace: true });
    }
  }, [user, isAuthenticated, loading, navigate]);

  const changeBackground = (img: string) => {
    setBackground(img);
    localStorage.setItem('backgroundImage', img);
    setShowThumbnails(false);
  };

  const toggleThumbnails = () => {
    setShowThumbnails((prev) => !prev);
  };

  const onSubmit = async (data: LoginInputs) => {
    setLoading(true);
    try {
      const response = await api.post<LoginResponse>('/login', data);
      const { token, user } = response.data;
      if (!token || !user || !user.role_id) {
        throw new Error('Dữ liệu đăng nhập không hợp lệ');
      }
      if (user.status !== 'active') {
        throw new Error('Tài khoản không hoạt động, vui lòng liên hệ quản trị viên.');
      }
      const userWithPermissions = {
        ...user,
        permissions: user.permissions ?? [],
      };
      await login(token, userWithPermissions);
      toast.success('Đăng nhập thành công!');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.message || (error.response?.status === 401 ? 'Sai email hoặc mật khẩu!' : 'Đã có lỗi xảy ra!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-background"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="background-switcher">
        <button className="circle-button" onClick={toggleThumbnails}>🖼</button>
        {showThumbnails && (
          <div className="thumbnail-popup">
            {backgroundImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`bg-${index}`}
                onClick={() => changeBackground(img)}
                className={`thumbnail ${background === img ? 'selected' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="login-container">
        <div className="logo">HOBILO</div>
        <h2>Welcome Back</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              {...register('email', {
                required: 'Email không được để trống',
                pattern: {
                  value: /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/,
                  message: 'Email không đúng định dạng',
                },
                validate: (value) =>
                  value.endsWith('@gmail.com') || 'Email phải kết thúc bằng @gmail.com',
              })}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              {...register('password', {
                required: 'Mật khẩu không được để trống',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự',
                },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
                  message: 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số',
                },
              })}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>

          <div className="forgot">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
