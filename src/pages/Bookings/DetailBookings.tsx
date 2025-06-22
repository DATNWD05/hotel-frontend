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

// Interface definitions
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

interface Service {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  status: string;
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
  rooms: Room[];
  services: Service[];
}

const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : numeral(num).format('0,0') + ' VNĐ';
};

const formatDateString = (date: string): string => {
  try {
    const parsedDate = parseISO(date);
    return isValid(parsedDate) ? format(parsedDate, 'dd/MM/yyyy') : 'N/A';
  } catch {
    return 'N/A';
  }
};

const DetailBookings: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAmenities, setShowAmenities] = useState<{ [key: number]: boolean }>({});
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
      console.log(response.data);
      
      if (response.status === 200) {
        const data = response.data;
        if (!data.customer || !data.rooms || !data.rooms.length) {
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
          rooms: data.rooms || [],
          services: data.services || [],
        };
        setBooking(bookingData);
        // Khởi tạo trạng thái hiển thị tiện nghi cho từng phòng
        const initialShowAmenities = data.rooms.reduce((acc, room) => ({ ...acc, [room.id]: false }), {});
        setShowAmenities(initialShowAmenities);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải chi tiết đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const handleBack = () => navigate('/listbookings');
  const handleEdit = (section: string) => console.log(`Edit ${section} clicked`);
  const handleEditAmenities = () => console.log('Edit Amenities clicked');
  const handleEditServices = () => console.log('Edit Services clicked');
  const handleAddAmenity = () => console.log('Add Amenity clicked');
  const handleAddService = () => console.log('Add Service clicked');

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { className: string; text: string } } = {
      pending: { className: 'status-pending', text: 'Đang chờ' },
      confirmed: { className: 'status-new', text: 'Mới' },
      checked_in: { className: 'status-vip', text: 'Đã nhận phòng' },
      checked_out: { className: 'status-vip', text: 'Đã trả phòng' },
      cancelled: { className: 'status-vip', text: 'Đã hủy' },
      default: { className: 'status-vip', text: 'Không xác định' },
    };
    return statusMap[status.toLowerCase()] || statusMap.default;
  };

  const toggleAmenities = (roomId: number) => {
    setShowAmenities((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
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
      ) : !booking || !booking.customer || !booking.rooms ? (
        <Typography className="detail-booking-no-data">
          Không tìm thấy thông tin đặt phòng hoặc dữ liệu không đầy đủ.
        </Typography>
      ) : (
        <>
          <div className="card-group top-section">
            <div className="container">
              {/* Thông tin khách hàng */}
              <div className="card customer-info">
                <div className="card-header">
                  <div className="card-icon">👤</div>
                  <h2 className="card-title">Thông tin khách hàng</h2>
                </div>
                <div className="info-grid">
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
                      {booking.customer.gender === 'male' ? 'Nam' : booking.customer.gender === 'female' ? 'Nữ' : 'Khác'}
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
                <Button className="edit-button" onClick={() => handleEdit('Customer Info')}>
                  Sửa
                </Button>
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
                <Button className="edit-button" onClick={() => handleEdit('Booking Info')}>
                  Sửa
                </Button>
              </div>
            </div>
          </div>

          <div className="card-group bottom-section">
            <div className="container">
              {/* Thông tin phòng (table) */}
              <div className="card room-info customer-card">
                <div className="card-header">
                  <div className="card-icon">🏨</div>
                  <h2 className="card-title">Thông tin phòng</h2>
                </div>
                <div className="table-container">
                  <table className="info-table">
                    <thead>
                      <tr>
                        <th>Số phòng</th>
                        <th>Loại phòng</th>
                        <th>Mã loại phòng</th>
                        <th>Sức chứa tối đa</th>
                        <th>Giá phòng</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.rooms.map((room) => (
                        <React.Fragment key={room.id}>
                          <tr>
                            <td>{room.room_number}</td>
                            <td>{room.room_type.name}</td>
                            <td>{room.room_type.code || 'N/A'}</td>
                            <td>{room.room_type.max_occupancy} người</td>
                            <td className="price-highlight">{formatCurrency(room.room_type.base_rate)}</td>
                            <td>{room.status === 'booked' ? 'Đã đặt' : room.status}</td>
                            <td>
                              <Button
                                className="view-amenities-button"
                                onClick={() => toggleAmenities(room.id)}
                              >
                                {showAmenities[room.id] ? 'Ẩn tiện nghi' : 'Xem tiện nghi'}
                              </Button>
                            </td>
                          </tr>
                          {showAmenities[room.id] && (
                            <tr>
                              <td colSpan={7} className="amenities-section">
                                {/* <div className="card-header amenities-header">
                                  <div className="card-icon">🛏️</div>
                                  <h6 className="card-title">Tiện nghi phòng {room.room_number}</h6>
                                </div> */}
                                <table className="info-table amenities-table">
                                  <thead>
                                    <tr>
                                      <th>Tên tiện nghi</th>
                                      <th>Mã</th>
                                      <th>Giá</th>
                                      <th>Số lượng</th>
                                      <th>Trạng thái</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {room.room_type.amenities.length > 0 ? (
                                      room.room_type.amenities.map((amenity) => (
                                        <tr key={amenity.id}>
                                          <td>{amenity.name}</td>
                                          <td>{amenity.code || 'N/A'}</td>
                                          <td className="price-highlight">{formatCurrency(amenity.price)}</td>
                                          <td>{amenity.pivot.quantity}</td>
                                          <td>{amenity.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={5}>Không có tiện nghi nào cho phòng {room.room_number}.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="button-group">
                  <Button className="edit-button" onClick={handleEditAmenities}>
                    Sửa tiện nghi
                  </Button>
                  <Button className="add-button" onClick={handleAddAmenity}>
                    Thêm tiện nghi
                  </Button>
                </div>
              </div>

              {/* Thông tin dịch vụ (table) */}
              <div className="card services-info customer-card">
                <div className="card-header">
                  <div className="card-icon">🛎️</div>
                  <h2 className="card-title">Thông tin dịch vụ</h2>
                </div>
                <div className="table-container">
                  <table className="info-table">
                    <thead>
                      <tr>
                        <th>Tên dịch vụ</th>
                        <th>Mã</th>
                        <th>Giá</th>
                        <th>Số lượng</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.services.length > 0 ? (
                        booking.services.map((service) => (
                          <tr key={service.id}>
                            <td>{service.name}</td>
                            <td>{service.code || 'N/A'}</td>
                            <td className="price-highlight">{formatCurrency(service.price)}</td>
                            <td>{service.quantity}</td>
                            <td>{service.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>Không có dịch vụ nào được thêm.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="button-group">
                  <Button className="edit-button" onClick={handleEditServices}>
                    Sửa dịch vụ
                  </Button>
                  <Button className="add-button" onClick={handleAddService}>
                    Thêm dịch vụ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DetailBookings;