/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle, ChevronDown } from "lucide-react";

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
  const navigate = useNavigate();
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<{
    [key in keyof FormData]?: boolean;
  }>({});
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    document.title = "Thêm Tiện ích";
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setErrorMessage("Không tìm thấy token xác thực");
      setSubmitStatus("error");
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
          setErrorMessage("Dữ liệu danh mục không đúng định dạng");
          setSubmitStatus("error");
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
        setErrorMessage(errorMessage);
        setSubmitStatus("error");
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

  const markFieldAsTouched = (fieldPath: keyof FormData) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "price" || name === "default_quantity"
        ? Number(value) || 0
        : value;
    setFormData((prev) => ({
      ...prev,
      [name as keyof FormData]: newValue,
    }));
    markFieldAsTouched(name as keyof FormData);
    const errors = validateForm({ ...formData, [name]: newValue });
    setValidationErrors((prev) => ({
      ...prev,
      [name]: errors[name as keyof ValidationErrors] || "",
    }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name);
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors((prev) => ({ ...prev, [name]: errors[name] || "" }));
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      Object.keys(formData).forEach((key) =>
        markFieldAsTouched(key as keyof FormData)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("http://127.0.0.1:8000/api/amenities", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

      setSubmitStatus("success");
      setTimeout(() => navigate("/amenities"), 2000);
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi khi thêm tiện ích";
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
    navigate("/amenities");
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
                ? "Thêm tiện ích thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Tiện Ích
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="category_id" className="form-label required">
                  Nhóm tiện ích
                </label>
                <CustomSelect
                  id="category_id"
                  value={formData.category_id}
                  onChange={(value) => handleSelectChange("category_id", value)}
                  options={amenityCategories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  placeholder="Chọn nhóm tiện ích"
                  disabled={amenityCategories.length === 0}
                />
                {touchedFields["category_id"] &&
                  validationErrors.category_id && (
                    <ErrorMessage message={validationErrors.category_id} />
                  )}
              </div>
              <div className="form-group">
                <label htmlFor="code" className="form-label required">
                  Mã tiện ích
                </label>
                <input
                  id="code"
                  type="text"
                  placeholder="Nhập mã tiện ích"
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
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Tên tiện ích
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nhập tên tiện ích"
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
                <label htmlFor="icon" className="form-label">
                  URL biểu tượng
                </label>
                <input
                  id="icon"
                  type="text"
                  placeholder="Nhập URL biểu tượng"
                  className={`form-input ${
                    touchedFields["icon"] && validationErrors.icon
                      ? "error"
                      : ""
                  }`}
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("icon")}
                />
                {touchedFields["icon"] && validationErrors.icon && (
                  <ErrorMessage message={validationErrors.icon} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="price" className="form-label">
                  Giá (VNĐ)
                </label>
                <input
                  id="price"
                  type="number"
                  placeholder="Nhập giá"
                  className={`form-input ${
                    touchedFields["price"] && validationErrors.price
                      ? "error"
                      : ""
                  }`}
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("price")}
                  min="0"
                />
                {touchedFields["price"] && validationErrors.price && (
                  <ErrorMessage message={validationErrors.price} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="default_quantity" className="form-label">
                  Số lượng mặc định
                </label>
                <input
                  id="default_quantity"
                  type="number"
                  placeholder="Nhập số lượng mặc định"
                  className={`form-input ${
                    touchedFields["default_quantity"] &&
                    validationErrors.default_quantity
                      ? "error"
                      : ""
                  }`}
                  name="default_quantity"
                  value={formData.default_quantity}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("default_quantity")}
                  min="0"
                />
                {touchedFields["default_quantity"] &&
                  validationErrors.default_quantity && (
                    <ErrorMessage message={validationErrors.default_quantity} />
                  )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="status" className="form-label required">
                  Trạng thái
                </label>
                <CustomSelect
                  id="status"
                  value={formData.status}
                  onChange={(value) => handleSelectChange("status", value)}
                  options={[
                    { value: "active", label: "Hoạt động" },
                    { value: "inactive", label: "Không hoạt động" },
                  ]}
                  placeholder="Chọn trạng thái"
                />
                {touchedFields["status"] && validationErrors.status && (
                  <ErrorMessage message={validationErrors.status} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  placeholder="Nhập mô tả tiện ích"
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
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.875rem",
                    width: "80px",
                  }}
                  aria-label="Lưu tiện ích"
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

export default AmenitiesAdd;
