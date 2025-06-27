import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Typography,
  Collapse,
  TextField,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios, { AxiosError } from 'axios';
import '../../css/service.css';

interface AmenityCategory {
  id: string;
  name: string;
  description: string;
}

interface RawAmenityCategory {
  id?: number | string;
  name?: string;
  description?: string | null | undefined;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

interface ApiResponse {
  data: RawAmenityCategory[];
}

const AmenitiesCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<AmenityCategory | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Danh sách Danh Mục Tiện Ích';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiResponse>('http://127.0.0.1:8000/api/amenity-categories', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const categoriesData = response.data.data;
        if (!Array.isArray(categoriesData)) {
          setError('Dữ liệu danh mục không đúng định dạng');
          return;
        }

        const mapped: AmenityCategory[] = categoriesData.map((cat: RawAmenityCategory) => ({
          id: cat.id != null ? String(cat.id) : '',
          name: cat.name || 'Không xác định',
          description: cat.description ?? '',
        }));

        setCategories(mapped);
      } catch (err: unknown) {
        const errorMessage = err instanceof AxiosError
          ? err.response?.status === 401
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            : `Không thể tải danh mục tiện ích: ${err.message}`
          : 'Lỗi không xác định';
        setError(errorMessage);
        if (err instanceof AxiosError && err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [navigate]);

  const validateForm = (data: AmenityCategory): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) {
      errors.name = 'Tên danh mục không được để trống';
    } else if (data.name.length > 50) {
      errors.name = 'Tên danh mục không được vượt quá 50 ký tự';
    }
    if (data.description && data.description.length > 500) {
      errors.description = 'Mô tả không được vượt quá 500 ký tự';
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = { ...editFormData, [name]: value };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleEdit = (category: AmenityCategory) => {
    setSelectedCategoryId(category.id);
    setEditCategoryId(category.id);
    setEditFormData({ ...category });
    setValidationErrors({});
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editFormData) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Không tìm thấy token xác thực');

      const response = await axios.put(
        `http://127.0.0.1:8000/api/amenity-categories/${editFormData.id}`,
        {
          name: editFormData.name,
          description: editFormData.description || '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editFormData.id ? { ...editFormData } : cat))
        );
        setEditCategoryId(null);
        setEditFormData(null);
        setSelectedCategoryId(null);
        setSnackbarMessage('Cập nhật danh mục thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể cập nhật danh mục');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof AxiosError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'Đã xảy ra lỗi khi cập nhật danh mục';
      setEditError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditCategoryId(null);
    setEditFormData(null);
    setSelectedCategoryId(null);
    setValidationErrors({});
    setEditError(null);
  };

  const handleViewDetails = (id: string) => {
    if (selectedCategoryId === id && editCategoryId !== id) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(id);
      setEditCategoryId(null);
      setEditFormData(null);
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/amenity-categories/${categoryToDelete}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete));
        setSnackbarMessage('Xóa danh mục thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể xóa danh mục');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof AxiosError
        ? `Không thể xóa danh mục: ${err.message}`
        : err instanceof Error
        ? `Không thể xóa danh mục: ${err.message}`
        : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Tiện ích {'>'} Danh sách Danh Mục
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>
            Danh Mục Tiện Ích
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm danh mục"
              variant="outlined"
              size="small"
              sx={{ width: 300, bgcolor: '#fff', borderRadius: '8px', '& input': { fontSize: '15px' } }}
              disabled
            />
            <Button
              variant="contained"
              onClick={() => navigate('/amenity-categories/add')}
              sx={{
                backgroundColor: '#4318FF',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                px: 2.5,
                py: 0.7,
                boxShadow: '0 2px 6px rgba(106, 27, 154, 0.3)',
                '&:hover': {
                  backgroundColor: '#7B1FA2',
                  boxShadow: '0 4px 12px rgba(106, 27, 154, 0.4)',
                },
              }}
            >
              + Thêm mới
            </Button>
          </Box>
        </Box>
      </div>

      {loading ? (
        <div className="promotions-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách danh mục...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotions-error-message">
          {error}
        </Typography>
      ) : categories.length === 0 ? (
        <Typography className="promotions-no-data">
          Không tìm thấy danh mục tiện ích nào.
        </Typography>
      ) : (
        <TableContainer component={Paper} className="promotions-table-container">
          <Table className="promotions-table" sx={{ width: '100%' }}>
            <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Tên</b></TableCell>
                <TableCell><b>Mô tả</b></TableCell>
                <TableCell align="center"><b>Hành động</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <React.Fragment key={category.id}>
                  <TableRow>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description || '–'}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <IconButton
                          title={selectedCategoryId === category.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          onClick={() => handleViewDetails(category.id)}
                          sx={{
                            color: '#1976d2',
                            bgcolor: '#e3f2fd',
                            '&:hover': {
                              bgcolor: '#bbdefb',
                              boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          {selectedCategoryId === category.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <IconButton
                          title="Chỉnh sửa danh mục"
                          onClick={() => handleEdit(category)}
                          sx={{
                            color: '#FACC15',
                            bgcolor: '#fef9c3',
                            '&:hover': {
                              bgcolor: '#fff9c4',
                              boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          title="Xóa danh mục"
                          onClick={() => handleDelete(category.id)}
                          sx={{
                            color: '#d32f2f',
                            bgcolor: '#ffebee',
                            '&:hover': {
                              bgcolor: '#ffcdd2',
                              boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} style={{ padding: 0 }}>
                      <Collapse in={selectedCategoryId === category.id}>
                        <div className="promotion-detail-container">
                          {editCategoryId === category.id && editFormData ? (
                            <Box sx={{ p: 2 }}>
                              <Typography variant="h6" gutterBottom>
                                Chỉnh sửa danh mục
                              </Typography>
                              <Box display="flex" flexDirection="column" gap={2}>
                                <TextField
                                  label="Tên"
                                  name="name"
                                  value={editFormData.name}
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
                                  value={editFormData.description}
                                  onChange={handleChange}
                                  fullWidth
                                  variant="outlined"
                                  size="small"
                                  multiline
                                  rows={3}
                                  error={!!validationErrors.description}
                                  helperText={validationErrors.description}
                                />
                                <Box mt={2} display="flex" gap={2}>
                                  <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={editLoading}
                                    sx={{
                                      backgroundColor: '#4318FF',
                                      color: '#fff',
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      borderRadius: '8px',
                                      px: 2.5,
                                      py: 0.7,
                                      boxShadow: '0 2px 6px rgba(106, 27, 154, 0.3)',
                                      '&:hover': {
                                        backgroundColor: '#7B1FA2',
                                        boxShadow: '0 4px 12px rgba(106, 27, 154, 0.4)',
                                      },
                                      '&:disabled': {
                                        backgroundColor: '#a9a9a9',
                                        boxShadow: 'none',
                                      },
                                    }}
                                  >
                                    Lưu
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    onClick={handleCancel}
                                    disabled={editLoading}
                                    sx={{
                                      color: '#f44336',
                                      borderColor: '#f44336',
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      borderRadius: '8px',
                                      px: 2.5,
                                      py: 0.7,
                                      '&:hover': {
                                        borderColor: '#d32f2f',
                                        backgroundColor: '#ffebee',
                                      },
                                      '&:disabled': {
                                        color: '#a9a9a9',
                                        borderColor: '#a9a9a9',
                                      },
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                </Box>
                                {editError && (
                                  <Typography color="error" mt={1}>
                                    {editError}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ p: 2 }}>
                              <Typography variant="h6" gutterBottom>
                                Thông tin danh mục
                              </Typography>
                              <Table className="promotion-detail-table">
                                <TableBody>
                                  <TableRow>
                                    <TableCell><strong>ID:</strong> {category.id}</TableCell>
                                    <TableCell><strong>Tên:</strong> {category.name}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell colSpan={2}><strong>Mô tả:</strong> {category.description || '–'}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </Box>
                          )}
                        </div>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xóa danh mục</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#d32f2f',
              borderColor: '#d32f2f',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 2.5,
              py: 0.7,
              '&:hover': { borderColor: '#b71c1c', backgroundColor: '#ffebee' },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes('thành công') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AmenitiesCategoryList;