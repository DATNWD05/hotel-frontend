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
      TextField,
      Box,
      Button,
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
      const navigate = useNavigate();

      useEffect(() => {
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
            } finally {
                  setEditLoading(false);
            }
      };

      const handleCancel = () => {
            setEditCategoryId(null);
            setEditFormData(null);
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

      const handleDeleteCategory = async (id: string) => {
            if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

            const token = localStorage.getItem('auth_token');
            if (!token) {
                  setError('Không tìm thấy token xác thực');
                  return;
            }

            try {
                  const response = await axios.delete(`http://127.0.0.1:8000/api/service-categories/${id}`, {
                        headers: {
                              'Accept': 'application/json',
                              'Authorization': `Bearer ${token}`,
                        },
                  });

                  if (response.status === 200) {
                        setCategories((prev) => prev.filter((cat) => cat.id !== id));
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
            }
      };

      const handleSnackbarClose = () => {
            setSnackbarOpen(false);
            setSnackbarMessage('');
      };

      const goToPage = (newPage: number) => {
            if (meta && newPage > 0 && newPage <= meta.last_page) {
                  setPage(newPage);
            }
      };

      return (
            <div className="service-container">
                  <div className="header">
                        <h1>Danh mục dịch vụ</h1>
                        <a className="btn-add" href="/service-categories/add">
                              Tạo mới Danh mục
                        </a>
                  </div>

                  {loading ? (
                        <Box display="flex" alignItems="center" justifyContent="center" mt={4}>
                              <CircularProgress />
                              <Typography ml={2}>Đang tải danh sách danh mục...</Typography>
                        </Box>
                  ) : error ? (
                        <Typography color="error" className="error-message">
                              {error}
                        </Typography>
                  ) : (
                        <TableContainer component={Paper} className="service-table-container">
                              <Table className="service-table">
                                    <TableHead>
                                          <TableRow>
                                                <TableCell>ID</TableCell>
                                                <TableCell>Tên danh mục</TableCell>
                                                <TableCell>Mô tả</TableCell>
                                                <TableCell align="center">Hành động</TableCell>
                                          </TableRow>
                                    </TableHead>
                                    <TableBody>
                                          {categories.length === 0 && !loading && !error && (
                                                <TableRow>
                                                      <TableCell colSpan={4}>
                                                            Không có danh mục dịch vụ nào.
                                                      </TableCell>
                                                </TableRow>
                                          )}
                                          {categories.map((cat) => (
                                                <React.Fragment key={cat.id}>
                                                      <TableRow className="service-row">
                                                            <TableCell>{cat.id}</TableCell>
                                                            <TableCell>{cat.name}</TableCell>
                                                            <TableCell>{cat.description}</TableCell>
                                                            <TableCell align="center">
                                                                  <IconButton
                                                                        className="action-view"
                                                                        title={selectedCategoryId === cat.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                                                        onClick={() => handleViewDetails(cat.id)}
                                                                  >
                                                                        {selectedCategoryId === cat.id ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                                                  </IconButton>
                                                                  <IconButton
                                                                        className="action-edit"
                                                                        title="Chỉnh sửa danh mục"
                                                                        onClick={() => handleEdit(cat)}
                                                                  >
                                                                        <EditIcon />
                                                                  </IconButton>
                                                                  <IconButton
                                                                        className="delete-btn"
                                                                        title="Xóa danh mục"
                                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                                  >
                                                                        <DeleteIcon style={{ color: 'red' }} />
                                                                  </IconButton>
                                                            </TableCell>
                                                      </TableRow>
                                                      <TableRow>
                                                            <TableCell colSpan={4} style={{ padding: 0 }}>
                                                                  <Collapse in={selectedCategoryId === cat.id}>
                                                                        <div className="detail-container">
                                                                              {editCategoryId === cat.id && editFormData ? (
                                                                                    <>
                                                                                          <h3>Chỉnh sửa danh mục</h3>
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
                                                                                                            color="primary"
                                                                                                            onClick={handleSave}
                                                                                                            disabled={editLoading}
                                                                                                      >
                                                                                                            Lưu
                                                                                                      </Button>
                                                                                                      <Button
                                                                                                            variant="outlined"
                                                                                                            color="secondary"
                                                                                                            onClick={handleCancel}
                                                                                                            disabled={editLoading}
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
                                                                                    </>
                                                                              ) : (
                                                                                    <>
                                                                                          <h3>Thông tin danh mục</h3>
                                                                                          <Table className="detail-table">
                                                                                                <TableBody>
                                                                                                      <TableRow>
                                                                                                            <TableCell><strong>ID:</strong> {cat.id}</TableCell>
                                                                                                            <TableCell><strong>Tên danh mục:</strong> {cat.name}</TableCell>
                                                                                                      </TableRow>
                                                                                                      <TableRow>
                                                                                                            <TableCell colSpan={2}>
                                                                                                                  <strong>Mô tả:</strong> {cat.description}
                                                                                                            </TableCell>
                                                                                                      </TableRow>
                                                                                                </TableBody>
                                                                                          </Table>
                                                                                    </>
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

                  {meta && meta.last_page > 1 && (
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                              <Button
                                    variant="outlined"
                                    disabled={page === 1}
                                    onClick={() => goToPage(page - 1)}
                                    sx={{ mr: 1 }}
                              >
                                    Trang trước
                              </Button>
                              <Typography>
                                    Trang {page} / {meta.last_page}
                              </Typography>
                              <Button
                                    variant="outlined"
                                    disabled={page === meta.last_page}
                                    onClick={() => goToPage(page + 1)}
                                    sx={{ ml: 1 }}
                              >
                                    Trang sau
                              </Button>
                        </Box>
                  )}

                  <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={3000}
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

export default ServiceCategoryList;