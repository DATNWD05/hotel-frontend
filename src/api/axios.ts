import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')?.trim();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Lỗi interceptor yêu cầu:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    // const message = error.response?.data?.message || error.message;

    if (status === 401) {
      toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    } else if (status === 403) {
      // toast.warn('Bạn không có quyền truy cập chức năng này.');
    } else if (status !== undefined && status >= 500) {
      toast.error('Lỗi server. Vui lòng thử lại sau.');
    }

    return Promise.reject(error);
  }
);

export default api;
