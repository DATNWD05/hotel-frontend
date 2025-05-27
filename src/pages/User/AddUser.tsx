import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface FormData {
  MaNV: string;
  name: string;
  email: string;
  birthday: string;
  phone: string;
  address: string;
  hire_date: string;
  department_id: string;
  status: string;
  password: string;
  role: string;
  cccd: string;
  gender: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    MaNV: '',
    name: '',
    email: '',
    birthday: '',
    phone: '',
    address: '',
    hire_date: '',
    department_id: '',
    status: '',
    password: '',
    role: '',
    cccd: '',
    gender: '',
  });

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    // Giả lập call API phòng ban
    axios.get('http://localhost:3001/departments').then((res) => {
      setDepartments(res.data);
    });
  }, []);

  const validateForm = (data: FormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.MaNV.trim()) errs.MaNV = 'Mã nhân viên không được để trống';
    if (!data.name.trim()) errs.name = 'Họ tên không được để trống';
    if (!data.email.trim()) errs.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email không hợp lệ';
    if (!data.phone.trim()) errs.phone = 'Số điện thoại không được để trống';
    if (!data.address.trim()) errs.address = 'Địa chỉ không được để trống';
    if (!data.birthday) errs.birthday = 'Ngày sinh không được để trống';
    if (!data.hire_date) errs.hire_date = 'Ngày vào làm không được để trống';
    if (!data.department_id) errs.department_id = 'Vui lòng chọn phòng ban';
    if (!data.status) errs.status = 'Vui lòng chọn trạng thái';
    if (!data.role) errs.role = 'Vui lòng chọn vai trò';
    if (!data.password.trim()) errs.password = 'Mật khẩu không được để trống';
    if (!data.cccd.trim()) errs.cccd = 'CCCD không được để trống';
    if (!data.gender) errs.gender = 'Vui lòng chọn giới tính';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
  const { name, value } = e.target;
  if (name) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }
};


  const handleSave = async () => {
    const validation = validateForm(formData);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/users', formData);
      if (res.status === 201) navigate('/user');
      else throw new Error('Thêm nhân viên thất bại');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/user');

  return (
  <div className="user-form-wrapper">
    <div className="user-form-header">
      <Typography variant="h5" mb={2}>Thêm Nhân Viên Mới</Typography>
    </div>

    {loading ? (
      <Box display="flex" alignItems="center" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    ) : (
      <Box className="user-form-body" display="flex" flexDirection="column" gap={4}>
        {/* Thông tin cá nhân */}
        <Box>
          <Typography variant="h6" fontWeight="bold" mb={1}>Thông tin cá nhân</Typography>
          <Box display="flex" gap={2}>
            <TextField
              label="Mã NV"
              name="MaNV"
              value={formData.MaNV}
              onChange={handleChange}
              fullWidth
              error={!!errors.MaNV}
              helperText={errors.MaNV}
            />
            <TextField
              label="Họ tên"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
            />
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              label="Số điện thoại"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="Ngày sinh"
              name="birthday"
              type="date"
              value={formData.birthday}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!errors.birthday}
              helperText={errors.birthday}
            />
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Giới tính</InputLabel>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleSelectChange}
                label="Giới tính"
              >
                <MenuItem value="Nam">Nam</MenuItem>
                <MenuItem value="Nữ">Nữ</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </Select>
              {errors.gender && (
                <Typography color="error" variant="caption">{errors.gender}</Typography>
              )}
            </FormControl>
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="Địa chỉ"
              name="address"
              value={formData.address}
              onChange={handleChange}
              fullWidth
              error={!!errors.address}
              helperText={errors.address}
            />
            <TextField
              label="CCCD"
              name="cccd"
              value={formData.cccd}
              onChange={handleChange}
              fullWidth
              error={!!errors.cccd}
              helperText={errors.cccd}
            />
          </Box>
        </Box>

        {/* Thông tin công việc */}
        <Box>
          <Typography variant="h6" fontWeight="bold" mb={1}>Thông tin công việc</Typography>
          <Box display="flex" gap={2}>
            <TextField
              label="Ngày vào làm"
              name="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!errors.hire_date}
              helperText={errors.hire_date}
            />
            <FormControl fullWidth error={!!errors.department_id}>
              <InputLabel>Phòng ban</InputLabel>
              <Select
                name="department_id"
                value={formData.department_id}
                onChange={handleSelectChange}
                label="Phòng ban"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
              {errors.department_id && (
                <Typography color="error" variant="caption">{errors.department_id}</Typography>
              )}
            </FormControl>
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                label="Trạng thái"
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Nghỉ việc</MenuItem>
                <MenuItem value="pending">Chờ xử lý</MenuItem>
              </Select>
              {errors.status && (
                <Typography color="error" variant="caption">{errors.status}</Typography>
              )}
            </FormControl>
            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleSelectChange}
                label="Vai trò"
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Lễ tân">Lễ tân</MenuItem>
                <MenuItem value="Kế toán">Kế toán</MenuItem>
              </Select>
              {errors.role && (
                <Typography color="error" variant="caption">{errors.role}</Typography>
              )}
            </FormControl>
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              error={!!errors.password}
              helperText={errors.password}
            />
          </Box>
        </Box>

        {/* Nút lưu/hủy */}
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="contained" color="primary" onClick={handleSave}>Lưu</Button>
          <Button variant="outlined" color="secondary" onClick={handleCancel}>Hủy</Button>
        </Box>
      </Box>
    )}

    {error && (
      <Typography color="error" mt={3}>
        {error}
      </Typography>
    )}
  </div>
);
};

export default AddUser;
