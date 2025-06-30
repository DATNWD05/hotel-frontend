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
  Card,
  CardContent,
  Menu,
  MenuItem,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import '../../css/Amenities.css';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

interface RawServiceCategory {
  id?: number | string;
  name?: string;
  description?: string | null | undefined;
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
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ServiceCategory | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const navigate = useNavigate();

  const API_URL = '/service-categories';
  const PER_PAGE = 10;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      let allData: ServiceCategory[] = [];
      let page = 1;

      while (true) {
        const response = await api.get<{ data: RawServiceCategory[]; meta: Meta }>(
          `${API_URL}?page=${page}&per_page=${PER_PAGE}&search=${searchQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status !== 200) {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }

        if (!Array.isArray(response.data.data)) {
          throw new Error('Dữ liệu danh mục không đúng định dạng.');
        }

        const sanitizedData: ServiceCategory[] = response.data.data.map((cat) => ({
          id: cat.id != null ? String(cat.id) : '',
          name: cat.name?.trim() || 'Không xác định',
          description: cat.description?.trim() ?? '–',
        }));

        allData = [...allData, ...sanitizedData];

        if (page >= response.data.meta.last_page) break;
        page++;
      }

      setAllCategories(allData);
      setCategories(allData.slice(0, PER_PAGE));
      setLastPage(Math.ceil(allData.length / PER_PAGE));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `Không thể tải danh mục dịch vụ: ${err.message}`
          : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      if (err instanceof Error && err.message.includes('token')) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
      console.error('Lỗi khi tải danh mục dịch vụ:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Danh sách Danh mục Dịch vụ';
    fetchCategories();
  }, [searchQuery]);

  useEffect(() => {
    let filtered = [...allCategories];

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilters.length > 0 && !activeFilters.includes('all')) {
      // Placeholder for status filtering if API supports it
    }

    setCategories(filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));
    setLastPage(Math.ceil(filtered.length / PER_PAGE));
  }, [searchQuery, activeFilters, currentPage, allCategories]);

  const validateForm = (data: ServiceCategory): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name?.trim()) errors.name = 'Tên danh mục không được để trống';
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
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const handleEdit = (category: ServiceCategory) => {
    setSelectedCategoryId(category.id);
    setEditCategoryId(category.id);
    setEditFormData({ ...category });
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
        description: editFormData.description?.trim() || '–',
      };

      const response = await api.put(`${API_URL}/${editFormData.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        await fetchCategories();
        setEditCategoryId(null);
        setEditFormData(null);
        setSelectedCategoryId(null);
        setSnackbarMessage('Cập nhật danh mục thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `Đã xảy ra lỗi khi cập nhật danh mục: ${err.message}`
          : 'Đã xảy ra lỗi khi cập nhật danh mục';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      if (err instanceof Error && err.message.includes('token')) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
      console.error('Lỗi khi cập nhật danh mục:', errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditCategoryId(null);
    setEditFormData(null);
    setSelectedCategoryId(null);
    setValidationErrors({});
  };

  const handleViewDetails = (id: string) => {
    setSelectedCategoryId((prev) => (prev === id && editCategoryId !== id ? null : id));
    if (editCategoryId === id) {
      setEditCategoryId(null);
      setEditFormData(null);
      setValidationErrors({});
    }
  };

  const handleDelete = (id: string) => {
    const category = allCategories.find((cat) => cat.id === id);
    if (!category) {
      setSnackbarMessage('Không tìm thấy danh mục để xóa');
      setSnackbarOpen(true);
      return;
    }
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const category = allCategories.find((cat) => cat.id === categoryToDelete);
      const response = await api.delete(`${API_URL}/${categoryToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 204) {
        await fetchCategories();
        setSnackbarMessage(`Xóa danh mục "${category?.name || 'Không xác định'}" thành công!`);
        setSnackbarOpen(true);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message.includes('token')
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            : `Không thể xóa danh mục: ${err.message}`
          : 'Đã xảy ra lỗi khi xóa danh mục';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      if (err instanceof Error && err.message.includes('token')) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
      console.error('Lỗi khi xóa danh mục:', errorMessage);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setCurrentPage(newPage);
    setCategories(allCategories.slice((newPage - 1) * PER_PAGE, newPage * PER_PAGE));
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filter: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(filter)) {
        return prev.filter((f) => f !== filter);
      } else {
        return [...prev, filter].filter((f) => f !== 'all');
      }
    });
    setCurrentPage(1);
    handleFilterClose();
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
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
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
                width: { xs: '100%', sm: 300 },
                bgcolor: '#fff',
                borderRadius: '8px',
                '& input': { fontSize: '15px' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#ccc' },
                  '&:hover fieldset': { borderColor: '#888' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
                },
                '& label': { backgroundColor: '#fff', padding: '0 4px' },
                '& label.Mui-focused': { color: '#1976d2' },
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
                transition: 'all 0.2s ease-in-out',
              }}
              className="filter-button"
            >
              <FilterListIcon />
            </IconButton>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              sx={{ '& .MuiPaper-root': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}
            >
              {['all', 'active', 'inactive'].map((filter) => (
                <MenuItem
                  key={filter}
                  onClick={() => handleFilterSelect(filter)}
                  selected={activeFilters.includes(filter)}
                  sx={{
                    '&:hover': { bgcolor: '#f0f0f0' },
                    '&.Mui-selected': { bgcolor: '#e0f7fa', '&:hover': { bgcolor: '#b2ebf2' } },
                  }}
                >
                  <Typography variant="body2" sx={{ color: activeFilters.includes(filter) ? '#00796b' : '#333' }}>
                    {filter === 'all' ? 'Tất cả' : filter === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              {activeFilters.length > 0 && (
                <Chip
                  label={`Bộ lọc: ${activeFilters.length} đã chọn`}
                  onDelete={() => setActiveFilters([])}
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
                transition: 'all 0.2s ease-in-out',
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
              <Typography ml={2}>Đang tải danh sách danh mục...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" p={2} textAlign="center">
              {error}
            </Typography>
          ) : categories.length === 0 ? (
            <Typography p={2} textAlign="center">
              {searchQuery || activeFilters.length > 0
                ? 'Không tìm thấy danh mục phù hợp'
                : 'Không tìm thấy danh mục dịch vụ nào.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} className="promotions-table-container" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell sx={{ minWidth: '150px' }}><b>Tên danh mục</b></TableCell>
                      <TableCell sx={{ minWidth: '200px' }}><b>Mô tả</b></TableCell>
                      <TableCell align="center" sx={{ minWidth: '150px' }}><b>Hành động</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((cat) => (
                      <React.Fragment key={cat.id}>
                        <TableRow hover>
                          <TableCell>{cat.name}</TableCell>
                          <TableCell>{cat.description}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1} sx={{ flexWrap: 'wrap' }}>
                              <IconButton
                                title={selectedCategoryId === cat.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                onClick={() => handleViewDetails(cat.id)}
                                sx={{
                                  color: '#1976d2',
                                  bgcolor: '#e3f2fd',
                                  p: '6px',
                                  '&:hover': { bgcolor: '#bbdefb', boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)' },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                {selectedCategoryId === cat.id ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                              <IconButton
                                title="Chỉnh sửa danh mục"
                                onClick={() => handleEdit(cat)}
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
                                title="Xóa danh mục"
                                onClick={() => handleDelete(cat.id)}
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
                          <TableCell colSpan={3} style={{ padding: 0 }}>
                            <Collapse in={selectedCategoryId === cat.id}>
                              <div className="promotion-detail-container">
                                {editCategoryId === cat.id && editFormData ? (
                                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                                      Chỉnh sửa danh mục
                                    </Typography>
                                    <Box display="flex" flexDirection="column" gap={2}>
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
                                            transition: 'all 0.2s ease-in-out',
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
                                            transition: 'all 0.2s ease-in-out',
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
                                      Thông tin danh mục
                                    </Typography>
                                    <Table className="promotions-detail-table">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell><strong>Tên danh mục:</strong> {cat.name}</TableCell>
                                          <TableCell><strong>Mô tả:</strong> {cat.description}</TableCell>
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
        sx={{ '& .MuiDialog-paper': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xóa danh mục</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không thể hoàn tác.
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Lưu ý: Nếu danh mục có dịch vụ liên kết, bạn cần xóa hoặc chuyển các dịch vụ sang danh mục khác trước.
          </Typography>
          {categoryToDelete && (
            <Button
              variant="text"
              onClick={() => navigate(`/service?category_id=${categoryToDelete}`)}
              sx={{
                mt: 2,
                color: '#1976d2',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Xem danh sách dịch vụ liên kết
            </Button>
          )}
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
              transition: 'all 0.2s ease-in-out',
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
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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