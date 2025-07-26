import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Typography,
  Button,
  Box,
  TextField,
  Collapse,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { SearchIcon } from "lucide-react";
import api from "../../api/axios";
import "../../css/Promotion.css";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';

interface Employee {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  manager_name?: string;
  manager_id?: number;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ValidationErrors {
  name?: string;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editedDetail, setEditedDetail] = useState<Partial<Department>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<number | null>(null);

  const fetchAllDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{
        status: string;
        data: Department[];
        meta: Meta;
      }>("/departments", {
        params: { page: currentPage },
      });
      if (response.status === 200) {
        setDepartments(response.data.data);
        setAllDepartments(response.data.data);
        setFilteredDepartments(response.data.data);
        setLastPage(response.data.meta.last_page);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách phòng ban";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (departmentId: number) => {
    try {
      setLoading(true);
      console.log("Fetching employees for department ID:", departmentId);
      const response = await api.get<{ status: string; data: Employee[] }>(
        `/departments/${departmentId}/employees`
      );
      console.log("API Response:", response);
      if (response.status === 200) {
        setEmployees(response.data.data || []);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Không thể tải danh sách nhân viên";
      setError(errorMessage);
      toast.error(errorMessage);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDepartments();
  }, [currentPage]);

  useEffect(() => {
    let filtered = [...allDepartments];
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((dept) =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredDepartments(filtered);
    setLastPage(Math.ceil(filtered.length / 10));
    setDepartments(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, allDepartments, currentPage]);

  const validateForm = (data: Partial<Department>): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name?.trim()) errors.name = "Tên phòng ban không được để trống";
    else if (data.name && data.name.length > 100)
      errors.name = "Tên phòng ban không được vượt quá 100 ký tự";
    return errors;
  };

  const handleViewDetail = (id: number) => {
    setViewDetailId((prev) => {
      const newValue = prev === id ? null : id;
      if (prev !== id) {
        setEditingDetailId(null);
        setValidationErrors({});
      }
      return newValue;
    });
  };

  const handleEditDetail = (department: Department) => {
    console.log("Editing department:", department);
    setViewDetailId(department.id);
    setEditingDetailId(department.id);
    setEditedDetail({
      id: department.id,
      name: department.name,
      manager_id: department.manager_id,
      manager_name: department.manager_name,
    });
    setValidationErrors({});
    fetchEmployees(department.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedDetail((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as keyof typeof prev];
      return newErrors;
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const selectedEmployee = employees.find((emp) => emp.id === Number(value));
    setEditedDetail((prev) => ({
      ...prev,
      manager_id: Number(value),
      manager_name: selectedEmployee?.name ?? "",
    }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as keyof typeof prev];
      return newErrors;
    });
  };

  const handleSaveDetail = async () => {
    if (!editedDetail || !editedDetail.id) return;

    const errors = validateForm(editedDetail);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Vui lòng kiểm tra và sửa các lỗi trong biểu mẫu");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: editedDetail.name?.trim() ?? "",
        manager_id: editedDetail.manager_id ?? null,
      };
      const response = await api.put(
        `/departments/${editedDetail.id}`,
        payload
      );
      if (response.status === 200) {
        await fetchAllDepartments();
        setEditingDetailId(null);
        setViewDetailId(null);
        setValidationErrors({});
        setEmployees([]);
        toast.success("Cập nhật phòng ban thành công!");
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Không thể cập nhật phòng ban";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingDetailId(null);
    setViewDetailId(null);
    setValidationErrors({});
    setEmployees([]);
  };

  const handleDelete = (id: number) => {
    setDepartmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (departmentToDelete === null) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.delete(`/departments/${departmentToDelete}`);
      if (response.status === 204) {
        await fetchAllDepartments();
        toast.success("Xóa phòng ban thành công!");
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Không thể xóa phòng ban";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Phòng ban {">"} Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" fontWeight={700}>
            Phòng ban
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm phòng ban"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 300,
                bgcolor: "#fff",
                borderRadius: "8px",
                mt: { xs: 2, sm: 0 },
                "& input": { fontSize: "15px" },
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              component={Link}
              to="/departments/add"
              variant="contained"
              sx={{
                backgroundColor: "#4318FF",
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2.5,
                py: 0.7,
                boxShadow: "0 2px 6px rgba(106, 27, 154, 0.3)",
                "&:hover": {
                  backgroundColor: "#7B1FA2",
                  boxShadow: "0 4px 12px rgba(106, 27, 154, 0.4)",
                },
              }}
            >
              + Thêm mới
            </Button>
          </Box>
        </Box>
      </div>

      <Card elevation={3} sx={{ p: 0, mt: 0 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <div className="promotions-loading-container">
              <CircularProgress />
              <Typography>Đang tải danh sách phòng ban...</Typography>
            </div>
          ) : error ? (
            <Typography color="error" className="promotions-error-message">
              {error}
            </Typography>
          ) : filteredDepartments.length === 0 ? (
            <Typography className="promotions-no-data">
              {searchQuery
                ? "Không tìm thấy phòng ban phù hợp với tìm kiếm."
                : "Không tìm thấy phòng ban nào."}
            </Typography>
          ) : (
            <>
              <TableContainer
                component={Paper}
                className="promotions-table-container"
              >
                <Table className="promotions-table" sx={{ width: "100%" }}>
                  <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                    <TableRow>
                      <TableCell>
                        <b>Mã</b>
                      </TableCell>
                      <TableCell>
                        <b>Tên</b>
                      </TableCell>
                      <TableCell>
                        <b>Quản lý</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Hành động</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((department) => (
                      <React.Fragment key={department.id}>
                        <TableRow hover>
                          <TableCell>{department.id}</TableCell>
                          <TableCell>{department.name}</TableCell>
                          <TableCell>
                            {department.manager_name || "N/A"}
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1}>
                              <IconButton
                                title="Xem chi tiết"
                                sx={{
                                  color: "#1976d2",
                                  bgcolor: "#e3f2fd",
                                  "&:hover": {
                                    bgcolor: "#bbdefb",
                                    boxShadow:
                                      "0 2px 6px rgba(25, 118, 210, 0.4)",
                                  },
                                  transition: "all 0.2s ease-in-out",
                                }}
                                onClick={() => handleViewDetail(department.id)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                title="Sửa"
                                sx={{
                                  color: "#FACC15",
                                  bgcolor: "#fef9c3",
                                  "&:hover": {
                                    bgcolor: "#fff9c4",
                                    boxShadow:
                                      "0 2px 6px rgba(250, 204, 21, 0.4)",
                                  },
                                  transition: "all 0.2s ease-in-out",
                                }}
                                onClick={() => handleEditDetail(department)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                title="Xóa"
                                sx={{
                                  color: "#d32f2f",
                                  bgcolor: "#ffebee",
                                  "&:hover": {
                                    bgcolor: "#ffcdd2",
                                    boxShadow:
                                      "0 2px 6px rgba(211, 47, 47, 0.4)",
                                  },
                                  transition: "all 0.2s ease-in-out",
                                }}
                                onClick={() => handleDelete(department.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} style={{ padding: 0 }}>
                            <Collapse
                              in={viewDetailId === department.id}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box
                                sx={{
                                  width: "100%",
                                  bgcolor: "#f9f9f9",
                                  px: 3,
                                  py: 2,
                                  borderTop: "1px solid #ddd",
                                }}
                              >
                                <div className="promotions-detail-container">
                                  <h3>Thông tin phòng ban</h3>
                                  {editingDetailId === department.id &&
                                  editedDetail ? (
                                    <>
                                      <Box
                                        display="flex"
                                        flexDirection="column"
                                        gap={2}
                                      >
                                        <TextField
                                          label="Tên phòng ban"
                                          name="name"
                                          value={editedDetail.name || ""}
                                          onChange={handleInputChange}
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                          error={!!validationErrors.name}
                                          helperText={validationErrors.name}
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor: "#ccc",
                                              },
                                              "&:hover fieldset": {
                                                borderColor: "#888",
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "#1976d2",
                                                borderWidth: "2px",
                                              },
                                            },
                                            "& label": {
                                              backgroundColor: "#fff",
                                              padding: "0 4px",
                                            },
                                            "& label.Mui-focused": {
                                              color: "#1976d2",
                                            },
                                          }}
                                        />
                                        <FormControl
                                          fullWidth
                                          variant="outlined"
                                          size="small"
                                        >
                                          <InputLabel>Trưởng phòng</InputLabel>
                                          <Select
                                            name="manager_id"
                                            value={editedDetail.manager_id?.toString() || ""}
                                            onChange={handleSelectChange}
                                            label="Trưởng phòng"
                                            sx={{
                                              "& .MuiOutlinedInput-root": {
                                                "& fieldset": {
                                                  borderColor: "#ccc",
                                                },
                                                "&:hover fieldset": {
                                                  borderColor: "#888",
                                                },
                                                "&.Mui-focused fieldset": {
                                                  borderColor: "#1976d2",
                                                  borderWidth: "2px",
                                                },
                                              },
                                            }}
                                          >
                                            <MenuItem value="">
                                              <em>Không có trưởng phòng</em>
                                            </MenuItem>
                                            {employees.length > 0 ? (
                                              employees.map((employee) => (
                                                <MenuItem
                                                  key={employee.id}
                                                  value={employee.id}
                                                >
                                                  {employee.name}
                                                </MenuItem>
                                              ))
                                            ) : (
                                              <MenuItem disabled>
                                                <em>Không có nhân viên</em>
                                              </MenuItem>
                                            )}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Box pb={3} mt={2} display="flex" gap={2}>
                                        <Button
                                          variant="contained"
                                          color="primary"
                                          className="promotions-btn-save"
                                          onClick={handleSaveDetail}
                                          disabled={loading}
                                        >
                                          {loading ? (
                                            <CircularProgress size={24} />
                                          ) : (
                                            "Lưu"
                                          )}
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          className="promotions-btn-cancel"
                                          color="secondary"
                                          onClick={handleCancelEdit}
                                          disabled={loading}
                                        >
                                          Hủy
                                        </Button>
                                      </Box>
                                      {error && (
                                        <Typography color="error" mt={1}>
                                          {error}
                                        </Typography>
                                      )}
                                    </>
                                  ) : (
                                    <Table className="promotions-detail-table">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>
                                            <strong>Mã:</strong> {department.id}
                                          </TableCell>
                                          <TableCell>
                                            <strong>Tên:</strong>{" "}
                                            {department.name}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell colSpan={2}>
                                            <strong>Quản lý:</strong>{" "}
                                            {department.manager_name || "N/A"}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                <Pagination
                  count={lastPage}
                  page={currentPage}
                  onChange={handlePageChange}
                  shape="rounded"
                  showFirstButton
                  showLastButton
                  siblingCount={0}
                  boundaryCount={1}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: "#888",
                      fontWeight: 500,
                      minWidth: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      border: "none",
                    },
                    "& .Mui-selected": {
                      backgroundColor: "#5B3EFF",
                      color: "#fff",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "#5B3EFF",
                      },
                    },
                    "& .MuiPaginationItem-previousNext, & .MuiPaginationItem-firstLast":
                      {
                        color: "#bbb",
                      },
                  }}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Xác nhận xóa phòng ban
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa phòng ban này không? Hành động này không
            thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            className="promotions-btn-cancel"
            sx={{
              color: "#d32f2f",
              borderColor: "#d32f2f",
              "&:hover": { borderColor: "#b71c1c", backgroundColor: "#ffebee" },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Departments;