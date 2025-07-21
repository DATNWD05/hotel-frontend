"use client";
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
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { format, parseISO, isValid } from "date-fns";
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
  promotions: Promotion[];
}

interface EditBookingDialogProps {
  open: boolean;
  onClose: () => void;
  bookingInfo: Booking | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [promotionCode, setPromotionCode] = useState<string>("");
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);
  const [promotionsLoading, setPromotionsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState<boolean>(false);

  const fetchAvailableRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await api.get("/rooms");
      let roomsData = [];

      if (response.data.data) {
        roomsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        roomsData = response.data;
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
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      setPromotionsLoading(true);
      const response = await api.get("/promotions");
      let promotionsData = [];

      if (response.data.data) {
        promotionsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        promotionsData = response.data;
      }

      const activePromotions = promotionsData.filter(
        (promo: Promotion) => promo.is_active && promo.status === "active"
      );

      setPromotions(activePromotions);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setError("Không thể tải danh sách khuyến mãi. Vui lòng thử lại.");
    } finally {
      setPromotionsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAvailableRooms();
      fetchPromotions();
    }
  }, [open]);

  useEffect(() => {
    if (bookingInfo) {
      setCheckInDate(format(parseISO(bookingInfo.check_in_date), "yyyy-MM-dd"));
      setCheckOutDate(
        format(parseISO(bookingInfo.check_out_date), "yyyy-MM-dd")
      );
      setDepositAmount(bookingInfo.deposit_amount);
      setPromotionCode(
        bookingInfo.promotions && bookingInfo.promotions.length > 0
          ? bookingInfo.promotions[0].code
          : ""
      );

      const currentRoomIds = bookingInfo.rooms
        ? bookingInfo.rooms.map((room) => room.id)
        : [bookingInfo.room.id];

      setSelectedRoomIds(currentRoomIds);
      setError(null);
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

  const handlePromotionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPromotionCode(event.target.value);
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
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setError("Vui lòng nhập đầy đủ ngày nhận và trả phòng");
      return;
    }

    if (!isValidDate(checkInDate) || !isValidDate(checkOutDate)) {
      setError("Ngày nhận hoặc trả phòng không hợp lệ");
      return;
    }

    if (!isValidDeposit(depositAmount)) {
      setError("Số tiền đặt cọc không hợp lệ");
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      setError("Ngày nhận phòng phải sau hoặc bằng hôm nay");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Ngày trả phòng phải sau ngày nhận phòng");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        room_ids: selectedRoomIds,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        deposit_amount: depositAmount,
        promotion_code: promotionCode || null,
      };

      console.log("Payload gửi đi:", updateData);

      const response = await api.put(
        `/bookings/${bookingInfo.id}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      onConfirm(response.data.data);
      onClose();
    } catch (err) {
      console.error("Error updating booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRoomDisplayName = (room: Room) => {
    return `Phòng ${room.room_number}`;
  };

  const getPromotionDisplayName = (promo: Promotion) => {
    return `${promo.code} - ${promo.description} (${promo.discount_value}${
      promo.discount_type === "percent" ? "%" : " VNĐ"
    })`;
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ fontWeight: 600, fontSize: "25px", color: "#4318FF", mb: 2 }}
      >
        🏡 Sửa Đặt Phòng
      </DialogTitle>
      <DialogContent dividers sx={{ px: 4, py: 3 }}>
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

            {/* Display selected rooms as chips */}
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
                    />
                  );
                })}
              </Box>
            )}

            {/* Custom Dropdown */}
            <ClickAwayListener onClickAway={() => setRoomDropdownOpen(false)}>
              <Box sx={{ position: "relative" }}>
                {/* Input Field */}
                <Box
                  onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: "12px 14px",
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "#4318FF",
                    },
                    "&:focus": {
                      borderColor: "#4318FF",
                      outline: "none",
                    },
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

                {/* Dropdown Menu */}
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
                      availableRooms.map((room) => (
                        <Box
                          key={room.id}
                          onClick={() => handleRoomToggle(room.id)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: "8px 12px",
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "#f5f5f5",
                            },
                            borderBottom: "1px solid #f0f0f0",
                            "&:last-child": {
                              borderBottom: "none",
                            },
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
                            <Typography variant="body2" fontWeight="medium">
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
                      ))
                    )}
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>

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
              inputProps={{
                min: format(new Date(), "yyyy-MM-dd"),
              }}
              error={!!error && error.includes("ngày nhận")}
              helperText={error && error.includes("ngày nhận") ? error : null}
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
              error={!!error && error.includes("ngày trả")}
              helperText={error && error.includes("ngày trả") ? error : null}
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
              error={!!error && error.includes("đặt cọc")}
              helperText={error && error.includes("đặt cọc") ? error : null}
            />
          </Paper>

          {/* Promotion Selection */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #ccc",
              backgroundColor: "#fdfdfd",
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              🎁 Chọn khuyến mãi
            </Typography>
            <select
              value={promotionCode}
              onChange={handlePromotionChange}
              title="Khuyến mãi"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                marginTop: "8px",
              }}
              disabled={promotionsLoading}
            >
              <option value="">
                {promotionsLoading ? "Đang tải..." : "Không áp dụng"}
              </option>
              {promotions.map((promo) => (
                <option key={promo.id} value={promo.code}>
                  {getPromotionDisplayName(promo)} - Hiệu lực:{" "}
                  {format(parseISO(promo.start_date), "dd/MM/yyyy")} -{" "}
                  {format(parseISO(promo.end_date), "dd/MM/yyyy")}
                </option>
              ))}
            </select>
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
