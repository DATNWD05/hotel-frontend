import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
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
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategory[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Thêm Tiện ích";
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Không tìm thấy token xác thực");
      return;
    }

    fetch("http://127.0.0.1:8000/api/amenity-categories", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(
              `Lỗi tải danh mục: ${res.status} ${res.statusText}. Chi tiết: ${text}`
            );
          });
        }
        return res.json();
      })
      .then((response) => {
        const data = response.data || response;
        if (!Array.isArray(data)) {
          setError("Dữ liệu danh mục không đúng định dạng");
          return;
        }
        const categories: AmenityCategory[] = data.map(
          (cat: RawAmenityCategory) => ({
            id: cat.id.toString(),
            name: cat.name,
          })
        );
        setAmenityCategories(categories);
      })
      .catch((err: unknown) => {
        const errorMessage =
          err instanceof Error
            ? `Không thể tải danh mục tiện ích: ${err.message}`
            : "Lỗi không xác định";
        setError(errorMessage);
      });
  }, []);

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
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
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
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/amenities", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(
            `Lỗi thêm tiện ích: ${response.status} ${response.statusText}. Chi tiết: ${text}`
          );
        });
      }

      setSnackbarMessage("Thêm tiện ích thành công!");
      setSnackbarOpen(true);
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
    } catch (err: unknown) {
      let errorMessage = "Đã xảy ra lỗi khi thêm tiện ích";
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
          JSON.stringify(axiosError.response?.data?.errors) ||
          errorMessage;
      }
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/amenities");
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
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
            >
              Lưu
            </Button>

            <Button
              variant="outlined"
              className="amenities-btn-cancel"
              onClick={handleCancel}
              disabled={loading}
              component={Link}
              to="/amenities"
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
      ) : error && !snackbarOpen ? (
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
              />
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

export default AmenitiesAdd;
