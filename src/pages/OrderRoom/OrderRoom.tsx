import React, { useState, useEffect } from "react";
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  SelectChangeEvent,
  InputAdornment,
} from "@mui/material";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InfoIcon from "@mui/icons-material/Info";
import HomeIcon from "@mui/icons-material/Home";
import PaymentIcon from "@mui/icons-material/Payment";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import "../../css/OrderRoom.css";
import api from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  base_rate: string;
  created_at: string | null;
  updated_at: string | null;
  amenities?: Array<{
    id: number;
    category_id: number;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    price: string;
    default_quantity: number;
    status: string;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    pivot: {
      room_type_id: number;
      amenity_id: number;
      quantity: number;
    };
  }>;
}

interface SimpleRoomType {
  id: number;
  name: string;
  code: string;
}

interface Creator {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role_id: number;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

interface Customer {
  id: number;
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: number;
  customer_id: number;
  room_id: number;
  created_by: number;
  check_in_date: string;
  check_out_date: string;
  status: string;
  deposit_amount: string;
  raw_total: string;
  discount_amount: string;
  total_amount: string;
  created_at: string | null;
  updated_at: string | null;
  customer: Customer;
  creator: Creator;
}

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: "available" | "booked" | "maintenance";
  image: string | null;
  created_at: string;
  updated_at: string;
  room_type: RoomType;
  price?: number;
  booking_id?: string;
  customer_id?: number;
  created_by?: number;
  check_in_date?: string;
  check_out_date?: string;
  booking_status?: string;
  deposit_amount?: string;
  raw_total?: string;
  discount_amount?: string;
  total_amount?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  guest_country?: string;
  guest_id_number?: string;
  guest_gender?: string;
  guest_date_of_birth?: string;
  guest_address?: string;
  guest_note?: string | null;
  stay_days?: number;
  creator_name?: string;
  bookings?: Booking[];
}

interface ValidationErrors {
  room_number?: string;
  status?: string;
  room_type_id?: string;
}

const OrderRoom: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [editRoom, setEditRoom] = useState<Partial<Room>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [roomTypes, setRoomTypes] = useState<SimpleRoomType[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState<boolean>(true);
  const [roomTypesError, setRoomTypesError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/rooms");
      if (response.status === 200) {
        const data: Room[] = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        const sanitizedData = data
          .filter(
            (room) =>
              room &&
              room.id &&
              room.room_number &&
              room.room_type &&
              ["available", "booked", "maintenance"].includes(room.status)
          )
          .map((room) => {
            let latestBooking: Booking | null = null;
            if (
              room.status === "booked" &&
              room.bookings &&
              room.bookings.length > 0
            ) {
              latestBooking = room.bookings.reduce(
                (latest: Booking | null, booking: Booking) => {
                  const latestDate = latest
                    ? new Date(latest.check_in_date)
                    : null;
                  const currentDate = booking.check_in_date
                    ? new Date(booking.check_in_date)
                    : null;
                  return !latestDate ||
                    (currentDate && currentDate > latestDate)
                    ? booking
                    : latest;
                },
                null
              );
            }

            let stayDays = 0;
            if (
              latestBooking &&
              latestBooking.check_in_date &&
              latestBooking.check_out_date
            ) {
              const checkIn = new Date(latestBooking.check_in_date);
              const checkOut = new Date(latestBooking.check_out_date);
              stayDays = Math.ceil(
                (checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)
              );
            }

            return {
              ...room,
              price: room.price || Number(room.room_type.base_rate) || 0,
              booking_id: latestBooking?.id?.toString() || undefined,
              customer_id: latestBooking?.customer_id || undefined,
              created_by: latestBooking?.created_by || undefined,
              check_in_date: latestBooking?.check_in_date || undefined,
              check_out_date: latestBooking?.check_out_date || undefined,
              booking_status: latestBooking?.status || undefined,
              deposit_amount: latestBooking?.deposit_amount || undefined,
              raw_total: latestBooking?.raw_total || undefined,
              discount_amount: latestBooking?.discount_amount || undefined,
              total_amount: latestBooking?.total_amount || undefined,
              guest_name: latestBooking?.customer.name || undefined,
              guest_phone: latestBooking?.customer.phone || undefined,
              guest_email: latestBooking?.customer.email || undefined,
              guest_country: latestBooking?.customer.nationality || undefined,
              guest_id_number: latestBooking?.customer.cccd || undefined,
              guest_gender: latestBooking?.customer.gender || undefined,
              guest_date_of_birth:
                latestBooking?.customer.date_of_birth || undefined,
              guest_address: latestBooking?.customer.address || undefined,
              guest_note: latestBooking?.customer.note || undefined,
              creator_name: latestBooking?.creator?.name || undefined,
              stay_days: stayDays || undefined,
            };
          });
        setAllRooms(sanitizedData);
        setFilteredRooms(sanitizedData);
        setRooms(sanitizedData);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không thể tải danh sách phòng";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      setRoomTypesLoading(true);
      setRoomTypesError(null);
      const response = await api.get("/room-types");

      if (response.status === 200) {
        const data: RoomType[] = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        const simplifiedRoomTypes: SimpleRoomType[] = data.map((rt) => ({
          id: rt.id,
          name: rt.name,
          code: rt.code,
        }));
        setRoomTypes(simplifiedRoomTypes);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách loại phòng";
      setRoomTypesError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRoomTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (allRooms.length > 0) {
      let filtered = [...allRooms];
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (room) => mapStatusToUI(room.status) === statusFilter
        );
      }
      setFilteredRooms(filtered);
      setRooms(filtered);
    }
  }, [statusFilter, allRooms]);

  const mapStatusToUI = (
    status: string
  ): "trong" | "da_dat" | "dang_sua" | "unknown" => {
    switch (status) {
      case "available":
        return "trong";
      case "booked":
        return "da_dat";
      case "maintenance":
        return "dang_sua";
      default:
        return "unknown";
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRoom(null);
  };

  const handleOpenEditDialog = (room: Room) => {
    setEditRoom({
      id: room.id,
      room_number: room.room_number,
      status: room.status,
      room_type_id: room.room_type_id,
    });
    setOpenEditDialog(true);
    setValidationErrors({});
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditRoom({});
    setValidationErrors({});
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditRoom((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as keyof ValidationErrors];
      return newErrors;
    });
  };

  const handleStatusChange = (event: SelectChangeEvent<string | number>) => {
    const { name, value } = event.target;
    if (name) {
      setEditRoom((prev) => ({
        ...prev,
        [name]: name === "room_type_id" ? Number(value) : value,
      }));
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const validateEditForm = (data: Partial<Room>): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.room_number?.trim()) {
      errors.room_number = "Số phòng không được để trống";
    } else if (data.room_number.length > 20) {
      errors.room_number = "Số phòng không được vượt quá 20 ký tự";
    }
    if (!["available", "maintenance"].includes(data.status || "")) {
      errors.status = "Trạng thái không hợp lệ";
    }
    if (
      !data.room_type_id ||
      data.room_type_id <= 0 ||
      !roomTypes.some((rt) => rt.id === data.room_type_id)
    ) {
      errors.room_type_id = "Loại phòng không hợp lệ";
    }
    return errors;
  };

  const handleEditRoom = async () => {
    if (!editRoom.id) return;

    const errors = validateEditForm(editRoom);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Vui lòng kiểm tra và sửa các lỗi trong biểu mẫu");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        room_number: editRoom.room_number?.trim(),
        status: editRoom.status,
        room_type_id: Number(editRoom.room_type_id),
      };

      const response = await api.put(`/rooms/${editRoom.id}`, payload);

      if (response.status === 200) {
        await fetchRooms();
        const updatedRoomData = response.data?.data;
        if (updatedRoomData) {
          setSelectedRoom((prev) => ({
            ...prev!,
            room_type: updatedRoomData.room_type,
            room_type_id: updatedRoomData.room_type_id,
            room_number: updatedRoomData.room_number,
            status: updatedRoomData.status,
          }));
        }

        setOpenEditDialog(false);
        setEditRoom({});
        setValidationErrors({});
        toast.success("Cập nhật phòng thành công!");
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không thể cập nhật phòng";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteRoom = async () => {
    if (!selectedRoom?.id) return;

    try {
      setLoading(true);
      const response = await api.delete(`/rooms/${selectedRoom.id}`);
      if (response.status === 200) {
        await fetchRooms();
        setOpenDialog(false);
        toast.success("Ẩn phòng thành công!");
        setTimeout(() => navigate('/hiddenrooms'), 2000);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không thể ẩn phòng";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status?: string) => {
    if (!status) return "Không xác định";
    const uiStatus = mapStatusToUI(status);
    switch (uiStatus) {
      case "trong":
        return "Trống";
      case "da_dat":
        return "Đã đặt";
      case "dang_sua":
        return "Đang sửa";
      default:
        return "Không xác định";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
  };

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
  }) => (
    <div className="info-row">
      <div className="info-row-icon">{icon}</div>
      <div className="info-row-content">
        <span className="info-row-label">{label}</span>
        <span className="info-row-value">{value}</span>
      </div>
    </div>
  );

  if (loading || roomTypesLoading) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        Đang tải dữ liệu...
      </Typography>
    );
  }

  if (error || roomTypesError) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Typography color="error" sx={{ mb: 2 }}>
          {error || roomTypesError}
        </Typography>
        <button
          className="retry-button"
          onClick={() => {
            fetchRooms();
            fetchRoomTypes();
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const totalRooms = allRooms.length;
  const availableRooms = allRooms.filter(
    (room) => room.status === "available"
  ).length;
  const bookedRooms = allRooms.filter(
    (room) => room.status === "booked"
  ).length;
  const maintenanceRooms = allRooms.filter(
    (room) => room.status === "maintenance"
  ).length;

  return (
    <div className="order-room-wrapper">
      <div className="order-room-title">
        <div className="order-room-header-content">
          <h2>
            Trạng thái <b>Phòng</b>
          </h2>
        </div>
      </div>
      <div className="order-room-filter-bar">
        <button
          className={`order-room-filter order-room-filter-tat_ca ${
            statusFilter === "all" ? "active" : ""
          }`}
          onClick={() => handleStatusFilter("all")}
        >
          Tất cả({totalRooms})
        </button>
        <button
          className={`order-room-filter order-room-filter-trong ${
            statusFilter === "trong" ? "active" : ""
          }`}
          onClick={() => handleStatusFilter("trong")}
        >
          Trống({availableRooms})
        </button>
        <button
          className={`order-room-filter order-room-filter-da_dat ${
            statusFilter === "da_dat" ? "active" : ""
          }`}
          onClick={() => handleStatusFilter("da_dat")}
        >
          Đã đặt({bookedRooms})
        </button>
        <button
          className={`order-room-filter order-room-filter-dang_sua ${
            statusFilter === "dang_sua" ? "active" : ""
          }`}
          onClick={() => handleStatusFilter("dang_sua")}
        >
          Đang sửa({maintenanceRooms})
        </button>
        <Link to="/listbookings/add" style={{ marginLeft: "auto" }}>
          <button className="order-room-filter order-room-filter-book">
            Đặt phòng
          </button>
        </Link>
      </div>

      {filteredRooms.length === 0 ? (
        <Typography
          align="center"
          className="order-room-no-data"
          sx={{ mt: 4 }}
        >
          Không tìm thấy phòng phù hợp.
        </Typography>
      ) : (
        <div className="order-room-grid">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`order-room-card order-room-status-${mapStatusToUI(
                room.status
              )}`}
              onClick={() => handleViewDetails(room)}
            >
              <div className="order-room-left-section">
                <div className="order-room-status-label">
                  {room.room_type.code || "STD"}
                </div>
                <div className="order-room-number">{room.room_number}</div>
                {mapStatusToUI(room.status) === "trong" && (
                  <div className="order-room-icon">
                    <PersonIcon />
                  </div>
                )}
                {mapStatusToUI(room.status) === "da_dat" && (
                  <div className="order-room-icon">
                    <CalendarTodayIcon />
                  </div>
                )}
                {mapStatusToUI(room.status) === "dang_sua" && (
                  <div className="order-room-icon">
                    <AccessTimeIcon />
                  </div>
                )}
              </div>
              <div className="order-room-right-section">
                <div className="order-room-content">
                  {mapStatusToUI(room.status) === "trong" && (
                    <div className="order-room-status-text">Trống</div>
                  )}
                  {mapStatusToUI(room.status) === "da_dat" && (
                    <>
                      <div className="order-room-date-time">
                        {formatDate(room.check_out_date)}
                      </div>
                      <div className="order-room-guest-name">
                        {room.guest_name || "N/A"}
                      </div>
                      {room.stay_days && (
                        <div className="order-room-countdown">
                          {`--Còn ${room.stay_days} ngày--`}
                        </div>
                      )}
                    </>
                  )}
                  {mapStatusToUI(room.status) === "dang_sua" && (
                    <div className="order-room-status-text">Đang sửa chữa</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        className="room-details-dialog"
      >
        <DialogTitle className="dialog-header">
          <div className="dialog-title-content">
            <HomeIcon className="dialog-title-icon" />
            <span>Chi tiết phòng {selectedRoom?.room_number ?? "N/A"}</span>
          </div>
        </DialogTitle>

        <DialogContent className="dialog-content-enhanced">
          {selectedRoom ? (
            <>
              <Card className="info-card room-info-card">
                <CardContent>
                  <div className="card-header">
                    <MeetingRoomIcon
                      className="card-icon"
                      style={{ color: "#3f51b5" }}
                    />
                    <Typography variant="h6" className="card-title">
                      Thông tin phòng
                    </Typography>
                    <Chip
                      label={getStatusText(selectedRoom.status)}
                      className={`status-chip status-${mapStatusToUI(
                        selectedRoom.status
                      )}`}
                    />
                  </div>
                  <Divider className="card-divider" />
                  <div className="info-grid-enhanced">
                    <InfoRow
                      icon={<HomeIcon />}
                      label="Số phòng"
                      value={selectedRoom.room_number}
                    />
                    <InfoRow
                      icon={<StarIcon />}
                      label="Loại phòng"
                      value={selectedRoom.room_type.name}
                    />
                    <InfoRow
                      icon={<InfoIcon />}
                      label="Mã loại phòng"
                      value={selectedRoom.room_type.code}
                    />
                    <InfoRow
                      icon={<PersonIcon />}
                      label="Sức chứa tối đa"
                      value={`${selectedRoom.room_type.max_occupancy} người`}
                    />
                    <InfoRow
                      icon={<PaymentIcon />}
                      label="Giá"
                      value={`${Number(
                        selectedRoom.room_type.base_rate
                      ).toLocaleString("vi-VN")} VNĐ`}
                    />
                  </div>
                </CardContent>
              </Card>

              {mapStatusToUI(selectedRoom.status) === "da_dat" && (
                <Card className="info-card booking-info-card">
                  <CardContent>
                    <div className="card-header">
                      <CalendarTodayIcon
                        className="card-icon"
                        style={{ color: "#3f51b5" }}
                      />
                      <Typography variant="h6" className="card-title">
                        Thông tin đặt phòng
                      </Typography>
                    </div>
                    <Divider className="card-divider" />
                    <div className="info-grid-enhanced">
                      <InfoRow
                        icon={<PersonIcon />}
                        label="Người đặt phòng"
                        value={selectedRoom.creator_name ?? "N/A"}
                      />
                      <InfoRow
                        icon={<CalendarTodayIcon />}
                        label="Ngày nhận phòng"
                        value={formatDate(selectedRoom.check_in_date)}
                      />
                      <InfoRow
                        icon={<CalendarTodayIcon />}
                        label="Ngày trả phòng"
                        value={formatDate(selectedRoom.check_out_date)}
                      />
                      <InfoRow
                        icon={<InfoIcon />}
                        label="Trạng thái"
                        value={
                          selectedRoom.booking_status === "Pending"
                            ? "Đang chờ"
                            : selectedRoom.booking_status === "Confirmed"
                            ? "Đã xác nhận"
                            : selectedRoom.booking_status === "Checked-in"
                            ? "Đã nhận phòng"
                            : selectedRoom.booking_status === "Checked-out"
                            ? "Đã trả phòng"
                            : selectedRoom.booking_status === "Canceled"
                            ? "Đã hủy"
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={<PaymentIcon />}
                        label="Tiền đặt cọc"
                        value={
                          selectedRoom.deposit_amount
                            ? `${Number(
                                selectedRoom.deposit_amount
                              ).toLocaleString("vi-VN")} VNĐ`
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={<PaymentIcon />}
                        label="Tổng gốc"
                        value={
                          selectedRoom.raw_total
                            ? `${Number(selectedRoom.raw_total).toLocaleString(
                                "vi-VN"
                              )} VNĐ`
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={<PaymentIcon />}
                        label="Tổng giảm"
                        value={
                          selectedRoom.discount_amount
                            ? `${Number(
                                selectedRoom.discount_amount
                              ).toLocaleString("vi-VN")} VNĐ`
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={<PaymentIcon />}
                        label="Tổng giá cuối"
                        value={
                          selectedRoom.total_amount
                            ? `${Number(
                                selectedRoom.total_amount
                              ).toLocaleString("vi-VN")} VNĐ`
                            : "N/A"
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {mapStatusToUI(selectedRoom.status) === "da_dat" && (
                <Card className="info-card guest-info-card">
                  <CardContent>
                    <div className="card-header">
                      <ContactPhoneIcon
                        className="card-icon"
                        style={{ color: "#3f51b5" }}
                      />
                      <Typography variant="h6" className="card-title">
                        Thông tin khách hàng
                      </Typography>
                    </div>
                    <Divider className="card-divider" />
                    <div className="info-grid-enhanced">
                      <InfoRow
                        icon={<InfoIcon />}
                        label="Số CCCD"
                        value={selectedRoom.guest_id_number ?? "N/A"}
                      />
                      <InfoRow
                        icon={<PersonIcon />}
                        label="Tên"
                        value={selectedRoom.guest_name ?? "N/A"}
                      />
                      <InfoRow
                        icon={<InfoIcon />}
                        label="Giới tính"
                        value={
                          selectedRoom.guest_gender === "male"
                            ? "Nam"
                            : selectedRoom.guest_gender === "female"
                            ? "Nữ"
                            : selectedRoom.guest_gender === "other"
                            ? "Không xác định"
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={<ContactPhoneIcon />}
                        label="Số điện thoại"
                        value={selectedRoom.guest_phone ?? "N/A"}
                      />
                      <InfoRow
                        icon={<CalendarTodayIcon />}
                        label="Ngày sinh"
                        value={formatDate(selectedRoom.guest_date_of_birth)}
                      />
                      <InfoRow
                        icon={<InfoIcon />}
                        label="Quốc tịch"
                        value={selectedRoom.guest_country ?? "N/A"}
                      />
                      <InfoRow
                        icon={<HomeIcon />}
                        label="Địa chỉ"
                        value={selectedRoom.guest_address ?? "N/A"}
                      />
                      <InfoRow
                        icon={<InfoIcon />}
                        label="Ghi chú"
                        value={selectedRoom.guest_note ?? "N/A"}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="info-card amenities-card">
                <CardContent>
                  <div className="card-header">
                    <StarIcon
                      className="card-icon"
                      style={{ color: "#3f51b5" }}
                    />
                    <Typography variant="h6" className="card-title">
                      Tiện ích
                    </Typography>
                  </div>
                  <Divider className="card-divider" />
                  <div className="amenities-grid">
                    {selectedRoom?.room_type?.amenities &&
                    selectedRoom.room_type.amenities.length > 0 ? (
                      selectedRoom.room_type.amenities.map((amenity) => (
                        <div key={amenity.id} className="amenity-item">
                          <div className="amenity-header">
                            <StarIcon className="amenity-icon" />
                            <span className="amenity-name">{amenity.name}</span>
                          </div>
                          <div className="amenity-details">
                            <span className="amenity-price">
                              {Number(amenity.price).toLocaleString("vi-VN")}{" "}
                              VNĐ
                            </span>
                            <span className="amenity-quantity">
                              SL: {amenity.pivot.quantity}
                            </span>
                            <Chip
                              label={
                                amenity.status === "active"
                                  ? "Hoạt động"
                                  : "Không hoạt động"
                              }
                              size="small"
                              className={`amenity-status ${amenity.status}`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-amenities">
                        <Typography>Không có tiện ích nào.</Typography>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Typography align="center" sx={{ mt: 4 }}>
              Không có phòng được chọn.
            </Typography>
          )}
        </DialogContent>

        <DialogActions className="dialog-actions-enhanced">
          {selectedRoom &&
            (selectedRoom.status === "available" ||
              selectedRoom.status === "maintenance") && (
              <button
                onClick={() => handleOpenEditDialog(selectedRoom)}
                className="edit-button"
              >
                <EditIcon /> Sửa phòng
              </button>
            )}
          {selectedRoom &&
            (selectedRoom.status === "available" ||
              selectedRoom.status === "maintenance") &&
            hasPermission('hide_rooms') && (
              <button onClick={handleSoftDeleteRoom} className="delete-button">
                <DeleteIcon /> Ẩn phòng
              </button>
            )}
          <button onClick={handleCloseDialog} className="close-dialog-button">
            Đóng
          </button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        className="room-edit-dialog"
      >
        <DialogTitle className="dialog-header">
          <div className="dialog-title-content">
            <EditIcon className="dialog-title-icon" />
            <span>Sửa thông tin phòng {editRoom.room_number}</span>
          </div>
        </DialogTitle>
        <DialogContent className="dialog-content-enhanced">
          <Paper elevation={4} className="edit-form-container">
            <Typography variant="h6" className="edit-form-title">
              Cập nhật thông tin phòng
            </Typography>
            <Divider className="edit-form-divider" />
            <Box className="edit-form-content" sx={{ mt: 3 }}>
              <TextField
                label="Số phòng"
                name="room_number"
                value={editRoom.room_number || ""}
                onChange={handleEditChange}
                fullWidth
                variant="outlined"
                error={!!validationErrors.room_number}
                helperText={validationErrors.room_number}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: 2,
                    paddingLeft: 0.5,
                  },
                  "& .MuiInputAdornment-root": {
                    marginRight: 1,
                    color: "#1976d2",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderWidth: "2px",
                    },
                  "& label.Mui-focused": {
                    color: "#1976d2",
                  },
                }}
              />
              <FormControl
                fullWidth
                className="edit-form-input"
                error={!!validationErrors.status}
              >
                <InputLabel id="status-label">Trạng thái</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={editRoom.status || ""}
                  onChange={handleStatusChange}
                  label="Trạng thái"
                  MenuProps={{
                    PaperProps: {
                      sx: { borderRadius: 2, boxShadow: 2 },
                    },
                  }}
                >
                  <MenuItem value="available">Trống</MenuItem>
                  <MenuItem value="maintenance">Đang sửa</MenuItem>
                </Select>
                {validationErrors.status && (
                  <Typography color="error" variant="caption">
                    {validationErrors.status}
                  </Typography>
                )}
              </FormControl>
              <FormControl
                fullWidth
                className="edit-form-input"
                error={!!validationErrors.room_type_id}
              >
                <InputLabel id="room-type-label">Loại phòng</InputLabel>
                <Select
                  labelId="room-type-label"
                  name="room_type_id"
                  value={editRoom.room_type_id || ""}
                  onChange={handleStatusChange}
                  label="Loại phòng"
                  MenuProps={{
                    PaperProps: {
                      sx: { borderRadius: 2, boxShadow: 2 },
                    },
                  }}
                  disabled={roomTypesLoading || !!roomTypesError}
                >
                  {roomTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.room_type_id && (
                  <Typography color="error" variant="caption">
                    {validationErrors.room_type_id}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions className="dialog-actions-enhanced">
          <button
            onClick={handleEditRoom}
            className="edit-form-save-button"
            disabled={loading || roomTypesLoading}
          >
            Lưu
          </button>
          <button
            onClick={handleCloseEditDialog}
            className="edit-form-cancel-button"
            disabled={loading || roomTypesLoading}
          >
            Hủy
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrderRoom;