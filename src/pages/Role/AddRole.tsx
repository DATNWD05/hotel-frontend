import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import "../../css/Role.css";
import api from "../../api/axios";

interface RoleFormData {
  name: string;
  description: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

const AddRole: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  const validateForm = (data: RoleFormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.name.trim()) errs.name = "Tên vai trò không được để trống";
    else if (data.name.length > 30) errs.name = "Tên vai trò không được vượt quá 30 ký tự";
    if (data.description.length > 255) errs.description = "Mô tả không được vượt quá 255 ký tự";
    return errs;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors(errors);
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const dataToSend = { ...formData };
      console.log("Data sent to API:", dataToSend);
      const response = await api.post("/role", dataToSend);
      console.log("API response:", response);
      if (response.status === 201) {
        setSnackbarMessage("Thêm vai trò thành công!");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/role"), 1000);
      } else {
        throw new Error("Không thể thêm vai trò mới");
      }
    } catch (err: unknown) {
      let errorMessage = "Đã xảy ra lỗi khi thêm vai trò";
      if (err instanceof Error) {
        errorMessage = `Lỗi: ${err.message}`;
      }
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string; errors?: { [key: string]: string[] } } };
        };
        errorMessage =
          axiosError.response?.data?.message ||
          JSON.stringify(axiosError.response?.data?.errors) ||
          errorMessage;
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error("Lỗi khi thêm vai trò:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/role");
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  return (
    <div className="role-wrapper">
      <div className="role-title">
        <div className="role-header-content">
          <h2>
            Add New <b>Role</b>
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="role-loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : (
        <div className="role-detail-container">
          <h3>Thông tin vai trò</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Tên vai trò"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.name}
                helperText={validationErrors.name}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={3}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
              />
            </Box>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
              >
                Lưu
              </Button>
              <Button
                variant="outlined"
                className="role-btn-cancel"
                color="secondary"
                onClick={handleCancel}
                disabled={loading}
                component={Link}
                to="/role"
              >
                Hủy
              </Button>
            </Box>
          </Box>
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes("thành công") ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AddRole;