import React, { useState, useEffect } from "react";
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
  Card,
  CardContent,
  InputAdornment,
  Button,
  Menu,
  Chip,
  MenuItem,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { SearchIcon } from "lucide-react";
import FilterListIcon from "@mui/icons-material/FilterList";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";

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
  if (isNaN(num)) return "N/A";
  return numeral(num).format("0,0") + " VNĐ";
};

const formatDate = (date: string) => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error("Invalid date");
    return format(parsedDate, "dd/MM/yyyy");
  } catch {
    return "N/A";
  }
};

const getBookingStatus = (
  status: string
): { status: string; color: string } => {
  switch (status.toLowerCase()) {
    case "pending":
      return { status: "Chờ xác nhận", color: "#FFA500" };
    case "confirmed":
      return { status: "Đã xác nhận", color: "#388E3C" };
    case "checked_in":
      return { status: "Đã nhận phòng", color: "#1A73E8" };
    case "checked_out":
      return { status: "Đã trả phòng", color: "#757575" };
    case "cancelled":
      return { status: "Đã hủy", color: "#D32F2F" };
    default:
      return { status: "Không xác định", color: "#757575" };
  }
};

const ListBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/bookings");
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
          console.warn(
            "Dữ liệu không phải mảng, đặt bookingsData thành mảng rỗng"
          );
          bookingsData = [];
        }

        const sanitizedData = bookingsData.map((item: Booking) => ({
          ...item,
          check_in_date:
            item.check_in_date && isValid(parseISO(item.check_in_date))
              ? item.check_in_date
              : new Date().toISOString(),
          check_out_date:
            item.check_out_date && isValid(parseISO(item.check_out_date))
              ? item.check_out_date
              : new Date().toISOString(),
          deposit_amount: item.deposit_amount || "0.00",
          raw_total: item.raw_total || "0.00",
          discount_amount: item.discount_amount || "0.00",
          total_amount: item.total_amount || "0.00",
          status: [
            "Pending",
            "Confirmed",
            "Checked_in",
            "Checked_out",
            "Cancelled",
          ].includes(item.status)
            ? item.status
            : "Cancelled",
          customer: item.customer || {
            id: 0,
            cccd: "N/A",
            name: "N/A",
            gender: "N/A",
            email: "N/A",
            phone: "N/A",
            date_of_birth: "N/A",
            nationality: "N/A",
            address: "N/A",
            note: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          room: item.room || {
            id: 0,
            room_number: "N/A",
            room_type_id: 0,
            status: "N/A",
            image: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            room_type: {
              id: 0,
              code: "N/A",
              name: "N/A",
              description: null,
              max_occupancy: 0,
              base_rate: "0.00",
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
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách đặt phòng";
      setError(errorMessage);
      setSnackbarOpen(true);
      console.error("Lỗi khi tải danh sách đặt phòng:", errorMessage, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  useEffect(() => {
    let filtered = [...allBookings];

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (booking) =>
          booking.customer.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.room.room_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilters.length > 0) {
      filtered = filtered.filter((booking) => {
        const { status } = getBookingStatus(booking.status);
        return statusFilters.includes(status);
      });
    }

    setFilteredBookings(filtered);
    setBookings(filtered);
  }, [searchQuery, statusFilters, allBookings]);

  const handleViewDetail = (id: number) => {
    navigate(`/listbookings/detail/${id}`);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setError(null);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (status: string) => {
    setStatusFilters((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
    handleFilterClose();
  };

  const statusOptions = [
    "Chờ xác nhận",
    "Đã xác nhận",
    "Đã nhận phòng",
    "Đã trả phòng",
    "Đã hủy",
  ];

  return (
    <div className="booking-wrapper">
      <div className="booking-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Đặt Phòng {">"} Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" className="section-title" fontWeight={700}>
            Đặt Phòng
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm (Khách hàng hoặc Số phòng)"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 350,
                bgcolor: "#fff",
                borderRadius: "8px",
                mt: { xs: 2, sm: 0 },
                "& input": {
                  fontSize: "15px",
                },
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconButton
              onClick={handleFilterClick}
              sx={{
                bgcolor: "#fff",
                borderRadius: "8px",
                p: 1,
                "&:hover": { bgcolor: "#f0f0f0" },
              }}
            >
              <FilterListIcon />
            </IconButton>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              sx={{ "& .MuiPaper-root": { borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)" } }}
            >
              {statusOptions.map((option) => (
                <MenuItem
                  key={option}
                  onClick={() => handleFilterSelect(option)}
                  selected={statusFilters.includes(option)}
                  sx={{ "&:hover": { bgcolor: "#f0f0f0" }, "&.Mui-selected": { bgcolor: "#e0f7fa", "&:hover": { bgcolor: "#b2ebf2" } } }}
                >
                  <Typography variant="body2">{option}</Typography>
                </MenuItem>
              ))}
            </Menu>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
              {statusFilters.length > 0 && (
                <Chip
                  label={`Trạng thái: ${statusFilters.length} đã chọn`}
                  onDelete={() => setStatusFilters([])}
                  onClick={handleFilterClick}
                  sx={{ bgcolor: "#e0f7fa", color: "#00796b", fontWeight: "bold", height: "28px", cursor: "pointer", "& .MuiChip-deleteIcon": { color: "#00796b" } }}
                />
              )}
            </Box>
            <Button
              component={Link}
              to="/promotions/add"
              variant="contained"
              sx={{
                backgroundColor: "#4318FF",
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2.5,
                py: 0.7,
                boxShadow: "0 2px 6px rgba(106, 27, 154, 0.3)",
                "&:hover": {
                  backgroundColor: "#7B1FA2",
                  boxShadow: "0 4px 12px rgba(106, 27, 154, 0.4)",
                },
              }}
            >
              + Thêm mới
            </Button>
          </Box>
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <div className="booking-loading-container">
              <CircularProgress />
              <Typography>Đang tải danh sách đặt phòng...</Typography>
            </div>
          ) : error ? (
            <Typography className="booking-error-message">{error}</Typography>
          ) : filteredBookings.length === 0 ? (
            <Typography className="booking-no-data">
              {searchQuery || statusFilters.length > 0
                ? "Không tìm thấy đặt phòng phù hợp."
                : "Không tìm thấy đặt phòng nào."}
            </Typography>
          ) : (
            <TableContainer
              component={Paper}
              className="booking-table-container"
            >
              <Table className="booking-table" sx={{ width: "100%" }}>
                <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                  <TableRow>
                    <TableCell>
                      <b>Khách hàng</b>
                    </TableCell>
                    <TableCell>
                      <b>Số phòng</b>
                    </TableCell>
                    <TableCell>
                      <b>Ngày nhận phòng</b>
                    </TableCell>
                    <TableCell>
                      <b>Ngày trả phòng</b>
                    </TableCell>
                    <TableCell>
                      <b>Tổng tiền</b>
                    </TableCell>
                    <TableCell>
                      <b>Trạng thái</b>
                    </TableCell>
                    <TableCell align="center">
                      <b>Hành động</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => {
                    const { status, color } = getBookingStatus(booking.status);
                    return (
                      <TableRow key={booking.id} hover sx={{ opacity: 1 }}>
                        <TableCell>{booking.customer.name}</TableCell>
                        <TableCell>{booking.room.room_number}</TableCell>
                        <TableCell>
                          {formatDate(booking.check_in_date)}
                        </TableCell>
                        <TableCell>
                          {formatDate(booking.check_out_date)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(booking.total_amount)}
                        </TableCell>
                        <TableCell>
                          <span style={{ color, fontWeight: "bold" }}>
                            {status}
                          </span>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            title="Xem chi tiết"
                            sx={{
                              color: "#1976d2",
                              bgcolor: "#e3f2fd",
                              "&:hover": {
                                bgcolor: "#bbdefb",
                                boxShadow: "0 2px 6px rgba(25, 118, 210, 0.4)",
                              },
                              transition: "all 0.2s ease-in-out",
                            }}
                            onClick={() => handleViewDetail(booking.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ListBookings;