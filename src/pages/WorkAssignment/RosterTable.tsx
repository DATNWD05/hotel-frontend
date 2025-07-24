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
  value: number;
}

interface AssignmentCell {
  employeeId: number;
  date: string;
  shiftId: number | null;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          per_page: 1000, // nếu backend vẫn paginate
        },
      })
      .then((res) => {
        const data = res.data.data?.data || res.data.data || []; // fallback nếu paginate hoặc get
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = data.map((a: any) => ({
          employeeId: a.employee_id,
          date: a.work_date,
          shiftId: a.shift_id,
        }));
        setAssignments(mapped);
      })
      .catch((err) => console.error("Lỗi lấy danh sách phân công:", err));
  }, [currentWeekStart]);

  const handleSelectChange = (
    employeeId: number,
    date: string,
    shiftId: number
  ) => {
    const isPast = dayjs(date).isBefore(today, "day");
    if (isPast) return;

    setAssignments((prev) => {
      // Xoá nếu chọn dòng trống (shiftId === 0)
      const updated = prev.filter(
        (item) => !(item.employeeId === employeeId && item.date === date)
      );

      // Nếu có chọn ca (shiftId khác 0) thì thêm mới
      if (shiftId !== 0) {
        updated.push({ employeeId, date, shiftId });
      }

      return updated;
    });
  };

  const handleSubmit = async () => {
    const today = dayjs().startOf("day");

    const groupedByShift: { [key: number]: { [date: string]: number[] } } = {};

    assignments.forEach(({ employeeId, date, shiftId }) => {
      if (dayjs(date).isBefore(today, "day")) return; // vẫn bỏ quá khứ

      const shiftKey = shiftId ?? 0; // shiftId null thì về 0

      if (!groupedByShift[shiftKey]) groupedByShift[shiftKey] = {};
      if (!groupedByShift[shiftKey][date]) groupedByShift[shiftKey][date] = [];

      groupedByShift[shiftKey][date].push(employeeId);
    });

    const payloads = Object.entries(groupedByShift).flatMap(
      ([shiftId, dateGroup]) =>
        Object.entries(dateGroup).map(([date, employeeIds]) => ({
          shift_id: Number(shiftId) === 0 ? null : Number(shiftId),
          work_dates: [date],
          employee_ids: employeeIds,
        }))
    );

    if (payloads.length === 0) {
      alert("Không có dữ liệu mới để phân công.");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const body of payloads) {
      try {
        await api.post("/work-assignments", body, { timeout: 30000 });
        successCount++;
      } catch (error) {
        console.error("Lỗi khi gửi payload:", body, error);
        failCount++;
      }
    }

    if (failCount === 0) {
      alert(`Phân công thành công!`);
    } else {
      alert(`Phân công xong. ${successCount} thành công, ${failCount} lỗi.`);
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
                return (
                  <td
                    key={`${emp.id}-${date}`}
                    className={isPast ? "disabled-cell" : ""}
                  >
                    <select
                      disabled={isPast}
                      value={
                        assignments.find(
                          (a) => a.employeeId === emp.id && a.date === date
                        )?.shiftId || 0
                      }
                      onChange={(e) =>
                        handleSelectChange(emp.id, date, Number(e.target.value))
                      }
                    >
                      {shiftOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
