/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
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
  Pagination,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AppsIcon from "@mui/icons-material/Apps";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PrintIcon from "@mui/icons-material/Print";
import EditIcon from "@mui/icons-material/Edit";
import { CheckIcon, SearchIcon } from "lucide-react";
import FilterListIcon from "@mui/icons-material/FilterList";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import CheckinDialog from "./CheckinDialog";
import CheckoutDialog from "./CheckoutDialog";
import InvoiceDialog from "./InvoiceDialog";
import EditBookingDialog from "./EditBookingDialog";

// Interfaces
interface Invoice {
  invoice_code: string;
  booking_id: number;
  issued_date: string;
  room_amount: number;
  service_amount: number;
  discount_amount: number;
  deposit_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  booking: {
    id: number;
    customer_id: number;
    created_by: number;
    check_in_date: string;
    check_out_date: string;
    check_in_at: string;
    check_out_at: string;
    status: string;
    note: string | null;
    deposit_amount: number;
    raw_total: number;
    discount_amount: number;
    total_amount: number;
    created_at: string;
    updated_at: string;
  };
}

interface Promotion {
  id: number;
  code: string;
  description: string;
  discount_type: string;
  discount_value: string;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  rooms?: Room[];
  promotions: Promotion[];
  is_hourly: boolean;
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

// Utility Functions
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "N/A";
  return numeral(num).format("0,0") + " VNĐ";
};

const formatDateTime = (date: string, isHourly: boolean): string => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error("Invalid date");
    return isHourly
      ? format(parsedDate, "dd/MM/yyyy HH:mm")
      : format(parsedDate, "dd/MM/yyyy");
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
      return { status: "Đã hủy", color: "#D32F2F" };
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
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [invoiceInfo, setInvoiceInfo] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "vnpay" | null>(
    null
  );
  const [isPaying, setWorking] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const callbackProcessed = useRef(false);
  const navigate = useNavigate();

  const handleOpenCheckoutDialog = async (bookingId: number) => {
    try {
      const { data } = await api.get(`/check-out/${bookingId}`);
      setCheckoutInfo(data);
      setOpenCheckoutDialog(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin check-out:", error);
      setError("Không thể tải thông tin check-out");
      setSnackbarOpen(true);
      toast.error("Không thể tải thông tin check-out");
    }
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutInfo) {
      setError("Không có thông tin check-out để xác nhận.");
      setSnackbarOpen(true);
      toast.error("Không có thông tin check-out để xác nhận.");
      return;
    }

    try {
      setWorking(true);
      const { data } = await api.post(`/pay-cash/${checkoutInfo.booking_id}`);
      setCheckoutInfo({
        ...checkoutInfo,
        status: data.status || "Checked-out",
        check_out_at: data.check_out_at || new Date().toISOString(),
      });
      setSuccessMessage(
        data.message || "Thanh toán tiền mặt và trả phòng thành công!"
      );
      setSnackbarOpen(true);
      toast.success("Thanh toán tiền mặt và trả phòng thành công!");
      setOpenCheckoutDialog(false);
      fetchAllBookings();
    } catch (err) {
      console.error("Lỗi khi thanh toán tiền mặt:", err);
      setError("Thanh toán tiền mặt thất bại");
      setSnackbarOpen(true);
      toast.error("Thanh toán tiền mặt thất bại");
    } finally {
      setWorking(false);
    }
  };

  const handleVNPayCheckout = async (bookingId: number) => {
    try {
      setWorking(true);
      const { data } = await api.post("/vnpay/create-payment", {
        booking_id: bookingId,
      });
      if (data && data.payment_url) {
        setOpenCheckoutDialog(false);
        window.location.href = data.payment_url;
      } else {
        throw new Error("Không nhận được URL thanh toán.");
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo thanh toán VNPay:", error);
      setError("Không thể khởi tạo thanh toán VNPay");
      setSnackbarOpen(true);
      toast.error("Không thể khởi tạo thanh toán VNPay");
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const transactionStatus = urlParams.get("vnp_TransactionStatus");
    const txnRef = urlParams.get("vnp_TxnRef");
    const responseCode = urlParams.get("vnp_ResponseCode");

    if (
      transactionStatus &&
      txnRef &&
      responseCode &&
      !callbackProcessed.current
    ) {
      callbackProcessed.current = true;
      (async () => {
        try {
          const { data } = await api.get("/vnpay/return", {
            params: urlParams,
          });
          if (responseCode === "00") {
            setSuccessMessage(data.message || "Thanh toán VNPay thành công!");
            setSnackbarOpen(true);
            toast.success("Thanh toán VNPay thành công!");
            fetchAllBookings();
          } else {
            setError(
              data.message ||
                "Thanh toán VNPay không thành công. Vui lòng thử lại."
            );
            setSnackbarOpen(true);
            toast.error("Thanh toán VNPay không thành công. Vui lòng thử lại.");
          }
        } catch (err) {
          console.error("Lỗi khi xử lý callback VNPay:", err);
          setError("Không thể xử lý thanh toán VNPay.");
          setSnackbarOpen(true);
          toast.error("Không thể xử lý thanh toán VNPay.");
        } finally {
          navigate("/listbookings", { replace: true });
        }
      })();
    }
  }, [location, navigate]);

  const handleCancelBooking = (bookingId: number) => {
    setBookingToCancel(bookingId);
    setOpenCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      await api.post(`/bookings/${bookingToCancel}/cancel`);
      await fetchAllBookings();
      setSuccessMessage("Hủy đặt phòng thành công");
      setSnackbarOpen(true);
      toast.success("Hủy đặt phòng thành công");
    } catch (error) {
      console.error("Lỗi khi hủy đặt phòng:", error);
      setError("Hủy đặt phòng thất bại");
      setSnackbarOpen(true);
      toast.error("Hủy đặt phòng thất bại");
    } finally {
      setOpenCancelDialog(false);
      setBookingToCancel(null);
    }
  };

  const handleCheckinDialog = async (bookingId: number) => {
    try {
      const { data } = await api.get(`/check-in/${bookingId}`);
      setCheckinInfo(data);
      setOpenCheckinDialog(true);
      setSelectedBookingId(bookingId);
    } catch (err) {
      console.error("Lỗi lấy thông tin check-in", err);
      setError("Không thể tải thông tin check-in");
      setSnackbarOpen(true);
      toast.error("Không thể tải thông tin check-in");
    }
  };

  const handleEditDialog = (booking: Booking) => {
    setSelectedBookingId(booking.id);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedBookingId(null);
  };

  const handleEditConfirm = async (updatedBooking: {
    id: number;
    check_in_date: string;
    check_out_date: string;
    deposit_amount: string;
  }) => {
    try {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === updatedBooking.id
            ? { ...booking, ...updatedBooking }
            : booking
        )
      );
      setAllBookings((prev) =>
        prev.map((booking) =>
          booking.id === updatedBooking.id
            ? { ...booking, ...updatedBooking }
            : booking
        )
      );
      setSuccessMessage("Cập nhật đặt phòng thành công");
      setSnackbarOpen(true);
      toast.success("Cập nhật đặt phòng thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật đặt phòng:", error);
      setError("Cập nhật đặt phòng thất bại");
      setSnackbarOpen(true);
      toast.error("Cập nhật đặt phòng thất bại");
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
      toast.success("Check-in thành công");
    } catch (error) {
      console.log(error);
      setError("Check-in thất bại");
      setSnackbarOpen(true);
      toast.error("Check-in thất bại");
    } finally {
      handleCloseCheckinDialog();
    }
  };

  const handleOpenInvoiceDialog = async (bookingId: number) => {
    try {
      setInvoiceLoading(true);
      setSelectedBookingId(bookingId);
      setOpenInvoiceDialog(true);

      try {
        const { data } = await api.get(`/invoices/booking/${bookingId}`);
        setInvoiceInfo(data);
        return;
      } catch (err: any) {
        if (!(err?.response?.status === 404 || err?.response?.status === 405)) {
          throw err;
        }
      }

      const listRes = await api.get(`/invoices`);
      const invoices: any[] = Array.isArray(listRes.data)
        ? listRes.data
        : Array.isArray(listRes.data?.data)
        ? listRes.data.data
        : [];

      const inv = invoices.find(
        (i) => Number(i.booking_id) === Number(bookingId)
      );
      if (!inv?.id) {
        throw new Error("Không có hóa đơn cho booking này");
      }

      const detailRes = await api.get(`/invoices/${inv.id}`);
      setInvoiceInfo(detailRes.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin hóa đơn:", error);
      toast.error("Không thể tải thông tin hóa đơn");
      setOpenInvoiceDialog(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCloseInvoiceDialog = () => {
    setOpenInvoiceDialog(false);
    setSelectedBookingId(null);
    setInvoiceInfo(null);
  };

  const handlePrintInvoice = async () => {
    if (!selectedBookingId) return;

    try {
      setInvoiceLoading(true);
      const { data } = await api.get(
        `/invoices/booking/${selectedBookingId}/print`
      );
      setSuccessMessage(data.message || "Đã gửi yêu cầu in hóa đơn và email!");
      setSnackbarOpen(true);
      toast.success("Đã gửi yêu cầu in hóa đơn và email!");
      setOpenInvoiceDialog(false);
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu in hóa đơn:", error);
      setError("Không thể in hóa đơn");
      setSnackbarOpen(true);
      toast.error("Không thể in hóa đơn");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, status } = await api.get("/bookings");
      if (status === 200) {
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

        const currentDate = new Date();
        const sanitizedData = bookingsData.map((item: Booking) => {
          let updatedStatus = item.status;
          if (["Pending", "Confirmed"].includes(item.status)) {
            const checkOutDate = parseISO(item.check_out_date);
            if (isValid(checkOutDate) && checkOutDate < currentDate) {
              updatedStatus = "Cancelled";
              api
                .post(`/bookings/${item.id}/cancel`)
                .catch((err) =>
                  console.error(
                    `Lỗi khi cập nhật trạng thái booking ${item.id}:`,
                    err
                  )
                );
            }
          }

          return {
            ...item,
            status: updatedStatus,
            is_hourly: item.is_hourly ?? false,
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
          };
        });

        setAllBookings(sanitizedData);
        setFilteredBookings(sanitizedData);
        setBookings(sanitizedData.slice(0, 10));
        setLastPage(Math.ceil(sanitizedData.length / 10));
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách đặt phòng";
      setError(errorMessage);
      setSnackbarOpen(true);
      toast.error(errorMessage);
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
    setLastPage(Math.ceil(filtered.length / 10));
    setBookings(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, statusFilters, allBookings, currentPage]);

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
    setCurrentPage(1); // Reset về trang đầu khi thay đổi bộ lọc
    handleFilterClose();
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
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
            <>
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
                        <b>Loại đặt phòng</b>
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
                      const { status, color } = getBookingStatus(
                        booking.status
                      );
                      return (
                        <TableRow key={booking.id} hover sx={{ opacity: 1 }}>
                          <TableCell>{booking.customer.name}</TableCell>
                          <TableCell>
                            {booking.rooms && booking.rooms.length > 0
                              ? booking.rooms.length > 3
                                ? `${booking.rooms
                                    .slice(0, 2)
                                    .map((room) => room.room_number)
                                    .join(", ")} ...và ${
                                    booking.rooms.length - 3
                                  } phòng khác`
                                : booking.rooms
                                    .map((room) => room.room_number)
                                    .join(", ")
                              : booking.room.room_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(
                              booking.check_in_date,
                              booking.is_hourly
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(
                              booking.check_out_date,
                              booking.is_hourly
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                booking.is_hourly ? "Theo giờ" : "Theo ngày"
                              }
                              color={booking.is_hourly ? "warning" : "success"}
                              size="small"
                              sx={{ fontWeight: "bold" }}
                            />
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
                            {["Chờ xác nhận", "Đã xác nhận"].includes(
                              status
                            ) && (
                              <IconButton
                                title="Sửa đặt phòng"
                                onClick={() => handleEditDialog(booking)}
                                sx={{
                                  ml: 1,
                                  color: "#0288d1",
                                  bgcolor: "#e1f5fe",
                                  "&:hover": { bgcolor: "#b3e5fc" },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            {["Chờ xác nhận", "Đã xác nhận"].includes(
                              status
                            ) && (
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
                            {["Chờ xác nhận", "Đã xác nhận"].includes(
                              status
                            ) && (
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
                            {status === "Đã trả phòng" && (
                              <IconButton
                                title="In hóa đơn"
                                onClick={() =>
                                  handleOpenInvoiceDialog(booking.id)
                                }
                                sx={{
                                  ml: 1,
                                  color: "#0288d1",
                                  bgcolor: "#e1f5fe",
                                  "&:hover": { bgcolor: "#b3e5fc" },
                                }}
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                <Pagination
                  count={lastPage}
                  page={currentPage}
                  onChange={handlePageChange}
                  shape="rounded"
                  showFirstButton
                  showLastButton
                  siblingCount={0}
                  boundaryCount={1}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: "#888",
                      fontWeight: 500,
                      minWidth: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      border: "none",
                    },
                    "& .Mui-selected": {
                      backgroundColor: "#5B3EFF",
                      color: "#fff",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "#5B3EFF",
                      },
                    },
                    "& .MuiPaginationItem-previousNext, & .MuiPaginationItem-firstLast":
                      {
                        color: "#bbb",
                      },
                  }}
                />
              </Box>
            </>
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

      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Xác nhận hủy đặt phòng
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn hủy đặt phòng này không? Hành động này không
            thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCancelDialog(false)}
            sx={{
              color: "#d32f2f",
              borderColor: "#d32f2f",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 2.5,
              py: 0.7,
              "&:hover": { borderColor: "#b71c1c", backgroundColor: "#ffebee" },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmCancel}
            variant="contained"
            sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleCloseActionMenu}
      >
        <MenuItem onClick={() => handleCheckinDialog(selectedBookingId!)}>
          <span style={{ marginRight: 8 }}>
            <CheckIcon />
          </span>{" "}
          Xác nhận Check-in
        </MenuItem>
      </Menu>

      <CheckinDialog
        open={openCheckinDialog}
        onClose={handleCloseCheckinDialog}
        checkinInfo={checkinInfo}
        onConfirm={handleCheckinConfirm}
      />

      <CheckoutDialog
        open={openCheckoutDialog}
        onClose={() => setOpenCheckoutDialog(false)}
        checkoutInfo={checkoutInfo}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isPaying={isPaying}
        onConfirmCheckout={handleConfirmCheckout}
        onVNPayCheckout={handleVNPayCheckout}
      />

      <InvoiceDialog
        open={openInvoiceDialog}
        onClose={handleCloseInvoiceDialog}
        invoiceInfo={invoiceInfo}
        invoiceLoading={invoiceLoading}
        onPrintInvoice={handlePrintInvoice}
      />

      <EditBookingDialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        bookingInfo={
          selectedBookingId
            ? bookings.find((b) => b.id === selectedBookingId) || null
            : null
        }
        onConfirm={handleEditConfirm}
      />
    </div>
  );
};

export default ListBookings;
