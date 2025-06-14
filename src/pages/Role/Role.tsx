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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
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
      console.log("🎯 RESPONSE:", body);

      if (!Array.isArray(body.roles)) {
        throw new Error("Dữ liệu không hợp lệ");
      }

      setAllRoles(body.roles);
      setRoles(body.roles);
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
      console.log("Sending data:", editFormData);
      const response = await api.put(`/role/${editFormData.id}`, editFormData);
      console.log("Response:", response.data);
      setSnackbarMessage("Cập nhật vai trò thành công!");
      await fetchRoles();
      setEditRoleId(null);
      setEditFormData(null);
    } catch (error) {
      console.error("Error:", error);
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

  return (
    <div className="role-wrapper">
      <div className="role-title">
        <div className="role-header-content">
          <h2>
            Role <b>Details</b>
          </h2>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm vai trò"
              className="role-search-input"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: "300px" }}
            />
            <Link to="/role/add" className="role-btn-add">
              Thêm mới
            </Link>
          </Box>
        </div>
      </div>

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
          <Table className="role-table">
            <TableHead>
              <TableRow>
                <TableCell>Tên Vai Trò</TableCell>
                <TableCell>Mô Tả</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <React.Fragment key={role.id}>
                  <TableRow>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        className="role-action-view"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetails(role.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        className="role-action-edit"
                        title="Sửa"
                        onClick={() => handleEdit(role)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        className="role-action-delete"
                        title="Xóa"
                        onClick={() => handleDelete(role.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} style={{ padding: 0 }}>
                      <Collapse in={selectedRoleId === role.id}>
                        <div className="role-detail-container">
                          {editRoleId === role.id && editFormData ? (
                            <>
                              <h3>Thông tin vai trò</h3>
                              <Box display="flex" flexDirection="column" gap={2}>
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
                                  helperText={validationErrors.description}
                                />
                              </Box>
                              <Box mt={2} display="flex" gap={2}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={handleSave}
                                  disabled={editLoading}
                                >
                                  Lưu
                                </Button>
                                <Button
                                  variant="outlined"
                                  className="role-btn-cancel"
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
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
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