import React, { useState, useEffect } from 'react';
import {
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import numeral from 'numeral';
import api from '../../api/axios';
import '../../css/DetailBookings.css';

interface Customer {
  id: number;
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface Amenity {
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
}

interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  base_rate: string;
  created_at: string | null;
  updated_at: string | null;
  amenities: Amenity[];
}

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  room_type: RoomType;
}

interface Booking {
  id: number;
  customer_id: number;
  room_id: number;
  created_by: number;
  check_in_date: string;
  check_out_date: string;
  status: string;
  deposit_amount: string;
  raw_total: string;
  discount_amount: string;
  total_amount: string;
  created_at: string | null;
  updated_at: string | null;
  customer: Customer | null;
  room: Room | null;
}

const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return numeral(num).format('0,0') + ' VNĐ';
};

const formatDateString = (date: string): string => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error('Invalid date');
    return format(parsedDate, 'dd/MM/yyyy');
  } catch {
    return 'N/A';
  }
};


const DetailBookings: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const bookingId = id;

  const fetchBookingDetail = async () => {
    if (!bookingId) {
      setError('Không tìm thấy ID đặt phòng');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/bookings/${bookingId}`);
      if (response.status === 200) {
        const data = response.data;

        if (!data.customer || !data.room) {
          setError('Dữ liệu đặt phòng không đầy đủ. Vui lòng kiểm tra backend.');
          setLoading(false);
          return;
        }

        const bookingData: Booking = {
          ...data,
          check_in_date: data.check_in_date && isValid(parseISO(data.check_in_date)) ? data.check_in_date : new Date().toISOString(),
          check_out_date: data.check_out_date && isValid(parseISO(data.check_out_date)) ? data.check_out_date : new Date().toISOString(),
          deposit_amount: data.deposit_amount || '0.00',
          raw_total: data.raw_total || '0.00',
          discount_amount: data.discount_amount || '0.00',
          total_amount: data.total_amount || '0.00',
          status: ['Pending', 'Confirmed', 'Checked_in', 'Checked_out', 'Cancelled'].includes(data.status) ? data.status : 'Cancelled',
          customer: data.customer || null,
          room: data.room || null,
        };

        setBooking(bookingData);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải chi tiết đặt phòng';
      setError(errorMessage);
      console.error('Lỗi khi tải chi tiết đặt phòng:', errorMessage, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const handleBack = () => {
    navigate('/listbookings');
  };

  const handleEdit = (section: string) => {
    console.log(`Edit ${section} clicked`);
    // Implement edit functionality here
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { className: 'status-pending', text: 'Đang chờ' };
      case 'confirmed':
        return { className: 'status-new', text: 'Mới' };
      case 'checked_in':
        return { className: 'status-vip', text: 'Đã nhận phòng' };
      case 'checked_out':
        return { className: 'status-vip', text: 'Đã trả phòng' };
      case 'cancelled':
        return { className: 'status-vip', text: 'Đã hủy' };
      default:
        return { className: 'status-vip', text: 'Không xác định' };
    }
  };

  return (
    <div className="detail-booking-wrapper">
      <div className="detail-booking-title">
        <div className="detail-booking-header-content">
          <h2>
            Chi Tiết <b>Đặt Phòng</b>
          </h2>
          <Button className="detail-booking-back-button" onClick={handleBack}>
            Quay lại
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="detail-booking-loading-container">
          <CircularProgress />
          <Typography>Đang tải chi tiết đặt phòng...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="detail-booking-error-message">
          {error}
        </Typography>
      ) : !booking || !booking.customer || !booking.room ? (
        <Typography className="detail-booking-no-data">
          Không tìm thấy thông tin đặt phòng hoặc dữ liệu không đầy đủ.
        </Typography>
      ) : (
        <>
          <div className="container">
            {/* Thông tin phòng */}
            <div className="card room-info">
              <div className="card-header">
                <div className="card-icon">🏨</div>
                <h2 className="card-title">Thông tin phòng</h2>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Số phòng</div>
                  <div className="info-value">{booking.room.room_number}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Loại phòng</div>
                  <div className="info-value">{booking.room.room_type.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Mã loại phòng</div>
                  <div className="info-value">{booking.room.room_type.code || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Sức chứa tối đa</div>
                  <div className="info-value">{booking.room.room_type.max_occupancy} người</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Giá phòng</div>
                  <div className="info-value price-highlight">{formatCurrency(booking.room.room_type.base_rate)}</div>
                </div>
              </div>
            </div>

            {/* Thông tin đặt phòng */}
            <div className="card booking-info">
              <div className="card-header">
                <div className="card-icon">📅</div>
                <h2 className="card-title">Thông tin đặt phòng</h2>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Người đặt phòng</div>
                  <div className="info-value">{booking.customer.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Ngày nhận phòng</div>
                  <div className="info-value">{formatDateString(booking.check_in_date)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Ngày trả phòng</div>
                  <div className="info-value">{formatDateString(booking.check_out_date)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Trạng thái</div>
                  <div className="info-value">
                    <span className={`status-badge ${getStatusBadge(booking.status).className}`}>
                      {getStatusBadge(booking.status).text}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Tiền đặt cọc</div>
                  <div className="info-value">{formatCurrency(booking.deposit_amount)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Tổng tiền</div>
                  <div className="info-value price-highlight">{formatCurrency(booking.raw_total)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Tổng giảm</div>
                  <div className="info-value">{formatCurrency(booking.discount_amount)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Tổng giá cuối</div>
                  <div className="info-value price-highlight">{formatCurrency(booking.total_amount)}</div>
                </div>
              </div>
              <Button
                className="edit-button"
                onClick={() => handleEdit('Booking Info')}
              >
                Sửa
              </Button>
            </div>
          </div>
          <div className="container">
            {/* Thông tin khách hàng */}
            <div className="card customer-info customer-card">
              <div className="card-header">
                <div className="card-icon">👤</div>
                <h2 className="card-title">Thông tin khách hàng</h2>
              </div>
              <div className="customer-grid">
                <div className="info-item">
                  <div className="info-label">Số CCCD</div>
                  <div className="info-value">{booking.customer.cccd}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Tên khách hàng</div>
                  <div className="info-value">{booking.customer.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Giới tính</div>
                <div className="info-value">
                {booking.customer.gender === 'male'
                    ? 'Nam'
                    : booking.customer.gender === 'female'
                    ? 'Nữ'
                    : 'Khác'}
                </div>

                </div>
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{booking.customer.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Số điện thoại</div>
                  <div className="info-value">{booking.customer.phone}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Ngày sinh</div>
                  <div className="info-value">{formatDateString(booking.customer.date_of_birth)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Quốc tịch</div>
                  <div className="info-value">{booking.customer.nationality}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Địa chỉ</div>
                  <div className="info-value">{booking.customer.address}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Ghi chú</div>
                  <div className="info-value">{booking.customer.note || 'Không có'}</div>
                </div>
              </div>
              <Button
                className="edit-button"
                onClick={() => handleEdit('Customer Info')}
              >
                Sửa
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DetailBookings;