/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../css/AddBookings.css";

interface Customer {
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  note: string;
}

interface RoomSelection {
  id: string;
  roomType: string;
  roomNumber: string;
  price: number;
}

interface BookingData {
  customer: Customer;
  rooms: RoomSelection[];
  check_in_date: string;
  check_out_date: string;
  deposit_amount: number;
}

interface ValidationErrors {
  cccd?: string;
  name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  check_in_date?: string;
  check_out_date?: string;
  rooms?: string;
}

const AddBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData>({
    customer: {
      cccd: "",
      name: "",
      gender: "",
      email: "",
      phone: "",
      date_of_birth: "",
      nationality: "Vietnamese",
      address: "",
      note: "",
    },
    rooms: [
      {
        id: "1",
        roomType: "",
        roomNumber: "",
        price: 0,
      },
    ],
    check_in_date: "",
    check_out_date: "",
    deposit_amount: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [roomTypes, setRoomTypes] = useState<{ value: string; label: string; base_price?: number }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
 const [roomNumbers, setRoomNumbers] = useState<{ [key: string]: string[] }>({});
  const [roomMap, setRoomMap] = useState<{ [key: string]: number }>({});
  const [basePrices, setBasePrices] = useState<{ [key: string]: number }>({});
  const [availableRooms, setAvailableRooms] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [typesRes, roomsRes] = await Promise.all([
          api.get("/room-types"),
          api.get("/rooms"),
        ]);

        let typesData = typesRes.data;
        console.log("Types data:", typesData);
        if (typesData && typeof typesData === "object" && "data" in typesData) {
          typesData = typesData.data;
        }
        if (Array.isArray(typesData)) {
            
          const types = typesData.map((type: any) => ({
            value: type.id.toString(),
            label: type.name || type.code || "Không xác định",
            base_price: type.price || 0,
          }));
          setRoomTypes(types);
          const prices = types.reduce((acc: { [key: string]: number }, type: any) => {
            if (type.base_price) acc[type.value] = type.base_price;
            return acc;
          }, {});
          setBasePrices(prices);
        } else {
          throw new Error("Dữ liệu từ /room-types không phải là mảng hợp lệ hoặc rỗng");
        }

        let roomsData = roomsRes.data;
        console.log("Rooms data:", roomsData);
        if (roomsData && typeof roomsData === "object" && "data" in roomsData) {
          roomsData = roomsData.data;
        }
        if (Array.isArray(roomsData)) {
          const numbers: { [key: string]: string[] } = {};
          const available: { [key: string]: string[] } = {};
          const map: { [key: string]: number } = {};
          roomsData.forEach((room: any) => {
            const typeId = room.room_type_id?.toString() || "";
            if (typeId) {
              if (!numbers[typeId]) numbers[typeId] = [];
              numbers[typeId].push(room.room_number);
              if (room.status === "available") {
                if (!available[typeId]) available[typeId] = [];
                available[typeId].push(room.room_number);
              }
              map[room.room_number] = room.id;
            }
          });
          setRoomNumbers(numbers);
          setAvailableRooms(available);
          setRoomMap(map);
        } else {
          throw new Error("Dữ liệu từ /rooms không phải là mảng hợp lệ hoặc rỗng");
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        setSnackbarMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu từ server. Vui lòng kiểm tra kết nối hoặc API!"
        );
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = (data: BookingData): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.customer.cccd.trim()) errs.cccd = "Số CCCD/CMND không được để trống";
    else if (!/^\d{12}$/.test(data.customer.cccd)) errs.cccd = "CCCD phải có 12 số";
    if (!data.customer.name.trim()) errs.name = "Họ và tên không được để trống";
    if (!data.customer.email.trim()) errs.email = "Email không được để trống";
    else if (!/\S+@\S+\.\S+/.test(data.customer.email)) errs.email = "Email không hợp lệ";
    if (!data.customer.phone.trim()) errs.phone = "Số điện thoại không được để trống";
    else if (!/^\d{10}$/.test(data.customer.phone)) errs.phone = "Số điện thoại phải có 10 số";
    if (!data.customer.date_of_birth) errs.date_of_birth = "Ngày sinh không được để trống";
    if (!data.customer.address.trim()) errs.address = "Địa chỉ không được để trống";
    if (!data.check_in_date) errs.check_in_date = "Ngày nhận phòng không được để trống";
    else if (new Date(data.check_in_date) < new Date(new Date().setHours(0, 0, 0, 0)))
      errs.check_in_date = "Ngày nhận phòng phải từ hôm nay trở đi";
    if (!data.check_out_date) errs.check_out_date = "Ngày trả phòng không được để trống";
    else if (new Date(data.check_out_date) <= new Date(data.check_in_date))
      errs.check_out_date = "Ngày trả phòng phải sau ngày nhận phòng";
    if (!data.rooms.some((room) => room.roomNumber))
      errs.rooms = "Vui lòng chọn ít nhất một phòng hợp lệ";
    return errs;
  };

  const handleCustomerChange = (field: keyof Customer, value: string) => {
    setBookingData((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));
    const errors = validateForm({
      ...bookingData,
      customer: { ...bookingData.customer, [field]: value },
    });
    setValidationErrors(errors);
  };

  const handleRoomChange = (roomId: string, field: keyof RoomSelection, value: string | number) => {
    setBookingData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) => {
        if (room.id === roomId) {
          const updatedRoom = { ...room, [field]: value };
          if (field === "roomType") {
            updatedRoom.roomNumber = "";
            updatedRoom.price = basePrices[value as string] || 0;
          }
          return updatedRoom;
        }
        return room;
      }),
    }));
    const errors = validateForm(bookingData);
    setValidationErrors(errors);
  };

  const addRoom = () => {
    const newRoom: RoomSelection = {
      id: Date.now().toString(),
      roomType: "",
      roomNumber: "",
      price: 0,
    };
    setBookingData((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));
  };

  const removeRoom = (roomId: string) => {
    if (bookingData.rooms.length > 1) {
      setBookingData((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((room) => room.id !== roomId),
      }));
    }
  };

  const handleDateChange = (type: "check_in" | "check_out" | "birth", value: string) => {
    if (type === "birth") {
      setBookingData((prev) => ({
        ...prev,
        customer: { ...prev.customer, date_of_birth: value },
      }));
    } else {
      setBookingData((prev) => ({ ...prev, [type + "_date"]: value }));
    }
    const errors = validateForm({
      ...bookingData,
      [type === "birth" ? "customer" : type + "_date"]:
        type === "birth" ? { ...bookingData.customer, date_of_birth: value } : value,
    });
    setValidationErrors(errors);
  };

  const calculateTotalAmount = () => {
    return bookingData.rooms.reduce((total, room) => total + room.price, 0);
  };

  const calculateNights = () => {
    if (!bookingData.check_in_date || !bookingData.check_out_date) return 0;
    const checkIn = new Date(bookingData.check_in_date);
    const checkOut = new Date(bookingData.check_out_date);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(bookingData);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSnackbarMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const totalAmount = calculateTotalAmount() * calculateNights();
      const validRoomIds = bookingData.rooms
        .filter((room) => room.roomNumber && availableRooms[room.roomType]?.includes(room.roomNumber))
        .map((room) => roomMap[room.roomNumber] || 0);
      if (validRoomIds.length === 0) {
        throw new Error("Không có phòng nào khả dụng để đặt.");
      }

      const apiData = {
        customer: bookingData.customer,
        room_ids: validRoomIds,
        check_in_date: bookingData.check_in_date,
        check_out_date: bookingData.check_out_date,
        deposit_amount: bookingData.deposit_amount,
        total_amount: totalAmount > 0 ? totalAmount : 100000, // Giá trị tối thiểu nếu 0 không hợp lệ
      };
      console.log("Data sent to API:", apiData);
      const response = await api.post("/bookings", apiData);
      if (response.status === 200 || response.status === 201) {
      setSnackbarMessage("Đặt phòng thành công!");
      setSnackbarOpen(true);
      setTimeout(() => navigate("/"), 1000);
    } else {
      throw new Error(`Yêu cầu thất bại với mã trạng thái ${response.status}`);
    }
  } catch (err: unknown) {
    let errorMessage = "Đã xảy ra lỗi khi thêm đặt phòng";
    if (err instanceof Error) {
      errorMessage = `Lỗi: ${err.message}`;
    }
    if (typeof err === "object" && err !== null && "response" in err) {
      const axiosError = err as {
        response?: { data?: { message?: string; errors?: { [key: string]: string[] } }; status?: number };
      };
      errorMessage =
        axiosError.response?.data?.message ||
        (axiosError.response?.data?.errors
          ? JSON.stringify(axiosError.response.data.errors)
          : `Lỗi server (Mã: ${axiosError.response?.status || 500})`);
    }
    setSnackbarMessage(errorMessage);
    setSnackbarOpen(true);
    console.error("Lỗi khi thêm đặt phòng:", err);
  } finally {
    setLoading(false);
  }
};

  const handleCancel = () => {
    navigate("/bookings");
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <Box className="booking-container">
      {loading && (
        <Box className="booking-loading-container" display="flex" flexDirection="column" alignItems="center">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </Box>
      )}
      {!loading && (
        <form onSubmit={handleSubmit}>
          <Paper elevation={3} className="booking-card">
            <Box className="card-header">
              <Typography variant="h5" className="card-title">
                <span className="card-icon">👤</span> Thông Tin Khách Hàng
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Nhập thông tin chi tiết của khách hàng
              </Typography>
            </Box>
            <Box className="card-content">
              <Box className="form-grid" sx={{ gap: "1.5rem" }}>
                <TextField
                  label="Số CCCD/CMND"
                  value={bookingData.customer.cccd}
                  onChange={(e) => handleCustomerChange("cccd", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.cccd}
                  helperText={validationErrors.cccd}
                />
                <TextField
                  label="Họ và tên"
                  value={bookingData.customer.name}
                  onChange={(e) => handleCustomerChange("name", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                />
                <Select
                  value={bookingData.customer.gender}
                  onChange={(e) => handleCustomerChange("gender", e.target.value as string)}
                  variant="outlined"
                  fullWidth
                  displayEmpty
                  sx={{ minWidth: 300 }}
                >
                  <MenuItem value="">Chọn giới tính</MenuItem>
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
                <TextField
                  label="Email"
                  type="email"
                  value={bookingData.customer.email}
                  onChange={(e) => handleCustomerChange("email", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                />
                <TextField
                  label="Số điện thoại"
                  type="tel"
                  value={bookingData.customer.phone}
                  onChange={(e) => handleCustomerChange("phone", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                />
                <TextField
                  label="Ngày sinh"
                  type="date"
                  value={bookingData.customer.date_of_birth}
                  onChange={(e) => handleDateChange("birth", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.date_of_birth}
                  helperText={validationErrors.date_of_birth}
                />
                <TextField
                  label="Quốc tịch"
                  value={bookingData.customer.nationality}
                  onChange={(e) => handleCustomerChange("nationality", e.target.value)}
                  variant="outlined"
                  fullWidth
                  sx={{ minWidth: 300 }}
                />
                <TextField
                  label="Địa chỉ"
                  value={bookingData.customer.address}
                  onChange={(e) => handleCustomerChange("address", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.address}
                  helperText={validationErrors.address}
                />
                <TextField
                  label="Ghi chú"
                  value={bookingData.customer.note}
                  onChange={(e) => handleCustomerChange("note", e.target.value)}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ minWidth: 300 }}
                />
              </Box>
            </Box>
          </Paper>

          <Paper elevation={3} className="booking-card">
            <Box className="card-header">
              <Typography variant="h5" className="card-title">
                <span className="card-icon">🏨</span> Chọn Phòng
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Chọn loại phòng và số phòng
              </Typography>
            </Box>
            <Box className="card-content">
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: "40%" }}>Loại phòng</TableCell>
                      <TableCell sx={{ width: "40%" }}>Phòng</TableCell>
                      <TableCell sx={{ width: "20%" }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookingData.rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>
                          <Select
                            value={room.roomType}
                            onChange={(e) => handleRoomChange(room.id, "roomType", e.target.value as string)}
                            variant="outlined"
                            fullWidth
                            displayEmpty
                          >
                            <MenuItem value="">Chọn một loại phòng</MenuItem>
                            {roomTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={room.roomNumber}
                            onChange={(e) => handleRoomChange(room.id, "roomNumber", e.target.value as string)}
                            variant="outlined"
                            fullWidth
                            disabled={!room.roomType}
                            displayEmpty
                          >
                            <MenuItem value="">Chọn một phòng</MenuItem>
                            {room.roomType && availableRooms[room.roomType]?.map((number) => (
                              <MenuItem key={number} value={number}>
                                {number}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => removeRoom(room.id)}
                            disabled={bookingData.rooms.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {validationErrors.rooms && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {validationErrors.rooms}
                </Typography>
              )}
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addRoom}
                className="add-room-btn"
                sx={{ mt: 2 }}
              >
                Thêm phòng
              </Button>
              {bookingData.rooms.some((room) => room.roomNumber) && (
                <Box className="selected-rooms" sx={{ mt: 2 }}>
                  <Typography variant="h6">
                    Tổng số phòng: {bookingData.rooms.filter((room) => room.roomNumber).length} phòng
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <Paper elevation={3} className="booking-card">
            <Box className="card-header">
              <Typography variant="h5" className="card-title">
                <span className="card-icon">📅</span> Thông Tin Đặt Phòng
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Chọn ngày nhận và trả phòng
              </Typography>
            </Box>
            <Box className="card-content">
              <Box className="form-grid" sx={{ gap: "1.5rem" }}>
                <TextField
                  label="Ngày nhận phòng"
                  type="date"
                  value={bookingData.check_in_date}
                  onChange={(e) => handleDateChange("check_in", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.check_in_date}
                  helperText={validationErrors.check_in_date}
                />
                <TextField
                  label="Ngày trả phòng"
                  type="date"
                  value={bookingData.check_out_date}
                  onChange={(e) => handleDateChange("check_out", e.target.value)}
                  variant="outlined"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 300 }}
                  error={!!validationErrors.check_out_date}
                  helperText={validationErrors.check_out_date}
                />
                <TextField
                  label="Tiền đặt cọc (VNĐ)"
                  type="number"
                  value={bookingData.deposit_amount}
                  onChange={(e) =>
                    setBookingData((prev) => ({
                      ...prev,
                      deposit_amount: Number(e.target.value) || 0,
                    }))
                  }
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                  sx={{ minWidth: 300 }}
                />
              </Box>
            </Box>
          </Paper>

          {bookingData.rooms.some((room) => room.roomNumber) &&
            bookingData.check_in_date &&
            bookingData.check_out_date && (
              <Paper elevation={3} className="booking-card summary-card">
                <Box className="card-header">
                  <Typography variant="h5" className="card-title">
                    <span className="card-icon">💳</span> Tóm Tắt Đặt Phòng
                  </Typography>
                </Box>
                <Box className="card-content">
                  <Box className="summary-content">
                    <Box className="summary-row">
                      <Typography>Số phòng đã chọn:</Typography>
                      <Typography color="secondary">
                        {bookingData.rooms.filter((room) => room.roomNumber).length}
                      </Typography>
                    </Box>
                    <Box className="summary-row">
                      <Typography>Ngày nhận phòng:</Typography>
                      <Typography color="secondary">{formatDate(bookingData.check_in_date)}</Typography>
                    </Box>
                    <Box className="summary-row">
                      <Typography>Ngày trả phòng:</Typography>
                      <Typography color="secondary">{formatDate(bookingData.check_out_date)}</Typography>
                    </Box>
                    <Box className="summary-row">
                      <Typography>Số đêm:</Typography>
                      <Typography color="secondary">{calculateNights()}</Typography>
                    </Box>
                    <Box className="summary-row">
                      <Typography>Tiền đặt cọc:</Typography>
                      <Typography color="secondary">
                        {bookingData.deposit_amount.toLocaleString("vi-VN")} VNĐ
                      </Typography>
                    </Box>
                    <Box className="summary-row summary-total">
                      <Typography variant="h6">Tổng tiền phòng:</Typography>
                      <Typography variant="h6" color="success.main">
                        {(calculateTotalAmount() * calculateNights()).toLocaleString("vi-VN")} VNĐ
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )}

          <Box className="form-actions">
            <Button
              variant="outlined"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="contained"
              type="submit"
              className="submit-btn"
              disabled={
                loading ||
                Object.keys(validationErrors).length > 0 ||
                !bookingData.rooms.some((room) => room.roomNumber) ||
                !bookingData.check_in_date ||
                !bookingData.check_out_date
              }
            >
              Đặt Phòng
            </Button>
          </Box>
        </form>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes("thành công") ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddBookings;