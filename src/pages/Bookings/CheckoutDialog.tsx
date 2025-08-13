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

/** ====== Types ====== */
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
  const [amenityOptionsByRoom, setAmenityOptionsByRoom] = useState<Record<number, AmenityOption[]>>({})
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([])
  const [amenitiesUsed, setAmenitiesUsed] = useState<AmenityRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [savingAmenities, setSavingAmenities] = useState(false)

  useEffect(() => {
    if (open) {
      setPaymentMethod(null)
    } else {
      setAmenitiesUsed([])
      setPaymentMethod(null)
    }
  }, [open, setPaymentMethod])

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

        setAmenityOptionsByRoom(map)
        setRoomOptions(opts)

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

        if (mounted) {
          setAmenitiesUsed(initialRows)
        }
      } catch (e) {
        console.error("amenities-options error:", e)
        if (mounted) {
          setAmenityOptionsByRoom({})
          setRoomOptions([])
          setAmenitiesUsed([])
          toast.error("Không tải được tiện nghi theo phòng.")
        }
      } finally {
        if (mounted) {
          setLoadingOptions(false)
        }
      }
    }

    fetchOptions()
    return () => {
      mounted = false
    }
  }, [open, checkoutInfo?.booking_id])

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

  const HeaderBar = (
    <Box
      sx={{
        p: 1,
        mb: 1,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 2,
      }}
    >
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
        <Chip
          label={`#${checkoutInfo?.booking_id ?? "-"}`}
          size="small"
          color="primary"
          sx={{ fontWeight: 500, bgcolor: "#1A73E8", color: "white", borderRadius: 4 }}
        />
        {checkoutInfo && (
          <Box display="flex" gap={1}>
            <Chip
              label={`${dt(checkoutInfo.check_in_date).split(" ")[0]} → ${dt(checkoutInfo.check_out_date).split(" ")[0]}`}
              size="small"
              sx={{ bgcolor: "grey.100", fontWeight: 400, borderRadius: 4 }}
            />
            <Chip
              label={getStatusView(checkoutInfo.status).text}
              size="small"
              sx={{
                bgcolor: getStatusView(checkoutInfo.status).color,
                color: "white",
                fontWeight: 500,
                borderRadius: 4,
              }}
            />
          </Box>
        )}
      </Box>
      <Box textAlign="right">
        <Typography variant="caption" color="text.secondary">
          Tổng thanh toán
        </Typography>
        <Typography variant="h6" fontWeight={700} color="#1A73E8">
          {toVND(grandTotal)}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: "95vw", sm: "90vw", md: "1200px" },
          maxWidth: "98vw",
          height: { xs: "80vh", sm: "70vh" },
          borderRadius: 8,
          bgcolor: "white",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      }}
      slotProps={{
        backdrop: { sx: { backdropFilter: "blur(3px)", backgroundColor: "rgba(0, 0, 0, 0.3)" } },
      }}
      aria-labelledby="checkout-dialog-title"
      aria-describedby="checkout-dialog-content"
    >
      <DialogTitle
        id="checkout-dialog-title"
        sx={{
          fontWeight: 700,
          fontSize: 20,
          py: 1,
          px: 2,
          bgcolor: "#1A73E8",
          color: "white",
          borderBottom: "none",
          borderRadius: "8px 8px 0 0",
          textAlign: "center",
        }}
      >
        💸 Thanh toán & Trả phòng
      </DialogTitle>

      <DialogContent
        id="checkout-dialog-content"
        sx={{ p: 1, maxHeight: { xs: "60vh", sm: "50vh" }, overflowY: "auto", scrollBehavior: "smooth" }}
      >
        <Box display="flex" flexDirection="column" gap={1}>
          {HeaderBar}

          <Grid container spacing={1} alignItems="stretch">
            <Grid item xs={12} md={8}>
              <Box display="grid" gap={1}>
                <Paper elevation={1} sx={{ p: 1, borderRadius: 8, bgcolor: "white", maxHeight: 120, overflow: "hidden" }}>
                  <SectionTitle icon={<AssignmentTurnedInOutlinedIcon sx={{ color: "#1A73E8" }} />} title="Thông tin đơn" right={`${checkoutInfo?.nights || 0} đêm`} />
                  <Grid container spacing={0.5}>
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

                <Paper elevation={1} sx={{ p: 1, borderRadius: 8, bgcolor: "white", maxHeight: 180, overflow: "auto" }}>
                  <SectionTitle icon={<LocalHotelOutlinedIcon sx={{ color: "#1A73E8" }} />} title="Chi tiết phòng" />
                  <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.5, px: 1 }, tableLayout: "fixed" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <CompactTh sx={{ width: 100 }}>Phòng</CompactTh>
                        <CompactTh align="right">Đơn giá/đêm</CompactTh>
                        <CompactTh align="right">Thành tiền</CompactTh>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {checkoutInfo?.room_details.map((r, i) => (
                        <TableRow key={i} hover sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                          <CompactTd sx={{ whiteSpace: "nowrap" }}>
                            <strong>{r.room_number}</strong>
                          </CompactTd>
                          <CompactTd align="right">{toVND(Number(r.base_rate || 0))}</CompactTd>
                          <CompactTd align="right">{toVND(Number(r.total || 0))}</CompactTd>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "grey.100" }}>
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

                {checkoutInfo?.service_total > 0 && (
                  <Paper elevation={1} sx={{ p: 1, borderRadius: 8, bgcolor: "white", maxHeight: 80, overflow: "hidden" }}>
                    <SectionTitle icon={<RoomServiceOutlinedIcon sx={{ color: "#1A73E8" }} />} title="Dịch vụ đã dùng" right={toVND(Number(checkoutInfo?.service_total || 0))} />
                  </Paper>
                )}

                <Paper elevation={1} sx={{ p: 1, borderRadius: 8, bgcolor: "white", maxHeight: 250, overflow: "auto" }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#1A73E8" }}>
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
                          sx={{
                            textTransform: "none",
                            borderRadius: 4,
                            fontWeight: 500,
                            bgcolor: "#1A73E8",
                            "&:hover": { bgcolor: "#1565C0" },
                          }}
                        >
                          Thêm
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>

                  <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.5, px: 1 }, tableLayout: "fixed" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <CompactTh sx={{ width: 100, fontSize: 12 }}>Phòng</CompactTh>
                        <CompactTh sx={{ fontSize: 12 }}>Tiện nghi</CompactTh>
                        <CompactTh align="right" sx={{ width: 80, fontSize: 12 }}>Giá</CompactTh>
                        <CompactTh align="right" sx={{ width: 50, fontSize: 12 }}>SL</CompactTh>
                        <CompactTh align="right" sx={{ width: 90, fontSize: 12 }}>Tiền</CompactTh>
                        <CompactTh align="center" sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(amenitiesUsed?.length ?? 0) === 0 && (
                        <TableRow>
                          <CompactTd colSpan={6} align="center" sx={{ color: "text.secondary", py: 0.5 }}>
                            {loadingOptions ? "Đang tải..." : "Chưa có tiện nghi"}
                          </CompactTd>
                        </TableRow>
                      )}

                      {amenitiesUsed?.map((row, idx) => {
                        const roomAllowed = amenityOptionsByRoom[row.room_id] ?? []
                        return (
                          <TableRow key={idx} hover sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                            <CompactTd>
                              {roomOptions.length > 1 ? (
                                <FormControl size="small" fullWidth>
                                  <InputLabel sx={{ fontSize: 12 }}>Phòng</InputLabel>
                                  <Select
                                    label="Phòng"
                                    value={row.room_id || ""}
                                    onChange={(e) => changeRowRoom(idx, Number(e.target.value))}
                                    sx={{ "& .MuiSelect-select": { fontSize: 12 } }}
                                  >
                                    {roomOptions.map((r) => (
                                      <MenuItem key={r.id} value={r.id} sx={{ fontSize: 12 }}>
                                        {r.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Chip label={roomOptions[0]?.label ?? "-"} size="small" sx={{ bgcolor: "grey.200", color: "#1A73E8", borderRadius: 4 }} />
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
                                inputProps={{ min: 0, style: { fontSize: 12, textAlign: "right" } }}
                                value={row.price}
                                onChange={(e) => changePrice(idx, e.target.value)}
                                sx={{ width: 80, "& .MuiInputBase-root": { bgcolor: "grey.50", borderRadius: 4 } }}
                              />
                            </CompactTd>

                            <CompactTd align="right">
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 1, style: { fontSize: 12, textAlign: "right" } }}
                                value={row.quantity}
                                onChange={(e) => changeQty(idx, e.target.value)}
                                sx={{ width: 50, "& .MuiInputBase-root": { bgcolor: "grey.50", borderRadius: 4 } }}
                              />
                            </CompactTd>

                            <CompactTd align="right" sx={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                              {toVND(Number(row.subtotal || 0))}
                            </CompactTd>

                            <CompactTd align="center">
                              <Tooltip title="Xóa dòng" arrow>
                                <IconButton size="small" onClick={() => removeRow(idx)} sx={{ p: 0.5, color: "#D32F2F", "&:hover": { color: "#B71C1C" } }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </CompactTd>
                          </TableRow>
                        )
                      })}

                      <TableRow sx={{ bgcolor: "grey.100" }}>
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

            <Grid item xs={12} md={4}>
              <Box sx={{ position: { md: "sticky" }, top: 8 }}>
                <Paper elevation={2} sx={{ p: 1, borderRadius: 8, bgcolor: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", maxHeight: 300, overflow: "auto" }}>
                  <SectionTitle icon={<MonetizationOnOutlinedIcon sx={{ color: "#1A73E8" }} />} title="Tóm tắt thanh toán" />
                  <Box sx={{ "& > *": { py: 0.5 } }}>
                    <CompactSummaryRow label="Phòng + Dịch vụ" value={toVND(Number(checkoutInfo?.raw_total || 0))} />
                    <CompactSummaryRow label="Tiện nghi" value={toVND(amenityTotal)} />
                    <CompactSummaryRow label="Giảm giá" value={`- ${toVND(Number(checkoutInfo?.discount_amount || 0))}`} />
                    <CompactSummaryRow label="Đặt cọc" value={`- ${toVND(Number(checkoutInfo?.deposit_amount || 0))}`} />
                    <Divider sx={{ my: 0.5, borderColor: "grey.300" }} />
                    <CompactSummaryRow label="TỔNG CẦN THANH TOÁN" value={toVND(grandTotal)} strong highlight />
                  </Box>
                </Paper>

                <Paper elevation={1} sx={{ p: 1, borderRadius: 8, bgcolor: "white", mt: 1, maxHeight: 150, overflow: "hidden" }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: "#1A73E8", mb: 1 }}>
                    🔘 Phương thức thanh toán
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant={paymentMethod === "cash" ? "contained" : "outlined"}
                      onClick={() => setPaymentMethod("cash")}
                      disabled={isPaying || savingAmenities}
                      sx={{
                        textTransform: "none",
                        borderRadius: 4,
                        fontWeight: 500,
                        flex: 1,
                        py: 0.5,
                        bgcolor: paymentMethod === "cash" ? "#1A73E8" : "grey.100",
                        color: paymentMethod === "cash" ? "white" : "text.primary",
                        "&:hover": { bgcolor: paymentMethod === "cash" ? "#1565C0" : "grey.200" },
                      }}
                    >
                      Tiền mặt
                    </Button>
                    <Button
                      variant={paymentMethod === "vnpay" ? "contained" : "outlined"}
                      onClick={() => setPaymentMethod("vnpay")}
                      disabled={isPaying || savingAmenities}
                      sx={{
                        textTransform: "none",
                        borderRadius: 4,
                        fontWeight: 500,
                        flex: 1,
                        py: 0.5,
                        bgcolor: paymentMethod === "vnpay" ? "#1A73E8" : "grey.100",
                        color: paymentMethod === "vnpay" ? "white" : "text.primary",
                        "&:hover": { bgcolor: paymentMethod === "vnpay" ? "#1565C0" : "grey.200" },
                      }}
                    >
                      VNPay
                    </Button>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1,
          borderTop: "1px solid",
          borderColor: "grey.200",
          bgcolor: "white",
          position: "sticky",
          bottom: 0,
          boxShadow: "0 -2px 6px rgba(0,0,0,0.05)",
          zIndex: 2,
        }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          sx={{
            fontWeight: 500,
            textTransform: "none",
            borderRadius: 4,
            px: 2,
            py: 0.5,
            bgcolor: "grey.100",
            "&:hover": { bgcolor: "grey.200" },
          }}
        >
          Đóng
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
          sx={{
            borderRadius: 4,
            fontWeight: 700,
            textTransform: "none",
            px: 2,
            py: 0.5,
            bgcolor: "#1A73E8",
            "&:hover": { bgcolor: "#1565C0" },
          }}
        >
          {savingAmenities ? "Đang lưu..." : "Xác nhận thanh toán"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/** ====== Small UI atoms ====== */
const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode; right?: React.ReactNode }> = ({ title, icon, right }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
    <Box display="flex" alignItems="center" gap={0.5}>
      {icon}
      <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1A73E8" }}>
        {title}
      </Typography>
    </Box>
    {right && (
      <Typography variant="body2" fontWeight={500} sx={{ color: "#1A73E8" }}>
        {right}
      </Typography>
    )}
  </Box>
)

const CompactInfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Paper elevation={1} sx={{ p: 0.5, bgcolor: "white", borderRadius: 4, textAlign: "center" }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500} sx={{ color: "#1A73E8" }}>
      {value}
    </Typography>
  </Paper>
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
    sx={{ py: 0.25, ...(highlight && { bgcolor: "#1A73E8", color: "white", px: 0.5, borderRadius: 4 }) }}
  >
    <Typography variant="body2" sx={{ fontSize: strong ? 14 : 12, fontWeight: strong ? 700 : 400 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontSize: strong ? 14 : 12, fontWeight: strong ? 700 : 500 }}>
      {value}
    </Typography>
  </Box>
)

const CompactTh: React.FC<React.PropsWithChildren<{ align?: "right" | "left" | "center"; sx?: any }>> = ({ children, align, sx }) => (
  <TableCell align={align} sx={{ py: 0.25, fontWeight: 500, fontSize: 12, whiteSpace: "nowrap", color: "#1A73E8", ...sx }}>
    {children}
  </TableCell>
)

const CompactTd: React.FC<
  React.PropsWithChildren<{ align?: "right" | "left" | "center"; colSpan?: number; sx?: any }>
> = ({ children, align, colSpan, sx }) => (
  <TableCell align={align} colSpan={colSpan} sx={{ py: 0.25, fontSize: 12, verticalAlign: "middle", color: "text.primary", ...sx }}>
    {children}
  </TableCell>
)

export default CheckoutDialog