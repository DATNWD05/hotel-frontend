import React, { useState, useEffect } from 'react';
import { Button, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableRow } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookingForm from './BookingForm';
import '../../css/OrderRoom.css';
import api from '../../api/axios';

interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  base_rate: string;
  created_at: string | null;
  updated_at: string | null;
  amenities?: Array<{
    id: number;
    category_id: number;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    price: string;
    default_quantity: number;
    status: string;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    pivot: {
      room_type_id: number;
      amenity_id: number;
      quantity: number;
    };
  }>;
}

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: 'available' | 'booked' | 'maintenance';
  image: string | null;
  created_at: string;
  updated_at: string;
  room_type: RoomType;
  price?: number;
  guest_name?: string;
  check_in_date?: string;
  check_out_date?: string;
  booking_code?: string;
  guest_count?: string;
  payment_status?: string;
  source?: string;
  ota_code?: string | null;
  booking_date?: string;
  guest_phone?: string;
  guest_email?: string;
  guest_country?: string | null;
  guest_occupation?: string | null;
  guest_id_number?: string | null;
  guest_account_number?: string;
  stay_days?: number;
}

const OrderRoom: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openBooking, setOpenBooking] = useState<boolean>(false);
  const [bookingRoom, setBookingRoom] = useState<string>('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/rooms');
      console.log(response.data);
      
      if (response.status === 200) {
        const data: Room[] = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        const sanitizedData = data.filter(room => 
          room &&
          room.id &&
          room.room_number &&
          room.room_type &&
          ['available', 'booked', 'maintenance'].includes(room.status)
        ).map(room => ({
          ...room,
          price: room.price || Number(room.room_type.base_rate) || 0
        }));
        setAllRooms(sanitizedData);
        setFilteredRooms(sanitizedData);
        setRooms(sanitizedData);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      console.error('Lỗi khi tải danh sách phòng:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    let filtered = [...allRooms];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((room) => mapStatusToUI(room.status) === statusFilter);
    }
    setFilteredRooms(filtered);
    setRooms(filtered);
  }, [statusFilter, allRooms]);

  const mapStatusToUI = (status: string): 'trong' | 'da_dat' | 'dang_sua' | 'unknown' => {
    switch (status) {
      case 'available': return 'trong';
      case 'booked': return 'da_dat';
      case 'maintenance': return 'dang_sua';
      default: return 'unknown';
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRoom(null);
  };

  const handleBookRoom = (roomNumber: string) => {
    setBookingRoom(roomNumber);
    setOpenBooking(true);
  };

  const handleCloseBooking = () => {
    setOpenBooking(false);
    setBookingRoom('');
  };

  const getStatusText = (status: string) => {
    const uiStatus = mapStatusToUI(status);
    switch (uiStatus) {
      case 'trong': return 'Trống';
      case 'da_dat': return 'Đã đặt';
      case 'dang_sua': return 'Đang sửa';
      default: return 'Không xác định';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Typography align="center" sx={{ mt: 4 }}>Đang tải dữ liệu...</Typography>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button variant="contained" onClick={fetchRooms}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="order-room-wrapper">
      <div className="order-room-title">
        <div className="order-room-header-content">
          <h2>
            Trạng thái <b>Phòng</b>
          </h2>
        </div>
      </div>

      <div className="order-room-filter-bar">
        <Button
          className={`order-room-filter-tat_ca ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('all')}
          sx={{ backgroundColor: '#607D8B', color: 'white', mr: 1, '&:hover': { backgroundColor: '#546E7A' } }}
        >
          Tất cả
        </Button>
        <Button
          className={`order-room-filter-trong ${statusFilter === 'trong' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('trong')}
          sx={{ backgroundColor: '#1B5E20', color: 'white', mr: 1, '&:hover': { backgroundColor: '#2E7D32' } }}
        >
          Trống
        </Button>
        <Button
          className={`order-room-filter-da_dat ${statusFilter === 'da_dat' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('da_dat')}
          sx={{ backgroundColor: '#B71C1C', color: 'white', mr: 1, '&:hover': { backgroundColor: '#C62828' } }}
        >
          Đã đặt
        </Button>
        <Button
          className={`order-room-filter-dang_sua ${statusFilter === 'dang_sua' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('dang_sua')}
          sx={{ backgroundColor: '#F57F17', color: 'white', mr: 1, '&:hover': { backgroundColor: '#FB8C00' } }}
        >
          Đang sửa
        </Button>
      </div>

      {filteredRooms.length === 0 ? (
        <Typography align="center" className="order-room-no-data" sx={{ mt: 4 }}>
          Không tìm thấy phòng phù hợp.
        </Typography>
      ) : (
        <div className="order-room-grid">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`order-room-card order-room-status-${mapStatusToUI(room.status)}`}
              onClick={() => mapStatusToUI(room.status) === 'trong' ? handleBookRoom(room.room_number) : null}
              style={{ cursor: mapStatusToUI(room.status) === 'trong' ? 'pointer' : 'default' }}
            >
              <div className="order-room-left-section">
                <div className="order-room-status-label">
                  {room.room_type.code || 'STD'}
                </div>
                <div className="order-room-number">{room.room_number}</div>
                {mapStatusToUI(room.status) === 'trong' && (
                  <div className="order-room-icon">
                    <PersonIcon />
                  </div>
                )}
                {mapStatusToUI(room.status) === 'da_dat' && (
                  <div className="order-room-icon">
                    <CalendarTodayIcon />
                  </div>
                )}
                {mapStatusToUI(room.status) === 'dang_sua' && (
                  <div className="order-room-icon">
                    <AccessTimeIcon />
                  </div>
                )}
              </div>

              <div className="order-room-right-section">
                <button
                  className="order-room-view-button"
                  title="Xem chi tiết"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(room);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </button>

                <div className="order-room-content">
                  {mapStatusToUI(room.status) === 'trong' && (
                    <div className="order-room-status-text">Trống</div>
                  )}
                  {mapStatusToUI(room.status) === 'da_dat' && (
                    <>
                      <div className="order-room-date-time">
                        {formatDate(room.check_in_date)}, {formatTime(room.check_in_date)}
                      </div>
                      <div className="order-room-guest-name">{room.guest_name || 'N/A'}</div>
                      {room.stay_days && (
                        <div className="order-room-countdown">
                          {String(room.stay_days).padStart(2, '0')} : 00 : 00
                        </div>
                      )}
                    </>
                  )}
                  {mapStatusToUI(room.status) === 'dang_sua' && (
                    <>
                      <div className="order-room-date-time">
                        {formatDate(room.updated_at)}, {formatTime(room.updated_at)}
                      </div>
                      <div className="order-room-status-text">Đang sửa chữa</div>
                      <div className="order-room-countdown">00 : 00 : 00</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)', animation: '$slideFromRight 0.3s ease-out' }, '@keyframes slideFromRight': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', color: 'white', borderRadius: '12px 12px 0 0', padding: '16px 24px' }}>
          Chi tiết phòng {selectedRoom?.room_number}
          <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <div className="dialog-content">
              <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#2c3e50' }}>Thông tin phòng</Typography>
              <div className="info-grid">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Số phòng</TableCell>
                      <TableCell>{selectedRoom.room_number}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Loại phòng</TableCell>
                      <TableCell>{selectedRoom.room_type.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Mã loại phòng</TableCell>
                      <TableCell>{selectedRoom.room_type.code}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Sức chứa tối đa</TableCell>
                      <TableCell>{selectedRoom.room_type.max_occupancy}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Giá</TableCell>
                      <TableCell>{Number(selectedRoom.room_type.base_rate).toLocaleString('vi-VN')} VNĐ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Mô tả</TableCell>
                      <TableCell>{selectedRoom.room_type.description || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Trạng thái</TableCell>
                      <TableCell>{getStatusText(selectedRoom.status)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Ngày tạo</TableCell>
                      <TableCell>{formatDate(selectedRoom.created_at)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Ngày cập nhật</TableCell>
                      <TableCell>{formatDate(selectedRoom.updated_at)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {mapStatusToUI(selectedRoom.status) === 'da_dat' && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#2c3e50' }}>Thông tin đặt phòng</Typography>
                  <Table className="details-table">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Nhận phòng</TableCell>
                        <TableCell>{formatDate(selectedRoom.check_in_date)} ({selectedRoom.stay_days || 'N/A'} đêm)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Trả phòng</TableCell>
                        <TableCell>{formatDate(selectedRoom.check_out_date)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Mã đặt phòng</TableCell>
                        <TableCell>{selectedRoom.booking_code || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Số khách</TableCell>
                        <TableCell>{selectedRoom.guest_count || 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#2c3e50' }}>Kênh</Typography>
                  <Table className="details-table">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">TT thanh toán</TableCell>
                        <TableCell>{selectedRoom.payment_status || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nguồn</TableCell>
                        <TableCell>{selectedRoom.source || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">OTA code</TableCell>
                        <TableCell>{selectedRoom.ota_code || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngày đặt</TableCell>
                        <TableCell>{formatDate(selectedRoom.booking_date)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#2c3e50' }}>Khách hàng</Typography>
                  <Table className="details-table">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Tên đầy đủ</TableCell>
                        <TableCell>{selectedRoom.guest_name || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">SĐT</TableCell>
                        <TableCell>{selectedRoom.guest_phone || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Email</TableCell>
                        <TableCell>{selectedRoom.guest_email || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Quốc gia</TableCell>
                        <TableCell>{selectedRoom.guest_country || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nghề nghiệp</TableCell>
                        <TableCell>{selectedRoom.guest_occupation || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Số định danh</TableCell>
                        <TableCell>{selectedRoom.guest_id_number || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Số tài khoản</TableCell>
                        <TableCell>{selectedRoom.guest_account_number || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">SL ngày ở</TableCell>
                        <TableCell>{selectedRoom.stay_days || 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#2c3e50' }}>Tiện nghi</Typography>
              <Table className="details-table">
                <TableBody>
                  {selectedRoom.room_type.amenities && selectedRoom.room_type.amenities.length > 0 ? (
                    selectedRoom.room_type.amenities.map((amenity) => (
                      <TableRow key={amenity.id}>
                        <TableCell component="th" scope="row">{amenity.name}</TableCell>
                        <TableCell>
                          Giá: {Number(amenity.price).toLocaleString('vi-VN')} VNĐ, 
                          Số lượng: {amenity.pivot.quantity}, 
                          Trạng thái: {amenity.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2}>Không có tiện nghi nào.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '0 0 12px 12px' }}>
          <Button onClick={handleCloseDialog} color="primary" variant="contained" sx={{ backgroundColor: '#2c3e50', '&:hover': { backgroundColor: '#34495e' } }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <BookingForm open={openBooking} onClose={handleCloseBooking} roomNumber={bookingRoom} />
    </div>
  );
};

export default OrderRoom;