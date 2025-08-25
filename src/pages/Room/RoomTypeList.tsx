/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, CircularProgress, Typography, Collapse, TextField, Box, Button,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Select, MenuItem,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { AxiosError } from 'axios';
import api from '../../api/axios';
import '../../css/service.css';

interface Amenity { id: number; name: string; }
interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string;
  max_occupancy: number;
  base_rate: number;
  hourly_rate: number;   // NEW
  amenities: Amenity[];
}
interface ApiResponse {
  data: RoomType[];
  meta: { last_page: number };
}
interface ValidationErrors {
  code?: string; name?: string; description?: string;
  max_occupancy?: string; base_rate?: string; hourly_rate?: string; // NEW
}
interface AmenityPayload { id: number; quantity: number; }

const RoomTypesList: React.FC = () => {
  const navigate = useNavigate();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [editRoomTypeId, setEditRoomTypeId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<RoomType | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<number | null>(null);
  const [addAmenityDialogOpen, setAddAmenityDialogOpen] = useState<boolean>(false);
  const [selectedAmenitiesToAdd, setSelectedAmenitiesToAdd] = useState<number[]>([]);

  useEffect(() => {
    document.title = 'Danh sách Loại Phòng';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setLoading(false);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomTypesResponse, amenitiesResponse] = await Promise.all([
          api.get<ApiResponse>('/room-types', { params: { page: currentPage } }),
          api.get<{ data: Amenity[] }>('/amenities'),
        ]);

        if (!roomTypesResponse.data.data || !Array.isArray(roomTypesResponse.data.data)) {
          throw new Error('Dữ liệu loại phòng không đúng định dạng');
        }

        const mappedRoomTypes: RoomType[] = roomTypesResponse.data.data.map((item: any) => ({
          id: item.id,
          code: item.code || '',
          name: item.name || '',
          description: item.description || '',
          max_occupancy: Number(item.max_occupancy) || 0,
          base_rate: Number(item.base_rate) || 0,
          hourly_rate: Number(item.hourly_rate ?? 0), // NEW
          amenities: item.amenities || [],
        }));

        setRoomTypes(mappedRoomTypes);
        setLastPage(roomTypesResponse.data.meta?.last_page || 1);
        setAllAmenities(amenitiesResponse.data.data || []);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof AxiosError
            ? err.response?.status === 401
              ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
              : (err.response?.data as any)?.message || `Không thể tải dữ liệu: ${err.message}`
            : err instanceof Error
            ? err.message
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

    fetchData();
  }, [currentPage, navigate]);

  const validateForm = (data: RoomType): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code.trim()) errors.code = 'Mã không được để trống';
    if (!data.name.trim()) errors.name = 'Tên không được để trống';
    if (data.max_occupancy <= 0) errors.max_occupancy = 'Số người tối đa phải lớn hơn 0';
    if (data.base_rate < 0) errors.base_rate = 'Giá cơ bản không được âm';
    if (data.hourly_rate < 0) errors.hourly_rate = 'Giá theo giờ không được âm'; // NEW
    if (data.description && data.description.length > 500) errors.description = 'Mô tả không được vượt quá 500 ký tự';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const numericFields = ['max_occupancy', 'base_rate', 'hourly_rate'];
      const updatedData = {
        ...editFormData,
        [name]: numericFields.includes(name) ? Number(value) || 0 : value,
      } as RoomType;

      setEditFormData(updatedData);
      setValidationErrors(validateForm(updatedData));
    }
  };

  const handleEdit = (roomType: RoomType) => {
    setSelectedRoomTypeId(roomType.id);
    setEditRoomTypeId(roomType.id);
    setEditFormData({ ...roomType });
    setSelectedAmenities(roomType.amenities.map(a => a.id));
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
      if (!token) throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');

      const response = await api.put(
        `/room-types/${editFormData.id}`,
        {
          code: editFormData.code,
          name: editFormData.name,
          description: editFormData.description,
          max_occupancy: editFormData.max_occupancy,
          base_rate: editFormData.base_rate,
          hourly_rate: editFormData.hourly_rate,   // NEW
          amenities: selectedAmenities,           // nếu BE nhận chung
        }
      );

      if (response.status === 200) {
        setRoomTypes((prev) =>
          prev.map((rt) =>
            rt.id === editFormData.id
              ? { ...editFormData, amenities: allAmenities.filter(a => selectedAmenities.includes(a.id)) }
              : rt
          )
        );
        setEditRoomTypeId(null);
        setEditFormData(null);
        setSelectedRoomTypeId(null);
        setSelectedAmenities([]);
        toast.success('Cập nhật loại phòng thành công!');
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            : (err.response?.data as any)?.message || `Không thể cập nhật loại phòng: ${err.message}`
          : err instanceof Error
          ? `Không thể cập nhật loại phòng: ${err.message}`
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
    setEditRoomTypeId(null);
    setEditFormData(null);
    setSelectedRoomTypeId(null);
    setSelectedAmenities([]);
    setValidationErrors({});
    setEditError(null);
  };

  const handleViewDetails = (id: number) => {
    if (selectedRoomTypeId === id && editRoomTypeId !== id) {
      setSelectedRoomTypeId(null);
    } else {
      setSelectedRoomTypeId(id);
      setEditRoomTypeId(null);
      setEditFormData(null);
      setSelectedAmenities([]);
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleDelete = (id: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setRoomTypeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomTypeToDelete) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      const response = await api.delete(`/room-types/${roomTypeToDelete}`);

      if (response.status === 200) {
        setRoomTypes((prev) => prev.filter((rt) => rt.id !== roomTypeToDelete));
        toast.success('Xóa loại phòng thành công!');
        if (roomTypes.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
            : (err.response?.data as any)?.message || `Không thể xóa loại phòng: ${err.message}`
          : err instanceof Error
          ? `Không thể xóa loại phòng: ${err.message}`
          : 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    } finally {
      setDeleteDialogOpen(false);
      setRoomTypeToDelete(null);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => setCurrentPage(page);
  const handleRemoveAmenity = (amenityId: number) =>
    setSelectedAmenities(selectedAmenities.filter(id => id !== amenityId));
  const handleAddAmenityClick = () => setAddAmenityDialogOpen(true);

  const handleAddAmenityConfirm = async () => {
    if (selectedAmenitiesToAdd.length > 0 && editFormData) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        const newAmenities = selectedAmenitiesToAdd.filter(id => !selectedAmenities.includes(id));
        const updatedAmenities: AmenityPayload[] = [
          ...selectedAmenities.map(id => ({ id, quantity: 1 })),
          ...newAmenities.map(id => ({ id, quantity: 1 })),
        ];

        const response = await api.put(
          `/room-types/${editFormData.id}/amenities`,
          { amenities: updatedAmenities }
        );

        if (response.status === 200) {
          const updatedRoomType = response.data.data;
          setSelectedAmenities(updatedRoomType.map((a: Amenity) => a.id));
          setRoomTypes((prev) =>
            prev.map((rt) => (rt.id === editFormData.id ? { ...rt, amenities: updatedRoomType } : rt))
          );
          setAddAmenityDialogOpen(false);
          setSelectedAmenitiesToAdd([]);
          toast.success('Thêm tiện nghi thành công!');
        } else {
          throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof AxiosError
            ? err.response?.status === 401
              ? 'Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
              : (err.response?.data as any)?.message || `Không thể cập nhật tiện nghi: ${err.message}`
            : err instanceof Error
            ? `Không thể cập nhật tiện nghi: ${err.message}`
            : 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(errorMessage);
        if (err instanceof AxiosError && err.response?.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
        }
      }
    }
  };

  const handleCancelAddAmenity = () => {
    setAddAmenityDialogOpen(false);
    setSelectedAmenitiesToAdd([]);
  };

  const handleAddNew = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Bạn cần đăng nhập để thêm loại phòng mới. Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    navigate('/room-types/add');
  };

  const fmtVnd = (n: number | undefined | null) => (typeof n === 'number' ? `${n.toLocaleString()} đ` : '-');

  return (
    <div className="promotions-wrapper">
      {/* header */}
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Loại phòng {'>'} Danh sách
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>Loại Phòng</Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Tìm kiếm loại phòng"
              variant="outlined"
              size="small"
              sx={{ width: { xs: '100%', sm: 300 }, bgcolor: '#fff', borderRadius: '8px', '& input': { fontSize: '15px' } }}
              disabled
            />
            <Button
              variant="contained"
              onClick={handleAddNew}
              sx={{
                backgroundColor: '#4318FF', color: '#fff', textTransform: 'none', fontWeight: 600,
                borderRadius: '8px', px: 2.5, py: 0.7, boxShadow: '0 2px 6px rgba(106, 27, 154, 0.3)',
                '&:hover': { backgroundColor: '#7B1FA2', boxShadow: '0 4px 12px rgba(106, 27, 154, 0.4)' },
              }}
            >
              + Thêm mới
            </Button>
          </Box>
        </Box>
      </div>

      {/* table */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography ml={2}>Đang tải danh sách loại phòng...</Typography>
        </Box>
      ) : error ? (
        <Typography color="error" p={2} textAlign="center">{error}</Typography>
      ) : roomTypes.length === 0 ? (
        <Typography p={2} textAlign="center">Không tìm thấy loại phòng nào.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="promotions-table-container" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                <TableRow>
                  <TableCell sx={{ minWidth: '120px' }}><b>Mã</b></TableCell>
                  <TableCell sx={{ minWidth: '150px' }}><b>Tên</b></TableCell>
                  <TableCell sx={{ minWidth: '200px' }}><b>Mô tả</b></TableCell>
                  <TableCell sx={{ minWidth: '120px' }}><b>Số người tối đa</b></TableCell>
                  <TableCell sx={{ minWidth: '120px' }}><b>Giá cơ bản</b></TableCell>
                  <TableCell sx={{ minWidth: '120px' }}><b>Giá theo giờ</b></TableCell> {/* NEW */}
                  <TableCell align="center" sx={{ minWidth: '150px' }}><b>Hành động</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roomTypes.map((rt) => (
                  <React.Fragment key={rt.id}>
                    <TableRow hover>
                      <TableCell>{rt.code}</TableCell>
                      <TableCell>{rt.name}</TableCell>
                      <TableCell>{rt.description}</TableCell>
                      <TableCell>{rt.max_occupancy}</TableCell>
                      <TableCell>{fmtVnd(rt.base_rate)}</TableCell>
                      <TableCell>{fmtVnd(rt.hourly_rate)}</TableCell> {/* NEW */}
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1} sx={{ flexWrap: 'wrap' }}>
                          <IconButton
                            title={selectedRoomTypeId === rt.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                            onClick={() => handleViewDetails(rt.id)}
                            sx={{ color: '#1976d2', bgcolor: '#e3f2fd', p: '6px',
                              '&:hover': { bgcolor: '#bbdefb', boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)' } }}
                          >
                            {selectedRoomTypeId === rt.id ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                          <IconButton
                            title="Chỉnh sửa loại phòng"
                            onClick={() => handleEdit(rt)}
                            sx={{
                              color: '#FACC15', bgcolor: '#fef9c3', p: '6px',
                              '&:hover': { bgcolor: '#fff9c4', boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            title="Xóa loại phòng"
                            onClick={() => handleDelete(rt.id)}
                            sx={{
                              color: '#d32f2f', bgcolor: '#ffebee', p: '6px',
                              '&:hover': { bgcolor: '#ffcdd2', boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={7} style={{ padding: 0 }}>
                        <Collapse in={selectedRoomTypeId === rt.id}>
                          <div className="promotion-detail-container">
                            {editRoomTypeId === rt.id && editFormData ? (
                              <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                                  Chỉnh sửa loại phòng
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                  <Box display="flex" gap={2}>
                                    <TextField label="Mã" name="code" value={editFormData.code} onChange={handleChange}
                                      fullWidth size="small" variant="outlined"
                                      error={!!validationErrors.code} helperText={validationErrors.code} />
                                    <TextField label="Tên" name="name" value={editFormData.name} onChange={handleChange}
                                      fullWidth size="small" variant="outlined"
                                      error={!!validationErrors.name} helperText={validationErrors.name} />
                                  </Box>

                                  <Box display="flex" gap={2}>
                                    <TextField label="Số người tối đa" name="max_occupancy" type="number"
                                      value={editFormData.max_occupancy} onChange={handleChange}
                                      fullWidth size="small" variant="outlined"
                                      error={!!validationErrors.max_occupancy} helperText={validationErrors.max_occupancy}
                                      inputProps={{ min: 0 }} />
                                    <TextField label="Giá cơ bản (VNĐ)" name="base_rate" type="number"
                                      value={editFormData.base_rate} onChange={handleChange}
                                      fullWidth size="small" variant="outlined"
                                      error={!!validationErrors.base_rate} helperText={validationErrors.base_rate}
                                      inputProps={{ min: 0 }} />
                                  </Box>

                                  {/* hourly_rate + description */}
                                  <Box display="flex" gap={2}>
                                    <TextField label="Giá theo giờ (VNĐ)" name="hourly_rate" type="number"
                                      value={editFormData.hourly_rate} onChange={handleChange}
                                      fullWidth size="small" variant="outlined"
                                      error={!!validationErrors.hourly_rate} helperText={validationErrors.hourly_rate}
                                      inputProps={{ min: 0 }} />
                                    <TextField label="Mô tả" name="description"
                                      value={editFormData.description} onChange={handleChange}
                                      fullWidth size="small" variant="outlined" multiline rows={3}
                                      error={!!validationErrors.description} helperText={validationErrors.description} />
                                  </Box>

                                  <Typography variant="h6" mb={1} sx={{ fontWeight: 600, color: '#333' }}>
                                    Tiện nghi
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', p: 2, borderRadius: '8px', minHeight: '60px' }}>
                                    {selectedAmenities.length > 0 ? (
                                      selectedAmenities.map(amenityId => {
                                        const amenity = allAmenities.find(a => a.id === amenityId);
                                        return amenity ? (
                                          <Chip key={amenityId} label={amenity.name}
                                            onDelete={() => handleRemoveAmenity(amenityId)}
                                            deleteIcon={<CloseIcon sx={{ fontSize: 16, color: '#fff !important' }} />}
                                            sx={{
                                              bgcolor: '#4318FF', color: '#fff', fontWeight: 500, borderRadius: '12px',
                                              height: '32px', pr: '5px', '&:hover': { bgcolor: '#7B1FA2' },
                                              '& .MuiChip-deleteIcon': {
                                                bgcolor: '#d32f2f', borderRadius: '50%', width: '20px', height: '20px', p: '1px', ml: '5px',
                                              },
                                            }}
                                          />
                                        ) : null;
                                      })
                                    ) : (
                                      <Typography variant="body2" color="textSecondary">
                                        Không có tiện nghi nào được chọn
                                      </Typography>
                                    )}
                                    <IconButton color="primary" onClick={handleAddAmenityClick} size="small"
                                      sx={{ color: '#4318FF', '&:hover': { bgcolor: '#f4f6fa', color: '#7B1FA2' } }}>
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </Box>

                                  <Box mt={2} display="flex" gap={2}>
                                    <Button variant="contained" onClick={handleSave} disabled={editLoading}
                                      sx={{ backgroundColor: '#4318FF', color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, py: 0.7,
                                        '&:hover': { backgroundColor: '#7B1FA2' }, '&:disabled': { backgroundColor: '#a9a9a9' } }}>
                                      {editLoading ? <CircularProgress size={24} /> : 'Lưu'}
                                    </Button>
                                    <Button variant="outlined" onClick={handleCancel} disabled={editLoading}
                                      sx={{ color: '#f44336', borderColor: '#f44336', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, py: 0.7,
                                        '&:hover': { borderColor: '#d32f2f', backgroundColor: '#ffebee' },
                                        '&:disabled': { color: '#a9a9a9', borderColor: '#a9a9a9' } }}>
                                      Hủy
                                    </Button>
                                  </Box>
                                  {editError && <Typography color="error" mt={1}>{editError}</Typography>}
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                                  Thông tin loại phòng
                                </Typography>
                                <Box display="grid" gap={1}>
                                  <Typography><strong>Mã:</strong> {rt.code}</Typography>
                                  <Typography><strong>Tên:</strong> {rt.name}</Typography>
                                  <Typography><strong>Số người tối đa:</strong> {rt.max_occupancy}</Typography>
                                  <Typography><strong>Giá cơ bản:</strong> {fmtVnd(rt.base_rate)}</Typography>
                                  <Typography><strong>Giá theo giờ:</strong> {fmtVnd(rt.hourly_rate)}</Typography> {/* NEW */}
                                  <Typography><strong>Mô tả:</strong> {rt.description}</Typography>
                                  <Typography><strong>Tiện nghi:</strong></Typography>
                                  <Box display="flex" flexWrap="wrap" gap={1}>
                                    {rt.amenities.length > 0 ? (
                                      rt.amenities.map((amenity) => (
                                        <Chip key={amenity.id} label={amenity.name} size="small" color="primary" variant="outlined"
                                          sx={{ borderColor: '#4318FF', color: '#4318FF', '&:hover': { bgcolor: '#f4f6fa' } }} />
                                      ))
                                    ) : (
                                      <Typography variant="body2" color="textSecondary">
                                        Không có tiện nghi
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
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

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xóa loại phòng</DialogTitle>
        <DialogContent><Typography>Bạn có chắc chắn muốn xóa loại phòng này không? Hành động này không thể hoàn tác.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: '#d32f2f', borderColor: '#d32f2f', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, py: 0.7,
              '&:hover': { borderColor: '#b71c1c', backgroundColor: '#ffebee' } }}>
            Hủy
          </Button>
          <Button onClick={confirmDelete} variant="contained"
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, py: 0.7 }}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add amenity dialog */}
      <Dialog open={addAmenityDialogOpen} onClose={handleCancelAddAmenity} maxWidth="xs" fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Chọn tiện nghi để thêm</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Select
              multiple fullWidth value={selectedAmenitiesToAdd}
              onChange={(e) => setSelectedAmenitiesToAdd(e.target.value as number[])}
              renderValue={(selected) =>
                (selected as number[]).map(id => allAmenities.find(a => a.id === id)?.name).filter(Boolean).join(', ')
              }
              sx={{ bgcolor: '#fff', borderRadius: '8px' }}
            >
              {allAmenities.filter(a => !selectedAmenities.includes(a.id)).map(amenity => (
                <MenuItem key={amenity.id} value={amenity.id}>{amenity.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAddAmenity}
            sx={{ color: '#d32f2f', borderColor: '#d32f2f', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, py: 0.7,
              '&:hover': { borderColor: '#b71c1c', backgroundColor: '#ffebee' } }}>
            Hủy
          </Button>
          <Button onClick={handleAddAmenityConfirm} variant="contained"
            sx={{ bgcolor: '#4318FF', '&:hover': { bgcolor: '#7B1FA2' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, py: 0.7,
              '&:disabled': { bgcolor: '#a9a9a9' } }}
            disabled={selectedAmenitiesToAdd.length === 0}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RoomTypesList;
