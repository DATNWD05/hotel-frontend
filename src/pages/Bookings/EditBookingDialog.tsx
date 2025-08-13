/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
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
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";
import axios from "axios"; // ⬅️ dùng để nhận diện lỗi Axios (422)
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
}

interface EditBookingDialogProps {
  open: boolean;
  onClose: () => void;
  bookingInfo: Booking | null;
  onConfirm: (updatedBooking: any) => void;
}

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

  // ⬇️ giữ lỗi từ backend (Laravel 422)
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>(
    {}
  );

  const firstError = (key: string): string | undefined =>
    formErrors?.[key]?.[0];

  const fetchAvailableRooms = async () => {
    try {
      setRoomsLoading(true);
      const { data } = await api.get("/rooms");
      let roomsData: any[] = [];

      if (data?.data) {
        roomsData = data.data;
      } else if (Array.isArray(data)) {
        roomsData = data;
      }

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
    if (open) {
      fetchAvailableRooms();
    }
  }, [open]);

  useEffect(() => {
    if (bookingInfo) {
      setCheckInDate(format(parseISO(bookingInfo.check_in_date), "yyyy-MM-dd"));
      setCheckOutDate(
        format(parseISO(bookingInfo.check_out_date), "yyyy-MM-dd")
      );
      setDepositAmount(bookingInfo.deposit_amount);

      const currentRoomIds = bookingInfo.rooms
        ? bookingInfo.rooms.map((room) => room.id)
        : [bookingInfo.room.id];

      setSelectedRoomIds(currentRoomIds);
      setError(null);
      setFormErrors({}); // clear lỗi cũ khi mở booking mới
    }
  }, [bookingInfo]);

  const handleRoomToggle = (roomId: number) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(roomId)) {
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const removeRoom = (roomIdToRemove: number) => {
    setSelectedRoomIds((prev) => prev.filter((id) => id !== roomIdToRemove));
  };

  const isValidDateStr = (dateStr: string): boolean => {
    return isValid(parseISO(dateStr)) && !isNaN(new Date(dateStr).getTime());
  };

  const isValidDeposit = (amount: string): boolean => {
    const num = Number.parseFloat(amount);
    return !isNaN(num) && num >= 0;
  };

  const handleConfirm = async () => {
    if (!bookingInfo) return;

    setError(null);
    setFormErrors({});
    setLoading(true);

    try {
      // so sánh thay đổi
      const originalCheckIn = format(
        parseISO(bookingInfo.check_in_date),
        "yyyy-MM-dd"
      );
      const originalCheckOut = format(
        parseISO(bookingInfo.check_out_date),
        "yyyy-MM-dd"
      );

      const ciChanged = checkInDate !== originalCheckIn;
      const coChanged = checkOutDate !== originalCheckOut;

      const originalRoomIds = (
        bookingInfo.rooms
          ? bookingInfo.rooms.map((r) => r.id)
          : [bookingInfo.room.id]
      )
        .slice()
        .sort((a, b) => a - b);
      const currentRoomIds = selectedRoomIds.slice().sort((a, b) => a - b);
      const roomsChanged =
        JSON.stringify(originalRoomIds) !== JSON.stringify(currentRoomIds);
        const depositChanged =
        Number.parseFloat(String(bookingInfo.deposit_amount)) !==
        Number.parseFloat(String(depositAmount));

      // không có gì đổi -> báo và dừng
      if (!depositChanged && !roomsChanged && !ciChanged && !coChanged) {
        toast.info("Không có thay đổi nào để cập nhật");
        setLoading(false);
        return;
      }

      // validate CÓ ĐIỀU KIỆN: chỉ check thứ gì đang thay đổi
      if (roomsChanged && selectedRoomIds.length === 0) {
        setError("Vui lòng chọn ít nhất một phòng hợp lệ");
        toast.error("Vui lòng chọn ít nhất một phòng hợp lệ");
        setLoading(false);
        return;
      }

      if (ciChanged || coChanged) {
        const isValidDateStr = (s: string) =>
          isValid(parseISO(s)) && !isNaN(new Date(s).getTime());
        if (!isValidDateStr(checkInDate) || !isValidDateStr(checkOutDate)) {
          setError("Ngày nhận hoặc trả phòng không hợp lệ");
          toast.error("Ngày nhận hoặc trả phòng không hợp lệ");
          setLoading(false);
          return;
        }
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkIn < today) {
          setError("Ngày nhận phòng phải sau hoặc bằng hôm nay");
          toast.error("Ngày nhận phòng phải sau hoặc bằng hôm nay");
          setLoading(false);
          return;
        }
        if (checkOut <= checkIn) {
          setError("Ngày trả phòng phải sau ngày nhận phòng");
          toast.error("Ngày trả phòng phải sau ngày nhận phòng");
          setLoading(false);
          return;
        }
      }

      // build payload: CHỈ gửi field đã đổi
      const updateData: any = {
        ...(depositChanged ? { deposit_amount: Number(depositAmount) } : {}),
        ...(roomsChanged ? { room_ids: selectedRoomIds } : {}),
        ...(ciChanged
          ? { check_in_date: format(new Date(checkInDate), "yyyy-MM-dd") }
          : {}),
        ...(coChanged
          ? { check_out_date: format(new Date(checkOutDate), "yyyy-MM-dd") }
          : {}),
      };

      // Nếu API cần DATETIME kèm giờ chuẩn khách sạn, mở 2 dòng này:
      // if (ciChanged) updateData.check_in_at = `${updateData.check_in_date || originalCheckIn} 14:00`;
      // if (coChanged) updateData.check_out_at = `${updateData.check_out_date || originalCheckOut} 12:00`;

      console.log("Payload gửi đi:", updateData);

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
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as any;
        console.error("Update booking failed:", err.response?.status, data);
        setFormErrors(data?.errors ?? {});
        const msg = data?.message || "Cập nhật đặt phòng thất bại";
        setError(msg);
        toast.error(msg);
      } else {
        console.error(err);
        setError("Cập nhật đặt phòng thất bại");
        toast.error("Cập nhật đặt phòng thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoomDisplayName = (room: Room) => `Phòng ${room.room_number}`;

  const getSelectedRoomsDisplay = () => {
    if (selectedRoomIds.length === 0) return "Chọn phòng";
    if (selectedRoomIds.length === 1) {
      const room = availableRooms.find((r) => r.id === selectedRoomIds[0]);
      return room ? getRoomDisplayName(room) : "Phòng không xác định";
    }
    return `${selectedRoomIds.length} phòng đã chọn`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ fontWeight: 600, fontSize: "25px", color: "#4318FF", mb: 2 }}
      >
        🏡 Sửa Đặt Phòng
      </DialogTitle>

      <DialogContent dividers sx={{ px: 4, py: 3 }}>
        {/* Thông báo lỗi tổng quát (server message) */}
        {error && (
          <Typography
            color="error"
            sx={{ mb: 2, p: 2, bgcolor: "#ffebee", borderRadius: 2 }}
          >
            {error}
          </Typography>
        )}

        <Typography color="warning" sx={{ mb: 2 }}>
          Lưu ý: Mọi thay đổi cần phải chính xác!. Vui lòng xác nhận với quản lý
          để tránh trùng lặp đặt phòng.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
          {/* Room Selection */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #ccc",
              backgroundColor: "#fdfdfd",
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              🛏️ Chọn phòng
            </Typography>

            {/* Chips phòng đã chọn */}
            {selectedRoomIds.length > 0 && (
              <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedRoomIds.map((roomId) => {
                  const room = availableRooms.find((r) => r.id === roomId);
                  return (
                    <Chip
                      key={roomId}
                      label={room ? getRoomDisplayName(room) : `Room ${roomId}`}
                      onDelete={() => removeRoom(roomId)}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{
                        bgcolor: "#e3f2fd",
                        "&:hover": { bgcolor: "#bbdefb" },
                      }}
                    />
                  );
                })}
              </Box>
            )}
            {/* Dropdown chọn phòng */}
            <ClickAwayListener onClickAway={() => setRoomDropdownOpen(false)}>
              <Box sx={{ position: "relative" }}>
                <Box
                  onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: "12px 14px",
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    bgcolor: "#fff",
                    cursor: "pointer",
                    "&:hover": { borderColor: "#4318FF", bgcolor: "#f5f5f5" },
                    "&:focus": { borderColor: "#4318FF", outline: "none" },
                  }}
                >
                  <Typography
                    variant="body1"
                    color={
                      selectedRoomIds.length === 0
                        ? "text.secondary"
                        : "text.primary"
                    }
                  >
                    {getSelectedRoomsDisplay()}
                  </Typography>
                  {roomDropdownOpen ? (
                    <KeyboardArrowUp />
                  ) : (
                    <KeyboardArrowDown />
                  )}
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
                      border: "1px solid #ccc",
                      borderTop: "none",
                      borderRadius: "0 0 4px 4px",
                      mt: 0,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {roomsLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 2,
                        }}
                      >
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography>Đang tải...</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ p: 1 }}>
                        {availableRooms.map((room) => (
                          <Box
                            key={room.id}
                            onClick={() => handleRoomToggle(room.id)}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              p: "10px",
                              cursor: "pointer",
                              bgcolor: selectedRoomIds.includes(room.id)
                                ? "#e3f2fd"
                                : "transparent",
                              "&:hover": { bgcolor: "#f5f5f5" },
                              borderBottom: "1px solid #eee",
                              "&:last-child": { borderBottom: "none" },
                              borderRadius: 1,
                            }}
                          >
                            <Checkbox
                              checked={selectedRoomIds.includes(room.id)}
                              onChange={() => handleRoomToggle(room.id)}
                              color="primary"
                              size="small"
                              sx={{ mr: 1, p: 0 }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight="medium"
                                color={
                                  room.status === "available" ? "green" : "red"
                                }
                              >
                                {getRoomDisplayName(room)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {room.room_type.name} -{" "}
                                {Number.parseInt(
                                  room.room_type.base_rate
                                ).toLocaleString()}{" "}
                                VNĐ -{" "}
                                {room.status === "available"
                                  ? "Đang Trống"
                                  : "Đã đặt"}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>

            {/* lỗi server cho room_ids */}
            {firstError("room_ids") && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 1, display: "block" }}
              >
                {firstError("room_ids")}
              </Typography>
            )}

            <Typography
              variant="caption"
              color="primary"
              sx={{ mt: 1, display: "block", fontWeight: "bold" }}
            >
              Đã chọn: {selectedRoomIds.length} phòng
            </Typography>
          </Paper>

          {/* Check-in Date */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #ccc",
              backgroundColor: "#fdfdfd",
              }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              📅 Ngày nhận phòng
            </Typography>
            <TextField
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              fullWidth
              InputProps={{ style: { padding: "8px" } }}
              inputProps={{ min: format(new Date(), "yyyy-MM-dd") }}
              error={Boolean(firstError("check_in_date"))}
              helperText={firstError("check_in_date") || null}
            />
          </Paper>

          {/* Check-out Date */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #ccc",
              backgroundColor: "#fdfdfd",
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              📅 Ngày trả phòng
            </Typography>
            <TextField
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              fullWidth
              InputProps={{ style: { padding: "8px" } }}
              inputProps={{
                min: checkInDate || format(new Date(), "yyyy-MM-dd"),
              }}
              error={Boolean(firstError("check_out_date"))}
              helperText={firstError("check_out_date") || null}
            />
          </Paper>

          {/* Deposit Amount */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #ccc",
              backgroundColor: "#fdfdfd",
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              💰 Số tiền đặt cọc (VNĐ)
            </Typography>
            <TextField
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              fullWidth
              InputProps={{ style: { padding: "8px" } }}
              error={Boolean(firstError("deposit_amount"))}
              helperText={firstError("deposit_amount") || null}
            />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Hủy
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading || selectedRoomIds.length === 0}
          sx={{
            borderRadius: 2,
            px: 3,
            backgroundColor: "#4318FF",
            "&:hover": { backgroundColor: "#3311CC" },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Xác nhận"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditBookingDialog;