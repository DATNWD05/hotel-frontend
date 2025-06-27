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
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import '../../css/AmenitiesCategory.css';

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

const Amenities: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [filteredAmenities, setFilteredAmenities] = useState<Amenity[]>([]);
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategory[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [amenityToDelete, setAmenityToDelete] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const fetchAllAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      let allData: Amenity[] = [];
      let page = 1;

      while (true) {
        const url = `http://127.0.0.1:8000/api/amenities?page=${page}${
          activeCategories.length > 0
            ? `&category_id=${activeCategories.join(',')}`
            : ''
        }`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Lỗi tải tiện ích: ${response.status} ${response.statusText}. Chi tiết: ${text}`);
        }

        const data: { data: RawAmenity[]; meta: Meta } = await response.json();
        const mapped: Amenity[] = data.data.map((item) => {
          const categoryId = item.category?.id != null ? String(item.category.id) : '0';
          return {
            id: item.id != null ? String(item.id) : '',
            category_id: categoryId,
            code: item.code || 'V101',
            name: item.name || 'Không xác định',
            description: item.description || '–',
            icon: item.icon || '',
            price: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.-]+/g, '')) || 10000 : item.price != null ? Number(item.price) : 10000,
            default_quantity: typeof item.default_quantity === 'string' ? parseInt(item.default_quantity, 10) || 1 : item.default_quantity != null ? Number(item.default_quantity) : 1,
            status: item.status || 'active',
          };
        });

        allData = [...allData, ...mapped];

        if (page >= data.meta.last_page) break;
        page++;
      }

      setAllAmenities(allData);
      setFilteredAmenities(allData);
      setAmenities(allData.slice(0, 10));
      setLastPage(Math.ceil(allData.length / 10));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Không thể tải danh sách tiện ích: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Danh sách Tiện ích';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setSnackbarMessage('Không tìm thấy token xác thực');
      setSnackbarOpen(true);
      return;
    }

    fetch('http://127.0.0.1:8000/api/amenity-categories', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(`Lỗi tải danh mục: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
          });
        }
        return res.json();
      })
      .then((response) => {
        const data = response.data || response;
        if (!Array.isArray(data)) {
          setError('Dữ liệu danh mục không đúng định dạng');
          setSnackbarMessage('Dữ liệu danh mục không đúng định dạng');
          setSnackbarOpen(true);
          return;
        }
        const categories: AmenityCategory[] = data.map((cat: RawAmenityCategory) => ({
          id: cat.id != null ? String(cat.id) : '',
          name: cat.name || 'Không xác định',
        }));
        setAmenityCategories(categories);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? `Không thể tải danh mục tiện ích: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      });

    fetchAllAmenities();
  }, [activeCategories]);

  useEffect(() => {
    let filtered = [...allAmenities];

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((amenity) =>
        amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amenity.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeCategories.length > 0) {
      filtered = filtered.filter((amenity) => activeCategories.includes(amenity.category_id));
    }

    setFilteredAmenities(filtered);
    setLastPage(Math.ceil(filtered.length / 10));
    setAmenities(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, activeCategories, allAmenities, currentPage]);

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
        throw new Error('Không tìm thấy token xác thực');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/amenities/${amenityToDelete}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Lỗi xóa tiện ích: ${response.status} ${response.statusText}. Chi tiết: ${text}`);
      }

      await fetchAllAmenities();
      setSnackbarMessage('Xóa tiện ích thành công!');
      setSnackbarOpen(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Không thể xóa tiện ích: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setAmenityToDelete(null);
    }
  };

  const handleEditAmenity = (id: string) => {
    navigate(`/amenities/edit/${id}`);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    setAmenities(filteredAmenities.slice((page - 1) * 10, page * 10));
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
          Tiện ích {'>'} Danh sách
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>
            Tiện ích
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
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
              {amenityCategories.map((cat) => (
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

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <div className="promotions-loading-container">
              <CircularProgress />
              <Typography>Đang tải danh sách tiện ích...</Typography>
            </div>
          ) : error ? (
            <Typography color="error" className="promotions-error-message">
              {error}
            </Typography>
          ) : filteredAmenities.length === 0 ? (
            <Typography className="promotions-no-data">
              {searchQuery || activeCategories.length > 0
                ? `Không tìm thấy tiện ích phù hợp trong danh mục: ${amenityCategories.find((c) => activeCategories.includes(c.id))?.name || ''}`
                : 'Không tìm thấy tiện ích nào.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} className="promotions-table-container">
                <Table className="promotions-table" sx={{ width: '100%' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell><b>ID</b></TableCell>
                      <TableCell><b>Nhóm</b></TableCell>
                      <TableCell><b>Mã</b></TableCell>
                      <TableCell><b>Tên</b></TableCell>
                      <TableCell><b>Mô tả</b></TableCell>
                      <TableCell><b>Biểu tượng</b></TableCell>
                      <TableCell><b>Giá</b></TableCell>
                      <TableCell><b>Số lượng mặc định</b></TableCell>
                      <TableCell><b>Trạng thái</b></TableCell>
                      <TableCell align="center"><b>Hành động</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {amenities.map((amenity) => (
                      <TableRow key={amenity.id} hover>
                        <TableCell>{amenity.id}</TableCell>
                        <TableCell>{amenityCategories.find((c) => c.id === amenity.category_id)?.name || 'Không xác định'}</TableCell>
                        <TableCell>{amenity.code}</TableCell>
                        <TableCell>{amenity.name}</TableCell>
                        <TableCell>{amenity.description}</TableCell>
                        <TableCell>
                          {amenity.icon ? (
                            <img src={amenity.icon} alt={amenity.name} width="24" />
                          ) : (
                            'Không có'
                          )}
                        </TableCell>
                        <TableCell>{amenity.price.toLocaleString('vi-VN')} đ</TableCell>
                        <TableCell>{amenity.default_quantity}</TableCell>
                        <TableCell>
                          <span style={{ color: amenity.status === 'active' ? '#388E3C' : '#D32F2F', fontWeight: 'bold' }}>
                            {amenity.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={1}>
                            <IconButton
                              title="Chỉnh sửa"
                              sx={{
                                color: '#FACC15',
                                bgcolor: '#fef9c3',
                                '&:hover': {
                                  bgcolor: '#fff9c4',
                                  boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)',
                                },
                                transition: 'all 0.2s ease-in-out',
                              }}
                              onClick={() => handleEditAmenity(amenity.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              title="Xóa"
                              sx={{
                                color: '#d32f2f',
                                bgcolor: '#ffebee',
                                '&:hover': {
                                  bgcolor: '#ffcdd2',
                                  boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)',
                                },
                                transition: 'all 0.2s ease-in-out',
                              }}
                              onClick={() => handleDeleteAmenity(amenity.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
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
          Xác nhận xóa tiện ích
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa tiện ích này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            className="promotions-btn-cancel"
            sx={{
              color: '#d32f2f',
              borderColor: '#d32f2f',
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