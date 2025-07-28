import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle } from "lucide-react";

interface ValidationErrors {
  name?: string;
  description?: string;
}

const AddAmenityCategory: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<{
    [key in keyof typeof formData]?: boolean;
  }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const isSubmitting = useRef(false); // Track submission state

  const validateForm = (data: {
    name: string;
    description: string;
  }): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Tên danh mục không được để trống";
    else if (data.name.length > 50)
      errors.name = "Tên danh mục không được vượt quá 50 ký tự";
    if (data.description && data.description.length > 500)
      errors.description = "Mô tả không được vượt quá 500 ký tự";
    return errors;
  };

  const markFieldAsTouched = (fieldPath: keyof typeof formData) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name as keyof typeof formData);
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors((prev) => ({
      ...prev,
      [name as keyof ValidationErrors]:
        errors[name as keyof ValidationErrors] || "",
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting.current) return; // Prevent multiple submissions
    isSubmitting.current = true; // Mark as submitting

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      Object.keys(formData).forEach((key) =>
        markFieldAsTouched(key as keyof typeof formData)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      isSubmitting.current = false; // Reset submitting state
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Không tìm thấy token xác thực");

      const response = await fetch(
        "http://127.0.0.1:8000/api/amenity-categories",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Không thể tạo danh mục: ${response.status} ${response.statusText}. Chi tiết: ${text}`
        );
      }

      setSubmitStatus("success");
      setTimeout(() => navigate("/amenity-categories"), 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo danh mục";
      setSubmitStatus("error");
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
      isSubmitting.current = false; // Reset submitting state
    }
  };

  const handleCancel = () => {
    navigate("/amenity-categories");
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
                ? "Tạo danh mục thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Danh mục Tiện ích
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Tên danh mục
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nhập tên danh mục"
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
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  placeholder="Nhập mô tả danh mục"
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
                  onClick={handleSubmit}
                  disabled={loading || isSubmitting.current} // Disable button during submission
                  className="btn btn-primary"
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.875rem",
                    width: "80px",
                  }}
                  aria-label="Lưu danh mục"
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

export default AddAmenityCategory;
