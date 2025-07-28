/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle } from "lucide-react";
import api from "../../api/axios";

interface RoleFormData {
  name: string;
  description: string;
}

interface ValidationErrors {
  [key: string]: string | undefined; // Thêm index signature
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<{
    [key in keyof RoleFormData]?: boolean;
  }>({});
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validateForm = (data: RoleFormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.name.trim()) errs.name = "Tên vai trò không được để trống";
    else if (data.name.length > 30)
      errs.name = "Tên vai trò không được vượt quá 30 ký tự";
    if (data.description.length > 255)
      errs.description = "Mô tả không được vượt quá 255 ký tự";
    return errs;
  };

  const markFieldAsTouched = (fieldPath: keyof RoleFormData) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name as keyof RoleFormData);
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
        markFieldAsTouched(key as keyof RoleFormData)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const dataToSend = { ...formData };
      const response = await api.post("/role", dataToSend);
      if (response.status === 201) {
        setSubmitStatus("success");
        setErrorMessage("Thêm vai trò thành công!");
        setTimeout(() => navigate("/role"), 2000);
      } else {
        throw new Error("Không thể thêm vai trò mới");
      }
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi khi thêm vai trò";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        errorMessage = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
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
    navigate("/role");
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
                ? "Thêm vai trò thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Vai Trò
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Tên vai trò
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nhập tên vai trò"
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
                  placeholder="Nhập mô tả vai trò"
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
                  aria-label="Lưu vai trò"
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

export default AddRole;
