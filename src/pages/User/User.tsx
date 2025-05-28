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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  birthday?: string;
  phone?: string;
  address?: string;
  cccd?: string;
  gender?: string;
  department_id?: string;
  hire_date?: string;
  password?: string;
  status?: string;
  user_id?: number;
}

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
  },
});

const User: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editedDetail, setEditedDetail] = useState<Partial<Employee>>({});
  const [viewCredentialsId, setViewCredentialsId] = useState<number | null>(
    null
  );
  const [editingCredentialsId, setEditingCredentialsId] = useState<
    number | null
  >(null);
  const [editedCredentials, setEditedCredentials] = useState<Partial<Employee>>(
    {}
  );

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/employees");
        setEmployees(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleEditDetail = (employee: Employee) => {
    setEditingDetailId(employee.id);
    setEditedDetail({ ...employee });
  };

  const handleChangeDetail = (field: keyof Employee, value: string) => {
    setEditedDetail((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDetail = async (id: number) => {
    try {
      const currentEmployee = employees.find((e) => e.id === id);
      if (!currentEmployee || !currentEmployee.user_id) {
        console.error("Không tìm thấy user_id hoặc thông tin nhân viên.");
        return;
      }

      const payload = {
        name: editedDetail.name || "",
        birthday: editedDetail.birthday || "",
        gender: editedDetail.gender || "",
        phone: editedDetail.phone || "",
        address: editedDetail.address || "",
        hire_date: editedDetail.hire_date || "",
        department_id: editedDetail.department_id || null,
        status: editedDetail.status || "active",
        cccd: editedDetail.cccd || "",
        email: currentEmployee.email,
        role: currentEmployee.role,
        user_id: currentEmployee.user_id,
      };

      const res = await api.put(`/employees/${id}`, payload);

      if (res.status === 200) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...editedDetail } : e))
        );
        setEditingDetailId(null);
        setViewDetailId(null);
      }
    } catch (err) {
      console.error("Lỗi cập nhật nhân viên:", err);
    }
  };

  const handleViewDetail = (id: number) => {
    setViewDetailId((prev) => (prev === id ? null : id));
    setEditingDetailId(null);
  };

  const handleViewCredentials = (id: number) => {
    setViewCredentialsId((prev) => (prev === id ? null : id));
    setEditingCredentialsId(null);
  };

  const handleEditCredentials = (employee: Employee) => {
    setEditingCredentialsId(employee.id);
    setEditedCredentials({ ...employee });
  };

  const handleChangeCredentials = (field: keyof Employee, value: string) => {
    setEditedCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCredentials = async (id: number) => {
    try {
      const res = await api.put(`/users/${id}`, {
        email: editedCredentials.email,
        password: editedCredentials.password,
        role: editedCredentials.role,
      });
      if (res.status === 200) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...editedCredentials } : e))
        );
        setEditingCredentialsId(null);
        setViewCredentialsId(null);
      }
    } catch (err) {
      console.error("Lỗi cập nhật tài khoản:", err);
    }
  };

  const handleDelete = async (id: number, user_id?: number) => {
    if (user_id === currentUserId) {
      alert("Bạn không thể xoá tài khoản của chính mình.");
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xoá nhân viên này?"
    );
    if (confirmed) {
      try {
        await api.delete(`/users/${user_id}`); // ✅ Dùng đúng user_id của bảng users
        setEmployees((prev) => prev.filter((e) => e.user_id !== user_id));
      } catch (err) {
        console.error("Lỗi xoá người dùng:", err);
      }
    }
  };

  const userData = localStorage.getItem("user");
  const currentUserId = userData ? JSON.parse(userData).id : null;

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
      ) : error ? (
        <Typography color="error">{error}</Typography>
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
              {employees.map((emp) => {
                return (
                  <React.Fragment key={emp.id}>
                    <TableRow key={`row-${emp.id}`}>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.role}</TableCell>
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
                                      {[
                                        "name",
                                        "phone",
                                        "address",
                                        "cccd",
                                        "gender",
                                        "birthday",
                                        "department_id",
                                        "status",
                                      ].map((field) => {
                                        if (field === "status") {
                                          return (
                                            <FormControl
                                              fullWidth
                                              margin="normal"
                                              key={field}
                                            >
                                              <InputLabel>
                                                Trạng thái
                                              </InputLabel>
                                              <Select
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
                                                <MenuItem value="active">
                                                  Hoạt động
                                                </MenuItem>
                                                <MenuItem value="inactive">
                                                  Nghỉ việc
                                                </MenuItem>
                                              </Select>
                                            </FormControl>
                                          );
                                        }
                                        if (field === "gender") {
                                          return (
                                            <FormControl
                                              fullWidth
                                              margin="normal"
                                              key="gender"
                                            >
                                              <InputLabel>Giới tính</InputLabel>
                                              <Select
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
                                                <MenuItem value="Nam">
                                                  Nam
                                                </MenuItem>
                                                <MenuItem value="Nữ">
                                                  Nữ
                                                </MenuItem>
                                                <MenuItem value="khác">
                                                  Khác
                                                </MenuItem>
                                              </Select>
                                            </FormControl>
                                          );
                                        }
                                        if (field === "birthday") {
                                          return (
                                            <TextField
                                              key={field}
                                              label="Ngày sinh"
                                              type="date"
                                              fullWidth
                                              margin="normal"
                                              InputLabelProps={{ shrink: true }}
                                              value={
                                                editedDetail.birthday ||
                                                emp.birthday ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                handleChangeDetail(
                                                  "birthday",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          );
                                        }
                                        return (
                                          <TextField
                                            key={field}
                                            label={field.toUpperCase()}
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
                                          />
                                        );
                                      })}
                                      <Box mt={2}>
                                        <Button
                                          variant="contained"
                                          onClick={() =>
                                            handleSaveDetail(emp.id)
                                          }
                                        >
                                          Lưu
                                        </Button>
                                        <Button
                                          sx={{ ml: 1 }}
                                          variant="outlined"
                                          onClick={() => {
                                            setEditingDetailId(null);
                                            setViewDetailId(null);
                                          }}
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
                                            <strong>Họ tên:</strong> {emp.name}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>SĐT:</strong> {emp.phone}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>Địa chỉ:</strong>{" "}
                                            {emp.address}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>CCCD:</strong> {emp.cccd}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>Giới tính:</strong>{" "}
                                            {emp.gender}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>Ngày sinh:</strong>{" "}
                                            {emp.birthday}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>Phòng ban:</strong>{" "}
                                            {emp.department_id}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>Trạng thái:</strong>{" "}
                                            {emp.status}
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
                                          Chỉnh sửa thông tin
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
                                    Tài khoản đăng nhập
                                  </Typography>
                                  {editingCredentialsId === emp.id ? (
                                    <>
                                      {["email", "password", "role"].map(
                                        (field) => (
                                          <TextField
                                            key={field}
                                            label={field.toUpperCase()}
                                            fullWidth
                                            margin="normal"
                                            value={
                                              editedCredentials[
                                                field as keyof Employee
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              handleChangeCredentials(
                                                field as keyof Employee,
                                                e.target.value
                                              )
                                            }
                                          />
                                        )
                                      )}
                                      <Box mt={2}>
                                        <Button
                                          variant="contained"
                                          onClick={() =>
                                            handleSaveCredentials(emp.id)
                                          }
                                        >
                                          Lưu
                                        </Button>
                                        <Button
                                          sx={{ ml: 1 }}
                                          variant="outlined"
                                          onClick={() => {
                                            setEditingCredentialsId(null);
                                            setViewCredentialsId(null);
                                          }}
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
                                            <strong>Email:</strong> {emp.email}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>Mật khẩu:</strong>{" "}
                                            {emp.password}
                                          </Typography>
                                        </Box>
                                        <Box width="45%">
                                          <Typography>
                                            <strong>Vai trò:</strong> {emp.role}
                                          </Typography>
                                        </Box>
                                      </Box>
                                      <Box mt={2}>
                                        <Button
                                          variant="outlined"
                                          startIcon={<EditIcon />}
                                          onClick={() =>
                                            handleEditCredentials(emp)
                                          }
                                          sx={{
                                            color: "black",
                                            borderColor: "black",
                                          }}
                                        >
                                          Chỉnh sửa thông tin
                                        </Button>
                                      </Box>
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default User;