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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AppsIcon from "@mui/icons-material/Apps";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { CheckIcon, SearchIcon } from "lucide-react";
import FilterListIcon from "@mui/icons-material/FilterList";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";

interface CheckinInfo {
  booking_id: number;
  status: string;
  check_in_date: string;
  check_out_date: string;
  deposit_amount: number;
  total_amount: number;
  raw_total: number;
  discount_amount: number;
  created_by: string | null;
  customer: {
    name: string;
    gender: string;
    email: string;
    phone: string;
    cccd: string;
    nationality: string;
    address: string;
  };
  rooms: {
    room_number: string;
    status: string;
    image: string | null;
    rate: number;
    type: {
      name: string;
      max_occupancy: number;
      amenities: { name: string; icon: string; quantity: number }[];
    };
  }[];
  services: {
    name: string;
    description: string;
    price: number;
    quantity: number;
  }[];
}

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

interface CheckoutInfo {
  booking_id: number;
  status: string;
  check_in_date: string;
  check_out_date: string;
  deposit_amount: number;
  total_amount: number;
  raw_total: number;
  discount_amount: number;
  nights: number;
  room_total: number;
  service_total: number;
  check_out_at?: string;
  room_details: {
    room_number: string;
    base_rate: number;
    total: number;
  }[];
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
    case "checked-in":
      return { status: "Đã nhận phòng", color: "#1A73E8" };
    case "checked-out":
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null
  );
  const [openCheckinDialog, setOpenCheckinDialog] = useState(false);
  const [checkinInfo, setCheckinInfo] = useState<CheckinInfo | null>(null);

  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);

  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);

  const navigate = useNavigate();

  const handleOpenCheckoutDialog = async (bookingId: number) => {
    try {
      const res = await api.get(`/check-out/${bookingId}`);
      setCheckoutInfo(res.data);
      setOpenCheckoutDialog(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin check-out:", error);
      setError("Không thể tải thông tin check-out");
      setSnackbarOpen(true);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutInfo) {
      setError("Không có thông tin check-out để xác nhận.");
      setSnackbarOpen(true);
      return;
    }
    try {
      const res = await api.post(`/pay-by-cash/${checkoutInfo.booking_id}`);
      setSuccessMessage(res.data.message || "Check-out thành công!");
      setSnackbarOpen(true);
      setOpenCheckoutDialog(false);
      fetchAllBookings();
    } catch (err) {
      console.error(err);
      setError("Check-out thất bại");
      setSnackbarOpen(true);
    }
  };

  const handleVNPayCheckout = async (bookingId: number) => {
    try {
      const res = await api.post(`/vnpay/create`, { booking_id: bookingId });
      if (res.data && res.data.payment_url) {
        window.open(res.data.payment_url, "_blank");
      } else {
        throw new Error("Không nhận được URL thanh toán.");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Không thể khởi tạo thanh toán online.");
      setSnackbarOpen(true);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đặt phòng này không?"))
      return;

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      await fetchAllBookings();
      setSuccessMessage("Hủy đặt phòng thành công");
      setSnackbarOpen(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Hủy đặt phòng thất bại");
      setSnackbarOpen(true);
    }
  };

  const handleCheckinDialog = async (bookingId: number) => {
    try {
      const res = await api.get(`/check-in/${bookingId}`);
      setCheckinInfo(res.data);
      setOpenCheckinDialog(true);
      setSelectedBookingId(bookingId);
    } catch (err) {
      console.error("Lỗi lấy thông tin check-in", err);
      setError("Không thể tải thông tin check-in");
      setSnackbarOpen(true);
    }
  };

  const handleOpenCheckinDialog = async () => {
    try {
      const response = await api.get(`/check-in/${selectedBookingId}`);
      if (response.status === 200) {
        setCheckinInfo(response.data);
        setOpenCheckinDialog(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Không thể tải thông tin check-in");
      setSnackbarOpen(true);
    } finally {
      handleCloseActionMenu();
    }
  };

  const handleCloseActionMenu = () => {
    setActionAnchorEl(null);
  };

  const handleCloseCheckinDialog = () => {
    setOpenCheckinDialog(false);
    setSelectedBookingId(null);
  };

  const handleCheckinConfirm = async () => {
    if (!selectedBookingId) return;

    try {
      await api.post(`/check-in/${selectedBookingId}`);
      await fetchAllBookings();
      setSuccessMessage("Check-in thành công");
      setSnackbarOpen(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Check-in thất bại");
      setSnackbarOpen(true);
    } finally {
      handleCloseCheckinDialog();
    }
  };

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
            "Checked-in",
            "Checked-out",
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
    setSuccessMessage(null);
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
              sx={{
                "& .MuiPaper-root": {
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                },
              }}
            >
              {statusOptions.map((option) => (
                <MenuItem
                  key={option}
                  onClick={() => handleFilterSelect(option)}
                  selected={statusFilters.includes(option)}
                  sx={{
                    "&:hover": { bgcolor: "#f0f0f0" },
                    "&.Mui-selected": {
                      bgcolor: "#e0f7fa",
                      "&:hover": { bgcolor: "#b2ebf2" },
                    },
                  }}
                >
                  <Typography variant="body2">{option}</Typography>
                </MenuItem>
              ))}
            </Menu>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              {statusFilters.length > 0 && (
                <Chip
                  label={`Trạng thái: ${statusFilters.length} đã chọn`}
                  onDelete={() => setStatusFilters([])}
                  onClick={handleFilterClick}
                  sx={{
                    bgcolor: "#e0f7fa",
                    color: "#00796b",
                    fontWeight: "bold",
                    height: "28px",
                    cursor: "pointer",
                    "& .MuiChip-deleteIcon": { color: "#00796b" },
                  }}
                />
              )}
            </Box>
            <Button
              component={Link}
              to="/listbookings/add"
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
                              "&:hover": { bgcolor: "#bbdefb" },
                            }}
                            onClick={() => handleViewDetail(booking.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>

                          {["Chờ xác nhận", "Đã xác nhận"].includes(status) && (
                            <IconButton
                              title="Xác nhận Check-in"
                              onClick={() => handleCheckinDialog(booking.id)}
                              sx={{
                                ml: 1,
                                color: "#4caf50",
                                bgcolor: "#e8f5e9",
                                "&:hover": { bgcolor: "#c8e6c9" },
                              }}
                            >
                              <AppsIcon fontSize="small" />
                            </IconButton>
                          )}
                          {["Chờ xác nhận", "Đã xác nhận"].includes(status) && (
                            <IconButton
                              title="Hủy đặt phòng"
                              onClick={() => handleCancelBooking(booking.id)}
                              sx={{
                                ml: 1,
                                color: "#d32f2f",
                                bgcolor: "#fbe9e7",
                                "&:hover": { bgcolor: "#ffcdd2" },
                              }}
                            >
                              <HighlightOffIcon fontSize="small" />
                            </IconButton>
                          )}
                          {status === "Đã nhận phòng" && (
                            <IconButton
                              title="Thanh toán và trả phòng"
                              onClick={() =>
                                handleOpenCheckoutDialog(booking.id)
                              }
                              sx={{
                                ml: 1,
                                color: "#ff9800",
                                bgcolor: "#fff3e0",
                                "&:hover": { bgcolor: "#ffe0b2" },
                              }}
                            >
                              <AppsIcon fontSize="small" />
                            </IconButton>
                          )}
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
          severity={successMessage ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {successMessage || error}
        </Alert>
      </Snackbar>
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleCloseActionMenu}
      >
        <MenuItem onClick={handleOpenCheckinDialog}>
          <span style={{ marginRight: 8 }}>
            <CheckIcon />
          </span>{" "}
          Xác nhận Check-in
        </MenuItem>
      </Menu>

      <Dialog
        open={openCheckinDialog}
        onClose={handleCloseCheckinDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "25px",
            color: "#4318FF",
            mb: 2,
          }}
        >
          🧾 Thông tin Check-in
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {checkinInfo ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <Box sx={{ flex: 1, minWidth: "280px" }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    🧑‍💼 Thông tin khách hàng
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Họ tên:</b> {checkinInfo.customer.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>CCCD:</b> {checkinInfo.customer.cccd}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Email:</b> {checkinInfo.customer.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>SĐT:</b> {checkinInfo.customer.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Quốc tịch:</b> {checkinInfo.customer.nationality}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Địa chỉ:</b> {checkinInfo.customer.address}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, minWidth: "280px" }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    📅 Thông tin đặt phòng
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Ngày nhận:</b> {formatDate(checkinInfo.check_in_date)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Ngày trả:</b> {formatDate(checkinInfo.check_out_date)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Đặt cọc:</b>{" "}
                    {numeral(checkinInfo.deposit_amount).format("0,0")} VNĐ
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Tổng tiền:</b>{" "}
                    {numeral(checkinInfo.total_amount).format("0,0")} VNĐ
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Người tạo:</b> {checkinInfo.created_by}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🛏️ Phòng
                </Typography>
                {checkinInfo.rooms.map((room, index) => (
                  <Box key={index} sx={{ ml: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <b>Phòng:</b> {room.room_number} - {room.type.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <b>Giá:</b> {numeral(room.rate).format("0,0")} VNĐ
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <b>Sức chứa:</b> {room.type.max_occupancy} người
                    </Typography>
                    {room.type.amenities.map((a, i) => (
                      <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                        - {a.name} x{a.quantity}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🛎️ Dịch vụ đi kèm
                </Typography>
                {checkinInfo.services.length === 0 ? (
                  <Typography variant="body2" sx={{ mb: 1 }} fontStyle="italic">
                    Không có dịch vụ
                  </Typography>
                ) : (
                  checkinInfo.services.map((s, i) => (
                    <Typography key={i} variant="body2" sx={{ ml: 2, mb: 1 }}>
                      - {s.name} x{s.quantity} ({numeral(s.price).format("0,0")}{" "}
                      VNĐ)
                    </Typography>
                  ))
                )}
              </Box>
            </Box>
          ) : (
            <Typography>Đang tải thông tin...</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCheckinDialog}>Đóng</Button>
          <Button
            onClick={handleCheckinConfirm}
            variant="contained"
            color="primary"
            disabled={!checkinInfo}
          >
            Check-in ngay
          </Button>
        </DialogActions>
      </Dialog>

        {/* Thông tin thanh toán & trả phòng */}
      <Dialog
        open={openCheckoutDialog}
        onClose={() => setOpenCheckoutDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "24px", color: "#FF9800" }}>
          💸 Thông tin thanh toán & trả phòng
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {checkoutInfo ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🧾 Thông tin đơn đặt phòng
                </Typography>
                <Typography><b>Mã đơn:</b> #{checkoutInfo.booking_id}</Typography>
                <Typography><b>Trạng thái:</b> {checkoutInfo.status}</Typography>
                <Typography><b>Ngày nhận phòng:</b> {formatDate(checkoutInfo.check_in_date)}</Typography>
                <Typography><b>Ngày trả phòng:</b> {formatDate(checkoutInfo.check_out_date)}</Typography>
                <Typography><b>Số đêm:</b> {checkoutInfo.nights} đêm</Typography>
                <Typography><b>Tiền đặt cọc:</b> {numeral(checkoutInfo.deposit_amount).format("0,0")} VNĐ</Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 20 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    🛏️ Chi tiết phòng
                  </Typography>
                  {checkoutInfo.room_details.map((room, index) => (
                    <Typography key={index}>
                      - Phòng {room.room_number}: {numeral(room.base_rate).format("0,0")} × {checkoutInfo.nights} đêm = {numeral(room.total).format("0,0")} VNĐ
                    </Typography>
                  ))}
                  <Typography mt={1}><b>Tổng tiền phòng:</b> {numeral(checkoutInfo.room_total).format("0,0")} VNĐ</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    🛎️ Dịch vụ sử dụng
                  </Typography>
                  <Typography><b>Tổng tiền dịch vụ:</b> {numeral(checkoutInfo.service_total).format("0,0")} VNĐ</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  💳 Tóm tắt thanh toán
                </Typography>
                <Typography>- Thành tiền (phòng + dịch vụ): {numeral(checkoutInfo.raw_total).format("0,0")} VNĐ</Typography>
                <Typography>- Giảm giá: {numeral(checkoutInfo.discount_amount).format("0,0")} VNĐ</Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: "bold", mt: 1 }}>
                  = Tổng cần thanh toán: {numeral(checkoutInfo.total_amount).format("0,0")} VNĐ
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    🔘 Phương thức thanh toán
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button variant="outlined" color="primary" onClick={handleConfirmCheckout}>
                      Thanh toán tiền mặt
                    </Button>
                    <Button variant="contained" color="secondary" onClick={() => handleVNPayCheckout(checkoutInfo.booking_id)}>
                      Thanh toán online (VNPay)
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Button variant="contained" color="primary" onClick={handleConfirmCheckout} disabled={!checkoutInfo}>
                    Xác nhận Check-out
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography>Đang tải thông tin...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckoutDialog(false)}>Hủy bỏ</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ListBookings;
