import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import '../../css/AddDepartment.css';
import api from '../../api/axios';
import { toast } from 'react-toastify';

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
      toast.error("Vui lòng kiểm tra và sửa các lỗi trong biểu mẫu");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/departments', formData);
      if (response.status === 201) {
        toast.success('Thêm phòng ban thành công!');
        setTimeout(() => navigate('/departments'), 2000);
      } else {
        throw new Error('Không thể thêm phòng ban mới');
      }
    } catch (err: unknown) {
      let errorMessage = 'Không thể thêm phòng ban';
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
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/departments');
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
                className="add-department-btn-save"
                onClick={handleSave}
                disabled={loading}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#4318F5",
                  "&:hover": {
                    bgcolor: "#7B1FA2",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Lưu"}
              </Button>
              <Button
                className="add-department-btn-cancel"
                onClick={handleCancel}
                disabled={loading}
                component={Link}
                to="/departments"
                variant="outlined"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  borderColor: "#e0e0e0",
                  color: "#424242",
                  "&:hover": {
                    borderColor: "#888",
                    bgcolor: "#f5f5f5",
                  },
                }}
              >
                Hủy
              </Button>
            </Box>
          </Box>
        </div>
      )}
    </div>
  );
};

export default AddDepartment;