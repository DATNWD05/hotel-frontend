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
      Snackbar,
      Alert,
      Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
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

const RoomTypesList: React.FC = () => {
      const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
      const [currentPage, setCurrentPage] = useState<number>(1);
      const [lastPage, setLastPage] = useState<number>(1);
      const [loading, setLoading] = useState<boolean>(true);
      const [error, setError] = useState<string | null>(null);
      const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
      const [snackbarMessage, setSnackbarMessage] = useState<string>('');
      const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
      const [editRoomTypeId, setEditRoomTypeId] = useState<number | null>(null);
      const [editFormData, setEditFormData] = useState<RoomType | null>(null);
      const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
      const [editLoading, setEditLoading] = useState<boolean>(false);
      const [editError, setEditError] = useState<string | null>(null);

      useEffect(() => {
            document.title = 'Danh sách loại phòng';
            const token = localStorage.getItem('auth_token');
            if (!token) {
                  setError('Không tìm thấy token xác thực');
                  setLoading(false);
                  return;
            }

            const fetchRoomTypes = async () => {
                  try {
                        setLoading(true);
                        const url = `http://127.0.0.1:8000/api/room-types?page=${currentPage}`;
                        const response = await axios.get<ApiResponse>(url, {
                              headers: { Authorization: `Bearer ${token}` },
                        });

                        if (!response.data.data || !Array.isArray(response.data.data)) {
                              setError('Dữ liệu loại phòng không đúng định dạng');
                              return;
                        }

                        const mapped: RoomType[] = response.data.data.map((item: RoomType) => ({
                              id: item.id,
                              code: item.code || '',
                              name: item.name || '',
                              description: item.description || '',
                              max_occupancy: item.max_occupancy || 0,
                              base_rate: item.base_rate || 0,
                              amenities: item.amenities || [],
                        }));

                        setRoomTypes(mapped);
                        setLastPage(response.data.meta?.last_page || 1);
                  } catch (err) {
                        const errorMessage = err instanceof Error ? `Không thể tải danh sách loại phòng: ${err.message}` : 'Lỗi không xác định';
                        setError(errorMessage);
                  } finally {
                        setLoading(false);
                  }
            };

            fetchRoomTypes();
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
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                  );

                  if (response.status === 200) {
                        setRoomTypes((prev) =>
                              prev.map((rt) => (rt.id === editFormData.id ? { ...editFormData } : rt))
                        );
                        setEditRoomTypeId(null);
                        setEditFormData(null);
                        setSnackbarMessage('Cập nhật loại phòng thành công!');
                        setSnackbarOpen(true);
                  } else {
                        throw new Error('Không thể cập nhật loại phòng');
                  }
            } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật loại phòng';
                  setEditError(errorMessage);
            } finally {
                  setEditLoading(false);
            }
      };

      const handleCancel = () => {
            setEditRoomTypeId(null);
            setEditFormData(null);
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
                  setValidationErrors({});
                  setEditError(null);
            }
      };

      const handleDelete = async (id: number) => {
            if (!window.confirm('Bạn có chắc chắn muốn xóa loại phòng này?')) return;

            const token = localStorage.getItem('auth_token');
            if (!token) {
                  setError('Không tìm thấy token xác thực');
                  return;
            }

            try {
                  const response = await axios.delete(`http://127.0.0.1:8000/api/room-types/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                  });

                  if (response.status === 200) {
                        setRoomTypes((prev) => prev.filter((rt) => rt.id !== id));
                        setSnackbarMessage('Xóa loại phòng thành công!');
                        setSnackbarOpen(true);
                  } else {
                        throw new Error('Không thể xóa loại phòng');
                  }
            } catch (err) {
                  const errorMessage = err instanceof Error ? `Không thể xóa loại phòng: ${err.message}` : 'Lỗi không xác định';
                  setError(errorMessage);
            }
      };

      const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
            setCurrentPage(page);
      };

      const handleSnackbarClose = () => {
            setSnackbarOpen(false);
            setSnackbarMessage('');
      };

      return (
            <div className="service-container">
                  <div className="header">
                        <h1>Danh sách loại phòng</h1>
                        <a className="btn-add" href="/room-types/add">
                              Tạo mới Loại phòng
                        </a>
                  </div>

                  {loading ? (
                        <Box display="flex" alignItems="center" justifyContent="center" mt={4}>
                              <CircularProgress />
                              <Typography ml={2}>Đang tải danh sách loại phòng...</Typography>
                        </Box>
                  ) : error ? (
                        <Typography color="error" className="error-message">
                              {error}
                        </Typography>
                  ) : (
                        <>
                              <TableContainer component={Paper} className="service-table-container">
                                    <Table className="service-table">
                                          <TableHead>
                                                <TableRow>
                                                      <TableCell>ID</TableCell>
                                                      <TableCell>Code</TableCell>
                                                      <TableCell>Name</TableCell>
                                                      <TableCell>Description</TableCell>
                                                      <TableCell>Max Occupancy</TableCell>
                                                      <TableCell>Base Rate</TableCell>
                                                      <TableCell align="center">Actions</TableCell>
                                                </TableRow>
                                          </TableHead>
                                          <TableBody>
                                                {roomTypes.length === 0 && (
                                                      <TableRow>
                                                            <TableCell colSpan={7}>Không có loại phòng nào</TableCell>
                                                      </TableRow>
                                                )}
                                                {roomTypes.map((rt) => (
                                                      <React.Fragment key={rt.id}>
                                                            <TableRow className="service-row">
                                                                  <TableCell>{rt.id}</TableCell>
                                                                  <TableCell>{rt.code}</TableCell>
                                                                  <TableCell>{rt.name}</TableCell>
                                                                  <TableCell>{rt.description}</TableCell>
                                                                  <TableCell>{rt.max_occupancy}</TableCell>
                                                                  <TableCell>{rt.base_rate.toLocaleString()} đ</TableCell>
                                                                  <TableCell align="center">
                                                                        <IconButton
                                                                              className="action-view"
                                                                              title={selectedRoomTypeId === rt.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                                                              onClick={() => handleViewDetails(rt.id)}
                                                                        >
                                                                              {selectedRoomTypeId === rt.id ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                                                        </IconButton>
                                                                        <IconButton
                                                                              className="action-edit"
                                                                              title="Chỉnh sửa loại phòng"
                                                                              onClick={() => handleEdit(rt)}
                                                                        >
                                                                              <EditIcon />
                                                                        </IconButton>
                                                                        <IconButton
                                                                              className="delete-btn"
                                                                              title="Xóa loại phòng"
                                                                              onClick={() => handleDelete(rt.id)}
                                                                        >
                                                                              <DeleteIcon style={{ color: 'red' }} />
                                                                        </IconButton>
                                                                  </TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                  <TableCell colSpan={7} style={{ padding: 0 }}>
                                                                        <Collapse in={selectedRoomTypeId === rt.id}>
                                                                              <div className="detail-container">
                                                                                    {editRoomTypeId === rt.id && editFormData ? (
                                                                                          <>
                                                                                                <h3>Chỉnh sửa loại phòng</h3>
                                                                                                <Box display="flex" flexDirection="column" gap={2}>
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
                                                                                                            />
                                                                                                      </Box>
                                                                                                      <Box mt={2} display="flex" gap={2}>
                                                                                                            <Button
                                                                                                                  variant="contained"
                                                                                                                  color="primary"
                                                                                                                  onClick={handleSave}
                                                                                                                  disabled={editLoading}
                                                                                                            >
                                                                                                                  Lưu
                                                                                                            </Button>
                                                                                                            <Button
                                                                                                                  variant="outlined"
                                                                                                                  color="secondary"
                                                                                                                  onClick={handleCancel}
                                                                                                                  disabled={editLoading}
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
                                                                                                <h3>Thông tin loại phòng</h3>
                                                                                                <Table className="detail-table">
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

                              <Box display="flex" justifyContent="flex-end" mt={2}>
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

                  <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={3000}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  >
                        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
                              {snackbarMessage}
                        </Alert>
                  </Snackbar>
            </div>
      );
};

export default RoomTypesList;