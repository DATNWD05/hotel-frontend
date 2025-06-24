import React, { useState } from 'react';
import {
      Box,
      Button,
      TextField,
      Typography,
      Paper,
      Snackbar,
      Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../../css/AmenitiesCategory.css';

interface ValidationErrors {
      name?: string;
      description?: string;
}

const AddAmenityCategory: React.FC = () => {
      const [formData, setFormData] = useState({ name: '', description: '' });
      const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
      const [loading, setLoading] = useState<boolean>(false);
      const [error, setError] = useState<string | null>(null);
      const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
      const [snackbarMessage, setSnackbarMessage] = useState<string>('');
      const navigate = useNavigate();

      const validateForm = (data: { name: string; description: string }): ValidationErrors => {
            const errors: ValidationErrors = {};
            if (!data.name.trim()) errors.name = 'Tên danh mục không được để trống';
            else if (data.name.length > 50) errors.name = 'Tên danh mục không được vượt quá 50 ký tự';
            if (data.description && data.description.length > 500) errors.description = 'Mô tả không được vượt quá 500 ký tự';
            return errors;
      };

      const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));
            const errors = validateForm({ ...formData, [name]: value });
            setValidationErrors(errors);
      };

      const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const errors = validateForm(formData);
            if (Object.keys(errors).length > 0) {
                  setValidationErrors(errors);
                  return;
            }

            setLoading(true);
            try {
                  const token = localStorage.getItem('auth_token');
                  if (!token) throw new Error('Không tìm thấy token xác thực');

                  const response = await fetch('http://127.0.0.1:8000/api/amenity-categories', {
                        method: 'POST',
                        headers: {
                              'Accept': 'application/json',
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                              name: formData.name,
                              description: formData.description,
                        }),
                  });

                  if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`Không thể tạo danh mục: ${response.status} ${response.statusText}. Chi tiết: ${text}`);
                  }

                  setSnackbarMessage('Tạo danh mục thành công!');
                  setSnackbarOpen(true);
                  setTimeout(() => navigate('/amenity-categories'), 2000); // Redirect after 2 seconds
            } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tạo danh mục';
                  setError(errorMessage);
            } finally {
                  setLoading(false);
            }
      };

      const handleSnackbarClose = () => {
            setSnackbarOpen(false);
            setSnackbarMessage('');
      };

      return (
            <div className="amenities-container">
                  <div className="header">
                        <h1>Thêm Danh mục Tiện ích</h1>
                  </div>
                  <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
                        <form onSubmit={handleSubmit}>
                              <Box display="flex" flexDirection="column" gap={3}>
                                    <TextField
                                          label="Tên danh mục"
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
                                          label="Mô tả"
                                          name="description"
                                          value={formData.description}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          multiline
                                          rows={3}
                                          error={!!validationErrors.description}
                                          helperText={validationErrors.description}
                                    />
                                    <Button
                                          type="submit"
                                          variant="contained"
                                          color="primary"
                                          disabled={loading}
                                          sx={{ maxWidth: 200 }}
                                    >
                                          {loading ? 'Đang tạo...' : 'Tạo danh mục'}
                                    </Button>
                                    {error && (
                                          <Typography color="error" mt={1}>
                                                {error}
                                          </Typography>
                                    )}
                              </Box>
                        </form>
                  </Paper>
                  <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={2000}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  >
                        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
                              {snackbarMessage}
                        </Alert>
                  </Snackbar>
            </div>
      );
};

export default AddAmenityCategory;