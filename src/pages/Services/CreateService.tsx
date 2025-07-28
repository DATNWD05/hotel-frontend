/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle, ChevronDown } from "lucide-react";

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
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<{
    [key in keyof ServiceFormData]?: boolean;
  }>({});
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

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
          {
            headers,
          }
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
        setSubmitStatus("error");
        setErrorMessage(`Không thể tải danh mục dịch vụ: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  const markFieldAsTouched = (fieldPath: keyof ServiceFormData) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === "price" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    markFieldAsTouched(name as keyof ServiceFormData);
    const errors = validateForm({ ...formData, [name]: newValue });
    setValidationErrors((prev) => ({
      ...prev,
      [name]: errors[name] || "",
    }));
  };

  const handleSelectChange = (name: keyof ServiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name);
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors((prev) => ({ ...prev, [name]: errors[name] || "" }));
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      Object.keys(formData).forEach((key) =>
        markFieldAsTouched(key as keyof ServiceFormData)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    setErrorMessage("");

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
          setSubmitStatus("error");
          setErrorMessage(Object.values(formattedErrors).join(", "));
        } else {
          throw new Error(result.message || "Đã xảy ra lỗi khi tạo dịch vụ");
        }
        setLoading(false);
        return;
      }

      setSubmitStatus("success");
      setErrorMessage("Tạo dịch vụ thành công!");
      setTimeout(() => navigate("/service"), 2000);
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi không xác định";
      setSubmitStatus("error");
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/service");
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
                ? "Tạo dịch vụ thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Dịch Vụ
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Tên dịch vụ
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nhập tên dịch vụ"
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
                <label htmlFor="category_id" className="form-label required">
                  Danh mục dịch vụ
                </label>
                <CustomSelect
                  id="category_id"
                  value={formData.category_id}
                  onChange={(value) => handleSelectChange("category_id", value)}
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  placeholder="-- Chọn danh mục --"
                  disabled={categories.length === 0}
                />
                {touchedFields["category_id"] &&
                  validationErrors.category_id && (
                    <ErrorMessage message={validationErrors.category_id} />
                  )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="price" className="form-label required">
                  Giá dịch vụ
                </label>
                <input
                  id="price"
                  type="number"
                  placeholder="Nhập giá dịch vụ"
                  className={`form-input ${
                    touchedFields["price"] && validationErrors.price
                      ? "error"
                      : ""
                  }`}
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("price")}
                  min={0}
                  max={9999999999}
                  step={1}
                />
                {touchedFields["price"] && validationErrors.price && (
                  <ErrorMessage message={validationErrors.price} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  placeholder="Nhập mô tả dịch vụ"
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
                  disabled={loading || categories.length === 0}
                  className="btn btn-primary"
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.875rem",
                    width: "80px",
                  }}
                  aria-label="Lưu dịch vụ"
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

export default CreateService;
