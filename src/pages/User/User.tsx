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
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import ProtectedComponent from '../../contexts/ProtectedComponent';
import '../../css/User.css';

interface User {
  name: string;
  email: string;
  birthday: string;
  phone: string;
  address: string;
  hire_date: string;
  department_id: number | null;
  status: string;
  role_id: number;
  cccd: string;
  gender: string;
  role: string;
  created_at: string;
  id: number;
}

interface Role {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
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
  birthday?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  department_id?: string;
  status?: string;
  cccd?: string;
  gender?: string;
  role_id?: string;
}

const User: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [viewUserId, setViewUserId] = useState<number | null>(null);
  const [viewCredentialsId, setViewCredentialsId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const rowsPerPage = 10;

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse>('/users', {
        params: { page, per_page: rowsPerPage },
      });

      setUsers(response.data.data);
      setFilteredUsers(response.data.data);
      setTotalPages(response.data.last_page);
      setCurrentPage(response.data.current_page);
    } catch (error: any) {
      const errorMessage = `Lỗi tải danh sách người dùng: ${error.response?.data?.message || error.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    api
      .get('/role')
      .then((res) => {
        console.log('Role API response:', res.data);
        setRoles(res.data.roles);
      })
      .catch(() => {
        setError('Không thể tải danh sách vai trò');
        toast.error('Không thể tải danh sách vai trò');
      });
    api
      .get('/departments')
      .then((res) => {
        setDepartments(res.data.data);
      })
      .catch(() => {
        setError('Không thể tải danh sách phòng ban');
        toast.error('Không thể tải danh sách phòng ban');
      });
  }, [navigate]);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [searchQuery, users, totalPages, currentPage]);

  const validateForm = (data: Partial<User>): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name?.trim()) {
      errors.name = 'Họ tên không được để trống';
    } else if (data.name.length > 100) {
      errors.name = 'Tên không được dài quá 100 ký tự';
    }
    if (!data.email?.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Email không hợp lệ';
    }
    if (!data.phone?.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (data.phone.length > 20) {
      errors.phone = 'Số điện thoại không được vượt quá 20 ký tự';
    }
    if (!data.address?.trim()) {
      errors.address = 'Địa chỉ không được để trống';
    } else if (data.address.length > 255) {
      errors.address = 'Địa chỉ không được vượt quá 255 ký tự';
    }
    if (!data.birthday) {
      errors.birthday = 'Ngày sinh không được để trống';
    } else {
      const date = new Date(data.birthday);
      if (isNaN(date.getTime())) {
        errors.birthday = 'Ngày sinh không đúng định dạng';
      }
    }
    if (!data.hire_date) {
      errors.hire_date = 'Ngày vào làm không được để trống';
    } else {
      const hireDate = new Date(data.hire_date);
      if (isNaN(hireDate.getTime())) {
        errors.hire_date = 'Ngày vào làm không đúng định dạng';
      }
    }
    if (!data.status) {
      errors.status = 'Vui lòng chọn trạng thái';
    } else if (!['active', 'not_active', 'pending'].includes(data.status)) {
      errors.status = 'Trạng thái không hợp lệ';
    }
    if (!data.role_id) {
      errors.role_id = 'Vui lòng chọn vai trò';
    } else if (!roles.some((r) => r.id === data.role_id)) {
      errors.role_id = 'Vai trò không hợp lệ';
    }
    if (!data.cccd?.trim()) {
      errors.cccd = 'CCCD không được để trống';
    } else if (!/^[0-9]+$/.test(data.cccd)) {
      errors.cccd = 'CCCD chỉ được chứa các chữ số';
    } else if (data.cccd.length < 10) {
      errors.cccd = 'CCCD phải có ít nhất 10 chữ số';
    } else if (data.cccd.length > 12) {
      errors.cccd = 'CCCD không được vượt quá 12 chữ số';
    }
    if (!data.gender) {
      errors.gender = 'Vui lòng chọn giới tính';
    } else if (!['Nam', 'Nữ', 'Khác'].includes(data.gender)) {
      errors.gender = 'Giới tính không hợp lệ';
    }
    return errors;
  };

  const handleEdit = (user: User) => {
    setEditUserId(user.id);
    setViewUserId(null); // Close view details section
    setViewCredentialsId(null); // Close credentials section
    setEditFormData({
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      phone: user.phone,
      address: user.address,
      hire_date: user.hire_date,
      department_id: user.department_id,
      status: user.status,
      role_id: user.role_id,
      cccd: user.cccd,
      gender: user.gender,
      role: user.role,
      id: user.id,
    });
    setValidationErrors({});
    setError(null);
  };

  const handleViewDetail = (id: number) => {
    if (viewUserId === id && editUserId !== id && viewCredentialsId !== id) {
      setViewUserId(null);
    } else {
      setViewUserId(id);
      setEditUserId(null);
      setViewCredentialsId(null);
      setEditFormData({});
      setValidationErrors({});
    }
  };

  const handleViewCredentials = (id: number) => {
    if (viewCredentialsId === id && editUserId !== id) {
      setViewCredentialsId(null);
    } else {
      setViewCredentialsId(id);
      setViewUserId(null);
      setEditUserId(null);
      setEditFormData({});
      setValidationErrors({});
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'role_id' || name === 'department_id' ? Number(value) || null : value,
      role: name === 'role_id' ? (roles.find((r) => r.id === Number(value))?.name || prev.role) : prev.role,
    }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
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
        name: editFormData.name?.trim(),
        email: editFormData.email?.trim(),
        birthday: editFormData.birthday,
        phone: editFormData.phone?.trim(),
        address: editFormData.address?.trim(),
        hire_date: editFormData.hire_date,
        department_id: editFormData.department_id,
        status: editFormData.status,
        role_id: editFormData.role_id,
        cccd: editFormData.cccd?.trim(),
        gender: editFormData.gender,
      });

      if (response.status === 200) {
        setUsers((prev) =>
          prev.map((user) => (user.id === editFormData.id ? { ...user, ...editFormData } : user))
        );
        setFilteredUsers((prev) =>
          prev.map((user) => (user.id === editFormData.id ? { ...user, ...editFormData } : user))
        );
        setEditUserId(null);
        setViewUserId(null);
        setViewCredentialsId(null);
        setEditFormData({});
        toast.success('Cập nhật người dùng thành công!');
      } else {
        throw new Error('Không thể cập nhật người dùng');
      }
    } catch (error: any) {
      const errorMessage = `Không thể cập nhật người dùng: ${error.response?.data?.message || error.message}`;
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditUserId(null);
    setViewUserId(null);
    setViewCredentialsId(null);
    setEditFormData({});
    setValidationErrors({});
  };

  const handleDelete = async (id: number) => {
    const userData = localStorage.getItem("user");
    const currentUserId = userData ? JSON.parse(userData).id : null;
    if (id === currentUserId) {
      toast.error('Bạn không thể xóa tài khoản của chính mình.');
      return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa người dùng này?');
    if (confirmed) {
      try {
        await api.delete(`/users/${id}`);
        setUsers(users.filter((user) => user.id !== id));
        setFilteredUsers(filteredUsers.filter((user) => user.id !== id));
        toast.success('Xóa người dùng thành công!');
        if (filteredUsers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
          fetchUsers(currentPage - 1);
        }
      } catch (error: any) {
        const errorMessage = `Lỗi khi xóa người dùng: ${error.response?.data?.message || error.message}`;
        toast.error(errorMessage);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  const memoizedUsers = useMemo(() => filteredUsers, [filteredUsers]);

  const renderStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'not_active':
        return 'Không hoạt động';
      case 'pending':
        return 'Chờ xét duyệt';
      default:
        return 'Không xác định';
    }
  };

  const paginatedUsers = memoizedUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="customer-wrapper">
      <div className="customer-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Nhân Viên {'>'} Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" className="section-title" fontWeight={700}>
            Nhân Viên
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm (Tên hoặc Email)"
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
                width: 300,
                bgcolor: '#fff',
                borderRadius: '8px',
                mt: { xs: 2, sm: 0 },
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
                + Thêm mới
              </Button>
            </ProtectedComponent>
          </Box>
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <div className="customer-loading-container">
              <CircularProgress />
              <Typography>Đang tải danh sách nhân viên...</Typography>
            </div>
          ) : error ? (
            <Typography color="error" className="customer-error-message">
              {error}
            </Typography>
          ) : paginatedUsers.length === 0 ? (
            <Typography className="customer-no-data">
              {searchQuery ? 'Không tìm thấy nhân viên phù hợp.' : 'Không tìm thấy nhân viên nào.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} className="customer-table-container">
                <Table className="customer-table" sx={{ width: '100%' }}>
                  <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                    <TableRow>
                      <TableCell><b>Họ Tên</b></TableCell>
                      <TableCell><b>Email</b></TableCell>
                      <TableCell><b>Vai Trò</b></TableCell>
                      <TableCell align="center"><b>Hành động</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <React.Fragment key={user.id}>
                        <TableRow hover>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1}>
                              <IconButton
                                title={viewUserId === user.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                onClick={() => handleViewDetail(user.id)}
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
                                {viewUserId === user.id ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                              <IconButton
                                title="Xem thông tin tài khoản"
                                onClick={() => handleViewCredentials(user.id)}
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
                                <AccountCircleIcon fontSize="small" />
                              </IconButton>
                              <ProtectedComponent permission="delete_users">
                                <IconButton
                                  title="Xóa người dùng"
                                  onClick={() => handleDelete(user.id)}
                                  sx={{
                                    color: '#d32f2f',
                                    bgcolor: '#ffebee',
                                    '&:hover': {
                                      bgcolor: '#ffcdd2',
                                      boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </ProtectedComponent>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} style={{ padding: 0 }}>
                            <Collapse in={viewUserId === user.id || editUserId === user.id || viewCredentialsId === user.id} timeout="auto" unmountOnExit>
                              <Box sx={{ width: '100%', bgcolor: '#f9f9f9', px: 3, py: 2, borderTop: '1px solid #ddd' }}>
                                <div className="customer-detail-container">
                                  {viewUserId === user.id && (
                                    <>
                                      <h3>Thông tin nhân viên</h3>
                                      <Table className="customer-detail-table">
                                        <TableBody>
                                          <TableRow>
                                            <TableCell><strong>Họ Tên:</strong> {user.name}</TableCell>
                                            <TableCell><strong>Email:</strong> {user.email}</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell><strong>Số Điện Thoại:</strong> {user.phone || 'Không xác định'}</TableCell>
                                            <TableCell><strong>Địa chỉ:</strong> {user.address || 'Không xác định'}</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell><strong>Ngày sinh:</strong> {user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'Không xác định'}</TableCell>
                                            <TableCell><strong>Giới tính:</strong> {user.gender || 'Không xác định'}</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell><strong>Phòng ban:</strong> {departments.find((d) => d.id === user.department_id)?.name || 'Không xác định'}</TableCell>
                                            <TableCell><strong>CCCD:</strong> {user.cccd || 'Không xác định'}</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell><strong>Trạng thái:</strong> {renderStatusLabel(user.status)}</TableCell>
                                            <TableCell><strong>Ngày tuyển dụng:</strong> {user.hire_date ? new Date(user.hire_date).toLocaleDateString('vi-VN') : 'Không xác định'}</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell colSpan={2}><strong>Vai trò:</strong> {user.role}</TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                      <ProtectedComponent permission="edit_users">
                                        <Box mt={2}>
                                          <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEdit(user)}
                                            sx={{
                                              color: '#f57c00',
                                              borderColor: '#f57c00',
                                              '&:hover': {
                                                borderColor: '#ef6c00',
                                                backgroundColor: '#fff3e0',
                                              },
                                            }}
                                          >
                                            Chỉnh sửa thông tin nhân viên
                                          </Button>
                                        </Box>
                                      </ProtectedComponent>
                                    </>
                                  )}
                                  {viewCredentialsId === user.id && (
                                    <>
                                      <h3>Thông tin tài khoản đăng nhập</h3>
                                      <Table className="customer-detail-table">
                                        <TableBody>
                                          <TableRow>
                                            <TableCell><strong>Họ Tên:</strong> {user.name}</TableCell>
                                            <TableCell><strong>Email:</strong> {user.email}</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell><strong>Vai trò:</strong> {user.role}</TableCell>
                                            <TableCell><strong>Trạng thái:</strong> {renderStatusLabel(user.status)}</TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </>
                                  )}
                                  {editUserId === user.id && (
                                    <>
                                      <h3>Chỉnh sửa thông tin nhân viên</h3>
                                      <Box display="flex" flexDirection="column" gap={2}>
                                        <Box display="flex" gap={2}>
                                          <TextField
                                            label="Họ tên"
                                            name="name"
                                            value={editFormData.name || ''}
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
                                            label="Email"
                                            name="email"
                                            value={editFormData.email || ''}
                                            onChange={handleChange}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!validationErrors.email}
                                            helperText={validationErrors.email}
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
                                        </Box>
                                        <Box display="flex" gap={2}>
                                          <TextField
                                            label="Số điện thoại"
                                            name="phone"
                                            value={editFormData.phone || ''}
                                            onChange={handleChange}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!validationErrors.phone}
                                            helperText={validationErrors.phone}
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
                                            label="Ngày sinh"
                                            name="birthday"
                                            type="date"
                                            value={editFormData.birthday || ''}
                                            onChange={handleChange}
                                            InputLabelProps={{ shrink: true }}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!validationErrors.birthday}
                                            helperText={validationErrors.birthday}
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
                                        </Box>
                                        <Box display="flex" gap={2}>
                                          <FormControl
                                            fullWidth
                                            variant="outlined"
                                            error={!!validationErrors.gender}
                                            size="small"
                                          >
                                            <InputLabel>Giới tính</InputLabel>
                                            <Select
                                              name="gender"
                                              value={editFormData.gender || ''}
                                              onChange={(e) => handleChange({ target: { name: 'gender', value: e.target.value } })}
                                              label="Giới tính"
                                            >
                                              <MenuItem value="">Chọn giới tính</MenuItem>
                                              <MenuItem value="Nam">Nam</MenuItem>
                                              <MenuItem value="Nữ">Nữ</MenuItem>
                                              <MenuItem value="Khác">Khác</MenuItem>
                                            </Select>
                                            {validationErrors.gender && (
                                              <Typography color="error" variant="caption">
                                                {validationErrors.gender}
                                              </Typography>
                                            )}
                                          </FormControl>
                                          <TextField
                                            label="CCCD"
                                            name="cccd"
                                            value={editFormData.cccd || ''}
                                            onChange={handleChange}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!validationErrors.cccd}
                                            helperText={validationErrors.cccd || 'Ví dụ: 123456789012'}
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
                                        </Box>
                                        <Box display="flex" gap={2}>
                                          <TextField
                                            label="Địa chỉ"
                                            name="address"
                                            value={editFormData.address || ''}
                                            onChange={handleChange}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            multiline
                                            rows={2}
                                            error={!!validationErrors.address}
                                            helperText={validationErrors.address}
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
                                        </Box>
                                        <Box display="flex" gap={2}>
                                          <TextField
                                            label="Ngày vào làm"
                                            name="hire_date"
                                            type="date"
                                            value={editFormData.hire_date || ''}
                                            onChange={handleChange}
                                            InputLabelProps={{ shrink: true }}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!validationErrors.hire_date}
                                            helperText={validationErrors.hire_date}
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
                                          <FormControl
                                            fullWidth
                                            variant="outlined"
                                            error={!!validationErrors.department_id}
                                            size="small"
                                          >
                                            <InputLabel>Phòng ban</InputLabel>
                                            <Select
                                              name="department_id"
                                              value={editFormData.department_id?.toString() || ''}
                                              onChange={(e) => handleChange({ target: { name: 'department_id', value: e.target.value } })}
                                              label="Phòng ban"
                                            >
                                              <MenuItem value="">Chọn phòng ban</MenuItem>
                                              {departments.map((dept) => (
                                                <MenuItem key={dept.id} value={String(dept.id)}>
                                                  {dept.name}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                            {validationErrors.department_id && (
                                              <Typography color="error" variant="caption">
                                                {validationErrors.department_id}
                                              </Typography>
                                            )}
                                          </FormControl>
                                        </Box>
                                        <Box display="flex" gap={2}>
                                          <FormControl
                                            fullWidth
                                            variant="outlined"
                                            error={!!validationErrors.status}
                                            size="small"
                                          >
                                            <InputLabel>Trạng thái</InputLabel>
                                            <Select
                                              name="status"
                                              value={editFormData.status || ''}
                                              onChange={(e) => handleChange({ target: { name: 'status', value: e.target.value } })}
                                              label="Trạng thái"
                                            >
                                              <MenuItem value="active">Đang làm việc</MenuItem>
                                              <MenuItem value="not_active">Nghỉ làm</MenuItem>
                                              <MenuItem value="pending">Chờ xét duyệt</MenuItem>
                                            </Select>
                                            {validationErrors.status && (
                                              <Typography color="error" variant="caption">
                                                {validationErrors.status}
                                              </Typography>
                                            )}
                                          </FormControl>
                                          <FormControl
                                            fullWidth
                                            variant="outlined"
                                            error={!!validationErrors.role_id}
                                            size="small"
                                          >
                                            <InputLabel>Vai trò</InputLabel>
                                            <Select
                                              name="role_id"
                                              value={editFormData.role_id?.toString() || ''}
                                              onChange={(e) => handleChange({ target: { name: 'role_id', value: e.target.value } })}
                                              label="Vai trò"
                                            >
                                              <MenuItem value="">Chọn vai trò</MenuItem>
                                              {Array.isArray(roles) &&
                                                roles.map((role) => (
                                                  <MenuItem key={role.id} value={String(role.id)}>
                                                    {role.name}
                                                  </MenuItem>
                                                ))}
                                            </Select>
                                            {validationErrors.role_id && (
                                              <Typography color="error" variant="caption">
                                                {validationErrors.role_id}
                                              </Typography>
                                            )}
                                          </FormControl>
                                        </Box>
                                        <Box pb={3} mt={2} display="flex" gap={2}>
                                          <Button
                                            variant="contained"
                                            className="customer-btn-save"
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
                                            className="customer-btn-cancel"
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
                                        {error && (
                                          <Typography color="error" mt={1}>
                                            {error}
                                          </Typography>
                                        )}
                                      </Box>
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
              <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  shape="rounded"
                  color="primary"
                  siblingCount={0}
                  boundaryCount={1}
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#444',
                      minWidth: '32px',
                      height: '32px',
                      fontSize: '14px',
                      fontWeight: 500,
                      borderRadius: '8px',
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#5B3EFF',
                      color: '#fff',
                      fontWeight: 'bold',
                    },
                  }}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default User;