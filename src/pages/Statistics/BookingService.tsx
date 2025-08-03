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
import { toast } from "react-toastify";
import api from "../../api/axios";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

interface BookingService {
  service_name: string;
  category_name: string;
  total_quantity: number;
  total: number;
}

export default function BookingService() {
  const [data, setData] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [summary, setSummary] = useState<{ total_amount: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { page, per_page: 10 };
      if (fromDate) params.from_date = fromDate.format("YYYY-MM-DD");
      if (toDate) params.to_date = toDate.format("YYYY-MM-DD");
      if (search) params.search = search;

      const res = await api.get(`/statistics/booking-service-table`, { params });
      setData(res.data.data || []);
      setTotalPage(res.data.pagination?.last_page || 1);
      setSummary(res.data.summary || { total_amount: 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi tải dữ liệu dịch vụ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, fromDate, toDate, search]);

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
            placeholder="Tìm kiếm (Tên dịch vụ hoặc nhóm)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{
              width: 350,
              height: 40,
              backgroundColor: "white",
              borderRadius: "7px",
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "10px",
                paddingRight: "8px",
              },
              "& input": {
                padding: "12px 10px",
                fontSize: "16px",
                fontWeight: 500,
              },
              "& .MuiInputAdornment-root svg": {
                fontSize: "20px",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={22} />
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
        ) : data.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">Không tìm thấy dữ liệu</Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 400, overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Tên dịch vụ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nhóm dịch vụ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Tổng số lượng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Tổng tiền
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow
                      key={idx}
                      hover
                      sx={{ "&:last-child td": { borderBottom: "none" } }}
                    >
                      <TableCell>{row.service_name}</TableCell>
                      <TableCell>{row.category_name}</TableCell>
                      <TableCell align="center">{row.total_quantity}</TableCell>
                      <TableCell align="right">
                        {Intl.NumberFormat("vi-VN").format(Math.round(row.total))}{" "}
                        ₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {summary && (
              <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
                <Box sx={{ minWidth: 260, textAlign: "left" }}>
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
                    {Number(summary.total_amount).toLocaleString("vi-VN", {
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