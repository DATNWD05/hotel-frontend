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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";

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
  const [errors, setErrors] = useState<Partial<Record<keyof Employee, string>>>(
    {}
  );
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [credentialErrors, setCredentialErrors] = useState<
    Partial<Record<keyof User, string>>
  >({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [generalCredentialError, setGeneralCredentialError] = useState<
    string | null
  >(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeeRes, userRes, departmentRes] = await Promise.all([
          api.get("/employees"),
          api.get("/users"),
          api.get("/departments"),
        ]);

        // console.log("User API response:", userRes.data.data); // Kiểm tra dữ liệu users

        const employees = employeeRes.data.data;
        const users = userRes.data.data;
        const departments = departmentRes.data.data;

        const merged = employees.map((emp: Employee) => {
          const user = users.find((u: User) => u.id === emp.user_id);
          // console.log(`Employee ${emp.id} - Matched user:`, user); // Kiểm tra user tương ứng
          return {
            ...emp,
            user: user || undefined,
          };
        });

        setEmployees(merged);
        setDepartments(departments);
      } catch (err) {
        setGeneralError("Lỗi khi tải dữ liệu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditDetail = (employee: Employee) => {
    setEditingDetailId(employee.id);
    setEditedDetail({
      name: employee.name || "",
      email: employee.email || "",
      role: employee.role || "",
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
  };

  const handleChangeDetail = (
    field: keyof Employee,
    value: string | number
  ) => {
    setEditedDetail((prev) => ({ ...prev, [field]: value }));
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
    setEditedCredentials((prev) => ({ ...prev, [field]: value }));
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

      if (editedDetail.phone && editedDetail.phone.length > 20) {
        newErrors.phone = "Số điện thoại không được vượt quá 20 ký tự.";
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
        if (!/^[0-9]+$/.test(editedDetail.cccd)) {
          newErrors.cccd = "CCCD chỉ được chứa các chữ số.";
        } else if (editedDetail.cccd.length < 10) {
          newErrors.cccd = "CCCD phải có ít nhất 10 chữ số.";
        } else if (editedDetail.cccd.length > 12) {
          newErrors.cccd = "CCCD không được vượt quá 12 chữ số.";
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
          "Trạng thái phải là Làm việc, Nghỉ làm, Chờ Xét Duyệt.";
      }

      if (!editedDetail.role) {
        newErrors.role = "Vai trò không được để trống.";
      } else if (!["staff", "admin", "user"].includes(editedDetail.role)) {
        newErrors.role = "Vai trò phải là staff, admin hoặc user.";
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
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        let errorMessage = "Lỗi khi cập nhật nhân viên.";
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
        setGeneralError("Lỗi không xác định.");
      }
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
      // console.log("Response from backend:", res.data);
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
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        let errorMessage = "Lỗi khi cập nhật thông tin tài khoản.";
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
        setGeneralCredentialError("Lỗi không xác định.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = (id: number) => {
    setViewDetailId((prev) => (prev === id ? null : id));
    setEditingDetailId(null);
    setErrors({});
    setCredentialErrors({});
  };

  const roleIdToLabel = (role_id: number) => {
    switch (role_id) {
      case 1:
        return "Quản lí";
      case 2:
        return "Lễ tân";
      default:
        return "Chưa xác định";
    }
  };

  const handleDelete = async (id: number, user_id?: number) => {
    if (user_id === currentUserId) {
      setGeneralError("Bạn không thể xoá tài khoản của chính mình.");
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xoá nhân viên này?"
    );
    if (confirmed) {
      try {
        await api.delete(`/users/${user_id}`);
        setEmployees((prev) => prev.filter((e) => e.user_id !== user_id));
        setErrors({});
      } catch (err: unknown) {
        let errorMessage = "Lỗi khi xoá người dùng.";
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || errorMessage;
        }
        setGeneralError(errorMessage);
        console.error("Lỗi xoá người dùng:", err);
      }
    }
  };

  const handleViewCredentials = (id: number) => {
    setViewCredentialsId((prev) => (prev === id ? null : id));
    setViewDetailId(null);
    setErrors({});
    setCredentialErrors({});
  };

  const userData = localStorage.getItem("user");
  const currentUserId = userData ? JSON.parse(userData).id : null;
  const currentUserRoleId = userData ? JSON.parse(userData).role_id : null;

  const paginatedEmployees = employees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(employees.length / rowsPerPage);

  return (
    <div className="table-wrapper">
      <Typography variant="h5" mb={2}>
        Employee <b>Details</b>
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        component={RouterLink}
        to="/user/add"
        sx={{ mb: 2 }}
      >
        Thêm nhân viên mới
      </Button>
      {loading ? (
        <Box textAlign="center">
          <CircularProgress />
          <Typography>Đang tải dữ liệu...</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
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
                  <TableRow key={`row-${emp.id}`}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.user?.email}</TableCell>
                    <TableCell>
                      {emp.user?.role_id
                        ? roleIdToLabel(emp.user.role_id)
                        : "Chưa có"}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Chi tiết nhân viên">
                        <IconButton onClick={() => handleViewDetail(emp.id)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Tài khoản đăng nhập">
                        <IconButton
                          onClick={() => handleViewCredentials(emp.id)}
                        >
                          <AccountCircleIcon />
                        </IconButton>
                      </Tooltip>
                      {emp.user_id !== currentUserId && (
                        <Tooltip title="Xoá">
                          <IconButton
                            onClick={() => handleDelete(emp.id, emp.user_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>

                  {(viewDetailId === emp.id ||
                    viewCredentialsId === emp.id) && (
                    <TableRow key={`detail-${emp.id}`}>
                      <TableCell colSpan={4} style={{ padding: 0 }}>
                        <Collapse in={true}>
                          <Box p={2}>
                            {viewDetailId === emp.id && (
                              <>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  gutterBottom
                                >
                                  Thông tin nhân viên
                                </Typography>

                                {editingDetailId === emp.id ? (
                                  <>
                                    {generalError && (
                                      <Typography
                                        color="error"
                                        variant="caption"
                                      >
                                        {generalError}
                                      </Typography>
                                    )}
                                    {[
                                      "name",
                                      "email",
                                      "role",
                                      "phone",
                                      "address",
                                      "cccd",
                                      "gender",
                                      "birthday",
                                      "department_id",
                                      "status",
                                      "hire_date",
                                    ].map((field) => {
                                      if (field === "status") {
                                        return (
                                          <FormControl
                                            fullWidth
                                            margin="normal"
                                            key="status"
                                            error={!!errors.status}
                                          >
                                            <InputLabel>Trạng thái</InputLabel>
                                            <Select
                                              value={
                                                editedDetail.status ||
                                                "Làm việc"
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
                                        );
                                      }

                                      if (field === "gender") {
                                        return (
                                          <FormControl
                                            fullWidth
                                            margin="normal"
                                            key="gender"
                                            error={!!errors.gender}
                                          >
                                            <InputLabel>Giới tính</InputLabel>
                                            <Select
                                              value={editedDetail.gender || ""}
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "gender",
                                                  e.target.value
                                                )
                                              }
                                              label="Giới tính"
                                            >
                                              <MenuItem value="Nam">
                                                Nam
                                              </MenuItem>
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
                                        );
                                      }

                                      if (field === "department_id") {
                                        return (
                                          <FormControl
                                            fullWidth
                                            margin="normal"
                                            key="department_id"
                                            error={!!errors.department_id}
                                          >
                                            <InputLabel>Phòng ban</InputLabel>
                                            <Select
                                              value={
                                                editedDetail.department_id || ""
                                              }
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "department_id",
                                                  e.target.value
                                                )
                                              }
                                              label="Phòng ban"
                                            >
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
                                        );
                                      }

                                      if (
                                        field === "birthday" ||
                                        field === "hire_date"
                                      ) {
                                        return (
                                          <TextField
                                            key={field}
                                            label={
                                              field === "birthday"
                                                ? "Ngày sinh"
                                                : "Ngày tuyển dụng"
                                            }
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            InputLabelProps={{ shrink: true }}
                                            value={
                                              editedDetail[
                                                field as keyof Employee
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              handleChangeDetail(
                                                field as keyof Employee,
                                                e.target.value
                                              )
                                            }
                                            error={
                                              !!errors[field as keyof Employee]
                                            }
                                            helperText={
                                              errors[field as keyof Employee] ||
                                              ""
                                            }
                                          />
                                        );
                                      }

                                      return (
                                        <TextField
                                          key={field}
                                          label={
                                            field === "name"
                                              ? "Họ tên"
                                              : field === "email"
                                              ? "Email"
                                              : field === "role"
                                              ? "Vai trò"
                                              : field === "phone"
                                              ? "Số điện thoại"
                                              : field === "address"
                                              ? "Địa chỉ"
                                              : field === "cccd"
                                              ? "CCCD"
                                              : field.toUpperCase()
                                          }
                                          fullWidth
                                          margin="normal"
                                          value={
                                            editedDetail[
                                              field as keyof Employee
                                            ] || ""
                                          }
                                          onChange={(e) =>
                                            handleChangeDetail(
                                              field as keyof Employee,
                                              e.target.value
                                            )
                                          }
                                          error={
                                            !!errors[field as keyof Employee]
                                          }
                                          helperText={
                                            errors[field as keyof Employee] ||
                                            ""
                                          }
                                        />
                                      );
                                    })}
                                    <Box mt={2}>
                                      <Button
                                        variant="contained"
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
                                        sx={{ ml: 1 }}
                                        variant="outlined"
                                        onClick={() => {
                                          setEditingDetailId(null);
                                          setViewDetailId(null);
                                          setErrors({});
                                        }}
                                        disabled={saving}
                                      >
                                        Huỷ
                                      </Button>
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <Box
                                      display="flex"
                                      flexWrap="wrap"
                                      rowGap={1}
                                      columnGap={4}
                                      mt={2}
                                    >
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Họ tên:</strong>{" "}
                                          {emp.name || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Email:</strong>{" "}
                                          {emp.email || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Vai trò:</strong>{" "}
                                          {emp.role || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>SĐT:</strong>{" "}
                                          {emp.phone || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Địa chỉ:</strong>{" "}
                                          {emp.address || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>CCCD:</strong>{" "}
                                          {emp.cccd || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Giới tính:</strong>{" "}
                                          {emp.gender || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Ngày sinh:</strong>{" "}
                                          {emp.birthday || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Phòng ban:</strong>{" "}
                                          {departments.find(
                                            (d) => d.id === emp.department_id
                                          )?.name || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Trạng thái:</strong>{" "}
                                          {emp.status || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Ngày tuyển dụng:</strong>{" "}
                                          {emp.hire_date || "Chưa có"}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Box mt={2}>
                                      <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEditDetail(emp)}
                                        sx={{
                                          color: "black",
                                          borderColor: "black",
                                        }}
                                      >
                                        Chỉnh sửa thông tin người dùng
                                      </Button>
                                    </Box>
                                  </>
                                )}
                              </>
                            )}
                            {viewCredentialsId === emp.id && (
                              <>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  gutterBottom
                                >
                                  Thông tin tài khoản đăng nhập
                                </Typography>

                                {editingCredentialsId === emp.id ? (
                                  <>
                                    {generalCredentialError && (
                                      <Typography
                                        color="error"
                                        variant="caption"
                                        sx={{ mb: 2 }}
                                      >
                                        {generalCredentialError}
                                      </Typography>
                                    )}
                                    <FormControl
                                      fullWidth
                                      margin="normal"
                                      error={!!credentialErrors.role_id}
                                    >
                                      <InputLabel>Vai trò</InputLabel>
                                      <Select
                                        value={editedCredentials.role_id || ""}
                                        onChange={(e) =>
                                          handleChangeCredentials(
                                            "role_id",
                                            Number(e.target.value)
                                          )
                                        }
                                        label="Vai trò"
                                      >
                                        <MenuItem value={1}>Quản lí</MenuItem>
                                        <MenuItem value={2}>Lễ tân</MenuItem>
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
                                      margin="normal"
                                      error={!!credentialErrors.status}
                                    >
                                      <InputLabel>Trạng thái</InputLabel>
                                      <Select
                                        value={editedCredentials.status || ""}
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

                                    <Box mt={2}>
                                      <Button
                                        variant="contained"
                                        onClick={() => {
                                          const userId = emp.user?.id;
                                          if (!userId) {
                                            setGeneralCredentialError(
                                              "Không tìm thấy ID người dùng."
                                            );
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
                                        sx={{ ml: 1 }}
                                        variant="outlined"
                                        onClick={() => {
                                          setEditingCredentialsId(null);
                                          setCredentialErrors({});
                                        }}
                                        disabled={saving}
                                      >
                                        Huỷ
                                      </Button>
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <Box
                                      display="flex"
                                      flexWrap="wrap"
                                      rowGap={1}
                                      columnGap={4}
                                      mt={2}
                                    >
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Email:</strong>{" "}
                                          {emp.user?.email || "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Vai trò:</strong>{" "}
                                          {emp.user?.role_id
                                            ? roleIdToLabel(emp.user.role_id)
                                            : "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Trạng thái:</strong>{" "}
                                          {emp.user?.status === "active"
                                            ? "Hoạt động"
                                            : emp.user?.status === "not_active"
                                            ? "Không hoạt động"
                                            : "Chưa có"}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Ngày tạo:</strong>{" "}
                                          {emp.user?.created_at?.slice(0, 10) ||
                                            "Chưa có"}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    {(currentUserRoleId === 1 ||
                                      currentUserRoleId === 3) && (
                                      <Box mt={2}>
                                        <Button
                                          variant="outlined"
                                          startIcon={<EditIcon />}
                                          onClick={() => {
                                            setEditingCredentialsId(emp.id);
                                            setEditedCredentials({
                                              role_id: emp.user?.role_id,
                                              status: emp.user?.status,
                                            });
                                          }}
                                          sx={{
                                            color: "black",
                                            borderColor: "black",
                                          }}
                                        >
                                          Chỉnh sửa tài khoản
                                        </Button>
                                      </Box>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Pagination
              count={totalPages} // tổng số trang
              page={currentPage} // trang hiện tại
              onChange={(event, value) => setCurrentPage(value)}
              color="primary" // màu xanh như ảnh
              shape="rounded" // bo góc
              showFirstButton
              showLastButton
            />
          </Box>
        </TableContainer>
      )}
    </div>
  );
};

export default User;
