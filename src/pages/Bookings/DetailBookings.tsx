import React, { useState, useEffect } from 'react';
import {
  CircularProgress,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Collapse,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import numeral from 'numeral';
import api from '../../api/axios';
import '../../css/DetailBookings.css';
import { EditIcon, TrashIcon, PlusIcon } from 'lucide-react';

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
  services?: Service[];
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
  const [showServices, setShowServices] = useState<{ [key: number]: boolean }>({});
  const [editingServicesId, setEditingServicesId] = useState<number | null>(null);
  const [editedServices, setEditedServices] = useState<Partial<Service>>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
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
        if (!data.customer || !data.rooms || !data.rooms.length) {
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
        const initialShowAmenities = data.rooms.reduce((acc, room) => ({ ...acc, [room.id]: false }), {});
        const initialShowServices = data.rooms.reduce((acc, room) => ({ ...acc, [room.id]: false }), {});
        setShowAmenities(initialShowAmenities);
        setShowServices(initialShowServices);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải chi tiết đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const response = await api.get('/service', {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.status === 200) {
        const services = Array.isArray(response.data) ? response.data : response.data.data || [];
        setAvailableServices(services.filter((service: Service) => service.status === 'active'));
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách dịch vụ:', error);
      setSnackbarMessage('Lỗi khi tải danh sách dịch vụ.');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const handleBack = () => navigate('/listbookings');
  const handleEdit = (section: string) => console.log(`Edit ${section} clicked`);
  const handleEditServices = () => console.log('Edit Services clicked');
  const handleAddAmenity = () => console.log('Add Amenity clicked');
  const handleAddService = (roomId: number) => console.log(`Add Service for room ${roomId} clicked`);

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

  const toggleServices = (roomId: number) => {
    setShowServices((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
    setEditingServicesId(null);
  };

  const handleEditServicesClick = (roomId: number, service: Service) => {
    setEditingServicesId(roomId);
    setEditedServices({
      id: service.id,
      name: service.name || '',
      code: service.code || '',
      price: service.price || '',
      quantity: service.quantity || 0,
      status: service.status || 'active',
    });
  };

  const handleChangeServices = (field: keyof Service, value: string | number) => {
    setEditedServices((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveServices = async (roomId: number) => {
    try {
      const response = await api.put(`/service/${editedServices.id}`, editedServices);
      if (response.status === 200) {
        setBooking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map((room) =>
              room.id === roomId
                ? {
                    ...room,
                    services: room.services?.map((s) =>
                      s.id === editedServices.id ? { ...s, ...editedServices } : s
                    ),
                  }
                : room
            ),
          };
        });
        setEditingServicesId(null);
        setSnackbarMessage('Cập nhật dịch vụ thành công!');
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage('Lỗi khi cập nhật dịch vụ.');
      setSnackbarOpen(true);
    }
  };

  const handleAddNewService = async (roomId: number) => {
    const newService: Partial<Service> = {
      name: '',
      code: '',
      price: '',
      quantity: 0,
      status: 'active',
    };
    setEditingServicesId(roomId);
    setEditedServices(newService);
  };

  const handleSaveNewService = async (roomId: number) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/add-services`, {
        room_id: roomId,
        service: editedServices,
      });
      if (response.status === 200) {
        setBooking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map((room) =>
              room.id === roomId
                ? {
                    ...room,
                    services: [...(room.services || []), response.data.service],
                  }
                : room
            ),
          };
        });
        setEditingServicesId(null);
        setEditedServices({});
        setSnackbarMessage('Thêm dịch vụ thành công!');
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage('Lỗi khi thêm dịch vụ.');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteService = async (roomId: number, serviceId: number) => {
    try {
      const response = await api.delete(`/service/${serviceId}`);
      if (response.status === 200) {
        setBooking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map((room) =>
              room.id === roomId
                ? {
                    ...room,
                    services: room.services?.filter((s) => s.id !== serviceId),
                  }
                : room
            ),
          };
        });
        setSnackbarMessage('Xóa dịch vụ thành công!');
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage('Lỗi khi xóa dịch vụ.');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
    <div className="detail-booking-wrapper">
      <div className="detail-booking-title">
        <div className="detail-booking-header-content">
          <h2>
            Chi Tiết <b>Đặt Phòng</b>
          </h2>
          <Button className="detail-back-button" onClick={handleBack}>
            Quay lại
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="detail-loading-container">
          <CircularProgress />
          <Typography>Đang tải chi tiết đặt phòng...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="detail-error-message">
          {error}
        </Typography>
      ) : !booking || !booking.customer || !booking.rooms ? (
        <Typography className="detail-no-data">
          Không tìm thấy thông tin đặt phòng hoặc dữ liệu không đầy đủ.
        </Typography>
      ) : (
        <>
          <div className="card-group top-section">
            <div className="container">
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
                      {booking.rooms.map((room: Room) => (
                        <React.Fragment key={room.id}>
                          <tr>
                            <td>{room.room_number}</td>
                            <td>{room.room_type.name}</td>
                            <td>{room.room_type.code || 'N/A'}</td>
                            <td>{room.room_type.max_occupancy} người</td>
                            <td className="price-highlight">{formatCurrency(room.room_type.base_rate)}</td>
                            <td>{room.status === 'booked' ? 'Đã đặt' : room.status}</td>
                            <td>
                              <div className="action-buttons">
                                <Button
                                  className="view-amenities-button"
                                  onClick={() => toggleAmenities(room.id)}
                                >
                                  {showAmenities[room.id] ? 'Ẩn tiện nghi' : 'Xem tiện nghi'}
                                </Button>
                                <Button
                                  className="view-services-button"
                                  onClick={() => toggleServices(room.id)}
                                >
                                  {showServices[room.id] ? 'Ẩn dịch vụ' : 'Xem dịch vụ'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <Collapse in={showAmenities[room.id]}>
                                <div className="detail-container">
                                  <h3>Thông tin tiện nghi</h3>
                                  <Table className="user-detail-table">
                                    <TableBody>
                                      {room.room_type.amenities.length > 0 ? (
                                        room.room_type.amenities.map((amenity) => (
                                          <TableRow key={amenity.id}>
                                            <TableCell><strong>Tên tiện nghi:</strong> {amenity.name}</TableCell>
                                            <TableCell><strong>Mã:</strong> {amenity.code || 'N/A'}</TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={2}>Không có tiện nghi nào cho phòng {room.room_number}.</TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </Collapse>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <Collapse in={showServices[room.id]}>
                                <div className="detail-container">
                                  <h3>Thông tin dịch vụ</h3>
                                  {editingServicesId === room.id ? (
                                    <>
                                      <Box display="flex" flexDirection="column" gap={2}>
                                        <TextField
                                          label="Tên dịch vụ"
                                          value={editedServices.name || ''}
                                          onChange={(e) => handleChangeServices('name', e.target.value)}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          required
                                        />
                                        <TextField
                                          label="Mã"
                                          value={editedServices.code || ''}
                                          onChange={(e) => handleChangeServices('code', e.target.value)}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          required
                                        />
                                        <TextField
                                          label="Giá"
                                          value={editedServices.price || ''}
                                          onChange={(e) => handleChangeServices('price', e.target.value)}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          required
                                          type="number"
                                        />
                                        <TextField
                                          label="Số lượng"
                                          value={editedServices.quantity || ''}
                                          onChange={(e) => handleChangeServices('quantity', Number(e.target.value))}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          required
                                          type="number"
                                        />
                                        <FormControl fullWidth variant="outlined" size="small" required>
                                          <InputLabel>Trạng thái</InputLabel>
                                          <Select
                                            value={editedServices.status || 'active'}
                                            onChange={(e) => handleChangeServices('status', e.target.value)}
                                            label="Trạng thái"
                                          >
                                            <MenuItem value="active">Hoạt động</MenuItem>
                                            <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Box mt={2} display="flex" gap={2}>
                                        <Button
                                          variant="contained"
                                          color="primary"
                                          onClick={() =>
                                            editedServices.id
                                              ? handleSaveServices(room.id)
                                              : handleSaveNewService(room.id)
                                          }
                                          disabled={!editedServices.name || !editedServices.code || !editedServices.price || !editedServices.quantity}
                                        >
                                          {editedServices.id ? 'Lưu' : 'Thêm'}
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          color="secondary"
                                          onClick={() => setEditingServicesId(null)}
                                        >
                                          Hủy
                                        </Button>
                                      </Box>
                                    </>
                                  ) : (
                                    <Table className="user-detail-table">
                                      <TableBody>
                                        {room.services && room.services.length > 0 ? (
                                          room.services.map((service) => (
                                            <TableRow key={service.id}>
                                              <TableCell><strong>Tên dịch vụ:</strong> {service.name}</TableCell>
                                              <TableCell><strong>Mã:</strong> {service.code || 'N/A'}</TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="outlined"
                                                  startIcon={<EditIcon />}
                                                  onClick={() => handleEditServicesClick(room.id, service)}
                                                  className="action-edit"
                                                >
                                                  Sửa
                                                </Button>
                                                <Button
                                                  variant="outlined"
                                                  startIcon={<TrashIcon />}
                                                  onClick={() => handleDeleteService(room.id, service.id)}
                                                  className="action-delete"
                                                  style={{ marginLeft: '10px' }}
                                                >
                                                  Xóa
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={3}>Không có dịch vụ nào cho phòng {room.room_number}.</TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  )}
                                  <Box mt={2}>
                                    <Button
                                      variant="contained"
                                      startIcon={<PlusIcon />}
                                      onClick={() => handleAddNewService(room.id)}
                                      className="action-add"
                                    >
                                      Thêm dịch vụ
                                    </Button>
                                  </Box>
                                </div>
                              </Collapse>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
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
                </div>
              </div>
            </div>
          </div>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbarMessage.includes('thành công') ? 'success' : 'error'} sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </div>
  );
};

export default DetailBookings;