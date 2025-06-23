import { useState } from "react"
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
} from "lucide-react"
import "../../css/AddBookings.css"

interface Customer {
  cccd: string
  name: string
  gender: string
  email: string
  phone: string
  dateOfBirth: string
  nationality: string
  address: string
  note: string
}

interface Room {
  id: string
  type: string
  number: string
  price: number
}

interface Service {
  id: string
  categoryId: number
  serviceId: number
  name: string
  quantity: number
  price: number
}

interface BookingData {
  customer: Customer
  rooms: Room[]
  services: Service[]
  checkInDate: string
  checkOutDate: string
  depositAmount: number
}

interface ValidationErrors {
  customer: {
    cccd?: string
    name?: string
    gender?: string
    email?: string
    phone?: string
    dateOfBirth?: string
    address?: string
  }
  booking: {
    checkInDate?: string
    checkOutDate?: string
    depositAmount?: string
    dateRange?: string
  }
  rooms: { [key: string]: { type?: string; number?: string } }
  services: { [key: string]: { categoryId?: string; serviceId?: string; quantity?: string } }
}

const roomTypes = [
  { id: "1", type: "Standard", price: 500000 },
  { id: "2", type: "Deluxe", price: 800000 },
  { id: "3", type: "Suite", price: 1200000 },
]

const roomNumbers = {
  Standard: ["101", "102", "103", "104"],
  Deluxe: ["201", "202", "203"],
  Suite: ["301", "302"],
}

const serviceCategories = [
  { id: 1, name: "Ăn uống", icon: "🍽️" },
  { id: 2, name: "Spa & Wellness", icon: "💆" },
  { id: 3, name: "Vận chuyển", icon: "🚗" },
  { id: 4, name: "Giải trí", icon: "🎮" },
  { id: 5, name: "Dịch vụ phòng", icon: "🛏️" },
]

const availableServices = {
  1: [
    { id: 1, name: "Ăn sáng buffet", price: 150000 },
    { id: 2, name: "Ăn trưa set menu", price: 250000 },
    { id: 3, name: "Ăn tối cao cấp", price: 450000 },
    { id: 4, name: "Room service 24/7", price: 100000 },
  ],
  2: [
    { id: 5, name: "Massage toàn thân", price: 300000 },
    { id: 6, name: "Facial chăm sóc da", price: 200000 },
    { id: 7, name: "Sauna & Steam", price: 150000 },
    { id: 8, name: "Yoga class", price: 100000 },
  ],
  3: [
    { id: 9, name: "Đưa đón sân bay", price: 200000 },
    { id: 10, name: "Thuê xe máy", price: 150000 },
    { id: 11, name: "Thuê xe ô tô", price: 800000 },
    { id: 12, name: "Tour city", price: 500000 },
  ],
  4: [
    { id: 13, name: "Karaoke", price: 200000 },
    { id: 14, name: "Billiards", price: 100000 },
    { id: 15, name: "Game center", price: 80000 },
    { id: 16, name: "Movie night", price: 120000 },
  ],
  5: [
    { id: 17, name: "Giặt ủi", price: 50000 },
    { id: 18, name: "Dọn phòng thêm", price: 100000 },
    { id: 19, name: "Minibar refill", price: 200000 },
    { id: 20, name: "Late checkout", price: 150000 },
  ],
}

export default function HotelBooking() {
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
    rooms: [{ id: "1", type: "", number: "", price: 0 }],
    services: [],
    checkInDate: "",
    checkOutDate: "",
    depositAmount: 0,
  })

  const [activeTab, setActiveTab] = useState("customer")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({})
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    customer: {},
    booking: {},
    rooms: {},
    services: {},
  })
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({})

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone.replace(/\s/g, ""))
  }

  const validateCCCD = (cccd: string): boolean => {
    const cccdRegex = /^[0-9]{9,12}$/
    return cccdRegex.test(cccd.replace(/\s/g, ""))
  }

  const validateCustomerField = (field: keyof Customer, value: string) => {
    const errors = { ...validationErrors }

    switch (field) {
      case "cccd":
        if (!value.trim()) {
          errors.customer.cccd = "Vui lòng nhập số CCCD/CMND"
        } else if (!validateCCCD(value)) {
          errors.customer.cccd = "Số CCCD/CMND không hợp lệ (9-12 chữ số)"
        } else {
          delete errors.customer.cccd
        }
        break
      case "name":
        if (!value.trim()) {
          errors.customer.name = "Vui lòng nhập họ và tên"
        } else if (value.trim().length < 2) {
          errors.customer.name = "Họ và tên phải có ít nhất 2 ký tự"
        } else {
          delete errors.customer.name
        }
        break
      case "gender":
        if (!value) {
          errors.customer.gender = "Vui lòng chọn giới tính"
        } else {
          delete errors.customer.gender
        }
        break
      case "email":
        if (!value.trim()) {
          errors.customer.email = "Vui lòng nhập email"
        } else if (!validateEmail(value)) {
          errors.customer.email = "Email không hợp lệ"
        } else {
          delete errors.customer.email
        }
        break
      case "phone":
        if (!value.trim()) {
          errors.customer.phone = "Vui lòng nhập số điện thoại"
        } else if (!validatePhone(value)) {
          errors.customer.phone = "Số điện thoại không hợp lệ (10-11 chữ số)"
        } else {
          delete errors.customer.phone
        }
        break
      case "dateOfBirth":
        if (!value) {
          errors.customer.dateOfBirth = "Vui lòng chọn ngày sinh"
        } else {
          const birthDate = new Date(value)
          const today = new Date()
          const age = today.getFullYear() - birthDate.getFullYear()
          if (age < 18) {
            errors.customer.dateOfBirth = "Khách hàng phải từ 18 tuổi trở lên"
          } else if (age > 100) {
            errors.customer.dateOfBirth = "Ngày sinh không hợp lệ"
          } else {
            delete errors.customer.dateOfBirth
          }
        }
        break
      case "address":
        if (!value.trim()) {
          errors.customer.address = "Vui lòng nhập địa chỉ"
        } else if (value.trim().length < 10) {
          errors.customer.address = "Địa chỉ phải có ít nhất 10 ký tự"
        } else {
          delete errors.customer.address
        }
        break
    }

    setValidationErrors(errors)
  }

  const validateBookingField = (field: string, value: string | number) => {
    const errors = { ...validationErrors }

    switch (field) {
      case "checkInDate":
        if (!value) {
          errors.booking.checkInDate = "Vui lòng chọn ngày nhận phòng"
        } else {
          const checkInDate = new Date(value as string)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (checkInDate < today) {
            errors.booking.checkInDate = "Ngày nhận phòng không thể là ngày trong quá khứ"
          } else {
            delete errors.booking.checkInDate
          }
        }
        break
      case "checkOutDate":
        if (!value) {
          errors.booking.checkOutDate = "Vui lòng chọn ngày trả phòng"
        } else if (bookingData.checkInDate) {
          const checkInDate = new Date(bookingData.checkInDate)
          const checkOutDate = new Date(value as string)
          if (checkOutDate <= checkInDate) {
            errors.booking.checkOutDate = "Ngày trả phòng phải sau ngày nhận phòng"
          } else {
            delete errors.booking.checkOutDate
          }
        } else {
          delete errors.booking.checkOutDate
        }
        break
      case "depositAmount":
        if (!value || Number(value) <= 0) {
          errors.booking.depositAmount = "Vui lòng nhập số tiền đặt cọc"
        } else if (Number(value) < 100000) {
          errors.booking.depositAmount = "Số tiền đặt cọc tối thiểu là 100,000 VNĐ"
        } else {
          delete errors.booking.depositAmount
        }
        break
    }

    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkInDate = new Date(bookingData.checkInDate)
      const checkOutDate = new Date(bookingData.checkOutDate)
      const diffDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays > 30) {
        errors.booking.dateRange = "Thời gian lưu trú không được vượt quá 30 ngày"
      } else {
        delete errors.booking.dateRange
      }
    }

    setValidationErrors(errors)
  }

  const validateRoomField = (roomId: string, field: keyof Room, value: string) => {
    const errors = { ...validationErrors }

    if (!errors.rooms[roomId]) {
      errors.rooms[roomId] = {}
    }

    switch (field) {
      case "type":
        if (!value) {
          errors.rooms[roomId].type = "Vui lòng chọn loại phòng"
        } else {
          delete errors.rooms[roomId].type
        }
        break
      case "number":
        if (!value) {
          errors.rooms[roomId].number = "Vui lòng chọn số phòng"
        } else {
          delete errors.rooms[roomId].number
        }
        break
    }

    if (Object.keys(errors.rooms[roomId]).length === 0) {
      delete errors.rooms[roomId]
    }

    setValidationErrors(errors)
  }

  const validateServiceField = (serviceId: string, field: keyof Service, value: string | number) => {
    const errors = { ...validationErrors }

    if (!errors.services[serviceId]) {
      errors.services[serviceId] = {}
    }

    switch (field) {
      case "categoryId":
        if (!value || Number(value) === 0) {
          errors.services[serviceId].categoryId = "Vui lòng chọn danh mục dịch vụ"
        } else {
          delete errors.services[serviceId].categoryId
        }
        break
      case "serviceId":
        if (!value || Number(value) === 0) {
          errors.services[serviceId].serviceId = "Vui lòng chọn dịch vụ"
        } else {
          delete errors.services[serviceId].serviceId
        }
        break
      case "quantity":
        if (!value || Number(value) <= 0) {
          errors.services[serviceId].quantity = "Số lượng phải lớn hơn 0"
        } else if (Number(value) > 10) {
          errors.services[serviceId].quantity = "Số lượng không được vượt quá 10"
        } else {
          delete errors.services[serviceId].quantity
        }
        break
    }

    if (Object.keys(errors.services[serviceId]).length === 0) {
      delete errors.services[serviceId]
    }

    setValidationErrors(errors)
  }

  const markFieldAsTouched = (fieldPath: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }))
  }

  const calculateNights = () => {
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkIn = new Date(bookingData.checkInDate)
      const checkOut = new Date(bookingData.checkOutDate)
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    return 0
  }

  const calculateTotal = () => {
    const roomTotal = bookingData.rooms.reduce((sum, room) => sum + room.price * calculateNights(), 0)
    const serviceTotal = bookingData.services.reduce((sum, service) => sum + service.price * service.quantity, 0)
    return roomTotal + serviceTotal
  }

  const handleCustomerChange = (field: keyof Customer, value: string) => {
    setBookingData((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }))

    markFieldAsTouched(`customer.${field}`)
    validateCustomerField(field, value)
  }

  const handleBookingChange = (field: string, value: string | number) => {
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }))

    markFieldAsTouched(`booking.${field}`)
    validateBookingField(field, value)
  }

  const handleRoomChange = (roomId: string, field: keyof Room, value: string) => {
    setBookingData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) => {
        if (room.id === roomId) {
          if (field === "type") {
            const selectedType = roomTypes.find((rt) => rt.type === value)
            return {
              ...room,
              type: value,
              number: "",
              price: selectedType ? selectedType.price : 0,
            }
          }
          return { ...room, [field]: value }
        }
        return room
      }),
    }))

    markFieldAsTouched(`rooms.${roomId}.${field}`)
    validateRoomField(roomId, field, value)
  }

  const addRoom = () => {
    const newId = (bookingData.rooms.length + 1).toString()
    setBookingData((prev) => ({
      ...prev,
      rooms: [...prev.rooms, { id: newId, type: "", number: "", price: 0 }],
    }))
  }

  const removeRoom = (roomId: string) => {
    if (bookingData.rooms.length > 1) {
      setBookingData((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((room) => room.id !== roomId),
      }))

      const errors = { ...validationErrors }
      delete errors.rooms[roomId]
      setValidationErrors(errors)
    }
  }

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
            }
          }
          if (field === "serviceId") {
            const categoryServices = availableServices[service.categoryId as keyof typeof availableServices] || []
            const selectedService = categoryServices.find((s) => s.id === Number(value))
            return {
              ...service,
              serviceId: Number(value),
              name: selectedService ? selectedService.name : "",
              price: selectedService ? selectedService.price : 0,
            }
          }
          return { ...service, [field]: value }
        }
        return service
      }),
    }))

    markFieldAsTouched(`services.${serviceId}.${field}`)
    validateServiceField(serviceId, field, value)
  }

  const addService = () => {
    const newId = (bookingData.services.length + 1).toString()
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
    }))
  }

  const removeService = (serviceId: string) => {
    setBookingData((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== serviceId),
    }))

    const errors = { ...validationErrors }
    delete errors.services[serviceId]
    setValidationErrors(errors)
  }

  const validateAllFields = (): boolean => {
    let isValid = true

    Object.keys(bookingData.customer).forEach((key) => {
      const field = key as keyof Customer
      if (field !== "note" && field !== "nationality") {
        validateCustomerField(field, bookingData.customer[field])
        markFieldAsTouched(`customer.${field}`)
      }
    })

    validateBookingField("checkInDate", bookingData.checkInDate)
    validateBookingField("checkOutDate", bookingData.checkOutDate)
    validateBookingField("depositAmount", bookingData.depositAmount)
    markFieldAsTouched("booking.checkInDate")
    markFieldAsTouched("booking.checkOutDate")
    markFieldAsTouched("booking.depositAmount")

    bookingData.rooms.forEach((room) => {
      validateRoomField(room.id, "type", room.type)
      validateRoomField(room.id, "number", room.number)
      markFieldAsTouched(`rooms.${room.id}.type`)
      markFieldAsTouched(`rooms.${room.id}.number`)
    })

    bookingData.services.forEach((service) => {
      validateServiceField(service.id, "categoryId", service.categoryId)
      validateServiceField(service.id, "serviceId", service.serviceId)
      validateServiceField(service.id, "quantity", service.quantity)
      markFieldAsTouched(`services.${service.id}.categoryId`)
      markFieldAsTouched(`services.${service.id}.serviceId`)
      markFieldAsTouched(`services.${service.id}.quantity`)
    })

    setTimeout(() => {
      const hasErrors =
        Object.keys(validationErrors.customer).length > 0 ||
        Object.keys(validationErrors.booking).length > 0 ||
        Object.keys(validationErrors.rooms).length > 0 ||
        Object.keys(validationErrors.services).length > 0

      if (hasErrors) {
        isValid = false
      }
    }, 100)

    return isValid
  }

  const handleSubmit = async () => {
    if (!validateAllFields()) {
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSubmitStatus("success")
    } catch{
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    id,
  }: {
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder: string
    disabled?: boolean
    id: string
  }) => {
    const isOpen = openDropdowns[id] || false

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
                  onChange(option.value)
                  toggleDropdown(id)
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="error-message">
      <AlertTriangle className="error-icon" />
      <span>{message}</span>
    </div>
  )

  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        <div className="booking-header">
          <h1 className="booking-title">Đặt Phòng Khách Sạn</h1>
          <p className="booking-subtitle">Điền thông tin để hoàn tất đặt phòng của bạn</p>
        </div>

        {submitStatus && (
          <div className={`alert ${submitStatus === "success" ? "alert-success" : "alert-error"}`}>
            {submitStatus === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>
              {submitStatus === "success"
                ? "Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất."
                : "Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại."}
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
                  const Icon = tab.icon
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
                  )
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
                          onChange={(e) => handleCustomerChange("cccd", e.target.value)}
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
                      <label htmlFor="note" className="form-label">
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
                        />
                        {touchedFields["booking.checkOutDate"] && validationErrors.booking.checkOutDate && (
                          <ErrorMessage message={validationErrors.booking.checkOutDate} />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="deposit" className="form-label required">
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
                            onChange={(e) => handleBookingChange("depositAmount", Number(e.target.value))}
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

                        <div className="form-grid form-grid-2">
                          <div className="form-group">
                            <label className="form-label required">Loại phòng</label>
                            <CustomSelect
                              id={`room-type-${room.id}`}
                              value={room.type}
                              onChange={(value) => handleRoomChange(room.id, "type", value)}
                              options={roomTypes.map((type) => ({
                                value: type.type,
                                label: `${type.type} - ${type.price.toLocaleString()} VNĐ/đêm`,
                              }))}
                              placeholder="Chọn loại phòng"
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
                              options={
                                room.type && roomNumbers[room.type as keyof typeof roomNumbers]
                                  ? roomNumbers[room.type as keyof typeof roomNumbers].map((number) => ({
                                      value: number,
                                      label: `Phòng ${number}`,
                                    }))
                                  : []
                              }
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
                                  label: `${category.icon} ${category.name}`,
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
                                options={
                                  service.categoryId &&
                                  availableServices[service.categoryId as keyof typeof availableServices]
                                    ? availableServices[service.categoryId as keyof typeof availableServices].map(
                                        (s) => ({
                                          value: s.id.toString(),
                                          label: `${s.name} - ${s.price.toLocaleString()} VNĐ`,
                                        }),
                                      )
                                    : []
                                }
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
                    <div className="stat-label stat-number-blue">Phòng</div>
                  </div>
                  <div className="stat-card stat-card-green">
                    <div className="stat-number stat-number-green">{bookingData.services.length}</div>
                    <div className="stat-label stat-number-green">Dịch vụ</div>
                  </div>
                  <div className="stat-card stat-card-purple">
                    <div className="stat-number stat-number-purple">{calculateNights()}</div>
                    <div className="stat-label stat-number-purple">Đêm</div>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div>
                  <div className="summary-row">
                    <span>Tiền phòng:</span>
                    <span>
                      {bookingData.rooms
                        .reduce((sum, room) => sum + room.price * calculateNights(), 0)
                        .toLocaleString()}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tiền dịch vụ:</span>
                    <span>
                      {bookingData.services
                        .reduce((sum, service) => sum + service.price * service.quantity, 0)
                        .toLocaleString()}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tiền đặt cọc:</span>
                    <span>{bookingData.depositAmount.toLocaleString()} VNĐ</span>
                  </div>
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
                              {index + 1}. {service.name} x{service.quantity} ={" "}
                              {(service.price * service.quantity).toLocaleString()} VNĐ
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-primary btn-full mb-4">
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
                  <button className="btn btn-outline btn-full" aria-label="Hủy bỏ đặt phòng">
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}