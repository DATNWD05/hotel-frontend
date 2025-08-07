/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../../css/RosterTable.css";

interface Employee {
  id: number;
  name: string;
  position: string;
  status: string;
  user?: {
    role?: {
      name: string;
    };
  };
}

interface ShiftOption {
  label: string;
  value: number | null;
}

interface AssignmentCell {
  employeeId: number;
  date: string;
  shiftIds: (number | null)[];
}

const SoftSelect = styled(Select)(({ theme }) => ({
  backgroundColor: "#f1f5f9",
  borderRadius: "9999px",
  fontSize: "13px",
  fontWeight: 500,
  minWidth: 90,
  paddingLeft: 12,
  paddingRight: 12,
  height: 32,
  border: "none",
  "& .MuiSelect-select": {
    paddingTop: 4,
    paddingBottom: 4,
  },
  "& fieldset": {
    border: "none",
  },
}));

const RosterTable: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftOptions, setShiftOptions] = useState<ShiftOption[]>([]);
  const [assignments, setAssignments] = useState<AssignmentCell[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf("week").add(1, "day")
  );
  const [searchTerm, setSearchTerm] = useState("");
  const thisWeekStart = dayjs().startOf("week").add(1, "day");
  const today = dayjs().startOf("day");
  const dates = Array.from({ length: 7 }, (_, i) =>
    currentWeekStart.add(i, "day").format("YYYY-MM-DD")
  );

  useEffect(() => {
    // Fetch employees
    api
      .get("/employees")
      .then((res) => {
        const active = res.data.data.filter(
          (emp: Employee) => emp.status !== "not_active"
        );
        setEmployees(active);
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách nhân viên:", err);
        toast.error("Không thể tải danh sách nhân viên!");
      });

    // Fetch shifts
    api
      .get("/shifts")
      .then((res) => {
        const options = res.data.map((shift: any) => ({
          label: shift.name,
          value: shift.id,
        }));
        setShiftOptions([{ label: "Trống", value: null }, ...options]);
      })
      .catch((err) => console.error("Lỗi lấy danh sách ca làm:", err));
  }, []);

  useEffect(() => {
    const fromDate = currentWeekStart.format("YYYY-MM-DD");
    const toDate = currentWeekStart.add(6, "day").format("YYYY-MM-DD");

    api

      .get("/work-assignments", {
        params: {
          from_date: fromDate,

          to_date: toDate,

          per_page: 1000,
        },
      })

      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];

        const mapped = data.reduce((acc: AssignmentCell[], a: any) => {
          const existing = acc.find(
            (item) =>
              item.employeeId === a.employee_id && item.date === a.work_date
          );

          if (existing) {
            existing.shiftIds.push(a.shift_id);
          } else {
            acc.push({
              employeeId: a.employee_id,

              date: a.work_date,

              shiftIds: a.shift_id ? [a.shift_id] : [],
            });
          }

          return acc;
        }, []);

        // Sắp xếp lại sau khi tải dữ liệu

        const sortedAssignments = mapped.map(
          (assignment: { shiftIds: (number | null)[] }) => ({
            ...assignment,

            shiftIds: sortShifts(assignment.shiftIds),
          })
        );

        setAssignments(sortedAssignments);
      })

      .catch((err) => console.error("Lỗi lấy danh sách phân công:", err));
  }, [currentWeekStart]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/api/import-roster", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Import thành công!");
      // Refresh assignments after import
      const from = currentWeekStart.format("YYYY-MM-DD");
      const to = currentWeekStart.add(6, "day").format("YYYY-MM-DD");
      api
        .get("/work-assignments", {
          params: { from_date: from, to_date: to, per_page: 1000 },
        })
        .then((res) => {
          const data = res.data.data || [];
          setAssignments(
            data.map((a: any) => ({
              employeeId: a.employee_id,
              date: a.work_date,
              shiftIds: sortShifts(a.shift_ids || []),
            }))
          );
        });
    } catch (error) {
      toast.error("Import thất bại!");
    }
  };

  const sortShifts = (shiftIds: (number | null)[]): (number | null)[] => {
    const shiftOrder: Record<string, number> = {
      "Ca Sáng": 1,
      "Ca Chiều": 2,
      "Ca Tối": 3,
    };

    // Tìm thông tin chi tiết ca làm
    const validShifts = shiftIds
      .filter((id): id is number => id !== null)
      .map((id) => {
        const label = shiftOptions.find((opt) => opt.value === id)?.label || "";
        return { id, order: shiftOrder[label] ?? 99 };
      });

    // Sắp xếp theo thứ tự ưu tiên
    const sorted = validShifts
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id as number | null);

    // Đảm bảo mảng có đúng 2 phần tử (bù null nếu thiếu)
    while (sorted.length < 2) {
      sorted.push(null);
    }

    return sorted;
  };

  const handleSelectChange = async (
    employeeId: number,
    date: string,
    index: number,
    value: number | null
  ) => {
    const isPast = dayjs(date).isBefore(today, "day");
    if (isPast) {
      toast.warn("Không thể chỉnh sửa ca cho ngày đã qua!");
      return;
    }

    // Cập nhật state trước
    setAssignments((prev) => {
      const found = prev.find(
        (a) => a.employeeId === employeeId && a.date === date
      );
      let newShiftIds = found ? [...found.shiftIds] : [null, null];

      if (index === 0) {
        newShiftIds[0] = value;
        // Nếu chọn "Trống" ca 1 -> reset luôn ca 2
        if (value === null) newShiftIds[1] = null;
      } else {
        newShiftIds[1] = value;
      }

      newShiftIds = sortShifts(newShiftIds);

      const updated = prev.filter(
        (a) => !(a.employeeId === employeeId && a.date === date)
      );
      if (newShiftIds.some((id) => id !== null)) {
        updated.push({ employeeId, date, shiftIds: newShiftIds });
      }

      // Gửi API cập nhật hoặc xóa
      api
        .post("/work-assignments", {
          assignments: [
            {
              employee_id: employeeId,
              work_date: date,
              shift_ids: newShiftIds.filter((id) => id !== null), // chỉ gửi ca hợp lệ
            },
          ],
        })
        .then((res) => {
          const { created_count, deleted_count, skipped_count, data } =
            res.data;
          if (skipped_count > 0) {
            data.skipped.forEach((skip: any) => {
              toast.warn(`Bỏ qua: ${skip.reason}`);
            });
          } else {
            if (newShiftIds.every((id) => id === null)) {
              toast.success(
                `Đã xoá toàn bộ phân công ngày ${dayjs(date).format("DD/MM")}`
              );
            } else {
              toast.success(
                `Cập nhật thành công: ${created_count} ca thêm, ${deleted_count} ca xóa`
              );
            }
          }
        })
        .catch(() => {
          toast.error("Lỗi khi cập nhật phân công!");
          return prev;
        });

      return updated;
    });
  };

  const handleExportExcel = () => {
    const data = assignments.map((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      return {
        Tên: emp?.name || "",
        Chức_vụ: emp?.position || "",
        Ngày: a.date,
        Ca: a.shiftIds
          .map(
            (id) =>
              shiftOptions.find((opt) => opt.value === id)?.label || "Trống"
          )
          .join(", "),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roster");
    XLSX.writeFile(wb, "roster.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const rows = assignments.map((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      return [
        emp?.name || "",
        emp?.position || "",
        a.date,
        a.shiftIds
          .map(
            (id) =>
              shiftOptions.find((opt) => opt.value === id)?.label || "Trống"
          )
          .join(", "),
      ];
    });
    (doc as any).autoTable({
      head: [["Tên", "Chức vụ", "Ngày", "Ca"]],
      body: rows,
    });
    doc.save("roster.pdf");
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.user?.role?.name || e.position)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <Box p={3} className="roster-container">
      <Typography
        variant="h5"
        fontWeight="bold"
        className="roster-title"
        sx={{ mb: 3, zIndex: 2, position: "relative" }}
      >
        Quản lý phân ca
      </Typography>

      {/* Thống kê */}
      <Grid
        container
        spacing={2}
        mb={2}
        ml={0}
        justifyContent="space-between"
        className="stats-container"
      >
        <Box
          className="stat-box"
          sx={{
            bgcolor: "#ffffff",
            borderRadius: "16px",
            width: "31%",
            height: "120px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            padding: "20px",
          }}
        >
          <GroupIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tổng nhân viên
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {employees.length}
            </Typography>
          </Box>
        </Box>

        <Box
          className="stat-box"
          sx={{
            bgcolor: "#ffffff",
            borderRadius: "16px",
            width: "31%",
            height: "120px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            padding: "20px",
          }}
        >
          <AccessTimeIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tổng ca
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {assignments.flatMap((a) => a.shiftIds).filter((id) => id).length}
            </Typography>
          </Box>
        </Box>

        <Box
          className="stat-box"
          sx={{
            bgcolor: "#ffffff",
            borderRadius: "16px",
            width: "31%",
            height: "120px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            padding: "20px",
          }}
        >
          <CalendarTodayIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tuần hiện tại
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {thisWeekStart.format("DD/MM/YYYY")} -{" "}
              {thisWeekStart.add(6, "day").format("DD/MM/YYYY")}
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* Toolbar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={2}
        className="toolbar-container"
      >
        <Box display="flex" gap={1} alignItems="center" className="nav-buttons">
          <Button
            variant="outlined"
            onClick={() =>
              setCurrentWeekStart(currentWeekStart.subtract(1, "week"))
            }
            className="nav-button"
          >
            <ChevronLeft /> Tuần trước
          </Button>
          <Typography>
            {currentWeekStart.format("DD/MM/YYYY")} -{" "}
            {currentWeekStart.add(6, "day").format("DD/MM/YYYY")}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setCurrentWeekStart(currentWeekStart.add(1, "week"))}
            className="nav-button"
          >
            Tuần sau <ChevronRight />
          </Button>
        </Box>
        <Box display="flex" gap={1} className="export-buttons">
          <TextField
            size="small"
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleExportExcel}
            className="export-button"
          >
            Excel
          </Button>
          <Button
            variant="contained"
            component="label"
            sx={{
              borderRadius: "999px",
              padding: "6px 24px",
              fontWeight: "bold",
              backgroundColor: "#d32f2f",
              color: "#fff",
              "&:hover": { backgroundColor: "#9a0007" },
            }}
          >
            Import
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Box>
      </Box>

      {/* Bảng */}
      <TableContainer component={Card} className="table-container">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>HỌ TÊN</TableCell>
              <TableCell>CHỨC VỤ</TableCell>
              {dates.map((date) => (
                <TableCell key={date}>
                  <Box textAlign="center">
                    <Typography fontWeight="bold">
                      {dayjs(date).format("DD/MM")}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {dayjs(date).format("ddd")}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredEmployees.map((employee, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Typography fontWeight="bold">{employee.name}</Typography>
                  <Typography fontSize={12} color="text.secondary">
                    ID: NV{String(employee.id).padStart(2, "0")}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={employee.user?.role?.name || "—"}
                    sx={{ backgroundColor: "#e6e9f1" }}
                  />
                </TableCell>
                {dates.map((date) => {
                  const assignment = assignments.find(
                    (a) => a.employeeId === employee.id && a.date === date
                  );
                  const shiftIds = assignment?.shiftIds || [null, null];
                  return (
                    <TableCell key={date}>
                      <Box display="flex" flexDirection="column" gap={1}>
                        {/* First Shift */}
                        <SoftSelect
                          value={shiftIds[0] !== null ? shiftIds[0] : ""}
                          onChange={(e) =>
                            handleSelectChange(
                              employee.id,
                              date,
                              0,
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={dayjs(date).isBefore(today, "day")}
                        >
                          {shiftOptions.map((option) => (
                            <MenuItem
                              key={option.value ?? "empty"}
                              value={option.value ?? ""}
                            >
                              {option.label}
                            </MenuItem>
                          ))}
                        </SoftSelect>
                        {/* Second Shift */}
                        <SoftSelect
                          value={shiftIds[1] ?? ""}
                          onChange={(e) =>
                            handleSelectChange(
                              employee.id,
                              date,
                              1,
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={
                            dayjs(date).isBefore(today, "day") || !shiftIds[0]
                          }
                        >
                          {shiftOptions
                            .filter((option) => option.value !== shiftIds[0])
                            .map((option) => (
                              <MenuItem
                                key={option.value ?? "empty"}
                                value={option.value ?? ""}
                              >
                                {option.label}
                              </MenuItem>
                            ))}
                        </SoftSelect>
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RosterTable;
