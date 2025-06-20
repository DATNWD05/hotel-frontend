import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../api/axios';
// Import Axios instance

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

interface ApiResponse {
  total?: number;
  days?: string[];
  revenues?: number[];
  bookings?: { id: number; cost: number }[];
  customers?: { name: string; revenue: number }[];
  rooms?: { room: string; revenue: number }[];
  rate?: number;
  duration?: number;
  topCustomers?: { name: string; bookings: number }[];
  months?: string[];
  bookingCounts?: number[];
}

const Statistics: React.FC = () => {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueByDay, setRevenueByDay] = useState<{ days: string[]; revenues: number[] }>({ days: [], revenues: [] });
  const [totalPerBooking, setTotalPerBooking] = useState<{ id: number; cost: number }[]>([]);
  const [revenueByCustomer, setRevenueByCustomer] = useState<{ name: string; revenue: number }[]>([]);
  const [revenueByRoom, setRevenueByRoom] = useState<{ room: string; revenue: number }[]>([]);
  const [occupancyRate, setOccupancyRate] = useState<number>(0);
  const [averageStayDuration, setAverageStayDuration] = useState<number>(0);
  const [cancellationRate, setCancellationRate] = useState<number>(0);
  const [topCustomers, setTopCustomers] = useState<{ name: string; bookings: number }[]>([]);
  const [bookingsByMonth, setBookingsByMonth] = useState<{ months: string[]; bookingCounts: number[] }>({
    months: [],
    bookingCounts: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          totalRevRes,
          revByDayRes,
          totalPerBookingRes,
          revByCustomerRes,
          revByRoomRes,
          occupancyRes,
          stayDurationRes,
          cancelRateRes,
          topCustomersRes,
          bookingsByMonthRes,
        ] = await Promise.all([
          api.get<ApiResponse>('/statistics/total-revenue'),
          api.get<ApiResponse>('/statistics/revenue-by-day'),
          api.get<ApiResponse>('/statistics/total-per-booking'),
          api.get<ApiResponse>('/statistics/revenue-by-customer'),
          api.get<ApiResponse>('/statistics/revenue-by-room'),
          api.get<ApiResponse>('/statistics/occupancy-rate'),
          api.get<ApiResponse>('/statistics/average-stay-duration'),
          api.get<ApiResponse>('/statistics/cancellation-rate'),
          api.get<ApiResponse>('/statistics/top-customers'),
          api.get<ApiResponse>('/statistics/bookings-by-month'),
        ]);

        setTotalRevenue(totalRevRes.data.total || 0);
        setRevenueByDay({ days: revByDayRes.data.days || [], revenues: revByDayRes.data.revenues || [] });
        setTotalPerBooking(totalPerBookingRes.data.bookings || []);
        setRevenueByCustomer(revByCustomerRes.data.customers || []);
        setRevenueByRoom(revByRoomRes.data.rooms || []);
        setOccupancyRate(occupancyRes.data.rate || 0);
        setAverageStayDuration(stayDurationRes.data.duration || 0);
        setCancellationRate(cancelRateRes.data.rate || 0);
        setTopCustomers(topCustomersRes.data.topCustomers || []);
        setBookingsByMonth({
          months: bookingsByMonthRes.data.months || [],
          bookingCounts: bookingsByMonthRes.data.bookingCounts || [],
        });
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const revenueByDayData = {
    labels: revenueByDay.days,
    datasets: [
      {
        label: 'Doanh thu theo ngày',
        data: revenueByDay.revenues,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const revenueByCustomerData = {
    labels: revenueByCustomer.map((c) => c.name),
    datasets: [
      {
        label: 'Doanh thu theo khách hàng',
        data: revenueByCustomer.map((c) => c.revenue),
        backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
      },
    ],
  };

  const revenueByRoomData = {
    labels: revenueByRoom.map((r) => r.room),
    datasets: [
      {
        label: 'Doanh thu theo phòng',
        data: revenueByRoom.map((r) => r.revenue),
        backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'],
      },
    ],
  };

  const bookingsByMonthData = {
    labels: bookingsByMonth.months,
    datasets: [
      {
        label: 'Số booking theo tháng',
        data: bookingsByMonth.bookingCounts,
        fill: false,
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Thống Kê Hệ Thống</h1>
      {loading ? (
        <div className="text-center">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tổng doanh thu */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Tổng Doanh Thu</h2>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} VNĐ</p>
          </div>

          {/* Tỷ lệ lấp đầy phòng */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Tỷ Lệ Lấp Đầy Phòng</h2>
            <p className="text-2xl font-bold text-blue-600">{occupancyRate}%</p>
          </div>

          {/* Trung bình thời gian lưu trú */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Thời Gian Lưu Trú Trung Bình</h2>
            <p className="text-2xl font-bold text-purple-600">{averageStayDuration} ngày</p>
          </div>

          {/* Tỷ lệ hủy phòng */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Tỷ Lệ Hủy Phòng</h2>
            <p className="text-2xl font-bold text-red-600">{cancellationRate}%</p>
          </div>

          {/* Doanh thu theo ngày */}
          <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Doanh Thu Theo Ngày</h2>
            <Bar data={revenueByDayData} options={{ responsive: true }} />
          </div>

          {/* Doanh thu theo khách hàng */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Doanh Thu Theo Khách Hàng</h2>
            <Pie data={revenueByCustomerData} options={{ responsive: true }} />
          </div>

          {/* Doanh thu theo phòng */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Doanh Thu Theo Phòng</h2>
            <Pie data={revenueByRoomData} options={{ responsive: true }} />
          </div>

          {/* Số booking theo tháng */}
          <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Số Booking Theo Tháng</h2>
            <Line data={bookingsByMonthData} options={{ responsive: true }} />
          </div>

          {/* Top khách hàng */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Top Khách Hàng Đặt Nhiều Nhất</h2>
            <ul className="list-disc pl-5">
              {topCustomers.map((customer, index) => (
                <li key={index} className="text-gray-700">
                  {customer.name}: {customer.bookings} bookings
                </li>
              ))}
            </ul>
          </div>

          {/* Tổng chi phí từng booking */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Tổng Chi Phí Từng Booking</h2>
            <ul className="list-disc pl-5">
              {totalPerBooking.map((booking, index) => (
                <li key={index} className="text-gray-700">
                  Booking {booking.id}: {booking.cost.toLocaleString()} VNĐ
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;