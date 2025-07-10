import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TextField,
  Pagination,
  InputAdornment,
} from "@mui/material";
import { Search } from "lucide-react";
import api from "../../api/axios";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

interface BookingService {
  booking_code: string;
  service_name: string;
  category_name: string;
  price: number;
  quantity: number;
  total: number;
  employee_name: string;
  created_at: string;
  room_number: string;
  room_type: string;
}

export default function BookingService() {
  const [data, setData] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<BookingService[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [summary, setSummary] = useState<{ total: number } | null>(null);
  const [serviceTotal, setServiceTotal] = useState<number>(0);

  const fetchServiceTotal = async () => { 
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {};
      if (fromDate) params.from_date = fromDate.format("YYYY-MM-DD");
      if (toDate) params.to_date = toDate.format("YYYY-MM-DD");

      const res = await api.get(`/statistics/total-service-revenue`, {
        params,
      });
      console.log("Toonrg doanh thu:", res.data);   
      setServiceTotal(res.data.total_service_revenue ?? 0);
    } catch (err) {
      console.error("Lỗi khi lấy tổng tiền dịch vụ:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchServiceTotal();
  }, [page, fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { page };
      if (fromDate) params.from_date = fromDate.format("YYYY-MM-DD");
      if (toDate) params.to_date = toDate.format("YYYY-MM-DD");

      const res = await api.get(`/statistics/booking-service-table`, {
        params,
      });
      setData(res.data.data);
      setFiltered(res.data.data);
      setTotalPage(res.data.pagination.last_page);
      setSummary(res.data.summary);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu dịch vụ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, fromDate, toDate]);

  useEffect(() => {
    if (!search) {
      setFiltered(data);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        data.filter(
          (d) =>
            d.booking_code?.toString().toLowerCase().includes(lower) ||
            d.service_name?.toLowerCase().includes(lower) ||
            d.employee_name?.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, data]);

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Dịch vụ &gt; Danh sách
          </Typography>
          <Typography variant="h2" fontWeight={700}>
            Dịch Vụ
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Từ ngày"
              value={fromDate}
              onChange={(newValue) => {
                setFromDate(newValue);
                setPage(1);
              }}
              maxDate={toDate ?? undefined}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: "135px",
                    "& .MuiInputBase-root": { height: "40px" },
                  },
                },
              }}
            />
            <DatePicker
              label="Đến ngày"
              value={toDate}
              onChange={(newValue) => {
                setToDate(newValue);
                setPage(1);
              }}
              minDate={fromDate ?? undefined}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: "135px",
                    "& .MuiInputBase-root": { height: "40px" },
                  },
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            placeholder="Tìm kiếm (Tên hoặc mã đặt phòng)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{
              width: 280,
              backgroundColor: "white",
              borderRadius: "10px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Mã đặt phòng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tên dịch vụ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nhóm</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Đơn giá
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      SL
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Tổng cộng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nhân viên</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Thời gian tạo
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Nhận phòng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Loại phòng
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => (
                    <TableRow
                      key={idx}
                      hover
                      sx={{ "&:last-child td": { borderBottom: "none" } }}
                    >
                      <TableCell>{row.booking_code}</TableCell>
                      <TableCell>{row.service_name}</TableCell>
                      <TableCell>{row.category_name}</TableCell>
                      <TableCell align="right">
                        {Intl.NumberFormat("vi-VN").format(
                          Math.round(row.price)
                        )}{" "}
                        ₫
                      </TableCell>
                      <TableCell align="center">{row.quantity}</TableCell>
                      <TableCell align="right">
                        {Intl.NumberFormat("vi-VN").format(
                          Math.round(row.total)
                        )}{" "}
                        ₫
                      </TableCell>
                      <TableCell>{row.employee_name}</TableCell>
                      <TableCell align="center">
                        <Typography fontSize={13}>
                          {new Date(row.created_at).toLocaleTimeString("vi-VN")}
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          {new Date(row.created_at).toLocaleDateString("vi-VN")}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{row.room_number}</TableCell>
                      <TableCell align="center">{row.room_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {summary && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  mt: 3,
                }}
              >
                <Box
                  sx={{
                    minWidth: 260,
                    textAlign: "left",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Tổng tiền dịch vụ
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{ color: "#3f51b5" }}
                  >
                    {Number(serviceTotal).toLocaleString("vi-VN", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ₫
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Pagination
                count={totalPage}
                page={page}
                onChange={(_, val) => setPage(val)}
                shape="rounded"
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={0}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#666",
                    fontWeight: 500,
                    borderRadius: "8px",
                    border: "none",
                  },
                  "& .MuiPaginationItem-page.Mui-selected": {
                    backgroundColor: "#5B3EFF",
                    color: "#fff",
                    fontWeight: "bold",
                  },
                  "& .MuiPaginationItem-previousNext, & .MuiPaginationItem-firstLast":
                    {
                      color: "#999",
                    },
                }}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
