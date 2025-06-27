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
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format, parseISO, isValid } from 'date-fns';
import numeral from 'numeral';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import '../../css/ListBookings.css';
import { JSX } from 'react/jsx-runtime';

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
  customer: Customer;
  room: Room;
}
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return numeral(num).format('0,0') + ' VNĐ';
};

const formatDate = (date: string): JSX.Element => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error('Invalid date');
    return (
      <span>{format(parsedDate, 'dd/MM/yyyy')}</span>
    );
  } catch {
    return <span>N/A</span>;
  }
};

type BookingStatusKey =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

const bookingStatusMap: Record<BookingStatusKey, { status: string; color: string }> = {
  pending: { status: 'Chờ xác nhận', color: '#FFA500' },
  confirmed: { status: 'Đã xác nhận', color: '#388E3C' },
  checked_in: { status: 'Đã nhận phòng', color: '#1A73E8' },
  checked_out: { status: 'Đã trả phòng', color: '#757575' },
  cancelled: { status: 'Đã hủy', color: '#D32F2F' },
};

const getBookingStatus = (
  status: string
): { status: string; color: string } => {
  const key = status.toLowerCase() as BookingStatusKey;
  return bookingStatusMap[key] ?? { status: 'Không xác định', color: '#757575' };
};


const ListBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/bookings');
      console.log('API response:', response.data); // Debug phản hồi API
      if (response.status === 200) {
        const data = response.data;

        let bookingsData: Booking[] = [];
        if (Array.isArray(data)) {
          bookingsData = data;
        } else if (Array.isArray(data.data)) {
          bookingsData = data.data;
        } else if (Array.isArray(data.bookings)) {
          bookingsData = data.bookings;
        } else {
          console.warn('Dữ liệu không phải mảng, đặt bookingsData thành mảng rỗng');
          bookingsData = [];
        }

        const sanitizedData = bookingsData.map((item: Booking) => ({
          ...item,
          check_in_date: item.check_in_date && isValid(parseISO(item.check_in_date)) ? item.check_in_date : new Date().toISOString(),
          check_out_date: item.check_out_date && isValid(parseISO(item.check_out_date)) ? item.check_out_date : new Date().toISOString(),
          deposit_amount: item.deposit_amount || '0.00',
          raw_total: item.raw_total || '0.00',
          discount_amount: item.discount_amount || '0.00',
          total_amount: item.total_amount || '0.00',
          status: ['Pending', 'Confirmed', 'Checked_in', 'Checked_out', 'Cancelled'].includes(item.status) ? item.status : 'Cancelled',
          customer: item.customer || {
            id: 0,
            cccd: 'N/A',
            name: 'N/A',
            gender: 'N/A',
            email: 'N/A',
            phone: 'N/A',
            date_of_birth: 'N/A',
            nationality: 'N/A',
            address: 'N/A',
            note: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          room: item.room || {
            id: 0,
            room_number: 'N/A',
            room_type_id: 0,
            status: 'N/A',
            image: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            room_type: {
              id: 0,
              code: 'N/A',
              name: 'N/A',
              description: null,
              max_occupancy: 0,
              base_rate: '0.00',
              created_at: null,
              updated_at: null,
              amenities: [],
            },
          },
        }));

        setAllBookings(sanitizedData);
        setBookings(sanitizedData);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải danh sách đặt phòng';
      setError(errorMessage);
      setSnackbarOpen(true);
      console.error('Lỗi khi tải danh sách đặt phòng:', errorMessage, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  useEffect(() => {
    let filtered = [...allBookings];

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((booking) =>
        booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.room.room_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
    setBookings(filtered);
  }, [searchQuery, allBookings]);

  const handleViewDetail = (id: number) => {
    navigate(`/listbookings/detail/${id}`);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setError(null);
  };

  return (
    <div className="booking-wrapper">
      <div className="booking-title">
        <div className="booking-header-content">
          <h2>
            Danh Sách <b>Đặt Phòng</b>
          </h2>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm khách hàng hoặc số phòng"
              className="booking-search-input"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: '300px' }}
            />
            <Link
              className="booking-btn-add"
              to="/listbookings/add"
            >
              Đặt Phòng
            </Link>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="booking-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách đặt phòng...</Typography>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Typography className="booking-no-data">
          {searchQuery ? 'Không tìm thấy đặt phòng phù hợp.' : 'Không tìm thấy đặt phòng nào.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} className="booking-table-container">
          <Table className="booking-table">
            <TableHead>
              <TableRow>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Số phòng</TableCell>
                <TableCell>Ngày nhận phòng</TableCell>
                <TableCell>Ngày trả phòng</TableCell>
                <TableCell>Tổng tiền</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => {
                const { status, color } = getBookingStatus(booking.status);
                return (
                  <TableRow key={booking.id} sx={{ opacity: 1 }}>
                    <TableCell>{booking.customer.name}</TableCell>
                    <TableCell>{booking.room.room_number}</TableCell>
                    <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                    <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                    <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                    <TableCell>
                      <span style={{ color, fontWeight: 'bold' }}>{status}</span>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        className="booking-action-view"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetail(booking.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ListBookings;