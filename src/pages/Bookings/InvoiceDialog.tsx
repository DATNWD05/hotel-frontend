import React, { useEffect, useMemo } from "react";
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
  Stack,
} from "@mui/material";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import { toast } from "react-toastify";

/* ===== Numeral locale VN ===== */
numeral.register("locale", "vi", {
  delimiters: { thousands: ".", decimal: "," },
  abbreviations: {
    thousand: "k",
    million: "tr",
    billion: "tỷ",
    trillion: "ng",
  },
  ordinal: () => "º",
  currency: { symbol: "đ" },
});
numeral.locale("vi");

/* ===== Types ===== */
interface LegacyInvoice {
  invoice_code: string;
  booking_id: number | string;
  issued_date: string;
  booking?: {
    status?: string;
    check_in_date?: string;
    check_out_date?: string;
    // Nếu API cũ có trả customer thì để optional:
    customer?: { name?: string; email?: string; phone?: string };
  };
  room_amount: number;
  service_amount: number;
  amenity_amount?: number;
  discount_amount: number;
  deposit_amount: number;
  total_amount: number;
}

type LineBase = { total: number };
type ServiceLine = LineBase & {
  quantity: number;
  price: number;
  service_id: number;
  name: string;
};
type AmenityLine = LineBase & {
  quantity: number;
  price: number;
  amenity_id: number;
  amenity_name: string;
  room_number?: string | number;
};

interface InvoicePayload {
  invoice: { invoice_code: string; issued_date: string | null };
  booking: {
    id: number | string;
    status: string;
    customer?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      cccd?: string | null;
      address?: string | null;
    };
  };
  meta: {
    is_hourly: number;
    duration_value: number;
    formatted_issued?: string | null;
    formatted_checkin?: string | null;
    formatted_checkout?: string | null;
  };
  totals: {
    saved: {
      room_amount: number;
      service_amount: number;
      amenity_amount: number;
      discount_amount: number;
      deposit_amount: number;
      final_amount: number;
    };
  };
  service_lines?: ServiceLine[];
  amenity_lines?: AmenityLine[];
}

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceInfo: LegacyInvoice | InvoicePayload | null;
  invoiceLoading: boolean;
  onPrintInvoice: () => void;
}

/* ===== Helpers ===== */
const isPayload = (x: any): x is InvoicePayload =>
  !!x &&
  typeof x === "object" &&
  "invoice" in x &&
  "meta" in x &&
  "totals" in x;

const formatCurrency = (value?: string | number | null): string => {
  const n = Number(value);
  if (!isFinite(n)) return "0 đ";
  return `${numeral(Math.abs(n)).format("0,0")} đ`;
};

const safeFormatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = parseISO(value);
  if (isValid(parsed)) return format(parsed, "dd/MM/yyyy HH:mm:ss");
  return value;
};
const safeFormatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = parseISO(value);
  if (isValid(parsed)) return format(parsed, "dd/MM/yyyy");
  return value;
};

const getBookingStatus = (
  status: string
): { status: string; color: string } => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return { status: "Chờ xác nhận", color: "#FFA500" };
    case "confirmed":
      return { status: "Đã xác nhận", color: "#388E3C" };
    case "checked-in":
      return { status: "Đã nhận phòng", color: "#1A73E8" };
    case "checked-out":
      return { status: "Đã trả phòng", color: "#757575" };
    case "canceled":
    case "cancelled":
      return { status: "Đã hủy", color: "#D32F2F" };
    default:
      return { status: "Không xác định", color: "#757575" };
  }
};

type ViewModel = {
  code: string;
  bookingId: number | string;
  issuedAt: string;
  statusText: { status: string; color: string };
  checkIn: string;
  checkOut: string;
  isHourly: boolean;
  durationText: string;
  customer: { name: string; email: string; phone: string };
  amounts: {
    room: number | string;
    service: number | string;
    amenity: number | string;
    discount: number | string;
    deposit: number | string;
    total: number | string;
  };
  services: ServiceLine[];
  amenities: AmenityLine[];
};

/* ===== Component ===== */
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

  const vm: ViewModel | null = useMemo(() => {
    if (!invoiceInfo) return null;

    if (isPayload(invoiceInfo)) {
      const saved = invoiceInfo.totals.saved;
      const isHourly = invoiceInfo.meta.is_hourly === 1;
      const durationText = isHourly
        ? `Theo giờ (${invoiceInfo.meta.duration_value} giờ)`
        : `Theo ngày (${invoiceInfo.meta.duration_value} đêm)`;

      return {
        code: invoiceInfo.invoice.invoice_code,
        bookingId: invoiceInfo.booking.id,
        issuedAt:
          invoiceInfo.meta.formatted_issued ??
          safeFormatDateTime(invoiceInfo.invoice.issued_date || undefined),
        statusText: getBookingStatus(invoiceInfo.booking.status),
        checkIn: invoiceInfo.meta.formatted_checkin || "N/A",
        checkOut: invoiceInfo.meta.formatted_checkout || "N/A",
        isHourly,
        durationText,
        customer: {
          name: invoiceInfo.booking.customer?.name ?? "N/A",
          email: invoiceInfo.booking.customer?.email ?? "N/A",
          phone: invoiceInfo.booking.customer?.phone ?? "N/A",
        },
        amounts: {
          room: saved.room_amount,
          service: saved.service_amount,
          amenity: saved.amenity_amount,
          discount: saved.discount_amount,
          deposit: saved.deposit_amount,
          total: saved.final_amount,
        },
        services: invoiceInfo.service_lines ?? [],
        amenities: invoiceInfo.amenity_lines ?? [],
      };
    }

    // Legacy
    const legacy = invoiceInfo as LegacyInvoice;
    return {
      code: legacy.invoice_code,
      bookingId: legacy.booking_id,
      issuedAt: safeFormatDateTime(legacy.issued_date),
      statusText: getBookingStatus(legacy.booking?.status || ""),
      checkIn: safeFormatDate(legacy.booking?.check_in_date),
      checkOut: safeFormatDate(legacy.booking?.check_out_date),
      isHourly: false,
      durationText: "",
      customer: {
        name: legacy.booking?.customer?.name ?? "N/A",
        email: legacy.booking?.customer?.email ?? "N/A",
        phone: legacy.booking?.customer?.phone ?? "N/A",
      },
      amounts: {
        room: legacy.room_amount,
        service: legacy.service_amount,
        amenity: legacy.amenity_amount ?? 0,
        discount: legacy.discount_amount,
        deposit: legacy.deposit_amount,
        total: legacy.total_amount,
      },
      services: [],
      amenities: [],
    };
  }, [invoiceInfo]);

  const discountText = useMemo(() => {
    const n = Number(vm?.amounts.discount ?? 0);
    return n > 0 ? `-${formatCurrency(n)}` : formatCurrency(0);
  }, [vm?.amounts.discount]);

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
        ) : vm ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
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
                {vm.code}
              </Typography>
              <Typography variant="body1" sx={{ color: "#666" }}>
                Ngày xuất: {vm.issuedAt}
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
                <InfoRow label="Mã đặt phòng" value={`#${vm.bookingId}`} />
                <InfoRow
                  label="Trạng thái"
                  value={vm.statusText.status}
                  valueColor={vm.statusText.color}
                />
                <InfoRow label="Check-in" value={vm.checkIn} />
                <InfoRow label="Check-out" value={vm.checkOut} />
                {vm.durationText && (
                  <InfoRow label="Hình thức tính" value={vm.durationText} />
                )}
              </Box>
            </Paper>

            {/* KHÁCH HÀNG */}
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
                👤 Khách hàng
              </Typography>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}
              >
                <InfoRow label="Tên" value={vm.customer.name} />
                <InfoRow label="SĐT" value={vm.customer.phone} />
                <InfoRow label="Email" value={vm.customer.email} />
              </Box>
            </Paper>

            {/* Dịch vụ đã sử dụng */}
            {vm.services.length > 0 && (
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
                  🧾 Dịch vụ đã sử dụng
                </Typography>
                <Stack spacing={1}>
                  {vm.services.map((s) => (
                    <Line
                      key={`srv-${s.service_id}`}
                      left={`${s.name} × ${s.quantity}`}
                      right={`${formatCurrency(s.price)} × ${
                        s.quantity
                      } = ${formatCurrency(s.total)}`}
                    />
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Tiện nghi phát sinh */}
            {vm.amenities.length > 0 && (
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
                  🧺 Tiện nghi phát sinh
                </Typography>
                <Stack spacing={1}>
                  {vm.amenities.map((a, idx) => (
                    <Line
                      key={`amen-${a.amenity_id}-${idx}`}
                      left={`${a.amenity_name}${
                        a.room_number ? ` (Phòng ${a.room_number})` : ""
                      } × ${a.quantity}`}
                      right={`${formatCurrency(a.price)} × ${
                        a.quantity
                      } = ${formatCurrency(a.total)}`}
                    />
                  ))}
                </Stack>
              </Paper>
            )}

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
                <Row
                  label="Tiền phòng"
                  value={formatCurrency(vm.amounts.room)}
                />
                <Row
                  label="Tiền dịch vụ"
                  value={formatCurrency(vm.amounts.service)}
                />
                <Row
                  label="Tiền tiện nghi"
                  value={formatCurrency(vm.amounts.amenity)}
                />
                <Row
                  label="Giảm giá"
                  value={
                    Number(vm.amounts.discount) > 0
                      ? `-${formatCurrency(vm.amounts.discount)}`
                      : formatCurrency(0)
                  }
                  mutedColor="#4caf50"
                />
                <Row
                  label="Tiền đặt cọc"
                  value={formatCurrency(vm.amounts.deposit)}
                />

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
                    {formatCurrency(vm.amounts.total)}
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

/* ---- UI helpers ---- */
const InfoRow = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography fontWeight={600}>{label}:</Typography>
    <Typography sx={{ color: valueColor }}>{value}</Typography>
  </Box>
);
const Line = ({ left, right }: { left: string; right: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography>{left}</Typography>
    <Typography>{right}</Typography>
  </Box>
);
const Row = ({
  label,
  value,
  mutedColor,
}: {
  label: string;
  value: string;
  mutedColor?: string;
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      py: 1,
      borderBottom: "1px solid #eee",
    }}
  >
    <Typography fontWeight={600}>{label}:</Typography>
    <Typography sx={{ color: mutedColor }}>{value}</Typography>
  </Box>
);

export default InvoiceDialog;
