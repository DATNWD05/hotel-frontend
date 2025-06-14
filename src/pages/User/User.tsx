import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  Tooltip,
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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";
import "../../css/User.css";

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
            api.get("/role"), // giữ nguyên endpoint của bạn
          ]);

        // --- Thay đổi ở đây ---
        // trích mảng roles từ response.roles
        const rolesFromApi = roleRes.data.roles ?? [];
        console.log("Roles từ API:", rolesFromApi);
        setRoles(rolesFromApi);
        // --- hết thay đổi ---

        const departments = departmentRes.data.data;
        const users = userRes.data.data;
        const employees = employeeRes.data.data;

        // merge employees + user như trước
        const merged = employees.map((emp: Employee) => {
          const user = users.find((u: User) => u.id === emp.user_id);
          return {
            ...emp,
            user: user || undefined,
            department_id: emp.department_id ?? null,
            // (những field còn lại giữ nguyên, không cần override `role:`)
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

      if (editedDetail.cccd) {
        if (!/^\d{12}$/.test(editedDetail.cccd)) {
          newErrors.cccd = "CCCD phải là dãy số gồm 12 chữ số.";
        }
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
    <div className="user-wrapper">
      <div className="user-title">
        <div className="user-header-content">
          <h2>
            Employee <b>Details</b>
          </h2>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm (Tên hoặc Email)"
              className="search-input"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: "300px" }}
            />
            <RouterLink to="/user/add" className="user-btn-add">
              Thêm mới
            </RouterLink>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="user-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách nhân viên...</Typography>
        </div>
      ) : generalError ? (
        <Typography color="error" className="user-error-message">
          {generalError}
        </Typography>
      ) : filteredEmployees.length === 0 ? (
        <Typography className="no-data">
          {searchQuery
            ? "Không tìm thấy nhân viên phù hợp."
            : "Không tìm thấy nhân viên nào."}
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="user-table-container">
            <Table className="user-table">
              <TableHead>
                <TableRow>
                  <TableCell>Họ Tên</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Vai Trò</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedEmployees.map((emp) => (
                  <React.Fragment key={emp.id}>
                    <TableRow>
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
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            className="user-action-view"
                            onClick={() => handleViewDetail(emp.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xem tài khoản đăng nhập">
                          <IconButton
                            className="user-action-view"
                            onClick={() => handleViewCredentials(emp.id)}
                          >
                            <AccountCircleIcon />
                          </IconButton>
                        </Tooltip>
                        {emp.user_id !== currentUserId && (
                          <Tooltip title="Xóa">
                            <IconButton
                              className="user-action-delete"
                              onClick={() => handleDelete(emp.id, emp.user_id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} style={{ padding: 0 }}>
                        <Collapse
                          in={
                            viewDetailId === emp.id ||
                            viewCredentialsId === emp.id
                          }
                        >
                          <div className="detail-container">
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
                                        />
                                      </Box>
                                      <Box display="flex" gap={2}>
                                        <TextField
                                          label="Ngày sinh"
                                          name="birthday"
                                          type="date"
                                          value={editedDetail.birthday || ""}
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
                                            value={editedDetail.gender || ""}
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
                                            <MenuItem value="Nam">Nam</MenuItem>
                                            <MenuItem value="Nữ">Nữ</MenuItem>
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
                                              editedDetail.department_id || ""
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
                                            errors.cccd || "Ví dụ: 123456789012"
                                          }
                                        />
                                      </Box>
                                      <Box display="flex" gap={2}>
                                        <FormControl
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                        >
                                          <InputLabel>Trạng thái</InputLabel>
                                          <Select
                                            name="status"
                                            value={editedDetail.status || ""}
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
                                        </FormControl>
                                        <TextField
                                          label="Ngày tuyển dụng"
                                          name="hire_date"
                                          type="date"
                                          value={editedDetail.hire_date || ""}
                                          onChange={(e) =>
                                            handleChangeDetail(
                                              "hire_date",
                                              e.target.value
                                            )
                                          }
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          slotProps={{
                                            inputLabel: { shrink: true },
                                          }}
                                          error={!!errors.hire_date}
                                          helperText={errors.hire_date}
                                        />
                                      </Box>
                                      <Box display="flex" gap={2}>
                                        <TextField
                                          label="Vai trò"
                                          name="role"
                                          value={
                                            emp.user?.role_id
                                              ? roleIdToLabel(emp.user.role_id)
                                              : "Không xác định"
                                          }
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          slotProps={{
                                            input: { readOnly: true },
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                    <Box mt={2} display="flex" gap={2}>
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleSaveDetail(emp.id)}
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
                                  <Table className="user-detail-table">
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Họ Tên:</strong> {emp.name}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Email:</strong> {emp.email}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Số Điện Thoại:</strong>{" "}
                                          {emp.phone}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Địa chỉ:</strong>{" "}
                                          {emp.address}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Ngày sinh:</strong>{" "}
                                          {emp.birthday}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Giới tính:</strong>{" "}
                                          {emp.gender}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Phòng ban:</strong>{" "}
                                          {departments.find(
                                            (d) => d.id === emp.department_id
                                          )?.name || "Không xác định"}
                                        </TableCell>
                                        <TableCell>
                                          <strong>CCCD:</strong> {emp.cccd}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Trạng thái:</strong> {emp.status || "Không xác định"}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Ngày tuyển dụng:</strong>{" "}
                                          {emp.hire_date}
                                        </TableCell>
                                      </TableRow>

                                      <TableRow>
                                        <TableCell colSpan={2}>
                                          <strong>Vai trò:</strong>{" "}
                                          {emp.user?.role_id
                                            ? roleIdToLabel(emp.user.role_id)
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
                                        onClick={() => handleEditDetail(emp)}
                                        className="action-edit"
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
                                          value={editedCredentials.status ?? ""}
                                          onChange={(e) =>
                                            handleChangeCredentials(
                                              "status",
                                              e.target.value
                                            )
                                          }
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
                                    <Box mt={2} display="flex" gap={2}>
                                      <Button
                                        variant="contained"
                                        color="primary"
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
                                  <Table className="user-detail-table">
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Email:</strong>{" "}
                                          {emp.user?.email || "Không xác định"}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Vai trò:</strong>{" "}
                                          {emp.user?.role_id
                                            ? roleIdToLabel(emp.user.role_id)
                                            : "Không xác định"}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Trạng thái:</strong>{" "}
                                          {emp.user?.status === "active"
                                            ? "Hoạt động"
                                            : emp.user?.status === "not_active"
                                            ? "Không hoạt động"
                                            : "Không xác định"}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Ngày tạo:</strong>{" "}
                                          {emp.user?.created_at?.slice(0, 10) ||
                                            "Không xác định"}
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
                                        className="action-edit"
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
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}

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
