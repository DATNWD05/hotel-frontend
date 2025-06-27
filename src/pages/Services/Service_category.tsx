import React, { useEffect, useState } from 'react';
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
  Box,
  TextField,
  Button,
  Pagination,
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
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/service.css';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

interface RawServiceCategory {
  id: number | string;
  name: string;
  description?: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

const ServiceCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ServiceCategory | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Danh sách Danh mục Dịch vụ';
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/service-categories?page=${page}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!Array.isArray(response.data.data)) {
          setError('Dữ liệu danh mục không đúng định dạng.');
          return;
        }

        setCategories(
          response.data.data.map((cat: RawServiceCategory) => ({
            id: cat.id.toString(),
            name: cat.name,
            description: cat.description || '–',
          }))
        );
        setMeta(response.data.meta);
      } catch (err: unknown) {
        console.error('Lỗi fetch:', err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError('Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
            navigate('/login');
          } else {
            setError(err.message || 'Lỗi mạng hoặc máy chủ.');
          }
        } else {
          setError(err instanceof Error ? err.message : 'Lỗi không xác định.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [page, navigate]);

  const validateForm = (data: ServiceCategory): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên danh mục không được để trống';
    else if (data.name.length > 50) errors.name = 'Tên danh mục không được vượt quá 50 ký tự';
    if (data.description && data.description.length > 500)
      errors.description = 'Mô tả không được vượt quá 500 ký tự';
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

  const handleEdit = (category: ServiceCategory) => {
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
        `http://127.0.0.1:8000/api/service-categories/${editFormData.id}`,
        {
          name: editFormData.name,
          description: editFormData.description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === editFormData.id ? { ...editFormData } : category
          )
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
      const errorMessage = axios.isAxiosError(err)
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
      const response = await axios.delete(`http://127.0.0.1:8000/api/service-categories/${categoryToDelete}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryToDelete));
        setSnackbarMessage('Xóa danh mục thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể xóa danh mục');
      }
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
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

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Dịch vụ {'>'} Danh sách Danh Mục
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>
            Danh Mục Dịch Vụ
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm danh mục"
              variant="outlined"
              size="small"
              sx={{ width: 300, bgcolor: '#fff', borderRadius: '8px', '& input': { fontSize: '15px' } }}
              disabled // Temporary, as search is not implemented
            />
            <Button
              variant="contained"
              onClick={() => navigate('/service-categories/add')}
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
          Không tìm thấy danh mục dịch vụ nào.
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="promotions-table-container">
            <Table className="promotions-table" sx={{ width: '100%' }}>
              <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                <TableRow>
                  <TableCell><b>ID</b></TableCell>
                  <TableCell><b>Tên danh mục</b></TableCell>
                  <TableCell><b>Mô tả</b></TableCell>
                  <TableCell align="center"><b>Hành động</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <React.Fragment key={cat.id}>
                    <TableRow>
                      <TableCell>{cat.id}</TableCell>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell>{cat.description}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <IconButton
                            title={selectedCategoryId === cat.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                            onClick={() => handleViewDetails(cat.id)}
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
                            {selectedCategoryId === cat.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                          <IconButton
                            title="Chỉnh sửa danh mục"
                            onClick={() => handleEdit(cat)}
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
                            onClick={() => handleDelete(cat.id)}
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
                        <Collapse in={selectedCategoryId === cat.id}>
                          <div className="promotion-detail-container">
                            {editCategoryId === cat.id && editFormData ? (
                              <Box sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                  Chỉnh sửa danh mục
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Tên danh mục"
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
                                  </Box>
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
                                      <TableCell><strong>ID:</strong> {cat.id}</TableCell>
                                      <TableCell><strong>Tên danh mục:</strong> {cat.name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell colSpan={2}><strong>Mô tả:</strong> {cat.description}</TableCell>
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
          {meta && meta.last_page > 1 && (
            <Box display="flex" justifyContent="flex-end" mt={2} pr={3}>
              <Pagination
                count={meta.last_page}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
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

export default ServiceCategoryList;