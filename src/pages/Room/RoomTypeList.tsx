import React, { useState, useEffect } from 'react';
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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Select,
  MenuItem,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import axios, { AxiosError } from 'axios';
import '../../css/service.css';

interface Amenity {
  id: number;
  name: string;
}

interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string;
  max_occupancy: number;
  base_rate: number;
  amenities: Amenity[];
}

interface ApiResponse {
  data: RoomType[];
  meta: {
    last_page: number;
  };
}

interface ValidationErrors {
  code?: string;
  name?: string;
  description?: string;
  max_occupancy?: string;
  base_rate?: string;
}

interface AmenityPayload {
  id: number;
  quantity: number;
}

const RoomTypesList: React.FC = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
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
      setError('Không tìm thấy token xác thực');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomTypesResponse, amenitiesResponse] = await Promise.all([
          axios.get<ApiResponse>(`http://127.0.0.1:8000/api/room-types?page=${currentPage}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<{ data: Amenity[] }>('http://127.0.0.1:8000/api/amenities', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!roomTypesResponse.data.data || !Array.isArray(roomTypesResponse.data.data)) {
          setError('Dữ liệu loại phòng không đúng định dạng');
          return;
        }

        const mappedRoomTypes: RoomType[] = roomTypesResponse.data.data.map((item: RoomType) => ({
          id: item.id,
          code: item.code || '',
          name: item.name || '',
          description: item.description || '',
          max_occupancy: item.max_occupancy || 0,
          base_rate: item.base_rate || 0,
          amenities: item.amenities || [],
        }));

        setRoomTypes(mappedRoomTypes);
        setLastPage(roomTypesResponse.data.meta?.last_page || 1);
        setAllAmenities(amenitiesResponse.data.data || []);
      } catch (err) {
        const errorMessage = (err as AxiosError)?.message || 'Lỗi không xác định';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const validateForm = (data: RoomType): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code.trim()) errors.code = 'Mã không được để trống';
    if (!data.name.trim()) errors.name = 'Tên không được để trống';
    if (data.max_occupancy <= 0) errors.max_occupancy = 'Số người tối đa phải lớn hơn 0';
    if (data.base_rate < 0) errors.base_rate = 'Giá cơ bản không được âm';
    if (data.description && data.description.length > 500) errors.description = 'Mô tả không được vượt quá 500 ký tự';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = {
        ...editFormData,
        [name]: name === 'max_occupancy' || name === 'base_rate' ? Number(value) || 0 : value,
      };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
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
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Không tìm thấy token xác thực');

      const response = await axios.put(
        `http://127.0.0.1:8000/api/room-types/${editFormData.id}`,
        {
          code: editFormData.code,
          name: editFormData.name,
          description: editFormData.description,
          max_occupancy: editFormData.max_occupancy,
          base_rate: editFormData.base_rate,
          amenities: selectedAmenities,
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        setRoomTypes((prev) =>
          prev.map((rt) => (rt.id === editFormData.id ? { ...editFormData, amenities: allAmenities.filter(a => selectedAmenities.includes(a.id)) } : rt))
        );
        setEditRoomTypeId(null);
        setEditFormData(null);
        setSelectedRoomTypeId(null);
        setSelectedAmenities([]);
        setSnackbarMessage('Cập nhật loại phòng thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể cập nhật loại phòng');
      }
    } catch (err) {
      const errorMessage = (err as AxiosError)?.message || 'Đã xảy ra lỗi khi cập nhật loại phòng';
      setEditError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
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
    setRoomTypeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomTypeToDelete) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/room-types/${roomTypeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setRoomTypes((prev) => prev.filter((rt) => rt.id !== roomTypeToDelete));
        setSnackbarMessage('Xóa loại phòng thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error('Không thể xóa loại phòng');
      }
    } catch (err) {
      const errorMessage = (err as AxiosError)?.message || 'Lỗi không xác định';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setRoomTypeToDelete(null);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handleRemoveAmenity = (amenityId: number) => {
    setSelectedAmenities(selectedAmenities.filter(id => id !== amenityId));
  };

  const handleAddAmenityClick = () => {
    setAddAmenityDialogOpen(true);
  };

  const handleAddAmenityConfirm = async () => {
    if (selectedAmenitiesToAdd.length > 0 && editFormData) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      try {
        const newAmenities = selectedAmenitiesToAdd.filter(id => !selectedAmenities.includes(id));
        const updatedAmenities: AmenityPayload[] = [
          ...selectedAmenities.map(id => ({ id, quantity: 1 })),
          ...newAmenities.map(id => ({ id, quantity: 1 })),
        ];

        const response = await axios.put(
          `http://127.0.0.1:8000/api/room-types/${editFormData.id}/amenities`,
          { amenities: updatedAmenities },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );

        if (response.status === 200) {
          const updatedRoomType = response.data.data;
          setSelectedAmenities(updatedRoomType.map((a: Amenity) => a.id));
          setRoomTypes((prev) =>
            prev.map((rt) =>
              rt.id === editFormData.id ? { ...rt, amenities: updatedRoomType } : rt
            )
          );
          setAddAmenityDialogOpen(false);
          setSelectedAmenitiesToAdd([]);
          setSnackbarMessage('Thêm tiện nghi thành công!');
          setSnackbarOpen(true);
        } else {
          throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
        }
      } catch (err) {
        const error = err as AxiosError;
        const errorMessage = error.response
          ? `Không thể cập nhật tiện nghi: ${JSON.stringify(error.response.data) || error.response.statusText} (Mã: ${error.response.status})`
          : `Không thể cập nhật tiện nghi: ${error.message || 'Lỗi không xác định'}`;
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      }
    }
  };

  const handleCancelAddAmenity = () => {
    setAddAmenityDialogOpen(false);
    setSelectedAmenitiesToAdd([]);
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
          Loại phòng {'>'} Danh sách
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight={700}>
            Loại Phòng
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm loại phòng"
              variant="outlined"
              size="small"
              sx={{ width: 300, bgcolor: '#fff', borderRadius: '8px', '& input': { fontSize: '15px' } }}
              disabled
            />
            <Button
              variant="contained"
              onClick={() => window.location.href = '/room-types/add'}
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

      {loading ? (
        <div className="promotions-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách loại phòng...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotions-error-message">
          {error}
        </Typography>
      ) : roomTypes.length === 0 ? (
        <Typography className="promotions-no-data">
          Không tìm thấy loại phòng nào.
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="promotions-table-container">
            <Table className="promotions-table" sx={{ width: '100%' }}>
              <TableHead sx={{ backgroundColor: '#f4f6fa' }}>
                <TableRow>
                  <TableCell><b>ID</b></TableCell>
                  <TableCell><b>Mã</b></TableCell>
                  <TableCell><b>Tên</b></TableCell>
                  <TableCell><b>Mô tả</b></TableCell>
                  <TableCell><b>Số người tối đa</b></TableCell>
                  <TableCell><b>Giá cơ bản</b></TableCell>
                  <TableCell align="center"><b>Hành động</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roomTypes.map((rt) => (
                  <React.Fragment key={rt.id}>
                    <TableRow>
                      <TableCell>{rt.id}</TableCell>
                      <TableCell>{rt.code}</TableCell>
                      <TableCell>{rt.name}</TableCell>
                      <TableCell>{rt.description}</TableCell>
                      <TableCell>{rt.max_occupancy}</TableCell>
                      <TableCell>{rt.base_rate.toLocaleString()} đ</TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <IconButton
                            title={selectedRoomTypeId === rt.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                            onClick={() => handleViewDetails(rt.id)}
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
                            {selectedRoomTypeId === rt.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                          <IconButton
                            title="Chỉnh sửa loại phòng"
                            onClick={() => handleEdit(rt)}
                            sx={{
                              color: '#FACC15',
                              bgcolor: '#fef9c3',
                              '&:hover': {
                                bgcolor: '#fff9c4',
                                boxShadow: '0 2px 6px rgba(250, 204, 21, 0.4)',
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            title="Xóa loại phòng"
                            onClick={() => handleDelete(rt.id)}
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
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} style={{ padding: 0 }}>
                        <Collapse in={selectedRoomTypeId === rt.id}>
                          <div className="promotion-detail-container">
                            {editRoomTypeId === rt.id && editFormData ? (
                              <>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                                  Chỉnh sửa loại phòng
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={2} sx={{ p: 2, bgcolor: '#f4f6fa', borderRadius: '8px' }}>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Mã"
                                      name="code"
                                      value={editFormData.code}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.code}
                                      helperText={validationErrors.code}
                                      sx={{ bgcolor: '#fff', borderRadius: '8px' }}
                                    />
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
                                      sx={{ bgcolor: '#fff', borderRadius: '8px' }}
                                    />
                                  </Box>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Số người tối đa"
                                      name="max_occupancy"
                                      type="number"
                                      value={editFormData.max_occupancy}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.max_occupancy}
                                      helperText={validationErrors.max_occupancy}
                                      inputProps={{ min: 0 }}
                                      sx={{ bgcolor: '#fff', borderRadius: '8px' }}
                                    />
                                    <TextField
                                      label="Giá cơ bản"
                                      name="base_rate"
                                      type="number"
                                      value={editFormData.base_rate}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.base_rate}
                                      helperText={validationErrors.base_rate}
                                      inputProps={{ min: 0 }}
                                      sx={{ bgcolor: '#fff', borderRadius: '8px' }}
                                    />
                                  </Box>
                                  <Box display="flex" gap={2}>
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
                                      sx={{ bgcolor: '#fff', borderRadius: '8px' }}
                                    />
                                  </Box>
                                  <Typography variant="h6" mb={1} sx={{ fontWeight: 600, color: '#333' }}>
                                    Tiện nghi
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', p: 2, borderRadius: '8px', minHeight: '60px' }}>
                                    {selectedAmenities.length > 0 ? (
                                      selectedAmenities.map(amenityId => {
                                        const amenity = allAmenities.find(a => a.id === amenityId);
                                        return amenity ? (
                                          <Chip
                                            key={amenityId}
                                            label={amenity.name}
                                            onDelete={() => handleRemoveAmenity(amenityId)}
                                            deleteIcon={
                                              <CloseIcon sx={{ fontSize: 16, color: '#fff !important' }} />
                                            }
                                            sx={{
                                              bgcolor: '#4318FF',
                                              color: '#fff',
                                              fontWeight: 500,
                                              borderRadius: '12px', // Increased from 8px to 12px for rounder edges
                                              height: '32px',
                                              pr: '5px', 
                                              '&:hover': {
                                                bgcolor: '#7B1FA2',
                                              },
                                              '& .MuiChip-deleteIcon': {
                                                bgcolor: '#d32f2f',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                p: '1px',
                                                ml: '5px', // Kept margin to maintain separation
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
                                    <IconButton
                                      color="primary"
                                      onClick={handleAddAmenityClick}
                                      size="small"
                                      sx={{
                                        color: '#4318FF',
                                        '&:hover': {
                                          bgcolor: '#f4f6fa',
                                          color: '#7B1FA2',
                                        },
                                      }}
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
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
                                        boxShadow: '0 2px 6px rgba(106, 27, 154, 0.3)',
                                        '&:hover': {
                                          backgroundColor: '#7B1FA2',
                                          boxShadow: '0 4px 12px rgba(106, 27, 154, 0.4)',
                                        },
                                        '&:disabled': {
                                          backgroundColor: '#a9a9a9',
                                          boxShadow: 'none',
                                        },
                                      }}
                                    >
                                      Lưu
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
                                        '&:disabled': {
                                          color: '#a9a9a9',
                                          borderColor: '#a9a9a9',
                                        },
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
                                </Box>
                              </>
                            ) : (
                              <>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                                  Thông tin loại phòng
                                </Typography>
                                <Table className="promotion-detail-table">
                                  <TableBody>
                                    <TableRow>
                                      <TableCell><strong>Mã:</strong> {rt.code}</TableCell>
                                      <TableCell><strong>Tên:</strong> {rt.name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell><strong>Số người tối đa:</strong> {rt.max_occupancy}</TableCell>
                                      <TableCell><strong>Giá cơ bản:</strong> {rt.base_rate.toLocaleString()} đ</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell colSpan={2}><strong>Mô tả:</strong> {rt.description}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell colSpan={2}>
                                        <strong>Tiện nghi:</strong>
                                        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                          {rt.amenities.length > 0 ? (
                                            rt.amenities.map((amenity) => (
                                              <Chip
                                                key={amenity.id}
                                                label={amenity.name}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{
                                                  borderColor: '#4318FF',
                                                  color: '#4318FF',
                                                  '&:hover': {
                                                    bgcolor: '#f4f6fa',
                                                  },
                                                }}
                                              />
                                            ))
                                          ) : (
                                            <Typography variant="body2" color="textSecondary">
                                              Không có tiện nghi
                                            </Typography>
                                          )}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </>
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
              />
            </Box>
          )}
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xóa loại phòng</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa loại phòng này không? Hành động này không thể hoàn tác.
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
              px: '2.5',
              py: '0.7',
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

      <Dialog
        open={addAmenityDialogOpen}
        onClose={handleCancelAddAmenity}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Chọn tiện nghi để thêm</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Select
              multiple
              fullWidth
              value={selectedAmenitiesToAdd}
              onChange={(e) => setSelectedAmenitiesToAdd(e.target.value as number[])}
              renderValue={(selected) => (
                selected
                  .map(id => allAmenities.find(a => a.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')
              )}
              sx={{ bgcolor: '#fff', borderRadius: '8px' }}
            >
              {allAmenities
                .filter(a => !selectedAmenities.includes(a.id))
                .map(amenity => (
                  <MenuItem key={amenity.id} value={amenity.id}>
                    {amenity.name}
                  </MenuItem>
                ))}
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelAddAmenity}
            sx={{
              color: '#d32f2f',
              borderColor: '#d32f2f',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: '2.5',
              py: '0.7',
              '&:hover': { borderColor: '#b71c1c', backgroundColor: '#ffebee' },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleAddAmenityConfirm}
            variant="contained"
            sx={{ bgcolor: '#4318FF', '&:hover': { bgcolor: '#7B1FA2' }, '&:disabled': { bgcolor: '#a9a9a9' } }}
            disabled={selectedAmenitiesToAdd.length === 0}
          >
            Thêm
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

export default RoomTypesList;