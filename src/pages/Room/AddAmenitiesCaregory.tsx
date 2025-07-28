import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { AxiosError } from 'axios';
import '../../css/AmenitiesCategory.css';

interface ValidationErrors {
  name?: string;
  description?: string;
}

const AddAmenityCategory: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateForm = (data: { name: string; description: string }): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên danh mục không được để trống';
    else if (data.name.length > 50) errors.name = 'Tên danh mục không được vượt quá 50 ký tự';
    if (data.description && data.description.length > 500) errors.description = 'Mô tả không được vượt quá 500 ký tự';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    const errors = validateForm(updatedData);
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Vui lòng sửa các lỗi trong biểu mẫu trước khi lưu.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await api.post('/amenity-categories', {
        name: formData.name,
        description: formData.description,
      });

      if (response.status === 201) {
        toast.success('Tạo danh mục thành công!');
        setTimeout(() => navigate('/amenity-categories'), 2000);
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            : err.response?.data?.message || `Không thể tạo danh mục: ${err.message}`
          : err instanceof Error
          ? `Không thể tạo danh mục: ${err.message}`
          : 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="amenities-container">
      <div className="header">
        <h1>Thêm Danh mục Tiện ích</h1>
      </div>
      <Paper elevation={3} sx={{ p: 4, mt: 2, borderRadius: '8px' }}>
        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Tên danh mục"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              size="small"
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              sx={{ bgcolor: '#fff', borderRadius: '4px' }}
            />
            <TextField
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              size="small"
              multiline
              rows={3}
              error={!!validationErrors.description}
              helperText={validationErrors.description}
              sx={{ bgcolor: '#fff', borderRadius: '4px' }}
            />
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  maxWidth: 200,
                  backgroundColor: '#4318FF',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  px: 2.5,
                  py: 0.7,
                  '&:hover': { backgroundColor: '#7B1FA2' },
                  '&:disabled': { backgroundColor: '#a9a9a9' },
                }}
              >
                {loading ? 'Đang tạo...' : 'Tạo danh mục'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/amenity-categories')}
                disabled={loading}
                sx={{
                  color: '#f44336',
                  borderColor: '#f44336',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  px: 2.5,
                  py: 0.7,
                  '&:hover': { borderColor: '#d32f2f', backgroundColor: '#ffebee' },
                  '&:disabled': { color: '#a9a9a9', borderColor: '#a9a9a9' },
                }}
              >
                Hủy
              </Button>
            </Box>
            {error && (
              <Typography color="error" mt={1}>
                {error}
              </Typography>
            )}
          </Box>
        </form>
      </Paper>
    </div>
  );
};

export default AddAmenityCategory;