import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import '../../css/CreateService.css';

interface ServiceCategoryInput {
  name: string;
  description: string;
}

interface ValidationErrors {
  [key: string]: string | undefined;
  name?: string;
  description?: string;
}

const AddServiceCategory: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ServiceCategoryInput>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const validateForm = (data: ServiceCategoryInput): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên danh mục không được để trống';
    else if (data.name.length > 255) errors.name = 'Tên danh mục không được vượt quá 255 ký tự';
    if (data.description && data.description.length > 1000) errors.description = 'Mô tả không được vượt quá 1000 ký tự';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors(errors);
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setSnackbarMessage('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setSnackbarOpen(true);
      setLoading(false);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/service-categories', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json();
        if (res.status === 422 && result.errors) {
          const formattedErrors: ValidationErrors = {};
          Object.keys(result.errors).forEach((key) => {
            formattedErrors[key] = result.errors[key][0];
          });
          setValidationErrors(formattedErrors);
        } else {
          throw new Error(result.message || `Lỗi tạo danh mục: ${res.status} ${res.statusText}`);
        }
        setLoading(false);
        return;
      }

      setSnackbarMessage('Tạo danh mục thành công!');
      setSnackbarOpen(true);
      setLoading(false);
      setTimeout(() => navigate('/service-categories'), 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Không thể tạo danh mục: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/service-categories');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
    <div className="add-service-category-wrapper">
      <div className="add-service-category-title">
        <div className="add-service-category-header-content">
          <h2>
            Create New <b>Service Category</b>
          </h2>
          <Box className="add-service-category-form-buttons">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Lưu
            </Button>
            <Button
              variant="outlined"
              className="add-service-category-btn-cancel"
              color="secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </Button>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="add-service-category-loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : error && Object.keys(validationErrors).length === 0 ? (
        <Typography color="error" className="add-service-category-error-message">
          {error}
        </Typography>
      ) : (
        <div className="add-service-category-detail-container">
          <h3>Thông tin danh mục</h3>
          <Box display="flex" flexDirection="column" gap={2}>
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
              rows={4}
              error={!!validationErrors.description}
              helperText={validationErrors.description}
            />
          </Box>
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes('thành công') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AddServiceCategory;
