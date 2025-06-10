import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../../css/Role.css'; // Tạo file CSS tương tự
import api from '../../api/axios';

interface RoleFormData {
  name: string;
  description: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

const AddRole: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const fieldErrorMessages: { [key: string]: string } = {
    name: 'Tên vai trò',
    description: 'Mô tả',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value,
    });
  };

  const validateForm = (data: RoleFormData): ValidationErrors => {
    const errs: ValidationErrors = {};

    if (!data.name.trim()) errs.name = 'Tên vai trò không được để trống';
    else if (data.name.length > 30) errs.name = 'Tên vai trò không được vượt quá 30 ký tự';

    if (data.description.length > 255) errs.description = 'Mô tả không được vượt quá 255 ký tự';

    return errs;
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
      };
      console.log('Data sent to API:', dataToSend);
      const response = await api.post('/role', dataToSend); // Sử dụng endpoint /role
      console.log('API response:', response);
      if (response.status === 201) {
        setSnackbarMessage('Thêm vai trò thành công!');
        setSnackbarOpen(true);
        setTimeout(() => navigate('/role'), 1000); // Điều hướng về danh sách vai trò
      } else {
        throw new Error('Không thể thêm vai trò mới');
      }
    } catch (err: unknown) {
      let errorMessage = 'Đã xảy ra lỗi khi thêm vai trò';
      if (err instanceof Error) {
        errorMessage = `Lỗi: ${err.message}`;
      }
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; errors?: { [key: string]: string[] } } } };
        if (axiosError.response?.data?.message) {
          errorMessage = `Lỗi: ${axiosError.response.data.message}`;
        } else if (axiosError.response?.data?.errors) {
          const errors = axiosError.response.data.errors;
          errorMessage = Object.keys(errors)
            .map((key) => {
              const fieldName = fieldErrorMessages[key] || key;
              return `Lỗi: ${fieldName} ${errors[key].join(', ')}`;
            })
            .join('; ');
        }
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error('Lỗi khi thêm vai trò:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/roles'); // Điều hướng về danh sách vai trò
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
    <div className="role-wrapper">
      <div className="header-content">
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          sx={{ width: 300, mb: 2 }}
        />
      </div>
      <div className="role-title">
        <Typography variant="h5" color="primary">
          Thêm Vai Trò Mới
        </Typography>
      </div>
      <Box
        component="form"
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: 1,
          backgroundColor: '#fff',
          maxWidth: 600,
          mx: 'auto',
        }}
      >
        {loading ? (
          <div className="loading-container">
            <CircularProgress />
            <Typography>Đang xử lý...</Typography>
          </div>
        ) : (
          <>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Tên vai trò"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.name}
                helperText={validationErrors.name}
              />
            </Box>
            <Box display="flex" gap={2} mb={2}>
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
              />
            </Box>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
                sx={{
                  backgroundColor: '#007bff',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '8px 16px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#0056b3',
                  },
                }}
              >
                Lưu
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancel}
                disabled={loading}
                sx={{
                  color: '#dc3545',
                  borderColor: '#dc3545',
                  borderRadius: 8,
                  padding: '8px 16px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  },
                }}
              >
                Hủy
              </Button>
            </Box>
          </>
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
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

export default AddRole;