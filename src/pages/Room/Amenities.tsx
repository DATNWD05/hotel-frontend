import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { AxiosError } from 'axios';
import '../../css/Amenities.css';
// tái dùng style layout chi tiết như Customer.tsx
import '../../css/Customer.css';

interface Amenity {
  id: string;
  category_id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  default_quantity: number;
  status: string;
}

interface AmenityCategory {
  id: string;
  name: string;
}

interface RawAmenityCategory {
  id?: number | string;
  name?: string;
}

interface CategoryData {
  id?: string | number | null;
  name?: string | null;
}

interface RawAmenity {
  id?: number | string;
  category_id?: number | string | null;
  code?: string | null;
  name?: string;
  description?: string;
  icon?: string;
  price?: number | string | null;
  default_quantity?: number | string | null;
  status?: string;
  category?: CategoryData | null;
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
  price?: string;
  default_quantity?: string;
}

// helper format tiền VND
const vnd = (n: number | string) => {
  const num = typeof n === 'string' ? Number(n) : n;
  return isNaN(num) ? '0 đ' : num.toLocaleString('vi-VN') + ' đ';
};

const Amenities: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [filteredAmenities, setFilteredAmenities] = useState<Amenity[]>([]);
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategory[]>([
    { id: 'all', name: 'Tất cả' },
  ]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [amenityToDelete, setAmenityToDelete] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
  const [editAmenityId, setEditAmenityId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Amenity | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAllAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      let allData: Amenity[] = [];
      let page = 1;

      while (true) {
        const url = `/amenities?page=${page}${
          activeCategories.length > 0 && !activeCategories.includes('all')
            ? `&category_id=${activeCategories.join(',')}`
            : ''
        }`;
        const response = await api.get<{ data: RawAmenity[]; meta: Meta }>(url);
        const mapped: Amenity[] = response.data.data.map((item) => {
          const categoryId = item.category?.id != null ? String(item.category.id) : '0';
          return {
            id: item.id != null ? String(item.id) : '',
            category_id: categoryId,
            code: item.code || 'V101',
            name: item.name || 'Không xác định',
            description: item.description || '–',
            icon: item.icon || '',
            price:
              typeof item.price === 'string'
                ? parseFloat(item.price.replace(/[^0-9.-]+/g, '')) || 10000
                : item.price != null
                ? Number(item.price)
                : 10000,
            default_quantity:
              typeof item.default_quantity === 'string'
                ? parseInt(item.default_quantity, 10) || 1
                : item.default_quantity != null
                ? Number(item.default_quantity)
                : 1,
            status: item.status || 'active',
          };
        });

        allData = [...allData, ...mapped];

        if (page >= response.data.meta.last_page) break;
        page++;
      }

      setAllAmenities(allData);
      setFilteredAmenities(allData);
      setAmenities(allData.slice(0, 10));
      setLastPage(Math.ceil(allData.length / 10));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (err.response?.data as any)?.message || `Không thể tải danh sách tiện ích: ${err.message}`
          : err instanceof Error
          ? `Không thể tải danh sách tiện ích: ${err.message}`
          : 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Danh sách Tiện ích';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get<{ data: RawAmenityCategory[] }>('/amenity-categories');
        const categories: AmenityCategory[] = [
          { id: 'all', name: 'Tất cả' },
          ...response.data.data.map((cat: RawAmenityCategory) => ({
            id: cat.id != null ? String(cat.id) : '',
            name: cat.name || 'Không xác định',
          })),
        ];
        setAmenityCategories(categories);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof AxiosError
            ? err.response?.status === 401
              ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              : (err.response?.data as any)?.message || `Không thể tải danh mục tiện ích: ${err.message}`
            : err instanceof Error
            ? `Không thể tải danh mục tiện ích: ${err.message}`
            : 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(errorMessage);
        if (err instanceof AxiosError && err.response?.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
        }
      }
    };

    fetchCategories();
    fetchAllAmenities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    let filtered = [...allAmenities];

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (amenity) =>
          amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          amenity.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeCategories.length > 0 && !activeCategories.includes('all')) {
      filtered = filtered.filter((amenity) => activeCategories.includes(amenity.category_id));
    }

    setFilteredAmenities(filtered);
    setLastPage(Math.ceil(filtered.length / 10));
    setAmenities(filtered.slice((currentPage - 1) * 10, currentPage * 10));
    if (currentPage > Math.ceil(filtered.length / 10) && filtered.length > 0) {
      setCurrentPage(Math.ceil(filtered.length / 10));
    }
  }, [searchQuery, activeCategories, allAmenities, currentPage]);

  const validateForm = (data: Amenity): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Tên tiện ích không được để trống';
    if (data.description && data.description.length > 500) errors.description = 'Mô tả không được vượt quá 500 ký tự';
    if (data.price <= 0) errors.price = 'Giá phải lớn hơn 0';
    if (data.default_quantity <= 0) errors.default_quantity = 'Số lượng mặc định phải lớn hơn 0';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = {
        ...editFormData,
        [name]: name === 'price' || name === 'default_quantity' ? Number(value) : value,
      } as Amenity;
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
      toast.error('Vui lòng sửa các lỗi trong biểu mẫu trước khi lưu.');
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await api.put(`/amenities/${editFormData.id}`, {
        category_id: editFormData.category_id,
        code: editFormData.code,
        name: editFormData.name,
        description: editFormData.description,
        icon: editFormData.icon,
        price: editFormData.price,
        default_quantity: editFormData.default_quantity,
        status: editFormData.status,
      });

      if (response.status === 200 || response.status === 201) {
        setAllAmenities((prev) => prev.map((a) => (a.id === editFormData.id ? { ...editFormData } : a)));
        setFilteredAmenities((prev) => prev.map((a) => (a.id === editFormData.id ? { ...editFormData } : a)));
        setAmenities((prev) => prev.map((a) => (a.id === editFormData.id ? { ...editFormData } : a)));
        setEditAmenityId(null);
        setEditFormData(null);
        setSelectedAmenityId(null);
        toast.success('Cập nhật tiện ích thành công!');
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (err.response?.data as any)?.message || `Không thể cập nhật tiện ích: ${err.message}`
          : err instanceof Error
          ? `Không thể cập nhật tiện ích: ${err.message}`
          : 'Lỗi không xác định';
      setEditError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
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

  const handleDeleteAmenity = async (id: string) => {
    setAmenityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!amenityToDelete) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await api.delete(`/amenities/${amenityToDelete}`);
      if (response.status === 200 || response.status === 204) {
        await fetchAllAmenities();
        toast.success('Xóa tiện ích thành công!');
        if (amenities.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (err.response?.data as any)?.message || `Không thể xóa tiện ích: ${err.message}`
          : err instanceof Error
          ? `Không thể xóa tiện ích: ${err.message}`
          : 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setAmenityToDelete(null);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
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
        return [...prev, categoryId].filter((id) => id !== 'all');
      }
    });
    setCurrentPage(1);
    handleFilterClose();
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Tiện ích {'>'} Danh sách
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>
            Tiện ích
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm tiện ích"
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
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              sx={{ '& .MuiPaper-root': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}
            >
              {amenityCategories.map((cat) => (
                <MenuItem
                  key={cat.id}
                  onClick={() => handleFilterSelect(cat.id)}
                  selected={activeCategories.includes(cat.id)}
                  sx={{
                    '&:hover': { bgcolor: '#f0f0f0' },
                    '&.Mui-selected': { bgcolor: '#e0f7fa', '&:hover': { bgcolor: '#b2ebf2' } },
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
              onClick={() => navigate('/amenities/add')}
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
              <Typography ml={2}>Đang tải danh sách tiện ích...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" p={2} textAlign="center">
              {error}
            </Typography>
          ) : filteredAmenities.length === 0 ? (
            <Typography p={2} textAlign="center">
              {searchQuery || activeCategories.length > 0
                ? `Không tìm thấy tiện ích phù hợp trong danh mục: ${
                    amenityCategories.find((c) => activeCategories.includes(c.id))?.name || 'Tất cả'
                  }`
                : 'Không tìm thấy tiện ích nào.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} className="promotions-table-container" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell sx={{ minWidth: '120px' }}><b>Danh mục</b></TableCell>
                      <TableCell sx={{ minWidth: '100px' }}><b>Mã</b></TableCell>
                      <TableCell sx={{ minWidth: '150px' }}><b>Tên</b></TableCell>
                      <TableCell sx={{ minWidth: '120px' }}><b>Giá</b></TableCell>
                      <TableCell sx={{ minWidth: '120px' }}><b>Số lượng mặc định</b></TableCell>
                      <TableCell sx={{ minWidth: '120px' }}><b>Trạng thái</b></TableCell>
                      <TableCell align="center" sx={{ minWidth: '150px' }}><b>Hành động</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {amenities.map((amenity) => (
                      <React.Fragment key={amenity.id}>
                        <TableRow hover>
                          <TableCell>{amenityCategories.find((c) => c.id === amenity.category_id)?.name || 'Không xác định'}</TableCell>
                          <TableCell>{amenity.code}</TableCell>
                          <TableCell>{amenity.name}</TableCell>
                          <TableCell>{vnd(amenity.price)}</TableCell>
                          <TableCell>{amenity.default_quantity}</TableCell>
                          <TableCell>
                            <span style={{ color: amenity.status === 'active' ? '#388E3C' : '#D32F2F', fontWeight: 'bold' }}>
                              {amenity.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1} sx={{ flexWrap: 'wrap' }}>
                              <IconButton
                                title={selectedAmenityId === amenity.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                onClick={() => handleViewDetails(amenity.id)}
                                sx={{
                                  color: '#1976d2',
                                  bgcolor: '#e3f2fd',
                                  p: '6px',
                                  '&:hover': { bgcolor: '#bbdefb', boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)' },
                                }}
                              >
                                {selectedAmenityId === amenity.id ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                              <IconButton
                                title="Chỉnh sửa tiện ích"
                                onClick={() => handleEdit(amenity)}
                                sx={{
                                  color: '#FACC15',
                                  bgcolor: '#fef9c3',
                                  p: '6px',
                                  '&:hover': { bgcolor: '#fff9c4', boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)' },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                title="Xóa tiện ích"
                                onClick={() => handleDeleteAmenity(amenity.id)}
                                sx={{
                                  color: '#d32f2f',
                                  bgcolor: '#ffebee',
                                  p: '6px',
                                  '&:hover': { bgcolor: '#ffcdd2', boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)' },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>

                        {/* Chi tiết (giống layout Customer.tsx) */}
                        <TableRow>
                          <TableCell colSpan={7} style={{ padding: 0 }}>
                            <Collapse in={selectedAmenityId === amenity.id}>
                              <Box
                                sx={{
                                  width: '100%',
                                  bgcolor: '#f9f9f9',
                                  px: 3,
                                  py: 2,
                                  borderTop: '1px solid #ddd',
                                }}
                              >
                                <div className="customer-detail-container">
                                  {editAmenityId === amenity.id && editFormData ? (
                                    // EDIT MODE
                                    <>
                                      <h3>Chỉnh sửa Tiện ích</h3>
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
                                        <Box display="flex" gap={2}>
                                          <TextField
                                            label="Giá"
                                            name="price"
                                            type="number"
                                            value={editFormData.price}
                                            onChange={handleChange}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!validationErrors.price}
                                            helperText={validationErrors.price}
                                            InputProps={{
                                              endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                                            }}
                                          />
                                          <TextField
                                            label="Số lượng mặc định"
                                            name="default_quantity"
                                            type="number"
                                            value={editFormData.default_quantity}
                                            onChange={handleChange}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!validationErrors.default_quantity}
                                            helperText={validationErrors.default_quantity}
                                          />
                                        </Box>
                                      </Box>

                                      <Box pb={3} mt={2} display="flex" gap={2}>
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
                                          color="secondary"
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
                                      {editError && (
                                        <Typography color="error" mt={1}>
                                          {editError}
                                        </Typography>
                                      )}
                                    </>
                                  ) : (
                                    // VIEW MODE: bảng 2 cột giống Customer.tsx
                                    <>
                                      <h3>Thông tin Tiện ích</h3>
                                      <Table className="customer-detail-table" sx={{ mb: 2 }}>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Danh mục:</strong>{' '}
                                              {amenityCategories.find((c) => c.id === amenity.category_id)?.name || 'Không xác định'}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Mã:</strong> {amenity.code}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Tên:</strong> {amenity.name}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Giá:</strong> {vnd(amenity.price)}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Số lượng mặc định:</strong> {amenity.default_quantity}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Trạng thái:</strong>{' '}
                                              <Typography
                                                component="span"
                                                sx={{
                                                  color: amenity.status === 'active' ? '#388E3C' : '#D32F2F',
                                                  fontWeight: 'bold',
                                                }}
                                              >
                                                {amenity.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Biểu tượng:</strong>{' '}
                                              {amenity.icon ? (
                                                <img
                                                  src={amenity.icon}
                                                  alt={amenity.name}
                                                  width={24}
                                                  height={24}
                                                  style={{ objectFit: 'contain', verticalAlign: 'middle' }}
                                                  onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                  }}
                                                />
                                              ) : (
                                                'Không có'
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Mô tả:</strong> {amenity.description || '—'}
                                            </TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </>
                                  )}
                                </div>
                              </Box>
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
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xóa tiện ích</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa tiện ích này không? Hành động này không thể hoàn tác.</Typography>
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
    </div>
  );
};

export default Amenities;
