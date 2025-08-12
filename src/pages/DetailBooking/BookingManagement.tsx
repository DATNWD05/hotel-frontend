/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  Bed,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  Wifi,
  Coffee,
  Plus,
  Trash2,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  Tv,
  Wind,
  Shield,
  Bath,
  Refrigerator,
  X,
} from "lucide-react";
import {
  CircularProgress,
  Typography,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import api from "../../api/axios";
import "./BookingManagement.css";

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
}

interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  base_rate: string;
  amenities: Amenity[];
}

interface Room {
  id: number;
  room_number: string;
  status: string;
  pivot: {
    rate: string;
    booking_id: number;
    room_id: number;
    created_at: string;
    updated_at: string;
  };
  room_type: RoomType;
  services: Service[];
}

interface Creator {
  id: number;
  name: string;
  email: string;
}

interface Service {
  id: number;
  service_id?: number;
  room_id?: number | null;
  name: string;
  price: string;
  quantity?: number;
  note?: string;
  total?: number;
  icon: any;
  category: string;
  pivot?: {
    booking_id: number;
    service_id: number;
    room_id?: number | null;
    quantity: number;
  };
}

interface Amenity {
  id: number;
  name: string;
  icon: any;
}

interface Promotion {
  id: number;
  code: string;
  name: string;
  discount_amount: string;
  start_date: string;
  end_date: string;
}

interface Booking {
  id: number;
  customer_id: number;
  created_by: number;
  check_in_date: string;
  check_out_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
  deposit_amount: string;
  is_deposit_paid: number;
  raw_total: string;
  discount_amount: string;
  total_amount: string;
  customer: Customer;
  rooms: Room[];
  creator: Creator;
  services: Service[];
  promotions: Promotion[];
}

const BookingManagement = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomServices, setRoomServices] = useState<Record<number, Service[]>>(
    {}
  );
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>(
    []
  );
  const [selectedPromotion, setSelectedPromotion] = useState<string>("");
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const bookingId = Number(id); // Convert to number

  // Fetch booking details
  const fetchBookingDetail = async () => {
    if (!bookingId || isNaN(bookingId)) {
      setError("Không tìm thấy ID đặt phòng");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/bookings/${bookingId}`);
      console.log("Dữ liệu thô từ API /bookings:", response.data); // Debug
      if (response.status === 200) {
        const data =
          response.data.booking || response.data.data || response.data;
        if (!data) {
          setError("Dữ liệu trả về từ API rỗng");
          setLoading(false);
          return;
        }
        if (!data.customer) {
          setError("Thiếu thông tin khách hàng trong dữ liệu đặt phòng");
          setLoading(false);
          return;
        }
        if (!data.rooms || !Array.isArray(data.rooms) || !data.rooms.length) {
          setError("Thiếu thông tin phòng hoặc danh sách phòng rỗng");
          setLoading(false);
          return;
        }
        const bookingData: Booking = {
          ...data,
          check_in_date:
            data.check_in_date && isValid(parseISO(data.check_in_date))
              ? data.check_in_date
              : new Date().toISOString(),
          check_out_date:
            data.check_out_date && isValid(parseISO(data.check_out_date))
              ? data.check_out_date
              : new Date().toISOString(),
          check_in_at: data.check_in_at || null,
          check_out_at: data.check_out_at || null,
          deposit_amount: data.deposit_amount || "0.00",
          is_deposit_paid: data.is_deposit_paid || 0,
          raw_total: data.raw_total || "0.00",
          discount_amount: data.discount_amount || "0.00",
          total_amount: data.total_amount || "0.00",
          status: [
            "Pending",
            "Confirmed",
            "Checked-in",
            "Checked-out",
            "Cancelled",
          ].includes(data.status)
            ? data.status
            : "Cancelled",
          customer: data.customer || null,
          rooms: data.rooms.map((room: Room) => ({
            ...room,
            id: Number(room.id),
            services: (room.services || []).map((service: Service) => ({
              ...service,
              total: service.total ?? Number.parseFloat(service.price) * (service.quantity || 1),
              icon: service.icon || Coffee, // Ensure icon is set
            })),
            room_type: {
              ...room.room_type,
              amenities: (room.room_type?.amenities || []).map((amenity: Amenity) => ({
                ...amenity,
                icon: amenity.icon || Coffee, // Ensure icon is set
              })),
            },
          })),
          services: (data.services || []).map((service: Service) => ({
            ...service,
            total: service.total ?? Number.parseFloat(service.price) * (service.quantity || 1),
            icon: service.icon || Coffee, // Ensure icon is set
          })),
          creator: data.creator || { id: 0, name: "Unknown", email: "N/A" },
          promotions: data.promotions || [],
        };
        setBooking(bookingData);
        setRoomServices(
          data.rooms.reduce(
            (acc: Record<number, Service[]>, room: Room) => ({
              ...acc,
              [Number(room.id)]: (room.services || []).map((service: Service) => ({
                ...service,
                total: service.total ?? Number.parseFloat(service.price) * (service.quantity || 1),
                icon: service.icon || Coffee, // Ensure icon is set
              })),
            }),
            {}
          )
        );
        setSelectedRoomId(Number(data.rooms[0]?.id) || null);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đặt phòng:", error);
      setError(
        error instanceof Error
          ? `Lỗi: ${error.message}`
          : "Đã xảy ra lỗi khi tải chi tiết đặt phòng"
      );
      setSnackbarMessage(
        error instanceof Error
          ? `Lỗi: ${error.message}`
          : "Đã xảy ra lỗi khi tải chi tiết đặt phòng"
      );
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available services
  const fetchAvailableServices = async () => {
    try {
      const response = await api.get("/service");
      if (response.status === 200) {
        const services = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        const iconMap: Record<string, any> = {
          "Dịch vụ giặt ủi": Coffee,
          Massage: Waves,
          "Đưa đón sân bay": Car,
          "Ăn sáng buffet": Utensils,
          "Sử dụng gym": Dumbbell,
          "WiFi cao cấp": Wifi,
        };
        const formattedServices: Service[] = services.map((service: any) => ({
          id: service.id,
          service_id: service.id,
          name: service.name || "Unknown",
          price: String(service.price ?? "0.00"),
          quantity: 1,
          category: service.category?.name || "Khác",
          icon: iconMap[service.name] || Coffee, // Ensure icon is set
          pivot: {
            booking_id: 0,
            service_id: service.id,
            quantity: 1,
          },
        }));
        setAvailableServices(formattedServices);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách dịch vụ:", error);
      setSnackbarMessage("Lỗi khi tải danh sách dịch vụ. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  // Fetch available promotions
  const fetchAvailablePromotions = async () => {
    try {
      const response = await api.get("/promotions");
      if (response.status === 200) {
        const promotions: Promotion[] = response.data.data || [];
        setAvailablePromotions(promotions);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách khuyến mãi:", error);
      setSnackbarMessage("Lỗi khi tải danh sách khuyến mãi. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
    fetchAvailableServices();
    fetchAvailablePromotions();
  }, [bookingId]);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number.parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Checked-out":
        return (
          <span className="badge badge-success">
            <CheckCircle className="icon-small" />
            Đã trả phòng
          </span>
        );
      case "Checked-in":
        return (
          <span className="badge badge-info">
            <Clock className="icon-small" />
            Đang ở
          </span>
        );
      case "Confirmed":
        return (
          <span className="badge badge-warning">
            <Calendar className="icon-small" />
            Đã xác nhận
          </span>
        );
      case "Pending":
        return (
          <span className="badge badge-pending">
            <Clock className="icon-small" />
            Chờ xác nhận
          </span>
        );
      case "Cancelled":
        return (
          <span className="badge badge-error">
            <AlertCircle className="icon-small" />
            Đã hủy
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const addServiceToRoom = async (
    roomId: number,
    service: Service,
    quantity = 1,
    note = ""
  ) => {
    if (booking?.status === "Checked-out" || booking?.status === "Cancelled") {
      setSnackbarMessage(
        "Không thể thêm dịch vụ vì đơn đặt phòng đã được trả phòng hoặc đã hủy."
      );
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post(`/bookings/${bookingId}/add-services`, {
        services: [{ room_id: roomId, service_id: service.id, quantity }],
      });

      if (response.status === 200) {
        const newService = {
          ...service,
          quantity,
          note,
          total: Number.parseFloat(service.price) * quantity,
          id: response.data.data?.services?.[0]?.id || Date.now(),
          pivot: {
            booking_id: bookingId,
            service_id: service.id,
            room_id: roomId,
            quantity,
          },
          icon: service.icon || Coffee, // Ensure icon is set
        };
        setRoomServices((prev) => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), newService],
        }));
        setBooking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: [...prev.services, newService],
            raw_total: response.data.data?.raw_total || prev.raw_total,
            total_amount: response.data.data?.total_amount || prev.total_amount,
          };
        });
        setSnackbarMessage("Thêm dịch vụ thành công!");
        setSnackbarOpen(true);
        setIsAddServiceOpen(false);
      }
    } catch (error) {
      console.error("Lỗi khi thêm dịch vụ:", error);
      setSnackbarMessage("Lỗi khi thêm dịch vụ. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const removeServiceFromRoom = async (roomId: number, serviceId: number) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/remove-service`, {
        service_id: serviceId,
        room_id: roomId,
      });

      if (response.status === 200) {
        setRoomServices((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || []).filter(
            (service) => service.id !== serviceId
          ),
        }));
        setBooking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
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
      setSnackbarMessage("Lỗi khi xóa dịch vụ. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const handleCheckIn = async () => {
    if (booking?.status !== "Confirmed") {
      setSnackbarMessage("Chỉ có thể check-in cho đơn đặt phòng đã xác nhận.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post(`/check-in/${bookingId}`);
      if (response.status === 200) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: "Checked-in",
                check_in_at: new Date().toISOString(),
              }
            : prev
        );
        setSnackbarMessage("Check-in thành công!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Lỗi khi check-in:", error);
      setSnackbarMessage("Lỗi khi check-in. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const handleCheckOut = async () => {
    if (booking?.status !== "Checked-in") {
      setSnackbarMessage("Chỉ có thể check-out cho đơn đặt phòng đang ở.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.get(`/check-out/${bookingId}`);
      if (response.status === 200) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: "Checked-out",
                check_out_at: new Date().toISOString(),
              }
            : prev
        );
        setSnackbarMessage("Check-out thành công!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Lỗi khi check-out:", error);
      setSnackbarMessage("Lỗi khi check-out. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const handlePayDeposit = async () => {
    if (booking?.is_deposit_paid === 1) {
      setSnackbarMessage("Tiền cọc đã được thanh toán.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post(`/bookings/${bookingId}/deposit`);
      if (response.status === 200) {
        setBooking((prev) => (prev ? { ...prev, is_deposit_paid: 1 } : prev));
        setSnackbarMessage("Thanh toán cọc thành công!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Lỗi khi thanh toán cọc:", error);
      setSnackbarMessage("Lỗi khi thanh toán cọc. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const handleCancelBooking = async () => {
    if (booking?.status === "Checked-out" || booking?.status === "Cancelled") {
      setSnackbarMessage(
        "Không thể hủy đơn đặt phòng đã trả phòng hoặc đã hủy."
      );
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`);
      if (response.status === 200) {
        setBooking((prev) => (prev ? { ...prev, status: "Cancelled" } : prev));
        setSnackbarMessage("Hủy đặt phòng thành công!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Lỗi khi hủy đặt phòng:", error);
      setSnackbarMessage("Lỗi khi hủy đặt phòng. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const handleApplyPromotion = async () => {
    if (!selectedPromotion) {
      setSnackbarMessage("Vui lòng chọn một khuyến mãi.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post(
        `/bookings/${bookingId}/apply-promotion`,
        {
          promotion_id: selectedPromotion,
        }
      );
      if (response.status === 200) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                discount_amount:
                  response.data.data?.discount_amount || prev.discount_amount,
                total_amount:
                  response.data.data?.total_amount || prev.total_amount,
              }
            : prev
        );
        setSnackbarMessage("Áp dụng khuyến mãi thành công!");
        setSnackbarOpen(true);
        setIsPromotionDialogOpen(false);
      }
    } catch (error) {
      console.error("Lỗi khi áp dụng khuyến mãi:", error);
      setSnackbarMessage("Lỗi khi áp dụng khuyến mãi. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const handlePrintInvoice = async () => {
    try {
      const response = await api.get(`/invoices/booking/${bookingId}/print`);
      if (response.status === 200) {
        const pdfUrl = response.data.data?.url || response.data;
        window.open(pdfUrl, "_blank");
        setSnackbarMessage("Đã xuất hóa đơn thành công!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Lỗi khi xuất hóa đơn:", error);
      setSnackbarMessage("Lỗi khi xuất hóa đơn. Vui lòng thử lại.");
      setSnackbarOpen(true);
    }
  };

  const calculateAllServicesTotal = () => {
    return Object.values(roomServices).reduce((total, services) => {
      return (
        total +
        services.reduce(
          (roomTotal, service) => roomTotal + (service.total || 0),
          0
        )
      );
    }, 0);
  };

  const calculateGrandTotal = () => {
    const roomTotal = Number.parseFloat(booking?.total_amount || "0");
    const servicesTotal = calculateAllServicesTotal();
    return roomTotal + servicesTotal;
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const RoomAmenities = ({ amenities = [] }: { amenities?: Amenity[] }) => {
    return (
      <div className="amenities-container">
        <h4 className="section-title">
          <Wifi className="icon-small" /> Tiện nghi phòng
        </h4>
        <div className="amenities-grid">
          {amenities.map((amenity) => (
            <div key={amenity.id} className="amenity-item">
              {amenity.icon ? (
                <amenity.icon className="icon-small amenity-icon" />
              ) : (
                <Coffee className="icon-small amenity-icon" />
              )}
              <span>{amenity.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AddServiceModal = ({
    services,
    onAddService,
    formatCurrency,
  }: {
    services: Service[];
    onAddService: (service: Service, quantity: number, note: string) => void;
    formatCurrency: (amount: string) => string;
  }) => {
    const [selectedService, setSelectedService] = useState<Service | null>(
      null
    );
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");

    const handleAddService = () => {
      if (selectedService && quantity > 0) {
        onAddService(selectedService, quantity, note);
        setSelectedService(null);
        setQuantity(1);
        setNote("");
      }
    };

    const groupedServices = services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);

    return (
      <div className="modal-content">
        <div className="service-selection">
          <label className="section-label">Chọn dịch vụ</label>
          <div className="services-container">
            {Object.entries(groupedServices).map(
              ([category, categoryServices]) => (
                <div key={category} className="service-group">
                  <h5 className="service-category">{category}</h5>
                  <div className="service-grid">
                    {categoryServices.map((service) => (
                      <div
                        key={service.id}
                        className={`service-card ${
                          selectedService?.id === service.id
                            ? "service-card-selected"
                            : ""
                        }`}
                        onClick={() => setSelectedService(service)}
                      >
                        <div className="service-card-content">
                          {service.icon ? (
                            <service.icon className="icon-small" />
                          ) : (
                            <Coffee className="icon-small" />
                          )}
                          <div>
                            <p className="service-name">{service.name}</p>
                            <p className="service-price">
                              {formatCurrency(service.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {selectedService && (
          <div className="service-details">
            <div className="service-details-header">
              {selectedService.icon ? (
                <selectedService.icon className="icon-medium" />
              ) : (
                <Coffee className="icon-medium" />
              )}
              <div>
                <h3 className="service-details-title">
                  {selectedService.name}
                </h3>
                <p className="service-details-price">
                  Giá: {formatCurrency(selectedService.price)} / lần
                </p>
              </div>
            </div>

            <div className="service-details-grid">
              <div className="form-group">
                <label htmlFor="quantity" className="form-label">
                  Số lượng
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Number.parseInt(e.target.value) || 1)
                    )
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tổng tiền</label>
                <div className="total-amount">
                  {formatCurrency(
                    (
                      Number.parseFloat(selectedService.price) * quantity
                    ).toString()
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="note" className="form-label">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                id="note"
                placeholder="Thêm ghi chú cho dịch vụ..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-textarea"
              />
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setSelectedService(null);
              setQuantity(1);
              setNote("");
            }}
          >
            Hủy
          </button>
          <button
            className="btn-primary"
            onClick={handleAddService}
            disabled={!selectedService}
          >
            Thêm dịch vụ
          </button>
        </div>
      </div>
    );
  };

  const RoomDetailTab = ({
    room,
    services,
    availableServices,
    onAddService,
    onRemoveService,
    formatCurrency,
  }: {
    room: Room;
    services: Service[];
    availableServices: Service[];
    onAddService: (service: Service, quantity: number, note: string) => void;
    onRemoveService: (serviceId: number) => void;
    formatCurrency: (amount: string) => string;
  }) => {
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

    const iconMap: Record<string, any> = {
      "WiFi miễn phí": Wifi,
      "Điều hòa không khí": Wind,
      "TV màn hình phẳng": Tv,
      "Minibar": Refrigerator,
      "Két an toàn": Shield,
      "Phòng tắm riêng": Bath,
      "Dịch vụ phòng 24/7": Phone,
      "Máy pha cà phê": Coffee,
    };

    const roomAmenities = room.room_type.amenities.map((amenity) => ({
      ...amenity,
      icon: amenity.icon || iconMap[amenity.name] || Coffee,
    }));

    const calculateRoomServicesTotal = () => {
      return services.reduce(
        (total, service) => total + (service.total || 0),
        0
      );
    };

    return (
      <div className="room-detail-container">
        <div className="room-info">
          <div className="room-info-header">
            <h3 className="room-title">
              Phòng {room.room_number} ({room.room_type.name} -{" "}
              {room.room_type.code})
            </h3>
            <div className="room-price">
              <p className="price">{formatCurrency(room.pivot.rate)}</p>
              <p className="price-unit">/ đêm</p>
            </div>
          </div>
          <div className="room-description">
            <p>{room.room_type.description}</p>
            <div className="room-meta">
              <span className="room-occupancy">
                <Users className="icon-small" /> Tối đa{" "}
                {room.room_type.max_occupancy} người
              </span>
              <span
                className={`badge ${
                  room.status === "booked" ? "badge-warning" : ""
                }`}
              >
                {room.status === "booked" ? "Đã đặt" : room.status}
              </span>
            </div>
          </div>
        </div>

        <RoomAmenities amenities={roomAmenities} />

        <div className="services-section">
          <div className="services-header">
            <h4 className="section-title">
              <Coffee className="icon-small" /> Dịch vụ đã sử dụng
              {services.length > 0 && (
                <span className="badge badge-info">{services.length}</span>
              )}
            </h4>
            <div
              className="modal-overlay"
              style={{ display: isAddServiceOpen ? "flex" : "none" }}
            >
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">
                    Thêm dịch vụ cho phòng {room.room_number}
                  </h3>
                  <button
                    title="Đóng"
                    onClick={() => setIsAddServiceOpen(false)}
                    className="modal-close"
                  >
                    <X className="icon-medium" />
                  </button>
                </div>
                <AddServiceModal
                  services={availableServices}
                  onAddService={(service, quantity, note) => {
                    onAddService(service, quantity, note);
                    setIsAddServiceOpen(false);
                  }}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={() => setIsAddServiceOpen(true)}
              disabled={
                booking?.status === "Checked-out" ||
                booking?.status === "Cancelled"
              }
            >
              <Plus className="icon-small" /> Thêm dịch vụ
            </button>
          </div>

          {services.length > 0 ? (
            <div className="services-list">
              {services.map((service) => (
                <div key={service.id} className="service-item">
                  <div className="service-item-content">
                    {service.icon ? (
                      <service.icon className="icon-medium" />
                    ) : (
                      <Coffee className="icon-medium" />
                    )}
                    <div>
                      <p className="service-name">{service.name}</p>
                      <p className="service-details">
                        Số lượng: {service.quantity} ×{" "}
                        {formatCurrency(service.price)}
                      </p>
                      {service.note && (
                        <p className="service-note">Ghi chú: {service.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="service-item-actions">
                    <span className="service-total">
                      {formatCurrency((service.total || 0).toString())}
                    </span>
                    <button
                      title="Xóa dịch vụ"
                      className="icon-btn icon-btn-danger"
                      onClick={() => onRemoveService(service.id)}
                    >
                      <Trash2 className="icon-small" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="services-total">
                <span>Tổng dịch vụ phòng {room.room_number}:</span>
                <span className="total-amount">
                  {formatCurrency(calculateRoomServicesTotal().toString())}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Coffee className="empty-state-icon" />
              <p className="empty-state-text">
                Chưa có dịch vụ nào cho phòng này
              </p>
              <p className="empty-state-subtext">
                Nhấn "Thêm dịch vụ" để bắt đầu
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="booking-container">
      {loading ? (
        <div className="detail-loading-container">
          <CircularProgress />
          <Typography>Đang tải chi tiết đặt phòng...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="detail-error-message">
          {error}
        </Typography>
      ) : !booking ? (
        <Typography className="detail-no-data">
          Không tìm thấy thông tin đặt phòng.
        </Typography>
      ) : (
        <div className="booking-wrapper">
          <div className="card">
            <div className="header-content">
              <div>
                <h1 className="header-title">
                  Chi tiết đặt phòng #{booking.id}
                </h1>
                <p className="header-subtitle">
                  Được tạo bởi {booking.creator.name}
                </p>
              </div>
              <div className="header-status">
                {getStatusBadge(booking.status)}
                {booking.is_deposit_paid === 0 && (
                  <span className="badge badge-error">
                    <AlertCircle className="icon-small" /> Chưa thanh toán cọc
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="booking-grid">
            <div className="booking-left">
              <div className="card">
                <h2 className="section-title">
                  <User className="icon-small" /> Thông tin khách hàng
                </h2>
                <div className="customer-info">
                  <div className="customer-header">
                    <div className="avatar">
                      {booking.customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="customer-name">{booking.customer.name}</h3>
                      <p className="customer-cccd">
                        CCCD: {booking.customer.cccd}
                      </p>
                      {booking.customer.note && (
                        <span className="badge badge-info">
                          {booking.customer.note}
                        </span>
                      )}
                    </div>
                  </div>
                  <hr className="separator" />
                  <div className="customer-details">
                    <div className="customer-details-column">
                      <div className="detail-item">
                        <Mail className="icon-small" />
                        <span>{booking.customer.email}</span>
                      </div>
                      <div className="detail-item">
                        <Phone className="icon-small" />
                        <span>{booking.customer.phone}</span>
                      </div>
                      <div className="detail-item">
                        <CalendarDays className="icon-small" />
                        <span>
                          Sinh: {formatDate(booking.customer.date_of_birth)}
                        </span>
                      </div>
                    </div>
                    <div className="customer-details-column">
                      <div className="detail-item">
                        <User className="icon-small" />
                        <span>
                          {booking.customer.gender === "male" ? "Nam" : "Nữ"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <MapPin className="icon-small" />
                        <span>{booking.customer.nationality}</span>
                      </div>
                    </div>
                  </div>
                  <div className="customer-address">
                    <MapPin className="icon-small" />
                    <span>{booking.customer.address}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="section-title">
                  <Bed className="icon-small" /> Thông tin phòng & Dịch vụ (
                  {booking.rooms.length} phòng)
                </h2>
                <div className="room-tabs">
                  {booking.rooms.map((room) => (
                    <button
                      key={room.id}
                      className={`tab-btn ${
                        selectedRoomId === room.id ? "tab-btn-active" : ""
                      }`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <Bed className="icon-small" /> Phòng {room.room_number}
                      {roomServices[room.id]?.length > 0 && (
                        <span className="badge badge-info">
                          {roomServices[room.id].length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {booking.rooms
                  .filter((room) => room.id === selectedRoomId)
                  .map((room) => (
                    <RoomDetailTab
                      key={room.id}
                      room={room}
                      services={roomServices[room.id] || []}
                      availableServices={availableServices}
                      onAddService={(service, quantity, note) =>
                        addServiceToRoom(room.id, service, quantity, note)
                      }
                      onRemoveService={(serviceId) =>
                        removeServiceFromRoom(room.id, serviceId)
                      }
                      formatCurrency={formatCurrency}
                    />
                  ))}
              </div>
            </div>

            <div className="booking-right">
              <div className="card">
                <h2 className="section-title">
                  <Clock className="icon-small" /> Lịch trình
                </h2>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot timeline-dot-blue"></div>
                    <div>
                      <p className="timeline-title">Ngày nhận phòng</p>
                      <p className="timeline-text">
                        {formatDate(booking.check_in_date)}
                      </p>
                      {booking.check_in_at && (
                        <p className="timeline-status">
                          ✓ Đã nhận: {formatDateTime(booking.check_in_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="timeline-line"></div>
                  <div className="timeline-item">
                    <div className="timeline-dot timeline-dot-green"></div>
                    <div>
                      <p className="timeline-title">Ngày trả phòng</p>
                      <p className="timeline-text">
                        {formatDate(booking.check_out_date)}
                      </p>
                      {booking.check_out_at && (
                        <p className="timeline-status">
                          ✓ Đã trả: {formatDateTime(booking.check_out_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="section-title">
                  <CreditCard className="icon-small" /> Thông tin thanh toán
                </h2>
                <div className="payment-details">
                  <div className="payment-row">
                    <span>Tổng tiền phòng:</span>
                    <span className="payment-amount">
                      {formatCurrency(booking.raw_total)}
                    </span>
                  </div>
                  {Object.keys(roomServices).some(
                    (roomId) => roomServices[Number(roomId)]?.length > 0
                  ) && (
                    <div className="payment-row">
                      <span>Tổng dịch vụ:</span>
                      <span className="payment-amount">
                        {formatCurrency(calculateAllServicesTotal().toString())}
                      </span>
                    </div>
                  )}
                  {Number.parseFloat(booking.discount_amount) > 0 && (
                    <div className="payment-row">
                      <span>Giảm giá:</span>
                      <span className="payment-amount payment-discount">
                        -{formatCurrency(booking.discount_amount)}
                      </span>
                    </div>
                  )}
                  <hr className="separator" />
                  <div className="payment-row payment-total">
                    <span>Tổng cộng:</span>
                    <span className="payment-amount payment-amount-large">
                      {formatCurrency(calculateGrandTotal().toString())}
                    </span>
                  </div>
                  <hr className="separator" />
                  <div className="payment-row">
                    <span>Tiền cọc:</span>
                    <span className="payment-amount">
                      {formatCurrency(booking.deposit_amount)}
                    </span>
                  </div>
                  <div className="payment-row">
                    <span>Trạng thái cọc:</span>
                    {booking.is_deposit_paid === 1 ? (
                      <span className="badge badge-success">Đã thanh toán</span>
                    ) : (
                      <span className="badge badge-error">Chưa thanh toán</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Dialog
            open={isPromotionDialogOpen}
            onClose={() => setIsPromotionDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Áp dụng khuyến mãi</DialogTitle>
            <DialogContent>
              <FormControl fullWidth>
                <InputLabel>Chọn khuyến mãi</InputLabel>
                <Select
                  value={selectedPromotion}
                  onChange={(e) => setSelectedPromotion(e.target.value)}
                >
                  {availablePromotions.map((promotion) => (
                    <MenuItem key={promotion.id} value={promotion.id}>
                      {promotion.name} (
                      {formatCurrency(promotion.discount_amount)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setIsPromotionDialogOpen(false)}
                color="secondary"
              >
                Hủy
              </Button>
              <Button
                onClick={handleApplyPromotion}
                color="primary"
                variant="contained"
                disabled={!selectedPromotion}
              >
                Áp dụng
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
        </div>
      )}
    </div>
  );
};

export default BookingManagement;