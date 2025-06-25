// src/components/BookingListStatic.tsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
} from "@mui/material";

const statusTabs = [
  { key: "unassigned", label: "Chưa xếp phòng", count: 1 },
  { key: "checkin", label: "Sắp nhận phòng", count: 3 },
  { key: "checkout", label: "Sắp trả phòng", count: 6 },
  { key: "staying", label: "Đang lưu trú", count: 3 },
  { key: "upcoming", label: "Khách sẽ đến", count: 1 },
  { key: "new", label: "Đặt phòng mới", count: 3 },
];

const SAMPLE_ROWS = [
  {
    id: "POB00547",
    room: "Chưa xếp phòng",
    name: "Sanji",
    source: "walk-in",
    nights: 4,
    checkin: "26/06 13:00",
    checkout: "30/06 11:00",
    total: "3.200.000 đ",
  },
];

export default function BookingListStatic() {
  const [currentTab, setCurrentTab] = useState("unassigned");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const visibleRows = SAMPLE_ROWS.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ mt: 4 }}>
      <Paper
        elevation={4}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          boxShadow: 3,
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              gap: 1,
              overflowX: "auto",
              py: 1,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {statusTabs.map((tab) => {
              const sel = tab.key === currentTab;
              return (
                <Button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key)}
                  variant={sel ? "contained" : "outlined"}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    borderColor: sel ? "error.main" : "primary.light",
                    bgcolor: sel ? "error.main" : "transparent",
                    color: sel ? "common.white" : "primary.main",
                    "&:hover": {
                      bgcolor: sel ? "error.dark" : "primary.lighter",
                    },
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Typography fontWeight={600} fontSize="inherit">
                    {tab.label} ({tab.count})
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  "Mã đặt phòng",
                  "Tên phòng",
                  "Tên",
                  "Nguồn",
                  "Số đêm",
                  "Nhận phòng",
                  "Trả phòng",
                  "Tổng cộng",
                ].map((h) => (
                  <TableCell key={h}>
                    <Typography fontWeight={600}>{h}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.room}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.source}</TableCell>
                  <TableCell>{r.nights}</TableCell>
                  <TableCell>{r.checkin}</TableCell>
                  <TableCell>{r.checkout}</TableCell>
                  <TableCell>{r.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <Box
  sx={{
    px: 2,
    py: 1.5,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: 1,
    borderColor: "divider",
    backgroundColor: "background.paper",
  }}
>
  {/* Left */}
  <Typography variant="body2">
    Đang hiện {visibleRows.length} kết quả
  </Typography>

  {/* Right */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}> {/* Tăng gap từ 3 thành 4 */}
    <Typography variant="body2">Mỗi trang</Typography>
    <Select
      value={rowsPerPage}
      onChange={(e) => {
        setRowsPerPage(Number(e.target.value));
        setPage(0);
      }}
      size="small"
      sx={{
        minWidth: 90, // Tăng minWidth từ 80 thành 90
        maxWidth: 100, // Thêm maxWidth để giới hạn kích thước
        borderRadius: 1,
        "& .MuiSelect-select": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 0.75,
          fontSize: "0.875rem",
          pr: 4, // Tăng padding-right từ 3 thành 4
          pl: 1, // Thêm padding-left để căn chỉnh
        },
      }}
    >
      {[5, 10, 25].map((n) => (
        <MenuItem key={n} value={n}>
          {n}
        </MenuItem>
      ))}
    </Select>
  </Box>
</Box>
      </Paper>
    </Box>
  );
}
