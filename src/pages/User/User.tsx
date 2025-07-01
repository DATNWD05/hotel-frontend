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
  Button,
  Box,
  TextField,
  Collapse,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Pagination,
  Snackbar,
  Alert,
  Card,
  CardContent,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import "../../css/User.css";
import { Link } from "react-router-dom";

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  password: string;
  role_id: number;
  status: string;
  remember_token?: string;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  birthday?: string | null | undefined;
  phone?: string | null | undefined;
  address?: string | null | undefined;
  cccd?: string | null | undefined;
  gender?: string | null | undefined;
  department_id?: number | null | undefined;
  hire_date?: string | null | undefined;
  status?: string | null | undefined;
  user_id?: number | undefined;
  user?: User | undefined;
}

interface Department {
  id: number;
  name: string;
}

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
  },
});

const User: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Employee, string>>>(
    {}
  );
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [credentialErrors, setCredentialErrors] = useState<
    Partial<Record<keyof User, string>>
  >({});
  const [generalCredentialError, setGeneralCredentialError] = useState<
    string | null
  >(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editedDetail, setEditedDetail] = useState<Partial<Employee>>({});
  const [viewCredentialsId, setViewCredentialsId] = useState<number | null>(
    null
  );
  const [editingCredentialsId, setEditingCredentialsId] = useState<
    number | null
  >(null);
  const [editedCredentials, setEditedCredentials] = useState<Partial<User>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setGeneralError(null);

        const [employeeRes, userRes, departmentRes, roleRes] =
          await Promise.all([
            api.get("/employees"),
            api.get("/users"),
            api.get("/departments"),
            api.get("/role"),
          ]);

        const rolesFromApi = roleRes.data.roles ?? [];
        setRoles(rolesFromApi);
        const departments = departmentRes.data.data;
        const users = userRes.data.data;
        const employees = employeeRes.data.data;

        const merged = employees.map((emp: Employee) => {
          const user = users.find((u: User) => u.id === emp.user_id);
          return {
            ...emp,
            user: user || undefined,
            department_id: emp.department_id ?? null,
          };
        });

        setEmployees(merged);
        setFilteredEmployees(merged);
        setDepartments(departments);
      } catch (err) {
        console.error(err);
        setGeneralError("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...employees];

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (employee.user?.email || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchQuery, employees]);

  const handleEditDetail = (employee: Employee) => {
    setEditingDetailId(employee.id);
    setViewDetailId(employee.id);
    setEditedDetail({
      name: employee.name || "",
      email: employee.email || "",
      role: employee.user?.role_id
        ? roleIdToLabel(employee.user.role_id)
        : "Không xác định",
      phone: employee.phone || "",
      address: employee.address || "",
      cccd: employee.cccd || "",
      gender: employee.gender || "",
      birthday: employee.birthday || "",
      department_id: employee.department_id ?? null,
      status: employee.status || "Làm việc",
      hire_date: employee.hire_date || "",
    });
    setErrors({});
    setGeneralError(null);
  };

  const handleChangeDetail = (
    field: keyof Employee,
    value: string | number
  ) => {
    setEditedDetail((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleChangeCredentials = (
    field: keyof User,
    value: string | number
  ) => {
    setEditedCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCredentialErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSaveDetail = async (id: number) => {
    try {
      setSaving(true);
      setErrors({});

      const currentEmployee = employees.find((e) => e.id === id);
      if (!currentEmployee || !currentEmployee.user_id) {
        setErrors({
          user_id: "Không tìm thấy user_id hoặc thông tin nhân viên.",
        });
        return;
      }

      const newErrors: Partial<Record<keyof Employee, string>> = {};

      if (!editedDetail.name) {
        newErrors.name = "Tên nhân viên không được để trống.";
      } else if (editedDetail.name.length > 100) {
        newErrors.name = "Tên không được dài quá 100 ký tự.";
      }

      if (!editedDetail.email) {
        newErrors.email = "Email không được để trống.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedDetail.email)) {
          newErrors.email = "Email không đúng định dạng.";
        }
      }

      if (editedDetail.phone && !/^\d{10,11}$/.test(editedDetail.phone)) {
        newErrors.phone = "Số điện thoại không hợp lệ.";
      }

      if (editedDetail.birthday) {
        const date = new Date(editedDetail.birthday);
        if (isNaN(date.getTime())) {
          newErrors.birthday = "Ngày sinh không đúng định dạng.";
        }
      }

      if (
        editedDetail.gender &&
        !["Nam", "Nữ", "Khác"].includes(editedDetail.gender)
      ) {
        newErrors.gender = "Giới tính phải là Nam, Nữ hoặc Khác.";
      }

      if (editedDetail.address && editedDetail.address.length > 255) {
        newErrors.address = "Địa chỉ không được vượt quá 255 ký tự.";
      }

      if (editedDetail.cccd && !/^\d{12}$/.test(editedDetail.cccd)) {
        newErrors.cccd = "CCCD phải là dãy số gồm 12 chữ số.";
      }

      if (!editedDetail.department_id) {
        newErrors.department_id = "Phòng ban không được để trống.";
      } else {
        const departmentExists = departments.some(
          (dept) => dept.id === Number(editedDetail.department_id)
        );
        if (!departmentExists) {
          newErrors.department_id = "Phòng ban không tồn tại.";
        }
      }

      if (!editedDetail.hire_date) {
        newErrors.hire_date = "Ngày tuyển dụng không được để trống.";
      } else {
        const hireDate = new Date(editedDetail.hire_date);
        if (isNaN(hireDate.getTime())) {
          newErrors.hire_date = "Ngày tuyển dụng không đúng định dạng.";
        }
      }

      if (!editedDetail.status) {
        newErrors.status = "Trạng thái không được để trống.";
      } else if (
        !["Làm việc", "Nghỉ làm", "Chờ Xét Duyệt"].includes(editedDetail.status)
      ) {
        newErrors.status =
          "Trạng thái phải là Làm việc, Nghỉ làm hoặc Chờ Xét Duyệt.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const payload = {
        name: editedDetail.name?.trim() ?? "",
        phone: editedDetail.phone?.trim() ?? null,
        birthday: editedDetail.birthday ?? null,
        gender: editedDetail.gender ?? null,
        address: editedDetail.address?.trim() ?? null,
        cccd: editedDetail.cccd?.trim() ?? null,
        department_id: Number(editedDetail.department_id),
        hire_date: editedDetail.hire_date ?? null,
        status: editedDetail.status ?? null,
        email: editedDetail.email ?? currentEmployee?.user?.email ?? "",
        role:
          editedDetail.role ??
          (currentEmployee?.user?.role_id === 1 ? "admin" : "staff"),
      };

      const res = await api.put(`/employees/${id}`, payload);

      if (res.status === 200) {
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, ...payload, user: e.user ?? undefined } : e
          )
        );
        setEditingDetailId(null);
        setViewDetailId(null);
        setErrors({});
        setSnackbarMessage("Cập nhật thông tin nhân viên thành công!");
        setSnackbarOpen(true);
      }
    } catch (err: unknown) {
      let errorMessage = "Lỗi khi cập nhật nhân viên.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422 && err.response.data?.errors) {
          const backendErrors: Partial<Record<keyof Employee, string>> = {};
          for (const [field, messages] of Object.entries(
            err.response.data.errors
          )) {
            backendErrors[field as keyof Employee] = (
              messages as string[]
            ).join(", ");
          }
          setErrors(backendErrors);
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
          setGeneralError(errorMessage);
        } else {
          setGeneralError(errorMessage);
        }
        console.error("Lỗi cập nhật nhân viên:", err);
      } else {
        console.error("Lỗi không xác định:", err);
        setGeneralError(errorMessage);
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async (userId: number) => {
    try {
      setSaving(true);
      setCredentialErrors({});

      const newErrors: Partial<Record<keyof User, string>> = {};

      if (!editedCredentials.role_id) {
        newErrors.role_id = "Vai trò là bắt buộc.";
      }

      if (!editedCredentials.status) {
        newErrors.status = "Trạng thái là bắt buộc.";
      }

      if (Object.keys(newErrors).length > 0) {
        setCredentialErrors(newErrors);
        return;
      }

      const payload = {
        role_id: Number(editedCredentials.role_id),
        status: editedCredentials.status,
      };

      const res = await api.put(`/users/${userId}`, payload);
      if (res.status === 200) {
        setEmployees((prev) =>
          prev.map((e) => {
            if (e.user_id === userId && e.user) {
              return {
                ...e,
                user: {
                  ...e.user,
                  role_id: payload.role_id as number,
                  status: payload.status as string,
                },
              };
            }
            return e;
          })
        );
        setEditingCredentialsId(null);
        setViewCredentialsId(null);
        setCredentialErrors({});
        setSnackbarMessage("Cập nhật thông tin tài khoản thành công!");
        setSnackbarOpen(true);
      }
    } catch (err: unknown) {
      let errorMessage = "Lỗi khi cập nhật thông tin tài khoản.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422 && err.response.data?.errors) {
          const backendErrors: Partial<Record<keyof User, string>> = {};
          for (const [field, messages] of Object.entries(
            err.response.data.errors
          )) {
            backendErrors[field as keyof User] = (messages as string[]).join(
              ", "
            );
          }
          setCredentialErrors(backendErrors);
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
          setGeneralCredentialError(errorMessage);
        } else {
          setGeneralCredentialError(errorMessage);
        }
        console.error("Lỗi cập nhật tài khoản:", err);
      } else {
        console.error("Lỗi không xác định:", err);
        setGeneralCredentialError(errorMessage);
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = (id: number) => {
    if (viewDetailId === id && editingDetailId !== id) {
      setViewDetailId(null);
    } else {
      setViewDetailId(id);
      setEditingDetailId(null);
      setViewCredentialsId(null);
      setErrors({});
      setCredentialErrors({});
    }
  };

  const roleIdToLabel = (role_id?: number): string => {
    const found = roles.find((r) => r.id === role_id);
    return found ? found.name : "Không xác định";
  };

  const handleDelete = async (id: number, user_id?: number) => {
    const userData = localStorage.getItem("user");
    const currentUserId = userData ? JSON.parse(userData).id : null;
    if (user_id === currentUserId) {
      setGeneralError("Bạn không thể xóa tài khoản của chính mình.");
      setSnackbarMessage("Bạn không thể xóa tài khoản của chính mình.");
      setSnackbarOpen(true);
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa nhân viên này?"
    );
    if (confirmed) {
      try {
        await api.delete(`/users/${user_id}`);
        setEmployees((prev) => prev.filter((e) => e.user_id !== user_id));
        setFilteredEmployees((prev) =>
          prev.filter((e) => e.user_id !== user_id)
        );
        setSnackbarMessage("Xóa nhân viên thành công!");
        setSnackbarOpen(true);
      } catch (err: unknown) {
        let errorMessage = "Lỗi khi xóa nhân viên.";
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || errorMessage;
        }
        setGeneralError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
        console.error("Lỗi xóa nhân viên:", err);
      }
    }
  };

  const handleViewCredentials = (id: number) => {
    if (viewCredentialsId === id && editingCredentialsId !== id) {
      setViewCredentialsId(null);
    } else {
      setViewCredentialsId(id);
      setViewDetailId(null);
      setEditingDetailId(null);
      setErrors({});
      setCredentialErrors({});
    }
  };

  const handleEditCredentials = (employee: Employee) => {
    setEditingCredentialsId(employee.id);
    setViewCredentialsId(employee.id);
    setEditedCredentials({
      role_id: employee.user?.role_id ?? 0,
      status: employee.user?.status ?? "active",
    });
    setCredentialErrors({});
    setGeneralCredentialError(null);
  };

  const handleCancelDetail = () => {
    setEditingDetailId(null);
    setViewDetailId(null);
    setErrors({});
    setGeneralError(null);
  };

  const handleCancelCredentials = () => {
    setEditingCredentialsId(null);
    setViewCredentialsId(null);
    setCredentialErrors({});
    setGeneralCredentialError(null);
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
  };

  const userData = localStorage.getItem("user");
  const currentUserId = userData ? JSON.parse(userData).id : null;
  const currentUserRoleId = userData ? JSON.parse(userData).role_id : null;

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  return (
    <div className="customer-wrapper">
      <div className="customer-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Nhân Viên {">"} Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" className="section-title" fontWeight={700}>
            Nhân Viên
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm (Tên hoặc Email)"
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
                "& input": { fontSize: "15px" },
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              component={Link}
              to="/customer/add"
              variant="contained"
              sx={{
                backgroundColor: "#4318FF", // tím sang
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2.5,
                py: 0.7,
                boxShadow: "0 2px 6px rgba(106, 27, 154, 0.3)",
                "&:hover": {
                  backgroundColor: "#7B1FA2",
                  boxShadow: "0 4px 12px rgba(106, 27, 154, 0.4)",
                },
              }}
            >
              + Thêm mới
            </Button>
          </Box>
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <div className="customer-loading-container">
              <CircularProgress />
              <Typography>Đang tải danh sách nhân viên...</Typography>
            </div>
          ) : generalError ? (
            <Typography color="error" className="customer-error-message">
              {generalError}
            </Typography>
          ) : filteredEmployees.length === 0 ? (
            <Typography className="customer-no-data">
              {searchQuery
                ? "Không tìm thấy nhân viên phù hợp."
                : "Không tìm thấy nhân viên nào."}
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
                        <b>Họ Tên</b>
                      </TableCell>
                      <TableCell>
                        <b>Email</b>
                      </TableCell>
                      <TableCell>
                        <b>Vai Trò</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Hành động</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedEmployees.map((emp) => (
                      <React.Fragment key={emp.id}>
                        <TableRow hover>
                          <TableCell>{emp.name}</TableCell>
                          <TableCell>
                            {emp.user?.email || "Không xác định"}
                          </TableCell>
                          <TableCell>
                            {emp.user?.role_id
                              ? roleIdToLabel(emp.user.role_id)
                              : "Không xác định"}
                          </TableCell>
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
                                onClick={() => handleViewDetail(emp.id)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                title="Xem tài khoản đăng nhập"
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
                                onClick={() => handleViewCredentials(emp.id)}
                              >
                                <AccountCircleIcon fontSize="small" />
                              </IconButton>
                              {emp.user_id !== currentUserId && (
                                <IconButton
                                  title="Xóa"
                                  sx={{
                                    color: "#d32f2f",
                                    bgcolor: "#ffebee",
                                    "&:hover": {
                                      bgcolor: "#ffcdd2",
                                      boxShadow:
                                        "0 2px 6px rgba(211, 47, 47, 0.4)",
                                    },
                                    transition: "all 0.2s ease-in-out",
                                  }}
                                  onClick={() =>
                                    handleDelete(emp.id, emp.user_id)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} style={{ padding: 0 }}>
                            <Collapse
                              in={
                                viewDetailId === emp.id ||
                                viewCredentialsId === emp.id
                              }
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
                                {viewDetailId === emp.id && (
                                  <>
                                    <h3>Thông tin nhân viên</h3>
                                    {editingDetailId === emp.id ? (
                                      <>
                                        <Box
                                          display="flex"
                                          flexDirection="column"
                                          gap={2}
                                        >
                                          <Box display="flex" gap={2}>
                                            <TextField
                                              label="Họ Tên"
                                              name="name"
                                              value={editedDetail.name || ""}
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "name",
                                                  e.target.value
                                                )
                                              }
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!errors.name}
                                              helperText={errors.name}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": {
                                                    borderColor: "#ccc",
                                                  },
                                                  "&:hover fieldset": {
                                                    borderColor: "#888",
                                                  },
                                                  "&.Mui-focused fieldset": {
                                                    borderColor: "#1976d2",
                                                    borderWidth: "2px",
                                                  },
                                                },
                                                "& label": {
                                                  backgroundColor: "#fff",
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
                                              value={editedDetail.email || ""}
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "email",
                                                  e.target.value
                                                )
                                              }
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!errors.email}
                                              helperText={errors.email}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": {
                                                    borderColor: "#ccc",
                                                  },
                                                  "&:hover fieldset": {
                                                    borderColor: "#888",
                                                  },
                                                  "&.Mui-focused fieldset": {
                                                    borderColor: "#1976d2",
                                                    borderWidth: "2px",
                                                  },
                                                },
                                                "& label": {
                                                  backgroundColor: "#fff",
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
                                              value={editedDetail.phone || ""}
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "phone",
                                                  e.target.value
                                                )
                                              }
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!errors.phone}
                                              helperText={errors.phone}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": {
                                                    borderColor: "#ccc",
                                                  },
                                                  "&:hover fieldset": {
                                                    borderColor: "#888",
                                                  },
                                                  "&.Mui-focused fieldset": {
                                                    borderColor: "#1976d2",
                                                    borderWidth: "2px",
                                                  },
                                                },
                                                "& label": {
                                                  backgroundColor: "#fff",
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
                                              value={editedDetail.address || ""}
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "address",
                                                  e.target.value
                                                )
                                              }
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!errors.address}
                                              helperText={errors.address}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": {
                                                    borderColor: "#ccc",
                                                  },
                                                  "&:hover fieldset": {
                                                    borderColor: "#888",
                                                  },
                                                  "&.Mui-focused fieldset": {
                                                    borderColor: "#1976d2",
                                                    borderWidth: "2px",
                                                  },
                                                },
                                                "& label": {
                                                  backgroundColor: "#fff",
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
                                              name="birthday"
                                              type="date"
                                              value={
                                                editedDetail.birthday || ""
                                              }
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "birthday",
                                                  e.target.value
                                                )
                                              }
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              InputLabelProps={{ shrink: true }}
                                              error={!!errors.birthday}
                                              helperText={errors.birthday}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": {
                                                    borderColor: "#ccc",
                                                  },
                                                  "&:hover fieldset": {
                                                    borderColor: "#888",
                                                  },
                                                  "&.Mui-focused fieldset": {
                                                    borderColor: "#1976d2",
                                                    borderWidth: "2px",
                                                  },
                                                },
                                                "& label": {
                                                  backgroundColor: "#fff",
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
                                              error={!!errors.gender}
                                            >
                                              <InputLabel>Giới tính</InputLabel>
                                              <Select
                                                name="gender"
                                                value={
                                                  editedDetail.gender || ""
                                                }
                                                onChange={(e) =>
                                                  handleChangeDetail(
                                                    "gender",
                                                    e.target.value
                                                  )
                                                }
                                                label="Giới tính"
                                              >
                                                <MenuItem value="">
                                                  Chọn giới tính
                                                </MenuItem>
                                                <MenuItem value="Nam">
                                                  Nam
                                                </MenuItem>
                                                <MenuItem value="Nữ">
                                                  Nữ
                                                </MenuItem>
                                                <MenuItem value="Khác">
                                                  Khác
                                                </MenuItem>
                                              </Select>
                                              {errors.gender && (
                                                <Typography
                                                  color="error"
                                                  variant="caption"
                                                >
                                                  {errors.gender}
                                                </Typography>
                                              )}
                                            </FormControl>
                                          </Box>
                                          <Box display="flex" gap={2}>
                                            <FormControl
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!errors.department_id}
                                            >
                                              <InputLabel>Phòng ban</InputLabel>
                                              <Select
                                                name="department_id"
                                                value={
                                                  editedDetail.department_id ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  handleChangeDetail(
                                                    "department_id",
                                                    Number(e.target.value)
                                                  )
                                                }
                                                label="Phòng ban"
                                              >
                                                <MenuItem value="">
                                                  Chọn phòng ban
                                                </MenuItem>
                                                {departments.map((dept) => (
                                                  <MenuItem
                                                    key={dept.id}
                                                    value={dept.id}
                                                  >
                                                    {dept.name}
                                                  </MenuItem>
                                                ))}
                                              </Select>
                                              {errors.department_id && (
                                                <Typography
                                                  color="error"
                                                  variant="caption"
                                                >
                                                  {errors.department_id}
                                                </Typography>
                                              )}
                                            </FormControl>
                                            <TextField
                                              label="CCCD"
                                              name="cccd"
                                              value={editedDetail.cccd || ""}
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "cccd",
                                                  e.target.value
                                                )
                                              }
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!errors.cccd}
                                              helperText={
                                                errors.cccd ||
                                                "Ví dụ: 123456789012"
                                              }
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": {
                                                    borderColor: "#ccc",
                                                  },
                                                  "&:hover fieldset": {
                                                    borderColor: "#888",
                                                  },
                                                  "&.Mui-focused fieldset": {
                                                    borderColor: "#1976d2",
                                                    borderWidth: "2px",
                                                  },
                                                },
                                                "& label": {
                                                  backgroundColor: "#fff",
                                                  padding: "0 4px",
                                                },
                                                "& label.Mui-focused": {
                                                  color: "#1976d2",
                                                },
                                              }}
                                            />
                                          </Box>
                                          <Box display="flex" gap={2}>
                                            <FormControl
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!errors.status}
                                            >
                                              <InputLabel>
                                                Trạng thái
                                              </InputLabel>
                                              <Select
                                                name="status"
                                                value={
                                                  editedDetail.status || ""
                                                }
                                                onChange={(e) =>
                                                  handleChangeDetail(
                                                    "status",
                                                    e.target.value
                                                  )
                                                }
                                                label="Trạng thái"
                                              >
                                                <MenuItem value="Làm việc">
                                                  Làm việc
                                                </MenuItem>
                                                <MenuItem value="Nghỉ làm">
                                                  Nghỉ làm
                                                </MenuItem>
                                                <MenuItem value="Chờ Xét Duyệt">
                                                  Chờ Xét Duyệt
                                                </MenuItem>
                                              </Select>
                                              {errors.status && (
                                                <Typography
                                                  color="error"
                                                  variant="caption"
                                                >
                                                  {errors.status}
                                                </Typography>
                                              )}
                                            </FormControl>
                                            <TextField
                                              label="Ngày tuyển dụng"
                                              name="hire_date"
                                              type="date"
                                              value={
                                                editedDetail.hire_date || ""
                                              }
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "hire_date",
                                                  e.target.value
                                                )
                                              }
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              InputLabelProps={{ shrink: true }}
                                              error={!!errors.hire_date}
                                              helperText={errors.hire_date}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": {
                                                    borderColor: "#ccc",
                                                  },
                                                  "&:hover fieldset": {
                                                    borderColor: "#888",
                                                  },
                                                  "&.Mui-focused fieldset": {
                                                    borderColor: "#1976d2",
                                                    borderWidth: "2px",
                                                  },
                                                },
                                                "& label": {
                                                  backgroundColor: "#fff",
                                                  padding: "0 4px",
                                                },
                                                "& label.Mui-focused": {
                                                  color: "#1976d2",
                                                },
                                              }}
                                            />
                                          </Box>
                                        </Box>
                                        <Box
                                          pb={3}
                                          mt={2}
                                          display="flex"
                                          gap={2}
                                        >
                                          <Button
                                            variant="contained"
                                            color="primary"
                                            className="customer-btn-save"
                                            onClick={() =>
                                              handleSaveDetail(emp.id)
                                            }
                                            disabled={saving}
                                          >
                                            {saving ? (
                                              <CircularProgress size={24} />
                                            ) : (
                                              "Lưu"
                                            )}
                                          </Button>
                                          <Button
                                            variant="outlined"
                                            className="customer-btn-cancel"
                                            color="secondary"
                                            onClick={handleCancelDetail}
                                            disabled={saving}
                                          >
                                            Hủy
                                          </Button>
                                        </Box>
                                        {generalError && (
                                          <Typography color="error" mt={1}>
                                            {generalError}
                                          </Typography>
                                        )}
                                      </>
                                    ) : (
                                      <Table className="customer-detail-table">
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Họ Tên:</strong>{" "}
                                              {emp.name}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Email:</strong>{" "}
                                              {emp.email}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Số Điện Thoại:</strong>{" "}
                                              {emp.phone || "Không xác định"}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Địa chỉ:</strong>{" "}
                                              {emp.address || "Không xác định"}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Ngày sinh:</strong>{" "}
                                              {emp.birthday || "Không xác định"}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Giới tính:</strong>{" "}
                                              {emp.gender || "Không xác định"}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Phòng ban:</strong>{" "}
                                              {departments.find(
                                                (d) =>
                                                  d.id === emp.department_id
                                              )?.name || "Không xác định"}
                                            </TableCell>
                                            <TableCell>
                                              <strong>CCCD:</strong>{" "}
                                              {emp.cccd || "Không xác định"}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Trạng thái:</strong>{" "}
                                              {emp.status || "Không xác định"}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Ngày tuyển dụng:</strong>{" "}
                                              {emp.hire_date ||
                                                "Không xác định"}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell colSpan={2}>
                                              <strong>Vai trò:</strong>{" "}
                                              {emp.user?.role_id
                                                ? roleIdToLabel(
                                                    emp.user.role_id
                                                  )
                                                : "Không xác định"}
                                            </TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    )}
                                    {(currentUserRoleId === 1 ||
                                      currentUserRoleId === 3) &&
                                      editingDetailId !== emp.id && (
                                        <Box mt={2}>
                                          <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() =>
                                              handleEditDetail(emp)
                                            }
                                            sx={{
                                              color: "#f57c00",
                                              borderColor: "#f57c00",
                                              "&:hover": {
                                                borderColor: "#ef6c00",
                                                backgroundColor: "#fff3e0",
                                              },
                                            }}
                                          >
                                            Chỉnh sửa thông tin nhân viên
                                          </Button>
                                        </Box>
                                      )}
                                  </>
                                )}
                                {viewCredentialsId === emp.id && (
                                  <>
                                    <h3>Thông tin tài khoản đăng nhập</h3>
                                    {editingCredentialsId === emp.id ? (
                                      <>
                                        <Box
                                          display="flex"
                                          flexDirection="column"
                                          gap={2}
                                        >
                                          <FormControl
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!credentialErrors.role_id}
                                          >
                                            <InputLabel>Vai trò</InputLabel>
                                            <Select
                                              name="role_id"
                                              value={
                                                editedCredentials.role_id ?? ""
                                              }
                                              onChange={(e) =>
                                                handleChangeCredentials(
                                                  "role_id",
                                                  Number(e.target.value)
                                                )
                                              }
                                              label="Vai trò"
                                            >
                                              <MenuItem value="">
                                                Chọn vai trò
                                              </MenuItem>
                                              {roles.map((role) => (
                                                <MenuItem
                                                  key={role.id}
                                                  value={role.id}
                                                >
                                                  {role.name}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                            {credentialErrors.role_id && (
                                              <Typography
                                                color="error"
                                                variant="caption"
                                              >
                                                {credentialErrors.role_id}
                                              </Typography>
                                            )}
                                          </FormControl>
                                          <FormControl
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!credentialErrors.status}
                                          >
                                            <InputLabel>Trạng thái</InputLabel>
                                            <Select
                                              name="status"
                                              value={
                                                editedCredentials.status ?? ""
                                              }
                                              onChange={(e) =>
                                                handleChangeCredentials(
                                                  "status",
                                                  e.target.value
                                                )
                                              }
                                              label="Trạng thái"
                                            >
                                              <MenuItem value="active">
                                                Hoạt động
                                              </MenuItem>
                                              <MenuItem value="not_active">
                                                Không hoạt động
                                              </MenuItem>
                                            </Select>
                                            {credentialErrors.status && (
                                              <Typography
                                                color="error"
                                                variant="caption"
                                              >
                                                {credentialErrors.status}
                                              </Typography>
                                            )}
                                          </FormControl>
                                        </Box>
                                        <Box
                                          pb={3}
                                          mt={2}
                                          display="flex"
                                          gap={2}
                                        >
                                          <Button
                                            variant="contained"
                                            color="primary"
                                            className="customer-btn-save"
                                            onClick={() => {
                                              const userId = emp.user?.id;
                                              if (!userId) {
                                                setGeneralCredentialError(
                                                  "Không tìm thấy ID người dùng."
                                                );
                                                setSnackbarMessage(
                                                  "Không tìm thấy ID người dùng."
                                                );
                                                setSnackbarOpen(true);
                                                return;
                                              }
                                              handleSaveCredentials(userId);
                                            }}
                                            disabled={saving}
                                          >
                                            {saving ? (
                                              <CircularProgress size={24} />
                                            ) : (
                                              "Lưu"
                                            )}
                                          </Button>
                                          <Button
                                            variant="outlined"
                                            className="customer-btn-cancel"
                                            color="secondary"
                                            onClick={handleCancelCredentials}
                                            disabled={saving}
                                          >
                                            Hủy
                                          </Button>
                                        </Box>
                                        {generalCredentialError && (
                                          <Typography color="error" mt={1}>
                                            {generalCredentialError}
                                          </Typography>
                                        )}
                                      </>
                                    ) : (
                                      <Table className="customer-detail-table">
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Email:</strong>{" "}
                                              {emp.user?.email ||
                                                "Không xác định"}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Vai trò:</strong>{" "}
                                              {emp.user?.role_id
                                                ? roleIdToLabel(
                                                    emp.user.role_id
                                                  )
                                                : "Không xác định"}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>
                                              <strong>Trạng thái:</strong>{" "}
                                              {emp.user?.status === "active"
                                                ? "Hoạt động"
                                                : emp.user?.status ===
                                                  "not_active"
                                                ? "Không hoạt động"
                                                : "Không xác định"}
                                            </TableCell>
                                            <TableCell>
                                              <strong>Ngày tạo:</strong>{" "}
                                              {emp.user?.created_at?.slice(
                                                0,
                                                10
                                              ) || "Không xác định"}
                                            </TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    )}
                                    {(currentUserRoleId === 1 ||
                                      currentUserRoleId === 3) &&
                                      editingCredentialsId !== emp.id && (
                                        <Box mt={2}>
                                          <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() =>
                                              handleEditCredentials(emp)
                                            }
                                            sx={{
                                              color: "#f57c00",
                                              borderColor: "#f57c00",
                                              "&:hover": {
                                                borderColor: "#ef6c00",
                                                backgroundColor: "#fff3e0",
                                              },
                                            }}
                                          >
                                            Chỉnh sửa tài khoản
                                          </Button>
                                        </Box>
                                      )}
                                  </>
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
    count={totalPages}
    page={currentPage}
    onChange={handlePageChange}
    shape="rounded"
    color="primary"
    siblingCount={0} // số trang gần kề 2 bên
    boundaryCount={1} // số trang đầu/cuối hiển thị
    showFirstButton
    showLastButton
    sx={{
      "& .MuiPaginationItem-root": {
        color: "#444",
        minWidth: "32px",
        height: "32px",
        fontSize: "14px",
        fontWeight: 500,
        borderRadius: "8px",
      },
      "& .Mui-selected": {
        backgroundColor: "#5B3EFF",
        color: "#fff",
        fontWeight: "bold",
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

export default User;
