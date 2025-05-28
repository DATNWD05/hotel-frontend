import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import axios from "axios";

interface FormData {
  name: string;
  email: string;
  birthday: string;
  phone: string;
  address: string;
  hire_date: string;
  department_id: string;
  status: string;
  password: string;
  role_id: string;
  cccd: string;
  gender: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    birthday: "",
    phone: "",
    address: "",
    hire_date: "",
    department_id: "",
    status: "",
    password: "",
    role_id: "",
    cccd: "",
    gender: "",
  });

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    api.get("/departments")
      .then((res) => {
        setDepartments(res.data.data);
      })
      .catch(() => setError("Không thể tải danh sách phòng ban"));
  }, []);

  const validateForm = (data: FormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.name.trim()) errs.name = "Họ tên không được để trống";
    if (!data.email.trim()) errs.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Email không hợp lệ";
    if (!data.phone.trim()) errs.phone = "Số điện thoại không được để trống";
    if (!data.address.trim()) errs.address = "Địa chỉ không được để trống";
    if (!data.birthday) errs.birthday = "Ngày sinh không được để trống";
    if (!data.hire_date) errs.hire_date = "Ngày vào làm không được để trống";
    if (!data.status) errs.status = "Vui lòng chọn trạng thái";
    if (!data.role_id) errs.role_id = "Vui lòng chọn vai trò";
    if (!data.password.trim()) errs.password = "Mật khẩu không được để trống";
    if (!data.cccd.trim()) errs.cccd = "CCCD không được để trống";
    if (!data.gender) errs.gender = "Vui lòng chọn giới tính";
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
      const response = await api.post("/users", formData);
      if (response.status === 201) {
        navigate("/user");
      } else {
        throw new Error("Thêm nhân viên thất bại");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.errors) {
        const serverErrors = err.response.data.errors as Record<string, string[]>;
        const formattedErrors: ValidationErrors = {};
        Object.keys(serverErrors).forEach((key) => {
          formattedErrors[key] = serverErrors[key][0];
        });
        setErrors(formattedErrors);
      } else {
        const msg = err instanceof Error ? err.message : "Lỗi không xác định";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/user");

  const roleOptions = [
    { id: "1", label: "Admin" },
    { id: "2", label: "Lễ tân" },
    { id: "3", label: "Kế toán" },
  ];

  const statusOptions = [
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Nghỉ việc" },
    { value: "pending", label: "Chờ xử lý" },
  ];

  return (
    <div className="user-form-wrapper">
      <Typography variant="h5" mb={2}>Thêm Nhân Viên Mới</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" gap={2}>
            <TextField label="Họ tên" name="name" value={formData.name} onChange={handleChange} fullWidth error={!!errors.name} helperText={errors.name} />
            <TextField label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth error={!!errors.email} helperText={errors.email} />
          </Box>
          <Box display="flex" gap={2}>
            <TextField label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} fullWidth error={!!errors.phone} helperText={errors.phone} />
            <TextField label="Ngày sinh" name="birthday" type="date" value={formData.birthday} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth error={!!errors.birthday} helperText={errors.birthday} />
          </Box>
          <Box display="flex" gap={2}>
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Giới tính</InputLabel>
              <Select name="gender" value={formData.gender} onChange={handleSelectChange} label="Giới tính">
                <MenuItem value="Nam">Nam</MenuItem>
                <MenuItem value="Nữ">Nữ</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </Select>
            </FormControl>
            <TextField label="CCCD" name="cccd" value={formData.cccd} onChange={handleChange} fullWidth error={!!errors.cccd} helperText={errors.cccd} />
          </Box>
          <TextField label="Địa chỉ" name="address" value={formData.address} onChange={handleChange} fullWidth error={!!errors.address} helperText={errors.address} />

          <Box display="flex" gap={2}>
            <TextField label="Ngày vào làm" name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth error={!!errors.hire_date} helperText={errors.hire_date} />
            <FormControl fullWidth error={!!errors.department_id}>
              <InputLabel>Phòng ban</InputLabel>
              <Select name="department_id" value={formData.department_id} onChange={handleSelectChange} label="Phòng ban">
                <MenuItem value="">-- Không chọn --</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={String(dept.id)}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box display="flex" gap={2}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Trạng thái</InputLabel>
              <Select name="status" value={formData.status} onChange={handleSelectChange} label="Trạng thái">
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth error={!!errors.role_id}>
              <InputLabel>Vai trò</InputLabel>
              <Select name="role_id" value={formData.role_id} onChange={handleSelectChange} label="Vai trò">
                {roleOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField label="Mật khẩu" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth error={!!errors.password} helperText={errors.password} />

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="contained" color="primary" onClick={handleSave}>Lưu</Button>
            <Button variant="contained" color="error" onClick={handleCancel}>Hủy</Button>
          </Box>
        </Box>
      )}

      {error && <Typography color="error" mt={3}>{error}</Typography>}
    </div>
  );
};

export default AddUser;
