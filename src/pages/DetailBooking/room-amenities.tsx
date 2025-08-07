/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Wifi,
  Coffee,
  Tv,
  Wind,
  Shield,
  Bath,
  Phone,
  Refrigerator,
} from "lucide-react";

interface Amenity {
  id: number;
  name: string;
  icon: any;
  category: string;
}

interface RoomAmenitiesProps {
  amenities?: Amenity[];
}

export default function RoomAmenities({ amenities = [] }: RoomAmenitiesProps) {
  // Default amenities if none provided
  const defaultAmenities = [
    { id: 1, name: "WiFi miễn phí", icon: Wifi, category: "Internet" },
    { id: 2, name: "Điều hòa không khí", icon: Wind, category: "Tiện nghi" },
    { id: 3, name: "TV màn hình phẳng", icon: Tv, category: "Giải trí" },
    { id: 4, name: "Minibar", icon: Refrigerator, category: "Ăn uống" },
    { id: 5, name: "Két an toàn", icon: Shield, category: "An ninh" },
    { id: 6, name: "Phòng tắm riêng", icon: Bath, category: "Vệ sinh" },
    { id: 7, name: "Dịch vụ phòng 24/7", icon: Phone, category: "Dịch vụ" },
    { id: 8, name: "Máy pha cà phê", icon: Coffee, category: "Ăn uống" },
  ];

  const displayAmenities = amenities.length > 0 ? amenities : defaultAmenities;

  const groupedAmenities = displayAmenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 font-medium">
        <Wifi className="w-4 h-4" />
        Tiện nghi phòng
      </h4>

      <div className="space-y-3">
        {Object.entries(groupedAmenities).map(
          ([category, categoryAmenities]) => (
            <div key={category} className="space-y-2">
              <h5 className="pb-1 text-xs font-medium tracking-wide text-gray-500 uppercase border-b">
                {category}
              </h5>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {categoryAmenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-2 p-2 text-sm text-gray-700 rounded-md bg-green-50"
                  >
                    <amenity.icon className="flex-shrink-0 w-4 h-4 text-green-600" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
