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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import '../../css/service.css';

interface Amenity {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  category: { id: string; name: string };
}

interface AmenityCategory {
  id: string;
  name: string;
}

interface RawAmenityCategory {
  id?: number | string;
  name?: string;
}

interface RawAmenity {
  id?: number | string;
  category_id?: number | string | null;
  name?: string;
  description?: string;
  price?: number | string | null;
  category?: { id?: string | number | null; name?: string | null } | null;
}

interface ValidationErrors {
  name?: string;
  category?: string;
  price?: string;
  description?: string;
}

const Amenities: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategory[]>([{ id: 'all', name: 'Tất cả' }]);
  const [activeCategories, setActiveCategories] = useState<string[]>(['all']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
  const [editAmenityId, setEditAmenityId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Amenity | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [amenityToDelete, setAmenityToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Danh sách Tiện Ích';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/amenity-categories', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data.data || response.data;
        if (!Array.isArray(data)) {
          setError('Dữ liệu danh mục không đúng định dạng');
          return;
        }

        const categories: AmenityCategory[] = [
          { id: 'all', name: 'Tất cả' },
          ...data.map((cat: RawAmenityCategory) => ({
            id: cat.id != null ? String(cat.id) : '',
            name: cat.name || 'Không xác định',
          })),
        ];

        setAmenityCategories(categories);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          const errorMessage =
            err instanceof Error ? `Không thể tải danh mục tiện ích: ${err.message}` : 'Lỗi không xác định';
          setError(errorMessage);
        }
      }
    };

    fetchCategories();
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    const fetchAmenities = async () => {
      try {
        let url = `http://127.0.0.1:8000/api/amenities?page=${currentPage}`;
        if (!activeCategories.includes('all')) {
          url += `&category_id=${activeCategories.join(',')}`;
        }
        if (searchQuery.trim()) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await axios.get(url, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data.data || !Array.isArray(response.data.data)) {
          setError('Dữ liệu tiện ích không đúng định dạng');
          setLoading(false);
          return;
        }

        const mapped: Amenity[] = response.data.data.map((item: RawAmenity) => ({
          id: item.id != null ? String(item.id) : '',
          category_id: item.category?.id != null ? String(item.category.id) : '0',
          name: item.name || 'Không xác định',
          description: item.description || '–',
          price: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.-]+/g, '')) || 10000 : Number(item.price) || 10000,
          category: {
            id: item.category?.id != null ? String(item.category.id) : '0',
            name: item.category?.name || 'Không xác định',
          },
        }));

        setAmenities(mapped);
        setLastPage(response.data.meta?.last_page || 1);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          const errorMessage =
            err instanceof Error ? `Không thể tải danh sách tiện ích: ${err.message}` : 'Lỗi không xác định';
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAmenities();
  }, [currentPage, activeCategories, searchQuery, navigate]);

  const validateForm = (data: Amenity): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên tiện ích không được để trống';
    else if (data.name.length > 50) errors.name = 'Tên tiện ích không được vượt quá 50 ký tự';
    if (!data.category_id || data.category_id === 'all') errors.category = 'Vui lòng chọn danh mục tiện ích';
    if (data.price <= 0) errors.price = 'Giá phải lớn hơn 0';
    if (data.description && data.description.length > 500)
      errors.description = 'Mô tả không được vượt quá 500 ký tự';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = { ...editFormData, [name]: name === 'price' ? parseFloat(value) || 0 : value };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { value } = e.target;
    if (editFormData) {
      const selectedCategory = amenityCategories.find((cat) => cat.id === value);
      const updatedData = {
        ...editFormData,
        category_id: value,
        category: selectedCategory ? { id: value, name: selectedCategory.name } : editFormData.category,
      };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleEdit = (amenity: Amenity) => {
    setSelectedAmenityId(amenity.id);
    setEditAmenityId(amenity.id);
    setEditFormData({ ...amenity });
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
        `http://127.0.0.1:8000/api/amenities/${editFormData.id}`,
        {
          name: editFormData.name,
          category_id: editFormData.category_id,
          price: editFormData.price,
          description: editFormData.description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setAmenities((prev) =>
          prev.map((a) => (a.id === editFormData.id ? { ...editFormData } : a))
        );
        setEditAmenityId(null);
        setEditFormData(null);
        setSelectedAmenityId(null);
        setSnackbarMessage('Cập nhật tiện ích thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể cập nhật tiện ích');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : err instanceof Error
        ? err.message
        : 'Đã xảy ra lỗi khi cập nhật tiện ích';
      setEditError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditAmenityId(null);
    setEditFormData(null);
    setSelectedAmenityId(null);
    setValidationErrors({});
    setEditError(null);
  };

  const handleViewDetails = (id: string) => {
    if (selectedAmenityId === id && editAmenityId !== id) {
      setSelectedAmenityId(null);
    } else {
      setSelectedAmenityId(id);
      setEditAmenityId(null);
      setEditFormData(null);
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleDelete = (id: string) => {
    setAmenityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!amenityToDelete) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/amenities/${amenityToDelete}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setAmenities((prev) => prev.filter((a) => a.id !== amenityToDelete));
        setSnackbarMessage('Xóa tiện ích thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể xóa tiện ích');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? `Không thể xóa tiện ích: ${err.message}`
        : err instanceof Error
        ? `Không thể xóa tiện ích: ${err.message}`
        : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setAmenityToDelete(null);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handleCategoryClick = (categoryId: string) => {
    setCurrentPage(1);
    if (categoryId === 'all') {
      setActiveCategories(['all']);
    } else {
      setActiveCategories([categoryId]);
    }
  };

  const filtered: Amenity[] = activeCategories.includes('all')
    ? amenities.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : amenities.filter(
        (a) =>
          activeCategories.includes(a.category_id.toString()) &&
          a.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Danh Sách <b>Tiện Ích</b>
          </h2>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm tiện ích"
              className="promotion-search-input"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: '300px' }}
            />
            <a className="promotion-btn-add" href="/amenities/add">
              Thêm mới
            </a>
          </Box>
        </div>
      </div>

      <ul className="promotion-filter-bar">
        {amenityCategories.map((cat) => (
          <li
            key={cat.id}
            className={`promotion-filter-btn ${activeCategories.includes(cat.id) ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            {cat.name}
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="promotion-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách tiện ích...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotion-error-message">
          {error}
        </Typography>
      ) : filtered.length === 0 ? (
        <Typography className="promotion-no-data">
          {searchQuery || !activeCategories.includes('all')
            ? 'Không tìm thấy tiện ích phù hợp.'
            : 'Không tìm thấy tiện ích nào.'}
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="promotion-table-container">
            <Table className="promotion-table">
              <TableHead>
                <TableRow>
                  <TableCell>Tên tiện ích</TableCell>
                  <TableCell>Nhóm tiện ích</TableCell>
                  <TableCell>Giá mỗi đơn</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((amenity) => (
                  <React.Fragment key={amenity.id}>
                    <TableRow>
                      <TableCell>{amenity.name}</TableCell>
                      <TableCell>{amenity.category.name}</TableCell>
                      <TableCell>{amenity.price.toLocaleString('vi-VN')} đ</TableCell>
                      <TableCell>{amenity.description}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="promotion-action-view"
                          title={selectedAmenityId === amenity.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          onClick={() => handleViewDetails(amenity.id)}
                        >
                          {selectedAmenityId === amenity.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <IconButton
                          className="promotion-action-edit"
                          title="Chỉnh sửa tiện ích"
                          onClick={() => handleEdit(amenity)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          className="promotion-action-delete"
                          title="Xóa tiện ích"
                          onClick={() => handleDelete(amenity.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} style={{ padding: 0 }}>
                        <Collapse in={selectedAmenityId === amenity.id}>
                          <div className="promotion-detail-container">
                            {editAmenityId === amenity.id && editFormData ? (
                              <>
                                <h3>Chỉnh sửa tiện ích</h3>
                                <Box display="flex" flexDirection="column" gap={2}>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Tên tiện ích"
                                      name="name"
                                      value={editFormData.name}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.name}
                                      helperText={validationErrors.name}
                                    />
                                    <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.category}>
                                      <InputLabel>Nhóm tiện ích</InputLabel>
                                      <Select
                                        name="category_id"
                                        value={editFormData.category_id}
                                        onChange={handleSelectChange}
                                        label="Nhóm tiện ích"
                                      >
                                        <MenuItem value="">ChvChọn danh mục</MenuItem>
                                        {amenityCategories
                                          .filter((cat) => cat.id !== 'all')
                                          .map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id}>
                                              {cat.name}
                                            </MenuItem>
                                          ))}
                                      </Select>
                                      {validationErrors.category && (
                                        <Typography color="error" variant="caption">
                                          {validationErrors.category}
                                        </Typography>
                                      )}
                                    </FormControl>
                                  </Box>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Giá mỗi đơn"
                                      name="price"
                                      type="number"
                                      value={editFormData.price}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.price}
                                      helperText={validationErrors.price}
                                      inputProps={{ min: 0 }}
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
                                      className="promotion-btn-cancel"
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
                                <h3>Thông tin tiện ích</h3>
                                <Table className="promotion-detail-table">
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>
                                        <strong>Tên tiện ích:</strong> {amenity.name}
                                      </TableCell>
                                      <TableCell>
                                        <strong>Nhóm tiện ích:</strong> {amenity.category.name}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>
                                        <strong>Giá mỗi đơn:</strong> {amenity.price.toLocaleString('vi-VN')} đ
                                      </TableCell>
                                      <TableCell>
                                        <strong>Mô tả:</strong> {amenity.description}
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
          {lastPage > 1 && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
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
          )}
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        classes={{ paper: 'promotion-dialog' }}
      >
        <DialogTitle>Xác nhận xóa tiện ích</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa tiện ích này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
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

export default Amenities;