"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Autocomplete,
  Chip,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
} from "@mui/material"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { format, parseISO, isValid } from "date-fns"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded"
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded"
import PaidRoundedIcon from "@mui/icons-material/PaidRounded"
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded"
import HotelRoundedIcon from "@mui/icons-material/HotelRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded"
import BedRoundedIcon from "@mui/icons-material/BedRounded"
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined"
import numeral from "numeral"
import { toast } from "react-toastify"
import api from "../../api/axios"

/** ====== Types ====== */
interface ServiceRow {
  name: string
  price: number
  quantity: number
  subtotal: number
}

interface CheckoutInfo {
  booking_id: number
  status: string
  check_in_date: string
  check_out_date: string
  deposit_amount: number
  total_amount: number
  raw_total: number
  discount_amount: number
  nights: number
  room_total: number
  service_total: number
  check_out_at?: string
  room_details: { room_number: string; base_rate: number; total: number }[]

  // FE-only/Optional
  amenity_total?: number
  amenities_used?: AmenityRow[]
  services_used?: ServiceRow[] // <-- tùy chọn: nếu có sẽ liệt kê chi tiết dịch vụ
}

type AmenityOption = { id: number; name: string; price: number }
type RoomOption = { id: number; label: string }

type AmenityRow = {
  room_id: number
  amenity_id: number
  name: string
  price: number
  quantity: number
  subtotal: number
}

type AmenityPayload = { room_id: number; amenity_id: number; price: number; quantity: number }

interface CheckoutDialogProps {
  open: boolean
  onClose: () => void
  checkoutInfo: CheckoutInfo | null
  paymentMethod: "cash" | "vnpay" | null
  setPaymentMethod: (method: "cash" | "vnpay" | null) => void
  isPaying: boolean
  onConfirmCheckout: (amenitiesUsed?: AmenityPayload[]) => void
  onVNPayCheckout: (bookingId: number, amenitiesUsed?: AmenityPayload[]) => void
}

/** ====== Helpers ====== */
const toVND = (n: number) => `${numeral(n || 0).format("0,0")} VNĐ`
const dt = (s?: string) => {
  try {
    if (!s) return "N/A"
    const d = parseISO(s)
    return isValid(d) ? format(d, "dd/MM/yyyy HH:mm") : "N/A"
  } catch {
    return "N/A"
  }
}
const getStatusView = (status: string) => {
  const k = (status || "").toLowerCase()
  if (k === "pending") return { text: "Chờ xác nhận", color: "#f59e0b" }
  if (k === "confirmed") return { text: "Đã xác nhận", color: "#22c55e" }
  if (k === "checked-in") return { text: "Đã nhận phòng", color: "#0ea5e9" }
  if (k === "checked-out") return { text: "Đã trả phòng", color: "#64748b" }
  if (k === "cancelled") return { text: "Đã hủy", color: "#ef4444" }
  return { text: status || "Không xác định", color: "#64748b" }
}
const clampNonNegative = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const clampPositiveInt = (v: any) => {
  const n = parseInt(`${v}`, 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

/** ====== Component ====== */
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
  // Step 0: Rà soát tiện nghi | Step 1: Chọn phương thức thanh toán
  const [step, setStep] = useState<0 | 1>(0)

  // Theme — gọn & hiện đại
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: { main: "#0ea5e9" },
          secondary: { main: "#22c55e" },
          background: { default: "#f6f8fb", paper: "#ffffff" },
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily: `Inter, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
          h6: { fontWeight: 900, fontSize: 18 },
          button: { textTransform: "none", fontWeight: 800, fontSize: 14 },
          body2: { fontSize: 14 },
        },
        components: {
          MuiPaper: { styleOverrides: { root: { borderRadius: 16, boxShadow: "0 8px 28px rgba(2,6,23,.06)" } } },
          MuiButton: { styleOverrides: { root: { borderRadius: 20 } } },
          MuiChip: { styleOverrides: { root: { borderRadius: 10 } } },
          MuiDialog: { styleOverrides: { paper: { borderRadius: 22 } } },
          MuiTableCell: { styleOverrides: { root: { fontSize: 13 } } },
        },
      }),
    []
  )

  // maps & options
  const [amenityOptionsByRoom, setAmenityOptionsByRoom] = useState<Record<number, AmenityOption[]>>({})
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([])
  const [amenitiesUsed, setAmenitiesUsed] = useState<AmenityRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [savingAmenities, setSavingAmenities] = useState(false)

  // reset bước khi mở/đóng
  useEffect(() => {
    if (open) {
      setStep(0)
      setPaymentMethod(null)
    } else {
      setAmenitiesUsed([])
      setPaymentMethod(null)
      setStep(0)
    }
  }, [open, setPaymentMethod])

  // Load options: /bookings/{id}/amenities-options
  useEffect(() => {
    if (!open || !checkoutInfo?.booking_id) return
    let mounted = true
    const fetchOptions = async () => {
      setLoadingOptions(true)
      try {
        const res = await api.get(`/bookings/${checkoutInfo.booking_id}/amenities-options`)
        const data = res?.data ?? {}
        const rooms = Array.isArray(data.rooms) ? data.rooms : []
        const incurred = Array.isArray(data.incurred) ? data.incurred : []

        const map: Record<number, AmenityOption[]> = {}
        const opts: RoomOption[] = rooms.map((r: any) => {
          map[Number(r.id)] = (r.amenities ?? []).map((a: any) => ({
            id: Number(a.id),
            name: a.name,
            price: clampNonNegative(a.price),
          }))
          return { id: Number(r.id), label: r.room_number }
        })

        if (!mounted) return
        setAmenityOptionsByRoom(map)
        setRoomOptions(opts)

        // Prefill
        const prefillFromIncurred: AmenityRow[] = incurred.flatMap((g: any) =>
          (g.items ?? []).map((x: any) => ({
            room_id: Number(g.room_id),
            amenity_id: Number(x.amenity_id),
            name: x.name,
            price: clampNonNegative(x.price),
            quantity: clampPositiveInt(x.quantity),
            subtotal: clampNonNegative(x.price) * clampPositiveInt(x.quantity),
          }))
        )

        let initialRows: AmenityRow[] = prefillFromIncurred

        if (!initialRows.length && checkoutInfo?.amenities_used?.length) {
          initialRows = checkoutInfo.amenities_used.map((x) => ({
            room_id: x.room_id,
            amenity_id: x.amenity_id,
            name: x.name,
            price: clampNonNegative(x.price),
            quantity: clampPositiveInt(x.quantity),
            subtotal: clampNonNegative(x.price) * clampPositiveInt(x.quantity),
          }))
        }

        if (!initialRows.length && opts[0]) {
          initialRows = [{ room_id: opts[0].id, amenity_id: 0, name: "", price: 0, quantity: 1, subtotal: 0 }]
        }

        setAmenitiesUsed(initialRows)
      } catch (e) {
        console.error("amenities-options error:", e)
        setAmenityOptionsByRoom({})
        setRoomOptions([])
        setAmenitiesUsed([])
        toast.error("Không tải được tiện nghi theo phòng.")
      } finally {
        if (mounted) setLoadingOptions(false)
      }
    }

    fetchOptions()
    return () => {
      mounted = false
    }
  }, [open, checkoutInfo?.booking_id])

  /** Tổng tiện nghi + tổng cuối cùng */
  const amenityTotal = useMemo(
    () => (amenitiesUsed ?? []).reduce((s, a) => s + clampNonNegative(a.subtotal || 0), 0),
    [amenitiesUsed]
  )

  const grandTotal = useMemo(() => {
    if (!checkoutInfo) return 0
    const room = clampNonNegative(checkoutInfo.room_total || 0)
    const service = clampNonNegative(checkoutInfo.service_total || 0)
    const discount = clampNonNegative(checkoutInfo.discount_amount || 0)
    const deposit = clampNonNegative(checkoutInfo.deposit_amount || 0)
    const amenity = clampNonNegative(amenityTotal || 0)
    return Math.max(0, room + service + amenity - discount - deposit)
  }, [checkoutInfo, amenityTotal])

  /** CRUD dòng tiện nghi */
  const addRow = () => {
    const defaultRoomId = roomOptions[0]?.id
    if (!defaultRoomId) return
    setAmenitiesUsed((prev) => [
      ...(prev ?? []),
      { room_id: defaultRoomId, amenity_id: 0, name: "", price: 0, quantity: 1, subtotal: 0 },
    ])
  }

  const removeRow = (i: number) => setAmenitiesUsed((prev) => (prev ?? []).filter((_, idx) => idx !== i))

  const changeRowRoom = (i: number, room_id: number) => {
    setAmenitiesUsed((prev) => {
      const next = [...(prev ?? [])]
      const old = next[i]
      const allowed = amenityOptionsByRoom[room_id] || []
      const stillValid = allowed.some((a) => a.id === old?.amenity_id)
      next[i] = {
        room_id,
        amenity_id: stillValid ? old.amenity_id : 0,
        name: stillValid ? old.name : "",
        price: stillValid ? old.price : 0,
        quantity: clampPositiveInt(old?.quantity ?? 1),
        subtotal: stillValid ? clampNonNegative(old.price) * clampPositiveInt(old.quantity) : 0,
      }
      return next
    })
  }

  const changeAmenity = (i: number, opt: AmenityOption | null) => {
    setAmenitiesUsed((prev) => {
      const next = [...(prev ?? [])]
      const row = next[i]
      if (!row) return next
      if (!opt) {
        next[i] = { ...row, amenity_id: 0, name: "", price: 0, subtotal: 0, quantity: 1 }
      } else {
        const qty = clampPositiveInt(row.quantity ?? 1)
        next[i] = { ...row, amenity_id: opt.id, name: opt.name, price: opt.price, subtotal: opt.price * qty, quantity: qty }
      }
      return next
    })
  }

  const changePrice = (i: number, v: string) => {
    const price = clampNonNegative(v)
    setAmenitiesUsed((prev) => {
      const next = [...(prev ?? [])]
      const row = next[i]
      const qty = clampPositiveInt(row?.quantity ?? 1)
      next[i] = { ...row, price, subtotal: price * qty }
      return next
    })
  }

  const changeQty = (i: number, v: string) => {
    const quantity = clampPositiveInt(v)
    setAmenitiesUsed((prev) => {
      const next = [...(prev ?? [])]
      const row = next[i]
      const price = clampNonNegative(row?.price ?? 0)
      next[i] = { ...row, quantity, subtotal: price * quantity }
      return next
    })
  }

  /** Gộp trước thanh toán */
  const sanitizeAmenities = (rows: AmenityRow[]) => {
    const valid = rows.filter((r) => r.room_id && r.amenity_id && clampPositiveInt(r.quantity) >= 1)
    const map = new Map<string, AmenityRow>()
    valid.forEach((r) => {
      const key = `${r.room_id}-${r.amenity_id}`
      const price = clampNonNegative(r.price)
      const qty = clampPositiveInt(r.quantity)
      const prev = map.get(key)
      if (prev) {
        const newQty = prev.quantity + qty
        map.set(key, { ...prev, quantity: newQty, subtotal: price * newQty, price })
      } else {
        map.set(key, { ...r, price, quantity: qty, subtotal: price * qty })
      }
    })
    return Array.from(map.values())
  }

  const confirmStep = () => {
    if (!roomOptions.length) {
      toast.error("Booking này chưa có phòng để ghi tiện nghi.")
      return
    }
    const cleaned = sanitizeAmenities(amenitiesUsed ?? [])
    setAmenitiesUsed(cleaned)
    setStep(1)
  }

  /** Lưu tiện nghi lên BE */
  const postAmenities = async (payload: AmenityPayload[]) => {
    if (!checkoutInfo?.booking_id) return true
    try {
      setSavingAmenities(true)
      await api.post(`/bookings/${checkoutInfo.booking_id}/amenities-incurred`, { items: payload })
      return true
    } catch (e: any) {
      console.error("save amenities failed:", e)
      toast.error(e?.response?.data?.message || "Lưu tiện nghi phát sinh thất bại.")
      return false
    } finally {
      setSavingAmenities(false)
    }
  }

  /** Thanh toán */
  const payCash = async () => {
    const payload: AmenityPayload[] = (amenitiesUsed ?? [])
      .filter((a) => a.room_id && a.amenity_id && a.quantity > 0)
      .map((a) => ({
        room_id: a.room_id,
        amenity_id: a.amenity_id,
        price: clampNonNegative(a.price),
        quantity: clampPositiveInt(a.quantity),
      }))
    const ok = await postAmenities(payload)
    if (!ok) return
    onConfirmCheckout?.(payload)
  }

  const payVNPay = async () => {
    if (!checkoutInfo) return
    const payload: AmenityPayload[] = (amenitiesUsed ?? [])
      .filter((a) => a.room_id && a.amenity_id && a.quantity > 0)
      .map((a) => ({
        room_id: a.room_id,
        amenity_id: a.amenity_id,
        price: clampNonNegative(a.price),
        quantity: clampPositiveInt(a.quantity),
      }))
    const ok = await postAmenities(payload)
    if (!ok) return
    onVNPayCheckout?.(checkoutInfo.booking_id, payload)
  }

  /** ====== Atoms ====== */
  const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; right?: string }> = ({ icon, title, right }) => (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
      <Box display="flex" alignItems="center" gap={0.75}>
        {icon}
        <Typography variant="subtitle2" fontWeight={900} color="primary">
          {title}
        </Typography>
      </Box>
      {right && <Typography variant="body2" color="text.secondary">{right}</Typography>}
    </Box>
  )

  const MiniStat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 0.75, bgcolor: "#f8f9fb", borderRadius: 1 }}>
      <Box display="flex" alignItems="center" gap={0.75}>
        {icon}
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
      <Typography variant="body2" fontWeight={800}>{value}</Typography>
    </Box>
  )

  const PaymentCard: React.FC<{
    active: boolean
    icon: React.ReactNode
    title: string
    onClick: () => void
    disabled?: boolean
  }> = ({ active, icon, title, onClick, disabled }) => (
    <Paper
      variant="outlined"
      onClick={!disabled ? onClick : undefined}
      sx={{
        p: 1.25,
        borderRadius: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .18s ease",
        borderColor: active ? "primary.main" : "divider",
        boxShadow: active ? "0 0 0 2px rgba(14,165,233,.15) inset" : undefined,
        "&:hover": !disabled ? { transform: "translateY(-1px)", boxShadow: "0 8px 20px rgba(2,6,23,.06)" } : undefined,
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: active ? "primary.main" : "#eef6ff",
            color: active ? "white" : "primary.main",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body1" fontWeight={800}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">Nhấn để chọn</Typography>
        </Box>
      </Box>
    </Paper>
  )

  const CompactTh: React.FC<React.PropsWithChildren<{ align?: "right" | "left" | "center"; sx?: any }>> = ({
    children, align, sx,
  }) => (
    <TableCell align={align} sx={{ py: 0.4, fontWeight: 800, fontSize: 12, ...sx }}>{children}</TableCell>
  )
  const CompactTd: React.FC<
    React.PropsWithChildren<{ align?: "right" | "left" | "center"; colSpan?: number; sx?: any }>
  > = ({ children, align, colSpan, sx }) => (
    <TableCell align={align} colSpan={colSpan} sx={{ py: 0.35, fontSize: 12, ...sx }}>{children}</TableCell>
  )
  const CompactSummaryRow: React.FC<{ label: string; value: string; strong?: boolean; highlight?: boolean }> = ({
    label, value, strong, highlight,
  }) => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      sx={{ py: 0.25, ...(highlight && { bgcolor: "primary.main", color: "white", px: 1, borderRadius: 1, my: 0.25 }) }}
    >
      <Typography variant="body2" sx={{ fontSize: strong ? 13 : 12, fontWeight: strong ? 800 : 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontSize: strong ? 13 : 12, fontWeight: strong ? 900 : 700 }}>{value}</Typography>
    </Box>
  )

  /** ====== Right column ====== */
  const RightSummary = (
    <Box sx={{ position: { md: "sticky" }, top: 12 }}>
      {/* Header: chip + mini stats */}
      <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, mb: 1 }}>
        <Box display="flex" gap={0.75} flexWrap="wrap" mb={1}>
          <Chip label={`#${checkoutInfo?.booking_id ?? "-"}`} size="small" color="primary" variant="outlined" />
          {checkoutInfo && (
            <>
              <Chip
                label={`${dt(checkoutInfo.check_in_date).split(" ")[0]} → ${dt(checkoutInfo.check_out_date).split(" ")[0]}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={getStatusView(checkoutInfo.status).text}
                size="small"
                sx={{
                  borderColor: getStatusView(checkoutInfo.status).color,
                  color: getStatusView(checkoutInfo.status).color,
                  fontWeight: 700,
                }}
                variant="outlined"
              />
            </>
          )}
        </Box>

        <Grid container spacing={1}>
          <Grid item xs={12} sm={4}>
            <MiniStat icon={<HotelRoundedIcon fontSize="small" />} label="Tiền phòng" value={toVND(Number(checkoutInfo?.room_total || 0))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MiniStat icon={<RestaurantRoundedIcon fontSize="small" />} label="Dịch vụ" value={toVND(Number(checkoutInfo?.service_total || 0))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MiniStat icon={<AddShoppingCartRoundedIcon fontSize="small" />} label="Tiện nghi" value={toVND(amenityTotal)} />
          </Grid>
        </Grid>
      </Paper>

      {/* Chi tiết phòng */}
      <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={900} color="primary" mb={0.75}>🛏️ Chi tiết phòng</Typography>
        <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.4, px: 0.6 }, tableLayout: "fixed" }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <CompactTh>Phòng</CompactTh>
              <CompactTh align="right">Đơn giá/đêm</CompactTh>
              <CompactTh align="right">Thành tiền</CompactTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {checkoutInfo?.room_details.map((r, i) => (
              <TableRow key={i} hover>
                <CompactTd><strong>{r.room_number}</strong></CompactTd>
                <CompactTd align="right">{toVND(Number(r.base_rate || 0))}</CompactTd>
                <CompactTd align="right">{toVND(Number(r.total || 0))}</CompactTd>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: "#f8f9fa" }}>
              <CompactTd><strong>Tổng tiền phòng</strong></CompactTd>
              <CompactTd />
              <CompactTd align="right"><strong>{toVND(Number(checkoutInfo?.room_total || 0))}</strong></CompactTd>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      {/* Tóm tắt (thêm thời gian) */}
      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc" }}>
        <Typography variant="subtitle2" fontWeight={900} color="primary" mb={0.5}>💳 Tóm tắt thanh toán</Typography>

        <Box sx={{ mb: 0.75 }}>
          <CompactSummaryRow label="Nhận phòng" value={dt(checkoutInfo?.check_in_date)} />
          <CompactSummaryRow label="Trả phòng" value={dt(checkoutInfo?.check_out_date)} />
          <Divider sx={{ my: 0.75 }} />
        </Box>

        <Box sx={{ "& > *": { py: 0.25 } }}>
          <CompactSummaryRow label="Phòng + Dịch vụ" value={toVND(Number(checkoutInfo?.raw_total || 0))} />
          <CompactSummaryRow label="Tiện nghi" value={toVND(amenityTotal)} />
          <CompactSummaryRow label="Giảm giá" value={`- ${toVND(Number(checkoutInfo?.discount_amount || 0))}`} />
          <CompactSummaryRow label="Đặt cọc" value={`- ${toVND(Number(checkoutInfo?.deposit_amount || 0))}`} />
          <Divider sx={{ my: 0.75 }} />
          <CompactSummaryRow label="TỔNG CẦN THANH TOÁN" value={toVND(grandTotal)} strong highlight />
        </Box>
      </Paper>
    </Box>
  )

  /** ====== Render ====== */
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={false}
        PaperProps={{ sx: { width: "1360px", maxWidth: "98vw", height: "90vh", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: 18, py: 1.25, px: 2 }}>
          {step === 0 ? "💸 Thanh toán & Trả phòng" : "🔘 Chọn phương thức thanh toán"}
        </DialogTitle>

        <DialogContent
          sx={{
            p: 1.5,
            maxHeight: "85vh",
            overflow: "auto",
            bgcolor: "#f7f7fb",
            backgroundImage: "linear-gradient(180deg, #fafafa 0%, #f6f8fb 100%)",
          }}
        >
          <Grid container spacing={1.25}>
            {/* Cột trái */}
            <Grid item xs={12} md={7}>
              <Box display="grid" gap={1}>
                {/* Steps nhỏ gọn */}
                <Paper variant="outlined" sx={{ p: 0.75, borderRadius: 2 }}>
                  <List dense sx={{ p: 0, m: 0 }}>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon><Inventory2RoundedIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primaryTypographyProps={{ fontWeight: 700 }} primary="Rà soát tiện nghi" />
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon><TaskAltRoundedIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primaryTypographyProps={{ fontWeight: 700 }} primary="Chọn phương thức" />
                    </ListItem>
                  </List>
                </Paper>

                {/* Dịch vụ đã dùng — ở TRÊN tiện nghi */}
                <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                  <SectionTitle icon={<RestaurantRoundedIcon />} title="🍽️ Dịch vụ đã dùng" />
                  <Table
                    size="small"
                    sx={{
                      "& .MuiTableCell-root": { py: 0.4, px: 0.55 },
                      tableLayout: "fixed",
                      "& th, & td": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <CompactTh>Dịch vụ</CompactTh>
                        <CompactTh align="right" sx={{ width: 100 }}>Đơn giá</CompactTh>
                        <CompactTh align="right" sx={{ width: 70 }}>SL</CompactTh>
                        <CompactTh align="right" sx={{ width: 120 }}>Thành tiền</CompactTh>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(checkoutInfo?.services_used?.length ?? 0) > 0 ? (
                        checkoutInfo!.services_used!.map((s, i) => (
                          <TableRow key={i}>
                            <CompactTd>{s.name}</CompactTd>
                            <CompactTd align="right">{toVND(clampNonNegative(s.price))}</CompactTd>
                            <CompactTd align="right">{clampPositiveInt(s.quantity)}</CompactTd>
                            <CompactTd align="right">{toVND(clampNonNegative(s.subtotal))}</CompactTd>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <CompactTd colSpan={4} align="center" sx={{ color: "text.secondary" }}>
                            Không có dịch vụ hoặc chưa đồng bộ chi tiết. Tổng dịch vụ: <strong style={{ marginLeft: 4 }}>{toVND(Number(checkoutInfo?.service_total || 0))}</strong>
                          </CompactTd>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>

                {/* Tiện nghi phát sinh */}
                <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
                    <Typography variant="subtitle2" fontWeight={900} color="primary">
                      🏨 Tiện nghi phát sinh
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addRow}
                      variant="contained"
                      disabled={roomOptions.length === 0 || loadingOptions}
                      sx={{ borderRadius: 20, fontWeight: 800, px: 1.25 }}
                    >
                      Thêm
                    </Button>
                  </Box>

                  <Table
                    size="small"
                    sx={{
                      "& .MuiTableCell-root": { py: 0.4, px: 0.55 },
                      tableLayout: "fixed",
                      "& th, & td": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <CompactTh sx={{ width: 150 }}>Phòng</CompactTh>
                        <CompactTh>Tiện nghi</CompactTh>
                        <CompactTh align="right" sx={{ width: 90 }}>Giá</CompactTh>
                        <CompactTh align="right" sx={{ width: 70 }}>SL</CompactTh>
                        <CompactTh align="right" sx={{ width: 110 }}>Tiền</CompactTh>
                        <CompactTh align="center" sx={{ width: 46 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(amenitiesUsed?.length ?? 0) === 0 && (
                        <TableRow>
                          <CompactTd colSpan={6} align="center" sx={{ color: "text.secondary", py: 1.5 }}>
                            {loadingOptions ? "Đang tải dữ liệu..." : "Chưa có tiện nghi"}
                          </CompactTd>
                        </TableRow>
                      )}

                      {amenitiesUsed?.map((row, idx) => {
                        const roomAllowed = amenityOptionsByRoom[row.room_id] ?? []
                        return (
                          <TableRow key={idx} hover>
                            <CompactTd>
                              {roomOptions.length > 1 ? (
                                <FormControl size="small" fullWidth>
                                  <InputLabel>Phòng</InputLabel>
                                  <Select
                                    label="Phòng"
                                    value={row.room_id || ""}
                                    onChange={(e) => changeRowRoom(idx, Number(e.target.value))}
                                  >
                                    {roomOptions.map((r) => (
                                      <MenuItem key={r.id} value={r.id}>
                                        {r.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Chip label={roomOptions[0]?.label ?? "-"} size="small" />
                              )}
                            </CompactTd>

                            <CompactTd>
                              <Autocomplete
                                options={roomAllowed}
                                getOptionLabel={(o) => o.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={row.amenity_id ? roomAllowed.find((a) => a.id === row.amenity_id) ?? null : null}
                                onChange={(_, opt) => changeAmenity(idx, opt)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Chọn..."
                                    size="small"
                                    sx={{ "& .MuiInputBase-input": { fontSize: 12 } }}
                                  />
                                )}
                                size="small"
                                disabled={!row.room_id || loadingOptions}
                                noOptionsText={loadingOptions ? "Đang tải..." : "Phòng này chưa có tiện nghi."}
                              />
                            </CompactTd>

                            <CompactTd align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0, style: { fontSize: 12, textAlign: "right" } }}
                                value={row.price}
                                onChange={(e) => changePrice(idx, e.target.value)}
                                sx={{ width: 90 }}
                              />
                            </CompactTd>

                            <CompactTd align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 1, style: { fontSize: 12, textAlign: "right" } }}
                                value={row.quantity}
                                onChange={(e) => changeQty(idx, e.target.value)}
                                sx={{ width: 70 }}
                              />
                            </CompactTd>

                            <CompactTd align="right" sx={{ fontWeight: 700 }}>
                              {toVND(Number(row.subtotal || 0))}
                            </CompactTd>

                            <CompactTd align="center">
                              <IconButton size="small" onClick={() => removeRow(idx)} sx={{ p: 0.5 }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </CompactTd>
                          </TableRow>
                        )
                      })}

                      <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                        <CompactTd colSpan={4}><strong>Tạm tính tiện nghi</strong></CompactTd>
                        <CompactTd align="right"><strong>{toVND(amenityTotal)}</strong></CompactTd>
                        <CompactTd />
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                {/* Chọn phương thức (bước 2) */}
                {step === 1 && (
                  <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                    <SectionTitle icon={<MonetizationOnOutlinedIcon />} title="Chọn phương thức thanh toán" />
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <PaymentCard
                          active={paymentMethod === "cash"}
                          icon={<PaidRoundedIcon />}
                          title="Tiền mặt"
                          onClick={() => setPaymentMethod("cash")}
                          disabled={isPaying || savingAmenities}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <PaymentCard
                          active={paymentMethod === "vnpay"}
                          icon={<QrCode2RoundedIcon />}
                          title="VNPay"
                          onClick={() => setPaymentMethod("vnpay")}
                          disabled={isPaying || savingAmenities}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
            </Grid>

            {/* Cột phải */}
            <Grid item xs={12} md={5}>
              {RightSummary}
            </Grid>
          </Grid>
        </DialogContent>

        {/* === Footer: các nút cạnh nhau ở GÓC DƯỚI (Đóng + Xác nhận) === */}
        <DialogActions sx={{ px: 2, py: 1.25 }}>
          <Box flex={1} /> {/* đẩy nút sang phải */}
          {step === 0 ? (
            <>
              <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700, borderRadius: 20 }}>
                Đóng
              </Button>
              <Button
                variant="contained"
                onClick={confirmStep}
                disabled={loadingOptions}
                sx={{ borderRadius: 20, fontWeight: 900 }}
                endIcon={<TaskAltRoundedIcon />}
              >
                Xác nhận & tiếp tục
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700, borderRadius: 20 }}>
                Đóng
              </Button>
              <Button
                onClick={() => setStep(0)}
                color="inherit"
                sx={{ borderRadius: 20, fontWeight: 700 }}
                disabled={isPaying || savingAmenities}
              >
                Quay lại
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!paymentMethod) {
                    toast.error("Vui lòng chọn phương thức thanh toán")
                    return
                  }
                  const payload: AmenityPayload[] = (amenitiesUsed ?? [])
                    .filter((a) => a.room_id && a.amenity_id && a.quantity > 0)
                    .map((a) => ({
                      room_id: a.room_id,
                      amenity_id: a.amenity_id,
                      price: clampNonNegative(a.price),
                      quantity: clampPositiveInt(a.quantity),
                    }))
                  const ok = await postAmenities(payload)
                  if (!ok) return
                  if (paymentMethod === "cash") await payCash()
                  else await payVNPay()
                }}
                disabled={isPaying || savingAmenities}
                sx={{ borderRadius: 20, fontWeight: 900 }}
              >
                {savingAmenities ? "Đang lưu..." : "Xác nhận thanh toán"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  )
}

export default CheckoutDialog
