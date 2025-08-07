z="space-y-4">
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
        