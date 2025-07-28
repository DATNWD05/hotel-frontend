/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, ChevronDown, AlertTriangle } from "lucide-react";
import api from "../../api/axios";

type DiscountType = "percent" | "amount";

interface PromotionFormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
}

interface ValidationErrors {
  code?: string;
  description?: string;
  discount_type?: string;
  discount_value?: string;
  start_date?: string;
  end_date?: string;
  usage_limit?: string;
  used_count?: string;
}

const AddPromotion: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PromotionFormData>({
    code: "",
    description: "",
    discount_type: "amount",
    discount_value: 0,
    start_date: "",
    end_date: "",
    usage_limit: 0,
    used_count: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<{
    [key in keyof PromotionFormData]?: boolean;
  }>({});
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validateForm = (data: PromotionFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code.trim()) errors.code = "Mã CTKM không được để trống";
    else if (data.code.length > 20)
      errors.code = "Mã CTKM không được vượt quá 20 ký tự";
    if (!data.description.trim())
      errors.description = "Mô tả không được để trống";
    else if (data.description.length > 200)
      errors.description = "Mô tả không được vượt quá 200 ký tự";
    if (!data.discount_type) errors.discount_type = "Vui lòng chọn loại giảm";
    if (data.discount_value <= 0)
      errors.discount_value = "Giá trị giảm phải lớn hơn 0";
    else if (data.discount_type === "percent" && data.discount_value > 100) {
      errors.discount_value = "Giá trị giảm không được vượt quá 100%";
    }
    if (!data.start_date)
      errors.start_date = "Ngày bắt đầu không được để trống";
    if (!data.end_date) errors.end_date = "Ngày kết thúc không được để trống";
    else if (
      data.start_date &&
      data.end_date &&
      data.start_date > data.end_date
    ) {
      errors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    if (data.usage_limit <= 0)
      errors.usage_limit = "Giới hạn số lần dùng phải lớn hơn 0";
    if (data.used_count < 0) errors.used_count = "Số lần đã dùng không được âm";
    return errors;
  };

  const markFieldAsTouched = (fieldPath: keyof PromotionFormData) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name !== "used_count") {
      const newValue =
        name === "discount_value" || name === "usage_limit"
          ? Number(value) || 0
          : value;
      setFormData((prev) => ({
        ...prev,
        [name as keyof PromotionFormData]: newValue,
      }));
      markFieldAsTouched(name as keyof PromotionFormData);
      const errors = validateForm({ ...formData, [name]: newValue });
      setValidationErrors((prev) => ({
        ...prev,
        [name]: errors[name as keyof ValidationErrors] || "",
      }));
    }
  };

  const handleSelectChange = (name: keyof PromotionFormData, value: string) => {
    if (name !== "used_count") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      markFieldAsTouched(name);
      const errors = validateForm({ ...formData, [name]: value });
      setValidationErrors((prev) => ({ ...prev, [name]: errors[name] || "" }));
    }
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      Object.keys(formData).forEach((key) =>
        markFieldAsTouched(key as keyof PromotionFormData)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.post("/promotions", formData);
      if (response.status === 201) {
        setSubmitStatus("success");
        setTimeout(() => navigate("/promotions"), 2000);
      } else {
        throw new Error("Không thể thêm khuyến mãi mới");
      }
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi khi thêm khuyến mãi";
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
    navigate("/promotions");
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    id,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    disabled?: boolean;
    id: string;
  }) => {
    const isOpen = openDropdowns[id] || false;

    return (
      <div className="custom-select">
        <button
          type="button"
          className={`select-trigger ${disabled ? "disabled" : ""}`}
          onClick={() => !disabled && toggleDropdown(id)}
          disabled={disabled}
          aria-label={
            value
              ? options.find((opt) => opt.value === value)?.label
              : placeholder
          }
        >
          <span className={value ? "" : "select-placeholder"}>
            {value
              ? options.find((opt) => opt.value === value)?.label
              : placeholder}
          </span>
          <ChevronDown className={`select-chevron ${isOpen ? "open" : ""}`} />
        </button>
        {isOpen && !disabled && (
          <div className="select-dropdown">
            {options.map((option) => (
              <div
                key={option.value}
                className="select-option"
                onClick={() => {
                  onChange(option.value);
                  toggleDropdown(id);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
                ? "Thêm khuyến mãi thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Chương Trình Khuyến Mãi
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="code" className="form-label required">
                  Mã khuyến mãi
                </label>
                <input
                  id="code"
                  type="text"
                  placeholder="Nhập mã khuyến mãi"
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
                <label htmlFor="description" className="form-label required">
                  Mô tả
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="Nhập mô tả khuyến mãi"
                  className={`form-input ${
                    touchedFields["description"] && validationErrors.description
                      ? "error"
                      : ""
                  }`}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("description")}
                />
                {touchedFields["description"] &&
                  validationErrors.description && (
                    <ErrorMessage message={validationErrors.description} />
                  )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label className="form-label required">Loại giảm</label>
                <CustomSelect
                  id="discount_type"
                  value={formData.discount_type}
                  onChange={(value) =>
                    handleSelectChange("discount_type", value)
                  }
                  options={[
                    { value: "percent", label: "Phần trăm (%)" },
                    { value: "amount", label: "Số tiền (VNĐ)" },
                  ]}
                  placeholder="Chọn loại giảm"
                />
                {touchedFields["discount_type"] &&
                  validationErrors.discount_type && (
                    <ErrorMessage message={validationErrors.discount_type} />
                  )}
              </div>
              <div className="form-group">
                <label htmlFor="discount_value" className="form-label required">
                  Giá trị giảm
                </label>
                <input
                  id="discount_value"
                  type="number"
                  placeholder="Nhập giá trị giảm"
                  className={`form-input ${
                    touchedFields["discount_value"] &&
                    validationErrors.discount_value
                      ? "error"
                      : ""
                  }`}
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("discount_value")}
                />
                {touchedFields["discount_value"] &&
                  validationErrors.discount_value && (
                    <ErrorMessage message={validationErrors.discount_value} />
                  )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="start_date" className="form-label required">
                  Ngày bắt đầu
                </label>
                <input
                  id="start_date"
                  type="date"
                  className={`form-input ${
                    touchedFields["start_date"] && validationErrors.start_date
                      ? "error"
                      : ""
                  }`}
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("start_date")}
                />
                {touchedFields["start_date"] && validationErrors.start_date && (
                  <ErrorMessage message={validationErrors.start_date} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="end_date" className="form-label required">
                  Ngày kết thúc
                </label>
                <input
                  id="end_date"
                  type="date"
                  className={`form-input ${
                    touchedFields["end_date"] && validationErrors.end_date
                      ? "error"
                      : ""
                  }`}
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("end_date")}
                />
                {touchedFields["end_date"] && validationErrors.end_date && (
                  <ErrorMessage message={validationErrors.end_date} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="usage_limit" className="form-label required">
                  Giới hạn số lần dùng
                </label>
                <input
                  id="usage_limit"
                  type="number"
                  placeholder="Nhập giới hạn số lần dùng"
                  className={`form-input ${
                    touchedFields["usage_limit"] && validationErrors.usage_limit
                      ? "error"
                      : ""
                  }`}
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("usage_limit")}
                />
                {touchedFields["usage_limit"] &&
                  validationErrors.usage_limit && (
                    <ErrorMessage message={validationErrors.usage_limit} />
                  )}
              </div>
              <div className="form-group">
                <label htmlFor="used_count" className="form-label ">
                  Số lần đã dùng
                </label>
                <input
                  id="used_count"
                  type="number"
                  placeholder="Số lần đã dùng"
                  className={`form-input disabled ${
                    touchedFields["used_count"] && validationErrors.used_count
                      ? "error"
                      : ""
                  }`}
                  name="used_count"
                  value={formData.used_count}
                  disabled
                  readOnly
                  onChange={() => {}}
                  onBlur={() => markFieldAsTouched("used_count")}
                />
                {touchedFields["used_count"] && validationErrors.used_count && (
                  <ErrorMessage message={validationErrors.used_count} />
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
                  aria-label="Lưu khuyến mãi"
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

export default AddPromotion;