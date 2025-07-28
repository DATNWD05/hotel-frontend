import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import "../../css/AddRoomType.css";
import api from "../../api/axios";
import { AxiosError } from "axios";

interface RoomTypeFormData {
  code: string;
  name: string;
  description: string;
  max_occupancy: number;
  base_rate: number;
}

interface ValidationErrors {
  code?: string;
  name?: string;
  description?: string;
  max_occupancy?: string;
  base_rate?: string;
}

const AddRoomType: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RoomTypeFormData>({
    code: "",
    name: "",
    description: "",
    max_occupancy: 0,
    base_rate: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateForm = (data: RoomTypeFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code.trim()) errors.code = "Mã không được để trống";
    else if (data.code.length > 20)
      errors.code = "Mã không được vượt quá 20 ký tự";
    if (!data.name.trim()) errors.name = "Tên không được để trống";
    else if (data.name.length > 50)
      errors.name = "Tên không được vượt quá 50 ký tự";
    if (data.description && data.description.length > 500)
      errors.description = "Mô tả không được vượt quá 500 ký tự";
    if (data.max_occupancy <= 0)
      errors.max_occupancy = "Số người tối đa phải lớn hơn 0";
    if (data.base_rate < 0) errors.base_rate = "Giá cơ bản không được âm";
    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]:
        name === "max_occupancy" || name === "base_rate"
          ? Number(value)
          : value,
    };
    setFormData(updatedData);
    const errors = validateForm(updatedData);
    setValidationErrors(errors);
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Vui lòng sửa các lỗi trong biểu mẫu trước khi lưu.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      }

      const response = await api.post("/room-types", formData);
      if (response.status === 201) {
        toast.success("Thêm loại phòng thành công!");
        setTimeout(() => navigate("/room-types"), 2000);
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : err.response?.data?.message || `Không thể thêm loại phòng: ${err.message}`
          : err instanceof Error
          ? `Không thể thêm loại phòng: ${err.message}`
          : "Lỗi không xác định";
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/room-types");
  };

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Add New <b>Room Type</b>
          </h2>
          <Box className="room-type-form-buttons" display="flex" gap={2} justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              className="room-type-btn-save"
              onClick={handleSave}
              disabled={loading}
              sx={{
                backgroundColor: "#4318FF",
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2.5,
                py: 0.7,
                "&:hover": { backgroundColor: "#7B1FA2" },
                "&:disabled": { backgroundColor: "#a9a9a9" },
              }}
            >
              {loading ? <CircularProgress size={24} /> : "Lưu"}
            </Button>
            <Button
              variant="outlined"
              className="room-type-btn-cancel"
              onClick={handleCancel}
              disabled={loading}
              component={Link}
              to="/room-types"
              sx={{
                color: "#f44336",
                borderColor: "#f44336",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2.5,
                py: 0.7,
                "&:hover": { borderColor: "#d32f2f", backgroundColor: "#ffebee" },
                "&:disabled": { color: "#a9a9a9", borderColor: "#a9a9a9" },
              }}
            >
              Hủy
            </Button>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="promotion-loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotion-error-message">
          {error}
        </Typography>
      ) : (
        <div className="promotion-detail-container">
          <h3>Thông tin loại phòng</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Mã"
                name="code"
                value={formData.code}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.code}
                helperText={validationErrors.code}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
              <TextField
                label="Tên"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Số người tối đa"
                name="max_occupancy"
                type="number"
                value={formData.max_occupancy}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.max_occupancy}
                helperText={validationErrors.max_occupancy}
                inputProps={{ min: 0 }}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
              <TextField
                label="Giá cơ bản"
                name="base_rate"
                type="number"
                value={formData.base_rate}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.base_rate}
                helperText={validationErrors.base_rate}
                inputProps={{ min: 0 }}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
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
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
            </Box>
          </Box>
        </div>
      )}
    </div>
  );
};

export default AddRoomType;