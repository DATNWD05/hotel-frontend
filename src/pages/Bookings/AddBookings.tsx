/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, ChangeEvent, useRef } from "react";
import {
  User,
  Hotel,
  Plus,
  Minus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Upload,
  ChevronDown,
} from "lucide-react";
import "../../css/AddBookings.css";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// ====== Types ======
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
  cccdImage: File | null;
}

interface Room {
  id: string;
  type: string;
  number: string;
  price: number;
  roomId: number;
  guests?: number;
}

interface Promotion {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  status: string;
  is_active: boolean;
}

interface BookingData {
  customer: Customer;
  rooms: Room[];
  checkInDate: string;
  checkOutDate: string;
  depositAmount: number | "";
  promotion_code?: string | null;
  is_hourly: boolean;
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
    cccdImage?: string;
  };
  booking: {
    checkInDate?: string;
    checkOutDate?: string;
    depositAmount?: string;
    dateRange?: string;
    promotion?: string;
    is_hourly?: string;
  };
  rooms: { [key: string]: { guests?: string; type?: string; number?: string } };
}

interface RoomType {
  id: number;
  name: string;
  base_rate: string;
  hourly_rate?: string;
  max_occupancy: number;
}

interface RoomNumber {
  id: number;
  room_number: string;
  room_type_id: number;
  status: string;
}

// ====== CustomSelect Component ======
const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id,
  validationErrors = {}, // Thêm prop validationErrors
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  id: string;
  validationErrors?: { [key: string]: string };
}) => {
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});
  const [dropdownPosition, setDropdownPosition] = useState<"below" | "above">(
    "below"
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isOpen = openDropdowns[id] || false;

  useEffect(() => {
    if (isOpen && triggerRef.current && dropdownRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight || 200; // Fallback nếu chưa render
      const viewportHeight = window.innerHeight;

      // Tính không gian dưới và trên
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      // Mở lên trên nếu không đủ không gian dưới và đủ không gian trên
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("above");
      } else {
        setDropdownPosition("below");
      }
    }
  }, [isOpen]);

  return (
    <div className="custom-select">
      <button
        ref={triggerRef}
        type="button"
        className={`select-trigger ${disabled ? "disabled" : ""} ${
          validationErrors[id] ? "error" : ""
        }`}
        onClick={() => !disabled && toggleDropdown(id)}
        disabled={disabled}
        aria-label={
          value
            ? options.find((opt) => opt.value === value)?.label
            : placeholder
        }
      >
        <span className={value ? "" : "select-placeholder"}>
          {value
            ? options.find((opt) => opt.value === value)?.label
            : placeholder}
        </span>
        <ChevronDown className={`select-chevron ${isOpen ? "open" : ""}`} />
      </button>
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className={`select-dropdown ${
            dropdownPosition === "above" ? "dropdown-above" : ""
          }`}
        >
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

// ====== Component ======
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
      cccdImage: null,
    },
    rooms: [{ id: "1", type: "", number: "", price: 0, roomId: 0, guests: 0 }],
    checkInDate: "",
    checkOutDate: "",
    depositAmount: "",
    promotion_code: null,
    is_hourly: false,
  });

  const [activeTab, setActiveTab] = useState("customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    customer: {},
    booking: {},
    rooms: {},
  });
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({});
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{
    [key: string]: RoomNumber[];
  }>({});
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const isPromotionValid = (promo: Promotion): boolean => {
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    return (
      promo.is_active &&
      promo.status === "active" &&
      startDate <= now &&
      endDate >= now &&
      promo.used_count < promo.usage_limit
    );
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingData(true);
      try {
        const [roomTypesRes, promotionsRes] = await Promise.all([
          api.get("/room-types"),
          api.get("/promotions"),
        ]);

        const typesData = roomTypesRes.data.data || roomTypesRes.data;
        if (Array.isArray(typesData)) {
          setRoomTypes(typesData);
        } else {
          throw new Error("Dữ liệu từ /room-types không hợp lệ");
        }

        const promotionsData = promotionsRes.data.data || promotionsRes.data;
        if (Array.isArray(promotionsData)) {
          const validPromotions = promotionsData.filter((promo: Promotion) =>
            isPromotionValid(promo)
          );
          setPromotions(validPromotions);
        } else {
          throw new Error("Dữ liệu từ /promotions không hợp lệ");
        }
      } catch (error: any) {
        setErrorMessage(
          "Lỗi khi tải dữ liệu: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setLoadingData(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (!bookingData.checkInDate || !bookingData.checkOutDate) return;

      setLoadingRooms(true);
      try {
        const formattedCheckIn = formatDateTime(bookingData.checkInDate, true);
        const formattedCheckOut = formatDateTime(
          bookingData.checkOutDate,
          false
        );

        const response = await api.post("/available-rooms", {
          check_in_date: formattedCheckIn,
          check_out_date: formattedCheckOut,
          is_hourly: bookingData.is_hourly,
        });

        const roomsData = response.data.data || response.data;

        if (!Array.isArray(roomsData)) {
          throw new Error("Dữ liệu từ /available-rooms không hợp lệ");
        }

        const groupedRooms = roomsData.reduce(
          (acc: { [key: string]: RoomNumber[] }, room: RoomNumber) => {
            const typeId = room.room_type_id.toString();
            if (!acc[typeId]) acc[typeId] = [];
            acc[typeId].push(room);
            return acc;
          },
          {}
        );

        setRoomNumbers(groupedRooms);

        setBookingData((prev) => ({
          ...prev,
          rooms: prev.rooms.map((room) => {
            const availableRooms = groupedRooms[room.type] || [];
            const isSelectedRoomAvailable = availableRooms.some(
              (r: RoomNumber) => r.room_number === room.number
            );

            if (!isSelectedRoomAvailable) {
              return { ...room, type: "", number: "", price: 0, roomId: 0 };
            }
            return room;
          }),
        }));
      } catch (error: any) {
        setErrorMessage(
          "Lỗi khi tải phòng khả dụng: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchAvailableRooms();
  }, [
    bookingData.checkInDate,
    bookingData.checkOutDate,
    bookingData.is_hourly,
  ]);

  useEffect(() => {
    const totalRoomPrice = bookingData.rooms.reduce((sum, room) => {
      return room.price && room.number
        ? sum + room.price * calculateDuration()
        : sum;
    }, 0);
    const calculatedDeposit = Math.round(totalRoomPrice * 0.1);
    setBookingData((prev) => ({
      ...prev,
      depositAmount: calculatedDeposit > 0 ? calculatedDeposit : "",
    }));
  }, [
    bookingData.rooms,
    bookingData.checkInDate,
    bookingData.checkOutDate,
    bookingData.is_hourly,
  ]);

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

    const provinceCode = value.substring(0, 3);
    const validProvinceCodes = [
      "001",
      "002",
      "004",
      "006",
      "008",
      "010",
      "011",
      "012",
      "014",
      "015",
      "017",
      "019",
      "020",
      "022",
      "024",
      "025",
      "026",
      "027",
      "030",
      "031",
      "033",
      "034",
      "035",
      "036",
      "037",
      "038",
      "040",
      "042",
      "044",
      "045",
      "046",
      "048",
      "049",
      "051",
      "052",
      "054",
      "056",
      "058",
      "060",
      "062",
      "064",
      "066",
      "067",
      "068",
      "070",
      "072",
      "074",
      "075",
      "077",
      "079",
      "080",
      "082",
      "083",
      "084",
      "086",
      "087",
      "089",
      "091",
      "092",
      "093",
      "094",
      "095",
      "096",
    ];

    if (!validProvinceCodes.includes(provinceCode)) return false;

    const genderCentury = parseInt(value.charAt(3), 10);
    if (genderCentury < 0 || genderCentury > 3) return false;

    return true;
  };

  const validateCustomerField = (
    field: keyof Customer,
    value: string | File | null
  ) => {
    const errors = { ...validationErrors };

    switch (field) {
      case "cccd": {
        const trimmed = (value as string).trim();
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
        if (!(value as string).trim()) {
          errors.customer.name = "Vui lòng nhập họ và tên";
        } else if ((value as string).trim().length < 2) {
          errors.customer.name = "Họ và tên phải có ít nhất 2 ký tự";
        } else {
          delete errors.customer.name;
        }
        break;
      case "gender":
        if (!(value as string)) {
          errors.customer.gender = "Vui lòng chọn giới tính";
        } else {
          delete errors.customer.gender;
        }
        break;
      case "email":
        if (!(value as string).trim()) {
          errors.customer.email = "Vui lòng nhập email";
        } else if (!validateEmail(value as string)) {
          errors.customer.email = "Email không hợp lệ";
        } else {
          delete errors.customer.email;
        }
        break;
      case "phone":
        if (!(value as string).trim()) {
          errors.customer.phone = "Vui lòng nhập số điện thoại";
        } else if (!validatePhone(value as string)) {
          errors.customer.phone = "Số điện thoại không hợp lệ (10-11 chữ số)";
        } else {
          delete errors.customer.phone;
        }
        break;
      case "dateOfBirth":
        if (!(value as string)) {
          errors.customer.dateOfBirth = "Vui lòng chọn ngày sinh";
        } else {
          const birthDate = new Date(value as string);
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
        if (!(value as string).trim()) {
          errors.customer.address = "Vui lòng nhập địa chỉ";
        } else if ((value as string).trim().length < 10) {
          errors.customer.address = "Vui lòng nhập đầy đủ địa chỉ";
        } else {
          delete errors.customer.address;
        }
        break;
      case "cccdImage":
        if (value) {
          const file = value as File;
          const validTypes = ["image/jpeg", "image/png", "image/jpg"];
          if (!validTypes.includes(file.type)) {
            errors.customer.cccdImage =
              "Ảnh CCCD phải có định dạng JPEG, PNG hoặc JPG";
          } else if (file.size > 5 * 1024 * 1024) {
            errors.customer.cccdImage =
              "Kích thước ảnh không được vượt quá 5MB";
          } else {
            delete errors.customer.cccdImage;
          }
        } else {
          delete errors.customer.cccdImage;
        }
        break;
    }

    setValidationErrors(errors);
  };

  const validateBookingField = (
    field: string,
    value: string | number | boolean | ""
  ) => {
    const errors = { ...validationErrors };
    const now = new Date();

    switch (field) {
      case "checkInDate": {
        if (!value) {
          errors.booking.checkInDate = "Vui lòng chọn thời gian nhận phòng";
        } else {
          const checkInDate = new Date(formatDateTime(value as string, true));
          if (checkInDate < now) {
            errors.booking.checkInDate =
              "Thời gian nhận phòng không thể là quá khứ";
          } else {
            delete errors.booking.checkInDate;
          }
        }
        break;
      }
      case "checkOutDate": {
        if (!value) {
          errors.booking.checkOutDate = "Vui lòng chọn thời gian trả phòng";
        } else if (bookingData.checkInDate) {
          const checkInDate = new Date(
            formatDateTime(bookingData.checkInDate, true)
          );
          const checkOutDate = new Date(formatDateTime(value as string, false));
          const now = new Date();

          if (checkOutDate <= checkInDate) {
            errors.booking.checkOutDate =
              "Thời gian trả phòng phải sau thời gian nhận phòng";
          } else if (checkOutDate < now) {
            errors.booking.checkOutDate =
              "Thời gian trả phòng không thể là quá khứ";
          } else {
            delete errors.booking.checkOutDate;
          }
        }
        break;
      }
      case "promotion":
        if (value) {
          const selectedPromotion = promotions.find(
            (promo) => promo.code === value
          );
          if (!selectedPromotion || !isPromotionValid(selectedPromotion)) {
            errors.booking.promotion =
              "Mã khuyến mãi không hợp lệ, đã hết hạn hoặc đã hết lượt sử dụng";
          } else {
            delete errors.booking.promotion;
          }
        } else {
          delete errors.booking.promotion;
        }
        break;
      case "is_hourly":
        delete errors.booking.is_hourly;
        break;
    }

    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkInDate = new Date(
        formatDateTime(bookingData.checkInDate, true)
      );
      const checkOutDate = new Date(
        formatDateTime(bookingData.checkOutDate, false)
      );
      const diffHours =
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
      const diffDays = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (bookingData.is_hourly && diffHours > 24) {
        errors.booking.dateRange =
          "Thời gian lưu trú theo giờ không được vượt quá 24 giờ";
      } else if (!bookingData.is_hourly && diffDays < 1) {
        errors.booking.dateRange =
          "Thời gian lưu trú theo ngày phải ít nhất 1 đêm";
      } else if (!bookingData.is_hourly && diffDays > 30) {
        errors.booking.dateRange =
          "Thời gian lưu trú theo ngày không được vượt quá 30 ngày";
      } else {
        delete errors.booking.dateRange;
      }
    }

    setValidationErrors(errors);
  };

  const validateRoomField = (
    roomId: string,
    field: keyof Room,
    value: string
  ) => {
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

  const markFieldAsTouched = (fieldPath: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const formatDateTime = (date: string, isCheckIn: boolean): string => {
    if (!date) return "";

    if (bookingData.is_hourly) {
      return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
    }

    if (isCheckIn) {
      return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
    } else {
      return dayjs(date).format("YYYY-MM-DD 12:00:00");
    }
  };

  const calculateDuration = () => {
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkIn = dayjs(formatDateTime(bookingData.checkInDate, true));
      const checkOut = dayjs(formatDateTime(bookingData.checkOutDate, false));

      if (bookingData.is_hourly) {
        const hours = Math.ceil(checkOut.diff(checkIn, "minute") / 60);
        return Math.max(1, hours);
      } else {
        const nights = checkOut
          .startOf("day")
          .diff(checkIn.startOf("day"), "day");
        return Math.max(1, nights);
      }
    }
    return 0;
  };

  const calculateSubtotal = () => {
    return bookingData.rooms.reduce((sum, room) => {
      return room.price && room.number
        ? sum + room.price * calculateDuration()
        : sum;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!bookingData.promotion_code) return 0;

    const selectedPromotion = promotions.find(
      (promo) => promo.code === bookingData.promotion_code
    );
    if (!selectedPromotion || !isPromotionValid(selectedPromotion)) return 0;

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

  const handleCustomerChange = (
    field: keyof Customer,
    value: string | File | null
  ) => {
    setBookingData((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));

    markFieldAsTouched(`customer.${field}`);
    if (field === "cccdImage") {
      validateCustomerField(field, value as File | null);
    } else {
      validateCustomerField(field, value as string);
    }
  };

  const handleCccdImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleCustomerChange("cccdImage", file);
  };

  const getFilteredRoomTypes = (guests: number) => {
    return roomTypes.filter(
      (type) => type.max_occupancy >= guests && guests > 0
    );
  };

  const getAvailableRoomNumbers = (roomType: string, currentRoomId: string) => {
    if (!roomType || !roomNumbers[roomType]) {
      return [];
    }

    const selectedRoomNumbers = bookingData.rooms
      .filter((r) => r.id !== currentRoomId && r.type === roomType && r.number)
      .map((r) => r.number);

    return roomNumbers[roomType]
      .filter((room) => !selectedRoomNumbers.includes(room.room_number))
      .map((room) => ({
        value: room.room_number,
        label: `Phòng ${room.room_number}`,
      }));
  };

  const handleBookingChange = (
    field: string,
    value: string | number | boolean | ""
  ) => {
    setBookingData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };
      if (field === "is_hourly" && value === true) {
        newData.checkInDate = "";
        newData.checkOutDate = "";
        newData.rooms = prev.rooms.map((room) => ({
          ...room,
          type: "",
          number: "",
          price: 0,
          roomId: 0,
        }));
      }
      return newData;
    });

    markFieldAsTouched(`booking.${field}`);
    validateBookingField(field, value);
  };

  const handlePromotionChange = (value: string) => {
    const selectedPromotion = promotions.find(
      (promo) => promo.id.toString() === value
    );
    const promotionCode = selectedPromotion ? selectedPromotion.code : null;

    setBookingData((prev) => ({
      ...prev,
      promotion_code: promotionCode,
    }));

    markFieldAsTouched("booking.promotion");
    validateBookingField("promotion", promotionCode || "");
  };

  const handleRoomChange = (
    roomId: string,
    field: keyof Room,
    value: string | number
  ) => {
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
            const selectedType = roomTypes.find(
              (rt) => rt.id.toString() === value.toString()
            );
            return {
              ...room,
              type: selectedType ? selectedType.id.toString() : "",
              number: "",
              price: selectedType
                ? parseFloat(
                    bookingData.is_hourly
                      ? selectedType.hourly_rate || "0"
                      : selectedType.base_rate
                  )
                : 0,
              roomId: 0,
            };
          }
          if (field === "number") {
            const selectedRoom = roomNumbers[room.type]?.find(
              (rn) => rn.room_number === value.toString()
            );
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
    try {
      const response = await api.get(`/customers/check-cccd/${cccd}`);
      const { status, data } = response.data;

      if (status === "exists" && data && data.id) {
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
            nationality: data.nationality || "Vietnamese",
            address: data.address || "",
            note: data.note || "",
            cccdImage: null,
          },
        }));
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        setErrorMessage(
          "Lỗi khi kiểm tra CCCD: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const validateAllFields = (): boolean => {
    let isValid = true;

    Object.keys(bookingData.customer).forEach((key) => {
      const field = key as keyof Customer;
      if (
        field !== "note" &&
        field !== "nationality" &&
        field !== "cccdImage"
      ) {
        validateCustomerField(field, bookingData.customer[field]);
        markFieldAsTouched(`customer.${field}`);
      }
    });

    validateCustomerField("cccdImage", bookingData.customer.cccdImage);
    markFieldAsTouched("customer.cccdImage");

    validateBookingField("checkInDate", bookingData.checkInDate);
    validateBookingField("checkOutDate", bookingData.checkOutDate);
    validateBookingField("depositAmount", bookingData.depositAmount);
    validateBookingField("promotion", bookingData.promotion_code || "");
    validateBookingField("is_hourly", bookingData.is_hourly);
    markFieldAsTouched("booking.checkInDate");
    markFieldAsTouched("booking.checkOutDate");
    markFieldAsTouched("booking.depositAmount");
    markFieldAsTouched("booking.promotion");
    markFieldAsTouched("booking.is_hourly");

    bookingData.rooms.forEach((room) => {
      validateRoomField(room.id, "guests", room.guests?.toString() || "");
      validateRoomField(room.id, "type", room.type);
      validateRoomField(room.id, "number", room.number);
      markFieldAsTouched(`rooms.${room.id}.guests`);
      markFieldAsTouched(`rooms.${room.id}.type`);
      markFieldAsTouched(`rooms.${room.id}.number`);
    });

    const hasErrors =
      Object.keys(validationErrors.customer).length > 0 ||
      Object.keys(validationErrors.booking).length > 0 ||
      Object.keys(validationErrors.rooms).length > 0;

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
      const now = new Date();
      const checkIn = new Date(formatDateTime(bookingData.checkInDate, true));
      const checkOut = new Date(
        formatDateTime(bookingData.checkOutDate, false)
      );

      if (!bookingData.checkInDate || !bookingData.checkOutDate) {
        throw new Error("Vui lòng chọn đầy đủ thời gian nhận/trả phòng.");
      }

      if (checkIn < now) {
        throw new Error("Không thể đặt vì thời gian nhận phòng đã qua.");
      }
      if (checkOut < now) {
        throw new Error("Không thể đặt vì thời gian trả phòng đã qua.");
      }

      const validRoomIds = bookingData.rooms
        .filter(
          (room) =>
            room.number &&
            roomNumbers[room.type]?.some((rn) => rn.room_number === room.number)
        )
        .map((room) => {
          const selectedRoom = roomNumbers[room.type]?.find(
            (rn) => rn.room_number === room.number
          );
          return selectedRoom ? selectedRoom.id : 0;
        })
        .filter((id) => id !== 0);

      if (validRoomIds.length === 0) {
        throw new Error("Vui lòng chọn ít nhất một phòng hợp lệ");
      }

      const formattedCheckIn = formatDateTime(bookingData.checkInDate, true);
      const formattedCheckOut = formatDateTime(bookingData.checkOutDate, false);

      const validateResponse = await api.post("/bookings/validate-rooms", {
        room_ids: validRoomIds,
        check_in_date: formattedCheckIn,
        check_out_date: formattedCheckOut,
        is_hourly: bookingData.is_hourly,
      });

      if (validateResponse.data.status === "invalid") {
        const unavailableRooms = validateResponse.data.unavailable_rooms
          .map((room: any) => `Phòng ${room.room_number}`)
          .join(", ");
        throw new Error(
          `Các phòng không khả dụng: ${unavailableRooms}. Vui lòng chọn phòng khác.`
        );
      }

      const formData = new FormData();
      formData.append("customer[cccd]", bookingData.customer.cccd.trim());
      formData.append("customer[name]", bookingData.customer.name.trim());
      formData.append("customer[gender]", bookingData.customer.gender);
      formData.append("customer[email]", bookingData.customer.email.trim());
      formData.append("customer[phone]", bookingData.customer.phone.trim());
      formData.append(
        "customer[date_of_birth]",
        bookingData.customer.dateOfBirth
      );
      formData.append(
        "customer[nationality]",
        bookingData.customer.nationality.trim()
      );
      formData.append("customer[address]", bookingData.customer.address.trim());
      if (bookingData.customer.note.trim()) {
        formData.append("customer[note]", bookingData.customer.note.trim());
      }
      if (bookingData.customer.cccdImage) {
        formData.append("customer[cccd_image]", bookingData.customer.cccdImage);
      }
      validRoomIds.forEach((id, index) => {
        formData.append(`room_ids[${index}]`, id.toString());
      });
      formData.append("check_in_date", formattedCheckIn);
      formData.append("check_out_date", formattedCheckOut);
      formData.append(
        "deposit_amount",
        (bookingData.depositAmount || 0).toString()
      );
      formData.append("is_hourly", bookingData.is_hourly ? "1" : "0");
      if (bookingData.promotion_code) {
        formData.append("promotion_code", bookingData.promotion_code);
      }

      const bookingRes = await api.post("/bookings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const bookingResponseData = bookingRes.data;

      if (
        !bookingResponseData ||
        (!bookingResponseData.id && !bookingResponseData.data?.id)
      ) {
        throw new Error("Response không hợp lệ: Không tìm thấy booking ID");
      }

      setSubmitStatus("success");
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      let errorMsg = "Có lỗi xảy ra khi đặt phòng";
      if (error.response?.data?.errors) {
        errorMsg = Object.values(error.response.data.errors).flat().join(", ");
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
        if (errorMsg.includes("Phòng ID")) {
          const roomIdMatch = errorMsg.match(/Phòng ID (\d+)/);
          if (roomIdMatch && roomIdMatch[1]) {
            const roomId = roomIdMatch[1];
            let roomNumber = "không xác định";
            Object.values(roomNumbers).forEach((rooms) => {
              const foundRoom = rooms.find(
                (room) => room.id.toString() === roomId
              );
              if (foundRoom) {
                roomNumber = foundRoom.room_number;
              }
            });
            errorMsg = `Phòng ${roomNumber} đã được đặt trong thời gian này.`;
          }
        } else if (errorMsg.toLowerCase().includes("cccd")) {
          errorMsg = "Số CCCD/CMND đã tồn tại. Vui lòng kiểm tra lại.";
        } else if (errorMsg.includes("promotion")) {
          errorMsg =
            "Mã khuyến mãi không hợp lệ hoặc đã hết lượt sử dụng. Vui lòng chọn mã khác.";
        } else if (errorMsg.includes("cccd_image")) {
          errorMsg =
            "Lỗi khi upload ảnh CCCD: Vui lòng kiểm tra định dạng hoặc kích thước file.";
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
          <div
            className={`alert ${
              submitStatus === "success" ? "alert-success" : "alert-error"
            }`}
          >
            {submitStatus === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>
              {submitStatus === "success"
                ? "Đặt phòng thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="inline-block pb-1 mb-4 text-3xl font-bold text-gray-800 border-b-4 border-blue-500">
          Đặt Phòng Khách Sạn Hobilo
        </h3>

        <div className="booking-grid">
          <div>
            <div className="card">
              <nav className="tabs-nav">
                {[
                  { id: "customer", label: "Khách Hàng", icon: User },
                  { id: "booking", label: "Đặt Phòng & Phòng", icon: Hotel },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-button ${
                        activeTab === tab.id ? "active" : ""
                      }`}
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
                    <div className="mb-4 form-grid form-grid-2">
                      <div className="form-group">
                        <label htmlFor="cccd" className="form-label required">
                          Số CCCD/CMND
                        </label>
                        <input
                          id="cccd"
                          type="text"
                          placeholder="Nhập số CCCD/CMND"
                          className={`form-input ${
                            validationErrors.customer.cccd ? "error" : ""
                          }`}
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
                        {touchedFields["customer.cccd"] &&
                          validationErrors.customer.cccd && (
                            <ErrorMessage
                              message={validationErrors.customer.cccd}
                            />
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
                          className={`form-input ${
                            validationErrors.customer.name ? "error" : ""
                          }`}
                          value={bookingData.customer.name}
                          onChange={(e) =>
                            handleCustomerChange("name", e.target.value)
                          }
                          onBlur={() => markFieldAsTouched("customer.name")}
                        />
                        {touchedFields["customer.name"] &&
                          validationErrors.customer.name && (
                            <ErrorMessage
                              message={validationErrors.customer.name}
                            />
                          )}
                      </div>
                    </div>

                    <div className="mb-4 form-grid form-grid-2">
                      <div className="form-group">
                        <label className="form-label required">Giới tính</label>
                        <CustomSelect
                          id="gender"
                          value={bookingData.customer.gender}
                          onChange={(value) =>
                            handleCustomerChange("gender", value)
                          }
                          options={[
                            { value: "male", label: "Nam" },
                            { value: "female", label: "Nữ" },
                            { value: "other", label: "Khác" },
                          ]}
                          placeholder="Chọn giới tính"
                          validationErrors={validationErrors.customer}
                        />
                        {touchedFields["customer.gender"] &&
                          validationErrors.customer.gender && (
                            <ErrorMessage
                              message={validationErrors.customer.gender}
                            />
                          )}
                      </div>
                      <div className="form-group">
                        <label
                          htmlFor="dateOfBirth"
                          className="form-label required"
                        >
                          Ngày sinh
                        </label>
                        <input
                          id="dateOfBirth"
                          type="date"
                          className={`form-input ${
                            validationErrors.customer.dateOfBirth ? "error" : ""
                          }`}
                          value={bookingData.customer.dateOfBirth}
                          onChange={(e) =>
                            handleCustomerChange("dateOfBirth", e.target.value)
                          }
                          onBlur={() =>
                            markFieldAsTouched("customer.dateOfBirth")
                          }
                        />
                        {touchedFields["customer.dateOfBirth"] &&
                          validationErrors.customer.dateOfBirth && (
                            <ErrorMessage
                              message={validationErrors.customer.dateOfBirth}
                            />
                          )}
                      </div>
                    </div>

                    <div className="mb-4 form-grid form-grid-2">
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
                            className={`form-input ${
                              validationErrors.customer.email ? "error" : ""
                            }`}
                            value={bookingData.customer.email}
                            onChange={(e) =>
                              handleCustomerChange("email", e.target.value)
                            }
                            onBlur={() => markFieldAsTouched("customer.email")}
                          />
                        </div>
                        {touchedFields["customer.email"] &&
                          validationErrors.customer.email && (
                            <ErrorMessage
                              message={validationErrors.customer.email}
                            />
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
                            className={`form-input ${
                              validationErrors.customer.phone ? "error" : ""
                            }`}
                            value={bookingData.customer.phone}
                            onChange={(e) =>
                              handleCustomerChange("phone", e.target.value)
                            }
                            onBlur={() => markFieldAsTouched("customer.phone")}
                          />
                        </div>
                        {touchedFields["customer.phone"] &&
                          validationErrors.customer.phone && (
                            <ErrorMessage
                              message={validationErrors.customer.phone}
                            />
                          )}
                      </div>
                    </div>

                    <div className="mb-4 form-grid form-grid-2">
                      <div className="form-group">
                        <label
                          htmlFor="address"
                          className="form-label required"
                        >
                          Địa chỉ
                        </label>
                        <div className="form-input-icon">
                          <MapPin className="icon" />
                          <input
                            id="address"
                            type="text"
                            placeholder="Nhập địa chỉ đầy đủ"
                            className={`form-input ${
                              validationErrors.customer.address ? "error" : ""
                            }`}
                            value={bookingData.customer.address}
                            onChange={(e) =>
                              handleCustomerChange("address", e.target.value)
                            }
                            onBlur={() =>
                              markFieldAsTouched("customer.address")
                            }
                          />
                        </div>
                        {touchedFields["customer.address"] &&
                          validationErrors.customer.address && (
                            <ErrorMessage
                              message={validationErrors.customer.address}
                            />
                          )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="cccdImage" className="form-label">
                          Ảnh CCCD/CMND
                        </label>
                        <div className="form-input-icon">
                          <Upload className="icon" />
                          <input
                            id="cccdImage"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className={`form-input ${
                              validationErrors.customer.cccdImage ? "error" : ""
                            }`}
                            onChange={handleCccdImageChange}
                            onBlur={() =>
                              markFieldAsTouched("customer.cccdImage")
                            }
                          />
                        </div>
                        {touchedFields["customer.cccdImage"] &&
                          validationErrors.customer.cccdImage && (
                            <ErrorMessage
                              message={validationErrors.customer.cccdImage}
                            />
                          )}
                        {bookingData.customer.cccdImage && (
                          <div className="mt-2 text-sm text-gray-600">
                            File đã chọn: {bookingData.customer.cccdImage.name}
                          </div>
                        )}
                      </div>
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
                        onChange={(e) =>
                          handleCustomerChange("note", e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}

                {activeTab === "booking" && (
                  <div>
                    <div className="mb-4 form-group">
                      <label className="form-label required">
                        Loại đặt phòng
                      </label>
                      <CustomSelect
                        id="is_hourly"
                        value={bookingData.is_hourly ? "hourly" : "daily"}
                        onChange={(value) =>
                          handleBookingChange("is_hourly", value === "hourly")
                        }
                        options={[
                          { value: "daily", label: "Theo ngày" },
                          { value: "hourly", label: "Theo giờ" },
                        ]}
                        placeholder="Chọn loại đặt phòng"
                        validationErrors={validationErrors.booking}
                      />
                      {touchedFields["booking.is_hourly"] &&
                        validationErrors.booking.is_hourly && (
                          <ErrorMessage
                            message={validationErrors.booking.is_hourly}
                          />
                        )}
                    </div>

                    <div className="mb-6 form-grid form-grid-3">
                      <div className="form-group">
                        <label
                          htmlFor="checkIn"
                          className="form-label required"
                        >
                          Thời gian nhận phòng
                        </label>
                        <input
                          id="checkIn"
                          type="datetime-local"
                          className={`form-input ${
                            validationErrors.booking.checkInDate ? "error" : ""
                          }`}
                          value={bookingData.checkInDate}
                          onChange={(e) =>
                            handleBookingChange("checkInDate", e.target.value)
                          }
                          onBlur={() =>
                            markFieldAsTouched("booking.checkInDate")
                          }
                          min={dayjs().format("YYYY-MM-DDTHH:mm")}
                        />
                        {touchedFields["booking.checkInDate"] &&
                          validationErrors.booking.checkInDate && (
                            <ErrorMessage
                              message={validationErrors.booking.checkInDate}
                            />
                          )}
                      </div>
                      <div className="form-group">
                        <label
                          htmlFor="checkOut"
                          className="form-label required"
                        >
                          Thời gian trả phòng
                        </label>
                        <input
                          id="checkOut"
                          type="datetime-local"
                          className={`form-input ${
                            validationErrors.booking.checkOutDate ? "error" : ""
                          }`}
                          value={bookingData.checkOutDate}
                          onChange={(e) =>
                            handleBookingChange(
                              "checkOutDate",
                              bookingData.is_hourly
                                ? e.target.value
                                : formatDateTime(e.target.value, false)
                            )
                          }
                          onBlur={() =>
                            markFieldAsTouched("booking.checkOutDate")
                          }
                          min={
                            bookingData.checkInDate ||
                            dayjs().format("YYYY-MM-DDTHH:mm")
                          }
                        />
                        {touchedFields["booking.checkOutDate"] &&
                          validationErrors.booking.checkOutDate && (
                            <ErrorMessage
                              message={validationErrors.booking.checkOutDate}
                            />
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
                            className={`form-input form-input-small ${
                              validationErrors.booking.depositAmount
                                ? "error"
                                : ""
                            }`}
                            value={bookingData.depositAmount}
                            onChange={(e) =>
                              handleBookingChange(
                                "depositAmount",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            onBlur={() =>
                              markFieldAsTouched("booking.depositAmount")
                            }
                          />
                        </div>
                        {touchedFields["booking.depositAmount"] &&
                          validationErrors.booking.depositAmount && (
                            <ErrorMessage
                              message={validationErrors.booking.depositAmount}
                            />
                          )}
                      </div>
                    </div>

                    {validationErrors.booking.dateRange && (
                      <div className="mb-4">
                        <ErrorMessage
                          message={validationErrors.booking.dateRange}
                        />
                      </div>
                    )}

                    {calculateDuration() > 0 && (
                      <div className="mb-4 price-info price-info-blue">
                        <p>
                          <strong>Thời gian lưu trú:</strong>{" "}
                          {calculateDuration()}{" "}
                          {bookingData.is_hourly ? "giờ" : "đêm"}
                        </p>
                      </div>
                    )}

                    {bookingData.rooms.map((room, index) => (
                      <div key={room.id} className="mb-4 item-card">
                        <div className="item-header">
                          <span className="badge badge-secondary">
                            Phòng #{index + 1}
                          </span>
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
                            <label
                              htmlFor={`guests-${room.id}`}
                              className="form-label required"
                            >
                              Số khách
                            </label>
                            <input
                              id={`guests-${room.id}`}
                              type="number"
                              min="1"
                              max="10"
                              className={`form-input form-input-small ${
                                validationErrors.rooms[room.id]?.guests
                                  ? "error"
                                  : ""
                              }`}
                              value={room.guests || ""}
                              onChange={(e) =>
                                handleRoomChange(
                                  room.id,
                                  "guests",
                                  Number(e.target.value) || 0
                                )
                              }
                              onBlur={() =>
                                markFieldAsTouched(`rooms.${room.id}.guests`)
                              }
                              placeholder="Số khách"
                            />
                            {touchedFields[`rooms.${room.id}.guests`] &&
                              validationErrors.rooms[room.id]?.guests && (
                                <ErrorMessage
                                  message={
                                    validationErrors.rooms[room.id].guests!
                                  }
                                />
                              )}
                          </div>
                          <div className="form-group">
                            <label className="form-label required">
                              Loại phòng
                            </label>
                            {loadingRooms ? (
                              <div className="loading">
                                Đang tải loại phòng...
                              </div>
                            ) : (
                              <CustomSelect
                                id={`room-type-${room.id}`}
                                value={room.type}
                                onChange={(value) =>
                                  handleRoomChange(room.id, "type", value)
                                }
                                options={getFilteredRoomTypes(
                                  room.guests || 0
                                ).map((type) => ({
                                  value: type.id.toString(),
                                  label: `${type.name} - ${parseFloat(
                                    bookingData.is_hourly
                                      ? type.hourly_rate || "0"
                                      : type.base_rate
                                  ).toLocaleString()} VNĐ/${
                                    bookingData.is_hourly ? "giờ" : "đêm"
                                  } (Tối đa ${type.max_occupancy} khách)`,
                                }))}
                                placeholder="Chọn loại phòng"
                                disabled={
                                  !room.guests ||
                                  getFilteredRoomTypes(room.guests || 0)
                                    .length === 0 ||
                                  !bookingData.checkInDate ||
                                  !bookingData.checkOutDate
                                }
                                validationErrors={
                                  validationErrors.rooms[room.id] || {}
                                }
                              />
                            )}
                            {touchedFields[`rooms.${room.id}.type`] &&
                              validationErrors.rooms[room.id]?.type && (
                                <ErrorMessage
                                  message={
                                    validationErrors.rooms[room.id].type!
                                  }
                                />
                              )}
                          </div>
                          <div className="form-group">
                            <label className="form-label required">
                              Số phòng
                            </label>
                            {loadingRooms ? (
                              <div className="loading">
                                Đang tải số phòng...
                              </div>
                            ) : (
                              <CustomSelect
                                id={`room-number-${room.id}`}
                                value={room.number}
                                onChange={(value) =>
                                  handleRoomChange(room.id, "number", value)
                                }
                                options={getAvailableRoomNumbers(
                                  room.type,
                                  room.id
                                )}
                                placeholder="Chọn số phòng"
                                disabled={
                                  !room.type ||
                                  !bookingData.checkInDate ||
                                  !bookingData.checkOutDate
                                }
                                validationErrors={
                                  validationErrors.rooms[room.id] || {}
                                }
                              />
                            )}
                            {touchedFields[`rooms.${room.id}.number`] &&
                              validationErrors.rooms[room.id]?.number && (
                                <ErrorMessage
                                  message={
                                    validationErrors.rooms[room.id].number!
                                  }
                                />
                              )}
                          </div>
                        </div>

                        {room.price > 0 && (
                          <div className="price-info price-info-green">
                            <p>
                              <strong>Giá phòng:</strong>{" "}
                              {room.price.toLocaleString()} VNĐ/
                              {bookingData.is_hourly ? "giờ" : "đêm"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={addRoom}
                      className="mb-4 btn btn-outline-primary btn-full"
                      aria-label="Thêm phòng mới"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm phòng
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="sticky card">
              <div className="card-header">
                <h3 className="card-title">
                  <CreditCard className="w-5 h-5" />
                  Tóm tắt đặt phòng
                </h3>
              </div>
              <div className="card-content">
                <div className="summary-stats">
                  <div className="stat-card stat-card-blue">
                    <div className="stat-number stat-number-blue">
                      {bookingData.rooms.length}
                    </div>
                    <div className="stat-label">Phòng</div>
                  </div>
                  <div className="stat-card stat-card-purple">
                    <div className="stat-number stat-number-purple">
                      {calculateDuration()}
                    </div>
                    <div className="stat-label">
                      {bookingData.is_hourly ? "Giờ" : "Đêm"}
                    </div>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div>
                  <div className="summary-row">
                    <span>Tiền phòng:</span>
                    <span>
                      {bookingData.rooms
                        .reduce(
                          (sum, room) =>
                            sum +
                            (room.price && room.number
                              ? room.price * calculateDuration()
                              : 0),
                          0
                        )
                        .toLocaleString()}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tiền đặt cọc:</span>
                    <span>
                      {bookingData.depositAmount
                        ? bookingData.depositAmount.toLocaleString()
                        : "0"}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Khuyến mãi</label>
                    <CustomSelect
                      id="promotion"
                      value={
                        promotions
                          .find(
                            (promo) => promo.code === bookingData.promotion_code
                          )
                          ?.id.toString() || ""
                      }
                      onChange={handlePromotionChange}
                      options={[
                        { value: "", label: "Không áp dụng khuyến mãi" },
                        ...promotions.map((promo) => ({
                          value: promo.id.toString(),
                          label: `${promo.code} - ${promo.description} (${
                            promo.discount_type === "percent"
                              ? `${promo.discount_value}%`
                              : `${promo.discount_value.toLocaleString()} VNĐ`
                          }, Hết hạn: ${new Date(
                            promo.end_date
                          ).toLocaleDateString("vi-VN")}, Còn ${
                            promo.usage_limit - promo.used_count
                          } lượt)`,
                        })),
                      ].sort((a, b) => a.label.localeCompare(b.label))}
                      placeholder="Chọn khuyến mãi"
                      validationErrors={validationErrors.booking}
                    />
                    {touchedFields["booking.promotion"] &&
                      validationErrors.booking.promotion && (
                        <ErrorMessage
                          message={validationErrors.booking.promotion}
                        />
                      )}
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
                  <span>Tổng cộng:</span>
                  <span className="total-amount">
                    {calculateTotal().toLocaleString()} VNĐ
                  </span>
                </div>

                {bookingData.checkInDate && bookingData.checkOutDate && (
                  <div className="date-info">
                    {dayjs(
                      formatDateTime(bookingData.checkInDate, true)
                    ).format("DD/MM/YYYY HH:mm")}{" "}
                    -{" "}
                    {dayjs(
                      formatDateTime(bookingData.checkOutDate, false)
                    ).format("DD/MM/YYYY HH:mm")}
                  </div>
                )}

                {bookingData.rooms.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">
                      Chi tiết phòng:
                    </h4>
                    <div className="text-xs text-gray-500">
                      {bookingData.rooms.map(
                        (room, index) =>
                          room.type &&
                          room.number && (
                            <div key={room.id} className="mb-1">
                              {index + 1}.{" "}
                              {
                                roomTypes.find(
                                  (rt) => rt.id.toString() === room.type
                                )?.name
                              }{" "}
                              (Phòng {room.number}) x {calculateDuration()}{" "}
                              {bookingData.is_hourly ? "giờ" : "đêm"} ={" "}
                              {(
                                room.price * calculateDuration()
                              ).toLocaleString()}{" "}
                              VNĐ
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || loadingData || loadingRooms}
                    className="btn btn-primary btn-full"
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