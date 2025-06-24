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
      Select,
      MenuItem,
      FormControl,
      InputLabel,
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
import { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';
import '../../css/service.css';

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
      const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([
            { id: 'all', name: 'Tất cả' },
      ]);
      const [activeCategories, setActiveCategories] = useState<string[]>(['all']); // Changed to array
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
                              // Send multiple category IDs as a comma-separated string or array, depending on API requirements
                              url += `&category_id=${activeCategories.join(',')}`;
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
      }, [currentPage, activeCategories]);

      const validateForm = (data: Service): ValidationErrors => {
            const errors: ValidationErrors = {};
            if (!data.name.trim()) errors.name = 'Tên dịch vụ không được để trống';
            else if (data.name.length > 50) errors.name = 'Tên dịch vụ không được vượt quá 50 ký tự';
            if (!data.category.id) errors.category = 'Vui lòng chọn danh mục dịch vụ';
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
                        setSnackbarMessage('Cập nhật dịch vụ thành công!');
                        setSnackbarOpen(true);
                  } else {
                        throw new Error('Không thể cập nhật dịch vụ');
                  }
            } catch (err) {
                  const errorMessage =
                        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật dịch vụ';
                  setEditError(errorMessage);
            } finally {
                  setEditLoading(false);
            }
      };

      const handleCancel = () => {
            setEditServiceId(null);
            setEditFormData(null);
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

      const handleDeleteService = async (id: string) => {
            if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;

            const token = localStorage.getItem('auth_token');
            if (!token) {
                  setError('Không tìm thấy token xác thực');
                  return;
            }

            try {
                  const response = await axios.delete(`http://127.0.0.1:8000/api/service/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                  });

                  if (response.status === 200) {
                        setServices((prev) => prev.filter((s) => s.id !== id));
                        setSnackbarMessage('Xóa dịch vụ thành công!');
                        setSnackbarOpen(true);
                  } else {
                        throw new Error('Không thể xóa dịch vụ');
                  }
            } catch (err) {
                  const errorMessage =
                        err instanceof Error ? `Không thể xóa dịch vụ: ${err.message}` : 'Lỗi không xác định';
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

      const handleCategoryClick = (categoryId: string) => {
            setCurrentPage(1);
            if (categoryId === 'all') {
                  setActiveCategories(['all']);
            } else {
                  // Toggle category selection
                  if (activeCategories.includes(categoryId)) {
                        // Remove category if already selected
                        const newCategories = activeCategories.filter((id) => id !== categoryId);
                        setActiveCategories(newCategories.length > 0 ? newCategories : ['all']);
                  } else {
                        // Add category and remove 'all' if present
                        const newCategories = activeCategories.includes('all')
                              ? [categoryId]
                              : [...activeCategories, categoryId];
                        setActiveCategories(newCategories);
                  }
            }
      };

      const filtered: Service[] = activeCategories.includes('all')
            ? services
            : services.filter((s) => activeCategories.includes(s.category.id.toString()));

      return (
            <div className="service-container">
                  <div className="header">
                        <h1>Danh sách dịch vụ</h1>
                        <a className="btn-add" href="/service/add">
                              Tạo mới Dịch vụ
                        </a>
                  </div>

                  {loading ? (
                        <Box display="flex" alignItems="center" justifyContent="center" mt={4}>
                              <CircularProgress />
                              <Typography ml={2}>Đang tải danh sách dịch vụ...</Typography>
                        </Box>
                  ) : error ? (
                        <Typography color="error" className="error-message">
                              {error}
                        </Typography>
                  ) : (
                        <>
                              <ul className="tabs">
                                    {serviceCategories.map((cat) => (
                                          <li
                                                key={cat.id}
                                                className={activeCategories.includes(cat.id) ? 'active' : ''}
                                                onClick={() => handleCategoryClick(cat.id)}
                                          >
                                                {cat.name}
                                          </li>
                                    ))}
                              </ul>

                              <TableContainer component={Paper} className="service-table-container">
                                    <Table className="service-table">
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
                                                {filtered.length === 0 && !loading && !error && (
                                                      <TableRow>
                                                            <TableCell colSpan={5}>
                                                                  Không có dịch vụ nào trong danh mục:{' '}
                                                                  <strong>
                                                                        {activeCategories.includes('all')
                                                                              ? 'Tất cả'
                                                                              : activeCategories
                                                                                    .map(
                                                                                          (id) =>
                                                                                                serviceCategories.find((c) => c.id === id)?.name || id
                                                                                    )
                                                                                    .join(', ')}
                                                                  </strong>
                                                            </TableCell>
                                                      </TableRow>
                                                )}
                                                {filtered.map((svc) => (
                                                      <React.Fragment key={svc.id}>
                                                            <TableRow className="service-row">
                                                                  <TableCell>{svc.name}</TableCell>
                                                                  <TableCell>{svc.category.name}</TableCell>
                                                                  <TableCell>{svc.price.toLocaleString()} đ</TableCell>
                                                                  <TableCell>{svc.description}</TableCell>
                                                                  <TableCell align="center">
                                                                        <IconButton
                                                                              className="action-view"
                                                                              title={selectedServiceId === svc.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                                                              onClick={() => handleViewDetails(svc.id)}
                                                                        >
                                                                              {selectedServiceId === svc.id ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                                                        </IconButton>
                                                                        <IconButton
                                                                              className="action-edit"
                                                                              title="Chỉnh sửa dịch vụ"
                                                                              onClick={() => handleEdit(svc)}
                                                                        >
                                                                              <EditIcon />
                                                                        </IconButton>
                                                                        <IconButton
                                                                              className="delete-btn"
                                                                              title="Xóa dịch vụ"
                                                                              onClick={() => handleDeleteService(svc.id)}
                                                                        >
                                                                              <DeleteIcon style={{ color: 'red' }} />
                                                                        </IconButton>
                                                                  </TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                  <TableCell colSpan={5} style={{ padding: 0 }}>
                                                                        <Collapse in={selectedServiceId === svc.id}>
                                                                              <div className="detail-container">
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
                                                                                                <h3>Thông tin dịch vụ</h3>
                                                                                                <Table className="detail-table">
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

export default Service;