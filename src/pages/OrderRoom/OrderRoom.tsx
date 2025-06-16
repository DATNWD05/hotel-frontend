import React, { useState, useEffect } from 'react';
import { Button, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableRow } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookingForm from './BookingForm';
import '../../css/OrderRoom.css';

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  price: number;
  status: 'trong' | 'da_dat' | 'dang_sua';
  image: string | null;
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
  created_at?: string;
  updated_at?: string;
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

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/rooms');
        if (!response.ok) {
          throw new Error('Không thể lấy dữ liệu từ API');
        }
        const data: Room[] = await response.json();
        const filteredData = data.filter(room => ['trong', 'da_dat', 'dang_sua'].includes(room.status));
        setAllRooms(filteredData);
        setRooms(filteredData);
        setFilteredRooms(filteredData);
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Có lỗi xảy ra khi lấy dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    let filtered = [...allRooms];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((room) => room.status === statusFilter);
    }
    setFilteredRooms(filtered);
    setRooms(filtered);
  }, [statusFilter, allRooms]);

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
    switch (status) {
      case 'trong': return 'Trống';
      case 'da_dat': return 'Đã đặt';
      case 'dang_sua': return 'Đang sửa';
      default: return 'Không xác định';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Typography align="center" sx={{ mt: 4 }}>Đang tải dữ liệu...</Typography>;
  }

  if (error) {
    return <Typography align="center" color="error" sx={{ mt: 4 }}>{error}</Typography>;
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
          sx={{ backgroundColor: '#607D8B', color: 'white', mr: 1 }}
        >
          Tất cả
        </Button>
        <Button
          className={`order-room-filter-trong ${statusFilter === 'trong' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('trong')}
          sx={{ backgroundColor: '#1B5E20', color: 'white', mr: 1 }}
        >
          Trống
        </Button>
        <Button
          className={`order-room-filter-da_dat ${statusFilter === 'da_dat' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('da_dat')}
          sx={{ backgroundColor: '#B71C1C', color: 'white', mr: 1 }}
        >
          Đã đặt
        </Button>
        <Button
          className={`order-room-filter-dang_sua ${statusFilter === 'dang_sua' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('dang_sua')}
          sx={{ backgroundColor: '#F57F17', color: 'white', mr: 1 }}
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
              className={`order-room-card order-room-status-${room.status}`}
              onClick={() => room.status === 'trong' ? handleBookRoom(room.room_number) : null}
            >
              {/* Phần bên trái - màu đậm */}
              <div className="order-room-left-section">
                <div className="order-room-status-label">
                  {room.status === 'trong' && 'STD'}
                  {room.status === 'da_dat' && 'STD'}
                  {room.status === 'dang_sua' && 'STD'}
                </div>
                <div className="order-room-number">{room.room_number}</div>
                {room.status === 'trong' && (
                  <div className="order-room-icon">
                    <PersonIcon />
                  </div>
                )}
                {room.status === 'da_dat' && (
                  <div className="order-room-icon">
                    <CalendarTodayIcon />
                  </div>
                )}
                {room.status === 'dang_sua' && (
                  <div className="order-room-icon">
                    <AccessTimeIcon />
                  </div>
                )}
              </div>

              {/* Phần bên phải - màu nhạt */}
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
                  {room.status === 'trong' && (
                    <div className="order-room-status-text">Trống</div>
                  )}
                  
                  {room.status === 'da_dat' && (
                    <>
                      <div className="order-room-date-time">
                        {formatDate(room.check_in_date)}, {formatTime(room.check_in_date)}
                      </div>
                      <div className="order-room-guest-name">{room.guest_name}</div>
                      {room.stay_days && (
                        <div className="order-room-countdown">
                          {String(room.stay_days).padStart(2, '0')} : 00 : 00
                        </div>
                      )}
                    </>
                  )}
                  
                  {room.status === 'dang_sua' && (
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
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { animation: '$slideFromRight 0.3s ease-out' }, '@keyframes slideFromRight': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chi tiết phòng {selectedRoom?.room_number}
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <>
              {selectedRoom.status === 'trong' ? (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Số phòng</TableCell>
                      <TableCell>{selectedRoom.room_number}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Loại phòng</TableCell>
                      <TableCell>{selectedRoom.room_type_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Giá</TableCell>
                      <TableCell>{selectedRoom.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Trạng thái</TableCell>
                      <TableCell>{getStatusText(selectedRoom.status)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : selectedRoom.status === 'da_dat' ? (
                <div style={{ padding: '10px' }}>
                  <Typography variant="h6" gutterBottom>Thông tin phòng</Typography>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Loại phòng</TableCell>
                        <TableCell>Phòng đôi</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nhận phòng</TableCell>
                        <TableCell>{selectedRoom.check_in_date} ({selectedRoom.stay_days} đêm)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Trả phòng</TableCell>
                        <TableCell>{selectedRoom.check_out_date}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Mã đặt phòng</TableCell>
                        <TableCell>{selectedRoom.booking_code}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Số khách</TableCell>
                        <TableCell>{selectedRoom.guest_count}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Kênh</Typography>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">TT thanh toán</TableCell>
                        <TableCell>{selectedRoom.payment_status}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nguồn</TableCell>
                        <TableCell>{selectedRoom.source}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">OTA code</TableCell>
                        <TableCell>{selectedRoom.ota_code || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngày đặt</TableCell>
                        <TableCell>{selectedRoom.booking_date}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Khách hàng</Typography>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Tên đầy đủ</TableCell>
                        <TableCell>{selectedRoom.guest_name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">SĐT</TableCell>
                        <TableCell>{selectedRoom.guest_phone}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Email</TableCell>
                        <TableCell>{selectedRoom.guest_email}</TableCell>
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
                        <TableCell>{selectedRoom.guest_account_number}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">SL ngày ở</TableCell>
                        <TableCell>{selectedRoom.stay_days}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Số phòng</TableCell>
                      <TableCell>{selectedRoom.room_number}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Loại phòng</TableCell>
                      <TableCell>{selectedRoom.room_type_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Giá</TableCell>
                      <TableCell>{selectedRoom.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Trạng thái</TableCell>
                      <TableCell>{getStatusText(selectedRoom.status)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <BookingForm open={openBooking} onClose={handleCloseBooking} roomNumber={bookingRoom} />
    </div>
  );
};

export default OrderRoom;