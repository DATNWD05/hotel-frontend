import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import '../../css/Promotion.css';
import api from '../../api/axios';

interface DepartmentFormData {
  name: string;
}

interface ValidationErrors {
  name?: string;
}

const AddDepartment: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const validateForm = (data: DepartmentFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên phòng ban không được để trống';
    else if (data.name.length > 100) errors.name = 'Tên phòng ban không được vượt quá 100 ký tự';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    try {
      const response = await api.post('/departments', formData);
      if (response.status === 201) {
        setSnackbarMessage('Thêm phòng ban thành công!');
        setSnackbarOpen(true);
        setTimeout(() => navigate('/departments'), 2000);
      } else {
        throw new Error('Không thể thêm phòng ban mới');
      }
    } catch (err: unknown) {
      let errorMessage = 'Đã xảy ra lỗi khi thêm phòng ban';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; errors?: { [key: string]: string[] } } } };
        errorMessage =
          axiosError.response?.data?.message ||
          JSON.stringify(axiosError.response?.data?.errors) ||
          errorMessage;
      }
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/departments');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Thêm mới <b>Phòng ban</b>
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="promotion-loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotion-error-message">
          {error}
        </Typography>
      ) : (
        <div className="promotion-detail-container">
          <h3>Thông tin phòng ban</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Tên phòng ban"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              size="small"
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#ccc" },
                  "&:hover fieldset": { borderColor: "#888" },
                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                },
                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                "& label.Mui-focused": { color: "#1976d2" },
              }}
            />
            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
                sx={{
                  backgroundColor: "#4318FF",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "8px",
                  px: 2.5,
                  py: 0.7,
                  "&:hover": { backgroundColor: "#7B1FA2" },
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Lưu"}
              </Button>
              <Button
                variant="outlined"
                className="promotion-btn-cancel"
                color="secondary"
                onClick={handleCancel}
                disabled={loading}
                component={Link}
                to="/departments"
                sx={{
                  borderColor: "#d32f2f",
                  color: "#d32f2f",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "8px",
                  px: 2.5,
                  py: 0.7,
                  "&:hover": { borderColor: "#b71c1c", backgroundColor: "#ffebee" },
                }}
              >
                Hủy
              </Button>
            </Box>
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

export default AddDepartment;