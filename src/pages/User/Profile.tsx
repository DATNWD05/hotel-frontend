import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography,
  Avatar, Grid, Divider, CircularProgress,
  Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack,
  Slider, IconButton
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

const GALLERY_IMAGES = [
  '/public/image/guku.jpg',
  '/public/image/Akaza.jpg',
  '/public/image/nak.jpg',
  '/public/image/raz.jpg',
  '/public/image/slimn.jpg',
  '/public/image/tulen.jpg',
  '/public/image/lini.jpg',
  '/public/image/val.jpg',
  '/public/image/zip.jpg',
  '/public/image/luffy.jpg',
];

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

  const [actionOpen, setActionOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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

  const handleUpload = async (selectedFile?: File) => {
    if (!emp) return;
    if (!file && !selectedFile) return;
    setUploading(true);
    setValidationError(null);

    try {
      const form = new FormData();
      form.append('face_image', selectedFile || file!);
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

      toast.success('Cập nhật avatar thành công');
      setUploadDialogOpen(false);
      setFile(null);
      setValidationError(null);
      setActionOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.response?.status === 422) {
        const msg = e.response.data.message ||
          Object.values(e.response.data.errors || {}).flat().join(' ') ||
          'Dữ liệu không hợp lệ';
        setValidationError(msg);
        toast.error(msg);
      } else {
        const msg = e.response?.data?.message || 'Lỗi hệ thống';
        toast.error(msg);
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

  const handleGalleryImageSelect = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `gallery-avatar-${Date.now()}.jpg`, { type: blob.type});
      
      setPreview(imageUrl);
      setFile(file);
      
      await handleUpload(file);
    } catch (error) {
      toast.error('Lỗi khi chọn ảnh từ thư viện');
      console.log('Error selecting image from gallery:', error);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Box mx="auto" mt={4}><Alert severity="error">{error}</Alert></Box>;
  if (!emp) return null;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 6 }}>
      <Card sx={{ maxWidth: 1200, mx: 'auto', borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" mb={4} sx={{ background: 'linear-gradient(135deg, #4a90e2, #9013fe)', p: 3, borderRadius: 1 }}>
            <Avatar
              key={preview}
              src={preview}
              sx={{ width: 150, height: 150, border: '5px solid white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', mb: { xs: 2, md: 0 }, mr: { md: 4 } }}
              onClick={handleAvatarClick}
              onError={() => setPreview(DEFAULT_AVATAR)}
            />
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>Hồ Sơ Cá Nhân</Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 1 }}>Cập nhật thông tin cá nhân của bạn tại đây</Typography>
            </Box>
          </Box>

          <Dialog open={actionOpen} onClose={() => setActionOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Ảnh đại diện</DialogTitle>
            <DialogContent dividers>
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>Thư viện ảnh</Typography>
                <Grid container spacing={2}>
                  {file && (
                    <Grid item xs={4}>
                      <Avatar
                        src={preview}
                        sx={{ width: 80, height: 80, mx: 'auto', cursor: 'pointer', border: '2px solid #1976d2' }}
                        onClick={() => handleGalleryImageSelect(preview)}
                        onError={() => setPreview(DEFAULT_AVATAR)}
                      />
                      <Typography variant="caption" align="center" display="block">Đã tải lên</Typography>
                    </Grid>
                  )}
                  <Grid item xs={4}>
                    <Avatar
                      src={emp.face_image ? resolvePath(emp.face_image) : DEFAULT_AVATAR}
                      sx={{ width: 80, height: 80, mx: 'auto', cursor: 'pointer', border: preview === (emp.face_image ? resolvePath(emp.face_image) : DEFAULT_AVATAR) && !file ? '2px solid #1976d2' : 'none' }}
                      onClick={() => handleGalleryImageSelect(emp.face_image ? resolvePath(emp.face_image) : DEFAULT_AVATAR)}
                      onError={() => setPreview(DEFAULT_AVATAR)}
                    />
                    <Typography variant="caption" align="center" display="block">Hiện tại</Typography>
                  </Grid>
                  {GALLERY_IMAGES.map((img, index) => (
                    <Grid item xs={4} key={index}>
                      <Avatar
                        src={img}
                        sx={{ width: 80, height: 80, mx: 'auto', cursor: 'pointer' }}
                        onClick={() => handleGalleryImageSelect(img)}
                        onError={() => setPreview(DEFAULT_AVATAR)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
              <Button
                variant="contained"
                onClick={handleChooseView}
                sx={{
                  background: 'linear-gradient(135deg, #4a90e2, #9013fe)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: 8,
                  '&:hover': { background: 'linear-gradient(135deg, #357abd, #7b1fa2)' }
                }}
              >
                Xem ảnh đại diện
              </Button>
              <Button
                variant="contained"
                onClick={handleChooseUpload}
                sx={{
                  background: 'linear-gradient(135deg, #4a90e2, #9013fe)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: 8,
                  '&:hover': { background: 'linear-gradient(135deg, #357abd, #7b1fa2)' }
                }}
              >
                Tải ảnh lên
              </Button>
            </DialogActions>
          </Dialog>

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
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    background: 'linear-gradient(135deg, #4a90e2, #9013fe)',
                    color: 'white',
                    padding: '8px 20px',
                    borderRadius: 8,
                    '&:hover': { background: 'linear-gradient(135deg, #357abd, #7b1fa2)' }
                  }}
                >
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
              <Button
                onClick={closeUploadDialog}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #4a90e2, #9013fe)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: 8,
                  '&:hover': { background: 'linear-gradient(135deg, #357abd, #7b1fa2)' }
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={() => handleUpload()}
                disabled={!file || uploading}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #4a90e2, #9013fe)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: 8,
                  '&:hover': { background: 'linear-gradient(135deg, #357abd, #7b1fa2)' }
                }}
              >
                {uploading ? <CircularProgress size={24} /> : 'Tải lên'}
              </Button>
            </DialogActions>
          </Dialog>

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

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>Thông tin cá nhân</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Họ và tên:</Typography>
                  <Typography>{emp.name}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Email:</Typography>
                  <Typography>{emp.email}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Điện thoại:</Typography>
                  <Typography>{emp.phone || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Ngày sinh:</Typography>
                  <Typography>{emp.birthday || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Giới tính:</Typography>
                  <Typography>{emp.gender || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>CCCD:</Typography>
                  <Typography>{emp.cccd || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Địa chỉ:</Typography>
                  <Typography>{emp.address || '—'}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4, borderColor: '#ecf0f1' }} />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>Thông tin công việc</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Phòng ban:</Typography>
                  <Typography>{emp.department?.name || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Ngày tuyển dụng:</Typography>
                  <Typography>{emp.hire_date || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Vai trò:</Typography>
                  <Typography>{emp.role?.name || '—'}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4, borderColor: '#ecf0f1' }} />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>Thông tin tài khoản</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Email đăng nhập:</Typography>
                  <Typography>{emp.user?.email || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Trạng thái:</Typography>
                  <Typography>{emp.user?.status || '—'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ fontWeight: 500, color: '#34495e', minWidth: 100 }}>Ngày tạo:</Typography>
                  <Typography>{emp.user?.created_at?.slice(0, 10) || '—'}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box mt={6} textAlign="center">
            <Button
              variant="contained"
              sx={{ background: 'linear-gradient(135deg, #4a90e2, #9013fe)', color: 'white', padding: '10px 30px', borderRadius: 8, '&:hover': { background: 'linear-gradient(135deg, #357abd, #7b1fa2)' } }}
              onClick={() => nav('/user')}
            >
              Chỉnh sửa hồ sơ
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;