/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Box,
  Paper,
  Chip,
  Checkbox,
  ClickAwayListener,
} from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";
import api from "../../api/axios";

interface Room {
  id: number;
  room_number: string;
  room_type: {
    id: number;
    name: string;
    base_rate: string;
  };
  status: string;
}

interface Customer {
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  note: string | null;
}

interface Booking {
  id: number;
  customer_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  deposit_amount: string;
  customer: Customer;
  room: {
    id: number;
    room_number: string;
    room_type: {
      id: number;
      name: string;
      base_rate: string;
    };
  };
  rooms?: Room[];
  is_hourly: boolean;
}

interface EditBookingDialogProps {
  open: boolean;
  onClose: () => void;
  bookingInfo: Booking | null;
  onConfirm: (updatedBooking: any) => void;
}

const formatDate = (date: string, isHourly: boolean) => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error("Invalid date");
    return format(parsedDate, isHourly ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
  } catch {
    return "N/A";
  }
};

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  open,
  onClose,
  bookingInfo,
  onConfirm,
}) => {
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState<boolean>(false);
  const [isHourly, setIsHourly] = useState<boolean>(false);

  const fetchAvailableRooms = async () => {
    try {
      setRoomsLoading(true);
      const { data } = await api.post("/available-rooms", {
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        is_hourly: isHourly,
      });
      const roomsData = Array.isArray(data) ? data : data.data || [];

      const availableRoomsFiltered = roomsData.filter(
        (room: Room) => room.status === "available"
      );

      if (bookingInfo) {
        const currentRooms = bookingInfo.rooms || [bookingInfo.room];
        currentRooms.forEach((currentRoom) => {
          const existsInAvailable = availableRoomsFiltered.some(
            (room: Room) => room.id === currentRoom.id
          );
          if (!existsInAvailable) {
            availableRoomsFiltered.push({
              id: currentRoom.id,
              room_number: currentRoom.room_number,
              room_type: currentRoom.room_type,
              status: "booked",
            });
          }
        });
      }

      setAvailableRooms(availableRoomsFiltered);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Không thể tải danh sách phòng. Vui lòng thử lại.");
      toast.error("Không thể tải danh sách phòng. Vui lòng thử lại.");
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (open && checkInDate && checkOutDate) {
      fetchAvailableRooms();
    }
  }, [open, checkInDate, checkOutDate, isHourly]);

  useEffect(() => {
    if (bookingInfo) {
      const parsedCheckIn = parseISO(bookingInfo.check_in_date);
      const parsedCheckOut = parseISO(bookingInfo.check_out_date);
      setCheckInDate(
        isValid(parsedCheckIn)
          ? format(
              parsedCheckIn,
              bookingInfo.is_hourly ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd"
            )
          : ""
      );
      setCheckOutDate(
        isValid(parsedCheckOut)
          ? format(
              parsedCheckOut,
              bookingInfo.is_hourly ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd"
            )
          : ""
      );
      setDepositAmount(bookingInfo.deposit_amount);
      setIsHourly(bookingInfo.is_hourly ?? false);
      const currentRoomIds = bookingInfo.rooms
        ? bookingInfo.rooms.map((room) => room.id)
        : [bookingInfo.room.id];
      setSelectedRoomIds(currentRoomIds);
      setError(null);
    }
  }, [bookingInfo]);

  const handleRoomToggle = (roomId: number) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const removeRoom = (roomIdToRemove: number) => {
    setSelectedRoomIds((prev) => prev.filter((id) => id !== roomIdToRemove));
  };

  const isValidDate = (dateStr: string): boolean => {
    return isValid(parseISO(dateStr)) && !isNaN(new Date(dateStr).getTime());
  };

  const isValidDeposit = (amount: string): boolean => {
    const num = Number.parseFloat(amount);
    return !isNaN(num) && num >= 0;
  };

  const handleConfirm = async () => {
    if (!bookingInfo) return;

    if (selectedRoomIds.length === 0) {
      setError("Vui lòng chọn ít nhất một phòng hợp lệ");
      toast.error("Vui lòng chọn ít nhất một phòng hợp lệ");
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setError("Vui lòng nhập đầy đủ ngày nhận và trả phòng");
      toast.error("Vui lòng nhập đầy đủ ngày nhận và trả phòng");
      return;
    }

    if (!isValidDate(checkInDate) || !isValidDate(checkOutDate)) {
      setError("Ngày nhận hoặc trả phòng không hợp lệ");
      toast.error("Ngày nhận hoặc trả phòng không hợp lệ");
      return;
    }

    if (!isValidDeposit(depositAmount)) {
      setError("Số tiền đặt cọc không hợp lệ");
      toast.error("Số tiền đặt cọc không hợp lệ");
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      setError("Ngày nhận phòng phải sau hoặc bằng hôm nay");
      toast.error("Ngày nhận phòng phải sau hoặc bằng hôm nay");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Ngày trả phòng phải sau ngày nhận phòng");
      toast.error("Ngày trả phòng phải sau ngày nhận phòng");
      return;
    }

    if (isHourly) {
      const hoursDiff =
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 1) {
        setError(
          "Thời gian trả phòng phải sau thời gian nhận phòng ít nhất 1 giờ"
        );
        toast.error(
          "Thời gian trả phòng phải sau thời gian nhận phòng ít nhất 1 giờ"
        );
        return;
      }
      if (checkIn.getHours() >= 20) {
        setError("Booking theo giờ không được bắt đầu sau 20:00");
        toast.error("Booking theo giờ không được bắt đầu sau 20:00");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        room_ids: selectedRoomIds,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        deposit_amount: depositAmount,
        is_hourly: isHourly,
      };

      const { data } = await api.put(
        `/bookings/${bookingInfo.id}`,
        updateData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      onConfirm(data.data);
      toast.success("Cập nhật đặt phòng thành công");
      onClose();
    } catch (err) {
      console.error("Error updating booking:", err);
      setError("Cập nhật đặt phòng thất bại");
      toast.error("Cập nhật đặt phòng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const getRoomDisplayName = (room: Room) => {
    return `Phòng ${room.room_number} - ${room.room_type.name}`;
  };

  const getSelectedRoomsDisplay = () => {
    if (selectedRoomIds.length === 0) return "Chọn phòng";
    if (selectedRoomIds.length === 1) {
      const room = availableRooms.find((r) => r.id === selectedRoomIds[0]);
      return room ? getRoomDisplayName(room) : "Phòng không xác định";
    }
    return `${selectedRoomIds.length} phòng đã chọn`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{ fontWeight: 600, fontSize: "25px", color: "#4318FF", mb: 2 }}
      >
        🧾 Chỉnh sửa đặt phòng
      </DialogTitle>
      <DialogContent dividers sx={{ px: 4, py: 3, bgcolor: "#fff" }}>
        {error && (
          <Typography sx={{ color: "#dc2626", mb: 3 }}>{error}</Typography>
        )}
        {bookingInfo ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Loại đặt phòng */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #ccc",
                backgroundColor: "#fdfdfd",
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                📅 Loại đặt phòng
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant={!isHourly ? "contained" : "outlined"}
                  onClick={() => setIsHourly(false)}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    textTransform: "none",
                    ...(isHourly
                      ? { borderColor: "#ccc", color: "#6b7280" }
                      : { bgcolor: "#4318FF", color: "white" }),
                  }}
                >
                  Theo ngày
                </Button>
                <Button
                  variant={isHourly ? "contained" : "outlined"}
                  onClick={() => setIsHourly(true)}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    textTransform: "none",
                    ...(isHourly
                      ? { bgcolor: "#4318FF", color: "white" }
                      : { borderColor: "#ccc", color: "#6b7280" }),
                  }}
                >
                  Theo giờ
                </Button>
              </Box>
            </Paper>

            {/* Phòng */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #ccc",
                backgroundColor: "#fdfdfd",
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                🛏️ Phòng
              </Typography>
              <Box sx={{ mb: 2 }}>
                {selectedRoomIds.length > 0 && (
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                  >
                    {selectedRoomIds.map((roomId) => {
                      const room = availableRooms.find((r) => r.id === roomId);
                      return (
                        <Chip
                          key={roomId}
                          label={
                            room ? getRoomDisplayName(room) : `Phòng ${roomId}`
                          }
                          onDelete={() => removeRoom(roomId)}
                          sx={{
                            bgcolor: "#f3f4f6",
                            color: "#374151",
                            fontWeight: 500,
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
                <ClickAwayListener
                  onClickAway={() => setRoomDropdownOpen(false)}
                >
                  <Box sx={{ position: "relative" }}>
                    <Box
                      onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                      sx={{
                        p: 2,
                        border: "1px solid #ccc",
                        borderRadius: 2,
                        bgcolor: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color={
                          selectedRoomIds.length === 0 ? "#6b7280" : "#374151"
                        }
                      >
                        {getSelectedRoomsDisplay()}
                      </Typography>
                      <KeyboardArrowDown
                        sx={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: roomDropdownOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </Box>
                    {roomDropdownOpen && (
                      <Paper
                        sx={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          maxHeight: "300px",
                          overflowY: "auto",
                          mt: 1,
                          border: "1px solid #ccc",
                          borderRadius: 2,
                        }}
                      >
                        {roomsLoading ? (
                          <Box sx={{ p: 2, textAlign: "center" }}>
                            <CircularProgress size={20} sx={{ mr: 2 }} />
                            <Typography variant="body2">Đang tải...</Typography>
                          </Box>
                        ) : (
                          availableRooms.map((room) => (
                            <Box
                              key={room.id}
                              onClick={() => handleRoomToggle(room.id)}
                              sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                bgcolor: selectedRoomIds.includes(room.id)
                                  ? "#f3f4f6"
                                  : "transparent",
                                "&:hover": { bgcolor: "#f9fafb" },
                              }}
                            >
                              <Checkbox
                                checked={selectedRoomIds.includes(room.id)}
                                sx={{ mr: 2 }}
                              />
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {getRoomDisplayName(room)}
                                </Typography>
                                <Typography variant="body2" color="#6b7280">
                                  <b>Giá:</b>{" "}
                                  {Number.parseInt(
                                    room.room_type.base_rate
                                  ).toLocaleString()}{" "}
                                  VNĐ
                                </Typography>
                                <Typography variant="body2" color="#6b7280">
                                  <b>Trạng thái:</b>{" "}
                                  {room.status === "available"
                                    ? "Trống"
                                    : "Đã đặt"}
                                </Typography>
                              </Box>
                            </Box>
                          ))
                        )}
                      </Paper>
                    )}
                  </Box>
                </ClickAwayListener>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <b>Đã chọn:</b> {selectedRoomIds.length} phòng
                </Typography>
              </Box>
            </Paper>

            {/* Thời gian */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #ccc",
                backgroundColor: "#fdfdfd",
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                📅 Thời gian
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>{isHourly ? "Thời gian nhận:" : "Ngày nhận:"}</b>{" "}
                    {checkInDate ? formatDate(checkInDate, isHourly) : "N/A"}
                  </Typography>
                  <TextField
                    type={isHourly ? "datetime-local" : "date"}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>{isHourly ? "Thời gian trả:" : "Ngày trả:"}</b>{" "}
                    {checkOutDate ? formatDate(checkOutDate, isHourly) : "N/A"}
                  </Typography>
                  <TextField
                    type={isHourly ? "datetime-local" : "date"}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Đặt cọc */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #ccc",
                backgroundColor: "#fdfdfd",
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                💰 Đặt cọc
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <b>Số tiền đặt cọc:</b>{" "}
                {depositAmount
                  ? `${Number.parseFloat(depositAmount).toLocaleString()} VNĐ`
                  : "N/A"}
              </Typography>
              <TextField
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                fullWidth
                size="small"
                placeholder="0 VNĐ"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Paper>
          </Box>
        ) : (
          <Typography>Đang tải thông tin...</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading || selectedRoomIds.length === 0}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {loading ? (
            <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
          ) : null}
          {loading ? "Đang xử lý..." : "Cập nhật"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditBookingDialog;
