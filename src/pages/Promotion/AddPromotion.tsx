import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  Box,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import '../../css/Promotion.css';
import api from '../../api/axios';

type DiscountType = 'percent' | 'amount';

interface PromotionFormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

interface ValidationErrors {
  code?: string;
  description?: string;
  discount_type?: string;
  discount_value?: string;
  start_date?: string;
  end_date?: string;
  usage_limit?: string;
  used_count?: string;
}

const AddPromotion: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PromotionFormData>({
    code: '',
    description: '',
    discount_type: 'amount',
    discount_value: 0,
    start_date: '',
    end_date: '',
    usage_limit: null,
    used_count: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const validateForm = (data: PromotionFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code.trim()) errors.code = 'Mã CTKM không được để trống';
    else if (data.code.length > 20) errors.code = 'Mã CTKM không được vượt quá 20 ký tự';
    if (!data.description.trim()) errors.description = 'Mô tả không được để trống';
    else if (data.description.length > 200) errors.description = 'Mô tả không được vượt quá 200 ký tự';
    if (!data.discount_type) errors.discount_type = 'Vui lòng chọn loại giảm';
    if (data.discount_value <= 0) errors.discount_value = 'Giá trị giảm phải lớn hơn 0';
    else if (data.discount_type === 'percent' && data.discount_value > 100) {
      errors.discount_value = 'Giá trị giảm không được vượt quá 100%';
    }
    if (!data.start_date) errors.start_date = 'Ngày bắt đầu không được để trống';
    if (!data.end_date) errors.end_date = 'Ngày kết thúc không được để trống';
    else if (data.start_date && data.end_date && data.start_date > data.end_date) {
      errors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (data.usage_limit !== null && data.usage_limit < 0) errors.usage_limit = 'Giới hạn số lần dùng không được âm';
    if (data.used_count < 0) errors.used_count = 'Số lần đã dùng không được âm';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'discount_value' || name === 'used_count' ? Number(value) : name === 'usage_limit' ? (value ? Number(value) : null) : value,
    }));
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors(errors);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      const errors = validateForm({ ...formData, [name]: value });
      setValidationErrors(errors);
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, is_active: e.target.checked }));
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/promotions', formData);
      if (response.status === 201) {
        setSnackbarMessage('Thêm khuyến mãi thành công!');
        setSnackbarOpen(true);
        setTimeout(() => navigate('/promotions'), 2000);
      } else {
        throw new Error('Không thể thêm khuyến mãi mới');
      }
    } catch (err: unknown) {
      let errorMessage = 'Đã xảy ra lỗi khi thêm khuyến mãi';
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
    navigate('/promotions');
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
            Add New <b>Promotion</b>
          </h2>
          <Box className="promotion-form-buttons">
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
              className='promotion-btn-cancel'
              color="secondary"
              onClick={handleCancel}
              disabled={loading}
              component={Link}
              to="/promotions"
            >
              Hủy
            </Button>
          </Box>
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
          <h3>Thông tin khuyến mãi</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Mã khuyến mãi"
                name="code"
                value={formData.code}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.code}
                helperText={validationErrors.code}
              />
              <TextField
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.description}
                helperText={validationErrors.description}
              />
            </Box>
            <Box display="flex" gap={2}>
              <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.discount_type}>
                <InputLabel>Loại giảm</InputLabel>
                <Select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleSelectChange}
                  label="Loại giảm"
                >
                  <MenuItem value="percent">Phần trăm (%)</MenuItem>
                  <MenuItem value="amount">Số tiền (VNĐ)</MenuItem>
                </Select>
                {validationErrors.discount_type && (
                  <Typography color="error" variant="caption">
                    {validationErrors.discount_type}
                  </Typography>
                )}
              </FormControl>
              <TextField
                label="Giá trị giảm"
                name="discount_value"
                type="number"
                value={formData.discount_value}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.discount_value}
                helperText={validationErrors.discount_value}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Ngày bắt đầu"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!validationErrors.start_date}
                helperText={validationErrors.start_date}
              />
              <TextField
                label="Ngày kết thúc"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!validationErrors.end_date}
                helperText={validationErrors.end_date}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Giới hạn số lần dùng"
                name="usage_limit"
                type="number"
                value={formData.usage_limit ?? ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.usage_limit}
                helperText={validationErrors.usage_limit || 'Để trống nếu không giới hạn'}
              />
              <TextField
                label="Số lần đã dùng"
                name="used_count"
                type="number"
                value={formData.used_count}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.used_count}
                helperText={validationErrors.used_count}
              />
            </Box>
            <Box display="flex" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Kích hoạt"
              />
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

export default AddPromotion;