import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography,
  Avatar, Grid, Divider, CircularProgress,
  Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack,
  Snackbar, Alert as MuiAlert, Slider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';

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

type Area = { x: number; y: number; width: number; height: number };
async function getCroppedImg(imageSrc: string, crop: Area, rotation = 0): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((r) => (image.onload = r));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const rad = rotation * Math.PI / 180;

  const maxSize = Math.max(image.width, image.height);
  const safe = 2 * ((maxSize / 2) * Math.sqrt(2));
  canvas.width = safe;
  canvas.height = safe;

  ctx.translate(safe / 2, safe / 2);
  ctx.rotate(rad);
  ctx.translate(-safe / 2, -safe / 2);
  ctx.drawImage(image, (safe - image.width) / 2, (safe - image.height) / 2);

  const data = ctx.getImageData(0, 0, safe, safe);
  canvas.width = crop.width;
  canvas.height = crop.height;
  ctx.putImageData(
    data,
    Math.round(-safe / 2 + image.width / 2 - crop.x),
    Math.round(-safe / 2 + image.height / 2 - crop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.9);
  });
}

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

  // Dialogs
  const [actionOpen, setActionOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Toast
  const [toastState, setToastState] = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({
    open: false, msg: '', type: 'success'
  });

  // Crop dialog
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const onCropComplete = useCallback((_c: Area, pixels: Area) => setCroppedAreaPixels(pixels), []);

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

          if (!user.avatarUrl && found.face_image) {
            setUser(u => {
              if (!u) return u;
              const nu = { ...u, avatarUrl: url, avatarVer: Date.now() };
              localStorage.setItem('auth_user', JSON.stringify(nu));
              return nu;
            });
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        const msg = e.response?.data?.message || 'Lỗi khi lấy thông tin nhân viên';
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [user, nav, setUser]);

  const handleAvatarClick = () => setActionOpen(true);
  const handleChooseUpload = () => { setActionOpen(false); setUploadDialogOpen(true); };
  const handleChooseView = () => { setActionOpen(false); setViewDialogOpen(true); };
  const closeUploadDialog = () => { setUploadDialogOpen(false); setFile(null); setValidationError(null); };

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

    setRawImage(URL.createObjectURL(f));
    setCropOpen(true);
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
      form.append('name', emp.name);
      form.append('email', emp.email);
      appendIf(form, 'department_id', emp.department_id);
      appendIf(form, 'hire_date', emp.hire_date);
      appendIf(form, 'status', emp.status);
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

      setUser(u => {
        if (!u) return u;
        const nu = { ...u, avatarUrl: newUrl, avatarVer: Date.now() };
        localStorage.setItem('auth_user', JSON.stringify(nu));
        return nu;
      });

      setToastState({ open: true, msg: 'Cập nhật avatar thành công', type: 'success' });
      setUploadDialogOpen(false);
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

  const handleCropDone = async () => {
    if (!croppedAreaPixels || !rawImage) return;
    const blob = await getCroppedImg(rawImage, croppedAreaPixels, rotation);
    const fileCropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setFile(fileCropped);
    setPreview(URL.createObjectURL(blob));
    setCropOpen(false);
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
              onClick={handleAvatarClick}
              onError={() => setPreview(DEFAULT_AVATAR)}
            />
          </Box>

          {/* Action dialog */}
          <Dialog open={actionOpen} onClose={() => setActionOpen(false)}>
            <DialogTitle>Ảnh đại diện</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Button variant="outlined" onClick={handleChooseView}>Xem ảnh đại diện</Button>
                <Button variant="contained" onClick={handleChooseUpload}>Tải ảnh lên</Button>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionOpen(false)}>Đóng</Button>
            </DialogActions>
          </Dialog>

          {/* View dialog */}
          <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
            <Box display="flex" justifyContent="flex-end" px={1} pt={1}>
              <IconButton onClick={() => setViewDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box display="flex" justifyContent="center" pb={3}>
              <img
                src={preview}
                alt="avatar"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
              />
            </Box>
          </Dialog>

          {/* Upload dialog */}
          <Dialog open={uploadDialogOpen} onClose={closeUploadDialog}>
            <DialogTitle>Tải ảnh đại diện lên</DialogTitle>
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
              <Button onClick={closeUploadDialog} variant="outlined">Hủy</Button>
              <Button onClick={handleUpload} disabled={!file || uploading} variant="contained">
                {uploading ? <CircularProgress size={24} /> : 'Tải lên'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Crop dialog */}
          <Dialog open={cropOpen} onClose={() => setCropOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Cắt & chỉnh ảnh</DialogTitle>
            <DialogContent sx={{ position: 'relative', height: 400, background: '#333' }}>
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onRotationChange={setRotation}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </DialogContent>
            <Box px={3} py={2}>
              <Typography variant="caption">Zoom</Typography>
              <Slider value={zoom} min={1} max={3} step={0.1} onChange={(_, v) => setZoom(v as number)} />
              <Typography variant="caption">Xoay</Typography>
              <Slider value={rotation} min={0} max={360} step={1} onChange={(_, v) => setRotation(v as number)} />
            </Box>
            <DialogActions>
              <Button onClick={() => setCropOpen(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleCropDone}>Xong</Button>
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
