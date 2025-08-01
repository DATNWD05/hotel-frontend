import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import api from "../../api/axios"; // Điều chỉnh đường dẫn nếu cần

interface Employee {
  id: string;
  MaNV: string;
  name: string;
}

interface OvertimeFormData {
  employeeId: string;
  startDateTime: string; // Đổi thành startDateTime để khớp với backend
  endDateTime: string;   // Đổi thành endDateTime để khớp với backend
}

interface Shift {
  start_time: string;
  end_time: string;
}

interface WorkAssignment {
  employee_id: string;
  shift: Shift;
}

interface OvertimeRequest {
  employee_id: string;
  start_datetime: string;
  end_datetime: string;
  work_date: string;
}

// Hàm chuẩn hóa định dạng thời gian
const normalizeDateTime = (datetime: string): string => {
  return datetime.replace("T", " ").split(":")[0] + ":" + datetime.split(":")[1];
};

const OvertimeForm: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overtimeData, setOvertimeData] = useState<OvertimeFormData[]>([]);
  const [workAssignments, setWorkAssignments] = useState<
    Record<string, WorkAssignment[]>
  >({});
  const [existingOvertimeRequests, setExistingOvertimeRequests] = useState<
    Record<string, OvertimeRequest[]>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [workDate, setWorkDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Lấy danh sách nhân viên, phân công ca và yêu cầu tăng ca từ API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const employeeResponse = await api.get("/employees");
        if (
          employeeResponse.data.status === "success" &&
          Array.isArray(employeeResponse.data.data)
        ) {
          setEmployees(employeeResponse.data.data);
        } else {
          setEmployees([]);
        }

        const assignmentResponse = await api.get("/work-assignments", {
          params: { date: workDate },
        });
        if (
          assignmentResponse.data.status === "success" &&
          Array.isArray(assignmentResponse.data.data)
        ) {
          const assignmentsByEmployee = assignmentResponse.data.data.reduce(
            (acc: Record<string, WorkAssignment[]>, assignment: WorkAssignment) => {
              const employeeId = assignment.employee_id;
              if (!acc[employeeId]) acc[employeeId] = [];
              acc[employeeId].push(assignment);
              return acc;
            },
            {}
          );
          setWorkAssignments(assignmentsByEmployee);
        } else {
          setWorkAssignments({});
        }

        const overtimeResponse = await api.get("/overtime-requests", {
          params: { date: workDate },
        });
        if (
          overtimeResponse.data.status === "success" &&
          Array.isArray(overtimeResponse.data.data)
        ) {
          const overtimeByEmployee = overtimeResponse.data.data.reduce(
            (acc: Record<string, OvertimeRequest[]>, request: OvertimeRequest) => {
              const employeeId = request.employee_id;
              if (!acc[employeeId]) acc[employeeId] = [];
              acc[employeeId].push(request);
              return acc;
            },
            {}
          );
          setExistingOvertimeRequests(overtimeByEmployee);
        } else {
          setExistingOvertimeRequests({});
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Lỗi khi lấy dữ liệu:", err);
        setEmployees([]);
        setWorkAssignments({});
        setExistingOvertimeRequests({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workDate]);

  // Kiểm tra tính hợp lệ của thời gian
  const validateTime = (
    employeeId: string,
    startDateTime: string,
    endDateTime: string
  ) => {
    if (!startDateTime || !endDateTime) {
      setError(null);
      return true;
    }

    const now = new Date();
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (start < now && end < now) {
      setError(
        `Thời gian tăng ca của nhân viên ${employeeId} không được nằm hoàn toàn trong quá khứ`
      );
      return false;
    }

    const otHours = (end.getTime() - start.getTime()) / (1000 * 3600);
    const mainShiftsCount = workAssignments[employeeId]?.length || 0;
    const maxAllowed = mainShiftsCount >= 2 ? 0 : mainShiftsCount === 1 ? 4 : 6;

    if (mainShiftsCount >= 2) {
      setError(
        `Nhân viên ${employeeId} đã có 2 ca chính, không thể đăng ký tăng ca`
      );
      return false;
    }

    if (otHours > maxAllowed) {
      setError(
        `Tăng ca của nhân viên ${employeeId} (${otHours.toFixed(2)} tiếng) vượt quá giới hạn ${maxAllowed} tiếng`
      );
      return false;
    }

    const hasMainShiftConflict = workAssignments[employeeId]?.some((assignment) => {
      const shiftStart = new Date(`${workDate} ${assignment.shift.start_time}:00`);
      const shiftEnd = new Date(`${workDate} ${assignment.shift.end_time}:00`);
      if (shiftEnd < shiftStart) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }
      return (
        (start >= shiftStart && start < shiftEnd) ||
        (end > shiftStart && end <= shiftEnd) ||
        (start <= shiftStart && end >= shiftEnd)
      );
    });

    if (hasMainShiftConflict) {
      setError(
        `Thời gian tăng ca của nhân viên ${employeeId} trùng với ca chính đã phân công`
      );
      return false;
    }

    const existingRequests = existingOvertimeRequests[employeeId] || [];
    const hasOvertimeConflict = existingRequests.some((request) => {
      const existingStart = new Date(request.start_datetime);
      const existingEnd = new Date(request.end_datetime);
      return (
        (start >= existingStart && start < existingEnd) ||
        (end > existingStart && end <= existingEnd) ||
        (start <= existingStart && end >= existingEnd)
      );
    });

    if (hasOvertimeConflict) {
      setError(
        `Nhân viên ${employeeId} đã đăng ký tăng ca trong khoảng thời gian này`
      );
      return false;
    }

    setError(null);
    return true;
  };

  // Cập nhật giờ bắt đầu
  const handleStartDateTimeChange = (employeeId: string, value: string) => {
    setOvertimeData((prev) => {
      const existing = prev.find((data) => data.employeeId === employeeId);
      const updatedData = existing
        ? prev.map((data) =>
            data.employeeId === employeeId
              ? { ...data, startDateTime: value }
              : data
          )
        : [...prev, { employeeId, startDateTime: value, endDateTime: "" }];
      const endDateTime =
        updatedData.find((data) => data.employeeId === employeeId)?.endDateTime ||
        "";
      validateTime(employeeId, value, endDateTime);
      return updatedData;
    });
  };

  // Cập nhật giờ kết thúc
  const handleEndDateTimeChange = (employeeId: string, value: string) => {
    setOvertimeData((prev) => {
      const existing = prev.find((data) => data.employeeId === employeeId);
      const updatedData = existing
        ? prev.map((data) =>
            data.employeeId === employeeId
              ? { ...data, endDateTime: value }
              : data
          )
        : [...prev, { employeeId, startDateTime: "", endDateTime: value }];
      const startDateTime =
        updatedData.find((data) => data.employeeId === employeeId)?.startDateTime ||
        "";
      validateTime(employeeId, startDateTime, value);
      return updatedData;
    });
  };

  // Gửi yêu cầu tăng ca
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOvertimeData = overtimeData.filter((data) => {
      if (!data.startDateTime || !data.endDateTime) return false;
      return validateTime(data.employeeId, data.startDateTime, data.endDateTime);
    });

    if (error || validOvertimeData.length === 0) {
      setError(error || "Vui lòng nhập thời gian hợp lệ cho ít nhất một nhân viên");
      return;
    }

    const payload = {
      work_date: workDate,
      overtime_requests: validOvertimeData.map((data) => ({
        employee_id: data.employeeId,
        start_datetime: normalizeDateTime(data.startDateTime),
        end_datetime: normalizeDateTime(data.endDateTime),
        reason: null,
      })),
    };

    try {
      const response = await api.post("/overtime-requests", payload);
      if (response.data.success) {
        const { created, errors } = response.data.data;
        if (errors.length > 0) {
          setError(
            errors
              .map((err: any) => `Nhân viên ${err.employee_id}: ${err.reason}`)
              .join("; ")
          );
        } else {
          alert("Phiếu tăng ca đã được gửi thành công!");
          setOvertimeData([]);
        }
      } else {
        setError(
          "Có lỗi xảy ra khi gửi phiếu: " + (response.data.message || "")
        );
      }
    } catch (err: any) {
      setError(
        "Lỗi kết nối server: " + (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ bgcolor: "#fff", boxShadow: 3, borderRadius: 2, p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Phiếu Đăng Ký Tăng Ca
        </Typography>
        <TextField
          label="Ngày làm việc"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          fullWidth
        />
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã nhân viên</TableCell>
                <TableCell>Tên nhân viên</TableCell>
                <TableCell>Giờ bắt đầu</TableCell>
                <TableCell>Giờ kết thúc</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Đang tải danh sách nhân viên...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Không tải được danh sách nhân viên.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => {
                  const data = overtimeData.find(
                    (d) => d.employeeId === employee.id
                  ) || {
                    employeeId: employee.id,
                    startDateTime: "",
                    endDateTime: "",
                  };
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.MaNV}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="datetime-local"
                          value={data.startDateTime}
                          onChange={(e) =>
                            handleStartDateTimeChange(employee.id, e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="datetime-local"
                          value={data.endDateTime}
                          onChange={(e) =>
                            handleEndDateTimeChange(employee.id, e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          sx={{ borderRadius: 50 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          Gửi Đăng Ký
        </Button>

        {error && (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default OvertimeForm;