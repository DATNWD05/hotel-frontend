import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import api from '../../api/axios'; // Điều chỉnh đường dẫn nếu cần (ví dụ: ../api/axios)

interface Employee {
  id: string;
  MaNV: string;
  name: string;
}

interface OvertimeFormData {
  employeeId: string;
  startTime: string;
  endTime: string;
}

const OvertimeForm: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overtimeData, setOvertimeData] = useState<OvertimeFormData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Lấy danh sách nhân viên từ API sử dụng axios
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await api.get('/employees');
        console.log('API Response /employees:', response.data); // Debug phản hồi
        if (response.data.status === 'success' && Array.isArray(response.data.data)) {
          setEmployees(response.data.data);
        } else {
          console.error('Dữ liệu từ API không hợp lệ:', response.data);
          setEmployees([]);
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách nhân viên:', err.response?.data || err.message);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Cập nhật giờ bắt đầu cho một nhân viên
  const handleStartTimeChange = (employeeId: string, value: string) => {
    setOvertimeData((prev) => {
      const existing = prev.find((data) => data.employeeId === employeeId);
      const updatedData = existing
        ? prev.map((data) =>
            data.employeeId === employeeId ? { ...data, startTime: value } : data
          )
        : [...prev, { employeeId, startTime: value, endTime: '' }];
      const endTime = updatedData.find((data) => data.employeeId === employeeId)?.endTime || '';
      validateTime(employeeId, value, endTime);
      return updatedData;
    });
  };

  // Cập nhật giờ kết thúc cho một nhân viên
  const handleEndTimeChange = (employeeId: string, value: string) => {
    setOvertimeData((prev) => {
      const existing = prev.find((data) => data.employeeId === employeeId);
      const updatedData = existing
        ? prev.map((data) =>
            data.employeeId === employeeId ? { ...data, endTime: value } : data
          )
        : [...prev, { employeeId, startTime: '', endTime: value }];
      const startTime = updatedData.find((data) => data.employeeId === employeeId)?.startTime || '';
      validateTime(employeeId, startTime, value);
      return updatedData;
    });
  };

  // Kiểm tra thứ tự thời gian
  const validateTime = (employeeId: string, startTime: string, endTime: string) => {
    if (startTime && endTime) {
      const start = new Date(`1970-01-01 ${startTime}:00`);
      const end = new Date(`1970-01-01 ${endTime}:00`);
      if (end < start) {
        setError(`Thời gian kết thúc của ${employeeId} phải sau thời gian bắt đầu`);
      } else {
        setError(null);
      }
    } else {
      setError(null); // Reset lỗi nếu không có cả hai giá trị
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOvertimeData = overtimeData.filter((data) => {
      if (data.startTime && data.endTime) {
        const start = new Date(`1970-01-01 ${data.startTime}:00`);
        const end = new Date(`1970-01-01 ${data.endTime}:00`);
        return end >= start;
      }
      return data.startTime || data.endTime; // Chỉ gửi nếu có ít nhất một giá trị
    });

    if (error) return;

    const payload = {
      work_date: new Date().toISOString().split('T')[0], // Mặc định là ngày hiện tại (31/07/2025)
      overtime_requests: validOvertimeData.map((data) => ({
        employee_id: data.employeeId,
        start_time: data.startTime || null,
        end_time: data.endTime || null,
        reason: null,
      })),
    };

    try {
      const response = await api.post('/overtime-requests', payload);
      console.log('Submit Response /overtime-requests:', response.data); // Debug phản hồi
      if (response.data.success) {
        alert('Phiếu tăng ca đã được gửi thành công!');
        setOvertimeData([]);
      } else {
        setError('Có lỗi xảy ra khi gửi phiếu: ' + (response.data.message || ''));
      }
    } catch (err) {
      console.error('Submit Error:', err.response?.data || err.message);
      setError('Lỗi kết nối server: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ bgcolor: '#fff', boxShadow: 3, borderRadius: 2, p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Phiếu Đăng Ký Tăng Ca
        </Typography>

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
                  const data = overtimeData.find((d) => d.employeeId === employee.MaNV) || {
                    employeeId: employee.MaNV,
                    startTime: '',
                    endTime: '',
                  };
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.MaNV}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="time"
                          value={data.startTime}
                          onChange={(e) => handleStartTimeChange(employee.MaNV, e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="time"
                          value={data.endTime}
                          onChange={(e) => handleEndTimeChange(employee.MaNV, e.target.value)}
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