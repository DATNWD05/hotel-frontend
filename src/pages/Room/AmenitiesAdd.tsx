import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import api from "../../api/axios";
import { AxiosError } from "axios";
import "../../css/AddAmenities.css";

interface AmenityCategory {
  id: string;
  name: string;
}

interface RawAmenityCategory {
  id: number | string;
  name: string;
}

interface FormData {
  category_id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  default_quantity: number;
  status: string;
}

interface ValidationErrors {
  category_id?: string;
  code?: string;
  name?: string;
  description?: string;
  icon?: string;
  price?: string;
  default_quantity?: string;
  status?: string;
}

const AmenitiesAdd: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    category_id: "",
    code: "",
    name: "",
    description: "",
    icon: "",
    price: 0,
    default_quantity: 1,
    status: "active",
  });
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Thêm Tiện ích";
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get<{ data: RawAmenityCategory[] }>("/amenity-categories");
        const categories: AmenityCategory[] = response.data.data.map(
          (cat: RawAmenityCategory) => ({
            id: cat.id.toString(),
            name: cat.name,
          })
        );
        setAmenityCategories(categories);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof AxiosError
            ? err.response?.status === 401
              ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
              : err.response?.data?.message || `Không thể tải danh mục tiện ích: ${err.message}`
            : err instanceof Error
            ? `Không thể tải danh mục tiện ích: ${err.message}`
            : "Lỗi không xác định";
        setError(errorMessage);
        toast.error(errorMessage);
        if (err instanceof AxiosError && err.response?.status === 401) {
          localStorage.removeItem("auth_token");
          navigate("/login");
        }
      }
    };

    fetchCategories();
  }, [navigate]);

  const validateForm = (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.category_id) errors.category_id = "Vui lòng chọn nhóm tiện ích";
    if (!data.code.trim()) errors.code = "Mã không được để trống";
    else if (data.code.length > 20)
      errors.code = "Mã không được vượt quá 20 ký tự";
    if (!data.name.trim()) errors.name = "Tên không được để trống";
    else if (data.name.length > 50)
      errors.name = "Tên không được vượt quá 50 ký tự";
    if (data.description && data.description.length > 500)
      errors.description = "Mô tả không được vượt quá 500 ký tự";
    if (data.icon && !isValidUrl(data.icon))
      errors.icon = "URL biểu tượng không hợp lệ";
    if (data.price < 0) errors.price = "Giá không được âm";
    if (data.default_quantity < 0)
      errors.default_quantity = "Số lượng mặc định không được âm";
    if (!data.status) errors.status = "Vui lòng chọn trạng thái";
    return errors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "default_quantity" ? Number(value) : value,
    }));
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const response = await api.post("/amenities", formData);
      if (response.status === 201 || response.status === 200) {
        toast.success("Thêm tiện ích thành công!");
        setFormData({
          category_id: "",
          code: "",
          name: "",
          description: "",
          icon: "",
          price: 0,
          default_quantity: 1,
          status: "active",
        });
        setTimeout(() => navigate("/amenities"), 2000);
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : err.response?.data?.message ||
              err.response?.data?.errors
              ? JSON.stringify(err.response.data.errors)
              : `Không thể thêm tiện ích: ${err.message}`
          : err instanceof Error
          ? `Không thể thêm tiện ích: ${err.message}`
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
    navigate("/amenities");
  };

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Thêm mới <b>Tiện ích</b>
          </h2>
          <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              className="amenities-btn-save"
              onClick={handleSubmit}
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
              className="amenities-btn-cancel"
              onClick={handleCancel}
              disabled={loading}
              component={Link}
              to="/amenities"
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
          <h3>Thông tin tiện ích</h3>
          <Box component="form" display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <Select
                label="Nhóm tiện ích"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.category_id}
                displayEmpty
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              >
                <MenuItem value="" disabled>
                  Chọn nhóm tiện ích
                </MenuItem>
                {amenityCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                label="Mã tiện ích"
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
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Tên tiện ích"
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
              <TextField
                label="URL biểu tượng"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.icon}
                helperText={validationErrors.icon}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Giá (VND)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.price}
                helperText={validationErrors.price}
                inputProps={{ min: 0 }}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
              <TextField
                label="Số lượng mặc định"
                name="default_quantity"
                type="number"
                value={formData.default_quantity}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.default_quantity}
                helperText={validationErrors.default_quantity}
                inputProps={{ min: 0 }}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
            </Box>
            <Box display="flex" gap={2}>
              <Select
                label="Trạng thái"
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.status}
                displayEmpty
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
              </Select>
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

export default AmenitiesAdd;