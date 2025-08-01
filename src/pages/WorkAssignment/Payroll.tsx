/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Plus,
  Search,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  DollarSign,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import api from "../../api/axios";
import "./PayrollManagement.css";

interface Employee {
  id: number;
  MaNV: string; // Thay employee_code bằng MaNV để khớp với API
  name: string;
  role?: {
    name: string;
  };
  role_id?: number; // Thêm role_id để khớp với dữ liệu API
  // Các trường khác có thể thêm nếu cần (birthday, email, v.v.)
}

interface Payroll {
  id: number;
  employee_id: number;
  month: string;
  total_hours: number;
  total_days: number;
  total_salary: number;
  bonus: number;
  penalty: number;
  final_salary: number;
  employee: Employee;
  created_at: string;
  updated_at: string;
}

interface PayrollResponse {
  data: {
    data: Payroll[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const PayrollManagement = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [generateMonth, setGenerateMonth] = useState("");
  const [generateYear, setGenerateYear] = useState("");
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Generate current month/year for defaults
  const currentDate = new Date();
  const currentMonthYear = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  useEffect(() => {
    fetchPayrolls();
  }, [currentPage, selectedMonth]);

  useEffect(() => {
    if (!generateMonth) {
      setGenerateMonth(String(currentDate.getMonth() + 1).padStart(2, "0"));
    }
    if (!generateYear) {
      setGenerateYear(String(currentDate.getFullYear()));
    }
  }, []);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage };
      if (selectedMonth) {
        params.month = selectedMonth;
      }

      const response = await api.get<PayrollResponse>("/payrolls", { params });
      // Không cần fetch riêng vì dữ liệu employee đã có trong response
      const payrollsData = response.data.data.data.map((payroll) => ({
        ...payroll,
        employee: {
          ...payroll.employee,
          role: payroll.employee.role_id ? { name: "Chưa tải" } : undefined, // Placeholder, cần backend hỗ trợ
        },
      }));
      setPayrolls(payrollsData);
      setCurrentPage(response.data.data.current_page);
      setTotalPages(response.data.data.last_page);
      setTotalRecords(response.data.data.total);
    } catch (error: any) {
      showAlert(
        "error",
        error.response?.data?.message || "Lỗi khi tải dữ liệu bảng lương"
      );
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    if (!generateMonth || !generateYear) {
      showAlert("error", "Vui lòng chọn tháng và năm");
      return;
    }

    setGenerating(true);
    try {
      const monthString = `${generateYear}-${generateMonth.padStart(2, "0")}`;
      await api.post("/payrolls/generate", { month: monthString });
      showAlert(
        "success",
        `Tạo bảng lương tháng ${generateMonth}/${generateYear} thành công`
      );
      setShowGenerateDialog(false);
      fetchPayrolls();
    } catch (error: any) {
      showAlert(
        "error",
        error.response?.data?.message || "Lỗi khi tạo bảng lương"
      );
    } finally {
      setGenerating(false);
    }
  };

  const exportData = async (format: "excel" | "pdf") => {
    setExporting(format);
    try {
      const params: any = {};
      if (selectedMonth) {
        params.month = selectedMonth;
      }

      const endpoint =
        format === "excel" ? "/payrolls/export-excel" : "/payrolls/export-pdf";
      const response = await api.get(endpoint, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename =
        format === "excel"
          ? `bang_luong_${new Date().toISOString().slice(0, 10)}.xlsx`
          : `bang_luong_${selectedMonth || currentMonthYear}.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showAlert("success", `Xuất file ${format.toUpperCase()} thành công`);
    } catch (error: any) {
      showAlert(
        "error",
        error.response?.data?.message ||
          `Lỗi khi xuất file ${format.toUpperCase()}`
      );
    } finally {
      setExporting(null);
    }
  };

  const viewPayrollDetails = async (payroll: Payroll) => {
    try {
      const response = await api.get<Payroll>(`/payrolls/${payroll.id}`);
      const payrollWithRole = {
        ...response.data,
        employee: {
          ...response.data.employee,
          role: response.data.employee.role_id
            ? { name: "Chưa tải" }
            : undefined,
        },
      };
      setSelectedPayroll(payrollWithRole);
      setShowDetails(true);
    } catch (error: any) {
      showAlert(error, "Lỗi khi tải chi tiết bảng lương");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split("-");
    return `${month}/${year}`;
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      value: String(month).padStart(2, "0"),
      label: `Tháng ${month}`,
    };
  });

  // Generate year options (current year ± 2 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentDate.getFullYear() - 2 + i;
    return {
      value: String(year),
      label: String(year),
    };
  });

  return (
    <div className="payroll-container">
      <div className="payroll-wrapper">
        {/* Alert */}
        {alert && (
          <div
            className={`alert ${
              alert.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircle className="alert-icon alert-icon-success" />
            ) : (
              <AlertCircle className="alert-icon alert-icon-error" />
            )}
            <span>{alert.message}</span>
            <button
              title="Đóng thông báo"
              onClick={() => setAlert(null)}
              className="alert-close"
            >
              <X style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="card card-padding">
          <div className="header-content">
            <div>
              <h1 className="header-title">Quản lý bảng lương</h1>
              <p className="header-subtitle">
                Tạo và quản lý bảng lương nhân viên theo tháng
              </p>
            </div>
            <button
              onClick={() => setShowGenerateDialog(true)}
              className="btn-primary"
            >
              <Plus style={{ width: "1rem", height: "1rem" }} />
              Tạo bảng lương
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Tổng bản ghi</p>
                <p className="stats-number">{totalRecords}</p>
              </div>
              <div className="stats-icon stats-icon-blue">
                <Users style={{ width: "1.5rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Tổng lương</p>
                <p className="stats-number text-xl">
                  {formatCurrency(
                    payrolls.reduce(
                      (sum, p) => sum + (Number(p.final_salary) || 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="stats-icon stats-icon-green">
                <DollarSign style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Tổng giờ làm</p>
                <p className="stats-number">
                  {payrolls.reduce((sum, p) => sum + p.total_hours, 0)}h
                </p>
              </div>
              <div className="stats-icon stats-icon-orange">
                <Clock style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Tháng hiện tại</p>
                <p className="stats-number">{formatMonth(currentMonthYear)}</p>
              </div>
              <div className="stats-icon stats-icon-purple">
                <Calendar style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="card card-padding">
          <h2 className="filter-title">Bộ lọc và xuất dữ liệu</h2>
          <div className="filter-content">
            <div className="filter-input-group">
              <label className="filter-label">Lọc theo tháng</label>
              <input
                title="Lọc theo tháng"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-buttons">
              <button
                onClick={() => {
                  setSelectedMonth("");
                  setCurrentPage(1);
                }}
                className="btn-secondary"
              >
                <Search style={{ width: "1rem", height: "1rem" }} />
                Tất cả
              </button>
              <button
                onClick={() => exportData("excel")}
                disabled={exporting === "excel"}
                className="btn-primary btn-success"
              >
                {exporting === "excel" && (
                  <Loader2
                    style={{ width: "1rem", height: "1rem" }}
                    className="animate-spin"
                  />
                )}
                <FileText style={{ width: "1rem", height: "1rem" }} />
                Excel
              </button>
              <button
                onClick={() => exportData("pdf")}
                disabled={exporting === "pdf"}
                className="btn-primary btn-danger"
              >
                {exporting === "pdf" && (
                  <Loader2
                    style={{ width: "1rem", height: "1rem" }}
                    className="animate-spin"
                  />
                )}
                <Download style={{ width: "1rem", height: "1rem" }} />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="card">
          <div className="table-header">
            <h2 className="table-title">Danh sách bảng lương</h2>
            <p className="table-subtitle">
              Hiển thị {payrolls.length} trên tổng số {totalRecords} bản ghi
            </p>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-container">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton"></div>
                ))}
              </div>
            ) : payrolls.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-state-icon" />
                <h3 className="empty-state-title">Không có dữ liệu</h3>
                <p className="empty-state-text">
                  Chưa có bảng lương nào được tạo cho tháng này.
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã NV</th>
                    <th>Tên nhân viên</th>
                    <th>Tháng</th>
                    <th className="text-right">Tổng giờ</th>
                    <th className="text-right">Số ngày</th>
                    <th className="text-right">Lương cơ bản</th>
                    <th className="text-right">Thưởng</th>
                    <th className="text-right">Phạt</th>
                    <th className="text-right">Lương cuối</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((payroll) => (
                    <tr key={payroll.id}>
                      <td className="font-medium">{payroll.employee.MaNV}</td>
                      <td>{payroll.employee.name}</td>
                      <td>
                        <span className="badge">
                          {formatMonth(payroll.month)}
                        </span>
                      </td>
                      <td className="text-right">{payroll.total_hours}h</td>
                      <td className="text-right">{payroll.total_days}</td>
                      <td className="text-right">
                        {formatCurrency(payroll.total_salary)}
                      </td>
                      <td className="text-right text-green font-medium">
                        +{formatCurrency(payroll.bonus)}
                      </td>
                      <td className="text-right text-red font-medium">
                        -{formatCurrency(payroll.penalty)}
                      </td>
                      <td className="text-right font-semibold">
                        {formatCurrency(payroll.final_salary)}
                      </td>
                      <td className="text-center">
                        <button
                          title="Xem chi tiết"
                          onClick={() => viewPayrollDetails(payroll)}
                          className="icon-btn"
                        >
                          <Eye style={{ width: "1rem", height: "1rem" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Trang {currentPage} trên {totalPages}
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Generate Dialog */}
        {showGenerateDialog && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">Tạo bảng lương mới</h3>
                <button
                  title="Đóng"
                  onClick={() => setShowGenerateDialog(false)}
                  className="modal-close"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>
              <p className="modal-description">
                Tạo bảng lương cho toàn bộ nhân viên theo tháng được chọn
              </p>

              <div className="modal-grid">
                <div className="modal-field">
                  <label className="modal-label">Tháng</label>
                  <select
                    title="Chọn tháng"
                    value={generateMonth}
                    onChange={(e) => setGenerateMonth(e.target.value)}
                    className="modal-select"
                  >
                    {monthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Năm</label>
                  <select
                    title="Chọn năm"
                    value={generateYear}
                    onChange={(e) => setGenerateYear(e.target.value)}
                    className="modal-select"
                  >
                    {yearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowGenerateDialog(false)}
                  className="btn-secondary btn-flex"
                >
                  Hủy
                </button>
                <button
                  onClick={generatePayroll}
                  disabled={generating}
                  className="btn-primary btn-flex"
                >
                  {generating && (
                    <Loader2
                      style={{ width: "1rem", height: "1rem" }}
                      className="animate-spin"
                    />
                  )}
                  Tạo bảng lương
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Dialog */}
        {showDetails && selectedPayroll && (
          <div className="modal-overlay">
            <div className="modal modal-large">
              <div className="modal-header">
                <h3 className="modal-title">Chi tiết bảng lương</h3>
                <button
                  title="Đóng"
                  onClick={() => setShowDetails(false)}
                  className="modal-close"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>

              <div className="details-content">
                <div className="details-grid">
                  <div className="details-field">
                    <label className="details-label">Mã nhân viên</label>
                    <p className="details-value">
                      {selectedPayroll.employee.MaNV}
                    </p>
                  </div>
                  <div className="details-field">
                    <label className="details-label">Tên nhân viên</label>
                    <p className="details-value">
                      {selectedPayroll.employee.name}
                    </p>
                  </div>
                  <div className="details-field">
                    <label className="details-label">Tháng</label>
                    <p className="details-value">
                      {formatMonth(selectedPayroll.month)}
                    </p>
                  </div>
                  <div className="details-field">
                    <label className="details-label">Chức vụ</label>
                    <p className="details-value">
                      {selectedPayroll.employee.role?.name || "Chưa tải"}
                    </p>
                  </div>
                </div>

                <hr className="details-separator" />

                <div className="details-grid">
                  <div className="details-field">
                    <label className="details-label">Tổng giờ làm việc</label>
                    <p className="details-value details-value-large">
                      {selectedPayroll.total_hours} giờ
                    </p>
                  </div>
                  <div className="details-field">
                    <label className="details-label">Số ngày công</label>
                    <p className="details-value details-value-large">
                      {selectedPayroll.total_days} ngày
                    </p>
                  </div>
                </div>

                <hr className="details-separator" />

                <div className="details-summary">
                  <div className="details-row">
                    <span className="text-sm text-gray-600">Lương cơ bản:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(selectedPayroll.total_salary)}
                    </span>
                  </div>
                  <div className="details-row">
                    <span className="text-sm text-gray-600">Thưởng:</span>
                    <span className="font-medium text-green">
                      +{formatCurrency(selectedPayroll.bonus)}
                    </span>
                  </div>
                  <div className="details-row">
                    <span className="text-sm text-gray-600">Phạt:</span>
                    <span className="font-medium text-red">
                      -{formatCurrency(selectedPayroll.penalty)}
                    </span>
                  </div>
                  <hr className="details-separator" />
                  <div className="details-row details-row-highlight">
                    <span className="text-lg font-semibold text-gray-900">
                      Tổng lương:
                    </span>
                    <span className="details-total">
                      {formatCurrency(selectedPayroll.final_salary)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn-secondary"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollManagement;
