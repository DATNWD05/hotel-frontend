import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/User.css'
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Employee>({
    id: 0, // ID sẽ được API tự sinh hoặc bạn có thể tạo logic tăng dần
    name: '',
    email: '',
    role: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Gửi yêu cầu POST đến API
      const response = await axios.post('http://localhost:3001/users', formData);

      if (response.status === 201) {
        // Thêm thành công, chuyển hướng về trang danh sách
        navigate('/user');
      } else {
        throw new Error('Failed to add new employee');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while adding employee';
      setError(errorMessage);
      console.error('Error adding employee:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="add-user-wrapper">
      <Typography variant="h4" gutterBottom>
        Add New Employee
      </Typography>
      {error && (
        <Typography color="error" className="error-message">
          {error}
        </Typography>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Họ Tên"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Địa Chỉ Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Vai Trò"
          name="role"
          value={formData.role}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <Box className="form-actions">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/user')}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AddUser;