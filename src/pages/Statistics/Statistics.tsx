// src/pages/Statistics/Statistics.tsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  useTheme,
  CircularProgress,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HotelIcon from "@mui/icons-material/Hotel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import BedIcon from "@mui/icons-material/Bed";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import { Chart, registerables } from "chart.js";
import BookingList from "./BookingList";
Chart.register(...registerables);

// Kiểu dữ liệu
type RevByDay = { date: string; total: number };
type MonthCount = { month: string; total: number };
type BookingTotal = { booking_id: number; total_amount: number };
type CustRevenue = { name: string; total_spent: number };
type RoomRevenue = { room_number: string; total_revenue: number };
type TopCustomer = { name: string; total_bookings: number };

export default function Statistics() {
  const theme = useTheme();
  const lineRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<Chart<"line"> | null>(null);
  const barChartRef = useRef<Chart<"bar"> | null>(null);

  // Loading và state dữ liệu
  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [occupancyRate, setOccupancyRate] = useState<number>(0);
  const [avgStayDays, setAvgStayDays] = useState<number>(0);
  const [cancellationRate, setCancellationRate] = useState<number>(0);

  const [revByDay, setRevByDay] = useState<RevByDay[]>([]);
  const [bookingsByMonth, setBookingsByMonth] = useState<MonthCount[]>([]);

  const [totalPerBooking, setTotalPerBooking] = useState<BookingTotal[]>([]);
  const [revByCustomer, setRevByCustomer] = useState<CustRevenue[]>([]);
  const [revByRoom, setRevByRoom] = useState<RoomRevenue[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  // Fetch tất cả API
  useEffect(() => {
    const api = axios.create({
      baseURL: "http://localhost:8000/api/statistics",
    });
    api.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    Promise.all([
      api.get<{ total_revenue: number }>("/total-revenue"),
      api.get<{ occupancy_rate: number }>("/occupancy-rate"),
      api.get<{ average_stay_days: number }>("/average-stay-duration"),
      api.get<{ cancellation_rate: number }>("/cancellation-rate"),
      api.get<RevByDay[]>("/revenue-by-day"),
      api.get<MonthCount[]>("/bookings-by-month"),
      api.get<BookingTotal[]>("/total-per-booking"),
      api.get<CustRevenue[]>("/revenue-by-customer"),
      api.get<RoomRevenue[]>("/revenue-by-room"),
      api.get<TopCustomer[]>("/top-customers"),
    ])
      .then(
        ([
          { data: tRev },
          { data: occ },
          { data: avgStay },
          { data: cancel },
          { data: daysFromApi },
          { data: monthsFromApi },
          { data: perBk },
          { data: byCust },
          { data: byRoom },
          { data: topCust },
        ]) => {
          setTotalRevenue(tRev.total_revenue);
          setOccupancyRate(occ.occupancy_rate);
          setAvgStayDays(avgStay.average_stay_days);
          setCancellationRate(cancel.cancellation_rate);

          // Guard trước khi reverse
          setRevByDay(Array.isArray(daysFromApi) ? daysFromApi.reverse() : []);
          setBookingsByMonth(
            Array.isArray(monthsFromApi) ? monthsFromApi.reverse() : []
          );

          setTotalPerBooking(perBk);
          setRevByCustomer(byCust);
          setRevByRoom(byRoom);
          setTopCustomers(topCust);
        }
      )
      .catch((err) => {
        console.error("Lỗi fetch thống kê:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Vẽ line chart
  useEffect(() => {
    if (!lineRef.current || revByDay.length === 0) return;
    lineChartRef.current?.destroy();

    const ctx = lineRef.current.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, "rgba(86,81,212,0.4)");
    grad.addColorStop(1, "rgba(86,81,212,0)");

    lineChartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: revByDay.map((d) => d.date),
        datasets: [
          {
            data: revByDay.map((d) => d.total),
            borderColor: "#5651D4",
            backgroundColor: grad,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { displayColors: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: "#eef1f6" },
            beginAtZero: true,
            ticks: {
              callback: (v) =>
                typeof v === "number" && v >= 1000 ? `${v / 1000}K` : v,
            },
          },
        },
      },
    });
  }, [revByDay, theme]);

  // Vẽ bar chart
  useEffect(() => {
    if (!barRef.current || bookingsByMonth.length === 0) return;
    barChartRef.current?.destroy();

    const ctx = barRef.current.getContext("2d");
    if (!ctx) return;

    barChartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: bookingsByMonth.map((m) => m.month),
        datasets: [
          {
            data: bookingsByMonth.map((m) => m.total),
            backgroundColor: "#47C1FF",
            borderRadius: 6,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { displayColors: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: "#eef1f6" },
            beginAtZero: true,
            ticks: {
              callback: (v) =>
                typeof v === "number" && v >= 1000 ? `${v / 1000}K` : v,
            },
          },
        },
      },
    });
  }, [bookingsByMonth, theme]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Cấu trúc bảng
  const safeTotalPerBooking = Array.isArray(totalPerBooking)
    ? totalPerBooking
    : [];
  const safeRevByCustomer = Array.isArray(revByCustomer) ? revByCustomer : [];
  const safeRevByRoom = Array.isArray(revByRoom) ? revByRoom : [];
  const safeTopCustomers = Array.isArray(topCustomers) ? topCustomers : [];

  const tables = [
    {
      title: "Tổng Chi Phí Từng Booking",
      icon: <ReceiptLongIcon color="primary" fontSize="small" />,
      rows: safeTotalPerBooking.map((b) => [
        `#${b.booking_id}`,
        `$${b.total_amount}`,
      ]),
    },
    {
      title: "Doanh Thu Theo Khách Hàng",
      icon: <PersonIcon color="primary" fontSize="small" />,
      rows: safeRevByCustomer.map((c) => [c.name, `$${c.total_spent}`]),
    },
    {
      title: "Doanh Thu Theo Phòng",
      icon: <BedIcon color="primary" fontSize="small" />,
      rows: safeRevByRoom.map((r) => [r.room_number, `$${r.total_revenue}`]),
    },
    {
      title: "Top Khách Hàng Đặt Nhiều Nhất",
      icon: <BarChartRoundedIcon color="primary" fontSize="small" />,
      rows: safeTopCustomers.map((t) => [t.name, `${t.total_bookings}`]),
    },
  ];

  // Dữ liệu KPI cards
  const kpis = [
    {
      icon: <AttachMoneyIcon />,
      title: "Tổng Doanh Thu",
      value: `$${(totalRevenue ?? 0).toLocaleString()}`,
      color: "#E53935",
    },
    {
      icon: <HotelIcon />,
      title: "Tỷ Lệ Lấp Đầy",
      value: `${occupancyRate ?? 0}%`,
      color: "#6A1B9A",
    },
    {
      icon: <AccessTimeIcon />,
      title: "Thời Gian TB",
      value: `${avgStayDays ?? 0} ngày`,
      color: "#1565C0",
    },
    {
      icon: <BlockIcon />,
      title: "Tỷ Lệ Hủy Phòng",
      value: `${cancellationRate ?? 0}%`,
      color: "#F9A825",
    },
  ];

  return (
    <Box
      sx={{
        p: 4,
        background: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* KPI Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Paper
            key={idx}
            elevation={3}
            sx={{
              flex: "1 1 calc(25% - 16px)",
              minWidth: 200,
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(165deg, ${kpi.color}55 0%, ${kpi.color}CC 20%)`,
              color: "#fff",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                bgcolor: `${kpi.color}65`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              {kpi.icon}
            </Box>
            <Typography variant="subtitle2" sx={{ opacity: 0.95 }}>
              {kpi.title}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
              {kpi.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Charts */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 2,
          mb: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            height: 340,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <ShowChartIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Doanh Thu Theo Ngày</Typography>
          </Box>
          <Box
            component="canvas"
            ref={lineRef}
            sx={{ flex: 1, minHeight: 240, maxHeight: 240 }}
          />
        </Paper>

        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            height: 340,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <BarChartIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Booking Theo Tháng</Typography>
          </Box>
          <Box
            component="canvas"
            ref={barRef}
            sx={{ flex: 1, minHeight: 240, maxHeight: 240 }}
          />
        </Paper>
      </Box>

      {/* Tables */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {tables.map((tbl, i) => (
          <Paper
            key={i}
            elevation={3}
            sx={{
              flex: "1 1 calc(50% - 16px)",
              minWidth: 240,
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.action.hover,
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              {tbl.icon}
              <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                {tbl.title}
              </Typography>
            </Box>

            {/* Đặt maxHeight và overflow-y để cuộn */}
            <TableContainer
              sx={{
                maxHeight: 48 * 4, // chiều cao tương đương 5 dòng
                overflowY: "auto", // bật scroll khi vượt quá
              }}
            >
              <Table size="small">
                <TableBody>
                  {tbl.rows.map((r, j) => (
                    <TableRow key={j} hover>
                      <TableCell>{r[0]}</TableCell>
                      <TableCell>{r[1]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}
      </Box>
            {/* ------------------ PHẦN DANH SÁCH ĐẶT PHÒNG Ở CUỐI ------------------ */}
      <BookingList />
    </Box>

    
  );
}
