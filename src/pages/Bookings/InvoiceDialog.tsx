/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Chip,
  GlobalStyles,
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
export type ServiceLine = LineBase & {
  quantity: number;
  price: number;
  service_id: number;
  name: string;
};
export type AmenityLine = LineBase & {
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

type StatusColor = "default" | "warning" | "success" | "info" | "error";
type StatusChip = { label: string; color: StatusColor };
const getStatusChip = (status: string): StatusChip => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return { label: "Chờ xác nhận", color: "warning" };
    case "confirmed":
      return { label: "Đã xác nhận", color: "success" };
    case "checked-in":
      return { label: "Đã nhận phòng", color: "info" };
    case "checked-out":
      return { label: "Đã trả phòng", color: "default" };
    case "canceled":
    case "cancelled":
      return { label: "Đã hủy", color: "error" };
    default:
      return { label: "Không xác định", color: "default" };
  }
};

type ViewModel = {
  code: string;
  bookingId: number | string;
  issuedAt: string;
  statusChip: StatusChip;
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

/* ===== Small UI pieces ===== */
const SectionCard: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: "1px solid #e0e0e0",
      backgroundColor: "#fafafa",
    }}
  >
    <Typography variant="h6" fontWeight={800} sx={{ color: "#333", mb: 1 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const KVRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
    <Typography fontWeight={700}>{label}:</Typography>
    <Typography sx={{ textAlign: "right", wordBreak: "break-word" }}>
      {value}
    </Typography>
  </Box>
);

const MoneyRow = ({
  label,
  value,
  isDiscount = false,
}: {
  label: string;
  value: string;
  isDiscount?: boolean;
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      py: 1,
      borderBottom: "1px solid #eee",
    }}
  >
    <Typography fontWeight={700}>{label}:</Typography>
    <Typography
      sx={{
        fontWeight: 600,
        color: isDiscount ? "#4caf50" : "inherit",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </Typography>
  </Box>
);

/** Grid 4 cột: Tên | SL | Đơn giá | Thành tiền */
const ServiceGrid: React.FC<{ items: ServiceLine[] }> = ({ items }) => {
  const cols = { xs: "1.6fr .6fr 1fr 1.2fr", sm: "2fr .6fr 1fr 1.2fr" };
  return (
    <Box sx={{ px: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: cols,
          gap: 1.5,
          alignItems: "center",
          mb: 0.5,
          color: "#555",
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        <Typography variant="body2">Tên dịch vụ</Typography>
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          SL
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          Đơn giá
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          Thành tiền
        </Typography>
      </Box>

      {/* Rows */}
      {items.map((s, idx) => (
        <React.Fragment key={`srv-${s.service_id}-${idx}`}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: cols,
              gap: 1.5,
              alignItems: "center",
              py: 0.75,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              {s.name}
            </Typography>
            <Typography sx={{ textAlign: "right" }}>{s.quantity}</Typography>
            <Typography sx={{ textAlign: "right" }}>
              {formatCurrency(s.price)}
            </Typography>
            <Typography sx={{ textAlign: "right", fontWeight: 700 }}>
              {formatCurrency(s.total)}
            </Typography>
          </Box>
          {idx < items.length - 1 && <Divider sx={{ my: 0.5 }} />}
        </React.Fragment>
      ))}
    </Box>
  );
};

/** Grid 5 cột: Tên | Phòng | SL | Đơn giá | Thành tiền (nếu có room_number) */
const AmenityGrid: React.FC<{ items: AmenityLine[] }> = ({ items }) => {
  const hasRoom = items.some((i) => i.room_number);
  const cols = hasRoom
    ? { xs: "1.3fr .7fr .5fr 1fr 1.2fr", sm: "1.6fr .7fr .5fr 1fr 1.2fr" }
    : { xs: "1.8fr .6fr 1fr 1.2fr", sm: "2fr .6fr 1fr 1.2fr" };

  return (
    <Box sx={{ px: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: cols,
          gap: 1.5,
          alignItems: "center",
          mb: 0.5,
          color: "#555",
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        <Typography variant="body2">Tên tiện nghi</Typography>
        {hasRoom && (
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Phòng
          </Typography>
        )}
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          SL
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          Đơn giá
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          Thành tiền
        </Typography>
      </Box>

      {/* Rows */}
      {items.map((a, idx) => (
        <React.Fragment key={`amen-${a.amenity_id}-${idx}`}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: cols,
              gap: 1.5,
              alignItems: "center",
              py: 0.75,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              {a.amenity_name}
            </Typography>
            {hasRoom && (
              <Typography sx={{ textAlign: "center" }}>
                {a.room_number ?? "-"}
              </Typography>
            )}
            <Typography sx={{ textAlign: "right" }}>{a.quantity}</Typography>
            <Typography sx={{ textAlign: "right" }}>
              {formatCurrency(a.price)}
            </Typography>
            <Typography sx={{ textAlign: "right", fontWeight: 700 }}>
              {formatCurrency(a.total)}
            </Typography>
          </Box>
          {idx < items.length - 1 && <Divider sx={{ my: 0.5 }} />}
        </React.Fragment>
      ))}
    </Box>
  );
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
        statusChip: getStatusChip(invoiceInfo.booking.status),
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
      statusChip: getStatusChip(legacy.booking?.status || ""),
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
      {/* Print & small global tweaks without external CSS */}
      <GlobalStyles
        styles={{
          "@media print": {
            "@page": { size: "A4", margin: "12mm" },
            ".MuiDialogActions-root, .no-print": { display: "none !important" },
            ".MuiDialog-paper": {
              boxShadow: "none !important",
              border: "none !important",
              maxWidth: "100% !important",
              width: "100% !important",
            },
            body: {
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
              background: "#fff !important",
            },
          },
        }}
      />

      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: 25,
          color: "#0288d1",
          mb: 1,
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
              elevation={0}
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
                fontWeight={800}
                sx={{ color: "#0288d1", mb: 0.5 }}
              >
                {vm.code}
              </Typography>
              <Typography variant="body1" sx={{ color: "#666" }}>
                Ngày xuất: <b>{vm.issuedAt}</b>
              </Typography>
            </Paper>

            {/* Thông tin đặt phòng */}
            <SectionCard title="📋 Thông tin đặt phòng">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <KVRow label="Mã đặt phòng" value={`#${vm.bookingId}`} />
                <KVRow
                  label="Trạng thái"
                  value={
                    <Chip
                      size="small"
                      label={vm.statusChip.label}
                      color={vm.statusChip.color}
                      variant={
                        vm.statusChip.color === "default"
                          ? "outlined"
                          : "filled"
                      }
                    />
                  }
                />
                <KVRow label="Check-in" value={vm.checkIn} />
                <KVRow label="Check-out" value={vm.checkOut} />
                {vm.durationText && (
                  <KVRow label="Hình thức tính" value={vm.durationText} />
                )}
              </Box>
            </SectionCard>

            {/* Khách hàng */}
            <SectionCard title="👤 Khách hàng">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <KVRow label="Tên" value={vm.customer.name} />
                <KVRow label="SĐT" value={vm.customer.phone} />
                <KVRow label="Email" value={vm.customer.email} />
              </Box>
            </SectionCard>

            {/* Dịch vụ đã sử dụng */}
            {vm.services.length > 0 && (
              <SectionCard title="🧾 Dịch vụ đã sử dụng">
                <ServiceGrid items={vm.services} />
              </SectionCard>
            )}

            {/* Tiện nghi phát sinh */}
            {vm.amenities.length > 0 && (
              <SectionCard title="🧺 Tiện nghi phát sinh">
                <AmenityGrid items={vm.amenities} />
              </SectionCard>
            )}

            {/* Chi tiết thanh toán */}
            <SectionCard title="💰 Chi tiết thanh toán">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <MoneyRow
                  label="Tiền phòng"
                  value={formatCurrency(vm.amounts.room)}
                />
                <MoneyRow
                  label="Tiền dịch vụ"
                  value={formatCurrency(vm.amounts.service)}
                />
                <MoneyRow
                  label="Tiền tiện nghi"
                  value={formatCurrency(vm.amounts.amenity)}
                />
                <MoneyRow label="Giảm giá" value={discountText} isDiscount />
                <MoneyRow
                  label="Tiền đặt cọc"
                  value={formatCurrency(vm.amounts.deposit)}
                />

                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.25,
                    backgroundColor: "#e3f2fd",
                    px: 2,
                    borderRadius: 2,
                    border: "2px solid #0288d1",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ color: "#0288d1" }}
                  >
                    TỔNG CỘNG:
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ color: "#0288d1" }}
                  >
                    {formatCurrency(vm.amounts.total)}
                  </Typography>
                </Box>
              </Box>
            </SectionCard>

            {/* Footer */}
            <Box sx={{ textAlign: "center", mt: 1, color: "#666" }}>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
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
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            fontSize: 15,
          }}
        >
          Đóng
        </Button>
        <Button
          className="no-print"
          variant="contained"
          color="primary"
          onClick={onPrintInvoice}
          disabled={invoiceLoading}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 800,
            textTransform: "none",
            fontSize: 15,
          }}
        >
          {invoiceLoading ? <CircularProgress size={24} /> : "🖨️ In hóa đơn"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDialog;
