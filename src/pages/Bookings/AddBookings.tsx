/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  User,
  Calendar,
  Hotel,
  Utensils,
  Plus,
  Minus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import "../../css/AddBookings.css";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

interface Customer {
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  note: string;
}

interface Room {
  id: string;
  type: string;
  number: string;
  price: number;
  roomId: number;
  guests?: number;
}

interface Service {
  id: string;
  categoryId: number;
  serviceId: number;
  name: string;
  quantity: number;
  price: number;
}

interface Promotion {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
}

interface BookingData {
  customer: Customer;
  rooms: Room[];
  services: Service[];
  checkInDate: string;
  checkOutDate: string;
  depositAmount: number;
  promotion_code?: string | null;
}

interface ValidationErrors {
  customer: {
    cccd?: string;
    name?: string;
    gender?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  };
  booking: {
    checkInDate?: string;
    checkOutDate?: string;
    depositAmount?: string;
    dateRange?: string;
  };
  rooms: { [key: string]: { guests?: string; type?: string; number?: string } };
  services: { [key: string]: { categoryId?: string; serviceId?: string; quantity?: string } };
}

interface RoomType {
  id: number;
  name: string;
  base_rate: string;
  max_occupancy: number;
}

interface RoomNumber {
  id: number;
  room_number: string;
  room_type_id: number;
  status: string;
}

interface ServiceCategory {
  id: number;
  name: string;
}

interface AvailableService {
  id: number;
  name: string;
  category_id: number;
  price: string;
}

export default function HotelBooking() {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData>({
    customer: {
      cccd: "",
      name: "",
      gender: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      nationality: "Vietnamese",
      address: "",
      note: "",
    },
    rooms: [{ id: "1", type: "", number: "", price: 0, roomId: 0, guests: 0 }],
    services: [],
    checkInDate: "",
    checkOutDate: "",
    depositAmount: 0,
    promotion_code: null,
  });

  const [activeTab, setActiveTab] = useState("customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    customer: {},
    booking: {},
    rooms: {},
    services: {},
  });
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{ [key: string]: RoomNumber[] }>({});
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [availableServices, setAvailableServices] = useState<{ [key: string]: AvailableService[] }>({});
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [roomTypesRes, roomsRes, serviceCategoriesRes, servicesRes, promotionsRes] = await Promise.all([
          api.get("/room-types"),
          api.get("/rooms"),
          api.get("/service-categories"),
          api.get("/service"),
          api.get("/promotions"),
        ]);

        let typesData = roomTypesRes.data;
        if (typesData && typeof typesData === "object" && "data" in typesData) {
          typesData = typesData.data;
        }
        if (Array.isArray(typesData)) {
          setRoomTypes(typesData);
        } else {
          throw new Error("Dữ liệu từ /room-types không hợp lệ");
        }

        let roomsData = roomsRes.data;
        if (roomsData && typeof roomsData === "object" && "data" in roomsData) {
          roomsData = roomsData.data;
        }
        if (Array.isArray(roomsData)) {
          const groupedRooms = roomsData.reduce(
            (acc: { [key: string]: RoomNumber[] }, room: RoomNumber) => {
              const typeId = room.room_type_id.toString();
              if (!acc[typeId]) acc[typeId] = [];
              if (room.status === "available") {
                acc[typeId].push(room);
              }
              return acc;
            },
            {},
          );
          setRoomNumbers(groupedRooms);
        } else {
          throw new Error("Dữ liệu từ /rooms không hợp lệ");
        }

        let categoriesData = serviceCategoriesRes.data;
        if (categoriesData && typeof categoriesData === "object" && "data" in categoriesData) {
          categoriesData = categoriesData.data;
        }
        if (Array.isArray(categoriesData)) {
          setServiceCategories(categoriesData);
        } else {
          throw new Error("Dữ liệu từ /service-categories không hợp lệ");
        }

        let servicesData = servicesRes.data;
        if (servicesData && typeof servicesData === "object" && "data" in servicesData) {
          servicesData = servicesData.data;
        }
        if (Array.isArray(servicesData)) {
          const groupedServices = servicesData.reduce(
            (acc: { [key: string]: AvailableService[] }, service: AvailableService) => {
              const catId = service.category_id.toString();
              if (!acc[catId]) acc[catId] = [];
              acc[catId].push(service);
              return acc;
            },
            {},
          );
          setAvailableServices(groupedServices);
        } else {
          throw new Error("Dữ liệu từ /service không hợp lệ");
        }

        let promotionsData = promotionsRes.data;
        if (promotionsData && typeof promotionsData === "object" && "data" in promotionsData) {
          promotionsData = promotionsData.data;
        }
        if (Array.isArray(promotionsData)) {
          const activePromotions = promotionsData.filter((promo: Promotion) => promo.is_active && promo.status === "active");
          setPromotions(activePromotions);
        } else {
          throw new Error("Dữ liệu từ /promotions không hợp lệ");
        }
      } catch (error: any) {
        setErrorMessage("Lỗi khi tải dữ liệu: " + (error.response?.data?.message || error.message));
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

    const validateCCCD = (value: string): boolean => {
      if (!/^\d{12}$/.test(value)) return false;

      const provinceCode = value.substring(0, 3); // giữ nguyên chuỗi

      const validProvinceCodes = [
        "001", "002", "004", "006", "008", "010", "011", "012", "014", "015",
        "017", "019", "020", "022", "024", "025", "026", "027", "030", "031",
        "033", "034", "035", "036", "037", "038", "040", "042", "044", "045",
        "046", "048", "049", "051", "052", "054", "056", "058", "060", "062",
        "064", "066", "067", "068", "070", "072", "074", "075", "077", "079",
        "080", "082", "083", "084", "086", "087", "089", "091", "092", "093",
        "094", "095", "096"
      ];

      if (!validProvinceCodes.includes(provinceCode)) return false;

      const genderCentury = parseInt(value.charAt(3), 10);
      if (genderCentury < 0 || genderCentury > 3) return false;

      return true;
    };



  const validateCustomerField = (field: keyof Customer, value: string) => {
    const errors = { ...validationErrors };

    switch (field) {
      case "cccd": {
      const trimmed = value.trim();

      if (!trimmed) {
        errors.customer.cccd = "Vui lòng nhập số CCCD/CMND";
      } else if (!/^\d{9}$/.test(trimmed) && !/^\d{12}$/.test(trimmed)) {
        errors.customer.cccd = "Số CCCD/CMND phải gồm 9 hoặc 12 chữ số";
      } else if (trimmed.length === 12 && !validateCCCD(trimmed)) {
        errors.customer.cccd = "CCCD không hợp lệ: mã tỉnh hoặc cấu trúc sai";
      } else {
        delete errors.customer.cccd;
      }
      break;
    }


      case "name":
        if (!value.trim()) {
          errors.customer.name = "Vui lòng nhập họ và tên";
        } else if (value.trim().length < 2) {
          errors.customer.name = "Họ và tên phải có ít nhất 2 ký tự";
        } else {
          delete errors.customer.name;
        }
        break;
      case "gender":
        if (!value) {
          errors.customer.gender = "Vui lòng chọn giới tính";
        } else {
          delete errors.customer.gender;
        }
        break;
      case "email":
        if (!value.trim()) {
          errors.customer.email = "Vui lòng nhập email";
        } else if (!validateEmail(value)) {
          errors.customer.email = "Email không hợp lệ";
        } else {
          delete errors.customer.email;
        }
        break;
      case "phone":
        if (!value.trim()) {
          errors.customer.phone = "Vui lòng nhập số điện thoại";
        } else if (!validatePhone(value)) {
          errors.customer.phone = "Số điện thoại không hợp lệ (10-11 chữ số)";
        } else {
          delete errors.customer.phone;
        }
        break;
      case "dateOfBirth":
        if (!value) {
          errors.customer.dateOfBirth = "Vui lòng chọn ngày sinh";
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18) {
            errors.customer.dateOfBirth = "Phải đủ 18 tuổi để đặt phòng";
          } else {
            delete errors.customer.dateOfBirth;
          }
        }
        break;
      case "address":
        if (!value.trim()) {
          errors.customer.address = "Vui lòng nhập địa chỉ";
        } else if (value.trim().length < 10) {
          errors.customer.address = "Địa chỉ phải có ít nhất 10 ký tự";
        } else {
          delete errors.customer.address;
        }
        break;
    }

    setValidationErrors(errors);
  };

  const validateBookingField = (field: string, value: string | number) => {
    const errors = { ...validationErrors };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (field) {
      case "checkInDate":
        if (!value) {
          errors.booking.checkInDate = "Vui lòng chọn ngày nhận phòng";
        } else {
          const checkInDate = new Date(value as string);
          if (checkInDate < today) {
            errors.booking.checkInDate = "Ngày nhận phòng không thể là ngày trong quá khứ";
          } else {
            delete errors.booking.checkInDate;
          }
        }
        break;
      case "checkOutDate":
        if (!value) {
          errors.booking.checkOutDate = "Vui lòng chọn ngày trả phòng";
        } else if (bookingData.checkInDate) {
          const checkInDate = new Date(bookingData.checkInDate);
          const checkOutDate = new Date(value as string);
          if (checkOutDate <= checkInDate) {
            errors.booking.checkOutDate = "Ngày trả phòng phải sau ngày nhận phòng";
          } else if (checkOutDate < today) {
            errors.booking.checkOutDate = "Ngày trả phòng không thể là ngày trong quá khứ";
          } else {
            delete errors.booking.checkOutDate;
          }
        } else {
          delete errors.booking.checkOutDate;
        }
        break;
      case "depositAmount":
        if (value && Number(value) > 0 && Number(value) < 100000) {
          errors.booking.depositAmount = "Số tiền đặt cọc tối thiểu là 100,000 VNĐ";
        } else {
          delete errors.booking.depositAmount;
        }
        break;
    }

    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkInDate = new Date(bookingData.checkInDate);
      const checkOutDate = new Date(bookingData.checkOutDate);
      const diffDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 30) {
        errors.booking.dateRange = "Thời gian lưu trú không được vượt quá 30 ngày";
      } else {
        delete errors.booking.dateRange;
      }
    }

    setValidationErrors(errors);
  };

  const validateRoomField = (roomId: string, field: keyof Room, value: string) => {
    const errors = { ...validationErrors };

    if (!errors.rooms[roomId]) {
      errors.rooms[roomId] = {};
    }

    switch (field) {
      case "guests":
        if (!value || value === "") {
          errors.rooms[roomId].guests = "Vui lòng nhập số khách";
        } else if (Number(value) <= 0) {
          errors.rooms[roomId].guests = "Số khách phải lớn hơn 0";
        } else if (Number(value) > 10) {
          errors.rooms[roomId].guests = "Số khách không được vượt quá 10";
        } else {
          delete errors.rooms[roomId].guests;
        }
        break;
      case "type":
        if (!value) {
          errors.rooms[roomId].type = "Vui lòng chọn loại phòng";
        } else {
          delete errors.rooms[roomId].type;
        }
        break;
      case "number":
        if (!value) {
          errors.rooms[roomId].number = "Vui lòng chọn số phòng";
        } else {
          delete errors.rooms[roomId].number;
        }
        break;
    }

    if (Object.keys(errors.rooms[roomId]).length === 0) {
      delete errors.rooms[roomId];
    }

    setValidationErrors(errors);
  };

  const validateServiceField = (serviceId: string, field: keyof Service, value: string | number) => {
    const errors = { ...validationErrors };

    if (!errors.services[serviceId]) {
      errors.services[serviceId] = {};
    }

    switch (field) {
      case "categoryId":
        if (!value || Number(value) === 0) {
          errors.services[serviceId].categoryId = "Vui lòng chọn danh mục dịch vụ";
        } else {
          delete errors.services[serviceId].categoryId;
        }
        break;
      case "serviceId":
        if (!value || Number(value) === 0) {
          errors.services[serviceId].serviceId = "Vui lòng chọn dịch vụ";
        } else {
          delete errors.services[serviceId].serviceId;
        }
        break;
      case "quantity":
        if (!value || Number(value) <= 0) {
          errors.services[serviceId].quantity = "Số lượng phải lớn hơn 0";
        } else if (Number(value) > 10) {
          errors.services[serviceId].quantity = "Số lượng không được vượt quá 10";
        } else {
          delete errors.services[serviceId].quantity;
        }
        break;
    }

    if (Object.keys(errors.services[serviceId]).length === 0) {
      delete errors.services[serviceId];
    }

    setValidationErrors(errors);
  };

  const markFieldAsTouched = (fieldPath: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const calculateNights = () => {
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkIn = new Date(bookingData.checkInDate);
      const checkOut = new Date(bookingData.checkOutDate);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const calculateSubtotal = () => {
    const roomTotal = bookingData.rooms.reduce((sum, room) => {
      return room.price && room.number ? sum + room.price * calculateNights() : sum;
    }, 0);
    const serviceTotal = bookingData.services.reduce((sum, service) => {
      return service.price && service.quantity ? sum + service.price * service.quantity : sum;
    }, 0);
    return roomTotal + serviceTotal;
  };

  const calculateDiscount = () => {
    if (!bookingData.promotion_code) return 0;

    const selectedPromotion = promotions.find((promo) => promo.code === bookingData.promotion_code);
    if (!selectedPromotion) return 0;

    const subtotal = calculateSubtotal();
    if (selectedPromotion.discount_type === "percent") {
      return (subtotal * selectedPromotion.discount_value) / 100;
    } else if (selectedPromotion.discount_type === "amount") {
      return selectedPromotion.discount_value;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
  };

  const handleCustomerChange = (field: keyof Customer, value: string) => {
    setBookingData((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));

    markFieldAsTouched(`customer.${field}`);
    validateCustomerField(field, value);
  };

  const getFilteredRoomTypes = (guests: number) => {
    return roomTypes.filter((type) => type.max_occupancy >= guests && guests > 0);
  };

  const getAvailableRoomNumbers = (roomType: string, currentRoomId: string) => {
    if (!roomType || !roomNumbers[roomType]) return [];

    const availableRooms = roomNumbers[roomType]
      .filter((room) => room.status === "available")
      .map((room) => ({
        value: room.room_number,
        label: `Phòng ${room.room_number}`,
      }));

    const selectedRoomNumbers = bookingData.rooms
      .filter((r) => r.id !== currentRoomId && r.type === roomType && r.number)
      .map((r) => r.number);

    return availableRooms.filter((option) => !selectedRoomNumbers.includes(option.value));
  };

  const handleBookingChange = (field: string, value: string | number) => {
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }));

    markFieldAsTouched(`booking.${field}`);
    validateBookingField(field, value);
  };

  const handlePromotionChange = (value: string) => {
  const selectedPromotion = promotions.find((promo) => promo.id.toString() === value);
  setBookingData((prev) => ({
    ...prev,
    promotion_code: selectedPromotion ? selectedPromotion.code : null,
  }));
};

  const handleRoomChange = (roomId: string, field: keyof Room, value: string | number) => {
    setBookingData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) => {
        if (room.id === roomId) {
          if (field === "guests") {
            return {
              ...room,
              guests: value as number,
              type: "",
              number: "",
              price: 0,
              roomId: 0,
            };
          }
          if (field === "type") {
            const selectedType = roomTypes.find((rt) => rt.id.toString() === value.toString());
            return {
              ...room,
              type: selectedType ? selectedType.id.toString() : "",
              number: "",
              price: selectedType ? parseFloat(selectedType.base_rate) : 0,
              roomId: 0,
            };
          }
          if (field === "number") {
            const selectedRoom = roomNumbers[room.type]?.find((rn) => rn.room_number === value.toString());
            return {
              ...room,
              number: value.toString(),
              roomId: selectedRoom ? selectedRoom.id : 0,
            };
          }
          return { ...room, [field]: value };
        }
        return room;
      }),
    }));

    markFieldAsTouched(`rooms.${roomId}.${field}`);
    validateRoomField(roomId, field, value.toString());
  };

  const addRoom = () => {
    const newId = (bookingData.rooms.length + 1).toString();
    setBookingData((prev) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        { id: newId, type: "", number: "", price: 0, roomId: 0, guests: 0 },
      ],
    }));
  };

  const removeRoom = (roomId: string) => {
    if (bookingData.rooms.length > 1) {
      setBookingData((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((room) => room.id !== roomId),
      }));

      const errors = { ...validationErrors };
      delete errors.rooms[roomId];
      setValidationErrors(errors);
    }
  };

        const checkExistingCustomer = async (cccd: string) => {
        console.log("Checking CCCD:", cccd); // Debug: Xác nhận CCCD được kiểm tra
        try {
          const response = await api.get(`/customers/check-cccd/${cccd}`);
          console.log("API Response:", response.data); // Debug: Xem toàn bộ response
          const { status, data } = response.data;

          if (status === 'exists' && data && data.id) {
            setBookingData((prev) => ({
              ...prev,
              customer: {
                ...prev.customer,
                cccd: data.cccd || "",
                name: data.name || "",
                gender: data.gender || "",
                email: data.email || "",
                phone: data.phone || "",
                dateOfBirth: data.date_of_birth || "",
                nationality: data.nationality || "Vietnamese", // Giá trị mặc định nếu không có
                address: data.address || "",
                note: data.note || "",
              },
            }));
            console.log("Customer data updated:", data); // Debug: Xác nhận dữ liệu đã cập nhật
          } else {
            console.log("No customer found for CCCD:", cccd); // Debug: Xác nhận khi không tìm thấy
          }
        } catch (error: any) {
          console.error("Error checking CCCD:", error.response ? error.response.data : error.message);
          if (error.response?.status !== 404) {
            setErrorMessage("Lỗi khi kiểm tra CCCD: " + (error.response?.data?.message || error.message));
          }
        }
      };

  const getAvailableServices = (categoryId: string, currentServiceId: string) => {
    if (!categoryId || !availableServices[categoryId]) return [];

    const availableServicesList = availableServices[categoryId].map((service) => ({
      value: service.id.toString(),
      label: `${service.name} - ${parseFloat(service.price).toLocaleString()} VNĐ`,
    }));

    const selectedServiceIds = bookingData.services
      .filter((s) => s.id !== currentServiceId && s.categoryId.toString() === categoryId && s.serviceId !== 0)
      .map((s) => s.serviceId.toString());

    return availableServicesList.filter((option) => !selectedServiceIds.includes(option.value));
  };

  const handleServiceChange = (serviceId: string, field: keyof Service, value: string | number) => {
    setBookingData((prev) => ({
      ...prev,
      services: prev.services.map((service) => {
        if (service.id === serviceId) {
          if (field === "categoryId") {
            return {
              ...service,
              categoryId: Number(value),
              serviceId: 0,
              name: "",
              price: 0,
            };
          }
          if (field === "serviceId") {
            const categoryServices = availableServices[service.categoryId.toString()] || [];
            const selectedService = categoryServices.find((s) => s.id === Number(value));
            return {
              ...service,
              serviceId: Number(value),
              name: selectedService ? selectedService.name : "",
              price: selectedService ? parseFloat(selectedService.price) : 0,
            };
          }
          return { ...service, [field]: value };
        }
        return service;
      }),
    }));

    markFieldAsTouched(`services.${serviceId}.${field}`);
    validateServiceField(serviceId, field, value);
  };

  const addService = () => {
    const newId = (bookingData.services.length + 1).toString();
    setBookingData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: newId,
          categoryId: 0,
          serviceId: 0,
          name: "",
          quantity: 1,
          price: 0,
        },
      ],
    }));
  };

  const removeService = (serviceId: string) => {
    setBookingData((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== serviceId),
    }));

    const errors = { ...validationErrors };
    delete errors.services[serviceId];
    setValidationErrors(errors);
  };

  const validateAllFields = (): boolean => {
    let isValid = true;

    Object.keys(bookingData.customer).forEach((key) => {
      const field = key as keyof Customer;
      if (field !== "note" && field !== "nationality") {
        validateCustomerField(field, bookingData.customer[field]);
        markFieldAsTouched(`customer.${field}`);
      }
    });

    validateBookingField("checkInDate", bookingData.checkInDate);
    validateBookingField("checkOutDate", bookingData.checkOutDate);
    validateBookingField("depositAmount", bookingData.depositAmount);
    markFieldAsTouched("booking.checkInDate");
    markFieldAsTouched("booking.checkOutDate");
    markFieldAsTouched("booking.depositAmount");

    bookingData.rooms.forEach((room) => {
      validateRoomField(room.id, "guests", room.guests?.toString() || "");
      validateRoomField(room.id, "type", room.type);
      validateRoomField(room.id, "number", room.number);
      markFieldAsTouched(`rooms.${room.id}.guests`);
      markFieldAsTouched(`rooms.${room.id}.type`);
      markFieldAsTouched(`rooms.${room.id}.number`);
    });

    bookingData.services.forEach((service) => {
      validateServiceField(service.id, "categoryId", service.categoryId);
      validateServiceField(service.id, "serviceId", service.serviceId);
      validateServiceField(service.id, "quantity", service.quantity);
      markFieldAsTouched(`services.${service.id}.categoryId`);
      markFieldAsTouched(`services.${service.id}.serviceId`);
      markFieldAsTouched(`services.${service.id}.quantity`);
    });

    const hasErrors =
      Object.keys(validationErrors.customer).length > 0 ||
      Object.keys(validationErrors.booking).length > 0 ||
      Object.keys(validationErrors.rooms).length > 0 ||
      Object.keys(validationErrors.services).length > 0;

    if (hasErrors) {
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateAllFields()) {
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const validRoomIds = bookingData.rooms
        .filter((room) => room.number && roomNumbers[room.type]?.some((rn) => rn.room_number === room.number))
        .map((room) => {
          const selectedRoom = roomNumbers[room.type]?.find((rn) => rn.room_number === room.number);
          return selectedRoom ? selectedRoom.id : 0;
        })
        .filter((id) => id !== 0);

      if (validRoomIds.length === 0) {
        throw new Error("Vui lòng chọn ít nhất một phòng hợp lệ");
      }

      const totalAmount = calculateTotal();
      const apiData = {
        customer: {
          cccd: bookingData.customer.cccd.trim(),
          name: bookingData.customer.name.trim(),
          gender: bookingData.customer.gender,
          email: bookingData.customer.email.trim(),
          phone: bookingData.customer.phone.trim(),
          date_of_birth: bookingData.customer.dateOfBirth,
          nationality: bookingData.customer.nationality.trim(),
          address: bookingData.customer.address.trim(),
          note: bookingData.customer.note.trim() || null,
        },
        room_ids: validRoomIds,
        check_in_date: bookingData.checkInDate,
        check_out_date: bookingData.checkOutDate,
        deposit_amount: bookingData.depositAmount,
        total_amount: totalAmount > 0 ? totalAmount : 100000,
        promotion_code: bookingData.promotion_code,
      };

      console.log("Booking payload:", JSON.stringify(apiData, null, 2));

      const bookingRes = await api.post("/bookings", apiData);

      console.log("Booking response:", JSON.stringify(bookingRes.data, null, 2));

      const bookingResponseData = bookingRes.data;
      if (!bookingResponseData || (!bookingResponseData.id && !bookingResponseData.data?.id)) {
        throw new Error("Response không hợp lệ: Không tìm thấy booking ID");
      }

      const bookingId = bookingResponseData.id || bookingResponseData.data.id;
      console.log("Tạo đặt phòng thành công, ID:", bookingId);

      if (bookingData.services.length > 0) {
        const servicesPayload = bookingData.services
          .filter((service) => service.serviceId !== 0)
          .map((service) => ({
            service_id: service.serviceId,
            quantity: service.quantity,
          }));
        if (servicesPayload.length > 0) {
          await api.post(`/bookings/${bookingId}/add-services`, { services: servicesPayload });
          console.log("Thêm dịch vụ thành công:", servicesPayload);
        }
      }

      setSubmitStatus("success");
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      console.error("Submit error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      let errorMsg = "Có lỗi xảy ra khi đặt phòng";
      if (error.response?.data?.errors) {
        errorMsg = Object.values(error.response.data.errors).flat().join(", ");
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
        if (errorMsg.toLowerCase().includes("cccd")) {
          errorMsg = "Số CCCD/CMND đã tồn tại. Vui lòng kiểm tra lại.";
        } else if (errorMsg.includes("promotion")) {
          errorMsg = "Lỗi áp dụng khuyến mãi. Vui lòng kiểm tra mã khuyến mãi hoặc liên hệ admin.";
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      setSubmitStatus("error");
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    id,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    disabled?: boolean;
    id: string;
  }) => {
    const isOpen = openDropdowns[id] || false;

    return (
      <div className="custom-select">
        <button
          type="button"
          className={`select-trigger ${disabled ? "disabled" : ""}`}
          onClick={() => !disabled && toggleDropdown(id)}
          disabled={disabled}
          aria-label={value ? options.find((opt) => opt.value === value)?.label : placeholder}
        >
          <span className={value ? "" : "select-placeholder"}>
            {value ? options.find((opt) => opt.value === value)?.label : placeholder}
          </span>
          <ChevronDown className={`select-chevron ${isOpen ? "open" : ""}`} />
        </button>
        {isOpen && !disabled && (
          <div className="select-dropdown">
            {options.map((option) => (
              <div
                key={option.value}
                className="select-option"
                onClick={() => {
                  onChange(option.value);
                  toggleDropdown(id);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="error-message">
      <AlertTriangle className="error-icon" />
      <span>{message}</span>
    </div>
  );

  if (loadingData) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        {submitStatus && (
          <div className={`alert ${submitStatus === "success" ? "alert-success" : "alert-error"}`}>
            {submitStatus === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>
              {submitStatus === "success"
                ? "Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất."
                : errorMessage}
            </span>
          </div>
        )}

        <div className="booking-grid">
          <div>
            <div className="card">
              <nav className="tabs-nav">
                {[
                  { id: "customer", label: "Khách Hàng", icon: User },
                  { id: "booking", label: "Đặt Phòng", icon: Calendar },
                  { id: "rooms", label: "Phòng", icon: Hotel },
                  { id: "services", label: "Dịch Vụ", icon: Utensils },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                      aria-label={`Chuyển đến tab ${tab.label}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="tab-content">
                {activeTab === "customer" && (
                  <div>
                    <div className="form-grid form-grid-2 mb-4">
                      <div className="form-group">
                      <label htmlFor="cccd" className="form-label required">
                        Số CCCD/CMND
                      </label>
                      <input
                        id="cccd"
                        type="text"
                        placeholder="Nhập số CCCD/CMND"
                        className={`form-input ${validationErrors.customer.cccd ? "error" : ""}`}
                        value={bookingData.customer.cccd}
                        onChange={async (e) => {
                          const value = e.target.value;
                          handleCustomerChange("cccd", value);
                          if (validateCCCD(value) && value.length === 12) {
                            await checkExistingCustomer(value);
                          }
                        }}
                        onBlur={() => markFieldAsTouched("customer.cccd")}
                      />
                      {touchedFields["customer.cccd"] && validationErrors.customer.cccd && (
                        <ErrorMessage message={validationErrors.customer.cccd} />
                      )}
                    </div>
                      <div className="form-group">
                        <label htmlFor="name" className="form-label required">
                          Họ và tên
                        </label>
                        <input
                          id="name"
                          type="text"
                          placeholder="Nhập họ và tên"
                          className={`form-input ${validationErrors.customer.name ? "error" : ""}`}
                          value={bookingData.customer.name}
                          onChange={(e) => handleCustomerChange("name", e.target.value)}
                          onBlur={() => markFieldAsTouched("customer.name")}
                        />
                        {touchedFields["customer.name"] && validationErrors.customer.name && (
                          <ErrorMessage message={validationErrors.customer.name} />
                        )}
                      </div>
                    </div>

                    <div className="form-grid form-grid-2 mb-4">
                      <div className="form-group">
                        <label className="form-label required">Giới tính</label>
                        <CustomSelect
                          id="gender"
                          value={bookingData.customer.gender}
                          onChange={(value) => handleCustomerChange("gender", value)}
                          options={[
                            { value: "male", label: "Nam" },
                            { value: "female", label: "Nữ" },
                            { value: "other", label: "Khác" },
                          ]}
                          placeholder="Chọn giới tính"
                        />
                        {touchedFields["customer.gender"] && validationErrors.customer.gender && (
                          <ErrorMessage message={validationErrors.customer.gender} />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="dateOfBirth" className="form-label required">
                          Ngày sinh
                        </label>
                        <input
                          id="dateOfBirth"
                          type="date"
                          className={`form-input ${validationErrors.customer.dateOfBirth ? "error" : ""}`}
                          value={bookingData.customer.dateOfBirth}
                          onChange={(e) => handleCustomerChange("dateOfBirth", e.target.value)}
                          onBlur={() => markFieldAsTouched("customer.dateOfBirth")}
                        />
                        {touchedFields["customer.dateOfBirth"] && validationErrors.customer.dateOfBirth && (
                          <ErrorMessage message={validationErrors.customer.dateOfBirth} />
                        )}
                      </div>
                    </div>

                    <div className="form-grid form-grid-2 mb-4">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label required">
                          Email
                        </label>
                        <div className="form-input-icon">
                          <Mail className="icon" />
                          <input
                            id="email"
                            type="email"
                            placeholder="example@email.com"
                            className={`form-input ${validationErrors.customer.email ? "error" : ""}`}
                            value={bookingData.customer.email}
                            onChange={(e) => handleCustomerChange("email", e.target.value)}
                            onBlur={() => markFieldAsTouched("customer.email")}
                          />
                        </div>
                        {touchedFields["customer.email"] && validationErrors.customer.email && (
                          <ErrorMessage message={validationErrors.customer.email} />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label required">
                          Số điện thoại
                        </label>
                        <div className="form-input-icon">
                          <Phone className="icon" />
                          <input
                            id="phone"
                            type="tel"
                            placeholder="0123456789"
                            className={`form-input ${validationErrors.customer.phone ? "error" : ""}`}
                            value={bookingData.customer.phone}
                            onChange={(e) => handleCustomerChange("phone", e.target.value)}
                            onBlur={() => markFieldAsTouched("customer.phone")}
                          />
                        </div>
                        {touchedFields["customer.phone"] && validationErrors.customer.phone && (
                          <ErrorMessage message={validationErrors.customer.phone} />
                        )}
                      </div>
                    </div>

                    <div className="form-group mb-4">
                      <label htmlFor="address" className="form-label required">
                        Địa chỉ
                      </label>
                      <div className="form-input-icon">
                        <MapPin className="icon" />
                        <input
                          id="address"
                          type="text"
                          placeholder="Nhập địa chỉ đầy đủ"
                          className={`form-input ${validationErrors.customer.address ? "error" : ""}`}
                          value={bookingData.customer.address}
                          onChange={(e) => handleCustomerChange("address", e.target.value)}
                          onBlur={() => markFieldAsTouched("customer.address")}
                        />
                      </div>
                      {touchedFields["customer.address"] && validationErrors.customer.address && (
                        <ErrorMessage message={validationErrors.customer.address} />
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="note" className="form-label-note">
                        Ghi chú
                      </label>
                      <textarea
                        id="note"
                        placeholder="Ghi chú thêm (nếu có)"
                        className="form-textarea"
                        value={bookingData.customer.note}
                        onChange={(e) => handleCustomerChange("note", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "booking" && (
                  <div>
                    <div className="form-grid form-grid-3 mb-4">
                      <div className="form-group">
                        <label htmlFor="checkIn" className="form-label required">
                          Ngày nhận phòng
                        </label>
                        <input
                          id="checkIn"
                          type="date"
                          className={`form-input ${validationErrors.booking.checkInDate ? "error" : ""}`}
                          value={bookingData.checkInDate}
                          onChange={(e) => handleBookingChange("checkInDate", e.target.value)}
                          onBlur={() => markFieldAsTouched("booking.checkInDate")}
                          min={new Date().toISOString().split("T")[0]}
                        />
                        {touchedFields["booking.checkInDate"] && validationErrors.booking.checkInDate && (
                          <ErrorMessage message={validationErrors.booking.checkInDate} />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="checkOut" className="form-label required">
                          Ngày trả phòng
                        </label>
                        <input
                          id="checkOut"
                          type="date"
                          className={`form-input ${validationErrors.booking.checkOutDate ? "error" : ""}`}
                          value={bookingData.checkOutDate}
                          onChange={(e) => handleBookingChange("checkOutDate", e.target.value)}
                          onBlur={() => markFieldAsTouched("booking.checkOutDate")}
                          min={bookingData.checkInDate || new Date().toISOString().split("T")[0]}
                        />
                        {touchedFields["booking.checkOutDate"] && validationErrors.booking.checkOutDate && (
                          <ErrorMessage message={validationErrors.booking.checkOutDate} />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="deposit" className="form-label-deposit">
                          Tiền đặt cọc (VNĐ)
                        </label>
                        <div className="form-input-icon">
                          <CreditCard className="icon" />
                          <input
                            id="deposit"
                            type="number"
                            placeholder="0"
                            className={`form-input form-input-small ${validationErrors.booking.depositAmount ? "error" : ""}`}
                            value={bookingData.depositAmount}
                            onChange={(e) =>
                              handleBookingChange("depositAmount", e.target.value === "" ? "" : Number(e.target.value))
                            }
                            onBlur={() => markFieldAsTouched("booking.depositAmount")}
                          />
                        </div>
                        {touchedFields["booking.depositAmount"] && validationErrors.booking.depositAmount && (
                          <ErrorMessage message={validationErrors.booking.depositAmount} />
                        )}
                      </div>
                    </div>

                    {validationErrors.booking.dateRange && (
                      <div style={{ marginBottom: "1rem" }}>
                        <ErrorMessage message={validationErrors.booking.dateRange} />
                      </div>
                    )}

                    {calculateNights() > 0 && (
                      <div className="price-info price-info-blue">
                        <p>
                          <strong>Số đêm lưu trú:</strong> {calculateNights()} đêm
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "rooms" && (
                    <div>
                      {bookingData.rooms.map((room, index) => (
                        <div key={room.id} className="item-card">
                          <div className="item-header">
                            <span className="badge badge-secondary">Phòng #{index + 1}</span>
                            {bookingData.rooms.length > 1 && (
                              <button
                                onClick={() => removeRoom(room.id)}
                                className="btn btn-sm btn-outline"
                                aria-label={`Xóa phòng ${index + 1}`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="form-grid form-grid-3">
                            <div className="form-group">
                              <label htmlFor={`guests-${room.id}`} className="form-label required">
                                Số khách
                              </label>
                              <input
                                id={`guests-${room.id}`}
                                type="number"
                                min="1"
                                max="10"
                                className={`form-input form-input-small ${validationErrors.rooms[room.id]?.guests ? "error" : ""}`}
                                value={room.guests || ""}
                                onChange={(e) => handleRoomChange(room.id, "guests", Number(e.target.value) || 0)}
                                onBlur={() => markFieldAsTouched(`rooms.${room.id}.guests`)}
                                placeholder="Số khách"
                              />
                              {touchedFields[`rooms.${room.id}.guests`] && validationErrors.rooms[room.id]?.guests && (
                                <ErrorMessage message={validationErrors.rooms[room.id].guests!} />
                              )}
                            </div>
                            <div className="form-group">
                              <label className="form-label required">Loại phòng</label>
                              <CustomSelect
                                id={`room-type-${room.id}`}
                                value={room.type}
                                onChange={(value) => handleRoomChange(room.id, "type", value)}
                                options={getFilteredRoomTypes(room.guests || 0).map((type) => ({
                                  value: type.id.toString(),
                                  label: `${type.name} - ${parseFloat(type.base_rate).toLocaleString()} VNĐ/đêm (Tối đa ${type.max_occupancy} khách)`,
                                }))}
                                placeholder="Chọn loại phòng"
                                disabled={!room.guests || getFilteredRoomTypes(room.guests || 0).length === 0}
                              />
                              {touchedFields[`rooms.${room.id}.type`] && validationErrors.rooms[room.id]?.type && (
                                <ErrorMessage message={validationErrors.rooms[room.id].type!} />
                              )}
                            </div>
                            <div className="form-group">
                              <label className="form-label required">Số phòng</label>
                              <CustomSelect
                                id={`room-number-${room.id}`}
                                value={room.number}
                                onChange={(value) => handleRoomChange(room.id, "number", value)}
                                options={getAvailableRoomNumbers(room.type, room.id)}
                                placeholder="Chọn số phòng"
                                disabled={!room.type}
                              />
                              {touchedFields[`rooms.${room.id}.number`] && validationErrors.rooms[room.id]?.number && (
                                <ErrorMessage message={validationErrors.rooms[room.id].number!} />
                              )}
                            </div>
                          </div>

                          {room.price > 0 && (
                            <div className="price-info price-info-green">
                              <p>
                                <strong>Giá phòng:</strong> {room.price.toLocaleString()} VNĐ/đêm
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                      <button onClick={addRoom} className="btn btn-outline btn-full" aria-label="Thêm phòng mới">
                        <Plus className="w-4 h-4" />
                        Thêm phòng
                      </button>
                    </div>
                  )}

                {activeTab === "services" && (
                  <div>
                    {bookingData.services.length === 0 ? (
                      <div className="empty-state">
                        <Utensils className="empty-state-icon" />
                        <p className="empty-state-text">Chưa có dịch vụ nào được chọn</p>
                        <p className="empty-state-text" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                          Nhấn "Thêm dịch vụ" để bắt đầu chọn dịch vụ
                        </p>
                      </div>
                    ) : (
                      bookingData.services.map((service, index) => (
                        <div key={service.id} className="item-card">
                          <div className="item-header">
                            <span className="badge badge-success">Dịch vụ #{index + 1}</span>
                            <button
                              onClick={() => removeService(service.id)}
                              className="btn btn-sm btn-outline"
                              aria-label={`Xóa dịch vụ ${index + 1}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="service-form-grid">
                            <div className="form-group service-category">
                              <label className="form-label required">Danh mục dịch vụ</label>
                              <CustomSelect
                                id={`service-category-${service.id}`}
                                value={service.categoryId.toString()}
                                onChange={(value) => handleServiceChange(service.id, "categoryId", Number(value))}
                                options={serviceCategories.map((category) => ({
                                  value: category.id.toString(),
                                  label: category.name,
                                }))}
                                placeholder="Chọn danh mục dịch vụ"
                              />
                              {touchedFields[`services.${service.id}.categoryId`] &&
                                validationErrors.services[service.id]?.categoryId && (
                                  <ErrorMessage message={validationErrors.services[service.id].categoryId!} />
                                )}
                            </div>

                            <div className="form-group service-name">
                              <label className="form-label required">Dịch vụ</label>
                              <CustomSelect
                                id={`service-${service.id}`}
                                value={service.serviceId.toString()}
                                onChange={(value) => handleServiceChange(service.id, "serviceId", Number(value))}
                                options={getAvailableServices(service.categoryId.toString(), service.id)}
                                placeholder={service.categoryId ? "Chọn dịch vụ" : "Chọn danh mục trước"}
                                disabled={!service.categoryId}
                              />
                              {touchedFields[`services.${service.id}.serviceId`] &&
                                validationErrors.services[service.id]?.serviceId && (
                                  <ErrorMessage message={validationErrors.services[service.id].serviceId!} />
                                )}
                            </div>

                            <div className="form-group service-quantity">
                              <label htmlFor={`quantity-${service.id}`} className="form-label required">
                                Số lượng
                              </label>
                              <input
                                id={`quantity-${service.id}`}
                                type="number"
                                min="1"
                                max="10"
                                className={`form-input ${validationErrors.services[service.id]?.quantity ? "error" : ""}`}
                                value={service.quantity}
                                onChange={(e) => handleServiceChange(service.id, "quantity", Number(e.target.value))}
                                onBlur={() => markFieldAsTouched(`services.${service.id}.quantity`)}
                                disabled={!service.serviceId}
                                aria-label={`Số lượng dịch vụ ${index + 1}`}
                              />
                              {touchedFields[`services.${service.id}.quantity`] &&
                                validationErrors.services[service.id]?.quantity && (
                                  <ErrorMessage message={validationErrors.services[service.id].quantity!} />
                                )}
                            </div>
                          </div>

                          {service.price > 0 && (
                            <div className="price-info price-info-blue">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>
                                  <strong>Dịch vụ:</strong> {service.name}
                                </span>
                                <span>
                                  <strong>Tổng tiền:</strong> {(service.price * service.quantity).toLocaleString()} VNĐ
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    <button onClick={addService} className="btn btn-outline btn-full" aria-label="Thêm dịch vụ mới">
                      <Plus className="w-4 h-4" />
                      Thêm dịch vụ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card sticky">
              <div className="card-header">
                <h3 className="card-title">
                  <CreditCard className="w-5 h-5" />
                  Tóm Tắt Đặt Phòng
                </h3>
              </div>
              <div className="card-content">
                <div className="summary-stats">
                  <div className="stat-card stat-card-blue">
                    <div className="stat-number stat-number-blue">{bookingData.rooms.length}</div>
                    <div className="stat-label">Phòng</div>
                  </div>
                  <div className="stat-card stat-card-green">
                    <div className="stat-number stat-number-green">{bookingData.services.length}</div>
                    <div className="stat-label">Dịch vụ</div>
                  </div>
                  <div className="stat-card stat-card-purple">
                    <div className="stat-number stat-number-purple">{calculateNights()}</div>
                    <div className="stat-label">Đêm</div>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div>
                  <div className="summary-row">
                    <span>Tiền phòng:</span>
                    <span>
                      {bookingData.rooms
                        .reduce((sum, room) => sum + (room.price && room.number ? room.price * calculateNights() : 0), 0)
                        .toLocaleString()}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tiền dịch vụ:</span>
                    <span>
                      {bookingData.services
                        .reduce((sum, service) => sum + (service.price && service.quantity ? service.price * service.quantity : 0), 0)
                        .toLocaleString()}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tiền đặt cọc:</span>
                    <span>{bookingData.depositAmount.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="form-group">
                  <label className="form-label">Khuyến mãi</label>
                  <CustomSelect
                    id="promotion"
                    value={promotions.find((promo) => promo.code === bookingData.promotion_code)?.id.toString() || ""}
                    onChange={(value) => {
                      const selectedPromo = promotions.find((promo) => promo.id.toString() === value);
                      handlePromotionChange(value); // Gọi hàm hiện tại để cập nhật state
                      setBookingData((prev) => ({
                        ...prev,
                        promotion_code: selectedPromo ? selectedPromo.code : null,
                      }));
                    }}
                    options={[
                      { value: "", label: "Không áp dụng khuyến mãi" },
                      ...promotions.map((promo) => ({
                        value: promo.id.toString(),
                        label: `${promo.code} - ${promo.description} (${promo.discount_type === "percent" ? `${promo.discount_value}%` : `${promo.discount_value.toLocaleString()} VNĐ`})`,
                      })),
                    ]
                      .sort((a, b) => a.label.localeCompare(b.label))} // Sắp xếp theo alphabet
                    placeholder="Chọn khuyến mãi"
                  />
                </div>
                  {bookingData.promotion_code && (
                    <div className="summary-row">
                      <span>Giảm giá:</span>
                      <span>-{calculateDiscount().toLocaleString()} VNĐ</span>
                    </div>
                  )}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-total">
                  <span>Tổng tiền:</span>
                  <span className="total-amount">{calculateTotal().toLocaleString()} VNĐ</span>
                </div>

                {bookingData.checkInDate && bookingData.checkOutDate && (
                  <div className="date-info">
                    {new Date(bookingData.checkInDate).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(bookingData.checkOutDate).toLocaleDateString("vi-VN")}
                  </div>
                )}

                {bookingData.rooms.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                      Chi tiết phòng:
                    </h4>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {bookingData.rooms.map(
                        (room, index) =>
                          room.type && room.number && (
                            <div key={room.id} style={{ marginBottom: "0.25rem" }}>
                              {index + 1}. {roomTypes.find((rt) => rt.id.toString() === room.type)?.name} (Phòng{" "}
                              {room.number}) x {calculateNights()} đêm ={" "}
                              {(room.price * calculateNights()).toLocaleString()} VNĐ
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}

                {bookingData.services.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                      Chi tiết dịch vụ:
                    </h4>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {bookingData.services.map(
                        (service, index) =>
                          service.name && (
                            <div key={service.id} style={{ marginBottom: "0.25rem" }}>
                              {index + 1}. {service.name} x {service.quantity} ={" "}
                              {(service.price * service.quantity).toLocaleString()} VNĐ
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || loadingData}
                    className="btn btn-primary btn-full mb-4"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Hotel className="w-4 h-4" />
                        Đặt Phòng
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="btn btn-outline btn-full"
                    aria-label="Hủy bỏ đặt phòng"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}