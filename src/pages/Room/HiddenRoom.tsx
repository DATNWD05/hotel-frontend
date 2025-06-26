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
  Box,
  Snackbar,
  Alert,
  Pagination,
  Collapse,
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import '../../css/HiddenRoom.css';

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: string;
  image: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

interface RoomType {
  id: number;
  name: string;
}

interface Amenity {
  id: number;
  name: string;
  quantity: number;
}

interface RoomResponse {
  data: Room[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface RoomTypeResponse {
  data: RoomType[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface AmenityResponse {
  data: Amenity[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const HiddenRoom: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [amenities, setAmenities] = useState<{ [key: number]: Amenity[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const fetchTrashedRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<RoomResponse>('/rooms/trashed');
      if (response.status === 200) {
        setRooms(response.data.data);
        setFilteredRooms(response.data.data.slice(0, 10));
        setLastPage(Math.ceil(response.data.data.length / 10));
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get<RoomTypeResponse>('/room-types');
      if (response.status === 200) {
        setRoomTypes(response.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải loại phòng:', err);
    }
  };

  const fetchAmenitiesByRoomType = async (roomTypeId: number) => {
    try {
      const response = await api.get<AmenityResponse>(`/room-types/${roomTypeId}/amenities`);
      if (response.status === 200) {
        setAmenities((prev) => ({ ...prev, [roomTypeId]: response.data.data }));
      }
    } catch (err) {
      console.error(`Lỗi khi tải tiện nghi cho loại phòng ${roomTypeId}:`, err);
    }
  };

  useEffect(() => {
    fetchTrashedRooms();
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    setFilteredRooms(rooms.slice((currentPage - 1) * 10, currentPage * 10));
    setLastPage(Math.ceil(rooms.length / 10));
  }, [currentPage, rooms]);

  useEffect(() => {
    const uniqueRoomTypeIds = rooms.map((room) => room.room_type_id);
    const distinctRoomTypeIds = Array.from(new Set(uniqueRoomTypeIds));
    distinctRoomTypeIds.forEach((roomTypeId) => fetchAmenitiesByRoomType(roomTypeId));
  }, [rooms]);

  const handleRestore = async (roomId: number) => {
    try {
      const response = await api.post(`/rooms/${roomId}/restore`);
      if (response.status === 200) {
        setSnackbarMessage('Phòng đã được khôi phục thành công!');
        setSnackbarOpen(true);
        fetchTrashedRooms();
      } else {
        throw new Error('Không thể khôi phục phòng');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi khôi phục phòng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const getRoomTypeName = (roomTypeId: number) => {
    const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
    return roomType ? roomType.name : 'Không xác định';
  };

  const getStatusText = (status: string) => {
    return status === 'booked' ? 'Đã đặt'
      : status === 'available' ? 'Đang trống'
      : status === 'cleaning' ? 'Đang dọn dẹp'
      : status === 'maintenance' ? 'Bảo trì'
      : 'Không xác định';
  };

  const handleViewDetails = (roomId: number) => {
    setSelectedRoomId(selectedRoomId === roomId ? null : roomId);
  };

  return (
    <div className="hidden-room-wrapper">
      <div className="hidden-room-title">
        <div className="hidden-room-header-content">
          <h2>
            Hidden <b>Rooms</b>
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="hidden-room-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách phòng bị ẩn...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="hidden-room-error-message">
          {error}
        </Typography>
      ) : filteredRooms.length === 0 ? (
        <Typography className="hidden-room-no-data">
          Không tìm thấy phòng bị ẩn.
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="hidden-room-table-container">
            <Table className="hidden-room-table">
              <TableHead>
                <TableRow>
                  <TableCell>Số Phòng</TableCell>
                  <TableCell>Loại Phòng</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRooms.map((room) => (
                  <React.Fragment key={room.id}>
                    <TableRow>
                      <TableCell>{room.room_number}</TableCell>
                      <TableCell>{getRoomTypeName(room.room_type_id)}</TableCell>
                      <TableCell>{getStatusText(room.status)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="hidden-room-action-view"
                          title="Xem chi tiết"
                          onClick={() => handleViewDetails(room.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          className="hidden-room-action-restore"
                          title="Khôi phục"
                          onClick={() => handleRestore(room.id)}
                        >
                          <RestoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} style={{ padding: 0 }}>
                        <Collapse in={selectedRoomId === room.id}>
                          <div className="hidden-room-detail-container">
                            <h3>Thông tin chi tiết phòng</h3>
                            <Table className="hidden-room-detail-table">
                              <TableBody>
                                <TableRow>
                                  <TableCell><strong>Số Phòng:</strong> {room.room_number}</TableCell>
                                  <TableCell><strong>Loại Phòng:</strong> {getRoomTypeName(room.room_type_id)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Trạng Thái:</strong> {getStatusText(room.status)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                            <h3>Tiện nghi</h3>
                            {amenities[room.room_type_id] && amenities[room.room_type_id].length > 0 ? (
                              <Table className="hidden-room-detail-table">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Tên Tiện Nghi</TableCell>
                                    <TableCell>Số Lượng</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {amenities[room.room_type_id].map((amenity) => (
                                    <TableRow key={amenity.id}>
                                      <TableCell>{amenity.name}</TableCell>
                                      <TableCell>{amenity.quantity}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <Typography>Không có tiện nghi nào.</Typography>
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

export default HiddenRoom;