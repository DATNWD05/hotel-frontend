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
  Button,
  Box,
  TextField,
  Menu,
  MenuItem,
  Chip,
  InputAdornment,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Collapse,
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import api from '../../api/axios'; // Use the same api module as Promotions
import '../../css/Service.css';

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

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ValidationErrors {
  name?: string;
  price?: string;
  description?: string;
}

const Service: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Service | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const API_URL = 'http://127.0.0.1:8000/api/service';

  const fetchAllServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      let allData: Service[] = [];
      let page = 1;

      while (true) {
        const url = `${API_URL}?page=${page}${
          activeCategories.length > 0 ? `&category_id=${activeCategories.join(',')}` : ''
        }`;
        const response = await api.get<{ data: RawService[]; meta: Meta }>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status !== 200) {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }

        const sanitizedData: Service[] = response.data.data.map((item) => ({
          id: String(item.id),
          name: item.name?.trim() || 'Không xác định',
          category: {
            id: String(item.category?.id || '0'),
            name: item.category?.name?.trim() || 'Không xác định',
          },
          price: Number(item.price) || 0,
          description: item.description?.trim() || '–',
        }));

        allData = [...allData, ...sanitizedData];

        if (page >= response.data.meta.last_page) break;
        page++;
      }

      setAllServices(allData);
      setFilteredServices(allData);
      setServices(allData.slice(0, 10));
      setLastPage(Math.ceil(allData.length / 10));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `Không thể tải danh sách dịch vụ: ${err.message}`
          : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error('Lỗi khi tải danh sách dịch vụ:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Danh sách Dịch vụ';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setSnackbarMessage('Không tìm thấy token xác thực');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get('/service-categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data.data || response.data;
        if (!Array.isArray(data)) {
          throw new Error('Dữ liệu danh mục không đúng định dạng');
        }

        const sanitizedCategories: ServiceCategory[] = data.map((cat: { id: number | string; name: string }) => ({
          id: String(cat.id),
          name: cat.name?.trim() || 'Không xác định',
        }));

        setServiceCategories(sanitizedCategories);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? `Không thể tải danh mục dịch vụ: ${err.message}`
            : 'Đã xảy ra lỗi khi tải danh mục';
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
        console.error('Lỗi khi tải danh mục dịch vụ:', errorMessage);
      }
    };

    fetchCategories();
    fetchAllServices();
  }, [activeCategories]);

  useEffect(() => {
    let filtered = [...allServices];

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeCategories.length > 0) {
      filtered = filtered.filter((service) => activeCategories.includes(service.category.id));
    }

    setFilteredServices(filtered);
    setLastPage(Math.ceil(filtered.length / 10));
    setServices(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, activeCategories, allServices, currentPage]);

  const validateForm = (data: Service): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name?.trim()) errors.name = 'Tên dịch vụ không được để trống';
    else if (data.name.length > 50) errors.name = 'Tên dịch vụ không được vượt quá 50 ký tự';
    if (data.price < 0) errors.price = 'Giá không được nhỏ hơn 0';
    if (data.description && data.description.length > 500)
      errors.description = 'Mô tả không được vượt quá 500 ký tự';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = {
        ...editFormData,
        [name]: name === 'price' ? Number(value) || 0 : value,
      };
      setEditFormData(updatedData);
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedServiceId(service.id);
    setEditServiceId(service.id);
    setEditFormData({ ...service });
    setValidationErrors({});
  };

  const handleSave = async () => {
    if (!editFormData) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setEditLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Không tìm thấy token xác thực');

      const payload = {
        name: editFormData.name.trim(),
        category_id: editFormData.category.id,
        price: Number(editFormData.price) || 0,
        description: editFormData.description?.trim() || '–',
      };

      const response = await api.put(`${API_URL}/${editFormData.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        await fetchAllServices();
        setEditServiceId(null);
        setEditFormData(null);
        setSelectedServiceId(null);
        setSnackbarMessage('Cập nhật dịch vụ thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `Đã xảy ra lỗi khi cập nhật dịch vụ: ${err.message}`
          : 'Đã xảy ra lỗi khi cập nhật dịch vụ';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error('Lỗi khi cập nhật dịch vụ:', errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditServiceId(null);
    setEditFormData(null);
    setSelectedServiceId(null);
    setValidationErrors({});
  };

  const handleDeleteService = (id: string) => {
    setServiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const response = await api.delete(`${API_URL}/${serviceToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 204) {
        await fetchAllServices();
        setSnackbarMessage('Xóa dịch vụ thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `Không thể xóa dịch vụ: ${err.message}`
          : 'Đã xảy ra lỗi khi xóa dịch vụ';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error('Lỗi khi xóa dịch vụ:', errorMessage);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedServiceId((prev) => (prev === id && editServiceId !== id ? null : id));
    if (editServiceId === id) {
      setEditServiceId(null);
      setEditFormData(null);
      setValidationErrors({});
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setCurrentPage(newPage);
    setServices(filteredServices.slice((newPage - 1) * 10, newPage * 10));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (categoryId: string) => {
    setActiveCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
    handleFilterClose();
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Dịch vụ {'>'} Danh sách
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>
            Dịch vụ
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm dịch vụ"
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconButton
              onClick={handleFilterClick}
              sx={{
                bgcolor: '#fff',
                borderRadius: '8px',
                p: 1,
                '&:hover': { bgcolor: '#f0f0f0' },
              }}
              className="filter-button"
            >
              <FilterListIcon />
            </IconButton>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              {serviceCategories.map((cat) => (
                <MenuItem
                  key={cat.id}
                  onClick={() => handleFilterSelect(cat.id)}
                  selected={activeCategories.includes(cat.id)}
                  sx={{
                    '&:hover': { bgcolor: '#f0f0f0' },
                    '&.Mui-selected': {
                      bgcolor: '#e0f7fa',
                      '&:hover': { bgcolor: '#b2ebf2' },
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ color: activeCategories.includes(cat.id) ? '#00796b' : '#333' }}>
                    {cat.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              {activeCategories.length > 0 && (
                <Chip
                  label={`Danh mục: ${activeCategories.length} đã chọn`}
                  onDelete={() => setActiveCategories([])}
                  onClick={handleFilterClick}
                  sx={{
                    bgcolor: '#e0f7fa',
                    color: '#00796b',
                    fontWeight: 'bold',
                    height: '28px',
                    cursor: 'pointer',
                    '& .MuiChip-deleteIcon': { color: '#00796b' },
                  }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/service/add')}
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

      <Card elevation={3} sx={{ p: 0, mt: 0, borderRadius: '8px' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
              <Typography ml={2}>Đang tải danh sách dịch vụ...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" p={2} textAlign="center">
              {error}
            </Typography>
          ) : filteredServices.length === 0 ? (
            <Typography p={2} textAlign="center">
              {searchQuery || activeCategories.length > 0
                ? `Không tìm thấy dịch vụ phù hợp trong danh mục: ${
                    serviceCategories
                      .filter((c) => activeCategories.includes(c.id))
                      .map((c) => c.name)
                      .join(', ') || ''
                  }`
                : 'Không tìm thấy dịch vụ nào.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} className="promotions-table-container" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell sx={{ minWidth: '150px' }}><b>Nhóm dịch vụ</b></TableCell>
                      <TableCell sx={{ minWidth: '150px' }}><b>Tên dịch vụ</b></TableCell>
                      <TableCell sx={{ minWidth: '120px' }}><b>Giá mỗi đơn</b></TableCell>
                      <TableCell sx={{ minWidth: '200px' }}><b>Mô tả</b></TableCell>
                      <TableCell align="center" sx={{ minWidth: '150px' }}><b>Hành động</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {services.map((service) => (
                      <React.Fragment key={service.id}>
                        <TableRow hover>
                          <TableCell>{serviceCategories.find((c) => c.id === service.category.id)?.name || 'Không xác định'}</TableCell>
                          <TableCell>{service.name}</TableCell>
                          <TableCell>{service.price.toLocaleString('vi-VN')} đ</TableCell>
                          <TableCell>{service.description}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1}>
                              <IconButton
                                title={selectedServiceId === service.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                onClick={() => handleViewDetails(service.id)}
                                sx={{
                                  color: '#1976d2',
                                  bgcolor: '#e3f2fd',
                                  p: '6px',
                                  '&:hover': { bgcolor: '#bbdefb', boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)' },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                {selectedServiceId === service.id ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                              <IconButton
                                title="Chỉnh sửa dịch vụ"
                                onClick={() => handleEdit(service)}
                                sx={{
                                  color: '#FACC15',
                                  bgcolor: '#fef9c3',
                                  p: '6px',
                                  '&:hover': { bgcolor: '#fff9c4', boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)' },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                title="Xóa dịch vụ"
                                onClick={() => handleDeleteService(service.id)}
                                sx={{
                                  color: '#d32f2f',
                                  bgcolor: '#ffebee',
                                  p: '6px',
                                  '&:hover': { bgcolor: '#ffcdd2', boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)' },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} style={{ padding: 0 }}>
                            <Collapse in={selectedServiceId === service.id}>
                              <div className="promotion-detail-container">
                                {editServiceId === service.id && editFormData ? (
                                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                                      Chỉnh sửa dịch vụ
                                    </Typography>
                                    <Box display="flex" flexDirection="column" gap={2}>
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
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#ccc' },
                                            '&:hover fieldset': { borderColor: '#888' },
                                            '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
                                          },
                                          '& label': { backgroundColor: '#fff', padding: '0 4px' },
                                          '& label.Mui-focused': { color: '#1976d2' },
                                        }}
                                      />
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
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#ccc' },
                                            '&:hover fieldset': { borderColor: '#888' },
                                            '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
                                          },
                                          '& label': { backgroundColor: '#fff', padding: '0 4px' },
                                          '& label.Mui-focused': { color: '#1976d2' },
                                        }}
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
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#ccc' },
                                            '&:hover fieldset': { borderColor: '#888' },
                                            '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
                                          },
                                          '& label': { backgroundColor: '#fff', padding: '0 4px' },
                                          '& label.Mui-focused': { color: '#1976d2' },
                                        }}
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
                                            '&:hover': { backgroundColor: '#7B1FA2' },
                                            '&:disabled': { backgroundColor: '#a9a9a9' },
                                          }}
                                        >
                                          {editLoading ? <CircularProgress size={24} /> : 'Lưu'}
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
                                            '&:hover': { borderColor: '#d32f2f', backgroundColor: '#ffebee' },
                                            '&:disabled': { color: '#a9a9a9', borderColor: '#a9a9a9' },
                                          }}
                                        >
                                          Hủy
                                        </Button>
                                      </Box>
                                      {error && <Typography color="error" mt={1}>{error}</Typography>}
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                                      Thông tin dịch vụ
                                    </Typography>
                                    <Table className="promotions-detail-table">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell><strong>Tên dịch vụ:</strong> {service.name}</TableCell>
                                          <TableCell><strong>Nhóm dịch vụ:</strong> {serviceCategories.find((c) => c.id === service.category.id)?.name || 'Không xác định'}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell><strong>Giá mỗi đơn:</strong> {service.price.toLocaleString('vi-VN')} đ</TableCell>
                                          <TableCell><strong>Mô tả:</strong> {service.description}</TableCell>
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
              {lastPage > 1 && (
                <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                  <Pagination
                    count={lastPage}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    sx={{ '& .MuiPaginationItem-root': { fontSize: '14px' } }}
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Xác nhận xóa dịch vụ
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa dịch vụ này không? Hành động này không thể hoàn tác.
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
            sx={{
              bgcolor: '#d32f2f',
              '&:hover': { bgcolor: '#b71c1c' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 2.5,
              py: 0.7,
            }}
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

export default Service;