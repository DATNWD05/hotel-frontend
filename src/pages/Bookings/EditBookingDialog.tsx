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
import { KeyboardArrowDown } from "@mui/icons-material";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";
import axios from "axios"; // ⬅️ dùng để nhận diện lỗi Axios (422)
import api from "../../api/axios";

interface Room {
  id: number;
  room_number: string;
  room_type?: {
    id: number;
    name: string;
    base_rate: string;
  };
  room_type_id?: number;
  status?: string; // "available" | "booked"
  // available?: boolean; // nếu muốn giữ theo BE
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

  // utils nhỏ để chuẩn hoá
  const toApiDate = (
    value: string,
    opts: { hourly: boolean; kind: "in" | "out" }
  ) => {
    if (!value) return value;
    // hourly: FE đã là "yyyy-MM-ddTHH:mm" rồi, giữ nguyên
    if (opts.hourly) return value;

    // daily:
    // - check-in: nên gắn 14:00 để không thua now nếu là hôm nay
    // - check-out: bắt buộc 12:00 theo BE
    const isDateOnly = value.length === 10; // "yyyy-MM-dd"
    if (opts.kind === "in") return isDateOnly ? `${value}T14:00` : value;
    if (opts.kind === "out") return isDateOnly ? `${value}T12:00` : value;
    return value;
  };

  // ⬇️ giữ lỗi từ backend (Laravel 422)
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>(
    {}
  );

  const firstError = (key: string): string | undefined =>
    formErrors?.[key]?.[0];

  const fetchAvailableRooms = async () => {
    try {
      setRoomsLoading(true);

      // Nếu booking đã bắt đầu trong quá khứ, kẹp check_in_date = max(now, check_in_date cũ)
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const toLocalDate = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const toLocalDT = (d: Date) =>
        `${toLocalDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

      const ciIsPast =
        checkInDate && new Date(checkInDate).getTime() < now.getTime();
      const effectiveCheckIn = ciIsPast
        ? isHourly
          ? toLocalDT(now)
          : toLocalDate(now)
        : checkInDate;

      const { data } = await api.post("/available-rooms", {
        check_in_date: effectiveCheckIn,
        check_out_date: checkOutDate,
        is_hourly: isHourly,
        // room_type_id: ... // nếu bạn muốn lọc theo loại phòng
      });

      const raw = Array.isArray(data) ? data : data?.data || [];

      // Chuẩn hoá dữ liệu để khớp interface Room của FE
      const normalized: Room[] = raw.map((r: any) => ({
        id: r.id,
        room_number: r.room_number,
        // BE chỉ trả room_type_id -> giữ lại để sau này có thể dùng
        room_type_id: r.room_type_id,
        // FE mong đợi room_type có name/base_rate -> để undefined, khi render sẽ fallback
        room_type: r.room_type
          ? {
              id: r.room_type.id,
              name: r.room_type.name,
              base_rate: String(
                r.room_type.base_rate ?? r.room_type.hourly_rate ?? 0
              ),
            }
          : undefined,
        // FE đang trông chờ "status" -> map từ available (true -> "available")
        status: r.available ? "available" : "booked",
        // giữ lại available nếu cần
        // available: r.available ?? true,
      }));

      // Thêm các phòng đang thuộc booking hiện tại (để vẫn chọn/sửa được)
      const merged = [...normalized];
      if (bookingInfo) {
        const currentRooms = bookingInfo.rooms || [bookingInfo.room];
        currentRooms.forEach((cr) => {
          if (!merged.some((x) => x.id === cr.id)) {
            merged.push({ ...cr, status: "booked" } as Room);
          }
        });
      }

      setAvailableRooms(merged);
      setError(null);
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
      setFormErrors({}); // clear lỗi cũ khi mở booking mới
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


  const handleConfirm = async () => {
    if (!bookingInfo) return;

    // Validate cơ bản
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
    if (!isValid(parseISO(checkInDate)) || !isValid(parseISO(checkOutDate))) {
      setError("Ngày nhận hoặc trả phòng không hợp lệ");
      toast.error("Ngày nhận hoặc trả phòng không hợp lệ");
      return;
    }
    if (depositAmount !== "" && Number.isNaN(Number(depositAmount))) {
      setError("Số tiền đặt cọc không hợp lệ");
      toast.error("Số tiền đặt cọc không hợp lệ");
      return;
    }

    // Chuẩn hoá theo rule BE
    const ciForApi = toApiDate(checkInDate, { hourly: isHourly, kind: "in" });
    const coForApi = toApiDate(checkOutDate, { hourly: isHourly, kind: "out" });

    // Re-validate với giá trị đã chuẩn hoá
    const ci = new Date(ciForApi);
    const co = new Date(coForApi);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (ci < today) {
      setError("Ngày nhận phòng phải sau hoặc bằng hôm nay");
      toast.error("Ngày nhận phòng phải sau hoặc bằng hôm nay");
      return;
    }
    if (co <= ci) {
      setError("Ngày trả phòng phải sau ngày nhận phòng");
      toast.error("Ngày trả phòng phải sau ngày nhận phòng");
      return;
    }
    if (isHourly) {
      const hoursDiff = (co.getTime() - ci.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 1) {
        const msg =
          "Thời gian trả phòng phải sau thời gian nhận phòng ít nhất 1 giờ";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (ci.getHours() >= 20) {
        const msg = "Booking theo giờ không được bắt đầu sau 20:00";
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    setLoading(true);
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
        room_ids: selectedRoomIds,
        check_in_date: ciForApi,
        check_out_date: coForApi,
        is_hourly: isHourly,
      };
      // Chỉ gửi deposit khi có giá trị
      if (depositAmount !== "")
        updateData.deposit_amount = Number(depositAmount);

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
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Cập nhật đặt phòng thất bại";
      console.error("Error updating booking:", err?.response || err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRoomDisplayName = (room: Room) => {
    const typeName =
      room.room_type?.name ?? `Loại #${room.room_type_id ?? "?"}`;
    return `Phòng ${room.room_number} - ${typeName}`;
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
                                  {(() => {
                                    const rate = Number.parseInt(
                                      room.room_type?.base_rate ?? "0"
                                    );
                                    return rate > 0
                                      ? `${rate.toLocaleString()} VNĐ`
                                      : "—";
                                  })()}
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