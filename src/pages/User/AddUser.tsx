/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, AlertTriangle, ChevronDown } from "lucide-react";
import api from "../../api/axios";

interface FormData {
  name: string;
  email: string;
  birthday: string;
  phone: string;
  address: string;
  hire_date: string;
  department_id: string;
  status: string;
  password: string;
  role_id: string;
  cccd: string;
  gender: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface Department {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    birthday: "",
    phone: "",
    address: "",
    hire_date: "",
    department_id: "",
    status: "",
    password: "",
    role_id: "",
    cccd: "",
    gender: "",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
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
    api
      .get("/departments")
      .then((res) => setDepartments(res.data.data))
      .catch(() => setErrorMessage("Không thể tải danh sách phòng ban"));

    api
      .get("/role")
      .then((res) => {
        console.log("Role API response:", res.data);
        setRoles(res.data.roles);
      })
      .catch(() => setErrorMessage("Không thể tải danh sách vai trò"));
  }, []);

  const validateForm = (data: FormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.name.trim()) errs.name = "Họ tên không được để trống";
    else if (data.name.length > 100)
      errs.name = "Tên không được dài quá 100 ký tự";
    if (!data.email.trim()) errs.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Email không hợp lệ";
    if (!data.phone.trim()) errs.phone = "Số điện thoại không được để trống";
    else if (data.phone.length > 20)
      errs.phone = "Số điện thoại không được vượt quá 20 ký tự";
    if (!data.address.trim()) errs.address = "Địa chỉ không được để trống";
    else if (data.address.length > 255)
      errs.address = "Địa chỉ không được vượt quá 255 ký tự";
    if (!data.birthday) errs.birthday = "Ngày sinh không được để trống";
    else {
      const date = new Date(data.birthday);
      if (isNaN(date.getTime()))
        errs.birthday = "Ngày sinh không đúng định dạng";
    }
    if (!data.hire_date) errs.hire_date = "Ngày vào làm không được để trống";
    else {
      const hireDate = new Date(data.hire_date);
      if (isNaN(hireDate.getTime()))
        errs.hire_date = "Ngày vào làm không đúng định dạng";
    }
    if (!data.status) errs.status = "Vui lòng chọn trạng thái";
    else if (!["active", "not_active", "pending"].includes(data.status))
      errs.status = "Trạng thái không hợp lệ";
    if (!data.role_id) errs.role_id = "Vui lòng chọn vai trò";
    else if (!roles.some((r) => String(r.id) === data.role_id))
      errs.role_id = "Vai trò không hợp lệ";
    if (!data.password.trim()) errs.password = "Mật khẩu không được để trống";
    if (!data.cccd.trim()) errs.cccd = "CCCD không được để trống";
    else if (!/^[0-9]+$/.test(data.cccd))
      errs.cccd = "CCCD chỉ được chứa các chữ số";
    else if (data.cccd.length < 10)
      errs.cccd = "CCCD phải có ít nhất 10 chữ số";
    else if (data.cccd.length > 12)
      errs.cccd = "CCCD không được vượt quá 12 chữ số";
    if (!data.gender) errs.gender = "Vui lòng chọn giới tính";
    else if (!["Nam", "Nữ", "Khác"].includes(data.gender))
      errs.gender = "Giới tính không hợp lệ";
    return errs;
  };

  const markFieldAsTouched = (fieldPath: keyof FormData) => {
    setTouchedFields((prev) => ({ ...prev, [fieldPath]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name as keyof FormData);
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors((prev) => ({ ...prev, [name]: errors[name] || "" }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    markFieldAsTouched(name);
    const errors = validateForm({ ...formData, [name]: value });
    setValidationErrors((prev) => ({ ...prev, [name]: errors[name] || "" }));
  };

  const handleSave = async () => {
    const validation = validateForm(formData);
    if (Object.keys(validation).length > 0) {
      setValidationErrors(validation);
      Object.keys(formData).forEach((key) =>
        markFieldAsTouched(key as keyof FormData)
      );
      setSubmitStatus("error");
      setErrorMessage("Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        department_id: formData.department_id
          ? Number(formData.department_id)
          : null,
        role_id: Number(formData.role_id),
      };
      console.log("Dữ liệu gửi lên:", payload);
      const response = await api.post("/users", payload);
      if (response.status === 201) {
        setSubmitStatus("success");
        setTimeout(() => navigate("/user"), 2000);
      } else {
        throw new Error("Thêm nhân viên thất bại");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const serverErrors = (err as any).response?.data?.errors as Record<
          string,
          string[]
        >;
        if (serverErrors) {
          const formattedErrors: ValidationErrors = {};
          Object.keys(serverErrors).forEach((key) => {
            formattedErrors[key] = serverErrors[key][0];
          });
          setValidationErrors(formattedErrors);
        }
      } else {
        const msg = err instanceof Error ? err.message : "Lỗi không xác định";
        setErrorMessage(msg);
        setSubmitStatus("error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/user");

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

  const statusOptions = [
    { value: "active", label: "Hoạt động" },
    { value: "not_active", label: "Nghỉ việc" },
    { value: "pending", label: "Chờ xử lý" },
  ];

  const genderOptions = [
    { value: "Nam", label: "Nam" },
    { value: "Nữ", label: "Nữ" },
    { value: "Khác", label: "Khác" },
  ];

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
                ? "Thêm nhân viên thành công!"
                : errorMessage}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-4 border-blue-500 inline-block pb-1">
          Thêm Nhân Viên
        </h3>
        <div className="card">
          <div className="tab-content">
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Họ tên
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nhập họ tên"
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
                <label htmlFor="email" className="form-label required">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Nhập email"
                  className={`form-input ${
                    touchedFields["email"] && validationErrors.email
                      ? "error"
                      : ""
                  }`}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("email")}
                />
                {touchedFields["email"] && validationErrors.email && (
                  <ErrorMessage message={validationErrors.email} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="phone" className="form-label required">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  className={`form-input ${
                    touchedFields["phone"] && validationErrors.phone
                      ? "error"
                      : ""
                  }`}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("phone")}
                />
                {touchedFields["phone"] && validationErrors.phone && (
                  <ErrorMessage message={validationErrors.phone} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="birthday" className="form-label required">
                  Ngày sinh
                </label>
                <input
                  id="birthday"
                  type="date"
                  className={`form-input ${
                    touchedFields["birthday"] && validationErrors.birthday
                      ? "error"
                      : ""
                  }`}
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("birthday")}
                />
                {touchedFields["birthday"] && validationErrors.birthday && (
                  <ErrorMessage message={validationErrors.birthday} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="gender" className="form-label required">
                  Giới tính
                </label>
                <CustomSelect
                  id="gender"
                  value={formData.gender}
                  onChange={(value) => handleSelectChange("gender", value)}
                  options={genderOptions}
                  placeholder="Chọn giới tính"
                />
                {touchedFields["gender"] && validationErrors.gender && (
                  <ErrorMessage message={validationErrors.gender} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="cccd" className="form-label required">
                  CCCD
                </label>
                <input
                  id="cccd"
                  type="text"
                  placeholder="Nhập CCCD"
                  className={`form-input ${
                    touchedFields["cccd"] && validationErrors.cccd
                      ? "error"
                      : ""
                  }`}
                  name="cccd"
                  value={formData.cccd}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("cccd")}
                />
                {touchedFields["cccd"] && validationErrors.cccd && (
                  <ErrorMessage message={validationErrors.cccd} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="hire_date" className="form-label required">
                  Ngày vào làm
                </label>
                <input
                  id="hire_date"
                  type="date"
                  className={`form-input ${
                    touchedFields["hire_date"] && validationErrors.hire_date
                      ? "error"
                      : ""
                  }`}
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("hire_date")}
                />
                {touchedFields["hire_date"] && validationErrors.hire_date && (
                  <ErrorMessage message={validationErrors.hire_date} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="department_id" className="form-label required">
                  Phòng ban
                </label>
                <CustomSelect
                  id="department_id"
                  value={formData.department_id}
                  onChange={(value) =>
                    handleSelectChange("department_id", value)
                  }
                  options={departments.map((dept) => ({
                    value: String(dept.id),
                    label: dept.name,
                  }))}
                  placeholder="-- Không chọn --"
                />
                {touchedFields["department_id"] &&
                  validationErrors.department_id && (
                    <ErrorMessage message={validationErrors.department_id} />
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
                  options={statusOptions}
                  placeholder="Chọn trạng thái"
                />
                {touchedFields["status"] && validationErrors.status && (
                  <ErrorMessage message={validationErrors.status} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="role_id" className="form-label required">
                  Vai trò
                </label>
                <CustomSelect
                  id="role_id"
                  value={formData.role_id}
                  onChange={(value) => handleSelectChange("role_id", value)}
                  options={roles.map((role) => ({
                    value: String(role.id),
                    label: role.name,
                  }))}
                  placeholder="-- Không chọn --"
                />
                {touchedFields["role_id"] && validationErrors.role_id && (
                  <ErrorMessage message={validationErrors.role_id} />
                )}
              </div>
            </div>
            <div className="form-grid form-grid-2 mb-4">
              <div className="form-group">
                <label htmlFor="address" className="form-label required">
                  Địa chỉ
                </label>
                <textarea
                  id="address"
                  placeholder="Nhập địa chỉ"
                  className={`form-input ${
                    touchedFields["address"] && validationErrors.address
                      ? "error"
                      : ""
                  }`}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("address")}
                  rows={2}
                />
                {touchedFields["address"] && validationErrors.address && (
                  <ErrorMessage message={validationErrors.address} />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label required">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  className={`form-input ${
                    touchedFields["password"] && validationErrors.password
                      ? "error"
                      : ""
                  }`}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => markFieldAsTouched("password")}
                />
                {touchedFields["password"] && validationErrors.password && (
                  <ErrorMessage message={validationErrors.password} />
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
                  aria-label="Lưu nhân viên"
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

export default AddUser;