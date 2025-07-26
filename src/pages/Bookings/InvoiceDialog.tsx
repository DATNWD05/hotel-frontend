import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import { toast } from "react-toastify";

interface Invoice {
  invoice_code: string;
  booking_id: number;
  issued_date: string;
  room_amount: string;
  service_amount: string;
  discount_amount: string;
  deposit_amount: string;
  total_amount: string;
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
    deposit_amount: string;
    raw_total: string;
    discount_amount: string;
    total_amount: string;
    created_at: string;
    updated_at: string;
  };
}

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceInfo: Invoice | null;
  invoiceLoading: boolean;
  onPrintInvoice: () => void;
}

const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "N/A";
  return numeral(num).format("0,0") + " VNĐ";
};

const formatDateTime = (date: string) => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error("Invalid date");
    return format(parsedDate, "dd/MM/yyyy HH:mm:ss");
  } catch {
    return "N/A";
  }
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

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({
  open,
  onClose,
  invoiceInfo,
  invoiceLoading,
  onPrintInvoice,
}) => {
  useEffect(() => {
    if (open && !invoiceLoading && !invoiceInfo) {
      toast.error("Không thể tải thông tin hóa đơn");
    }
  }, [open, invoiceLoading, invoiceInfo]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: "25px",
          color: "#0288d1",
          mb: 2,
          textAlign: "center",
        }}
      >
        🧾 HÓA ĐƠN THANH TOÁN
      </DialogTitle>
      <DialogContent dividers sx={{ px: 4, py: 3 }}>
        {invoiceLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              Đang tải thông tin hóa đơn...
            </Typography>
          </Box>
        ) : invoiceInfo ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header thông tin hóa đơn */}
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "2px solid #0288d1",
                backgroundColor: "#e3f2fd",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color: "#0288d1", mb: 1 }}
              >
                {invoiceInfo.invoice_code}
              </Typography>
              <Typography variant="body1" sx={{ color: "#666" }}>
                Ngày xuất: {formatDateTime(invoiceInfo.issued_date)}
              </Typography>
            </Paper>

            {/* Thông tin đặt phòng */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{ color: "#333" }}
              >
                📋 Thông tin đặt phòng
              </Typography>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Mã đặt phòng:</Typography>
                  <Typography>#{invoiceInfo.booking_id}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Trạng thái:</Typography>
                  <Typography
                    sx={{
                      color: getBookingStatus(invoiceInfo.booking.status).color,
                    }}
                  >
                    {getBookingStatus(invoiceInfo.booking.status).status}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Ngày nhận phòng:</Typography>
                  <Typography>
                    {formatDate(invoiceInfo.booking.check_in_date)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Ngày trả phòng:</Typography>
                  <Typography>
                    {formatDate(invoiceInfo.booking.check_out_date)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Thời gian check-in:</Typography>
                  <Typography>
                    {formatDateTime(invoiceInfo.booking.check_in_at)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={600}>Thời gian check-out:</Typography>
                  <Typography>
                    {formatDateTime(invoiceInfo.booking.check_out_at)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Chi tiết thanh toán */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{ color: "#333" }}
              >
                💰 Chi tiết thanh toán
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography fontWeight={600}>Tiền phòng:</Typography>
                  <Typography>
                    {formatCurrency(invoiceInfo.room_amount)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography fontWeight={600}>Tiền dịch vụ:</Typography>
                  <Typography>
                    {formatCurrency(invoiceInfo.service_amount)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography fontWeight={600}>Giảm giá:</Typography>
                  <Typography sx={{ color: "#4caf50" }}>
                    -{formatCurrency(invoiceInfo.discount_amount)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography fontWeight={600}>Tiền đặt cọc:</Typography>
                  <Typography>
                    {formatCurrency(invoiceInfo.deposit_amount)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 2,
                    backgroundColor: "#e3f2fd",
                    px: 2,
                    borderRadius: 2,
                    border: "2px solid #0288d1",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: "#0288d1" }}
                  >
                    TỔNG CỘNG:
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: "#0288d1" }}
                  >
                    {formatCurrency(invoiceInfo.total_amount)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Footer */}
            <Box sx={{ textAlign: "center", mt: 2, color: "#666" }}>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Hóa đơn được tạo tự động bởi hệ thống
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography sx={{ textAlign: "center", py: 4 }}>
            Không thể tải thông tin hóa đơn
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
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
          Đóng
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onPrintInvoice}
          disabled={invoiceLoading}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
            textTransform: "none",
            fontSize: "15px",
          }}
        >
          {invoiceLoading ? <CircularProgress size={24} /> : "🖨️ In hóa đơn"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDialog;