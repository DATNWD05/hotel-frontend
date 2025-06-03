import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import "../../css/Client.css";
import api from "../../api/axios";

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  cccd: string;
  note: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  cccd?: string;
  note?: string;
}

const AddClient: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    cccd: "",
    note: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const validateForm = (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Họ tên không được để trống";
    else if (data.name.length > 50)
      errors.name = "Họ tên không được vượt quá 50 ký tự";
    if (!data.email.trim()) errors.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = "Email không hợp lệ";
    if (!data.phone.trim()) errors.phone = "Số điện thoại không được để trống";
    else if (!/^\d{10,11}$/.test(data.phone))
      errors.phone = "Số điện thoại không hợp lệ";
    if (!data.address.trim()) errors.address = "Địa chỉ không được để trống";
    if (!data.date_of_birth.trim()) errors.date_of_birth = "Ngày sinh không được để trống";
    if (!data.gender) errors.gender = "Vui lòng chọn giới tính";
    if (!data.nationality.trim()) errors.nationality = "Quốc gia không được để trống";
    if (!data.cccd.trim()) errors.cccd = "CCCD không được để trống";
    else if (!/^\d{12}$/.test(data.cccd))
      errors.cccd = "CCCD phải là dãy số gồm 12 chữ số";
    if (data.note && data.note.length > 200) errors.note = "Ghi chú không được vượt quá 200 ký tự";
    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errors = validateForm({ ...formData, [name]: value });
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

  const mapGenderToBackend = (gender: string): string => {
    switch (gender) {
      case "Nam":
        return "male";
      case "Nữ":
        return "female";
      case "Không xác định":
        return "other";
      default:
        return "other";
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
      const dataToSend = {
        ...formData,
        gender: mapGenderToBackend(formData.gender), // Ánh xạ gender trước khi gửi
      };
      console.log('Dữ liệu gửi đi:', dataToSend); // Log để kiểm tra dữ liệu
      const response = await api.post("/customers", dataToSend);
      if (response.status === 201) {
        navigate("/client");
      } else {
        throw new Error("Không thể thêm khách hàng mới");
      }
    } catch (err: unknown) {
      let errorMessage = "Đã xảy ra lỗi khi thêm khách hàng";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; errors?: { [key: string]: string[] } } } };
        errorMessage =
          axiosError.response?.data?.message ||
          JSON.stringify(axiosError.response?.data?.errors) ||
          errorMessage;
      }
      setError(errorMessage);
      console.error("Lỗi khi thêm khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/client");
  };

  return (
    <div className="client-wrapper">
      <div className="client-title">
        <div className="header-content">
          <h2>
            Add New <b>Client</b>
          </h2>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Lưu
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={loading}
              component={Link}
              to="/client"
            >
              Hủy
            </Button>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="error-message">
          {error}
        </Typography>
      ) : (
        <div className="detail-container">
          <h3>Thông tin khách hàng</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Họ Tên"
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
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Số Điện Thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
              />
              <TextField
                label="Địa chỉ"
                name="address"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.address}
                helperText={validationErrors.address}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Ngày sinh"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!validationErrors.date_of_birth}
                helperText={validationErrors.date_of_birth}
              />
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.gender}
              >
                <InputLabel>Giới tính</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleSelectChange}
                  label="Giới tính"
                >
                  <MenuItem value="">Chọn giới tính</MenuItem>
                  <MenuItem value="Nam">Nam</MenuItem>
                  <MenuItem value="Nữ">Nữ</MenuItem>
                  <MenuItem value="Không xác định">Không xác định</MenuItem>
                </Select>
                {validationErrors.gender && (
                  <Typography color="error" variant="caption">
                    {validationErrors.gender}
                  </Typography>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Quốc gia"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.nationality}
                helperText={validationErrors.nationality}
              />
              <TextField
                label="CCCD"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.cccd}
                helperText={validationErrors.cccd || "Ví dụ: 123456789012"}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Ghi chú"
                name="note"
                value={formData.note}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.note}
                helperText={validationErrors.note || "Tối đa 200 ký tự"}
              />
            </Box>
          </Box>
        </div>
      )}
    </div>
  );
};

export default AddClient;