import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box, Card, CardContent, Typography,
  Avatar, Grid, Divider, CircularProgress,
  Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack,
  Snackbar, Alert as MuiAlert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface Department { id: number; name: string }
interface Role { id: number; name: string }
interface UserInfo { id: number; email: string; status: string; created_at: string }
interface Employee {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  cccd?: string;
  hire_date?: string;
  department_id?: number;
  status: string;
  face_image?: string;
  department?: Department;
  role?: Role;
  user?: UserInfo;
}

const DEFAULT_AVATAR = '/default-avatar.png';
const FILES_URL = import.meta.env.VITE_FILES_URL || 'http://127.0.0.1:8000';

const resolvePath = (p?: string) => {
  if (!p) return DEFAULT_AVATAR;
  const path = p.replace(/^storage\/app\/public\//, '');
  if (path.startsWith('storage/')) return `${FILES_URL}/${path}`;
  return `${FILES_URL}/storage/${path}`;
};

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const nav = useNavigate();

  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(DEFAULT_AVATAR);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [toastState, setToastState] = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({
    open: false, msg: '', type: 'success'
  });

  useEffect(() => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập.');
      nav('/login');
      return;
    }

    const fetchEmployee = async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees', { params: { page: 1 } });
        const emps: Employee[] = res.data.data;
        const found = emps.find(e => e.user_id === user.id) || null;
        if (!found) {
          setError('Chưa có hồ sơ nhân viên.');
        } else {
          setEmp(found);
          const url = found.face_image ? resolvePath(found.face_image) : DEFAULT_AVATAR;
          setPreview(url);
          // đồng bộ avatar lần đầu
          if (!user.avatarUrl && found.face_image) {
            setUser(u => {
              if (!u) return u;
              const newUser = { ...u, avatarUrl: url };
              localStorage.setItem('auth_user', JSON.stringify(newUser));
              return newUser;
            });
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        const message = e.response?.data?.message || 'Lỗi khi lấy thông tin nhân viên';
        toast.error(message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [user, nav, setUser]);

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => {
    setDialogOpen(false);
    setFile(null);
    setValidationError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;

    const maxKB = 2048;
    const sizeKB = f.size / 1024;
    const validMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const ext = f.name.split('.').pop()?.toLowerCase();

    if (!validMime.includes(f.type) || !['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      toast.error('Chỉ chấp nhận file jpg, jpeg, png hoặc gif.');
      return;
    }
    if (sizeKB > maxKB) {
      toast.error(`Ảnh quá lớn (${sizeKB.toFixed(1)} KB). Vui lòng chọn dưới ${maxKB} KB.`);
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appendIf = (form: FormData, key: string, val: any) => {
    if (val !== undefined && val !== null && val !== '') form.append(key, String(val));
  };

  const handleUpload = async () => {
    if (!file || !emp) return;
    setUploading(true);
    setValidationError(null);

    try {
      const form = new FormData();
      form.append('face_image', file);

      // required
      form.append('name', emp.name);
      form.append('email', emp.email);
      appendIf(form, 'department_id', emp.department_id);
      appendIf(form, 'hire_date', emp.hire_date);
      appendIf(form, 'status', emp.status);

      // optional
      appendIf(form, 'phone', emp.phone);
      appendIf(form, 'birthday', emp.birthday);
      appendIf(form, 'gender', emp.gender);
      appendIf(form, 'address', emp.address);
      appendIf(form, 'cccd', emp.cccd);

      form.append('_method', 'PATCH');

      const res = await api.post(`/employees/${emp.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updated: Employee = res.data.data;
      setEmp(updated);

      const newUrl = resolvePath(updated.face_image) + `?t=${Date.now()}`;
      setPreview(newUrl);

      // cập nhật vào context + localStorage
      setUser(u => {
        if (!u) return u;
        const newUser = { ...u, avatarUrl: newUrl };
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        return newUser;
      });

      setToastState({ open: true, msg: 'Cập nhật avatar thành công', type: 'success' });

      setDialogOpen(false);
      setFile(null);
      setValidationError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.response?.status === 422) {
        const msg = e.response.data.message ||
          Object.values(e.response.data.errors || {}).flat().join(' ') ||
          'Dữ liệu không hợp lệ';
        setValidationError(msg);
        setToastState({ open: true, msg, type: 'error' });
      } else {
        const msg = e.response?.data?.message || 'Lỗi hệ thống';
        setToastState({ open: true, msg, type: 'error' });
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error)   return <Box mx="auto" mt={4}><Alert severity="error">{error}</Alert></Box>;
  if (!emp)    return null;

  return (
    <Box maxWidth={800} mx="auto" my={4}>
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            key={preview}
            src={preview}
            sx={{ width: 100, height: 100, cursor: 'pointer' }}
            onClick={openDialog}
            onError={() => setPreview(DEFAULT_AVATAR)}
          />
          </Box>

          <Dialog open={dialogOpen} onClose={closeDialog}>
            <DialogTitle>Chọn ảnh đại diện</DialogTitle>
            <DialogContent>
              <Stack spacing={2} alignItems="center" pt={1}>
                <Avatar src={preview} sx={{ width: 100, height: 100 }} />
                {file && (
                  <Typography variant="body2">
                    Kích thước: {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                )}
                <Button variant="outlined" component="label">
                  Chọn file
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileChange}
                  />
                </Button>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              {validationError && (
                <Typography color="error" variant="body2" sx={{ mr: 2 }}>
                  {validationError}
                </Typography>
              )}
              <Button onClick={closeDialog} variant="outlined">Hủy</Button>
              <Button onClick={handleUpload} disabled={!file || uploading} variant="contained">
                {uploading ? <CircularProgress size={24} /> : 'Tải lên'}
              </Button>
            </DialogActions>
          </Dialog>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Thông tin cá nhân</Typography>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}><Typography><strong>Họ tên:</strong> {emp.name}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Email:</strong> {emp.email}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Điện thoại:</strong> {emp.phone || '—'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Ngày sinh:</strong> {emp.birthday || '—'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Giới tính:</strong> {emp.gender || '—'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>CCCD:</strong> {emp.cccd || '—'}</Typography></Grid>
            <Grid item xs={12}><Typography><strong>Địa chỉ:</strong> {emp.address || '—'}</Typography></Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Thông tin công việc</Typography>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}><Typography><strong>Phòng ban:</strong> {emp.department?.name || '—'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Ngày tuyển dụng:</strong> {emp.hire_date || '—'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Vai trò:</strong> {emp.role?.name || '—'}</Typography></Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Thông tin tài khoản</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Typography><strong>Email đăng nhập:</strong> {emp.user?.email}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Trạng thái:</strong> {emp.user?.status || '—'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><strong>Ngày tạo:</strong> {emp.user?.created_at?.slice(0, 10) || '—'}</Typography></Grid>
          </Grid>

          <Box mt={4} textAlign="center">
            <Button variant="contained" onClick={() => nav('/user')}>Chỉnh sửa hồ sơ</Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={toastState.open}
        autoHideDuration={3000}
        onClose={() => setToastState({ ...toastState, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert
          severity={toastState.type}
          variant="filled"
          onClose={() => setToastState({ ...toastState, open: false })}
        >
          {toastState.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
