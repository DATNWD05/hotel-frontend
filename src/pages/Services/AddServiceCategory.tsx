/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle } from "lucide-react";

interface ServiceCategoryInput {
  name: string;
  description: string;
}

interface ValidationErrors {
  [key: string]: string | undefined;
  name?: string;
  description?: string;
}

const AddServiceCategory: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ServiceCategoryInput>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<{
    [key in keyof ServiceCategoryInput]?: boolean;
  }>({});

  const validateForm = (data: ServiceCategoryInput): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Tên danh mục không được để trống";
    else if (data.name.length > 255)
      errors.name = "Tên danh mục không được vượt quá 255 ký tự";
    if (data.description && data.description.length > 1000)
      errors.description = "Mô tả không được vượt quá 1000 ký tự";
    return errors;
  };

  const markFieldAsTouched = (fieldPath: keyof ServiceCategoryInput) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name as keyof ServiceCategoryInput);
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors((prev) => ({
      ...prev,
      [name]: errors[name] || "",
    }));
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      Object.keys(formData).forEach((key) =>
        markFieldAsTouched(key as keyof ServiceCategoryInput)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setSubmitStatus("error");
      setErrorMessage("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/service-categories", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json();
        if (res.status === 422 && result.errors) {
          const formattedErrors: ValidationErrors = {};
          Object.keys(result.errors).forEach((key) => {
            formattedErrors[key] = result.errors[key][0];
          });
          setValidationErrors(formattedErrors);
          setSubmitStatus("error");
          setErrorMessage(Object.values(formattedErrors).join(", "));
        } else {
          throw new Error(
            result.message ||
              `Lỗi tạo danh mục: ${res.status} ${res.statusText}`
          );
        }
        setLoading(false);
        return;
      }

      setSubmitStatus("success");
      setErrorMessage("Tạo danh mục thành công!");
      setLoading(false);
      setTimeout(() => navigate("/service-categories"), 2000);
    } catch (err: any) {
      const errorMessage =
        err instanceof Error
          ? `Không thể tạo danh mục: ${err.message}`
          : "Lỗi không xác định";
      setSubmitStatus("error");
      setErrorMessage(errorMessage);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/service-categories");
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
          Thêm Danh Mục Dịch Vụ
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
                  rows={4}
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

export default AddServiceCategory;