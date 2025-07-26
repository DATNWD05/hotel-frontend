import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  Box,
  SelectChangeEvent,
} from "@mui/material";
import { toast } from "react-toastify";
import "../../css/CraeteService.css";

interface ServiceCategory {
  id: string;
  name: string;
}

interface ServiceFormData {
  name: string;
  category_id: string;
  description: string;
  price: number;
}

interface ValidationErrors {
  [key: string]: string | undefined;
  name?: string;
  category_id?: string;
  description?: string;
  price?: string;
}

const CreateService: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    category_id: "",
    description: "",
    price: 0,
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const token = localStorage.getItem("auth_token");

  const validateForm = (data: ServiceFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Tên dịch vụ không được để trống";
    else if (data.name.length > 255)
      errors.name = "Tên dịch vụ không được vượt quá 255 ký tự";
    if (!data.category_id)
      errors.category_id = "Vui lòng chọn danh mục dịch vụ";
    if (data.description && data.description.length > 1000)
      errors.description = "Mô tả không được vượt quá 1000 ký tự";
    if (data.price < 0 || data.price > 9999999999)
      errors.price = "Giá dịch vụ phải từ 0 đến 9,999,999,999";
    return errors;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const headers: HeadersInit = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(
          "http://127.0.0.1:8000/api/service-categories",
          { headers }
        );
        if (!res.ok) {
          if (res.status === 401)
            throw new Error("Không được phép truy cập. Vui lòng đăng nhập.");
          throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
        }

        const data = await res.json();
        let categoriesData: ServiceCategory[];
        if (Array.isArray(data)) {
          categoriesData = data;
        } else if (data && Array.isArray(data.data)) {
          categoriesData = data.data;
        } else {
          throw new Error(`Dữ liệu danh mục không đúng định dạng`);
        }

        setCategories(categoriesData);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Lỗi không xác định";
        setError(`Không thể tải danh mục dịch vụ: ${errorMessage}`);
        toast.error(`Không thể tải danh mục dịch vụ: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
    const errors = validateForm({
      ...formData,
      [name]: name === "price" ? Number(value) : value,
    });
    setValidationErrors(errors);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      const errors = validateForm({ ...formData, [name]: value });
      setValidationErrors(errors);
    }
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        description: formData.description || null,
        price: formData.price,
      };

      const res = await fetch("http://127.0.0.1:8000/api/service", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Không được phép truy cập. Vui lòng đăng nhập.");
        }
        if (res.status === 422 && result.errors) {
          const formattedErrors: ValidationErrors = {};
          Object.keys(result.errors).forEach((key) => {
            formattedErrors[key] = result.errors[key][0];
          });
          setValidationErrors(formattedErrors);
        } else {
          throw new Error(result.message || "Đã xảy ra lỗi khi tạo dịch vụ");
        }
        return;
      }

      toast.success("Tạo dịch vụ thành công!");
      setTimeout(() => navigate("/service"), 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/service");
  };

  return (
    <div className="create-service-wrapper">
      <div className="create-service-title">
        <div className="create-service-header-content">
          <h2>
            Create New <b>Service</b>
          </h2>
          <Box className="create-service-form-buttons">
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || categories.length === 0}
              className="custom-btn-save"
            >
              Lưu
            </Button>

            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              className="custom-btn-cancel"
            >
              Hủy
            </Button>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="create-service-loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : error && !categories.length ? (
        <Typography color="error" className="create-service-error-message">
          {error}
        </Typography>
      ) : (
        <div className="create-service-detail-container">
          <h3>Thông tin dịch vụ</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Tên dịch vụ"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.name}
                helperText={validationErrors.name}
              />
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.category_id}
              >
                <InputLabel>Danh mục dịch vụ</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleSelectChange}
                  label="Danh mục dịch vụ"
                  disabled={categories.length === 0}
                >
                  <MenuItem value="">-- Chọn danh mục --</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.category_id && (
                  <Typography color="error" variant="caption">
                    {validationErrors.category_id}
                  </Typography>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Giá dịch vụ"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.price}
                helperText={validationErrors.price}
                inputProps={{ min: 0, max: 9999999999, step: 1 }}
              />
              <TextField
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={4}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
              />
            </Box>
          </Box>
        </div>
      )}
    </div>
  );
};

export default CreateService;