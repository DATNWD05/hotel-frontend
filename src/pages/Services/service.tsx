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
import axios from 'axios';
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
        const response = await axios.get<{ data: RawService[]; meta: Meta }>(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status !== 200) {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }

        const mapped: Service[] = response.data.data.map((item) => ({
          id: String(item.id),
          name: item.name || 'Không xác định',
          category: {
            id: String(item.category.id),
            name: item.category.name || 'Không xác định',
          },
          price: item.price || 0,
          description: item.description || '–',
        }));

        allData = [...allData, ...mapped];

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
          : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
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

    axios
      .get('http://127.0.0.1:8000/api/service-categories', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      .then((response) => {
        const data = response.data.data || response.data;
        if (!Array.isArray(data)) {
          throw new Error('Dữ liệu danh mục không đúng định dạng');
        }
        const categories: ServiceCategory[] = data.map((cat: { id: number | string; name: string }) => ({
          id: String(cat.id),
          name: cat.name || 'Không xác định',
        }));
        setServiceCategories(categories);
      })
      .catch((err) => {
        const errorMessage =
          err instanceof Error
            ? `Không thể tải danh mục dịch vụ: ${err.message}`
            : 'Lỗi không xác định';
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      });

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

      const response = await axios.delete(`${API_URL}/${serviceToDelete}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
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
          : 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleEditService = (id: string) => {
    navigate(`/service/edit/${id}`);
  };

  const handleViewDetails = (id: string) => {
    setSelectedServiceId(selectedServiceId === id ? null : id);
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

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
              <Typography ml={2}>Đang tải danh sách dịch vụ...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" p={2}>
              {error}
            </Typography>
          ) : filteredServices.length === 0 ? (
            <Typography p={2}>
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
              <TableContainer component={Paper} className="promotions-table-container">
                <Table sx={{ width: '100%' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell><b>Nhóm dịch vụ</b></TableCell>
                      <TableCell><b>Tên dịch vụ</b></TableCell>
                      <TableCell><b>Giá mỗi đơn</b></TableCell>
                      <TableCell><b>Mô tả</b></TableCell>
                      <TableCell align="center"><b>Hành động</b></TableCell>
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
                                  '&:hover': {
                                    bgcolor: '#bbdefb',
                                    boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)',
                                  },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                {selectedServiceId === service.id ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
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
                                onClick={() => handleEditService(service.id)}
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
                                onClick={() => handleDeleteService(service.id)}
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
                                <Box sx={{ p: 2 }}>
                                  <Typography variant="h6" gutterBottom>
                                    Thông tin dịch vụ
                                  </Typography>
                                  <Table className="promotion-detail-table">
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
                              </div>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
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

export default Service;