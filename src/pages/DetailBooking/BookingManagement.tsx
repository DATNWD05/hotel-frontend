/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  CircularProgress,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
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
  ImageIcon,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { parseISO, isValid } from "date-fns";
import api from "../../api/axios";
import { toast } from "react-toastify";
import "./BookingManagement.css";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const FILES_URL = import.meta.env.VITE_FILES_URL || "http://localhost:8000";
const DEFAULT_AVATAR = "/default-avatar.png";

// react-toastify helpers (góc phải)
const notify = {
  success: (msg: string) => toast.success(msg, { position: "top-right" }),
  error: (msg: string) => toast.error(msg, { position: "top-right" }),
  info: (msg: string) => toast.info(msg, { position: "top-right" }),
};

// Hàm resolvePath từ Customer.tsx
const resolvePath = (p?: string) => {
  if (!p) return DEFAULT_AVATAR;
  const path = p.replace(/^public\//, "");
  return `${FILES_URL}/storage/${path}`;
};

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
  cccd_image_path?: string | null;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cccdImagePreview, setCccdImagePreview] = useState<string | null>(null);
  const [selectedCccdImage, setSelectedCccdImage] = useState<File | null>(null);
  const [isUploadingCccd, setIsUploadingCccd] = useState(false);
  const [isCccdImageDialogOpen, setIsCccdImageDialogOpen] = useState(false);
  const [openRemoveServiceDialog, setOpenRemoveServiceDialog] = useState(false);
  const [serviceToRemove, setServiceToRemove] = useState<{
    roomId: number;
    serviceId: number;
  } | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const bookingId = Number(id);

  // Fetch booking details
  const fetchBookingDetail = useCallback(async () => {
    if (!bookingId || isNaN(bookingId)) {
      setError("Không tìm thấy ID đặt phòng");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/bookings/${bookingId}`);
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
          customer: {
            ...data.customer,
            cccd_image_path: data.customer.cccd_image_path || null,
          },
          rooms: data.rooms.map((room: any) => ({
            ...room,
            id: Number(room.id),
            services: (room.services || []).map((s: any) => ({
              ...s,
              service_id: s.service_id ?? s.pivot?.service_id ?? s.id,
              room_id: s.room_id ?? s.pivot?.room_id ?? Number(room.id),
              quantity: s.quantity ?? s.pivot?.quantity ?? 1,
              total:
                s.total ??
                Number.parseFloat(String(s.price ?? 0)) *
                  (s.quantity ?? s.pivot?.quantity ?? 1),
              icon: s.icon || Coffee,
            })),
            room_type: {
              ...room.room_type,
              amenities: (room.room_type?.amenities || []).map(
                (amenity: Amenity) => ({
                  ...amenity,
                  icon: amenity.icon || Coffee,
                })
              ),
            },
          })),

          services: (data.services || []).map((s: any) => ({
            ...s,
            service_id: s.service_id ?? s.pivot?.service_id ?? s.id,
            room_id: s.room_id ?? s.pivot?.room_id ?? null,
            quantity: s.quantity ?? s.pivot?.quantity ?? 1,
            total:
              s.total ??
              Number.parseFloat(String(s.price ?? 0)) *
                (s.quantity ?? s.pivot?.quantity ?? 1),
            icon: s.icon || Coffee,
          })),

          creator: data.creator || { id: 0, name: "Unknown", email: "N/A" },
        };
        setBooking(bookingData);
        setRoomServices(
          data.rooms.reduce(
            (acc: Record<number, Service[]>, room: any) => ({
              ...acc,
              [Number(room.id)]: (room.services || []).map((s: any) => ({
                ...s,
                service_id: s.service_id ?? s.pivot?.service_id ?? s.id,
                room_id: s.room_id ?? s.pivot?.room_id ?? Number(room.id),
                quantity: s.quantity ?? s.pivot?.quantity ?? 1,
                total:
                  s.total ??
                  Number.parseFloat(String(s.price ?? 0)) *
                    (s.quantity ?? s.pivot?.quantity ?? 1),
                icon: s.icon || Coffee,
              })),
            }),
            {}
          )
        );

        setSelectedRoomId(Number(data.rooms[0]?.id) || null);
        if (data.customer.cccd_image_path) {
          const imageUrl = resolvePath(data.customer.cccd_image_path);
          setCccdImagePreview(imageUrl);
        } else {
          setCccdImagePreview(null);
        }
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Lỗi khi tải chi tiết đặt phòng:", error);
      const msg =
        error instanceof Error
          ? `Lỗi: ${error.message}`
          : "Đã xảy ra lỗi khi tải chi tiết đặt phòng";
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Fetch available services
  const fetchAvailableServices = useCallback(async () => {
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
          icon: iconMap[service.name] || Coffee,
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
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách dịch vụ:", error);
      notify.error("Lỗi khi tải danh sách dịch vụ. Vui lòng thử lại.");
    }
  }, []);

  useEffect(() => {
    fetchBookingDetail();
    fetchAvailableServices();
  }, [bookingId, fetchBookingDetail, fetchAvailableServices]);

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

  const addServiceToRoom = useCallback(
    async (
      roomId: number,
      services: { service: Service; quantity: number; note: string }[]
    ) => {
      if (
        !booking ||
        booking.status === "Checked-out" ||
        booking.status === "Cancelled"
      ) {
        notify.error(
          "Không thể thêm dịch vụ vì đơn đặt phòng đã được trả phòng hoặc đã hủy."
        );
        return;
      }

      try {
        const response = await api.post(`/bookings/${bookingId}/add-services`, {
          services: services.map(({ service, quantity }) => ({
            room_id: roomId,
            service_id: service.id,
            quantity,
          })),
        });

        if (response.status === 200) {
          const newServices = services.map(({ service, quantity, note }) => ({
            ...service,
            id: service.id,
            service_id: service.service_id ?? service.id,
            room_id: roomId,
            quantity,
            note,
            total: Number.parseFloat(service.price) * quantity,
            pivot: {
              booking_id: bookingId,
              service_id: service.service_id ?? service.id,
              room_id: roomId,
              quantity,
            },
            icon: service.icon || Coffee,
          }));

          setRoomServices((prev) => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []), ...newServices],
          }));

          setBooking((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              services: [...prev.services, ...newServices],
              raw_total: response.data.data?.raw_total || prev.raw_total,
              total_amount:
                response.data.data?.total_amount || prev.total_amount,
            };
          });

          notify.success("Thêm các dịch vụ thành công!");
          setIsAddServiceOpen(false);
        }
      } catch (error: any) {
        console.error("Lỗi khi thêm dịch vụ:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Lỗi khi thêm dịch vụ. Vui lòng thử lại.";
        notify.error(errorMessage);
      }
    },
    [booking, bookingId]
  );

  const removeServiceFromRoom = useCallback(
    async (roomId: number, serviceId: number) => {
      if (!booking || !roomId || !serviceId) {
        notify.error("Thông tin phòng hoặc dịch vụ không hợp lệ.");
        return;
      }

      try {
        const response = await api.post(
          `/bookings/${bookingId}/remove-service`,
          {
            service_id: serviceId,
            room_id: roomId || null,
          }
        );

        if (response.status === 200) {
          setRoomServices((prev) => ({
            ...prev,
            [roomId]: (prev[roomId] || []).filter(
              (s) => (s.service_id ?? s.id) !== serviceId
            ),
          }));

          setBooking((prev) => {
            if (!prev) return prev;
            const updatedServices = prev.services.filter(
              (s) =>
                (s.service_id ?? s.id) !== serviceId ||
                (s.pivot?.room_id ?? s.room_id) !== roomId
            );
            return {
              ...prev,
              services: updatedServices,
              raw_total: response.data.data?.raw_total || prev.raw_total,
              total_amount:
                response.data.data?.total_amount || prev.total_amount,
            };
          });

          notify.success("Xóa dịch vụ thành công!");
        }
      } catch (error: any) {
        console.error("Lỗi khi xóa dịch vụ:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Lỗi khi xóa dịch vụ. Vui lòng thử lại.";
        notify.error(errorMessage);
      }
    },
    [booking, bookingId]
  );

  const handleOpenRemoveServiceDialog = (roomId: number, serviceId: number) => {
    setServiceToRemove({ roomId, serviceId });
    setOpenRemoveServiceDialog(true);
  };

  const handleConfirmRemoveService = async () => {
    if (!serviceToRemove) return;
    await removeServiceFromRoom(
      serviceToRemove.roomId,
      serviceToRemove.serviceId
    );
    setOpenRemoveServiceDialog(false);
    setServiceToRemove(null);
  };

  const handleCheckIn = async () => {
    if (booking?.status !== "Confirmed") {
      notify.error("Chỉ có thể check-in cho đơn đặt phòng đã xác nhận.");
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
        notify.success("Check-in thành công!");
      }
    } catch (error: any) {
      console.error("Lỗi khi check-in:", error);
      notify.error("Lỗi khi check-in. Vui lòng thử lại.");
    }
  };

  const handleCheckOut = async () => {
    if (booking?.status !== "Checked-in") {
      notify.error("Chỉ có thể check-out cho đơn đặt phòng đang ở.");
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
        notify.success("Check-out thành công!");
      }
    } catch (error: any) {
      console.error("Lỗi khi check-out:", error);
      notify.error("Lỗi khi check-out. Vui lòng thử lại.");
    }
  };

  const handleCccdImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        notify.error("Vui lòng chọn file ảnh định dạng JPEG, PNG hoặc JPG.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        notify.error("Kích thước ảnh không được vượt quá 2MB.");
        return;
      }

      setSelectedCccdImage(file);
      setCccdImagePreview(URL.createObjectURL(file));

      await handleUploadCccdImage(file);
    }
  };

  const handleUploadCccdImage = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedCccdImage;
    if (!file || !booking?.customer?.id) {
      notify.error("Vui lòng chọn ảnh CCCD trước khi upload.");
      return;
    }

    setIsUploadingCccd(true);

    try {
      const formData = new FormData();
      formData.append("cccd_image", file);
      formData.append("cccd", booking.customer.cccd);
      formData.append("name", booking.customer.name);
      if (booking.customer.email)
        formData.append("email", booking.customer.email);
      if (booking.customer.phone)
        formData.append("phone", booking.customer.phone);
      if (booking.customer.date_of_birth)
        formData.append("date_of_birth", booking.customer.date_of_birth);
      if (booking.customer.nationality)
        formData.append("nationality", booking.customer.nationality);
      if (booking.customer.address)
        formData.append("address", booking.customer.address);
      if (booking.customer.note) formData.append("note", booking.customer.note);
      if (booking.customer.gender)
        formData.append("gender", booking.customer.gender);
      formData.append("_method", "PUT");

      const response = await api.post(
        `/customers/${booking.customer.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        const updatedCustomer = response.data.data || response.data;
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                customer: {
                  ...prev.customer,
                  cccd_image_path: updatedCustomer.cccd_image_path,
                },
              }
            : prev
        );
        if (updatedCustomer.cccd_image_path) {
          const imageUrl = resolvePath(updatedCustomer.cccd_image_path);
          setCccdImagePreview(imageUrl);
        } else {
          setCccdImagePreview(null);
        }
        setSelectedCccdImage(null);
        notify.success("Cập nhật ảnh CCCD thành công!");
      }
    } catch (error: any) {
      console.error("Lỗi khi upload ảnh CCCD:", error);
      let errorMessage = "Lỗi khi upload ảnh CCCD. Vui lòng thử lại.";
      if (error.response?.data?.errors) {
        errorMessage = (Object.values(error.response.data.errors) as string[])
          .flat()
          .join(" ");
      }
      notify.error(errorMessage);
    } finally {
      setIsUploadingCccd(false);
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
    const roomTotal = Number.parseFloat(booking?.raw_total || "0");
    const servicesTotal = calculateAllServicesTotal();
    return roomTotal + servicesTotal;
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
    onAddService: (
      services: { service: Service; quantity: number; note: string }[]
    ) => void;
    formatCurrency: (amount: string) => string;
  }) => {
    const [selectedServices, setSelectedServices] = useState<
      { service: Service; quantity: number; note: string }[]
    >([]);
    const [hoveredServiceId, setHoveredServiceId] = useState<number | null>(
      null
    );

    const toggleServiceSelection = (service: Service) => {
      setSelectedServices((prev) => {
        const existing = prev.find((item) => item.service.id === service.id);
        if (existing) {
          return prev.filter((item) => item.service.id !== service.id);
        } else {
          return [...prev, { service, quantity: 1, note: "" }];
        }
      });
    };

    const updateServiceDetails = (
      serviceId: number,
      field: "quantity" | "note",
      value: number | string
    ) => {
      setSelectedServices((prev) =>
        prev.map((item) =>
          item.service.id === serviceId
            ? {
                ...item,
                [field]:
                  field === "quantity"
                    ? Math.max(1, Number(value) || 1)
                    : value,
              }
            : item
        )
      );
    };

    const handleAddServices = () => {
      if (selectedServices.length === 0) {
        return;
      }
      onAddService(selectedServices);
      setSelectedServices([]);
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
          <label className="section-label">
            Chọn dịch vụ ({selectedServices.length} đã chọn)
          </label>
          <div className="services-container">
            {Object.entries(groupedServices).map(
              ([category, categoryServices]) => (
                <div key={category} className="service-group">
                  <h5 className="service-category">{category}</h5>
                  <div className="service-grid">
                    {categoryServices.map((service) => {
                      const isSelected = selectedServices.some(
                        (item) => item.service.id === service.id
                      );
                      return (
                        <div
                          key={service.id}
                          className={`service-card ${
                            isSelected ? "service-card-selected" : ""
                          }`}
                          onClick={() => toggleServiceSelection(service)}
                          onMouseEnter={() => setHoveredServiceId(service.id)}
                          onMouseLeave={() => setHoveredServiceId(null)}
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
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {selectedServices.length > 0 && (
          <div className="service-details">
            <h3 className="service-details-title">Dịch vụ đã chọn</h3>
            {selectedServices.map(({ service, quantity, note }) => (
              <div key={service.id} className="selected-service-item">
                <div className="service-details-header">
                  {service.icon ? (
                    <service.icon className="icon-medium" />
                  ) : (
                    <Coffee className="icon-medium" />
                  )}
                  <div>
                    <h4>{service.name}</h4>
                    <p className="service-details-price">
                      Giá: {formatCurrency(service.price)} / lần
                    </p>
                  </div>
                </div>
                <div className="service-details-grid">
                  <div className="form-group">
                    <label
                      htmlFor={`quantity-${service.id}`}
                      className="form-label"
                    >
                      Số lượng
                    </label>
                    <input
                      id={`quantity-${service.id}`}
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        updateServiceDetails(
                          service.id,
                          "quantity",
                          e.target.value
                        )
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tổng tiền</label>
                    <div className="total-amount">
                      {formatCurrency(
                        (Number.parseFloat(service.price) * quantity).toString()
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor={`note-${service.id}`} className="form-label">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    id={`note-${service.id}`}
                    placeholder="Thêm ghi chú cho dịch vụ..."
                    value={note}
                    onChange={(e) =>
                      updateServiceDetails(service.id, "note", e.target.value)
                    }
                    className="form-textarea"
                  />
                </div>
              </div>
            ))}
            <div className="total-selected-services">
              <span>Tổng cộng:</span>
              <span className="total-amount">
                {formatCurrency(
                  selectedServices
                    .reduce(
                      (total, { service, quantity }) =>
                        total + Number.parseFloat(service.price) * quantity,
                      0
                    )
                    .toString()
                )}
              </span>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setSelectedServices([]);
              setIsAddServiceOpen(false);
            }}
          >
            Hủy
          </button>
          <button
            className="btn-primary"
            onClick={handleAddServices}
            disabled={selectedServices.length === 0}
          >
            Thêm các dịch vụ
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
    onAddService: (
      services: { service: Service; quantity: number; note: string }[]
    ) => void;
    onRemoveService: (serviceId: number) => void;
    formatCurrency: (amount: string) => string;
  }) => {
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

    const iconMap: Record<string, any> = {
      "WiFi miễn phí": Wifi,
      "Điều hòa không khí": Wind,
      "TV màn hình phẳng": Tv,
      Minibar: Refrigerator,
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
                  onAddService={(services) => {
                    onAddService(services);
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
              {services.map((service, idx) => (
                <div
                  key={`${service.service_id ?? service.id}-${
                    service.room_id ?? room.id
                  }-${idx}`}
                  className="service-item"
                >
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
                      onClick={() =>
                        handleOpenRemoveServiceDialog(
                          room.id,
                          service.service_id ??
                            service.pivot?.service_id ??
                            service.id
                        )
                      }
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
                  <div className="customer-header-content">
                    <div className="customer-header">
                      <div className="avatar">
                        {booking.customer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="customer-name">
                          {booking.customer.name}
                        </h3>
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
                          {booking.customer.gender === "male"
                            ? "Nam"
                            : booking.customer.gender === "female"
                            ? "Nữ"
                            : "Không xác định"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <MapPin className="icon-small" />
                        <span>{booking.customer.nationality}</span>
                      </div>
                      <div className="detail-item cccd-image-section">
                        <ImageIcon className="icon-small" />
                        <div className="cccd-image-controls">
                          {cccdImagePreview ? (
                            <div className="cccd-image-actions">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setIsCccdImageDialogOpen(true)}
                                className="btn-secondary"
                              >
                                Xem ảnh
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                  document
                                    .getElementById("cccd-upload-input")
                                    ?.click()
                                }
                                className="btn-secondary"
                                disabled={
                                  booking?.status === "Checked-out" ||
                                  booking?.status === "Cancelled" ||
                                  isUploadingCccd
                                }
                              >
                                {isUploadingCccd ? "Đang tải..." : "Sửa ảnh"}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                document
                                  .getElementById("cccd-upload-input")
                                  ?.click()
                              }
                              className="btn-secondary"
                              disabled={
                                booking?.status === "Checked-out" ||
                                booking?.status === "Cancelled" ||
                                isUploadingCccd
                              }
                            >
                              {isUploadingCccd
                                ? "Đang tải..."
                                : "Thêm ảnh CCCD"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="customer-address">
                    <MapPin className="icon-small" />
                    <span>{booking.customer.address}</span>
                  </div>

                  <Dialog
                    open={isCccdImageDialogOpen}
                    onClose={() => setIsCccdImageDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                  >
                    <DialogTitle>Xem ảnh CCCD</DialogTitle>
                    <DialogContent>
                      {cccdImagePreview ? (
                        <img
                          src={cccdImagePreview || "/placeholder.svg"}
                          alt="Ảnh CCCD"
                          className="cccd-image"
                          onError={(e) => {
                            console.error(
                              "Failed to load CCCD image:",
                              cccdImagePreview
                            );
                            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                            notify.error(
                              "Không thể tải ảnh CCCD. Vui lòng kiểm tra file hoặc cấu hình server."
                            );
                          }}
                        />
                      ) : (
                        <div className="cccd-placeholder">
                          <ImageIcon className="icon-medium" />
                          <p>Chưa có ảnh CCCD</p>
                        </div>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button
                        onClick={() => setIsCccdImageDialogOpen(false)}
                        color="secondary"
                      >
                        Đóng
                      </Button>
                    </DialogActions>
                  </Dialog>

                  <input
                    title="Upload ảnh CCCD"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleCccdImageChange}
                    className="file-input"
                    id="cccd-upload-input"
                    style={{ display: "none" }}
                    disabled={
                      booking?.status === "Checked-out" ||
                      booking?.status === "Cancelled"
                    }
                  />
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
                      onAddService={(services) =>
                        addServiceToRoom(room.id, services)
                      }
                      onRemoveService={(serviceId) =>
                        handleOpenRemoveServiceDialog(room.id, serviceId)
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
                    <span>Chi phí phòng:</span>
                    <span className="payment-amount">
                      {formatCurrency(booking.raw_total)}
                    </span>
                  </div>
                  {calculateAllServicesTotal() > 0 && (
                    <div className="payment-row">
                      <span>Chi phí dịch vụ:</span>
                      <span className="payment-amount">
                        {formatCurrency(calculateAllServicesTotal().toString())}
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
                  <div className="payment-actions">
                    {booking.status === "Confirmed" && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCheckIn}
                        className="btn-primary"
                      >
                        Check-in
                      </Button>
                    )}
                    {booking.status === "Checked-in" && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCheckOut}
                        className="btn-primary"
                      >
                        Check-out
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Dialog
            open={openRemoveServiceDialog}
            onClose={() => setOpenRemoveServiceDialog(false)}
            sx={{
              "& .MuiDialog-paper": {
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>
              Xác nhận xóa dịch vụ
            </DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc chắn muốn xóa dịch vụ này không? Hành động này không
                thể hoàn tác.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenRemoveServiceDialog(false)}
                sx={{
                  color: "#d32f2f",
                  borderColor: "#d32f2f",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "8px",
                  px: 2.5,
                  py: 0.7,
                  "&:hover": {
                    borderColor: "#b71c1c",
                    backgroundColor: "#ffebee",
                  },
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmRemoveService}
                variant="contained"
                sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
              >
                Xác nhận
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
