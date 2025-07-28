/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle } from "lucide-react";
import api from "../../api/axios";

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<{
    [key in keyof RoomTypeFormData]?: boolean;
  }>({});
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

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

  const markFieldAsTouched = (fieldPath: keyof RoomTypeFormData) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "max_occupancy" || name === "base_rate"
        ? Number(value) || 0
        : value;
    setFormData((prev) => ({
      ...prev,
      [name as keyof RoomTypeFormData]: newValue,
    }));
    markFieldAsTouched(name as keyof RoomTypeFormData);
    const errors = validateForm({ ...formData, [name]: newValue });
    setValidationErrors((prev) => ({
      ...prev,
      [name]: errors[name as keyof ValidationErrors] || "",
    }));
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      Object.keys(formData).forEach((key) =>
        markFieldAsTouched(key as keyof RoomTypeFormData)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.post("/room-types", formData);
      if (response.status === 201) {
        setSubmitStatus("success");
        setTimeout(() => navigate("/room-types"), 2000);
      } else {
        throw new Error("Không thể thêm loại phòng mới");
      }
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi khi thêm loại phòng";
      if (err.response?.data?.errors) {
        errorMessage = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setSubmitStatus("error");
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/room-types");
  };

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="error-message">
      <AlertTriangle className="error-icon" />
      <span>{message}</span>
    </div>
  );

  if (loading) {
    return <div className="loading">Đang xử lý...</div>;
  }

  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        {submitStatus && (
          <div
            className={`alert ${
              submitStatus === "success" ? "alert-success" : "alert-error"
            }`}
          >
            {submitStatus === "success" ? (
              <Save className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>
              {submitStatus === "success"
                ? "Thêm loại phòng thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Loại Phòng
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="code" className="form-label required">
                  Mã loại phòng
                </label>
                <input
                  id="code"
                  type="text"
                  placeholder="Nhập mã loại phòng"
                  className={`form-input ${
                    touchedFields["code"] && validationErrors.code
                      ? "error"
                      : ""
                  }`}
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("code")}
                />
                {touchedFields["code"] && validationErrors.code && (
                  <ErrorMessage message={validationErrors.code} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Tên loại phòng
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nhập tên loại phòng"
                  className={`form-input ${
                    touchedFields["name"] && validationErrors.name
                      ? "error"
                      : ""
                  }`}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("name")}
                />
                {touchedFields["name"] && validationErrors.name && (
                  <ErrorMessage message={validationErrors.name} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="max_occupancy" className="form-label required">
                  Số người tối đa
                </label>
                <input
                  id="max_occupancy"
                  type="number"
                  placeholder="Nhập số người tối đa"
                  className={`form-input ${
                    touchedFields["max_occupancy"] &&
                    validationErrors.max_occupancy
                      ? "error"
                      : ""
                  }`}
                  name="max_occupancy"
                  value={formData.max_occupancy}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("max_occupancy")}
                  min="0"
                />
                {touchedFields["max_occupancy"] &&
                  validationErrors.max_occupancy && (
                    <ErrorMessage message={validationErrors.max_occupancy} />
                  )}
              </div>
              <div className="form-group">
                <label htmlFor="base_rate" className="form-label required">
                  Giá cơ bản (VNĐ)
                </label>
                <input
                  id="base_rate"
                  type="number"
                  placeholder="Nhập giá cơ bản"
                  className={`form-input ${
                    touchedFields["base_rate"] && validationErrors.base_rate
                      ? "error"
                      : ""
                  }`}
                  name="base_rate"
                  value={formData.base_rate}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("base_rate")}
                  min="0"
                />
                {touchedFields["base_rate"] && validationErrors.base_rate && (
                  <ErrorMessage message={validationErrors.base_rate} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-1 mb-4">
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  placeholder="Nhập mô tả loại phòng"
                  className={`form-input ${
                    touchedFields["description"] && validationErrors.description
                      ? "error"
                      : ""
                  }`}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("description")}
                  rows={3}
                />
                {touchedFields["description"] &&
                  validationErrors.description && (
                    <ErrorMessage message={validationErrors.description} />
                  )}
              </div>
            </div>
            <div className="form-group">
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                  marginTop: "1rem",
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.875rem",
                    width: "80px",
                  }}
                  aria-label="Lưu loại phòng"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Lưu
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn btn-outline"
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.875rem",
                    width: "80px",
                  }}
                  aria-label="Hủy bỏ"
                >
                  <X className="w-4 h-4 mr-1" />
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRoomType;
