"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Service {
  id: number;
  name: string;
  price: string;
  icon: any;
  category: string;
}

interface AddServiceModalProps {
  services: Service[];
  onAddService: (service: Service, quantity: number, note: string) => void;
  formatCurrency: (amount: string) => string;
}

export default function AddServiceModal({
  services,
  onAddService,
  formatCurrency,
}: AddServiceModalProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const handleAddService = () => {
    if (selectedService && quantity > 0) {
      onAddService(selectedService, quantity, note);
      // Reset form
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
    <div className="space-y-6">
      {/* Service Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Chọn dịch vụ</Label>
        <div className="space-y-4 overflow-y-auto max-h-96">
          {Object.entries(groupedServices).map(
            ([category, categoryServices]) => (
              <div key={category} className="space-y-2">
                <h4 className="pb-1 text-sm font-medium text-gray-700 border-b">
                  {category}
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {categoryServices.map((service) => (
                    <Card
                      key={service.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedService?.id === service.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {service.icon && (
                            <service.icon className="w-5 h-5 text-gray-600" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {service.name}
                            </p>
                            <p className="text-xs font-medium text-blue-600">
                              {formatCurrency(service.price)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Service Details */}
      {selectedService && (
        <div className="p-4 space-y-4 border rounded-lg bg-blue-50">
          <div className="flex items-center gap-3">
            {selectedService.icon && (
              <selectedService.icon className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <h3 className="font-medium">{selectedService.name}</h3>
              <p className="text-sm text-gray-600">
                Giá: {formatCurrency(selectedService.price)} / lần
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Tổng tiền</Label>
              <div className="flex items-center h-10 px-3 py-2 bg-gray-100 rounded-md">
                <span className="font-medium text-blue-600">
                  {formatCurrency(
                    (
                      Number.parseFloat(selectedService.price) * quantity
                    ).toString()
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="note"
              placeholder="Thêm ghi chú cho dịch vụ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedService(null);
            setQuantity(1);
            setNote("");
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleAddService}
          disabled={!selectedService}
          className="gap-2"
        >
          Thêm dịch vụ
        </Button>
      </div>
    </div>
  );
}
