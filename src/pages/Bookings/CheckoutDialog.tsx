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
  CircularProgress,
} from "@mui/material";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import { toast } from "react-toastify";

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

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  checkoutInfo: CheckoutInfo | null;
  paymentMethod: "cash" | "vnpay" | null;
  setPaymentMethod: (method: "cash" | "vnpay" | null) => void;
  isPaying: boolean;
  onConfirmCheckout: () => void;
  onVNPayCheckout: (bookingId: number) => void;
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

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  open,
  onClose,
  checkoutInfo,
  paymentMethod,
  setPaymentMethod,
  isPaying,
  onConfirmCheckout,
  onVNPayCheckout,
}) => {
  React.useEffect(() => {
    if (!checkoutInfo && open) {
      toast.info("Đang tải thông tin...");
    }
  }, [checkoutInfo, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{ sx: { width: "990px", maxWidth: "none" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "24px", color: "#FF9800" }}>
        💸 Thông tin thanh toán & trả phòng
      </DialogTitle>
      <DialogContent dividers sx={{ px: 4, py: 3 }}>
        {checkoutInfo ? (
          <>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                🧾 Thông tin đơn đặt phòng
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Mã đơn:</Typography>
                  <Typography>#{checkoutInfo.booking_id}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Trạng thái:</Typography>
                  <Typography
                    sx={{
                      color:
                        checkoutInfo.status === "Checked-out"
                          ? "#4caf50"
                          : "#1976d2",
                    }}
                  >
                    {getBookingStatus(checkoutInfo.status).status}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Ngày nhận phòng:</Typography>
                  <Typography>
                    {formatDate(checkoutInfo.check_in_date)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Ngày trả phòng:</Typography>
                  <Typography>
                    {formatDate(checkoutInfo.check_out_date)}
                  </Typography>
                </Box>
                {checkoutInfo.check_out_at && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography fontWeight={600}>
                      Thời gian trả phòng:
                    </Typography>
                    <Typography>
                      {formatDate(checkoutInfo.check_out_at)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Số đêm:</Typography>
                  <Typography>{checkoutInfo.nights} đêm</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Tiền đặt cọc:</Typography>
                  <Typography>
                    {numeral(checkoutInfo.deposit_amount).format("0,0")} VNĐ
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 4,
                alignItems: "flex-start",
                mb: 3,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  flex: 6,
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🛏️ Chi tiết phòng
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  {checkoutInfo.room_details.map((room, index) => (
                    <Box
                      key={index}
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography>- Phòng {room.room_number}:</Typography>
                      <Typography>
                        {numeral(room.base_rate).format("0,0")} ×{" "}
                        {checkoutInfo.nights} đêm ={" "}
                        {numeral(room.total).format("0,0")} VNĐ
                      </Typography>
                    </Box>
                  ))}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography fontWeight={600}>Tổng tiền phòng:</Typography>
                    <Typography>
                      {numeral(checkoutInfo.room_total).format("0,0")} VNĐ
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper
                elevation={1}
                sx={{
                  flex: 4,
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🛎️ Dịch vụ sử dụng
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Tổng tiền dịch vụ:</Typography>
                  <Typography>
                    {numeral(checkoutInfo.service_total).format("0,0")} VNĐ
                  </Typography>
                </Box>
              </Paper>
            </Box>

            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                💳 Tóm tắt thanh toán
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Thành tiền (phòng + dịch vụ):</Typography>
                  <Typography>
                    {numeral(checkoutInfo.raw_total).format("0,0")} VNĐ
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Giảm giá:</Typography>
                  <Typography>
                    {numeral(checkoutInfo.discount_amount).format("0,0")} VNĐ
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "18px", fontWeight: "bold" }}>
                    Tổng cần thanh toán:
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: "bold" }}>
                    {numeral(checkoutInfo.total_amount).format("0,0")} VNĐ
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{ color: "#1a237e" }}
              >
                🔘 Phương thức thanh toán
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                {[
                  { key: "cash", label: "Thanh toán tiền mặt" },
                  { key: "vnpay", label: "Thanh toán online (VNPay)" },
                ].map((method) => (
                  <Box
                    key={method.key}
                    onClick={() =>
                      setPaymentMethod(method.key as "cash" | "vnpay")
                    }
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor:
                        paymentMethod === method.key ? "#3f51b5" : "#c5cae9",
                      backgroundColor:
                        paymentMethod === method.key
                          ? "#e8eaf6"
                          : "transparent",
                      padding: "10px 16px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        border: "2px solid",
                        borderColor:
                          paymentMethod === method.key ? "#3f51b5" : "#9e9e9e",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          paymentMethod === method.key
                            ? "#3f51b5"
                            : "transparent",
                      }}
                    >
                      {paymentMethod === method.key && (
                        <span style={{ color: "white", fontSize: 14 }}>✓</span>
                      )}
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "#1a237e" }}
                    >
                      {method.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </>
        ) : (
          <Typography>Đang tải thông tin...</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            fontSize: "15px",
          }}
        >
          Hủy bỏ
        </Button>
        {paymentMethod && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (paymentMethod === "cash") {
                onConfirmCheckout();
              } else if (paymentMethod === "vnpay" && checkoutInfo) {
                onVNPayCheckout(checkoutInfo.booking_id);
              }
            }}
            disabled={!checkoutInfo || isPaying}
            sx={{
              ml: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "15px",
              px: 3,
              py: 1.2,
            }}
          >
            {isPaying ? <CircularProgress size={24} /> : "Thanh toán"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CheckoutDialog;