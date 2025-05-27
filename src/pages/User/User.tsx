import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Typography,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";
import { Link } from "react-router-dom";
import InfoIcon from "@mui/icons-material/Info";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  role?: string;
}

const User: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    email: "",
    role: "",
  });
  const [addErrors, setAddErrors] = useState<ValidationErrors>({});

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get("http://localhost:3001/users");

        if (response.status === 200) {
          const data = response.data;

          let users: Employee[] = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data && Array.isArray(data.users)) {
            users = data.users;
          } else {
            throw new Error(
              "Định dạng dữ liệu không đúng: danh sách người dùng không phải là mảng"
            );
          }

          users = users.map((user) => ({
            id: user.id || 0,
            name: user.name || "Không xác định",
            email: user.email || "Không xác định",
            role: user.role || "Không xác định",
          }));

          setEmployees(users);
        } else {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
        setError(errorMessage);
        console.error("Lỗi khi tải danh sách nhân viên:", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const validateForm = (data: Omit<Employee, "id">): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Họ tên không được để trống";
    else if (data.name.length > 50)
      errors.name = "Họ tên không được vượt quá 50 ký tự";
    if (!data.email.trim()) errors.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = "Email không hợp lệ";
    if (!data.role) errors.role = "Vui lòng chọn vai trò";
    return errors;
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setAddErrors({});
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewEmployee({ name: "", email: "", role: "" });
    setAddErrors({});
  };

  const handleSaveNew = async () => {
    const errors = validateForm(newEmployee);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3001/users",
        newEmployee
      );
      if (response.status === 201) {
        const updatedResponse = await axios.get("http://localhost:3001/users");
        if (updatedResponse.status === 200) {
          const data = updatedResponse.data;
          let users: Employee[] = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data && Array.isArray(data.users)) {
            users = data.users;
          }
          users = users.map((user) => ({
            id: user.id || 0,
            name: user.name || "Không xác định",
            email: user.email || "Không xác định",
            role: user.role || "Không xác định",
          }));
          setEmployees(users);
        }
        setShowAddForm(false);
        setNewEmployee({ name: "", email: "", role: "" });
        setAddErrors({});
      } else {
        throw new Error("Không thể thêm nhân viên mới");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi thêm nhân viên";
      setError(errorMessage);
      console.error("Lỗi khi thêm nhân viên:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleSaveEdit = async (
    id: number,
    updatedEmployee: Omit<Employee, "id">
  ) => {
    const errors = validateForm(updatedEmployee);
    if (Object.keys(errors).length > 0) {
      // Ở đây không cần setErrors vì EditUserForm tự xử lý lỗi
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:3001/users/${id}`, {
        ...updatedEmployee,
        id,
      });

      if (response.status === 200) {
        const updatedResponse = await axios.get("http://localhost:3001/users");
        if (updatedResponse.status === 200) {
          const data = updatedResponse.data;
          let users: Employee[] = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data && Array.isArray(data.users)) {
            users = data.users;
          }
          users = users.map((user) => ({
            id: user.id || 0,
            name: user.name || "Không xác định",
            email: user.email || "Không xác định",
            role: user.role || "Không xác định",
          }));
          setEmployees(users);
        }
        setEditId(null);
      } else {
        throw new Error("Không thể cập nhật thông tin nhân viên");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật thông tin nhân viên";
      setError(errorMessage);
      console.error("Lỗi khi cập nhật nhân viên:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?");
    if (!confirm) return;

    setLoading(true);
    try {
      const response = await axios.delete(`http://localhost:3001/users/${id}`);

      if (response.status === 200) {
        const updatedResponse = await axios.get("http://localhost:3001/users");
        if (updatedResponse.status === 200) {
          const data = updatedResponse.data;
          let users: Employee[] = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data && Array.isArray(data.users)) {
            users = data.users;
          }
          users = users.map((user) => ({
            id: user.id || 0,
            name: user.name || "Không xác định",
            email: user.email || "Không xác định",
            role: user.role || "Không xác định",
          }));
          setEmployees(users);
        }
      } else {
        throw new Error("Không thể xóa nhân viên");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa nhân viên";
      setError(errorMessage);
      console.error("Lỗi khi xóa nhân viên:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý sự kiện cho TextField
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
    const errors = validateForm({ ...newEmployee, [name]: value });
    setAddErrors(errors);
  };

  // Hàm xử lý sự kiện cho Select
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setNewEmployee((prev) => ({ ...prev, role: value }));
    const errors = validateForm({ ...newEmployee, role: value });
    setAddErrors(errors);
  };

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      manager: "Quản lí",
      receptionist: "Lễ tân",
      accountant: "Kế toán",
      housekeeping: "Nhân viên dọn phòng",
    };

    return roleMap[role] || role; // Nếu không khớp thì hiển thị nguyên văn
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="table-wrapper">
      <div className="table-title">
        <div className="header-content">
          <h2>
            Employee <b>Details</b>
          </h2>
          <Link to={"add"}>
            <Button
              variant="contained"
              className="btn-add-new"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              disabled={loading || showAddForm}
            >
              Thêm mới
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách nhân viên...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="error-message">
          {error}
        </Typography>
      ) : employees.length === 0 ? (
        <Typography className="no-data">
          Không tìm thấy nhân viên nào.
        </Typography>
      ) : (
        <TableContainer component={Paper} className="table-container">
          <Table className="table">
            <TableHead>
              <TableRow>
                <TableCell>Họ Tên</TableCell>
                <TableCell>Địa Chỉ Email</TableCell>
                <TableCell>Vai Trò</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  {editId === employee.id ? (
                    <TableCell colSpan={4}>
                      <EditUserForm
                        employee={employee}
                        onSave={(updatedEmployee) =>
                          handleSaveEdit(employee.id, updatedEmployee)
                        }
                        onCancel={handleCancelEdit}
                      />
                    </TableCell>
                  ) : (
                    <>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{getRoleLabel(employee.role)}</TableCell>
                      <TableCell align="center">
                        {/* Xem thông tin nhân viên */}
                        <IconButton
                          className="action view"
                          title="Xem chi tiết"
                          component={Link}
                          to={`/users/${employee.id}`}
                        >
                          <InfoIcon />
                        </IconButton>

                        {/* Chỉnh sửa tài khoản / mật khẩu */}
                        <IconButton
                          className="action password"
                          title="Chỉnh sửa tài khoản / mật khẩu"
                          component={Link}
                          to={`/users/${employee.id}/edit-account`}
                        >
                          <ManageAccountsIcon />
                        </IconButton>

                        {/* Xóa */}
                        {employee.id !== currentUser.id && (
                          <IconButton
                            className="action delete"
                            title="Xóa"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {showAddForm && (
                <TableRow>
                  <TableCell>
                    <TextField
                      name="name"
                      value={newEmployee.name}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder="Họ Tên"
                      error={!!addErrors.name}
                      helperText={addErrors.name}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      name="email"
                      value={newEmployee.email}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder="Địa Chỉ Email"
                      error={!!addErrors.email}
                      helperText={addErrors.email}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      size="small"
                      error={!!addErrors.role}
                    >
                      <InputLabel>Vai Trò</InputLabel>
                      <Select
                        name="role"
                        value={newEmployee.role}
                        onChange={handleSelectChange}
                        label="Vai Trò"
                      >
                        <MenuItem value="manager">Quản lí</MenuItem>
                        <MenuItem value="receptionist">Lễ tân</MenuItem>
                        <MenuItem value="accountant">Kế toán</MenuItem>
                        <MenuItem value="housekeeping">
                          Nhân viên dọn phòng
                        </MenuItem>
                      </Select>
                      {addErrors.role && (
                        <Typography color="error" variant="caption">
                          {addErrors.role}
                        </Typography>
                      )}
                    </FormControl>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      className="action save"
                      title="Lưu"
                      onClick={handleSaveNew}
                    >
                      <CheckIcon style={{ color: "green" }} />
                    </IconButton>
                    <IconButton
                      className="action delete"
                      title="Hủy"
                      onClick={handleCancelAdd}
                    >
                      <DeleteIcon style={{ color: "red" }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

// Component con cho form chỉnh sửa
const EditUserForm: React.FC<{
  employee: Employee;
  onSave: (employee: Omit<Employee, "id">) => void;
  onCancel: () => void;
}> = ({ employee, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Employee, "id">>({
    name: employee.name,
    email: employee.email,
    role: employee.role,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (data: Omit<Employee, "id">): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Họ tên không được để trống";
    else if (data.name.length > 50)
      errors.name = "Họ tên không được vượt quá 50 ký tự";
    if (!data.email.trim()) errors.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = "Email không hợp lệ";
    if (!data.role) errors.role = "Vui lòng chọn vai trò";
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const newErrors = validateForm({ ...formData, [name]: value });
    setErrors(newErrors);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, role: value }));
    const newErrors = validateForm({ ...formData, role: value });
    setErrors(newErrors);
  };

  const handleSubmit = () => {
    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError(null);
    onSave(formData);
  };

  return (
    <Box sx={{ padding: 2, background: "#fff", borderRadius: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          label="Họ Tên"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          variant="outlined"
          size="small"
          required
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          variant="outlined"
          size="small"
          required
          error={!!errors.email}
          helperText={errors.email}
        />
        <FormControl
          variant="outlined"
          size="small"
          sx={{ minWidth: 120 }}
          error={!!errors.role}
        >
          <InputLabel>Vai Trò</InputLabel>
          <Select
            name="role"
            value={formData.role}
            onChange={handleSelectChange}
            label="Vai Trò"
          >
            <MenuItem value="Quản lí">Quản lí</MenuItem>
            <MenuItem value="Lễ tân">Lễ tân</MenuItem>
          </Select>
          {errors.role && (
            <Typography color="error" variant="caption">
              {errors.role}
            </Typography>
          )}
        </FormControl>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            className="action save"
            title="Lưu"
            onClick={handleSubmit}
            disabled={loading}
          >
            <CheckIcon style={{ color: "green" }} />
          </IconButton>
          <IconButton
            className="action delete"
            title="Hủy"
            onClick={onCancel}
            disabled={loading}
          >
            <DeleteIcon style={{ color: "red" }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default User;
