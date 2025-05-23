import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import axios from 'axios';

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
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
    name: '',
    email: '',
    role: '',
  });
  const [addErrors, setAddErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('http://localhost:3001/users');

        if (response.status === 200) {
          const data = response.data;

          let users: Employee[] = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data && Array.isArray(data.users)) {
            users = data.users;
          } else {
            throw new Error('Định dạng dữ liệu không đúng: danh sách người dùng không phải là mảng');
          }

          users = users.map((user) => ({
            id: user.id || 0,
            name: user.name || 'Không xác định',
            email: user.email || 'Không xác định',
            role: user.role || 'Không xác định',
          }));

          setEmployees(users);
        } else {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
        setError(errorMessage);
        console.error('Lỗi khi tải danh sách nhân viên:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const validateForm = (data: Omit<Employee, 'id'>): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Họ tên không được để trống';
    else if (data.name.length > 50) errors.name = 'Họ tên không được vượt quá 50 ký tự';
    if (!data.email.trim()) errors.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email không hợp lệ';
    if (!data.role) errors.role = 'Vui lòng chọn vai trò';
    return errors;
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setAddErrors({});
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewEmployee({ name: '', email: '', role: '' });
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
      const response = await axios.post('http://localhost:3001/users', newEmployee);
      if (response.status === 201) {
        const updatedResponse = await axios.get('http://localhost:3001/users');
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
            name: user.name || 'Không xác định',
            email: user.email || 'Không xác định',
            role: user.role || 'Không xác định',
          }));
          setEmployees(users);
        }
        setShowAddForm(false);
        setNewEmployee({ name: '', email: '', role: '' });
        setAddErrors({});
      } else {
        throw new Error('Không thể thêm nhân viên mới');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi thêm nhân viên';
      setError(errorMessage);
      console.error('Lỗi khi thêm nhân viên:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    setEditId(id);
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleSaveEdit = async (id: number, updatedEmployee: Omit<Employee, 'id'>) => {
    const errors = validateForm(updatedEmployee);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:3001/users/${id}`, {
        ...updatedEmployee,
        id,
      });

      if (response.status === 200) {
        const updatedResponse = await axios.get('http://localhost:3001/users');
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
            name: user.name || 'Không xác định',
            email: user.email || 'Không xác định',
            role: user.role || 'Không xác định',
          }));
          setEmployees(users);
        }
        setEditId(null);
      } else {
        throw new Error('Không thể cập nhật thông tin nhân viên');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật thông tin nhân viên';
      setError(errorMessage);
      console.error('Lỗi khi cập nhật nhân viên:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const response = await axios.delete(`http://localhost:3001/users/${id}`);

      if (response.status === 200) {
        const updatedResponse = await axios.get('http://localhost:3001/users');
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
            name: user.name || 'Không xác định',
            email: user.email || 'Không xác định',
            role: user.role || 'Không xác định',
          }));
          setEmployees(users);
        }
      } else {
        throw new Error('Không thể xóa nhân viên');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa nhân viên';
      setError(errorMessage);
      console.error('Lỗi khi xóa nhân viên:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
    const errors = validateForm({ ...newEmployee, [name]: value });
    setAddErrors(errors);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setNewEmployee((prev) => ({ ...prev, role: value }));
    const errors = validateForm({ ...newEmployee, role: value });
    setAddErrors(errors);
  };

  const setEmployeeInEdit = (id: number, updatedEmployee: Employee) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updatedEmployee } : emp))
    );
  };

  return (
    <div className="table-wrapper">
      <div className="table-title">
        <div className="header-content">
          <h2>
            Employee <b>Details</b>
          </h2>
          <Button
            variant="contained"
            className="btn-add-new"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            disabled={loading || showAddForm}
          >
            Thêm mới
          </Button>
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
        <Typography className="no-data">Không tìm thấy nhân viên nào.</Typography>
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
                    <>
                      <TableCell>
                        <TextField
                          label="Họ Tên"
                          name="name"
                          value={employee.name}
                          onChange={(e) =>
                            setEmployeeInEdit(employee.id, { ...employee, name: e.target.value })
                          }
                          fullWidth
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          label="Địa Chỉ Email"
                          name="email"
                          value={employee.email}
                          onChange={(e) =>
                            setEmployeeInEdit(employee.id, { ...employee, email: e.target.value })
                          }
                          fullWidth
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth variant="outlined" size="small">
                          <InputLabel>Vai Trò</InputLabel>
                          <Select
                            name="role"
                            value={employee.role}
                            onChange={(e) =>
                              setEmployeeInEdit(employee.id, { ...employee, role: e.target.value })
                            }
                            label="Vai Trò"
                          >
                            <MenuItem value="Quản lí">Quản lí</MenuItem>
                            <MenuItem value="Lễ tân">Lễ tân</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="action save"
                          title="Lưu"
                          onClick={() => handleSaveEdit(employee.id, {
                            name: employee.name,
                            email: employee.email,
                            role: employee.role,
                          })}
                          disabled={loading}
                        >
                          <CheckIcon style={{ color: 'green' }} />
                        </IconButton>
                        <IconButton
                          className="action delete"
                          title="Hủy"
                          onClick={handleCancelEdit}
                          disabled={loading}
                        >
                          <DeleteIcon style={{ color: 'red' }} />
                        </IconButton>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="action edit"
                          title="Chỉnh sửa"
                          onClick={() => handleEdit(employee.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          className="action delete"
                          title="Xóa"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
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
                    <FormControl fullWidth variant="outlined" size="small" error={!!addErrors.role}>
                      <InputLabel>Vai Trò</InputLabel>
                      <Select
                        name="role"
                        value={newEmployee.role}
                        onChange={handleSelectChange}
                        label="Vai Trò"
                      >
                        <MenuItem value="Quản lí">Quản lí</MenuItem>
                        <MenuItem value="Lễ tân">Lễ tân</MenuItem>
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
                      <CheckIcon style={{ color: 'green' }} />
                    </IconButton>
                    <IconButton
                      className="action delete"
                      title="Hủy"
                      onClick={handleCancelAdd}
                    >
                      <DeleteIcon style={{ color: 'red' }} />
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

export default User;