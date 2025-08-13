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
  Stepper,
  Step,
  StepLabel,
  Tooltip,
} from "@mui/material"
import { format, parseISO, isValid } from "date-fns"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined"
import LocalHotelOutlinedIcon from "@mui/icons-material/LocalHotelOutlined"
import RoomServiceOutlinedIcon from "@mui/icons-material/RoomServiceOutlined"
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined"
import numeral from "numeral"
import { toast } from "react-toastify"
import api from "../../api/axios"

/** ====== Types (unchanged) ====== */
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

/** ====== Helpers (unchanged) ====== */
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
  if (k === "pending") return { text: "Chờ xác nhận", color: "#FFA500" }
  if (k === "confirmed") return { text: "Đã xác nhận", color: "#388E3C" }
  if (k === "checked-in") return { text: "Đã nhận phòng", color: "#1A73E8" }
  if (k === "checked-out") return { text: "Đã trả phòng", color: "#757575" }
  if (k === "cancelled") return { text: "Đã hủy", color: "#D32F2F" }
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

  // Load options từ BE mới: /bookings/{id}/amenities-options
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

  /** Header */
  const HeaderBar = (
    <Box
      sx={{
        p: 1,
        mb: 1.5,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#fff",
        border: "1px solid",
        borderColor: "#e9ecef",
        position: "sticky",
        top: 0,
        zIndex: 2,
      }}
    >
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
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
                fontWeight: 600,
              }}
              variant="outlined"
            />
          </>
        )}
      </Box>
      <Box textAlign="right">
        <Typography variant="caption" color="text.secondary" display="block">
          Tổng thanh toán
        </Typography>
        <Typography variant="h6" fontWeight={800} color="primary">
          {toVND(grandTotal)}
        </Typography>
      </Box>
    </Box>
  )

  const steps = ["Rà soát tiện nghi", "Chọn phương thức thanh toán"]

  /** ====== Render ====== */
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{ sx: { width: "1280px", maxWidth: "98vw", height: "90vh", borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, py: 1.5, px: 2, borderBottom: "1px solid #eee" }}>
        💸 Thanh toán & Trả phòng
      </DialogTitle>

      <DialogContent sx={{ p: 2, maxHeight: "85vh", overflow: "auto", bgcolor: "#fafafa" }}>
        {HeaderBar}

        {/* Stepper */}
        <Box sx={{ px: 1, mb: 2 }}>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {step === 0 && (
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={8.5}>
              <Box display="grid" gap={2}>
                {/* Đơn & phòng */}
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <SectionTitle icon={<AssignmentTurnedInOutlinedIcon />} title="Thông tin đơn" right={`${checkoutInfo?.nights || 0} đêm`} />
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={4}>
                      <CompactInfoCard label="Đặt cọc" value={toVND(Number(checkoutInfo?.deposit_amount || 0))} />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <CompactInfoCard label="Giảm giá" value={toVND(Number(checkoutInfo?.discount_amount || 0))} />
                    </Grid>
                    {checkoutInfo?.check_out_at && (
                      <Grid item xs={12} sm={4}>
                        <CompactInfoCard label="Trả phòng" value={dt(checkoutInfo.check_out_at)} />
                      </Grid>
                    )}
                  </Grid>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <SectionTitle icon={<LocalHotelOutlinedIcon />} title="Chi tiết phòng" />
                  <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.75, px: 1 }, tableLayout: "fixed" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <CompactTh sx={{ width: 180 }}>Phòng</CompactTh>
                        <CompactTh align="right">Đơn giá/đêm</CompactTh>
                        <CompactTh align="right">Thành tiền</CompactTh>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {checkoutInfo?.room_details.map((r, i) => (
                        <TableRow key={i} hover>
                          <CompactTd sx={{ whiteSpace: "nowrap" }}>
                            <strong>{r.room_number}</strong>
                          </CompactTd>
                          <CompactTd align="right">{toVND(Number(r.base_rate || 0))}</CompactTd>
                          <CompactTd align="right">{toVND(Number(r.total || 0))}</CompactTd>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                        <CompactTd>
                          <strong>Tổng tiền phòng</strong>
                        </CompactTd>
                        <CompactTd />
                        <CompactTd align="right">
                          <strong>{toVND(Number(checkoutInfo?.room_total || 0))}</strong>
                        </CompactTd>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <SectionTitle icon={<RoomServiceOutlinedIcon />} title="Dịch vụ đã dùng" right={toVND(Number(checkoutInfo?.service_total || 0))} />
                </Paper>

                {/* Tiện nghi phát sinh */}
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.25}>
                    <Typography variant="subtitle2" fontWeight={800} color="primary">
                      🏨 Tiện nghi phát sinh
                    </Typography>
                    <Tooltip title="Thêm một dòng tiện nghi" arrow>
                      <span>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={addRow}
                          variant="contained"
                          disabled={roomOptions.length === 0 || loadingOptions}
                          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                        >
                          Thêm
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>

                  <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.6, px: 0.75 }, tableLayout: "fixed" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <CompactTh sx={{ width: 160, fontSize: 12 }}>Phòng</CompactTh>
                        <CompactTh sx={{ fontSize: 12 }}>Tiện nghi</CompactTh>
                        <CompactTh align="right" sx={{ width: 110, fontSize: 12 }}>Giá</CompactTh>
                        <CompactTh align="right" sx={{ width: 80, fontSize: 12 }}>SL</CompactTh>
                        <CompactTh align="right" sx={{ width: 130, fontSize: 12 }}>Tiền</CompactTh>
                        <CompactTh align="center" sx={{ width: 56 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(amenitiesUsed?.length ?? 0) === 0 && (
                        <TableRow>
                          <CompactTd colSpan={6} align="center" sx={{ color: "text.secondary", py: 2 }}>
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

                            <CompactTd sx={{ whiteSpace: "nowrap" }}>
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
                                inputProps={{ min: 0, style: { fontSize: 12, textAlign: "right", whiteSpace: "nowrap" } }}
                                value={row.price}
                                onChange={(e) => changePrice(idx, e.target.value)}
                                sx={{ width: 110 }}
                              />
                            </CompactTd>

                            <CompactTd align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 1, style: { fontSize: 12, textAlign: "right", whiteSpace: "nowrap" } }}
                                value={row.quantity}
                                onChange={(e) => changeQty(idx, e.target.value)}
                                sx={{ width: 80 }}
                              />
                            </CompactTd>

                            <CompactTd align="right" sx={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                              {toVND(Number(row.subtotal || 0))}
                            </CompactTd>

                            <CompactTd align="center">
                              <Tooltip title="Xóa dòng" arrow>
                                <IconButton size="small" onClick={() => removeRow(idx)} sx={{ p: 0.5 }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </CompactTd>
                          </TableRow>
                        )
                      })}

                      <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                        <CompactTd colSpan={4}>
                          <strong>Tạm tính tiện nghi</strong>
                        </CompactTd>
                        <CompactTd align="right">
                          <strong>{toVND(amenityTotal)}</strong>
                        </CompactTd>
                        <CompactTd />
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            </Grid>

            {/* Summary card */}
            <Grid item xs={12} md={3.5}>
              <Box sx={{ position: { md: "sticky" }, top: 16 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#ffffff" }}>
                  <SectionTitle icon={<MonetizationOnOutlinedIcon />} title="Tóm tắt thanh toán" />
                  <Box sx={{ "& > *": { py: 0.5 } }}>
                    <CompactSummaryRow label="Phòng + Dịch vụ" value={toVND(Number(checkoutInfo?.raw_total || 0))} />
                    <CompactSummaryRow label="Tiện nghi" value={toVND(amenityTotal)} />
                    <CompactSummaryRow label="Giảm giá" value={`- ${toVND(Number(checkoutInfo?.discount_amount || 0))}`} />
                    <CompactSummaryRow label="Đặt cọc" value={`- ${toVND(Number(checkoutInfo?.deposit_amount || 0))}`} />
                    <Divider sx={{ my: 1 }} />
                    <CompactSummaryRow label="TỔNG CẦN THANH TOÁN" value={toVND(grandTotal)} strong highlight />
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        )}

        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
                <SectionTitle icon={<MonetizationOnOutlinedIcon />} title="Xác nhận tổng tiền" />
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Phòng + Dịch vụ + Tiện nghi − Giảm giá − Đặt cọc
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="primary">
                    {toVND(grandTotal)}
                  </Typography>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary" mb={1.25}>
                  🔘 Chọn phương thức thanh toán
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant={paymentMethod === "cash" ? "contained" : "outlined"}
                    onClick={() => setPaymentMethod("cash")}
                    disabled={isPaying || savingAmenities}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800 }}
                  >
                    Tiền mặt
                  </Button>
                  <Button
                    variant={paymentMethod === "vnpay" ? "contained" : "outlined"}
                    onClick={() => setPaymentMethod("vnpay")}
                    disabled={isPaying || savingAmenities}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800 }}
                  >
                    VNPay
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <SectionTitle icon={<AssignmentTurnedInOutlinedIcon />} title="Tóm tắt đơn" />
                <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={1.25}>
                  <CompactInfoCard label="Đặt cọc" value={toVND(Number(checkoutInfo?.deposit_amount || 0))} />
                  <CompactInfoCard label="Giảm giá" value={toVND(Number(checkoutInfo?.discount_amount || 0))} />
                  <CompactInfoCard label="Check-in" value={dt(checkoutInfo?.check_in_date)} />
                  <CompactInfoCard label="Check-out" value={dt(checkoutInfo?.check_out_date)} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid #eee", bgcolor: "#fff", position: "sticky", bottom: 0 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}>
          Đóng
        </Button>

        {checkoutInfo && step === 0 && (
          <Button
            variant="contained"
            onClick={confirmStep}
            disabled={loadingOptions}
            sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
          >
            Xác nhận & tiếp tục
          </Button>
        )}

        {checkoutInfo && step === 1 && (
          <Box display="flex" gap={1}>
            <Button
              onClick={() => setStep(0)}
              color="inherit"
              sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
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
                if (paymentMethod === "cash") await payCash()
                else await payVNPay()
              }}
              disabled={isPaying || savingAmenities}
              sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
            >
              {savingAmenities ? "Đang lưu..." : "Xác nhận thanh toán"}
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  )
}

/** ====== Small UI atoms (polished) ====== */
const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode; right?: React.ReactNode }> = ({ title, icon, right }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.25}>
    <Box display="flex" alignItems="center" gap={1}>
      {icon}
      <Typography variant="subtitle2" fontWeight={900} color="primary">
        {title}
      </Typography>
    </Box>
    {right && (
      <Typography variant="body2" fontWeight={800}>
        {right}
      </Typography>
    )}
  </Box>
)

const CompactInfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ textAlign: "center", p: 1, bgcolor: "#f8f9fa", borderRadius: 1.5, border: "1px dashed #eaeaea" }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={700}>
      {value}
    </Typography>
  </Box>
)

const CompactSummaryRow: React.FC<{ label: string; value: string; strong?: boolean; highlight?: boolean }> = ({
  label,
  value,
  strong,
  highlight,
}) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    sx={{ py: 0.4, ...(highlight && { bgcolor: "primary.main", color: "white", px: 1, borderRadius: 1.5, my: 0.5 }) }}
  >
    <Typography variant="body2" sx={{ fontSize: strong ? 13 : 12, fontWeight: strong ? 800 : 500 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontSize: strong ? 13 : 12, fontWeight: strong ? 900 : 700 }}>
      {value}
    </Typography>
  </Box>
)

const CompactTh: React.FC<React.PropsWithChildren<{ align?: "right" | "left" | "center"; sx?: any }>> = ({ children, align, sx }) => (
  <TableCell align={align} sx={{ py: 0.6, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", ...sx }}>
    {children}
  </TableCell>
)

const CompactTd: React.FC<
  React.PropsWithChildren<{ align?: "right" | "left" | "center"; colSpan?: number; sx?: any }>
> = ({ children, align, colSpan, sx }) => (
  <TableCell align={align} colSpan={colSpan} sx={{ py: 0.5, fontSize: 12, verticalAlign: "middle", ...sx }}>
    {children}
  </TableCell>
)

export default CheckoutDialog
