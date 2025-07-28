/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle } from "lucide-react";
import api from "../../api/axios";

interface DepartmentFormData {
  name: string;
}

interface ValidationErrors {
  name?: string;
}

const AddDepartment: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DepartmentFormData>({ name: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof DepartmentFormData, boolean>>
  >({});
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validateForm = (data: DepartmentFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Tên phòng ban không được để trống";
    else if (data.name.length > 100)
      errors.name = "Tên phòng ban không được vượt quá 100 ký tự";
    return errors;
  };

  const markFieldAsTouched = (field: keyof DepartmentFormData) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name as keyof DepartmentFormData);
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors((prev) => ({
      ...prev,
      [name as keyof ValidationErrors]:
        errors[name as keyof ValidationErrors] || "",
    }));
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTouchedFields({ name: true });
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.post("/departments", formData);
      if (response.status === 201) {
        setSubmitStatus("success");
        setTimeout(() => navigate("/departments"), 2000);
      } else {
        throw new Error("Không thể thêm phòng ban mới");
      }
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi khi thêm phòng ban";
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
    navigate("/departments");
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
                ? "Thêm phòng ban thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Phòng Ban
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-group">
              <label htmlFor="name" className="form-label required">
                Tên phòng ban
              </label>
              <input
                id="name"
                type="text"
                placeholder="Nhập tên phòng ban"
                className={`form-input ${
                  touchedFields["name"] && validationErrors.name ? "error" : ""
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
                aria-label="Lưu phòng ban"
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
  );
};

export default AddDepartment;