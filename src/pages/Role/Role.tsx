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
  Box,
  Button,
  Snackbar,
  Alert,
  Card,
  CardContent,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";
import "../../css/Role.css";
import api from "../../api/axios";

interface Role {
  id: number;
  name: string;
  description: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

const Role: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Role | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/role");
      const body = res.data;

      if (!Array.isArray(body.roles)) {
        throw new Error("Dữ liệu không hợp lệ");
      }

      const sanitizedData = body.roles.map((item: Role) => ({
        ...item,
        id: Number(item.id) || 0,
        name: item.name || "Không xác định",
        description: item.description || "",
      }));

      setAllRoles(sanitizedData);
      setRoles(sanitizedData);
    } catch (err) {
      console.error("Lỗi khi fetch roles:", err);
      setError("Không thể tải danh sách vai trò.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const filtered = allRoles.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRoles(filtered);
    setRoles(filtered);
  }, [searchQuery, allRoles]);

  const validate = (data: Role): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.name.trim()) errs.name = "Tên vai trò không được để trống";
    else if (data.name.length > 30) errs.name = "Tối đa 30 ký tự";
    if (data.description && data.description.length > 255)
      errs.description = "Tối đa 255 ký tự";
    return errs;
  };

  const handleEdit = (role: Role) => {
    setSelectedRoleId(role.id);
    setEditRoleId(role.id);
    setEditFormData({ ...role });
    setValidationErrors({});
    setEditError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (!editFormData) return;
    const updated = { ...editFormData, [name]: value };
    setEditFormData(updated);
    setValidationErrors(validate(updated));
  };

  const handleSave = async () => {
    if (!editFormData) return;
    const errs = validate(editFormData);
    if (Object.keys(errs).length) {
      setValidationErrors(errs);
      return;
    }

    setEditLoading(true);
    try {
      await api.put(`/role/${editFormData.id}`, editFormData);
      setSnackbarMessage("Cập nhật vai trò thành công!");
      await fetchRoles();
      setEditRoleId(null);
      setEditFormData(null);
    } catch {
      setEditError("Không thể cập nhật vai trò");
      setSnackbarMessage("Lỗi khi cập nhật vai trò");
    } finally {
      setSnackbarOpen(true);
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditRoleId(null);
    setEditFormData(null);
    setValidationErrors({});
    setEditError(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa vai trò này?")) {
      try {
        await api.delete(`/role/${id}`);
        setSnackbarMessage("Xóa vai trò thành công!");
        await fetchRoles();
      } catch {
        setSnackbarMessage("Lỗi khi xóa vai trò");
      } finally {
        setSnackbarOpen(true);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    if (selectedRoleId === id && editRoleId !== id) setSelectedRoleId(null);
    else {
      setSelectedRoleId(id);
      setEditRoleId(null);
      setEditFormData(null);
      setValidationErrors({});
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  return (
    <div className="role-wrapper">
      <div className="role-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Vai Trò {">"} Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" className="section-title" fontWeight={700}>
            Vai Trò
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm vai trò"
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
                  fontSize: "15px",
                },
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Link to="/role/add">
              <Button
                variant="contained"
                color="primary"
                className="role-btn-add"
                sx={{ height: 35, fontSize: 14 }}
              >
                Thêm mới
              </Button>
            </Link>
          </Box>
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <div className="role-loading-container">
              <CircularProgress />
              <Typography>Đang tải danh sách vai trò...</Typography>
            </div>
          ) : error ? (
            <Typography color="error" className="role-error-message">
              {error}
            </Typography>
          ) : filteredRoles.length === 0 ? (
            <Typography className="role-no-data">
              {searchQuery
                ? "Không tìm thấy vai trò phù hợp."
                : "Không có vai trò nào."}
            </Typography>
          ) : (
            <TableContainer component={Paper} className="role-table-container">
              <Table className="role-table" sx={{ width: "100%" }}>
                <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                  <TableRow>
                    <TableCell>
                      <b>Tên Vai Trò</b>
                    </TableCell>
                    <TableCell>
                      <b>Mô Tả</b>
                    </TableCell>
                    <TableCell align="center">
                      <b>Hành động</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <React.Fragment key={role.id}>
                      <TableRow hover>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description || "—"}</TableCell>
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
                              onClick={() => handleViewDetails(role.id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              title="Sửa"
                              sx={{
                                color: "#f57c00",
                                bgcolor: "#fff3e0",
                                "&:hover": {
                                  bgcolor: "#ffe0b2",
                                  boxShadow: "0 2px 6px rgba(245, 124, 0, 0.4)",
                                },
                                transition: "all 0.2s ease-in-out",
                              }}
                              onClick={() => handleEdit(role)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              title="Xóa"
                              sx={{
                                color: "#d32f2f",
                                bgcolor: "#ffebee",
                                "&:hover": {
                                  bgcolor: "#ffcdd2",
                                  boxShadow: "0 2px 6px rgba(211, 47, 47, 0.4)",
                                },
                                transition: "all 0.2s ease-in-out",
                              }}
                              onClick={() => handleDelete(role.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} style={{ padding: 0 }}>
                          <Collapse
                            in={selectedRoleId === role.id}
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
                            >
                              <div className="role-detail-container">
                                {editRoleId === role.id && editFormData ? (
                                  <>
                                    <h3>Thông tin vai trò</h3>
                                    <Box
                                      display="flex"
                                      flexDirection="column"
                                      gap={2}
                                    >
                                      <TextField
                                        label="Tên vai trò"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleChange}
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        error={!!validationErrors.name}
                                        helperText={validationErrors.name}
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
                                        label="Mô tả"
                                        name="description"
                                        value={editFormData.description}
                                        onChange={handleChange}
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        error={!!validationErrors.description}
                                        helperText={
                                          validationErrors.description
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
                                    <Box pb={3} mt={2} display="flex" gap={2}>
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        className="role-btn-save"
                                        onClick={handleSave}
                                        disabled={editLoading}
                                        sx={{
                                          height: 35,
                                          width: 60,
                                          borderRadius: 2,
                                          fontSize: 14,
                                          fontWeight: 600,
                                          textTransform: "none",
                                          backgroundColor: "#6B48FF", // Custom purple color
                                          "&:hover": {
                                            backgroundColor: "#5A3CCC",
                                          },
                                        }}
                                      >
                                        Lưu
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        className="role-btn-cancel"
                                        color="error"
                                        onClick={handleCancel}
                                        disabled={editLoading}
                                        sx={{
                                          height: 35,
                                          width: 60,
                                          borderRadius: 2,
                                          fontSize: 14,
                                          fontWeight: 600,
                                          textTransform: "none",
                                          color: "#D32F2F", // Red color for text
                                          borderColor: "#D32F2F",
                                          "&:hover": {
                                            borderColor: "#B71C1C",
                                            color: "#B71C1C",
                                          },
                                        }}
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
                                    <h3>Thông tin vai trò</h3>
                                    <Table className="role-detail-table">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>
                                            <strong>Tên:</strong> {role.name}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>
                                            <strong>Mô tả:</strong>{" "}
                                            {role.description || "—"}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </>
                                )}
                              </div>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

export default Role;
