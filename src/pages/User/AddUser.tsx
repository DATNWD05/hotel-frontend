import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';

interface FormData {
  name: string;
  email: string;
  role: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  role?: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addErrors, setAddErrors] = useState<ValidationErrors>({});

  const validateForm = (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Họ tên không được để trống';
    else if (data.name.length > 50) errors.name = 'Họ tên không được vượt quá 50 ký tự';
    if (!data.email.trim()) errors.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email không hợp lệ';
    if (!data.role) errors.role = 'Vui lòng chọn vai trò';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errors = validateForm({ ...formData, [name]: value });
    setAddErrors(errors);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, role: value }));
    const errors = validateForm({ ...formData, role: value });
    setAddErrors(errors);
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/users', formData);
      if (response.status === 201) {
        navigate('/user');
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

  const handleCancel = () => {
    navigate('/user');
  };

  return (
    <div className="table-wrapper">
      <div className="table-title">
        <div className="header-content">
          <h2>
            Add New <b>Employee</b>
          </h2>
          <Button
            variant="contained"
            className="btn-add-new"
            startIcon={<AddIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            Thêm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <Typography>Đang tải...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="error-message">
          {error}
        </Typography>
      ) : (
        <TableContainer className="table-container">
          <Table className="table">
            <TableBody>
              <TableRow>
                <TableCell>
                  <TextField
                    label="Họ Tên"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!addErrors.name}
                    helperText={addErrors.name}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    label="Địa Chỉ Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!addErrors.email}
                    helperText={addErrors.email}
                  />
                </TableCell>
                <TableCell>
                  <FormControl fullWidth variant="outlined" size="small" error={!!addErrors.role}>
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
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <CheckIcon style={{ color: 'green' }} />
                  </IconButton>
                  <IconButton
                    className="action delete"
                    title="Hủy"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <DeleteIcon style={{ color: 'red' }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default AddUser;