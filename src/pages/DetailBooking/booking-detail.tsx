"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

const BookingDetail = () => {
  const [selectedServices, setSelectedServices] = useState([])
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [roomServices, setRoomServices] = useState({}) // Object to store services for each room

  // Sample data based on the provided JSON
  const booking = {
    id: 1,
    customer_id: 1,
    created_by: 1,
    check_in_date: "2025-07-25",
    check_out_date: "2025-07-26",
    check_in_at: "2025-07-25 22:04:34",
    check_out_at: "2025-07-25 22:10:57",
    status: "Checked-out",
    deposit_amount: "120000.00",
    is_deposit_paid: 0,
    raw_total: "1200000.00",
    discount_amount: "0.00",
    total_amount: "1200000.00",
    customer: {
      id: 1,
      cccd: "001205054225",
      name: "Nguyễn Đăng Dương",
      gender: "male",
      email: "duongndph49460@gmail.com",
      phone: "0986690871",
      date_of_birth: "2005-07-13",
      nationality: "Vietnamese",
      address: "Con Bố Sơn, Mẹ Nức, Xóm 2 Thôn Văn Sơn, Hoàng Văn Thụ, Chương Mỹ, Hà Nội",
      note: "Khách Vip",
    },
    rooms: [
      {
        id: 84,
        room_number: "301",
        status: "booked",
        pivot: {
          rate: "1200000.00",
        },
        room_type: {
          id: 3,
          code: "SUI",
          name: "Suite Room",
          description: "Phòng hạng sang với phòng khách riêng, phù hợp cho gia đình.",
          max_occupancy: 4,
          base_rate: "1200000.00",
        },
      },
      {
        id: 85,
        room_number: "302",
        status: "booked",
        pivot: {
          rate: "800000.00",
        },
        room_type: {
          id: 2,
          code: "DEL",
          name: "Deluxe Room",
          description: "Phòng cao cấp với view đẹp và không gian rộng rãi.",
          max_occupancy: 2,
          base_rate: "800000.00",
        },
      },
      {
        id: 86,
        room_number: "201",
        status: "booked",
        pivot: {
          rate: "500000.00",
        },
        room_type: {
          id: 1,
          code: "STD",
          name: "Standard Room",
          description: "Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản.",
          max_occupancy: 2,
          base_rate: "500000.00",
        },
      },
    ],
    creator: {
      id: 1,
      name: "Nguyễn Đăng Dương",
      email: "duongndph49460@gmail.com",
    },
  }

  const availableServices = [
    { id: 1, name: "Dịch vụ giặt ủi", price: "50000", icon: Coffee, category: "Tiện ích" },
    { id: 2, name: "Massage", price: "200000", icon: Waves, category: "Spa & Wellness" },
    { id: 3, name: "Đưa đón sân bay", price: "300000", icon: Car, category: "Vận chuyển" },
    { id: 4, name: "Ăn sáng buffet", price: "150000", icon: Utensils, category: "Ăn uống" },
    { id: 5, name: "Sử dụng gym", price: "100000", icon: Dumbbell, category: "Thể thao" },
    { id: 6, name: "WiFi cao cấp", price: "80000", icon: Wifi, category: "Internet" },
  ]

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number.parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Checked-out":
        return (
          <Badge variant="secondary" className="text-green-800 bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã trả phòng
          </Badge>
        )
      case "Checked-in":
        return (
          <Badge variant="default" className="text-blue-800 bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Đang ở
          </Badge>
        )
      case "Confirmed":
        return (
          <Badge variant="outline" className="text-yellow-800 bg-yellow-100">
            <Calendar className="w-3 h-3 mr-1" />
            Đã xác nhận
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const addServiceToRoom = (roomId, service, quantity = 1, note = "") => {
    const newService = {
      ...service,
      quantity,
      note,
      total: Number.parseFloat(service.price) * quantity,
      id: Date.now(),
    }

    setRoomServices((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newService],
    }))
    setIsAddServiceOpen(false)
  }

  const removeServiceFromRoom = (roomId, serviceId) => {
    setRoomServices((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter((service) => service.id !== serviceId),
    }))
  }

  const calculateAllServicesTotal = () => {
    return Object.values(roomServices).reduce((total, services) => {
      return total + services.reduce((roomTotal, service) => roomTotal + service.total, 0)
    }, 0)
  }

  const calculateServicesTotal = () => {
    return selectedServices.reduce((total, service) => total + service.total, 0)
  }

  const calculateGrandTotal = () => {
    const roomTotal = Number.parseFloat(booking.total_amount)
    const servicesTotal = calculateAllServicesTotal()
    return roomTotal + servicesTotal
  }

  // Set selectedRoomId after booking is defined
  useState(() => {
    setSelectedRoomId(booking.rooms[0]?.id || null)
  }, [])

  return (
    <div className="max-w-6xl p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết đặt phòng #{booking.id}</h1>
          <p className="mt-1 text-gray-600">Được tạo bởi {booking.creator.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(booking.status)}
          {booking.is_deposit_paid === 0 && (
            <Badge variant="destructive" className="text-red-800 bg-red-100">
              <AlertCircle className="w-3 h-3 mr-1" />
              Chưa thanh toán cọc
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="text-lg font-semibold">
                    {booking.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold">{booking.customer.name}</h3>
                    <p className="text-sm text-gray-600">CCCD: {booking.customer.cccd}</p>
                  </div>
                  {booking.customer.note && (
                    <Badge variant="outline" className="text-purple-700 bg-purple-50">
                      {booking.customer.note}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{booking.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{booking.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Sinh: {formatDate(booking.customer.date_of_birth)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm capitalize">{booking.customer.gender === "male" ? "Nam" : "Nữ"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{booking.customer.nationality}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-gray-700">{booking.customer.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Information with Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Thông tin phòng & Dịch vụ ({booking.rooms.length} phòng)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Room Tabs */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 pb-3 border-b">
                  {booking.rooms.map((room) => (
                    <Button
                      key={room.id}
                      variant={selectedRoomId === room.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRoomId(room.id)}
                      className="gap-2"
                    >
                      <Bed className="w-4 h-4" />
                      Phòng {room.room_number}
                      {roomServices[room.id]?.length > 0 && (
                        <Badge variant="secondary" className="w-5 h-5 p-0 ml-1 text-xs">
                          {roomServices[room.id].length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Selected Room Details */}
                {booking.rooms
                  .filter((room) => room.id === selectedRoomId)
                  .map((room) => (
                    <RoomDetailTab
                      key={room.id}
                      room={room}
                      services={roomServices[room.id] || []}
                      availableServices={availableServices}
                      onAddService={(service, quantity, note) => addServiceToRoom(room.id, service, quantity, note)}
                      onRemoveService={(serviceId) => removeServiceFromRoom(room.id, serviceId)}
                      formatCurrency={formatCurrency}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Check-in/Check-out Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Lịch trình
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ngày nhận phòng</p>
                    <p className="text-sm text-gray-600">{formatDate(booking.check_in_date)}</p>
                    {booking.check_in_at && (
                      <p className="mt-1 text-xs text-green-600">✓ Đã nhận: {formatDateTime(booking.check_in_at)}</p>
                    )}
                  </div>
                </div>

                <div className="ml-1.5 w-0.5 h-8 bg-gray-200"></div>

                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ngày trả phòng</p>
                    <p className="text-sm text-gray-600">{formatDate(booking.check_out_date)}</p>
                    {booking.check_out_at && (
                      <p className="mt-1 text-xs text-green-600">✓ Đã trả: {formatDateTime(booking.check_out_at)}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Thông tin thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tổng tiền phòng:</span>
                  <span className="font-medium">{formatCurrency(booking.raw_total)}</span>
                </div>

                {Object.keys(roomServices).some((roomId) => roomServices[roomId]?.length > 0) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tổng dịch vụ:</span>
                    <span className="font-medium">{formatCurrency(calculateAllServicesTotal().toString())}</span>
                  </div>
                )}

                {Number.parseFloat(booking.discount_amount) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Giảm giá:</span>
                    <span className="font-medium text-green-600">-{formatCurrency(booking.discount_amount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(calculateGrandTotal().toString())}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tiền cọc:</span>
                    <span className="font-medium">{formatCurrency(booking.deposit_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trạng thái cọc:</span>
                    {booking.is_deposit_paid === 1 ? (
                      <Badge variant="default" className="text-green-800 bg-green-100">
                        Đã thanh toán
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-red-800 bg-red-100">
                        Chưa thanh toán
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AddServiceModal({ services, onAddService, formatCurrency }) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState("")
  const [selectedService, setSelectedService] = useState(null)

  const handleAddService = () => {
    if (selectedService) {
      onAddService(selectedService, quantity, note)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Button
            key={service.id}
            variant={selectedService?.id === service.id ? "default" : "outline"}
            className="justify-start gap-3"
            onClick={() => setSelectedService(service)}
          >
            <service.icon className="w-5 h-5" />
            {service.name} ({formatCurrency(service.price)})
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="quantity">Số lượng</Label>
          <Input
            id="quantity"
            type="number"
            defaultValue={1}
            min={1}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="note">Ghi chú</Label>
          <Textarea id="note" onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <Button onClick={handleAddService} disabled={!selectedService}>
        Thêm dịch vụ
      </Button>
    </div>
  )
}

function RoomDetailTab({ room, services, availableServices, onAddService, onRemoveService, formatCurrency }) {
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Basic Room Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Phòng {room.room_number}</h3>
            <p className="text-sm text-gray-600">
              {room.room_type.name} ({room.room_type.code})
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(room.pivot.rate)}</p>
            <p className="text-sm text-gray-500">/ đêm</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50">
          <p className="mb-3 text-sm text-gray-700">{room.room_type.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Tối đa {room.room_type.max_occupancy} người</span>
            </div>
            <Badge variant="outline" className={room.status === "booked" ? "bg-orange-50 text-orange-700" : ""}>
              {room.status === "booked" ? "Đã đặt" : room.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Room Amenities */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 font-medium">
          <Wifi className="w-4 h-4" />
          Tiện nghi phòng
        </h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {/* Sample amenities - you can replace with actual data */}
          {[
            { name: "WiFi miễn phí", icon: Wifi },
            { name: "Điều hòa", icon: Coffee },
            { name: "TV màn hình phẳng", icon: Coffee },
            { name: "Minibar", icon: Coffee },
            { name: "Két an toàn", icon: Coffee },
            { name: "Phòng tắm riêng", icon: Coffee },
          ].map((amenity, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
              <amenity.icon className="w-4 h-4 text-green-600" />
              <span>{amenity.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services Section */}
      <div className="pt-4 space-y-4 border-t">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-medium">
            <Coffee className="w-4 h-4" />
            Dịch vụ đã sử dụng
          </h4>
          <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm dịch vụ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Thêm dịch vụ cho phòng {room.room_number}</DialogTitle>
              </DialogHeader>
              <AddServiceModal
                services={availableServices}
                onAddService={(service, quantity, note) => {
                  onAddService(service, quantity, note)
                  setIsAddServiceOpen(false)
                }}
                formatCurrency={formatCurrency}
              />
            </DialogContent>
          </Dialog>
        </div>

        {services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <service.icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-gray-600">
                      Số lượng: {service.quantity} × {formatCurrency(service.price)}
                    </p>
                    {service.note && <p className="mt-1 text-xs text-gray-500">Ghi chú: {service.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">{formatCurrency(service.total.toString())}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveService(service.id)}
                    className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 pt-3 border-t border-blue-200 rounded-lg bg-blue-50">
              <span className="font-medium text-blue-900">Tổng dịch vụ:</span>
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(services.reduce((total, service) => total + service.total, 0).toString())}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500 rounded-lg bg-gray-50">
            <Coffee className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có dịch vụ nào được sử dụng</p>
            <p className="mt-1 text-xs text-gray-400">Nhấn "Thêm dịch vụ" để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingDetail
