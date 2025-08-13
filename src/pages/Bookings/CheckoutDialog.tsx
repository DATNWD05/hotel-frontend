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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material"
import { format, parseISO, isValid } from "date-fns"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import LocalAtmIcon from "@mui/icons-material/LocalAtm"
import QrCode2Icon from "@mui/icons-material/QrCode2"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import numeral from "numeral"
import { toast } from "react-toastify"
import api from "../../api/axios"

/** ====== Types (giữ nguyên) ====== */
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

  // FE-only
  amenity_total?: number
  amenities_used?: AmenityRow[]
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

/** ====== Helpers (giữ nguyên chức năng) ====== */
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
  if (k === "pending") return { text: "Chờ xác nhận", color: "#FB8C00" }
  if (k === "confirmed") return { text: "Đã xác nhận", color: "#2E7D32" }
  if (k === "checked-in") return { text: "Đã nhận phòng", color: "#1565C0" }
  if (k === "checked-out") return { text: "Đã trả phòng", color: "#616161" }
  if (k === "cancelled") return { text: "Đã hủy", color: "#C62828" }
  return { text: status || "Không xác định", color: "#757575" }
}
const clampNonNegative = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const clampPositiveInt = (v: any) => {
  const n = parseInt(`${v}`, 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

/** ====== Component (UI khác hẳn – NeoGlass Wizard) ====== */
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

  // Load options từ BE: /bookings/{id}/amenities-options
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

        if (!initialRows.length && checkoutInfo.amenities_used?.length) {
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
          initialRows = [
            { room_id: opts[0].id, amenity_id: 0, name: "", price: 0, quantity: 1, subtotal: 0 },
          ]
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

  /** Thao tác dòng tiện nghi */
  const addRow = () => {
    const defaultRoomId = roomOptions[0]?.id
    if (!defaultRoomId) return
    setAmenitiesUsed((prev) => [
      ...(prev ?? []),
      { room_id: defaultRoomId, amenity_id: 0, name: "", price: 0, quantity: 1, subtotal: 0 },
    ])
  }

  const removeRow = (i: number) =>
    setAmenitiesUsed((prev) => (prev ?? []).filter((_, idx) => idx !== i))

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

  /** Gộp theo (room_id, amenity_id) trước khi thanh toán */
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

  /** Lưu tiện nghi phát sinh lên BE mới */
  const postAmenities = async (payload: AmenityPayload[]) => {
    if (!checkoutInfo?.booking_id) return true
    try {
      setSavingAmenities(true)
      await api.post(`/bookings/${checkoutInfo.booking_id}/amenities-incurred`, {
        items: payload,
      })
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

  /** ====== HEADER – hero glass bar ====== */
  const header = (
    <Box
      sx={{
        mb: 1.25,
        p: 1.25,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.12) 100%)",
        border: "1px solid rgba(108,117,125,0.15)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 2,
        backdropFilter: "blur(8px)",
      }}
    >
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
        <Chip label={`#${checkoutInfo?.booking_id ?? "-"}`} size="small" color="primary" variant="filled" />
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
      <Box textAlign="right">
        <Typography variant="caption" color="text.secondary" display="block">
          Tổng thanh toán dự kiến
        </Typography>
        <Typography variant="h5" fontWeight={900} color="primary">
          {toVND(grandTotal)}
        </Typography>
      </Box>
    </Box>
  )

  /** ====== UI ====== */
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{ sx: { width: "1400px", maxWidth: "98vw", height: "90vh", borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 900, fontSize: 20, py: 1.25, px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ width: 10, height: 10, bgcolor: 'primary.main', borderRadius: '50%' }} />
        Thanh toán & Trả phòng – NeoGlass
      </DialogTitle>

      <DialogContent sx={{ p: 1.25, maxHeight: "85vh", overflow: "auto" }}>
        {header}

        <Grid container spacing={1.5}>
          {/* LEFT – editable content */}
          <Grid item xs={12} md={8}>
            {/* Rooms */}
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2.5, mb: 1.25 }}>
              <Typography variant="subtitle2" fontWeight={900} color="primary" mb={1}>
                🛏️ Chi tiết phòng
              </Typography>
              <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.6, px: 1 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f6f7fb" }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>Phòng</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 12 }}>Đơn giá/đêm</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 12 }}>Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(checkoutInfo?.room_details || []).map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 12 }}><strong>{r.room_number}</strong></TableCell>
                      <TableCell align="right" sx={{ fontSize: 12 }}>{toVND(Number(r.base_rate || 0))}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12 }}>{toVND(Number(r.total || 0))}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                    <TableCell sx={{ fontSize: 12 }}><strong>Tổng tiền phòng</strong></TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontSize: 12 }}><strong>{toVND(Number(checkoutInfo?.room_total || 0))}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {/* Services used */}
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2.5, mb: 1.25 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={900} color="primary">🍽️ Dịch vụ đã dùng</Typography>
                <Typography variant="h6" fontWeight={900}>{toVND(Number(checkoutInfo?.service_total || 0))}</Typography>
              </Box>
            </Paper>

            {/* Amenities editor */}
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2" fontWeight={900} color="primary">🏨 Tiện nghi phát sinh</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addRow} variant="contained" color="success" disabled={roomOptions.length === 0 || loadingOptions} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Thêm
                </Button>
              </Box>

              <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.5, px: 0.75 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f6f7fb" }}>
                    <TableCell sx={{ fontSize: 12, fontWeight: 800, width: 160 }}>Phòng</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 800 }}>Tiện nghi</TableCell>
                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 800, width: 90 }}>Giá</TableCell>
                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 800, width: 70 }}>SL</TableCell>
                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 800, width: 110 }}>Tiền</TableCell>
                    <TableCell align="center" sx={{ width: 50 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(amenitiesUsed?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                        {loadingOptions ? 'Đang tải dữ liệu...' : 'Chưa có tiện nghi'}
                      </TableCell>
                    </TableRow>
                  )}

                  {amenitiesUsed?.map((row, idx) => {
                    const roomAllowed = amenityOptionsByRoom[row.room_id] ?? []
                    return (
                      <TableRow key={idx} hover>
                        <TableCell>
                          {roomOptions.length > 1 ? (
                            <FormControl size="small" fullWidth>
                              <InputLabel>Phòng</InputLabel>
                              <Select label="Phòng" value={row.room_id || ''} onChange={(e) => changeRowRoom(idx, Number(e.target.value))}>
                                {roomOptions.map((r) => (
                                  <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip label={roomOptions[0]?.label ?? '-'} size="small" />
                          )}
                        </TableCell>

                        <TableCell>
                          <Autocomplete
                            options={roomAllowed}
                            getOptionLabel={(o) => o.name}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            value={row.amenity_id ? roomAllowed.find((a) => a.id === row.amenity_id) ?? null : null}
                            onChange={(_, opt) => changeAmenity(idx, opt)}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Chọn..." size="small" sx={{ '& .MuiInputBase-input': { fontSize: 12 } }} />
                            )}
                            size="small"
                            disabled={!row.room_id || loadingOptions}
                            noOptionsText={loadingOptions ? 'Đang tải...' : 'Phòng này chưa có tiện nghi.'}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <TextField type="number" size="small" inputProps={{ min: 0, style: { fontSize: 12, textAlign: 'right' } }} value={row.price} onChange={(e) => changePrice(idx, e.target.value)} sx={{ width: 90 }} />
                        </TableCell>

                        <TableCell align="right">
                          <TextField type="number" size="small" inputProps={{ min: 1, style: { fontSize: 12, textAlign: 'right' } }} value={row.quantity} onChange={(e) => changeQty(idx, e.target.value)} sx={{ width: 70 }} />
                        </TableCell>

                        <TableCell align="right" sx={{ fontSize: 12, fontWeight: 800 }}>
                          {toVND(Number(row.subtotal || 0))}
                        </TableCell>

                        <TableCell align="center">
                          <IconButton size="small" onClick={() => removeRow(idx)} sx={{ p: 0.5 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell colSpan={4}><strong>Tạm tính tiện nghi</strong></TableCell>
                    <TableCell align="right"><strong>{toVND(amenityTotal)}</strong></TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* RIGHT – receipt & actions */}
          <Grid item xs={12} md={4}>
            {/* Step chips */}
            <Box display="flex" gap={0.75} mb={1}>
              <Chip label="1. Rà soát" size="small" color={step === 0 ? 'primary' : 'default'} variant={step === 0 ? 'filled' : 'outlined'} sx={{ fontWeight: 700 }} />
              <Chip label="2. Thanh toán" size="small" color={step === 1 ? 'primary' : 'default'} variant={step === 1 ? 'filled' : 'outlined'} sx={{ fontWeight: 700 }} />
            </Box>

            {/* Payment selector (only step 1) */}
            {step === 1 && (
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2.5, mb: 1.25 }}>
                <Typography variant="subtitle2" fontWeight={900} color="primary" mb={1}>🔘 Chọn phương thức</Typography>
                <ToggleButtonGroup
                  value={paymentMethod}
                  exclusive
                  onChange={(_, v) => setPaymentMethod(v)}
                  sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}
                >
                  <ToggleButton value="cash" sx={{ justifyContent: 'flex-start', borderRadius: 2, p: 1.25 }}>
                    <LocalAtmIcon sx={{ mr: 1 }} /> Tiền mặt – tại quầy
                  </ToggleButton>
                  <ToggleButton value="vnpay" sx={{ justifyContent: 'flex-start', borderRadius: 2, p: 1.25 }}>
                    <QrCode2Icon sx={{ mr: 1 }} /> VNPay – Quét QR / thẻ
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>
            )}

            {/* Receipt */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.25,
                borderRadius: 2.5,
                background: 'linear-gradient(180deg, rgba(248,249,250,0.85) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={900} color="primary" mb={1}>
                💳 Tóm tắt thanh toán
              </Typography>
              <Box sx={{ '& > *': { py: 0.35 } }}>
                <SummaryRow label="Tiền phòng" value={toVND(Number(checkoutInfo?.room_total || 0))} />
                <SummaryRow label="Dịch vụ" value={toVND(Number(checkoutInfo?.service_total || 0))} />
                <SummaryRow label="Tiện nghi" value={toVND(amenityTotal)} />
                <SummaryRow label="Giảm giá" value={`- ${toVND(Number(checkoutInfo?.discount_amount || 0))}`} />
                <SummaryRow label="Đặt cọc" value={`- ${toVND(Number(checkoutInfo?.deposit_amount || 0))}`} />
                <Divider sx={{ my: 1 }} />
                <SummaryRow label="TỔNG CẦN THANH TOÁN" value={toVND(grandTotal)} strong />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}>
          Đóng
        </Button>

        {step === 0 && (
          <Button
            variant="contained"
            onClick={confirmStep}
            disabled={loadingOptions}
            endIcon={<ArrowForwardIcon />}
            sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
          >
            Xác nhận & tiếp tục
          </Button>
        )}

        {step === 1 && (
          <Button
            variant="contained"
            onClick={async () => {
              if (!paymentMethod) {
                toast.error('Vui lòng chọn phương thức thanh toán')
                return
              }
              const payload: AmenityPayload[] = (amenitiesUsed ?? [])
                .filter((a) => a.room_id && a.amenity_id && a.quantity > 0)
                .map((a) => ({ room_id: a.room_id, amenity_id: a.amenity_id, price: clampNonNegative(a.price), quantity: clampPositiveInt(a.quantity) }))
              const ok = await postAmenities(payload)
              if (!ok) return
              if (paymentMethod === 'cash') onConfirmCheckout?.(payload)
              else onVNPayCheckout?.(checkoutInfo!.booking_id, payload)
            }}
            disabled={isPaying || savingAmenities}
            sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
          >
            {savingAmenities ? 'Đang lưu...' : 'Xác nhận thanh toán'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

/** ====== tiny atoms ====== */
const SummaryRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between">
    <Typography variant="body2" sx={{ fontWeight: strong ? 900 : 600, fontSize: strong ? 13 : 12 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: strong ? 900 : 700, fontSize: strong ? 13 : 12 }}>{value}</Typography>
  </Box>
)

export default CheckoutDialog
