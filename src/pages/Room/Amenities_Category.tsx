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
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import '../../css/AmenitiesCategory.css';

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

const AmenitiesCategoryList: React.FC = () => {
  const [allCategories, setAllCategories] = useState<AmenityCategory[]>([]);
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
  const [searchQuery, setSearchQuery] = useState<string>('');

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
          description: cat.description ?? '',
        }));
        setAllCategories(mapped);
        setLastPage(data.meta?.last_page || 1);
        setCategories(mapped.slice(0, 10)); // Initial display
      } catch (err) {
        const errorMessage = err instanceof Error ? `Không thể tải danh mục tiện ích: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [currentPage]);

  useEffect(() => {
    let filtered = [...allCategories];
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setLastPage(Math.ceil(filtered.length / 10));
    setCategories(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, currentPage, allCategories]);

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
          description: editFormData.description || '',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Không thể cập nhật danh mục: ${response.status} ${response.statusText}. Chi tiết: ${text}`);
      }

      setAllCategories((prev) =>
        prev.map((cat) => (cat.id === editFormData.id ? { ...editFormData } : cat))
      );
      setCategories((prev) => {
        const filtered = prev.map((cat) => (cat.id === editFormData.id ? { ...editFormData } : cat));
        return filtered.slice((currentPage - 1) * 10, currentPage * 10);
      });
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
    setSelectedCategoryId((prev) => (prev === id ? null : id));
    if (editCategoryId === id) {
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

      setAllCategories((prev) => prev.filter((c) => c.id !== id));
      setCategories((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        return filtered.slice((currentPage - 1) * 10, currentPage * 10);
      });
      setSnackbarMessage('Xóa danh mục thành công!');
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? `Không thể xóa danh mục: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    const filtered = searchQuery.trim() !== ''
      ? allCategories.filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : allCategories;
    setCategories(filtered.slice((page - 1) * 10, page * 10));
    setLastPage(Math.ceil(filtered.length / 10));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
    <div className="amenities-container">
      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent>
          <Box mb={2}>
            <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
              Tiện ích {'>'} Danh sách Danh mục
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
              <Typography variant="h2" fontWeight={700}>
                Danh mục Tiện ích
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  variant="outlined"
                  placeholder="Tìm kiếm danh mục"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 300,
                    bgcolor: '#fff',
                    borderRadius: '8px',
                    mt: { xs: 2, sm: 0 },
                    '& input': { fontSize: '15px' },
                  }}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
                <Button
                  variant="contained"
                  href="/amenity-categories/add"
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
                  + Tạo mới Danh mục
                </Button>
              </Box>
            </Box>
          </Box>

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
                <Table className="amenities-table" sx={{ width: '100%' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell><b>ID</b></TableCell>
                      <TableCell><b>Tên</b></TableCell>
                      <TableCell><b>Mô tả</b></TableCell>
                      <TableCell align="center"><b>Hành động</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.length === 0 && !loading && !error && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          Không có danh mục nào
                        </TableCell>
                      </TableRow>
                    )}
                    {categories.map((category) => (
                      <React.Fragment key={category.id}>
                        <TableRow className="amenity-row" hover>
                          <TableCell>{category.id}</TableCell>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.description || '-'}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              className="action-view"
                              title="Xem chi tiết"
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
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              className="action-edit"
                              title="Chỉnh sửa danh mục"
                              onClick={() => handleEdit(category)}
                              sx={{
                                color: '#FACC15',
                                bgcolor: '#fef9c3',
                                '&:hover': { bgcolor: '#fff9c4', boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)' },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              className="delete-btn"
                              title="Xóa danh mục"
                              onClick={() => handleDeleteCategory(category.id)}
                              sx={{
                                color: '#d32f2f',
                                bgcolor: '#ffebee',
                                '&:hover': { bgcolor: '#ffcdd2', boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)' },
                              }}
                            >
                              <DeleteIcon />
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
                                    <Box display="flex" flexDirection="column" gap={2} p={2}>
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
                                        sx={{ bgcolor: '#fff', borderRadius: '4px' }}
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
                                        sx={{ bgcolor: '#fff', borderRadius: '4px' }}
                                      />
                                      <Box mt={2} display="flex" gap={2}>
                                        <Button
                                          variant="contained"
                                          color="primary"
                                          onClick={handleSave}
                                          disabled={editLoading}
                                          sx={{ textTransform: 'none', borderRadius: '8px' }}
                                        >
                                          Lưu
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          color="secondary"
                                          onClick={handleCancel}
                                          disabled={editLoading}
                                          sx={{ textTransform: 'none', borderRadius: '8px' }}
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
                                    <Table className="detail-table" sx={{ bgcolor: '#f9f9f9', borderRadius: '4px' }}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AmenitiesCategoryList;