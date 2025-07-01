import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Typography,
  Collapse,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Button,
  Snackbar,
  Alert,
  Pagination,
  CardContent,
  Card,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { SelectChangeEvent } from "@mui/material/Select";
import "../../css/Customer.css";
import api from "../../api/axios";
import { SearchIcon } from "lucide-react";

interface Customer {
  id: number;
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  note: string;
  bookings?: {
    id: number;
    customer_id: number;
    created_by: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
    deposit_amount: string;
    raw_total: string;
    discount_amount: string;
    total_amount: string;
  }[];
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  cccd?: string;
  note?: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse {
  data: Customer[];
  meta: Meta;
}

const Customer: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Customer | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

  const mapGenderToVietnamese = (gender: string): string => {
    switch (gender.toLowerCase()) {
      case "male":
        return "Nam";
      case "female":
        return "Nữ";
      case "other":
        return "Không xác định";
      default:
        return "Không xác định";
    }
  };

  const mapGenderToBackend = (gender: string): string => {
    switch (gender) {
      case "Nam":
        return "male";
      case "Nữ":
        return "female";
      case "Không xác định":
        return "other";
      default:
        return "other";
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      let allData: Customer[] = [];
      let page = 1;

      while (true) {
        const response = await api.get("/customers", { params: { page } });
        if (response.status === 200) {
          const data: ApiResponse = response.data;
          const sanitizedData = data.data.map((item) => ({
            ...item,
            id: Number(item.id) || 0,
            cccd: item.cccd || "Không xác định",
            name: item.name || "Không xác định",
            email: item.email || "Không xác định",
            phone: item.phone || "Không xác định",
            address: item.address || "Không xác định",
            date_of_birth: item.date_of_birth || "Không xác định",
            gender: mapGenderToVietnamese(item.gender || "other"),
            nationality: item.nationality || "Không xác định",
            note: item.note || "",
            bookings: item.bookings
              ? item.bookings.map((booking) => ({
                  id: Number(booking.id) || 0,
                  customer_id: Number(booking.customer_id) || 0,
                  created_by: booking.created_by || "Không xác định",
                  check_in_date: booking.check_in_date || "Không xác định",
                  check_out_date: booking.check_out_date || "Không xác định",
                  status: booking.status || "Không xác định",
                  deposit_amount: booking.deposit_amount || "0",
                  raw_total: booking.raw_total || "0",
                  discount_amount: booking.discount_amount || "0",
                  total_amount: booking.total_amount || "0",
                }))
              : [],
          }));
          allData = [...allData, ...sanitizedData];

          if (page >= data.meta.last_page) break;
          page++;
        } else {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }
      }

      setAllCustomers(allData);
      setCustomers(allData.slice(0, 10));
      setLastPage(Math.ceil(allData.length / 10));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
      setError(errorMessage);
      console.error("Lỗi khi tải danh sách khách hàng:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...allCustomers];

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
    setLastPage(Math.ceil(filtered.length / 10));
    setCustomers(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, allCustomers, currentPage]);

  const validateForm = (data: Customer): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Họ tên không được để trống";
    else if (data.name.length > 50)
      errors.name = "Họ tên không được vượt quá 50 ký tự";
    if (!data.email.trim()) errors.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = "Email không hợp lệ";
    if (!data.phone.trim()) errors.phone = "Số điện thoại không được để trống";
    else if (!/^\d{10,11}$/.test(data.phone))
      errors.phone = "Số điện thoại không hợp lệ";
    if (!data.address.trim()) errors.address = "Địa chỉ không được để trống";
    if (!data.date_of_birth.trim())
      errors.date_of_birth = "Ngày sinh không được để trống";
    if (!data.gender) errors.gender = "Vui lòng chọn giới tính";
    if (!data.nationality.trim())
      errors.nationality = "Quốc gia không được để trống";
    if (!data.cccd.trim()) errors.cccd = "CCCD không được để trống";
    else if (!/^\d{12}$/.test(data.cccd))
      errors.cccd = "CCCD phải là dãy số gồm 12 chữ số";
    if (data.note && data.note.length > 200)
      errors.note = "Ghi chú không được vượt quá 200 ký tự";
    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = { ...editFormData, [name]: value };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name && editFormData) {
      const updatedData = { ...editFormData, [name]: value };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setEditCustomerId(customer.id);
    setEditFormData({ ...customer });
    setValidationErrors({});
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editFormData) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setEditLoading(true);
    try {
      const customerId = Number(editFormData.id);
      if (isNaN(customerId)) {
        throw new Error("ID khách hàng không hợp lệ");
      }

      const { ...dataToSend } = editFormData;
      dataToSend.gender = mapGenderToBackend(editFormData.gender);

      const response = await api.put(`/customers/${customerId}`, dataToSend);
      if (response.status === 200) {
        await fetchCustomers();
        setEditCustomerId(null);
        setEditFormData(null);
        setSnackbarMessage("Cập nhật khách hàng thành công!");
        setSnackbarOpen(true);
      } else {
        throw new Error("Không thể cập nhật khách hàng");
      }
    } catch (err: unknown) {
      let errorMessage = "Đã xảy ra lỗi khi cập nhật khách hàng";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: {
            data?: { message?: string; errors?: { [key: string]: string[] } };
          };
        };
        errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.errors?.[
            Object.keys(axiosError.response?.data?.errors || {})[0]
          ]?.[0] ||
          errorMessage;
      }
      setEditError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error("Lỗi khi cập nhật khách hàng:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditCustomerId(null);
    setEditFormData(null);
    setValidationErrors({});
    setEditError(null);
  };

  const handleViewDetails = (id: number) => {
    if (selectedCustomerId === id && editCustomerId !== id) {
      setSelectedCustomerId(null);
    } else {
      setSelectedCustomerId(id);
      setEditCustomerId(null);
      setEditFormData(null);
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
    setCustomers(filteredCustomers.slice((page - 1) * 10, page * 10));
  };

  return (
    <div className="customer-wrapper">
      <div className="customer-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Khách Hàng &gt; Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" className="section-title" fontWeight={700}>
            Khách Hàng
          </Typography>

          <TextField
            variant="outlined"
            placeholder="Tìm kiếm (Tên hoặc SĐT)"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 300,
              bgcolor: "#fff",
              borderRadius: "8px",
              mt: { xs: 2, sm: 0 },
              "& input": {
                fontSize: "15px", // hoặc '18px' tùy mong muốn
              },
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <div className="customer-loading-container">
              <CircularProgress />
              <Typography>Đang tải danh sách khách hàng...</Typography>
            </div>
          ) : error ? (
            <Typography color="error" className="customer-error-message">
              {error}
            </Typography>
          ) : filteredCustomers.length === 0 ? (
            <Typography className="customer-no-data">
              {searchQuery
                ? "Không tìm thấy khách hàng phù hợp."
                : "Không tìm thấy khách hàng nào."}
            </Typography>
          ) : (
            <>
              <TableContainer
                component={Paper}
                className="customer-table-container"
              >
                <Table className="customer-table" sx={{ width: "100%" }}>
                  <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                    <TableRow>
                      <TableCell>
                        <b>Tên đầy đủ</b>
                      </TableCell>
                      <TableCell>
                        <b>Địa chỉ email</b>
                      </TableCell>
                      <TableCell>
                        <b>Số điện thoại</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Hành động</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {customers.map((customer) => (
                      <React.Fragment key={customer.id}>
                        <TableRow hover>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1}>
                              <IconButton
                                title="Xem chi tiết"
                                sx={{
                                  color: "#1976d2",
                                  bgcolor: "#e3f2fd",
                                  "&:hover": {
                                    bgcolor: "#bbdefb",
                                    boxShadow:
                                      "0 2px 6px rgba(25, 118, 210, 0.4)",
                                  },
                                  transition: "all 0.2s ease-in-out",
                                }}
                                onClick={() => handleViewDetails(customer.id)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>

                              <IconButton
                                title="Chỉnh sửa"
                                sx={{
                                  color: "#f57c00",
                                  bgcolor: "#fff3e0",
                                  "&:hover": {
                                    bgcolor: "#ffe0b2",
                                    boxShadow:
                                      "0 2px 6px rgba(245, 124, 0, 0.4)",
                                  },
                                  transition: "all 0.2s ease-in-out",
                                }}
                                onClick={() => handleEdit(customer)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={4} style={{ padding: 0 }}>
                            <Collapse
                              in={selectedCustomerId === customer.id}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box
                                sx={{
                                  width: "100%",
                                  bgcolor: "#f9f9f9",
                                  px: 3,
                                  py: 2,
                                  borderTop: "1px solid #ddd",
                                }}
                              ></Box>
                              <div className="customer-detail-container">
                                {editCustomerId === customer.id &&
                                editFormData ? (
                                  <>
                                    <h3>Thông tin khách hàng</h3>
                                    <Box
                                      display="flex"
                                      flexDirection="column"
                                      gap={2}
                                    >
                                      <Box display="flex" gap={2}>
                                        <TextField
                                          label="Họ Tên"
                                          name="name"
                                          value={editFormData.name}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.name}
                                          helperText={validationErrors.name}
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />

                                        <TextField
                                          label="Email"
                                          name="email"
                                          value={editFormData.email}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.email}
                                          helperText={validationErrors.email}
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                      </Box>
                                      <Box display="flex" gap={2}>
                                        <TextField
                                          label="Số Điện Thoại"
                                          name="phone"
                                          value={editFormData.phone}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.phone}
                                          helperText={validationErrors.phone}
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                        <TextField
                                          label="Địa chỉ"
                                          name="address"
                                          value={editFormData.address}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.address}
                                          helperText={validationErrors.address}
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                      </Box>
                                      <Box display="flex" gap={2}>
                                        <TextField
                                          label="Ngày sinh"
                                          name="date_of_birth"
                                          type="date"
                                          value={editFormData.date_of_birth}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          InputLabelProps={{ shrink: true }}
                                          error={
                                            !!validationErrors.date_of_birth
                                          }
                                          helperText={
                                            validationErrors.date_of_birth
                                          }
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                        <FormControl
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.gender}
                                        >
                                          <InputLabel>Giới tính</InputLabel>
                                          <Select
                                            name="gender"
                                            value={editFormData.gender}
                                            onChange={handleSelectChange}
                                            label="Giới tính"
                                          >
                                            <MenuItem value="">
                                              Chọn giới tính
                                            </MenuItem>
                                            <MenuItem value="Nam">Nam</MenuItem>
                                            <MenuItem value="Nữ">Nữ</MenuItem>
                                            <MenuItem value="Không xác định">
                                              Không xác định
                                            </MenuItem>
                                          </Select>
                                          {validationErrors.gender && (
                                            <Typography
                                              color="error"
                                              variant="caption"
                                            >
                                              {validationErrors.gender}
                                            </Typography>
                                          )}
                                        </FormControl>
                                      </Box>
                                      <Box display="flex" gap={2}>
                                        <TextField
                                          label="Quốc gia"
                                          name="nationality"
                                          value={editFormData.nationality}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.nationality}
                                          helperText={
                                            validationErrors.nationality
                                          }
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                        <TextField
                                          label="CCCD"
                                          name="cccd"
                                          value={editFormData.cccd}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.cccd}
                                          helperText={
                                            validationErrors.cccd ||
                                            "Ví dụ: 123456789012"
                                          }
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                      </Box>
                                      <Box display="flex" gap={2}>
                                        <TextField
                                          label="Ghi chú"
                                          name="note"
                                          value={editFormData.note}
                                          onChange={handleChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.note}
                                          helperText={
                                            validationErrors.note ||
                                            "Tối đa 200 ký tự"
                                          }
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc", // viền mặc định
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888", // viền khi hover
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2", // viền khi focus
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff", // tránh label bị chồng lên viền
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                      </Box>
                                    </Box>

                                    <Box pb={3} mt={2} display="flex" gap={2}>
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        className="customer-btn-save"
                                        onClick={handleSave}
                                        disabled={editLoading}
                                      >
                                        Lưu
                                      </Button>

                                      <Button
                                        variant="outlined"
                                        className="customer-btn-cancel"
                                        color="secondary"
                                        onClick={handleCancel}
                                        disabled={editLoading}
                                      >
                                        Hủy
                                      </Button>
                                    </Box>
                                    {editError && (
                                      <Typography color="error" mt={1}>
                                        {editError}
                                      </Typography>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <h3>Thông tin khách hàng</h3>
                                    <Table className="customer-detail-table">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>
                                            <strong>Họ Tên:</strong>{" "}
                                            {customer.name}
                                          </TableCell>
                                          <TableCell>
                                            <strong>Email:</strong>{" "}
                                            {customer.email}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>
                                            <strong>Số Điện Thoại:</strong>{" "}
                                            {customer.phone}
                                          </TableCell>
                                          <TableCell>
                                            <strong>Địa chỉ:</strong>{" "}
                                            {customer.address}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>
                                            <strong>Ngày sinh:</strong>{" "}
                                            {customer.date_of_birth}
                                          </TableCell>
                                          <TableCell>
                                            <strong>Giới tính:</strong>{" "}
                                            {customer.gender}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>
                                            <strong>Quốc gia:</strong>{" "}
                                            {customer.nationality}
                                          </TableCell>
                                          <TableCell>
                                            <strong>CCCD:</strong>{" "}
                                            {customer.cccd}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell colSpan={2}>
                                            <strong>Ghi chú:</strong>{" "}
                                            {customer.note}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </>
                                )}

                                <h3>Đặt phòng</h3>
                                {customer.bookings &&
                                customer.bookings.length > 0 ? (
                                  <Table className="customer-detail-table">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Mã Đặt Phòng</TableCell>
                                        <TableCell>Người Tạo</TableCell>
                                        <TableCell>Ngày Nhận Phòng</TableCell>
                                        <TableCell>Ngày Trả Phòng</TableCell>
                                        <TableCell>Trạng Thái</TableCell>
                                        <TableCell>Đặt Cọc</TableCell>
                                        <TableCell>Tổng Gốc</TableCell>
                                        <TableCell>Tổng Giảm Giá</TableCell>
                                        <TableCell>Tổng Cuối</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {customer.bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                          <TableCell>
                                            {booking.id || "Không xác định"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.created_by ||
                                              "Không xác định"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.check_in_date ||
                                              "Không xác định"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.check_out_date ||
                                              "Không xác định"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.status || "Không xác định"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.deposit_amount || "0"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.raw_total || "0"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.discount_amount || "0"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.total_amount || "0"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <Typography>
                                    Không có thông tin đặt phòng.
                                  </Typography>
                                )}
                              </div>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                <Pagination
                  count={lastPage}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                  siblingCount={0} // 👈 hiện 0 số hai bên trang hiện tại
                  boundaryCount={1} // 👈 hiện 1 số ở đầu/cuối (ví dụ: 1 ... 5 ... 10)
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
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={
            snackbarMessage.includes("thành công") ? "success" : "error"
          }
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Customer;
