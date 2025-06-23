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
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import axios from "axios";
import "../../css/User.css";

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

interface Department {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
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

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  useEffect(() => {
    api.get("/departments")
      .then((res) => setDepartments(res.data.data))
      .catch(() => setError("Không thể tải danh sách phòng ban"));

    api.get("/role")
      .then((res) => {
        console.log("Role API response:", res.data);
        setRoles(res.data.roles);
      })
      .catch(() => setError("Không thể tải danh sách vai trò"));
  }, []);

  const validateForm = (data: FormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.name.trim()) errs.name = "Họ tên không được để trống";
    else if (data.name.length > 100)
      errs.name = "Tên không được dài quá 100 ký tự";
    if (!data.email.trim()) errs.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Email không hợp lệ";
    if (!data.phone.trim()) errs.phone = "Số điện thoại không được để trống";
    else if (data.phone.length > 20)
      errs.phone = "Số điện thoại không được vượt quá 20 ký tự";
    if (!data.address.trim()) errs.address = "Địa chỉ không được để trống";
    else if (data.address.length > 255)
      errs.address = "Địa chỉ không được vượt quá 255 ký tự";
    if (!data.birthday) errs.birthday = "Ngày sinh không được để trống";
    else {
      const date = new Date(data.birthday);
      if (isNaN(date.getTime()))
        errs.birthday = "Ngày sinh không đúng định dạng";
    }
    if (!data.hire_date) errs.hire_date = "Ngày vào làm không được để trống";
    else {
      const hireDate = new Date(data.hire_date);
      if (isNaN(hireDate.getTime()))
        errs.hire_date = "Ngày vào làm không đúng định dạng";
    }
    if (!data.status) errs.status = "Vui lòng chọn trạng thái";
    else if (!["active", "not_active", "pending"].includes(data.status))
      errs.status = "Trạng thái không hợp lệ";
    if (!data.role_id) {
      errs.role_id = "Vui lòng chọn vai trò";
    } else if (!roles.some((r) => String(r.id) === data.role_id)) {
      errs.role_id = "Vai trò không hợp lệ";
    }
    if (!data.password.trim()) errs.password = "Mật khẩu không được để trống";
    if (!data.cccd.trim()) errs.cccd = "CCCD không được để trống";
    else if (!/^[0-9]+$/.test(data.cccd))
      errs.cccd = "CCCD chỉ được chứa các chữ số";
    else if (data.cccd.length < 10)
      errs.cccd = "CCCD phải có ít nhất 10 chữ số";
    else if (data.cccd.length > 12)
      errs.cccd = "CCCD không được vượt quá 12 chữ số";
    if (!data.gender) errs.gender = "Vui lòng chọn giới tính";
    else if (!["Nam", "Nữ", "Khác"].includes(data.gender))
      errs.gender = "Giới tính không hợp lệ";
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
      const payload = {
        ...formData,
        department_id: formData.department_id
          ? Number(formData.department_id)
          : null,
        role_id: Number(formData.role_id),
      };
      console.log("Dữ liệu gửi lên:", payload);
      const response = await api.post("/users", payload);
      if (response.status === 201) {
        setSnackbarMessage("Thêm nhân viên thành công!");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/user"), 2000);
      } else {
        throw new Error("Thêm nhân viên thất bại");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.errors) {
        const serverErrors = err.response.data.errors as Record<
          string,
          string[]
        >;
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

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const statusOptions = [
    { value: "active", label: "Hoạt động" },
    { value: "not_active", label: "Nghỉ việc" },
    { value: "pending", label: "Chờ xử lý" },
  ];

  return (
    <div className="user-wrapper">
      <div className="user-title">
        <div className="user-header-content">
          <h2>
            Add New <b>User</b>
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="user-loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : (
        <div className="user-detail-container">
          <h3>Thông tin nhân viên</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Họ tên"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.name}
                helperText={errors.name}
              />
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.email}
                helperText={errors.email}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.phone}
                helperText={errors.phone}
              />
              <TextField
                label="Ngày sinh"
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.birthday}
                helperText={errors.birthday}
              />
            </Box>
            <Box display="flex" gap={2}>
              <FormControl
                fullWidth
                variant="outlined"
                error={!!errors.gender}
                size="small"
              >
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
                  <Typography color="error" variant="caption">
                    {errors.gender}
                  </Typography>
                )}
              </FormControl>
              <TextField
                label="CCCD"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.cccd}
                helperText={errors.cccd}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Địa chỉ"
                name="address"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={2}
                error={!!errors.address}
                helperText={errors.address}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Ngày vào làm"
                name="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.hire_date}
                helperText={errors.hire_date}
              />
              <FormControl
                fullWidth
                variant="outlined"
                error={!!errors.department_id}
                size="small"
              >
                <InputLabel>Phòng ban</InputLabel>
                <Select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleSelectChange}
                  label="Phòng ban"
                >
                  <MenuItem value="">-- Không chọn --</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.department_id && (
                  <Typography color="error" variant="caption">
                    {errors.department_id}
                  </Typography>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <FormControl
                fullWidth
                variant="outlined"
                error={!!errors.status}
                size="small"
              >
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Trạng thái"
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.status && (
                  <Typography color="error" variant="caption">
                    {errors.status}
                  </Typography>
                )}
              </FormControl>
              <FormControl
                fullWidth
                variant="outlined"
                error={!!errors.role_id}
                size="small"
              >
                <InputLabel>Vai trò</InputLabel>
                <Select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleSelectChange}
                  label="Vai trò"
                >
                  <MenuItem value="">-- Không chọn --</MenuItem>
                  {Array.isArray(roles) &&
                    roles.map((role) => (
                      <MenuItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </MenuItem>
                    ))}
                </Select>
                {errors.role_id && (
                  <Typography color="error" variant="caption">
                    {errors.role_id}
                  </Typography>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Mật khẩu"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.password}
                helperText={errors.password}
              />
            </Box>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Lưu"}
              </Button>
              <Button
                variant="outlined"
                className="user-btn-cancel"
                color="secondary"
                onClick={handleCancel}
                disabled={loading}
                component={Link}
                to="/user"
              >
                Hủy
              </Button>
            </Box>
          </Box>
          {error && (
            <Typography color="error" className="user-error-message" mt={2}>
              {error}
            </Typography>
          )}
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes("thành công") ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AddUser;