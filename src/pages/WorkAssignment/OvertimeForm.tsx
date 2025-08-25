/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Calendar,
  Users,
  Clock,
  Settings,
  X,
  RefreshCw,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import api from "../../api/axios";
import "../../css/OvertimeManagement.css";

// ==================== TYPES & INTERFACES ====================
interface Employee {
  id: number;
  name: string;
  employee_code?: string;
  email?: string;
}

interface OvertimeRequest {
  id: number;
  employee_id: number;
  employee: Employee;
  overtime_type: "after_shift" | "custom";
  work_date: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

interface OvertimeRequestInput {
  employee_id: number;
  overtime_type: "after_shift" | "custom";
  duration?: number;
  start_datetime?: string;
  end_datetime?: string;
  reason?: string;
}

interface CreateOvertimeRequest {
  work_date: string;
  overtime_requests: OvertimeRequestInput[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface CreateOvertimeResponse {
  created: Array<{
    employee_id: number;
    employee_name: string;
  }>;
  errors: Array<{
    employee_id: number;
    employee_name?: string;
    reason: string;
  }>;
}

interface Statistics {
  total: number;
  afterShift: number;
  custom: number;
  employees: number;
}

// ==================== API SERVICE ====================
class OvertimeApiService {
  async getOvertimeRequests(filters?: {
    date?: string;
    employee_id?: number;
  }): Promise<ApiResponse<OvertimeRequest[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append("date", filters.date);
      if (filters?.employee_id)
        params.append("employee_id", filters.employee_id.toString());

      const queryString = params.toString();
      const response = await api.get(
        `/overtime-requests${queryString ? `?${queryString}` : ""}`
      );

      return response.data;
    } catch (error: any) {
      console.error("Get overtime requests error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách đăng ký tăng ca"
      );
    }
  }
  async createOrUpdateOvertimeRequests(
    data: CreateOvertimeRequest
  ): Promise<ApiResponse<CreateOvertimeResponse>> {
    try {
      const response = await api.post("/overtime-requests", data);
      return response.data;
    } catch (error: any) {
      console.error("Create/Update overtime requests error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể tạo/cập nhật đăng ký tăng ca"
      );
    }
  }

  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    try {
      const response = await api.get("/employees", {
        params: { per_page: 1000 },
      });
      const payload = response.data;

      let list: Employee[] = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload?.data)) list = payload.data;
      else if (Array.isArray(payload?.data?.data)) list = payload.data.data;
      else if (Array.isArray(payload?.employees)) list = payload.employees;

      return { success: true, data: list };
    } catch (error: any) {
      console.error("Get employees error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách nhân viên"
      );
    }
  }

  async deleteById(id: number): Promise<ApiResponse<null>> {
    try {
      const res = await api.delete(`/overtime-requests/${id}`);
      return res.data;
    } catch (error: any) {
      console.error("Delete overtime by id error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể xóa đăng ký tăng ca"
      );
    }
  }
}

const overtimeApi = new OvertimeApiService();

// ==================== MAIN COMPONENT ====================
const OvertimeManagement: React.FC = () => {
  // State management
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(
    []
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    afterShift: 0,
    custom: 0,
    employees: 0,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit/Delete helpers
  const [isEditing, setIsEditing] = useState(false);
  const [, setEditingRow] = useState<OvertimeRequest | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OvertimeRequest | null>(
    null
  );

  // Form state
  const [workDate, setWorkDate] = useState<Date | null>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<number | "">("");
  const [overtimeType, setOvertimeType] = useState<"after_shift" | "custom">(
    "after_shift"
  );
  const [duration, setDuration] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Filter state
  const [filterDate, setFilterDate] = useState<Date | null>(new Date());
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | "">("");

  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "info" });

  // Error state for detailed error display
  const [submitErrors, setSubmitErrors] = useState<
    Array<{ employee_id: number; employee_name?: string; reason: string }>
  >([]);

  // Memoized functions
  const loadEmployees = useCallback(async () => {
    try {
      const response = await overtimeApi.getEmployees();
      if (response.success && response.data) setEmployees(response.data);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  }, []);

  const loadOvertimeRequests = useCallback(async () => {
    try {
      setLoading(true);
      const filters: { date?: string; employee_id?: number } = {};
      if (filterDate) filters.date = format(filterDate, "yyyy-MM-dd");
      if (filterEmployeeId) filters.employee_id = filterEmployeeId as number;

      const response = await overtimeApi.getOvertimeRequests(filters);
      if (response.success && response.data) {
        setOvertimeRequests(response.data);
        calculateStatistics(response.data);
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterEmployeeId]);

  // Load initial data
  useEffect(() => {
    loadEmployees();
    loadOvertimeRequests();
  }, [loadEmployees, loadOvertimeRequests]);

  const calculateStatistics = (requests: OvertimeRequest[]) => {
    const stats: Statistics = {
      total: requests.length,
      afterShift: requests.filter((r) => r.overtime_type === "after_shift")
        .length,
      custom: requests.filter((r) => r.overtime_type === "custom").length,
      employees: new Set(requests.map((r) => r.employee_id)).size,
    };
    setStatistics(stats);
  };

  const showNotification = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => setNotification({ open: true, message, severity });

  const handleCloseNotification = () =>
    setNotification((prev) => ({ ...prev, open: false }));

  const resetForm = () => {
    setWorkDate(new Date());
    setSelectedEmployee("");
    setOvertimeType("after_shift");
    setDuration(1);
    setStartTime("");
    setEndTime("");
    setReason("");
    setSubmitErrors([]);
    setIsEditing(false);
    setEditingRow(null);
  };

  const validateForm = (): boolean => {
    if (!workDate) {
      showNotification("Vui lòng chọn ngày làm việc", "error");
      return false;
    }
    if (!selectedEmployee) {
      showNotification("Vui lòng chọn nhân viên", "error");
      return false;
    }
    if (overtimeType === "custom") {
      if (!startTime || !endTime) {
        showNotification(
          "Vui lòng chọn thời gian bắt đầu và kết thúc",
          "error"
        );
        return false;
      }
      if (startTime >= endTime) {
        showNotification(
          "Thời gian kết thúc phải sau thời gian bắt đầu",
          "error"
        );
        return false;
      }
    }
    return true;
  };

  // Helpers
  const toDateTime = (dateStr: string, hm: string) =>
    new Date(`${dateStr}T${hm}:00`);
  const hoursBetween = (start: Date, end: Date) =>
    (end.getTime() - start.getTime()) / 3_600_000;

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setSubmitErrors([]);

      const overtimeRequest: OvertimeRequestInput = {
        employee_id: selectedEmployee as number,
        overtime_type: overtimeType,
        reason: reason.trim() || undefined,
      };

      if (overtimeType === "after_shift") {
        overtimeRequest.duration = duration;
      } else {
        const workDateStr = format(workDate!, "yyyy-MM-dd");
        overtimeRequest.start_datetime = `${workDateStr} ${startTime}`;
        overtimeRequest.end_datetime = `${workDateStr} ${endTime}`;
      }

      const response = await overtimeApi.createOrUpdateOvertimeRequests({
        work_date: format(workDate!, "yyyy-MM-dd"),
        overtime_requests: [overtimeRequest],
      });

      if (response.success && response.data) {
        const { created, errors } = response.data;

        if (created.length > 0 && errors.length === 0) {
          showNotification(
            isEditing
              ? `Cập nhật tăng ca thành công cho ${created[0].employee_name}`
              : `Đăng ký tăng ca thành công cho ${created[0].employee_name}`,
            "success"
          );
          setIsModalOpen(false);
          resetForm();
          loadOvertimeRequests();
        } else if (errors.length > 0) {
          setSubmitErrors(errors);
          showNotification("Có lỗi từ máy chủ khi xử lý tăng ca", "error");
        }
      } else {
        showNotification(response.message || "Xử lý thất bại", "error");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit
  const openEditModal = (row: OvertimeRequest) => {
    setIsEditing(true);
    setEditingRow(row);

    try {
      const d = parseISO(row.work_date);
      setWorkDate(d);
    } catch {
      setWorkDate(new Date(row.work_date));
    }

    setSelectedEmployee(row.employee_id);
    setOvertimeType(row.overtime_type);
    setReason(row.reason || "");

    const startHM = safeFormatHM(row.start_datetime);
    const endHM = safeFormatHM(row.end_datetime);

    if (row.overtime_type === "custom") {
      setStartTime(startHM);
      setEndTime(endHM);
    } else {
      try {
        const wdStr = format(parseISO(row.work_date), "yyyy-MM-dd");
        const start = toDateTime(wdStr, startHM);
        const end = toDateTime(wdStr, endHM);
        const h = Math.round(hoursBetween(start, end));
        setDuration(h > 0 ? h : 1);
      } catch {
        setDuration(1);
      }
      setStartTime("");
      setEndTime("");
    }

    setIsModalOpen(true);
  };

  // Delete
  const askDelete = (row: OvertimeRequest) => {
    setDeleteTarget(row);
    setConfirmDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await overtimeApi.deleteById(deleteTarget.id);

      if (res?.success) {
        showNotification(
          res.message ||
            `Đã xóa đăng ký tăng ca ngày ${formatDate(
              deleteTarget.work_date
            )} của ${deleteTarget.employee?.name}`,
          "success"
        );
        setConfirmDeleteOpen(false);
        setDeleteTarget(null);
        loadOvertimeRequests();
      } else {
        showNotification(res?.message || "Không xóa được bản ghi", "warning");
      }
    } catch (e: any) {
      showNotification(e.message, "error");
    }
  };

  const clearFilters = () => {
    setFilterDate(new Date());
    setFilterEmployeeId("");
  };

  const formatDateTime = (dateTimeString: string): string => {
    try {
      return format(parseISO(dateTimeString), "HH:mm");
    } catch {
      return dateTimeString;
    }
  };
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };
  const safeFormatHM = (dateTimeString: string): string => {
    try {
      return format(parseISO(dateTimeString), "HH:mm");
    } catch {
      return dateTimeString.length === 5 ? dateTimeString : "00:00";
    }
  };

  return (
    <div className="payroll-container">
      <div className="payroll-wrapper">
        {/* Alert */}
        {notification.open && (
          <div
            className={`alert ${
              notification.severity === "success"
                ? "alert-success"
                : "alert-error"
            }`}
          >
            {notification.severity === "success" ? (
              <CheckCircle className="alert-icon alert-icon-success" />
            ) : (
              <AlertCircle className="alert-icon alert-icon-error" />
            )}
            <span>{notification.message}</span>
            <button
              title="Đóng thông báo"
              onClick={handleCloseNotification}
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
              <h1 className="header-title">Quản lý tăng ca</h1>
              <p className="header-subtitle">
                Hệ thống đăng ký và quản lý tăng ca nhân viên
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus style={{ width: "1rem", height: "1rem" }} />
              Đăng ký tăng ca
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Tổng đăng ký</p>
                <p className="stats-number">{statistics.total}</p>
              </div>
              <div className="stats-icon stats-icon-blue">
                <Calendar style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Sau ca chính</p>
                <p className="stats-number">{statistics.afterShift}</p>
              </div>
              <div className="stats-icon stats-icon-green">
                <Clock style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Tùy chỉnh</p>
                <p className="stats-number">{statistics.custom}</p>
              </div>
              <div className="stats-icon stats-icon-purple">
                <Settings style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-content">
              <div>
                <p className="stats-text">Nhân viên</p>
                <p className="stats-number">{statistics.employees}</p>
              </div>
              <div className="stats-icon stats-icon-orange">
                <Users style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card card-padding">
          <h2 className="filter-title">Bộ lọc</h2>
          <div className="filter-content">
            <div className="filter-input-group">
              <label className="filter-label">Lọc theo ngày</label>
              <input
                title="Lọc theo ngày"
                type="date"
                value={filterDate ? format(filterDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setFilterDate(
                    e.target.value ? new Date(e.target.value) : null
                  )
                }
                className="filter-input"
              />
            </div>
            <div className="filter-input-group">
              <label className="filter-label">Lọc theo ID nhân viên</label>
              <input
                title="Lọc theo ID nhân viên"
                type="number"
                value={filterEmployeeId}
                onChange={(e) =>
                  setFilterEmployeeId(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="filter-input"
                placeholder="Nhập ID nhân viên"
              />
            </div>
            <div className="filter-buttons">
              <button
                onClick={loadOvertimeRequests}
                disabled={loading}
                className="btn-primary"
              >
                {loading && (
                  <Loader2
                    style={{ width: "1rem", height: "1rem" }}
                    className="animate-spin"
                  />
                )}
                <RefreshCw style={{ width: "1rem", height: "1rem" }} />
                Tải lại
              </button>
              <button onClick={clearFilters} className="btn-secondary">
                <X style={{ width: "1rem", height: "1rem" }} />
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="card">
          <div className="table-header">
            <h2 className="table-title">Danh sách đăng ký tăng ca</h2>
            <p className="table-subtitle">
              Hiển thị {overtimeRequests.length} trên tổng số {statistics.total}{" "}
              bản ghi
            </p>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-container">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton"></div>
                ))}
              </div>
            ) : overtimeRequests.length === 0 ? (
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <h3 className="empty-state-title">Không có dữ liệu</h3>
                <p className="empty-state-text">
                  Không tìm thấy đăng ký tăng ca nào phù hợp với bộ lọc.
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Ngày làm việc</th>
                    <th>Loại tăng ca</th>
                    <th>Thời gian</th>
                    <th>Lý do</th>
                    <th>Ngày tạo</th>
                    <th className="text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {overtimeRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="font-medium">
                        {request.employee?.name} (ID: {request.employee_id})
                      </td>
                      <td>{formatDate(request.work_date)}</td>
                      <td>
                        <span className="badge">
                          {request.overtime_type === "after_shift"
                            ? "Sau ca chính"
                            : "Tùy chỉnh"}
                        </span>
                      </td>
                      <td>
                        {formatDateTime(request.start_datetime)} -{" "}
                        {formatDateTime(request.end_datetime)}
                      </td>
                      <td>{request.reason || "-"}</td>
                      <td>{formatDate(request.created_at)}</td>
                      <td className="text-center">
                        <button
                          title="Sửa"
                          onClick={() => openEditModal(request)}
                          className="icon-btn"
                        >
                          <Edit style={{ width: "1rem", height: "1rem" }} />
                        </button>
                        <button
                          title="Xóa"
                          onClick={() => askDelete(request)}
                          className="icon-btn icon-btn-danger"
                        >
                          <Trash2 style={{ width: "1rem", height: "1rem" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Registration / Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  {isEditing ? "Cập nhật đăng ký tăng ca" : "Đăng ký tăng ca"}
                </h3>
                <button
                  title="Đóng"
                  onClick={() => !submitting && setIsModalOpen(false)}
                  className="modal-close"
                  disabled={submitting}
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>
              <p className="modal-description">
                {isEditing
                  ? "Chỉnh sửa thông tin tăng ca cho nhân viên đã chọn."
                  : "Vui lòng điền đầy đủ thông tin để đăng ký tăng ca."}
              </p>

              {submitErrors.length > 0 && (
                <div className="alert alert-error">
                  <AlertCircle className="alert-icon alert-icon-error" />
                  <div>
                    <h4>Lỗi xử lý tăng ca</h4>
                    {submitErrors.map((error, index) => (
                      <p key={index}>
                        •{" "}
                        {error.employee_name ? `${error.employee_name}: ` : ""}
                        {error.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-grid">
                <div className="modal-field">
                  <label className="modal-label">Ngày làm việc *</label>
                  <input
                    title="Ngày làm việc"
                    type="date"
                    value={workDate ? format(workDate, "yyyy-MM-dd") : ""}
                    onChange={(e) =>
                      setWorkDate(
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    className="modal-input"
                    disabled={submitting}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Nhân viên *</label>
                  <select
                    title="nhanvien"
                    value={selectedEmployee}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedEmployee(value === "" ? "" : Number(value));
                    }}
                    className="modal-select"
                    disabled={submitting}
                  >
                    <option value="">Chọn nhân viên</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.employee_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Loại tăng ca *</label>
                  <div className="modal-radio-group">
                    <label className="modal-radio">
                      <input
                        type="radio"
                        value="after_shift"
                        checked={overtimeType === "after_shift"}
                        onChange={(e) =>
                          setOvertimeType(
                            e.target.value as "after_shift" | "custom"
                          )
                        }
                        disabled={submitting}
                      />
                      <div>
                        <span className="modal-radio-label">Sau ca chính</span>
                        <p className="modal-radio-description">
                          Tăng ca ngay sau ca làm việc cuối cùng
                        </p>
                      </div>
                    </label>
                    <label className="modal-radio">
                      <input
                        type="radio"
                        value="custom"
                        checked={overtimeType === "custom"}
                        onChange={(e) =>
                          setOvertimeType(
                            e.target.value as "after_shift" | "custom"
                          )
                        }
                        disabled={submitting}
                      />
                      <div>
                        <span className="modal-radio-label">Tùy chỉnh</span>
                        <p className="modal-radio-description">
                          Chọn thời gian tăng ca cụ thể
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                {overtimeType === "after_shift" ? (
                  <div className="modal-field">
                    <label className="modal-label">Số giờ tăng ca *</label>
                    <select
                      title="Số giờ tăng ca"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="modal-select"
                      disabled={submitting}
                    >
                      {[1, 2, 3, 4, 5, 6].map((hour) => (
                        <option key={hour} value={hour}>
                          {hour} giờ
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="modal-grid">
                    <div className="modal-field">
                      <label className="modal-label">Thời gian bắt đầu *</label>
                      <input
                        title="Thời gian bắt đầu"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="modal-input"
                        disabled={submitting}
                      />
                    </div>
                    <div className="modal-field">
                      <label className="modal-label">
                        Thời gian kết thúc *
                      </label>
                      <input
                        title="Thời gian kết thúc"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="modal-input"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                )}
                <div className="modal-field">
                  <label className="modal-label">Lý do tăng ca</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Mô tả lý do cần tăng ca (không bắt buộc)"
                    className="modal-input"
                    disabled={submitting}
                  />
                </div>
                <div className="alert alert-warning">
                  <AlertCircle className="alert-icon alert-icon-warning" />
                  <div>
                    <h4>Lưu ý quan trọng:</h4>
                    <ul>
                      <li>Không thể đăng ký tăng ca cho ngày đã qua</li>
                      <li>Nhân viên làm đủ 2 ca chính không được tăng ca</li>
                      <li>Nhân viên làm 1 ca chính tối đa 4 giờ tăng ca</li>
                      <li>Nhân viên không có ca chính tối đa 6 giờ tăng ca</li>
                      <li>Thời gian tăng ca không được trùng với ca chính</li>
                    </ul>
                    <p className="text-sm text-gray-600">
                      * Các quy tắc trên được kiểm tra và phản hồi bởi máy chủ.
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="btn-secondary btn-flex"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary btn-flex"
                >
                  {submitting && (
                    <Loader2
                      style={{ width: "1rem", height: "1rem" }}
                      className="animate-spin"
                    />
                  )}
                  {isEditing ? "Cập nhật" : "Đăng ký"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete */}
        {confirmDeleteOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">Xóa đăng ký tăng ca</h3>
                <button
                  title="Đóng"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="modal-close"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>
              <p className="modal-description">
                Bạn có chắc muốn xóa tăng ca của{" "}
                <strong>{deleteTarget?.employee?.name}</strong> vào ngày{" "}
                <strong>
                  {deleteTarget ? formatDate(deleteTarget.work_date) : ""}
                </strong>
                ?
              </p>
              <div className="modal-actions">
                <button
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="btn-secondary btn-flex"
                >
                  Hủy
                </button>
                <button
                  onClick={doDelete}
                  className="btn-primary btn-danger btn-flex"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OvertimeManagement;
