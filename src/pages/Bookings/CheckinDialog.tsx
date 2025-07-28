import React from "react";
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
import numeral from "numeral";
import { toast } from "react-toastify";

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
  React.useEffect(() => {
    if (!checkinInfo && open) {
      toast.info("Đang tải thông tin...");
    }
  }, [checkinInfo, open]);

  return (
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
                  <b>Đặt cọc:</b>{" "}
                  {numeral(checkinInfo.deposit_amount).format("0,0")} VNĐ
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <b>Tổng tiền:</b>{" "}
                  {numeral(checkinInfo.total_amount).format("0,0")} VNĐ
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
                      <b>Giá:</b> {numeral(room.rate).format("0,0")} VNĐ
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
                    - {s.name} x{s.quantity} ({numeral(s.price).format("0,0")}{" "}
                    VNĐ)
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
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={!checkinInfo}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Check-in ngay
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckinDialog;