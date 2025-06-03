import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/Promotion.css';
import api from '../../api/axios';

type DiscountType = 'percentage' | 'amount';

interface FormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
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
}

const AddPromotion: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    start_date: '',
    end_date: '',
    usage_limit: 0,
    used_count: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const fieldErrorMessages: { [key: string]: string } = {
    code: 'Mã khuyến mãi',
    description: 'Mô tả',
    discount_type: 'Loại giảm',
    discount_value: 'Giá trị giảm',
    start_date: 'Ngày bắt đầu',
    end_date: 'Ngày kết thúc',
    usage_limit: 'Giới hạn số lần dùng',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let updatedValue: string | number;
    if (name === 'discount_type') {
      updatedValue = value as DiscountType;
    } else if (name === 'discount_value' || name === 'usage_limit') {
      updatedValue = value === '' ? 0 : Number(value);
    } else {
      updatedValue = value;
    }
    setFormData({
      ...formData,
      [name]: updatedValue,
    });
  };

  const validateForm = (data: FormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!data.code.trim()) errs.code = 'Mã CTKM không được để trống';
    else if (data.code.length > 20) errs.code = 'Mã CTKM không được vượt quá 20 ký tự';
    else if (!/^[A-Za-z0-9]+$/.test(data.code)) errs.code = 'Mã CTKM chỉ được chứa chữ cái và số';

    if (!data.description.trim()) errs.description = 'Mô tả không được để trống';
    else if (data.description.length > 200) errs.description = 'Mô tả không được vượt quá 200 ký tự';

    if (!data.discount_type) errs.discount_type = 'Vui lòng chọn loại giảm';

    if (isNaN(data.discount_value) || data.discount_value <= 0) errs.discount_value = 'Giá trị giảm phải là số lớn hơn 0';
    else if (data.discount_type === 'percentage' && data.discount_value > 100) {
      errs.discount_value = 'Giá trị giảm không được vượt quá 100%';
    }

    if (!data.start_date) errs.start_date = 'Ngày bắt đầu không được để trống';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.start_date)) errs.start_date = 'Ngày bắt đầu không đúng định dạng YYYY-MM-DD';
    else if (data.start_date < today) errs.start_date = 'Ngày bắt đầu không được nhỏ hơn ngày hiện tại';

    if (!data.end_date) errs.end_date = 'Ngày kết thúc không được để trống';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.end_date)) errs.end_date = 'Ngày kết thúc không đúng định dạng YYYY-MM-DD';
    else if (data.start_date && data.end_date && data.start_date > data.end_date) {
      errs.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (data.usage_limit === undefined || isNaN(data.usage_limit)) errs.usage_limit = 'Giới hạn số lần dùng không được để trống';
    else if (data.usage_limit < 0) errs.usage_limit = 'Giới hạn số lần dùng không được âm';

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
        discount_type: formData.discount_type === 'percentage' ? 'percent' : 'amount',
        used_count: 0,
        is_active: true,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };
      console.log('Data sent to API:', dataToSend);
      const response = await api.post('/promotions', dataToSend);
      console.log('API response:', response);
      if (response.status === 201) {
        setSnackbarMessage('Thêm khuyến mãi thành công!');
        setSnackbarOpen(true);
        setTimeout(() => navigate('/promotions'), 1000);
      } else {
        throw new Error('Không thể thêm khuyến mãi mới');
      }
    } catch (err: unknown) {
      let errorMessage = 'Đã xảy ra lỗi khi thêm khuyến mãi';
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
      console.error('Lỗi khi thêm khuyến mãi:', err);
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
        <div className="header-content">
          <h2>
            Add New <b>Promotion</b>
          </h2>
          <Box>
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
              color="secondary"
              onClick={handleCancel}
              disabled={loading}
              component={Link}
              to="/promotions"
              sx={{
                color: 'error.main',
                borderColor: 'error.main',
                '&:hover': {
                  color: 'error.main',
                  borderColor: 'error.main',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Hủy
            </Button>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : (
        <div className="detail-container">
          <h3>Thông tin khuyến mãi</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Mã CTKM"
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
                label="Mô tả chi tiết"
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
              <TextField
                label="Loại giảm"
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                select
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.discount_type}
                helperText={validationErrors.discount_type}
              >
                <MenuItem value="percentage">Phần trăm (%)</MenuItem>
                <MenuItem value="amount">Số tiền (VNĐ)</MenuItem>
              </TextField>
              <TextField
                label="Giá trị giảm"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                type="number"
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
                value={formData.usage_limit}
                onChange={handleChange}
                type="number"
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.usage_limit}
                helperText={validationErrors.usage_limit}
              />
            </Box>
          </Box>
        </div>
      )}

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

export default AddPromotion;