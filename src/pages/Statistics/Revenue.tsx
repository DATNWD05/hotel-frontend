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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import "../../css/Revenue.css";

interface RevenueItem {
  booking_code: number;
  customer_name: string;
  room_type: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
  status: string;
}

interface Summary {
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
}

export default function Revenue() {
  const [data, setData] = useState<RevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<RevenueItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { page };
      if (fromDate) params.from_date = fromDate.format("YYYY-MM-DD");
      if (toDate) params.to_date = toDate.format("YYYY-MM-DD");

      const res = await api.get(`/statistics/revenue-table`, { params });
      setData(res.data.data);
      setFiltered(res.data.data);
      setTotalPage(res.data.pagination.last_page);
      setSummary(res.data.summary);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu doanh thu:", error);
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
            d.booking_code.toString().includes(lower) ||
            d.customer_name.toLowerCase().includes(lower) ||
            d.room_number.toLowerCase().includes(lower)
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
            Doanh thu &gt; Bảng tổng hợp
          </Typography>
          <Typography variant="h2" fontWeight={700}>
            Bảng Doanh Thu
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
            placeholder="Tìm kiếm (mã đặt phòng, khách hàng, số phòng)"
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
                    <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Loại phòng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phòng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nhận</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trả</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Tổng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Đặt cọc
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Còn lại
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{row.booking_code}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.room_type}</TableCell>
                      <TableCell>{row.room_number}</TableCell>
                      <TableCell>{row.check_in_date}</TableCell>
                      <TableCell>{row.check_out_date}</TableCell>
                      <TableCell align="right">
                        {row.total_amount.toLocaleString()} ₫
                      </TableCell>
                      <TableCell align="right">
                        {row.deposit_amount.toLocaleString()} ₫
                      </TableCell>
                      <TableCell align="right">
                        {row.remaining_amount.toLocaleString()} ₫
                      </TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {summary && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 3,
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Tổng cộng
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: "#3f51b5" }}
                  >
                    {Number(summary.total_amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ₫
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Đặt cọc
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: "#1a237e" }}
                  >
                    {Number(summary.deposit_amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ₫
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Còn lại
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: "red" }}
                  >
                    {Number(summary.remaining_amount).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}{" "}
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
