import React, { useState, useEffect } from 'react';
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
  Pagination,
  Snackbar,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import '../../css/AmenitiesCategory.css';

interface AmenityCategory {
  id: string;
  name: string;
  description: string; // Kept as string with default value
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

const AmenitiesCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
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

  useEffect(() => {
    document.title = 'Danh sách Danh mục Tiện ích';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/amenity-categories', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Lỗi tải danh mục: ${response.status} ${response.statusText}. Chi tiết: ${text}`);
        }
        const data = await response.json();
        console.log('API Response:', data); // Log the response to debug
        const categoriesData = data.data || data;
        if (!Array.isArray(categoriesData)) {
          setError('Dữ liệu danh mục không đúng định dạng');
          return;
        }
        const mapped: AmenityCategory[] = categoriesData.map((cat: RawAmenityCategory) => ({
          id: cat.id != null ? String(cat.id) : '',
          name: cat.name || 'Không xác định',
          description: cat.description ?? '', // Default to empty string if null or undefined
        }));
        setCategories(mapped);
        setLastPage(data.meta?.last_page || 1);
      } catch (err) {
        const errorMessage = err instanceof Error ? `Không thể tải danh mục tiện ích: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [currentPage]);

  const validateForm = (data: AmenityCategory): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên danh mục không được để trống';
    else if (data.name.length > 50) errors.name = 'Tên danh mục không được vượt quá 50 ký tự';
    if (data.description && data.description.length > 500) errors.description = 'Mô tả không được vượt quá 500 ký tự';
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

      const response = await fetch(`http://127.0.0.1:8000/api/amenity-categories/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description || '', // Send empty string if null
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Không thể cập nhật danh mục: ${response.status} ${response.statusText}. Chi tiết: ${text}`);
      }

      setCategories((prev) =>
        prev.map((cat) => (cat.id === editFormData.id ? { ...editFormData } : cat))
      );
      setEditCategoryId(null);
      setEditFormData(null);
      setSnackbarMessage('Cập nhật danh mục thành công!');
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật danh mục';
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
      const response = await fetch(`http://127.0.0.1:8000/api/amenity-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Lỗi xóa danh mục: ${response.status} ${response.statusText}. Chi tiết: ${text}`);
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSnackbarMessage('Xóa danh mục thành công!');
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? `Không thể xóa danh mục: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const filtered: AmenityCategory[] = categories;

  return (
    <div className="amenities-container">
      <div className="header">
        <h1>Danh sách Danh mục Tiện ích</h1>
        <a className="btn-add" href="/amenity-categories/add">
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
        <>
          <TableContainer component={Paper} className="amenities-table-container">
            <Table className="amenities-table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Tên</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && !loading && !error && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      Không có danh mục nào
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((category) => (
                  <React.Fragment key={category.id}>
                    <TableRow className="amenity-row">
                      <TableCell>{category.id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="action-view"
                          title={selectedCategoryId === category.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          onClick={() => handleViewDetails(category.id)}
                        >
                          {selectedCategoryId === category.id ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                        <IconButton
                          className="action-edit"
                          title="Chỉnh sửa danh mục"
                          onClick={() => handleEdit(category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          className="delete-btn"
                          title="Xóa danh mục"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <DeleteIcon style={{ color: 'red' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} style={{ padding: 0 }}>
                        <Collapse in={selectedCategoryId === category.id}>
                          <div className="detail-container">
                            {editCategoryId === category.id && editFormData ? (
                              <>
                                <h3>Chỉnh sửa danh mục</h3>
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
                                      <TableCell><strong>ID:</strong> {category.id}</TableCell>
                                      <TableCell><strong>Tên:</strong> {category.name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell colSpan={2}><strong>Mô tả:</strong> {category.description || '-'}</TableCell>
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

          <Box display="flex" justifyContent="flex-end" mt={2} className="pagination-container">
            <Pagination
              count={lastPage}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
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

export default AmenitiesCategoryList;