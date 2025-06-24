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
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import '../../css/Service.css';
import { Link } from 'react-router-dom';

interface Service {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  description: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface RawService {
  id: number | string;
  name: string;
  category: { id: string | number; name: string };
  price: number;
  description?: string;
}

interface RawServiceCategory {
  id: number | string;
  name: string;
}

interface ValidationErrors {
  name?: string;
  category?: string;
  price?: string;
  description?: string;
}

const Service: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([{ id: 'all', name: 'Tất cả' }]);
  const [activeCategories, setActiveCategories] = useState<string[]>(['all']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Service | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Danh sách Dịch vụ';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/service-categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.data || response.data;
        if (!Array.isArray(data)) {
          setError('Dữ liệu danh mục không đúng định dạng');
          return;
        }
        const categories: ServiceCategory[] = [
          { id: 'all', name: 'Tất cả' },
          ...data.map((cat: RawServiceCategory) => ({
            id: cat.id.toString(),
            name: cat.name,
          })),
        ];
        setServiceCategories(categories);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? `Không thể tải danh mục dịch vụ: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      try {
        setLoading(true);
        let url = `http://127.0.0.1:8000/api/service?page=${currentPage}`;
        if (!activeCategories.includes('all')) {
          url += `&category_id=${activeCategories.join(',')}`;
        }
        if (searchQuery.trim()) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.data || !Array.isArray(response.data.data)) {
          setError('Dữ liệu dịch vụ không đúng định dạng');
          return;
        }

        const mapped: Service[] = response.data.data.map((item: RawService) => ({
          id: item.id.toString(),
          name: item.name,
          category: {
            id: item.category.id.toString(),
            name: item.category.name,
          },
          price: item.price,
          description: item.description || '–',
        }));

        setServices(mapped);
        setLastPage(response.data.meta?.last_page || 1);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? `Không thể tải danh sách dịch vụ: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [currentPage, activeCategories, searchQuery]);

  const validateForm = (data: Service): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên dịch vụ không được để trống';
    else if (data.name.length > 50) errors.name = 'Tên dịch vụ không được vượt quá 50 ký tự';
    if (!data.category.id || data.category.id === 'all') errors.category = 'Vui lòng chọn danh mục dịch vụ';
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
      const selectedCategory = serviceCategories.find((cat) => cat.id === value);
      const updatedData = {
        ...editFormData,
        category: selectedCategory ? { id: value, name: selectedCategory.name } : editFormData.category,
      };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedServiceId(service.id);
    setEditServiceId(service.id);
    setEditFormData({ ...service });
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
        `http://127.0.0.1:8000/api/service/${editFormData.id}`,
        {
          name: editFormData.name,
          category_id: editFormData.category.id,
          price: editFormData.price,
          description: editFormData.description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setServices((prev) =>
          prev.map((service) =>
            service.id === editFormData.id ? { ...editFormData } : service
          )
        );
        setEditServiceId(null);
        setEditFormData(null);
        setSelectedServiceId(null);
        setSnackbarMessage('Cập nhật dịch vụ thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể cập nhật dịch vụ');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật dịch vụ';
      setEditError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditServiceId(null);
    setEditFormData(null);
    setSelectedServiceId(null);
    setValidationErrors({});
    setEditError(null);
  };

  const handleViewDetails = (id: string) => {
    if (selectedServiceId === id && editServiceId !== id) {
      setSelectedServiceId(null);
    } else {
      setSelectedServiceId(id);
      setEditServiceId(null);
      setEditFormData(null);
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/service/${serviceToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setServices((prev) => prev.filter((s) => s.id !== serviceToDelete));
        setSnackbarMessage('Xóa dịch vụ thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể xóa dịch vụ');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? `Không thể xóa dịch vụ: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
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

  const filtered: Service[] = activeCategories.includes('all')
    ? services.filter((svc) =>
        svc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : services.filter(
        (svc) =>
          activeCategories.includes(svc.category.id.toString()) &&
          svc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Danh Sách <b>Dịch Vụ</b>
          </h2>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm dịch vụ"
              className="promotion-search-input"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: '300px' }}
            />
            <Link className="promotion-btn-add" to="/service/add">
              Thêm mới
            </Link>
          </Box>
        </div>
      </div>

      <ul className="promotion-filter-bar">
        {serviceCategories.map((cat) => (
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
          <Typography>Đang tải danh sách dịch vụ...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotion-error-message">
          {error}
        </Typography>
      ) : filtered.length === 0 ? (
        <Typography className="promotion-no-data">
          {searchQuery || !activeCategories.includes('all')
            ? 'Không tìm thấy dịch vụ phù hợp.'
            : 'Không tìm thấy dịch vụ nào.'}
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="promotion-table-container">
            <Table className="promotion-table">
              <TableHead>
                <TableRow>
                  <TableCell>Tên dịch vụ</TableCell>
                  <TableCell>Nhóm dịch vụ</TableCell>
                  <TableCell>Giá mỗi đơn</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((svc) => (
                  <React.Fragment key={svc.id}>
                    <TableRow>
                      <TableCell>{svc.name}</TableCell>
                      <TableCell>{svc.category.name}</TableCell>
                      <TableCell>{svc.price.toLocaleString()} đ</TableCell>
                      <TableCell>{svc.description}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="promotion-action-view"
                          title={selectedServiceId === svc.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          onClick={() => handleViewDetails(svc.id)}
                        >
                          {selectedServiceId === svc.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <IconButton
                          className="promotion-action-edit"
                          title="Chỉnh sửa dịch vụ"
                          onClick={() => handleEdit(svc)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          className="promotion-action-delete"
                          title="Xóa dịch vụ"
                          onClick={() => handleDelete(svc.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} style={{ padding: 0 }}>
                        <Collapse in={selectedServiceId === svc.id}>
                          <div className="promotion-detail-container">
                            {editServiceId === svc.id && editFormData ? (
                              <>
                                <h3>Chỉnh sửa dịch vụ</h3>
                                <Box display="flex" flexDirection="column" gap={2}>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Tên dịch vụ"
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
                                      <InputLabel>Nhóm dịch vụ</InputLabel>
                                      <Select
                                        name="category"
                                        value={editFormData.category.id}
                                        onChange={handleSelectChange}
                                        label="Nhóm dịch vụ"
                                      >
                                        <MenuItem value="">Chọn danh mục</MenuItem>
                                        {serviceCategories
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
                                <h3>Thông tin dịch vụ</h3>
                                <Table className="promotion-detail-table">
                                  <TableBody>
                                    <TableRow>
                                      <TableCell><strong>Tên dịch vụ:</strong> {svc.name}</TableCell>
                                      <TableCell><strong>Nhóm dịch vụ:</strong> {svc.category.name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell><strong>Giá mỗi đơn:</strong> {svc.price.toLocaleString()} đ</TableCell>
                                      <TableCell><strong>Mô tả:</strong> {svc.description}</TableCell>
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
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        classes={{ paper: 'promotion-dialog' }}
      >
        <DialogTitle>Xác nhận xóa dịch vụ</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa dịch vụ này không? Hành động này không thể hoàn tác.
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

export default Service;