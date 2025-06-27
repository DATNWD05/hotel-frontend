import React, { useState, useEffect, useMemo, SyntheticEvent } from 'react';
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
  Checkbox,
  FormControlLabel,
  Button,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  MenuItem,
  Popover,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { Link } from 'react-router-dom';
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

interface ServiceFilterProps {
  categories: ServiceCategory[];
  onFilterChange: (filters: { searchService: string; searchCategory: string[] }) => void;
  onResetFilters: () => void;
}

const ServiceFilter: React.FC<ServiceFilterProps> = ({ categories, onFilterChange, onResetFilters }) => {
  const [searchService, setSearchService] = useState('');
  const [searchCategory, setSearchCategory] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleSearchServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearchService(newSearch);
    onFilterChange({ searchService: newSearch, searchCategory });
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const categoryId = event.target.name;
    setSearchCategory((prev) => {
      if (event.target.checked) {
        return prev.includes(categoryId) ? prev : [...prev.filter((id) => id !== 'all'), categoryId];
      } else {
        return prev.filter((id) => id !== categoryId);
      }
    });
    onFilterChange({ searchService, searchCategory: searchCategory.filter((id) => id !== 'all') });
  };

  const handleReset = () => {
    setSearchService('');
    setSearchCategory([]);
    onResetFilters();
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box className="promotion-filter-container">
      <Box sx={{ position: 'relative', width: '300px' }}>
        <TextField
          label="Tìm kiếm dịch vụ"
          variant="outlined"
          size="small"
          value={searchService}
          onChange={handleSearchServiceChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
          }}
          sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
        />
      </Box>
      <Box sx={{ width: '300px', position: 'relative' }}>
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: '12px',
            bgcolor: '#fff',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onClick={handleClick}
        >
          <Typography sx={{ color: searchCategory.length > 0 ? '#00796b' : '#666' }}>
            {searchCategory.length > 0 ? `${searchCategory.length} danh mục được chọn` : 'Chọn danh mục'}
          </Typography>
          <ExpandMoreIcon />
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
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
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxHeight: '300px',
              overflowY: 'auto',
              mt: 1,
              p: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
            <FormControlLabel
              control={<Checkbox checked={searchCategory.length === 0 || searchCategory.includes('all')} name="all" onChange={handleCategoryChange} />}
              label="Tất cả"
              sx={{ mb: 0.5 }}
            />
            {categories.map((category) => (
              <FormControlLabel
                key={category.id}
                control={<Checkbox checked={searchCategory.includes(category.id)} name={category.id} onChange={handleCategoryChange} />}
                label={category.name}
                sx={{ mb: 0.5 }}
              />
            ))}
          </Box>
        </Popover>
      </Box>
      {(searchService || searchCategory.length > 0) && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<ClearIcon />}
          onClick={handleReset}
          sx={{
            textTransform: 'none',
            color: '#d32f2f',
            borderColor: '#d32f2f',
            borderRadius: '12px',
            '&:hover': { borderColor: '#c62828', bgcolor: '#ffebee' },
          }}
        >
          Xóa bộ lọc
        </Button>
      )}
    </Box>
  );
};

const Service: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [filters, setFilters] = useState<{ searchService: string; searchCategory: string[] }>({
    searchService: '',
    searchCategory: [],
  });
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
        const categories: ServiceCategory[] = data.map((cat: RawServiceCategory) => ({
          id: cat.id.toString(),
          name: cat.name,
        }));
        setServiceCategories(categories);
      } catch (err) {
        setError(err instanceof Error ? `Không thể tải danh mục dịch vụ: ${err.message}` : 'Lỗi không xác định');
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
        if (filters.searchService.trim()) {
          url += `&search=${encodeURIComponent(filters.searchService)}`;
        }
        if (filters.searchCategory.length > 0 && !filters.searchCategory.includes('all')) {
          url += `&category_id=${filters.searchCategory.join(',')}`;
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
        setError(err instanceof Error ? `Không thể tải danh sách dịch vụ: ${err.message}` : 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [currentPage, filters]);

  const filteredServices = useMemo(() => {
    return services.filter((svc) =>
      (filters.searchCategory.length === 0 || filters.searchCategory.includes('all') || filters.searchCategory.includes(svc.category.id)) &&
      svc.name.toLowerCase().includes(filters.searchService.toLowerCase())
    );
  }, [services, filters]);

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
      setValidationErrors(validateForm(updatedData));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as string;
    if (editFormData) {
      const selectedCategory = serviceCategories.find((cat) => cat.id === value);
      const updatedData = {
        ...editFormData,
        category: selectedCategory ? { id: value, name: selectedCategory.name } : editFormData.category,
      };
      setEditFormData(updatedData);
      setValidationErrors(validateForm(updatedData));
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

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handleFilterChange = (newFilters: { searchService: string; searchCategory: string[] }) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ searchService: '', searchCategory: [] });
    setCurrentPage(1);
  };

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Danh Sách <b>Dịch Vụ</b>
          </h2>
          <Box display="flex" alignItems="center" gap={2}>
            <ServiceFilter
              categories={serviceCategories}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
            <Link className="promotion-btn-add" to="/service/add">
              Thêm mới
            </Link>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="promotion-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách dịch vụ...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotion-error-message">
          {error}
        </Typography>
      ) : filteredServices.length === 0 ? (
        <Typography className="promotion-no-data">
          {filters.searchService || filters.searchCategory.length > 0
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
                {filteredServices.map((svc) => (
                  <React.Fragment key={svc.id}>
                    <TableRow hover>
                      <TableCell>{svc.name}</TableCell>
                      <TableCell>{svc.category.name}</TableCell>
                      <TableCell>{svc.price.toLocaleString()} đ</TableCell>
                      <TableCell>{svc.description}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="promotion-action-view"
                          title={selectedServiceId === svc.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          onClick={() => handleViewDetails(svc.id)}
                          sx={{ color: '#1a73e8' }}
                        >
                          {selectedServiceId === svc.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <IconButton
                          className="promotion-action-edit"
                          title="Chỉnh sửa dịch vụ"
                          onClick={() => handleEdit(svc)}
                          sx={{ color: '#FACC15' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          className="promotion-action-delete"
                          title="Xóa dịch vụ"
                          onClick={() => handleDelete(svc.id)}
                          sx={{ color: '#d32f2f' }}
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
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                    <TextField
                                      select
                                      label="Nhóm dịch vụ"
                                      name="category"
                                      value={editFormData.category.id}
                                      onChange={handleSelectChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.category}
                                      helperText={validationErrors.category}
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    >
                                      <MenuItem value="">Chọn danh mục</MenuItem>
                                      {serviceCategories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                          {cat.name}
                                        </MenuItem>
                                      ))}
                                    </TextField>
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
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                  </Box>
                                  <Box mt={2} display="flex" gap={2}>
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      onClick={handleSave}
                                      disabled={editLoading}
                                      sx={{ borderRadius: '12px', textTransform: 'none' }}
                                    >
                                      Lưu
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      className="promotion-btn-cancel"
                                      onClick={handleCancel}
                                      disabled={editLoading}
                                      sx={{ borderRadius: '12px', textTransform: 'none' }}
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
              sx={{ '& .MuiPaginationItem-root': { borderRadius: '12px' } }}
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
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            sx={{ borderRadius: '12px', textTransform: 'none' }}
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
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Service;