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
} from '@mui/material';
import axios from 'axios';
import '../../css/Client.css';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: string;
  country: string;
  company: string;
  cccdPassport: string;
  balance: string;
  issueDate: string;
  storageCount: string;
  storageStatus: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  country?: string;
  cccdPassport?: string;
  issueDate?: string;
  storageCount?: string;
  balance?: string;
  storageStatus?: string;
}

const AddClient: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    country: '',
    company: '',
    cccdPassport: '',
    balance: '0 đ',
    issueDate: '',
    storageCount: '0',
    storageStatus: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateForm = (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Họ tên không được để trống';
    else if (data.name.length > 50) errors.name = 'Họ tên không được vượt quá 50 ký tự';
    if (!data.email.trim()) errors.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email không hợp lệ';
    if (!data.phone.trim()) errors.phone = 'Số điện thoại không được để trống';
    else if (!/^\d{10,11}$/.test(data.phone)) errors.phone = 'Số điện thoại không hợp lệ';
    if (!data.address.trim()) errors.address = 'Địa chỉ không được để trống';
    if (!data.dob.trim()) errors.dob = 'Ngày sinh không được để trống';
    if (!data.gender) errors.gender = 'Vui lòng chọn giới tính';
    if (!data.country.trim()) errors.country = 'Quốc gia không được để trống';
    if (!data.cccdPassport.trim()) errors.cccdPassport = 'CCCD/Passport không được để trống';
    if (!data.issueDate.trim()) errors.issueDate = 'Ngày phát hành không được để trống';
    if (!data.storageStatus) errors.storageStatus = 'Vui lòng chọn tình trạng lưu trữ';
    if (data.storageCount && parseInt(data.storageCount) < 0)
      errors.storageCount = 'Số lần lưu trữ không được nhỏ hơn 0';
    if (data.balance) {
      const balanceValue = parseFloat(data.balance.replace(/[^0-9.-]+/g, ''));
      if (isNaN(balanceValue) || balanceValue < 0)
        errors.balance = 'Số dư hiện tại không hợp lệ';
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors(errors);
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value as string }));
      const errors = validateForm({ ...formData, [name]: value as string });
      setValidationErrors(errors);
    }
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/clients', {
        ...formData,
        bookings: [],
      });
      if (response.status === 201) {
        navigate('/client');
      } else {
        throw new Error('Không thể thêm khách hàng mới');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi thêm khách hàng';
      setError(errorMessage);
      console.error('Lỗi khi thêm khách hàng:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/client');
  };

  return (
    <div className="client-wrapper">
      <div className="client-title">
        <div className="header-content">
          <h2>
            Add New <b>Client</b>
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
              to="/client"
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
      ) : error ? (
        <Typography color="error" className="error-message">
          {error}
        </Typography>
      ) : (
        <div className="detail-container">
          <h3>Thông tin khách hàng</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Họ Tên"
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
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Số Điện Thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
              />
              <TextField
                label="Địa chỉ"
                name="address"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.address}
                helperText={validationErrors.address}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Ngày sinh"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!validationErrors.dob}
                helperText={validationErrors.dob}
              />
              <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.gender}>
                <InputLabel>Giới tính</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleSelectChange}
                  label="Giới tính"
                >
                  <MenuItem value="">Chọn giới tính</MenuItem>
                  <MenuItem value="Nam">Nam</MenuItem>
                  <MenuItem value="Nữ">Nữ</MenuItem>
                  <MenuItem value="Không xác định">Không xác định</MenuItem>
                </Select>
                {validationErrors.gender && (
                  <Typography color="error" variant="caption">
                    {validationErrors.gender}
                  </Typography>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Quốc gia"
                name="country"
                value={formData.country}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.country}
                helperText={validationErrors.country}
              />
              <TextField
                label="Công ty"
                name="company"
                value={formData.company}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>

          <h3>Thông tin lưu trữ</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="CCCD/Passport"
                name="cccdPassport"
                value={formData.cccdPassport}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.cccdPassport}
                helperText={validationErrors.cccdPassport}
              />
              <TextField
                label="Số dư hiện tại"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.balance}
                helperText={validationErrors.balance || 'Ví dụ: 1,500,000 đ'}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Ngày phát hành"
                name="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!validationErrors.issueDate}
                helperText={validationErrors.issueDate}
              />
              <TextField
                label="Số lần lưu trữ"
                name="storageCount"
                type="number"
                value={formData.storageCount}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.storageCount}
                helperText={validationErrors.storageCount}
                inputProps={{ min: 0 }}
              />
            </Box>
            <Box display="flex" gap={2}>
              <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.storageStatus}>
                <InputLabel>Tình trạng lưu trữ</InputLabel>
                <Select
                  name="storageStatus"
                  value={formData.storageStatus}
                  onChange={handleSelectChange}
                  label="Tình trạng lưu trữ"
                >
                  <MenuItem value="">Chọn tình trạng</MenuItem>
                  <MenuItem value="Hoàn tất">Hoàn tất</MenuItem>
                  <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
                  <MenuItem value="Chưa xử lý">Chưa xử lý</MenuItem>
                </Select>
                {validationErrors.storageStatus && (
                  <Typography color="error" variant="caption">
                    {validationErrors.storageStatus}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Box>
        </div>
      )}
    </div>
  );
};

export default AddClient;