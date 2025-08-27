import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Paper,
  Typography,
} from "@mui/material";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || isNaN(Number(value))) return "0 VNĐ";
  return Number(value).toLocaleString("vi-VN") + " VNĐ";
};

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

interface CheckinDialogProps {
  open: boolean;
  onClose: () => void;
  checkinInfo: CheckinInfo | null;
  onConfirm: () => void;
}

const formatDate = (date: string) => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error("Invalid date");
    return format(parsedDate, "dd/MM/yyyy");
  } catch {
    return "N/A";
  }
};

const CheckinDialog: React.FC<CheckinDialogProps> = ({
  open,
  onClose,
  checkinInfo,
  onConfirm,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  const handleCheckinClick = () => {
    if (!checkinInfo) return;

    const now = new Date();
    const checkinTime = parseISO(checkinInfo.check_in_date);

    if (isValid(checkinTime) && now < checkinTime) {
      const diffMs = checkinTime.getTime() - now.getTime();
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      const checkinFormatted = format(checkinTime, "dd/MM/yyyy HH:mm");

      setConfirmMessage(
        `⏰ Bạn chưa đến thời gian check-in.\n` +
          `Còn ${days} ngày ${hours} giờ ${minutes} phút nữa (${checkinFormatted}) mới đến giờ check-in.`
      );
      setConfirmOpen(true);
    } else {
      onConfirm();
    }
  };

  const handleConfirmEarly = () => {
    setConfirmOpen(false);
    onConfirm();
  };

  const handleCancelEarly = () => {
    setConfirmOpen(false);
    toast.info("❌ Bạn đã hủy check-in sớm.");
  };

  return (
    <>
      {/* Dialog chính */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ fontWeight: 600, fontSize: "25px", color: "#4318FF", mb: 2 }}
        >
          🧾 Thông tin Check-in
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {checkinInfo ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Thông tin khách hàng và đặt phòng */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Paper
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #ccc",
                    backgroundColor: "#fdfdfd",
                  }}
                >
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
                  <Typography variant="body2">
                    <b>Địa chỉ:</b> {checkinInfo.customer.address}
                  </Typography>
                </Paper>

                <Paper
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #ccc",
                    backgroundColor: "#fdfdfd",
                  }}
                >
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
                    <b>Đặt cọc:</b> {formatCurrency(checkinInfo.deposit_amount)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Tổng tiền:</b>{" "}
                    {formatCurrency(checkinInfo.total_amount)}
                  </Typography>
                  <Typography variant="body2">
                    <b>Người tạo:</b> {checkinInfo.created_by || "N/A"}
                  </Typography>
                </Paper>
              </Box>

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
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {checkinInfo.rooms.map((room, index) => (
                    <Box
                      key={index}
                      sx={{
                        flex: "1 1 calc(50% - 16px)",
                        minWidth: "260px",
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid #ccc",
                        backgroundColor: "#fff",
                      }}
                    >
                      <Typography fontWeight={700}>
                        🏨 Phòng {room.room_number} - {room.type.name}
                      </Typography>
                      <Typography>
                        <b>Giá:</b> {formatCurrency(room.rate)}
                      </Typography>
                      <Typography>
                        <b>Sức chứa:</b> {room.type.max_occupancy} người
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {room.type.amenities.map((a, i) => (
                          <Typography key={i} variant="body2">
                            - {a.name} x{a.quantity}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Dịch vụ đi kèm */}
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #ccc",
                  backgroundColor: "#fdfdfd",
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🛎️ Dịch vụ đi kèm
                </Typography>
                {checkinInfo.services.length === 0 ? (
                  <Typography variant="body2" fontStyle="italic">
                    Không có dịch vụ
                  </Typography>
                ) : (
                  checkinInfo.services.map((s, i) => (
                    <Typography key={i} variant="body2">
                      - {s.name} x{s.quantity} ({formatCurrency(s.price)})
                    </Typography>
                  ))
                )}
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
            onClick={handleCheckinClick}
            variant="contained"
            color="primary"
            disabled={!checkinInfo}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Check-in ngay
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popup confirm đẹp */}
      <Dialog
        open={confirmOpen}
        onClose={handleCancelEarly}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "20px", color: "red" }}>
          ⏰ Chưa đến giờ check-in
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: "pre-line" }}>
            {confirmMessage}
          </Typography>
          <Typography sx={{ mt: 1, fontStyle: "italic", color: "gray" }}>
            Bạn có muốn check-in sớm không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEarly} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleConfirmEarly}
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Check-in sớm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckinDialog;