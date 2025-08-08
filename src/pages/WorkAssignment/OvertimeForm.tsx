/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AlertTitle,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import api from "../../api/axios";

// ==================== TYPES & INTERFACES ====================
interface Employee {
  id: number;
  name: string;
  employee_code?: string;
  email?: string;
}

interface OvertimeRequest {
  id: number;
  employee_id: number;
  employee: Employee;
  overtime_type: 'after_shift' | 'custom';
  work_date: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

interface OvertimeRequestInput {
  employee_id: number;
  overtime_type: 'after_shift' | 'custom';
  duration?: number;
  start_datetime?: string;
  end_datetime?: string;
  reason?: string;
}

interface CreateOvertimeRequest {
  work_date: string;
  overtime_requests: OvertimeRequestInput[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface CreateOvertimeResponse {
  created: Array<{
    employee_id: number;
    employee_name: string;
  }>;
  errors: Array<{
    employee_id: number;
    employee_name?: string;
    reason: string;
  }>;
}

interface Statistics {
  total: number;
  afterShift: number;
  custom: number;
  employees: number;
}

// ==================== API SERVICE ====================
class OvertimeApiService {
  async getOvertimeRequests(filters?: { date?: string; employee_id?: number }): Promise<ApiResponse<OvertimeRequest[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
      
      const queryString = params.toString();
      const response = await api.get(`/overtime-requests${queryString ? `?${queryString}` : ''}`);
      
      return response.data;
    } catch (error: any) {
console.error('Get overtime requests error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Không thể tải danh sách đăng ký tăng ca');
    }
  }

  async createOvertimeRequests(data: CreateOvertimeRequest): Promise<ApiResponse<CreateOvertimeResponse>> {
    try {
      const response = await api.post('/overtime-requests', data);
      return response.data;
    } catch (error: any) {
      console.error('Create overtime requests error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Không thể tạo đăng ký tăng ca');
    }
  }

async getEmployees(): Promise<ApiResponse<Employee[]>> {
  try {
    // nếu backend có phân trang, xin thật nhiều để lấy hết
    const response = await api.get('/employees', { params: { per_page: 1000 } });
    const payload = response.data;

    let list: Employee[] = [];

    // 1) Backend trả mảng thuần
    if (Array.isArray(payload)) list = payload;

    // 2) Backend trả { success, data: [...] }
    else if (Array.isArray(payload?.data)) list = payload.data;

    // 3) Backend trả kiểu phân trang { data: { data: [...] } }
    else if (Array.isArray(payload?.data?.data)) list = payload.data.data;

    // 4) Một số API trả { employees: [...] }
    else if (Array.isArray(payload?.employees)) list = payload.employees;

    return { success: true, data: list };
  } catch (error: any) {
    console.error('Get employees error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Không thể tải danh sách nhân viên');
  }
}

}

const overtimeApi = new OvertimeApiService();

// ==================== THEME ====================
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

// ==================== STAT CARD COMPONENT ====================
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ==================== MAIN COMPONENT ====================
const OvertimeManagement: React.FC = () => {
  // State management
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    afterShift: 0,
custom: 0,
    employees: 0
  });
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [workDate, setWorkDate] = useState<Date | null>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [overtimeType, setOvertimeType] = useState<'after_shift' | 'custom'>('after_shift');
  const [duration, setDuration] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  
  // Filter state
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | ''>('');
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Error state for detailed error display
  const [submitErrors, setSubmitErrors] = useState<Array<{
    employee_id: number;
    employee_name?: string;
    reason: string;
  }>>([]);

  // Memoized functions to fix useEffect dependencies
  const loadEmployees = useCallback(async () => {
    try {
      const response = await overtimeApi.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  }, []);

  const loadOvertimeRequests = useCallback(async () => {
    try {
      setLoading(true);
      const filters: { date?: string; employee_id?: number } = {};
      
      if (filterDate) {
        filters.date = format(filterDate, 'yyyy-MM-dd');
      }
      if (filterEmployeeId) {
        filters.employee_id = filterEmployeeId as number;
      }

      const response = await overtimeApi.getOvertimeRequests(filters);
      if (response.success && response.data) {
        setOvertimeRequests(response.data);
        calculateStatistics(response.data);
      }
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterEmployeeId]);

  // Load initial data
  useEffect(() => {
    loadEmployees();
    loadOvertimeRequests();
  }, [loadEmployees, loadOvertimeRequests]);

  const calculateStatistics = (requests: OvertimeRequest[]) => {
    const stats: Statistics = {
      total: requests.length,
      afterShift: requests.filter(r => r.overtime_type === 'after_shift').length,
      custom: requests.filter(r => r.overtime_type === 'custom').length,
      employees: new Set(requests.map(r => r.employee_id)).size
    };
    setStatistics(stats);
  };
const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const resetForm = () => {
    setWorkDate(new Date());
    setSelectedEmployee('');
    setOvertimeType('after_shift');
    setDuration(1);
    setStartTime('');
    setEndTime('');
    setReason('');
    setSubmitErrors([]);
  };

  const validateForm = (): boolean => {
    if (!workDate) {
      showNotification('Vui lòng chọn ngày làm việc', 'error');
      return false;
    }

    if (!selectedEmployee) {
      showNotification('Vui lòng chọn nhân viên', 'error');
      return false;
    }

    if (overtimeType === 'custom') {
      if (!startTime || !endTime) {
        showNotification('Vui lòng chọn thời gian bắt đầu và kết thúc', 'error');
        return false;
      }

      if (startTime >= endTime) {
        showNotification('Thời gian kết thúc phải sau thời gian bắt đầu', 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitErrors([]);
      
      const overtimeRequest: OvertimeRequestInput = {
        employee_id: selectedEmployee as number,
        overtime_type: overtimeType,
        reason: reason.trim() || undefined,
      };

      if (overtimeType === 'after_shift') {
        overtimeRequest.duration = duration;
      } else {
        const workDateStr = format(workDate!, 'yyyy-MM-dd');
        overtimeRequest.start_datetime = `${workDateStr} ${startTime}`;
        overtimeRequest.end_datetime = `${workDateStr} ${endTime}`;
      }

      const response = await overtimeApi.createOvertimeRequests({
        work_date: format(workDate!, 'yyyy-MM-dd'),
        overtime_requests: [overtimeRequest]
      });

      if (response.success && response.data) {
        const { created, errors } = response.data;
        
        if (created.length > 0 && errors.length === 0) {
          showNotification(`Đăng ký tăng ca thành công cho ${created[0].employee_name}`, 'success');
          setIsModalOpen(false);
          resetForm();
          loadOvertimeRequests();
        } else if (errors.length > 0) {
          setSubmitErrors(errors);
          showNotification('Có lỗi xảy ra khi đăng ký tăng ca', 'error');
        }
      }
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterDate(null);
    setFilterEmployeeId('');
  };

  const formatDateTime = (dateTimeString: string): string => {
    try {
      return format(parseISO(dateTimeString), 'HH:mm');
    } catch {
      return dateTimeString;
    }
  };
const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
          {/* Header */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      backgroundColor: '#3b82f6',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ScheduleIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" component="h1" fontWeight={600}>
                      Quản lý tăng ca
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Hệ thống đăng ký và quản lý tăng ca nhân viên
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsModalOpen(true)}
                  sx={{ backgroundColor: '#3b82f6' }}
                >
                  Đăng ký tăng ca
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tổng đăng ký"
                value={statistics.total}
                icon={<CalendarIcon sx={{ color: '#3b82f6' }} />}
                color="#dbeafe"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Sau ca chính"
                value={statistics.afterShift}
                icon={<ScheduleIcon sx={{ color: '#0ea5e9' }} />}
                color="#e0f2fe"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tùy chỉnh"
                value={statistics.custom}
                icon={<SettingsIcon sx={{ color: '#8b5cf6' }} />}
                color="#f3e8ff"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Nhân viên"
                value={statistics.employees}
                icon={<GroupIcon sx={{ color: '#22c55e' }} />}
color="#dcfce7"
              />
            </Grid>
          </Grid>

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="end">
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Lọc theo ngày"
                    value={filterDate}
                    onChange={setFilterDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                    <TextField
                      sx={{ minWidth: 200, flex: 1 }}
                      label="Lọc theo ID nhân viên"
                      type="number"
                      value={filterEmployeeId}
                      onChange={(e) => setFilterEmployeeId(e.target.value ? Number(e.target.value) : '')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={loadOvertimeRequests}
                      disabled={loading}
                    >
                      Tải lại
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearFilters}
                    >
                      Xóa bộ lọc
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Danh sách đăng ký tăng ca
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : overtimeRequests.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Không có dữ liệu
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Không tìm thấy đăng ký tăng ca nào phù hợp với bộ lọc.
                  </Typography>
                </Box>
              ) : (
<TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nhân viên</TableCell>
                        <TableCell>Ngày làm việc</TableCell>
                        <TableCell>Loại tăng ca</TableCell>
                        <TableCell>Thời gian</TableCell>
                        <TableCell>Lý do</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overtimeRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {request.employee?.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {request.employee_id}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {formatDate(request.work_date)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.overtime_type === 'after_shift' ? 'Sau ca chính' : 'Tùy chỉnh'}
                              color={request.overtime_type === 'after_shift' ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {formatDateTime(request.start_datetime)} - {formatDateTime(request.end_datetime)}
                          </TableCell>
                          <TableCell>
                            {request.reason || '-'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(request.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Registration Modal */}
          <Dialog
            open={isModalOpen}
            onClose={() => !submitting && setIsModalOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                Đăng ký tăng ca
                <IconButton
onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Vui lòng điền đầy đủ thông tin để đăng ký tăng ca
              </Typography>

              {/* Display submit errors */}
              {submitErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <AlertTitle>Lỗi đăng ký tăng ca</AlertTitle>
                  {submitErrors.map((error, index) => (
                    <Typography key={index} variant="body2">
                      • {error.employee_name ? `${error.employee_name}: ` : ''}{error.reason}
                    </Typography>
                  ))}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <DatePicker
                  label="Ngày làm việc *"
                  value={workDate}
                  onChange={setWorkDate}
                  disabled={submitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <FormControl fullWidth disabled={submitting}>
                  <InputLabel>Chọn nhân viên *</InputLabel>
                  <Select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value as number)}
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    }
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.employee_code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl component="fieldset" disabled={submitting}>
                  <FormLabel component="legend">Loại tăng ca *</FormLabel>
                  <RadioGroup
                    value={overtimeType}
                    onChange={(e) => setOvertimeType(e.target.value as 'after_shift' | 'custom')}
                  >
                    <Card variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 2 }}>
                        <FormControlLabel
                          value="after_shift"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight={500}>
                                Sau ca chính
</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Tăng ca ngay sau ca làm việc cuối cùng
                              </Typography>
                            </Box>
                          }
                        />
                      </CardContent>
                    </Card>
                    
                    <Card variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <FormControlLabel
                          value="custom"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight={500}>
                                Tùy chỉnh
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Chọn thời gian tăng ca cụ thể
                              </Typography>
                            </Box>
                          }
                        />
                      </CardContent>
                    </Card>
                  </RadioGroup>
                </FormControl>

                {overtimeType === 'after_shift' ? (
                  <FormControl fullWidth disabled={submitting}>
                    <InputLabel>Số giờ tăng ca *</InputLabel>
                    <Select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value as number)}
                    >
                      {[1, 2, 3, 4, 5, 6].map((hour) => (
                        <MenuItem key={hour} value={hour}>
                          {hour} giờ
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Thời gian bắt đầu *"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        disabled={submitting}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Thời gian kết thúc *"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        disabled={submitting}
                      />
                    </Grid>
                  </Grid>
                )}
<TextField
                  fullWidth
                  label="Lý do tăng ca"
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả lý do cần tăng ca (không bắt buộc)"
                  disabled={submitting}
                />

                <Alert severity="warning" icon={<WarningIcon />}>
                  <AlertTitle>Lưu ý quan trọng:</AlertTitle>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Không thể đăng ký tăng ca cho ngày đã qua</li>
                    <li>Nhân viên làm đủ 2 ca chính không được tăng ca</li>
                    <li>Nhân viên làm 1 ca chính tối đa 4 giờ tăng ca</li>
                    <li>Nhân viên không có ca chính tối đa 6 giờ tăng ca</li>
                    <li>Thời gian tăng ca không được trùng với ca chính</li>
                  </ul>
                </Alert>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ backgroundColor: '#3b82f6' }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notification Snackbar */}
          <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={handleCloseNotification}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={handleCloseNotification}
              severity={notification.severity}
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default OvertimeManagement;
