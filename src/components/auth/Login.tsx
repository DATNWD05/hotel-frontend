import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { Box, Button, TextField, Typography, Container, Paper, CircularProgress } from '@mui/material';
import '../../css/Login.css';

type LoginInputs = {
  email: string;
  password: string;
};

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

const backgroundImages = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  'https://images.unsplash.com/photo-1606402179428-a57976d71fa4?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3',
];

const Login: React.FC = () => {
  const [background, setBackground] = useState('');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInputs>();

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
      console.log('Logging in with:', { email: data.email });
      const response = await api.post<LoginResponse>('/login', data);
      console.log('Login response:', JSON.stringify(response.data, null, 2));
      const { token, user } = response.data;
      if (!token || !user || !user.role_id) {
        throw new Error('Dữ liệu đăng nhập không hợp lệ');
      }
      await login(token, user);
      toast.success('Đăng nhập thành công!');
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.status === 401 ? 'Sai email hoặc mật khẩu!' : 'Đã có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
            <Button onClick={toggleThumbnails}>🖼</Button>
            {showThumbnails && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {backgroundImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`bg-${index}`}
                    onClick={() => changeBackground(img)}
                    style={{
                      width: 50,
                      height: 50,
                      cursor: 'pointer',
                      border: background === img ? '2px solid blue' : 'none',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
          <Typography variant="h4" align="center" gutterBottom>
            Villa
          </Typography>
          <Typography variant="h6" align="center" gutterBottom>
            Welcome Back
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Email"
                {...register('email', {
                  required: 'Email không được để trống',
                  pattern: {
                    value: /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/,
                    message: 'Email không đúng định dạng',
                  },
                  validate: (value) => value.endsWith('@gmail.com') || 'Email phải kết thúc bằng @gmail.com',
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Password"
                type="password"
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
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </Box>
            <Box sx={{ mb: 2, textAlign: 'right' }}>
              <Link to="/forgot-password">Forgot your password?</Link>
            </Box>
            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;