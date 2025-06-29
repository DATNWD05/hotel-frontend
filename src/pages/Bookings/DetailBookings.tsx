import React, { useState, useEffect } from "react";
import {
  CircularProgress,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Collapse,
  TextField,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TableHead,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import api from "../../api/axios";
import "../../css/DetailBookings.css";
import { TrashIcon, PlusIcon } from "lucide-react";

// Interface definitions
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

interface Amenity {
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
}

interface Service {
  id: number;
  service_id?: number | null;
  room_id?: number | null;
  name: string;
  price: string;
  quantity: number;
  code?: string | null;
  category_id?: number | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  pivot: {
    booking_id: number;
    service_id: number;
    room_id?: number | null;
    quantity: number;
  };
}

interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  base_rate: string;
  created_at: string | null;
  updated_at: string | null;
  amenities: Amenity[];
}
interface ServiceDataResponse {
  services?: Service[];
  raw_total?: string;
  total_amount?: string;
}
interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  room_type: RoomType;
  services: Service[];
  pivot: {
    booking_id: number;
    room_id: number;
    rate: string;
  };
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
  customer: Customer | null;
  rooms: Room[];
  services: Service[];
}

interface ApiResponse {
  message?: string;
  data?: Service[] | ServiceDataResponse;
  meta?: {
    raw_total?: string;
    total_amount?: string;
  };
}

const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  return isNaN(num) ? "N/A" : numeral(num).format("0,0") + " VNĐ";
};

const formatDateString = (date: string): string => {
  try {
    const parsedDate = parseISO(date);
    return isValid(parsedDate) ? format(parsedDate, "dd/MM/yyyy") : "N/A";
  } catch {
    return "N/A";
  }
};

const DetailBookings: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAmenities, setShowAmenities] = useState<{
    [key: number]: boolean;
  }>({});
  const [showServices, setShowServices] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openServiceDialog, setOpenServiceDialog] = useState<boolean>(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<
    { service_id: number; quantity: number }[]
  >([]);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const bookingId = id;

  const fetchBookingDetail = async () => {
    if (!bookingId) {
      setError("Không tìm thấy ID đặt phòng");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/bookings/${bookingId}`);
      if (response.status === 200) {
        const data = response.data.booking || response.data;
        if (!data.customer || !data.rooms || !data.rooms.length) {
          setError("Dữ liệu đặt phòng không đầy đủ");
          setLoading(false);
          return;
        }
        const bookingData: Booking = {
          ...data,
          check_in_date: data.check_in_date && isValid(parseISO(data.check_in_date)) ? data.check_in_date : new Date().toISOString(),
          check_out_date: data.check_out_date && isValid(parseISO(data.check_out_date)) ? data.check_out_date : new Date().toISOString(),
          deposit_amount: data.deposit_amount || '0.00',
          raw_total: data.raw_total || '0.00',
          discount_amount: data.discount_amount || '0.00',
          total_amount: data.total_amount || '0.00',
          status: ['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'].includes(data.status) ? data.status : 'Cancelled',
          customer: data.customer || null,
          rooms: data.rooms.map((room: Room) => ({
            ...room,
            services: room.services || [],
          })),
          services: data.services || [],
        };
        setBooking(bookingData);
        // Khởi tạo trạng thái hiển thị tiện nghi cho từng phòng
        const initialShowAmenities = data.rooms.reduce(
          (acc: { [key: number]: boolean }, room: Room) => ({ ...acc, [room.id]: false }),
          {} as { [key: number]: boolean }
        );
        setShowAmenities(initialShowAmenities);
        setShowServices(initialShowServices);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải chi tiết đặt phòng"
      );
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải chi tiết đặt phòng"
      );
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const response = await api.get("/service", {
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Dữ liệu thô từ API /service:", response.data);

      if (response.status === 200) {
        const services: Service[] = response.data.data as Service[];
        if (!Array.isArray(services)) {
          throw new Error("Cấu trúc dữ liệu từ API không hợp lệ.");
        }

        console.log("Danh sách dịch vụ thô:", services);

        const formattedServices: Service[] = services.map(
          (service: Service) => ({
            id: service.id,
            service_id: service.service_id ?? service.id,
            name: service.name || "Unknown",
            price: service.price ? String(service.price) : "0.00",
            quantity: service.quantity || 1,
            code: service.code || null,
            category_id: service.category_id ?? null,
            description: service.description ?? null,
            status: service.status || "active",
            created_at: service.created_at ?? null,
            updated_at: service.updated_at ?? null,
            pivot: {
              booking_id: 0,
              service_id: service.id,
              room_id: null,
              quantity: service.quantity || 1,
            },
          })
        );

        console.log("Danh sách dịch vụ đã định dạng:", formattedServices);

        if (formattedServices.length === 0) {
          console.warn("Không có dịch vụ nào sau khi xử lý.");
        }

        setAvailableServices(formattedServices);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách dịch vụ:", error);
      setSnackbarMessage("Lỗi khi tải danh sách dịch vụ. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const handleBack = () => navigate("/listbookings");

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { className: string; text: string } } = {
      pending: { className: "status-pending", text: "Đang chờ" },
      confirmed: { className: "status-new", text: "Mới" },
      checked_in: { className: "status-vip", text: "Đã nhận phòng" },
      checked_out: { className: "status-vip", text: "Đã trả phòng" },
      cancelled: { className: "status-vip", text: "Đã hủy" },
      default: { className: "status-vip", text: "Không xác định" },
    };
    return statusMap[status.toLowerCase()] || statusMap.default;
  };

  const toggleAmenities = (roomId: number) => {
    setShowAmenities((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const toggleServices = (roomId: number) => {
    setShowServices((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const handleOpenServiceDialog = (roomId: number) => {
    setCurrentRoomId(roomId);
    setSelectedServices([]);
    fetchAvailableServices();
    setOpenServiceDialog(true);
  };

  const handleCloseServiceDialog = () => {
    setOpenServiceDialog(false);
    setCurrentRoomId(null);
    setSelectedServices([]);
  };

  const handleServiceSelection = (serviceId: number, quantity: number = 1) => {
    setSelectedServices((prev) => {
      const existingService = prev.find((s) => s.service_id === serviceId);
      if (existingService) {
        return prev.filter((s) => s.service_id !== serviceId);
      }
      return [...prev, { service_id: serviceId, quantity }];
    });
  };

  const handleQuantityChange = (serviceId: number, quantity: number) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.service_id === serviceId
          ? { ...s, quantity: Math.max(1, quantity) }
          : s
      )
    );
  };

  const handleAddServices = async () => {
    if (!currentRoomId || selectedServices.length === 0) {
      setSnackbarMessage("Vui lòng chọn ít nhất một dịch vụ.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post(`/bookings/${bookingId}/add-services`, {
        services: selectedServices.map((service) => ({
          room_id: currentRoomId,
          service_id: service.service_id,
          quantity: service.quantity,
        })),
      });

      console.log("Dữ liệu trả về từ API /add-services:", response.data);

      if (response.status === 200) {
        const apiResponse: ApiResponse = response.data;
        setBooking((prev) => {
          if (!prev) return prev;

          let newServicesSource: Service[] = [];
          if (Array.isArray(apiResponse.data)) {
            newServicesSource = apiResponse.data;
          } else if (
            apiResponse.data &&
            typeof apiResponse.data === "object" &&
            "services" in apiResponse.data
          ) {
            newServicesSource =
              (apiResponse.data as ServiceDataResponse).services || [];
          } else {
            console.error(
              "Không tìm thấy mảng dịch vụ trong response:",
              apiResponse
            );
            return prev;
          }

          const newServices: Service[] = newServicesSource
            .filter((s: Service) => s.pivot?.room_id === currentRoomId)
            .map((s: Service) => ({
              id: s.id,
              service_id: s.service_id ?? s.id,
              room_id: s.room_id ?? null,
              name: s.name || "Unknown",
              price: s.price ?? "0.00",
              quantity: s.pivot?.quantity ?? 0,
              code: s.code ?? null,
              category_id: s.category_id ?? null,
              description: s.description ?? null,
              status: s.status ?? "active",
              created_at: s.created_at ?? null,
              updated_at: s.updated_at ?? null,
              pivot: {
                booking_id: prev.id,
                service_id: s.id,
                room_id: s.pivot?.room_id ?? null,
                quantity: s.pivot?.quantity ?? 0,
              },
            }));

          if (newServices.length === 0) {
            console.warn("Không có dịch vụ mới nào cho phòng hiện tại.");
            return prev;
          }

          const existingServices = (
            prev.rooms.find((room) => room.id === currentRoomId)?.services || []
          ).filter(
            (existingService) =>
              !newServices.some(
                (newService) =>
                  newService.service_id === existingService.service_id
              )
          );

          const dataResponse =
            !Array.isArray(apiResponse.data) &&
            typeof apiResponse.data === "object"
              ? (apiResponse.data as ServiceDataResponse)
              : null;
          return {
            ...prev,
            services: [...prev.services, ...newServices],
            rooms: prev.rooms.map((room) =>
              room.id === currentRoomId
                ? { ...room, services: [...existingServices, ...newServices] }
                : room
            ),
            raw_total:
              dataResponse?.raw_total?.toString() ||
              apiResponse.meta?.raw_total?.toString() ||
              prev.raw_total,
            total_amount:
              dataResponse?.total_amount?.toString() ||
              apiResponse.meta?.total_amount?.toString() ||
              prev.total_amount,
          };
        });
        setSnackbarMessage("Thêm dịch vụ thành công!");
        setSnackbarOpen(true);
        handleCloseServiceDialog();
      }
    } catch (error) {
      console.error("Lỗi khi thêm dịch vụ:", error);
      setSnackbarMessage("Lỗi khi thêm dịch vụ. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const handleDeleteService = async (roomId: number, serviceId: number) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/remove-service`, {
        service_id: serviceId,
        room_id: roomId,
      });

      if (response.status === 200) {
        setBooking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map((room) =>
              room.id === roomId
                ? {
                    ...room,
                    services: room.services.filter(
                      (s) => s.service_id !== serviceId
                    ),
                  }
                : room
            ),
            services: prev.services.filter((s) => s.id !== serviceId),
            raw_total: response.data.data?.raw_total || prev.raw_total,
            total_amount: response.data.data?.total_amount || prev.total_amount,
          };
        });
        setSnackbarMessage("Xóa dịch vụ thành công!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Lỗi khi xóa dịch vụ:", error);
      setSnackbarMessage("Lỗi khi xóa dịch vụ.");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  // Lọc dịch vụ duy nhất và tính tổng số lượng
  const uniqueServices = Array.from(
    new Map(
      booking?.services.map((service) => [service.service_id, service])
    ).values()
  ).map((service) => ({
    ...service,
    totalQuantity: booking?.services
      .filter((s) => s.service_id === service.service_id)
      .reduce((sum, s) => sum + (s.pivot?.quantity || s.quantity), 0),
  }));

  return (
    <div className="detail-booking-wrapper">
      <div className="detail-booking-title">
        <div className="detail-booking-header-content">
          <h2>
            Chi Tiết <b>Đặt Phòng</b>
          </h2>
          <Button className="detail-back-button" onClick={handleBack}>
            Quay lại
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="detail-loading-container">
          <CircularProgress />
          <Typography>Đang tải chi tiết đặt phòng...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="detail-error-message">
          {error}
        </Typography>
      ) : !booking || !booking.customer || !booking.rooms ? (
        <Typography className="detail-no-data">
          Không tìm thấy thông tin đặt phòng hoặc dữ liệu không đầy đủ.
        </Typography>
      ) : (
        <>
          <div className="card-group top-section">
            <div className="container">
              <div className="card customer-info">
                <div className="card-header">
                  <div className="card-icon">👤</div>
                  <h2 className="card-title">Thông tin khách hàng</h2>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Số CCCD</div>
                    <div className="info-value">{booking.customer.cccd}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Tên khách hàng</div>
                    <div className="info-value">{booking.customer.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Giới tính</div>
                    <div className="info-value">
                      {booking.customer.gender === "male"
                        ? "Nam"
                        : booking.customer.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Email</div>
                    <div className="info-value">{booking.customer.email}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Số điện thoại</div>
                    <div className="info-value">{booking.customer.phone}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Ngày sinh</div>
                    <div className="info-value">
                      {formatDateString(booking.customer.date_of_birth)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Quốc tịch</div>
                    <div className="info-value">
                      {booking.customer.nationality}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Địa chỉ</div>
                    <div className="info-value">{booking.customer.address}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Ghi chú</div>
                    <div className="info-value">
                      {booking.customer.note || "Không có"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card booking-info">
                <div className="card-header">
                  <div className="card-icon">📅</div>
                  <h2 className="card-title">Thông tin đặt phòng</h2>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Người đặt phòng</div>
                    <div className="info-value">{booking.customer.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Ngày nhận phòng</div>
                    <div className="info-value">
                      {formatDateString(booking.check_in_date)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Ngày trả phòng</div>
                    <div className="info-value">
                      {formatDateString(booking.check_out_date)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Trạng thái</div>
                    <div className="info-value">
                      <span
                        className={`status-badge ${
                          getStatusBadge(booking.status).className
                        }`}
                      >
                        {getStatusBadge(booking.status).text}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Tiền đặt cọc</div>
                    <div className="info-value">
                      {formatCurrency(booking.deposit_amount)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Tổng tiền</div>
                    <div className="info-value price-highlight">
                      {formatCurrency(booking.raw_total)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Tổng giảm</div>
                    <div className="info-value">
                      {formatCurrency(booking.discount_amount)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Tổng giá cuối</div>
                    <div className="info-value price-highlight">
                      {formatCurrency(booking.total_amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-group bottom-section">
            <div className="container">
              <div className="card room-info customer-card">
                <div className="card-header">
                  <div className="card-icon">🏨</div>
                  <h2 className="card-title">Thông tin phòng</h2>
                </div>
                <div className="table-container">
                  <table className="info-table">
                    <thead>
                      <tr>
                        <th>Số phòng</th>
                        <th>Loại phòng</th>
                        <th>Mã loại phòng</th>
                        <th>Sức chứa tối đa</th>
                        <th>Giá phòng</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.rooms.map((room) => (
                        <React.Fragment key={room.id}>
                          <tr>
                            <td>{room.room_number}</td>
                            <td>{room.room_type.name}</td>
                            <td>{room.room_type.code || "N/A"}</td>
                            <td>{room.room_type.max_occupancy} người</td>
                            <td className="price-highlight">
                              {formatCurrency(room.room_type.base_rate)}
                            </td>
                            <td>
                              {room.status === "booked"
                                ? "Đã đặt"
                                : room.status}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <Button
                                  className="view-amenities-button"
                                  onClick={() => toggleAmenities(room.id)}
                                >
                                  {showAmenities[room.id]
                                    ? "Ẩn tiện nghi"
                                    : "Xem tiện nghi"}
                                </Button>
                                <Button
                                  className="view-services-button"
                                  onClick={() => toggleServices(room.id)}
                                >
                                  {showServices[room.id]
                                    ? "Ẩn dịch vụ"
                                    : "Xem dịch vụ"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <Collapse in={showAmenities[room.id]}>
                                <div className="detail-container">
                                  <h3>Thông tin tiện nghi</h3>
                                  <Table className="user-detail-table">
                                    <TableBody>
                                      {room.room_type.amenities.length > 0 ? (
                                        room.room_type.amenities.map(
                                          (amenity) => (
                                            <TableRow key={amenity.id}>
                                              <TableCell>
                                                <strong>Tên tiện nghi:</strong>{" "}
                                                {amenity.name}
                                              </TableCell>
                                              <TableCell>
                                                <strong>Mã:</strong>{" "}
                                                {amenity.code || "N/A"}
                                              </TableCell>
                                              <TableCell>
                                                <strong>Số lượng:</strong>{" "}
                                                {amenity.pivot.quantity}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={3}>
                                            Không có tiện nghi nào cho phòng{" "}
                                            {room.room_number}.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </Collapse>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <Collapse in={showServices[room.id]}>
                                <div className="detail-container">
                                  <h3>Thông tin dịch vụ</h3>
                                  <Table className="user-detail-table">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Tên dịch vụ</TableCell>
                                        <TableCell>Giá</TableCell>
                                        <TableCell>Số lượng</TableCell>
                                        <TableCell>Hành động</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {room.services.length > 0 ? (
                                        room.services.map((service) => (
                                          <TableRow key={service.id}>
                                            <TableCell>
                                              {service.name}
                                            </TableCell>
                                            <TableCell>
                                              {formatCurrency(service.price)}
                                            </TableCell>
                                            <TableCell>
                                              {service.quantity}
                                            </TableCell>
                                            <TableCell>
                                              <Button
                                                variant="outlined"
                                                startIcon={<TrashIcon />}
                                                onClick={() =>
                                                  handleDeleteService(
                                                    room.id,
                                                    service.service_id!
                                                  )
                                                }
                                                className="action-delete"
                                              >
                                                Xóa
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={4}>
                                            Không có dịch vụ nào cho phòng{" "}
                                            {room.room_number}.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                  <Box mt={2}>
                                    <Button
                                      variant="contained"
                                      startIcon={<PlusIcon />}
                                      onClick={() =>
                                        handleOpenServiceDialog(room.id)
                                      }
                                      className="action-add-service"
                                    >
                                      Thêm dịch vụ
                                    </Button>
                                  </Box>
                                </div>
                              </Collapse>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card services-info customer-card">
                <div className="card-header">
                  <div className="card-icon">🛎️</div>
                  <h2 className="card-title">Thông tin dịch vụ</h2>
                </div>
                <div className="table-container">
                  <table className="info-table">
                    <thead>
                      <tr key="header">
                        <th>Tên dịch vụ</th>
                        <th>Giá</th>
                        <th>Tổng số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueServices.length > 0 ? (
                        uniqueServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>{service.name}</TableCell>
                            <TableCell className="price-highlight">
                              {formatCurrency(service.price)}
                            </TableCell>
                            <TableCell>{service.totalQuantity}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4}>
                            Không có dịch vụ nào được thêm.
                          </TableCell>
                        </TableRow>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <Dialog
            open={openServiceDialog}
            onClose={handleCloseServiceDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Thêm dịch vụ cho phòng{" "}
              {booking?.rooms.find((r) => r.id === currentRoomId)?.room_number}
            </DialogTitle>
            <DialogContent>
              <List>
                {availableServices.length > 0 ? (
                  availableServices.map((service) => (
                    <ListItem key={service.id}>
                      <Checkbox
                        checked={selectedServices.some(
                          (s) => s.service_id === service.id
                        )}
                        onChange={() => handleServiceSelection(service.id)}
                      />
                      <ListItemText
                        primary={service.name}
                        secondary={`Giá: ${formatCurrency(service.price)}`}
                      />
                      {selectedServices.some(
                        (s) => s.service_id === service.id
                      ) && (
                        <TextField
                          label="Số lượng"
                          type="number"
                          value={
                            selectedServices.find(
                              (s) => s.service_id === service.id
                            )?.quantity || 1
                          }
                          onChange={(e) =>
                            handleQuantityChange(
                              service.id,
                              Number(e.target.value)
                            )
                          }
                          inputProps={{ min: 1 }}
                          size="small"
                          style={{ width: 100, marginLeft: 10 }}
                        />
                      )}
                    </ListItem>
                  ))
                ) : (
                  <Typography>Không có dịch vụ nào khả dụng.</Typography>
                )}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseServiceDialog} color="secondary">
                Hủy
              </Button>
              <Button
                onClick={handleAddServices}
                color="primary"
                variant="contained"
                disabled={selectedServices.length === 0}
              >
                Thêm
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={
                snackbarMessage.includes("thành công") ? "success" : "error"
              }
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </div>
  );
};

export default DetailBookings;
