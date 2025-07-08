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
import api from "../../api/axios";
import { Search } from "lucide-react";
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/statistics/revenue-table?page=${page}`);
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
  }, [page]);

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

        <TextField
          placeholder="Tìm kiếm (mã đặt phòng, khách hàng, số phòng)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            width: 300,
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
                        {Intl.NumberFormat("vi-VN").format(row.total_amount)} ₫
                      </TableCell>
                      <TableCell align="right">
                        {Intl.NumberFormat("vi-VN").format(row.deposit_amount)}{" "}
                        ₫
                      </TableCell>
                      <TableCell align="right">
                        {Intl.NumberFormat("vi-VN").format(
                          row.remaining_amount
                        )}{" "}
                        ₫
                      </TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {summary && (
              <Box mt={3}>
                <Typography variant="body2">
                  <b>Tổng tiền:</b> {summary.total_amount.toLocaleString()}₫ |{" "}
                  <b>Đặt cọc:</b> {summary.deposit_amount.toLocaleString()}₫ |{" "}
                  <b>Còn lại:</b> {summary.remaining_amount.toLocaleString()}₫
                </Typography>
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
