/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, Trash2, Coffee, Wifi, Wind, Tv, Shield, Bath, Phone, Refrigerator } from "lucide-react"
import { useState } from "react"
import AddServiceModal from "./add-service-modal"

interface Room {
  id: number
  room_number: string
  status: string
  pivot: {
    rate: string
  }
  room_type: {
    id: number
    code: string
    name: string
    description: string
    max_occupancy: number
    base_rate: string
  }
}

interface Service {
  id: number
  name: string
  price: string
  quantity: number
  note: string
  total: number
  icon: any
}

interface RoomDetailTabProps {
  room: Room
  services: Service[]
  availableServices: any[]
  onAddService: (service: any, quantity: number, note: string) => void
  onRemoveService: (serviceId: number) => void
  formatCurrency: (amount: string) => string
}

export default function RoomDetailTab({
  room,
  services,
  availableServices,
  onAddService,
  onRemoveService,
  formatCurrency,
}: RoomDetailTabProps) {
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)

  // Sample amenities for each room type
  const getAmenitiesByRoomType = (roomTypeCode: string) => {
    const baseAmenities = [
      { id: 1, name: "WiFi miễn phí", icon: Wifi, category: "Internet" },
      { id: 2, name: "Điều hòa không khí", icon: Wind, category: "Tiện nghi" },
      { id: 3, name: "TV màn hình phẳng", icon: Tv, category: "Giải trí" },
      { id: 6, name: "Phòng tắm riêng", icon: Bath, category: "Vệ sinh" },
    ]

    const premiumAmenities = [
      { id: 4, name: "Minibar", icon: Refrigerator, category: "Ăn uống" },
      { id: 5, name: "Két an toàn", icon: Shield, category: "An ninh" },
      { id: 7, name: "Dịch vụ phòng 24/7", icon: Phone, category: "Dịch vụ" },
      { id: 8, name: "Máy pha cà phê", icon: Coffee, category: "Ăn uống" },
    ]

    switch (roomTypeCode) {
      case "SUI": // Suite
        return [...baseAmenities, ...premiumAmenities]
      case "DEL": // Deluxe
        return [...baseAmenities, ...premiumAmenities.slice(0, 2)]
      default: // Standard
        return baseAmenities
    }
  }

  const roomAmenities = getAmenitiesByRoomType(room.room_type.code)

  const groupedAmenities = roomAmenities.reduce(
    (acc, amenity) => {
      if (!acc[amenity.category]) {
        acc[amenity.category] = []
      }
      acc[amenity.category].push(amenity)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const calculateRoomServicesTotal = () => {
    return services.reduce((total, service) => total + service.total, 0)
  }

  return (
    <div className="p-4 space-y-6 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Room Basic Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Phòng {room.room_number}</h3>
            <p className="text-sm text-gray-600">
              {room.room_type.name} ({room.room_type.code})
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{formatCurrency(room.pivot.rate)}</p>
            <p className="text-sm text-gray-500">/ đêm</p>
          </div>
        </div>

        <div className="p-4 bg-white border rounded-lg">
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
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 font-medium">
          <Wifi className="w-4 h-4" />
          Tiện nghi phòng
        </h4>

        <div className="p-4 bg-white border rounded-lg">
          <div className="space-y-4">
            {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
              <div key={category} className="space-y-2">
                <h5 className="pb-1 text-xs font-medium tracking-wide text-gray-500 uppercase border-b">{category}</h5>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {categoryAmenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-2 p-2 text-sm text-gray-700 border border-green-200 rounded-md bg-green-50"
                    >
                      <amenity.icon className="flex-shrink-0 w-4 h-4 text-green-600" />
                      <span>{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-medium">
            <Coffee className="w-4 h-4" />
            Dịch vụ đã sử dụng
            {services.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {services.length}
              </Badge>
            )}
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

        <div className="p-4 bg-white border rounded-lg">
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
                    <span className="text-sm font-medium text-blue-700">
                      {formatCurrency(service.total.toString())}
                    </span>
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

              {services.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between pt-2 font-medium">
                    <span className="text-blue-900">Tổng dịch vụ phòng {room.room_number}:</span>
                    <span className="text-lg font-bold text-blue-700">
                      {formatCurrency(calculateRoomServicesTotal().toString())}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500">
              <Coffee className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có dịch vụ nào cho phòng này</p>
              <p className="mt-1 text-xs text-gray-400">Nhấn "Thêm dịch vụ" để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
