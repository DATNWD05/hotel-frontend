import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SelectChangeEvent } from "@mui/material/Select";
import "../../css/User.css";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";
import axios from "axios";

interface UserForm {
  id: string;
  name: string;
  email: string;
  phone: string;
  hire_date: string;
  department_id: string;
  status: string;
  password: string;
  role: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserForm>({
    id: "",
    name: "",
    email: "",
    phone: "",
    hire_date: "",
    department_id: "",
    status: "",
    password: "",
    role: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value as string }));
    }
  };

  const generateEmployeeId = async (role: string) => {
    const prefixMap: Record<string, string> = {
      manager: "QL",
      receptionist: "LT",
      accountant: "KT",
      housekeeping: "DP",
    };

    const prefix = prefixMap[role] || "NV";

    try {
      const response = await axios.get(
        `http://localhost:3001/users?role=${role}`
      );
      const count = response.data.length + 1;
      const newId = `${prefix}${String(count).padStart(3, "0")}`;
      setFormData((prev) => ({
        ...prev,
        id: newId,
      }));
    } catch (error) {
      console.error("Lỗi khi tạo mã nhân viên:", error);
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name!]: value }));

    if (name === "role") {
      generateEmployeeId(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:3001/usersss",
        formData
      );
      if (response.status === 201 || response.status === 200) {
        navigate("/user");
      } else {
        throw new Error("Failed to add new user");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while adding user";
      setError(errorMessage);
      console.error("Error adding user:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7ff",
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 1000,
          padding: 7,
          borderRadius: 4,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Thêm người dùng mới
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {/* Cột 1 */}
            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Mã nhân viên"
                name="id"
                value={formData.id}
                fullWidth
                required
                margin="normal"
                disabled
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Ngày tuyển dụng"
                name="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth required margin="normal">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Trạng thái"
                >
                  <MenuItem value="active">Đang làm</MenuItem>
                  <MenuItem value="inactive">Nghỉ việc</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Cột 2 */}
            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Họ Tên"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth required margin="normal">
                <InputLabel>Phòng ban</InputLabel>
                <Select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleSelectChange}
                  label="Phòng ban"
                >
                  <MenuItem value="1">Kế toán</MenuItem>
                  <MenuItem value="2">Lễ tân</MenuItem>
                  <MenuItem value="3">Dọn phòng</MenuItem>
                  <MenuItem value="4">Quản lý</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Mật khẩu"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth required margin="normal">
                <InputLabel>Vai Trò</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleSelectChange}
                  label="Vai Trò"
                >
                  <MenuItem value="manager">Quản lí</MenuItem>
                  <MenuItem value="receptionist">Lễ tân</MenuItem>
                  <MenuItem value="accountant">Kế toán</MenuItem>
                  <MenuItem value="housekeeping">Nhân viên dọn phòng</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box
            mt={3}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              sx={{
                color: "#1a1a1a",
                borderColor: "#aaa",
                fontWeight: 600,
                textTransform: "none",
                px: 3,
              }}
              onClick={() => navigate("/user")}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Lưu
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddUser;
