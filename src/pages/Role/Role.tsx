import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { AxiosError } from 'axios';
import '../../css/Amenities.css'; // Reuse the same CSS file for consistent styling

interface Role {
  id: number;
  name: string;
  description: string | null;
}

interface ApiResponse {
  roles: Role[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const Role: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const PER_PAGE = 10;

  useEffect(() => {
    document.title = 'Danh sách Vai Trò';
    console.log('Role component - User:', user, 'Permissions:', user?.permissions);
    if (hasPermission('view_roles')) {
      fetchRoles(1);
    } else {
      setError('Bạn không có quyền xem danh sách vai trò');
      setLoading(false);
      setSnackbarMessage('Bạn không có quyền xem danh sách vai trò');
      setSnackbarOpen(true);
    }
  }, [hasPermission, user, location]);

  const fetchRoles = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching roles from /api/roles');
      const response = await api.get<ApiResponse>(`/roles?page=${page}&per_page=${PER_PAGE}`);
      const fetchedRoles = response.data.roles || [];
      if (!Array.isArray(fetchedRoles)) {
        throw new Error('Dữ liệu vai trò không đúng định dạng');
      }
      // Deduplicate roles by id using Array.from
      const uniqueRoles = Array.from(
        new Map(fetchedRoles.map((role: Role) => [role.id, role])).values()
      );
      // Reset allRoles for the first page; otherwise, merge and deduplicate
      if (page === 1) {
        setAllRoles(uniqueRoles);
      } else {
        setAllRoles((prev) => {
          const combined = [...prev, ...uniqueRoles];
          return Array.from(new Map(combined.map((role: Role) => [role.id, role])).values());
        });
      }
      setRoles(uniqueRoles);
      setLastPage(response.data.meta?.last_page || Math.ceil(uniqueRoles.length / PER_PAGE));
      setCurrentPage(page);
      if (fetchedRoles.length === 0) {
        setError('Không có vai trò nào được tìm thấy');
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error fetching roles:', error);
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách vai trò';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = allRoles.filter((role) =>
      searchQuery.trim() === '' ||
      role.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (activeFilters.length > 0 && !activeFilters.includes('all')) {
      // Add filter logic if roles have a status field
      // Example: filtered = filtered.filter((role) => activeFilters.includes(role.status));
    }
    setRoles(filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));
    setLastPage(Math.ceil(filtered.length / PER_PAGE));
  }, [searchQuery, activeFilters, currentPage, allRoles]);

  const handleDelete = async (id: number) => {
    if (!hasPermission('delete_roles')) {
      setSnackbarMessage('Bạn không có quyền xóa vai trò');
      setSnackbarOpen(true);
      return;
    }
    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      await api.delete(`/roles/${roleToDelete}`);
      setAllRoles((prev) => prev.filter((role) => role.id !== roleToDelete));
      fetchRoles(currentPage);
      setSnackbarMessage('Xóa vai trò thành công!');
      setSnackbarOpen(true);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error deleting role:', error);
      const errorMessage = error.response?.data?.message || 'Không thể xóa vai trò';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setCurrentPage(newPage);
    fetchRoles(newPage);
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
    handleFilterClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Quản lý {'>'} Danh sách Vai Trò
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>
            Vai Trò
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm vai trò"
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
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              {['all', 'active', 'inactive'].map((filter) => (
                <MenuItem
                  key={filter}
                  onClick={() => handleFilterSelect(filter)}
                  selected={activeFilters.includes(filter)}
                  sx={{
                    '&:hover': { bgcolor: '#f0f0f0' },
                    '&.Mui-selected': {
                      bgcolor: '#e0f7fa',
                      '&:hover': { bgcolor: '#b2ebf2' },
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: activeFilters.includes(filter) ? '#00796b' : '#333',
                    }}
                  >
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
            {hasPermission('create_roles') && (
              <Button
                variant="contained"
                onClick={() => navigate('/role/add')}
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
            )}
          </Box>
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0, borderRadius: '8px' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={2}>
              <CircularProgress />
              <Typography ml={2}>Đang tải danh sách vai trò...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" p={2} textAlign="center">
              {error}
            </Typography>
          ) : roles.length === 0 ? (
            <Typography p={2} textAlign="center">
              {searchQuery || activeFilters.length > 0
                ? 'Không tìm thấy vai trò phù hợp'
                : 'Không tìm thấy vai trò nào.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell sx={{ minWidth: '100px' }}><b>ID</b></TableCell>
                      <TableCell sx={{ minWidth: '150px' }}><b>Tên vai trò</b></TableCell>
                      <TableCell sx={{ minWidth: '200px' }}><b>Mô tả</b></TableCell>
                      {(hasPermission('edit_roles') || hasPermission('delete_roles')) && (
                        <TableCell align="center" sx={{ minWidth: '150px' }}><b>Hành động</b></TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id} hover>
                        <TableCell>{role.id}</TableCell>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description || '–'}</TableCell>
                        {(hasPermission('edit_roles') || hasPermission('delete_roles')) && (
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1} sx={{ flexWrap: 'wrap' }}>
                              {hasPermission('edit_roles') && (
                                <IconButton
                                  title="Chỉnh sửa vai trò"
                                  onClick={() => navigate(`/role/edit/${role.id}`)}
                                  sx={{
                                    color: '#FACC15',
                                    bgcolor: '#fef9c3',
                                    p: '6px',
                                    '&:hover': {
                                      bgcolor: '#fff9c4',
                                      boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)',
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                              {hasPermission('delete_roles') && (
                                <IconButton
                                  title="Xóa vai trò"
                                  onClick={() => handleDelete(role.id)}
                                  sx={{
                                    color: '#d32f2f',
                                    bgcolor: '#ffebee',
                                    p: '6px',
                                    '&:hover': {
                                      bgcolor: '#ffcdd2',
                                      boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)',
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        )}
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
                  sx={{ '& .MuiPaginationItem-root': { fontSize: '14px' } }}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xóa vai trò</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa vai trò này không? Hành động này không thể hoàn tác.
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

export default Role;