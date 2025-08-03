/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "../../css/RosterTable.css";
import dayjs from "dayjs";

interface Employee {
  id: number;
  name: string;
  position: string;
  status: string;
  user?: {
    role?: {
      name: string;
    };
  };
}

interface ShiftOption {
  label: string;
  value: number | null;
}

interface AssignmentCell {
  employeeId: number;
  date: string;
  shiftIds: (number | null)[];
}

const RosterTable: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftOptions, setShiftOptions] = useState<ShiftOption[]>([]);
  const [assignments, setAssignments] = useState<AssignmentCell[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf("week").add(1, "day")
  );

  const today = dayjs().startOf("day");
  const dates = Array.from({ length: 7 }, (_, i) =>
    currentWeekStart.add(i, "day").format("YYYY-MM-DD")
  );

  useEffect(() => {
    api
      .get("/employees")
      .then((res) => {
        const active = res.data.data.filter(
          (emp: Employee) => emp.status !== "not_active"
        );
        setEmployees(active);
      })
      .catch((err) => console.error("Lỗi lấy danh sách nhân viên:", err));

    api
      .get("/shifts")
      .then((res) => {
        const options = res.data.map((shift: any) => ({
          label: shift.name,
          value: shift.id,
        }));
        setShiftOptions([{ label: "Trống", value: null }, ...options]);
      })
      .catch((err) => console.error("Lỗi lấy danh sách ca làm:", err));
  }, []);

  useEffect(() => {
    const fromDate = currentWeekStart.format("YYYY-MM-DD");
    const toDate = currentWeekStart.add(6, "day").format("YYYY-MM-DD");

    api
      .get("/work-assignments", {
        params: {
          from_date: fromDate,
          to_date: toDate,
          per_page: 1000,
        },
      })
      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        const mapped = data.reduce((acc: AssignmentCell[], a: any) => {
          const existing = acc.find(
            (item) =>
              item.employeeId === a.employee_id && item.date === a.work_date
          );
          if (existing) {
            existing.shiftIds.push(a.shift_id);
          } else {
            acc.push({
              employeeId: a.employee_id,
              date: a.work_date,
              shiftIds: a.shift_id ? [a.shift_id] : [],
            });
          }
          return acc;
        }, []);
        // Sắp xếp lại sau khi tải dữ liệu
        const sortedAssignments = mapped.map(
          (assignment: { shiftIds: (number | null)[] }) => ({
            ...assignment,
            shiftIds: sortShifts(assignment.shiftIds),
          })
        );
        setAssignments(sortedAssignments);
      })
      .catch((err) => console.error("Lỗi lấy danh sách phân công:", err));
  }, [currentWeekStart]);

  const sortShifts = (shiftIds: (number | null)[]): (number | null)[] => {
    if (shiftIds.length <= 1 || shiftIds.some((id) => id === null))
      return shiftIds;
    const labels = shiftIds.map(
      (id) => shiftOptions.find((opt) => opt.value === id)?.label || ""
    );
    const sangIndex = labels.indexOf("Ca Sáng");
    const chieuIndex = labels.indexOf("Ca Chiều");
    const toiIndex = labels.indexOf("Ca Tối");
    const sortedIds = [...shiftIds];
    if (sangIndex !== -1 && chieuIndex !== -1 && toiIndex !== -1) {
      const order = [sangIndex, chieuIndex, toiIndex].sort((a, b) => a - b);
      sortedIds[0] = shiftIds[order[0]];
      sortedIds[1] = shiftIds[order[1]];
    } else if (sangIndex !== -1 && chieuIndex !== -1) {
      sortedIds[0] = shiftIds[sangIndex < chieuIndex ? sangIndex : chieuIndex];
      sortedIds[1] = shiftIds[sangIndex < chieuIndex ? chieuIndex : sangIndex];
    } else if (chieuIndex !== -1 && toiIndex !== -1) {
      sortedIds[0] = shiftIds[chieuIndex < toiIndex ? chieuIndex : toiIndex];
      sortedIds[1] = shiftIds[chieuIndex < toiIndex ? toiIndex : chieuIndex];
    }
    return sortedIds.slice(0, 2);
  };

  const handleSelectChange = (
    employeeId: number,
    date: string,
    index: number,
    value: number | null
  ) => {
    const isPast = dayjs(date).isBefore(today, "day");
    if (isPast) return;

    setAssignments((prev) => {
      const existing = prev.find(
        (item) => item.employeeId === employeeId && item.date === date
      );
      let newShiftIds = existing ? [...existing.shiftIds] : [];

      if (index === 0) {
        newShiftIds[0] = value;
        if (value === null && newShiftIds[1]) newShiftIds[1] = null; // Nếu ca 1 là "Trống", xóa ca 2
      } else if (index === 1) {
        newShiftIds[1] = value;
      }

      // Sắp xếp lại để "Ca Sáng" > "Ca Chiều" > "Ca Tối"
      newShiftIds = sortShifts(newShiftIds);

      const updated = prev.filter(
        (item) => !(item.employeeId === employeeId && item.date === date)
      );
      if (newShiftIds.length > 0 || newShiftIds[0] !== null) {
        updated.push({ employeeId, date, shiftIds: newShiftIds });
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    const today = dayjs().startOf("day");

    const payloads = assignments
      .filter((a) => !dayjs(a.date).isBefore(today, "day"))
      .map((assignment) => ({
        employee_id: assignment.employeeId,
        work_date: assignment.date,
        shift_ids: sortShifts(assignment.shiftIds).filter((id) => id !== null), // Sắp xếp trước khi gửi
      }))
      .filter((payload) => payload.shift_ids.length > 0); // Chỉ gửi nếu có ca

    if (payloads.length === 0) {
      alert("Không có dữ liệu mới để phân công.");
      return;
    }

    try {
      const response = await api.post(
        "/work-assignments",
        { assignments: payloads },
        { timeout: 30000 }
      );
      alert(
        `Phân công thành công! Đã tạo: ${response.data.created_count}, Xóa: ${response.data.deleted_count}, Bỏ qua: ${response.data.skipped_count}`
      );
      // Tải lại dữ liệu sau khi lưu
      const fromDate = currentWeekStart.format("YYYY-MM-DD");
      const toDate = currentWeekStart.add(6, "day").format("YYYY-MM-DD");
      const refreshResponse = await api.get("/work-assignments", {
        params: { from_date: fromDate, to_date: toDate, per_page: 1000 },
      });
      const data =
        refreshResponse.data.data?.data || refreshResponse.data.data || [];
      const mapped = data.reduce((acc: AssignmentCell[], a: any) => {
        const existing = acc.find(
          (item) =>
            item.employeeId === a.employee_id && item.date === a.work_date
        );
        if (existing) {
          existing.shiftIds.push(a.shift_id);
        } else {
          acc.push({
            employeeId: a.employee_id,
            date: a.work_date,
            shiftIds: a.shift_id ? [a.shift_id] : [],
          });
        }
        return acc;
      }, []);
      // Sắp xếp lại sau khi tải dữ liệu
      const sortedAssignments = mapped.map(
        (assignment: { shiftIds: (number | null)[] }) => ({
          ...assignment,
          shiftIds: sortShifts(assignment.shiftIds),
        })
      );
      setAssignments(sortedAssignments);
    } catch (error: any) {
      console.error("Lỗi khi gửi phân công:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi lưu phân công. Vui lòng thử lại.";
      alert(errorMessage);
    }
  };

  return (
    <div className="roster-wrapper">
      <h2>ROSTER - PHÂN CA LÀM NHÂN VIÊN</h2>

      <div className="roster-toolbar">
        <button
          onClick={() =>
            setCurrentWeekStart(currentWeekStart.subtract(1, "week"))
          }
        >
          ⬅ Tuần trước
        </button>
        <strong>
          Tuần: {currentWeekStart.format("DD/MM/YYYY")} –{" "}
          {currentWeekStart.add(6, "day").format("DD/MM/YYYY")}
        </strong>
        <button
          onClick={() => setCurrentWeekStart(currentWeekStart.add(1, "week"))}
        >
          Tuần sau ➡
        </button>
      </div>

      <table className="roster-table">
        <thead>
          <tr>
            <th rowSpan={2}>STT</th>
            <th rowSpan={2}>HỌ TÊN</th>
            <th rowSpan={2}>Chức vụ</th>
            {dates.map((date) => (
              <th key={date}>{dayjs(date).format("DD/MM/YYYY")}</th>
            ))}
          </tr>
          <tr>
            {dates.map((date) => (
              <th key={date + "-day"}>{dayjs(date).format("ddd")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, index) => (
            <tr key={emp.id}>
              <td>{index + 1}</td>
              <td>{emp.name}</td>
              <td>{emp.user?.role?.name || emp.position || "---"}</td>
              {dates.map((date) => {
                const isPast = dayjs(date).isBefore(today, "day");
                const assignment = assignments.find(
                  (a) => a.employeeId === emp.id && a.date === date
                );
                const selectedShiftIds = assignment?.shiftIds || [null, null];

                return (
                  <td
                    key={`${emp.id}-${date}`}
                    className={isPast ? "disabled-cell" : ""}
                  >
                    <div className="shift-select-container">
                      <select
                        title="Chọn ca làm"
                        disabled={isPast}
                        value={
                          selectedShiftIds[0] === null
                            ? "0"
                            : selectedShiftIds[0]?.toString() || "0"
                        }
                        onChange={(e) =>
                          handleSelectChange(
                            emp.id,
                            date,
                            0,
                            e.target.value === "0"
                              ? null
                              : Number(e.target.value)
                          )
                        }
                      >
                        {shiftOptions.map((opt) => (
                          <option
                            key={opt.value ?? "0"}
                            value={opt.value ?? "0"}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {selectedShiftIds[0] !== null && (
                        <select
                          title="Chọn ca làm"
                          disabled={isPast}
                          value={
                            selectedShiftIds[1] === null
                              ? "0"
                              : selectedShiftIds[1]?.toString() || "0"
                          }
                          onChange={(e) =>
                            handleSelectChange(
                              emp.id,
                              date,
                              1,
                              e.target.value === "0"
                                ? null
                                : Number(e.target.value)
                            )
                          }
                        >
                          {shiftOptions
                            .filter((opt) => opt.value !== selectedShiftIds[0])
                            .map((opt) => (
                              <option
                                key={opt.value ?? "0"}
                                value={opt.value ?? "0"}
                              >
                                {opt.label}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSubmit}>Lưu Phân Công</button>
    </div>
  );
};

export default RosterTable;
