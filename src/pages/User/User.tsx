import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Pagination,
  Paper,
  Snackbar,
  Alert,
  Collapse,
  MenuItem,
  Select,
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import ProtectedComponent from '../../contexts/ProtectedComponent';

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role: string;
  status: string;
  created_at: string;
}

interface PaginatedResponse {
  data: User[];
  current_page: number;
  last_page: number;
  total: number;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  role_id?: string;
  status?: string;
}

const User: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  // const { user } = useAuth();

  const PER_PAGE = 10;

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse>('/users', {
        params: { page, per_page: PER_PAGE },
      });

      setUsers(response.data.data);
      setFilteredUsers(response.data.data);
      setLastPage(response.data.last_page);
      setCurrentPage(response.data.current_page);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = `Lỗi tải danh sách người dùng: ${error.response?.data?.message || error.message}`;
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      // Không chuyển hướng /unauthorized ở đây, để ProtectedRoute xử lý
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]); // Loại bỏ user và hasPermission khỏi dependency

  useEffect(() => {
    const filtered: User[] = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
    setLastPage(Math.ceil(filtered.length / PER_PAGE));
    if (currentPage > lastPage && lastPage > 0) {
      setCurrentPage(lastPage);
    }
  }, [searchQuery, users, lastPage, currentPage]);

  const validateForm = (data: User): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) {
      errors.name = 'Tên không được để trống';
    } else if (data.name.length > 50) {
      errors.name = 'Tên không được vượt quá 50 ký tự';
    }
    if (!data.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Email không hợp lệ';
    }
    if (!data.role_id) {
      errors.role_id = 'Vai trò không được để trống';
    }
    if (!data.status) {
      errors.status = 'Trạng thái không được để trống';
    }
    return errors;
  };

  const handleEdit = (user: User) => {
    setEditUserId(user.id);
    setEditFormData({ ...user });
    setValidationErrors({});
  };

  const handleChange = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = {
        ...editFormData,
        [name]: name === 'role_id' ? Number(value) : value,
        role: name === 'role_id' ? (value === 1 ? 'Admin' : 'User') : editFormData.role,
      };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
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
      const response = await api.put(`/users/${editFormData.id}`, {
        name: editFormData.name,
        email: editFormData.email,
        role_id: editFormData.role_id,
        status: editFormData.status,
      });

      if (response.status === 200) {
        setUsers((prev) =>
          prev.map((user) => (user.id === editFormData.id ? { ...editFormData } : user))
        );
        setFilteredUsers((prev) =>
          prev.map((user) => (user.id === editFormData.id ? { ...editFormData } : user))
        );
        setEditUserId(null);
        setEditFormData(null);
        setSnackbarMessage('Cập nhật người dùng thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể cập nhật người dùng');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = `Không thể cập nhật người dùng: ${error.response?.data?.message || error.message}`;
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditUserId(null);
    setEditFormData(null);
    setValidationErrors({});
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== id));
      setSnackbarMessage('Xóa người dùng thành công!');
      setSnackbarOpen(true);
      if (filteredUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
        fetchUsers(currentPage - 1);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = `Lỗi khi xóa người dùng: ${error.response?.data?.message || error.message}`;
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setCurrentPage(newPage);
    fetchUsers(newPage);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const memoizedUsers = useMemo(() => filteredUsers, [filteredUsers]);

  const renderStatusLabel = (status: string | undefined) => {
    switch (status) {
      case "active":
        return "Đang làm việc";
      case "not_active":
        return "Nghỉ làm";
      case "pending":
        return "Chờ xét duyệt";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Quản lý {'>'} Danh sách Người Dùng
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" fontWeight={700}>
            Danh Sách Người Dùng
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm theo tên, email, vai trò..."
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
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
            />
            <ProtectedComponent permission="create_users">
              <Button
                variant="contained"
                onClick={() => navigate('/user/add')}
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
                + Thêm Người Dùng
              </Button>
            </ProtectedComponent>
          </Box>
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0, borderRadius: '8px' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={2}>
              <CircularProgress />
              <Typography ml={2}>Đang tải danh sách người dùng...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" p={2} textAlign="center">
              {error}
            </Typography>
          ) : memoizedUsers.length === 0 ? (
            <Typography p={2} textAlign="center">
              {searchQuery ? 'Không tìm thấy người dùng phù hợp' : 'Không tìm thấy người dùng nào.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell sx={{ minWidth: '100px' }}><b>ID</b></TableCell>
                      <TableCell sx={{ minWidth: '150px' }}><b>Tên</b></TableCell>
                      <TableCell sx={{ minWidth: '200px' }}><b>Email</b></TableCell>
                      <TableCell sx={{ minWidth: '150px' }}><b>Vai Trò</b></TableCell>
                      <TableCell sx={{ minWidth: '150px' }}><b>Trạng Thái</b></TableCell>
                      <TableCell sx={{ minWidth: '150px' }} align="center"><b>Hành Động</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {memoizedUsers
                      .slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
                      .map((user) => (
                        <React.Fragment key={user.id}>
                          <TableRow hover>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color={user.status === 'active' ? '#00796b' : '#d32f2f'}
                              >
                                {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" justifyContent="center" gap={1} sx={{ flexWrap: 'wrap' }}>
                                <ProtectedComponent permission="edit_users">
                                  <IconButton
                                    title="Chỉnh sửa người dùng"
                                    onClick={() => handleEdit(user)}
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
                                </ProtectedComponent>
                                <ProtectedComponent permission="delete_users">
                                  <IconButton
                                    title="Xóa người dùng"
                                    onClick={() => handleDelete(user.id)}
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
                                </ProtectedComponent>
                              </Box>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={6} style={{ padding: 0 }}>
                              <Collapse in={editUserId === user.id}>
                                <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                                  <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ fontWeight: 600, color: '#333' }}
                                  >
                                    Chỉnh sửa người dùng
                                  </Typography>
                                  <Box display="flex" flexDirection="column" gap={2}>
                                    <TextField
                                      label="Tên"
                                      name="name"
                                      value={editFormData?.name || ''}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.name}
                                      helperText={validationErrors.name}
                                      sx={{ bgcolor: '#fff', borderRadius: '4px' }}
                                    />
                                    <TextField
                                      label="Email"
                                      name="email"
                                      value={editFormData?.email || ''}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.email}
                                      helperText={validationErrors.email}
                                      sx={{ bgcolor: '#fff', borderRadius: '4px' }}
                                    />
                                    <Select
                                      label="Vai trò"
                                      name="role_id"
                                      value={editFormData?.role_id || ''}
                                      onChange={(e) => handleChange({ target: { name: 'role_id', value: e.target.value } })}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.role_id}
                                      sx={{ bgcolor: '#fff', borderRadius: '4px' }}
                                    >
                                      <MenuItem value={1}>Admin</MenuItem>
                                      <MenuItem value={2}>User</MenuItem>
                                    </Select>
                                    <Select
                                      label="Trạng thái"
                                      name="status"
                                      value={editFormData?.status || ''}
                                      onChange={(e) => handleChange({ target: { name: 'status', value: e.target.value } })}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.status}
                                      sx={{ bgcolor: '#fff', borderRadius: '4px' }}
                                    >
                                      <MenuItem value="active">Hoạt động</MenuItem>
                                      <MenuItem value="inactive">Không hoạt động</MenuItem>
                                    </Select>
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
                                          '&:hover': {
                                            borderColor: '#d32f2f',
                                            backgroundColor: '#ffebee',
                                          },
                                          '&:disabled': { color: '#a9a9a9', borderColor: '#a9a9a9' },
                                        }}
                                      >
                                        Hủy
                                      </Button>
                                    </Box>
                                  </Box>
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

export default User;