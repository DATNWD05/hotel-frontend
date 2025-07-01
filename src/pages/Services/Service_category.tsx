import React, { useEffect, useState } from "react";
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
  Collapse,
  Box,
  TextField,
  Button,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Chip,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon } from "lucide-react";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import "../../css/Amenities.css";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

interface RawServiceCategory {
  id?: number | string;
  name?: string;
  description?: string | null | undefined;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse {
  data: RawServiceCategory[];
  meta: Meta;
}

interface ServiceApiResponse {
  status: string;
  data: { id: string; name: string; category_id?: string }[];
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

const ServiceCategoryList: React.FC = () => {
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ServiceCategory | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const navigate = useNavigate();

  const API_URL = "http://127.0.0.1:8000/api/service-categories";
  const SERVICE_API_URL = "http://127.0.0.1:8000/api/service";
  const PER_PAGE = 10;

  const fetchCategories = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error(
          "Không tìm thấy token xác thực. Vui lòng đăng nhập lại."
        );
      }

      const response = await axios.get<ApiResponse>(
        `${API_URL}?page=${page}&per_page=${PER_PAGE}&search=${search}&t=${Date.now()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!Array.isArray(response.data.data)) {
        throw new Error("Dữ liệu danh mục không đúng định dạng.");
      }

      const mappedCategories: ServiceCategory[] = response.data.data.map(
        (cat: RawServiceCategory) => ({
          id: cat.id != null ? String(cat.id) : "",
          name: cat.name || "Không xác định",
          description: cat.description ?? "–",
        })
      );

      setAllCategories(
        page === 1 ? mappedCategories : [...allCategories, ...mappedCategories]
      );
      setCategories(mappedCategories);
      setMeta(response.data.meta);
      setPage(response.data.meta.current_page);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : `Không thể tải danh mục dịch vụ: ${
                err.response?.data?.message || err.message
              }`
          : err instanceof Error
          ? err.message
          : "Lỗi không xác định";
      setError(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Danh sách Danh mục Dịch vụ";
    fetchCategories(page, searchQuery);
  }, [page, searchQuery]);

  useEffect(() => {
    let filtered = [...allCategories];

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilters.length > 0 && !activeFilters.includes("all")) {
      // Placeholder cho lọc trạng thái nếu API hỗ trợ
    }

    setCategories(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
    setMeta((prev) =>
      prev
        ? { ...prev, last_page: Math.ceil(filtered.length / PER_PAGE) }
        : null
    );
  }, [searchQuery, activeFilters, page, allCategories]);

  const validateForm = (data: ServiceCategory): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Tên danh mục không được để trống";
    else if (data.name.length > 50)
      errors.name = "Tên danh mục không được vượt quá 50 ký tự";
    if (data.description && data.description.length > 500)
      errors.description = "Mô tả không được vượt quá 500 ký tự";
    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = { ...editFormData, [name]: value };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleEdit = (category: ServiceCategory) => {
    setSelectedCategoryId(category.id);
    setEditCategoryId(category.id);
    setEditFormData({ ...category });
    setValidationErrors({});
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editFormData) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setEditLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Không tìm thấy token xác thực");

      const response = await axios.put(
        `${API_URL}/${editFormData.id}`,
        {
          name: editFormData.name,
          description: editFormData.description || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setAllCategories((prev) =>
          prev.map((cat) =>
            cat.id === editFormData.id ? { ...editFormData } : cat
          )
        );
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editFormData.id ? { ...editFormData } : cat
          )
        );
        setEditCategoryId(null);
        setEditFormData(null);
        setSelectedCategoryId(null);
        setSnackbarMessage("Cập nhật danh mục thành công!");
        setSnackbarOpen(true);
      } else {
        throw new Error("Không thể cập nhật danh mục");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : err.response?.data?.message ||
              `Không thể cập nhật danh mục: ${err.message}`
          : err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật danh mục";
      setEditError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditCategoryId(null);
    setEditFormData(null);
    setSelectedCategoryId(null);
    setValidationErrors({});
    setEditError(null);
  };

  const handleViewDetails = (id: string) => {
    setSelectedCategoryId((prev) =>
      prev === id && editCategoryId !== id ? null : id
    );
    if (editCategoryId === id) {
      setEditCategoryId(null);
      setEditFormData(null);
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      const category = allCategories.find((cat) => cat.id === id);
      console.log(
        `Kiểm tra dịch vụ liên kết cho danh mục ID: ${id}, Tên: ${
          category?.name || "Không xác định"
        }`
      );
      console.log(
        `Gọi API: ${SERVICE_API_URL}?category_id=${id}&t=${Date.now()}`
      );

      const checkResponse = await axios.get<ServiceApiResponse>(
        `${SERVICE_API_URL}?category_id=${id}&t=${Date.now()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Phản hồi API kiểm tra dịch vụ:",
        JSON.stringify(checkResponse.data, null, 2)
      );

      if (checkResponse.data.status !== "success") {
        throw new Error(
          `API trả về trạng thái không hợp lệ: ${checkResponse.data.status}`
        );
      }

      if (
        checkResponse.data.data &&
        Array.isArray(checkResponse.data.data) &&
        checkResponse.data.data.length > 0
      ) {
        // Kiểm tra xem các dịch vụ có thực sự thuộc category_id yêu cầu
        const validServices = checkResponse.data.data.filter(
          (service) => service.category_id && service.category_id === id
        );
        const invalidServices = checkResponse.data.data.filter(
          (service) => !service.category_id || service.category_id !== id
        );

        if (invalidServices.length > 0) {
          console.warn(
            "Cảnh báo: API trả về dịch vụ không thuộc category_id yêu cầu:",
            invalidServices
          );
          setSnackbarMessage(
            `API trả về dữ liệu sai: Một số dịch vụ không thuộc danh mục "${
              category?.name || "Không xác định"
            }". Vui lòng kiểm tra backend.`
          );
          setSnackbarOpen(true);
          return;
        }

        if (validServices.length > 0) {
          const serviceNames = validServices
            .map((service) => service.name)
            .join(", ");
          setSnackbarMessage(
            `Không thể xóa danh mục "${
              category?.name || "Không xác định"
            }" vì vẫn còn dịch vụ liên kết: ${serviceNames}. Vui lòng xóa hoặc chuyển các dịch vụ này trước.`
          );
          setSnackbarOpen(true);
          return;
        }
      }

      setCategoryToDelete(id);
      setDeleteDialogOpen(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : err.response?.data?.message ||
              `Không thể kiểm tra dịch vụ liên kết: ${err.message}`
          : err instanceof Error
          ? err.message
          : "Lỗi không xác định";
      console.error("Lỗi trong handleDelete:", errorMessage, err);
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      const category = allCategories.find((cat) => cat.id === categoryToDelete);
      console.log(
        `Xóa danh mục ID: ${categoryToDelete}, Tên: ${
          category?.name || "Không xác định"
        }`
      );

      const response = await axios.delete(`${API_URL}/${categoryToDelete}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        setAllCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryToDelete)
        );
        setCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryToDelete)
        );
        setSnackbarMessage(
          `Xóa danh mục "${category?.name || "Không xác định"}" thành công!`
        );
        setSnackbarOpen(true);
        if (categories.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchCategories(page, searchQuery);
        }
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : err.response?.data?.message ||
              `Không thể xóa danh mục: ${err.message}`
          : err instanceof Error
          ? `Không thể xóa danh mục: ${err.message}`
          : "Lỗi không xác định";
      console.error("Lỗi trong confirmDelete:", errorMessage, err);
      setError(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
    fetchCategories(newPage, searchQuery);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filter: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(filter)) {
        return prev.filter((f) => f !== filter);
      } else {
        return [...prev, filter].filter((f) => f !== "all");
      }
    });
    setPage(1);
    handleFilterClose();
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Dịch vụ {">"} Danh sách Danh Mục
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" fontWeight={700}>
            Danh Mục Dịch Vụ
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm danh mục"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: "100%", sm: 300 },
                bgcolor: "#fff",
                borderRadius: "8px",
                "& input": { fontSize: "15px" },
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconButton
              onClick={handleFilterClick}
              sx={{
                bgcolor: "#fff",
                borderRadius: "8px",
                p: 1,
                "&:hover": { bgcolor: "#f0f0f0" },
              }}
              className="filter-button"
            >
              <FilterListIcon />
            </IconButton>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              sx={{
                "& .MuiPaper-root": {
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                },
              }}
            >
              {["all", "active", "inactive"].map((filter) => (
                <MenuItem
                  key={filter}
                  onClick={() => handleFilterSelect(filter)}
                  selected={activeFilters.includes(filter)}
                  sx={{
                    "&:hover": { bgcolor: "#f0f0f0" },
                    "&.Mui-selected": {
                      bgcolor: "#e0f7fa",
                      "&:hover": { bgcolor: "#b2ebf2" },
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: activeFilters.includes(filter)
                        ? "#00796b"
                        : "#333",
                    }}
                  >
                    {filter === "all"
                      ? "Tất cả"
                      : filter === "active"
                      ? "Hoạt động"
                      : "Không hoạt động"}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              {activeFilters.length > 0 && (
                <Chip
                  label={`Bộ lọc: ${activeFilters.length} đã chọn`}
                  onDelete={() => setActiveFilters([])}
                  onClick={handleFilterClick}
                  sx={{
                    bgcolor: "#e0f7fa",
                    color: "#00796b",
                    fontWeight: "bold",
                    height: "28px",
                    cursor: "pointer",
                    "& .MuiChip-deleteIcon": { color: "#00796b" },
                  }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate("/service-categories/add")}
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

      <Card elevation={3} sx={{ p: 0, mt: 0, borderRadius: "8px" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              p={4}
            >
              <CircularProgress />
              <Typography ml={2}>Đang tải danh sách danh mục...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" p={2} textAlign="center">
              {error}
            </Typography>
          ) : categories.length === 0 ? (
            <Typography p={2} textAlign="center">
              {searchQuery || activeFilters.length > 0
                ? "Không tìm thấy danh mục phù hợp"
                : "Không tìm thấy danh mục dịch vụ nào."}
            </Typography>
          ) : (
            <>
              <TableContainer
                component={Paper}
                className="promotions-table-container"
                sx={{ maxWidth: "100%", overflowX: "auto" }}
              >
                <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                  <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                    <TableRow>
                      <TableCell sx={{ minWidth: "150px" }}>
                        <b>Tên danh mục</b>
                      </TableCell>
                      <TableCell sx={{ minWidth: "200px" }}>
                        <b>Mô tả</b>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: "150px" }}>
                        <b>Hành động</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((cat) => (
                      <React.Fragment key={cat.id}>
                        <TableRow hover>
                          <TableCell>{cat.name}</TableCell>
                          <TableCell>{cat.description}</TableCell>
                          <TableCell align="center">
                            <Box
                              display="flex"
                              justifyContent="center"
                              gap={1}
                              sx={{ flexWrap: "wrap" }}
                            >
                              <IconButton
                                title={
                                  selectedCategoryId === cat.id
                                    ? "Ẩn chi tiết"
                                    : "Xem chi tiết"
                                }
                                onClick={() => handleViewDetails(cat.id)}
                                sx={{
                                  color: "#1976d2",
                                  bgcolor: "#e3f2fd",
                                  p: "6px",
                                  "&:hover": {
                                    bgcolor: "#bbdefb",
                                    boxShadow:
                                      "0 2px 6px rgba(25, 118, 210, 0.4)",
                                  },
                                }}
                              >
                                {selectedCategoryId === cat.id ? (
                                  <VisibilityOffIcon fontSize="small" />
                                ) : (
                                  <VisibilityIcon fontSize="small" />
                                )}
                              </IconButton>
                              <IconButton
                                title="Chỉnh sửa danh mục"
                                onClick={() => handleEdit(cat)}
                                sx={{
                                  color: "#FACC15",
                                  bgcolor: "#fef9c3",
                                  p: "6px",
                                  "&:hover": {
                                    bgcolor: "#fff9c4",
                                    boxShadow:
                                      "0 2px 6px rgba(250, 204, 21, 0.4)",
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                title="Xóa danh mục"
                                onClick={() => handleDelete(cat.id)}
                                sx={{
                                  color: "#d32f2f",
                                  bgcolor: "#ffebee",
                                  p: "6px",
                                  "&:hover": {
                                    bgcolor: "#ffcdd2",
                                    boxShadow:
                                      "0 2px 6px rgba(211, 47, 47, 0.4)",
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} style={{ padding: 0 }}>
                            <Collapse in={selectedCategoryId === cat.id}>
                              <div className="promotion-detail-container">
                                {editCategoryId === cat.id && editFormData ? (
                                  <Box
                                    sx={{
                                      p: 2,
                                      bgcolor: "#fff",
                                      borderRadius: "8px",
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      gutterBottom
                                      sx={{ fontWeight: 600, color: "#333" }}
                                    >
                                      Chỉnh sửa danh mục
                                    </Typography>
                                    <Box
                                      display="flex"
                                      flexDirection="column"
                                      gap={2}
                                    >
                                      <TextField
                                        label="Tên danh mục"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleChange}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        error={!!validationErrors.name}
                                        helperText={validationErrors.name}
                                        sx={{
                                          bgcolor: "#fff",
                                          borderRadius: "4px",
                                        }}
                                      />
                                      <TextField
                                        label="Mô tả"
                                        name="description"
                                        value={editFormData.description}
                                        onChange={handleChange}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        multiline
                                        rows={3}
                                        error={!!validationErrors.description}
                                        helperText={
                                          validationErrors.description
                                        }
                                        sx={{
                                          bgcolor: "#fff",
                                          borderRadius: "4px",
                                        }}
                                      />
                                      <Box mt={2} display="flex" gap={2}>
                                        <Button
                                          variant="contained"
                                          onClick={handleSave}
                                          disabled={editLoading}
                                          sx={{
                                            backgroundColor: "#4318FF",
                                            color: "#fff",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            borderRadius: "8px",
                                            px: 2.5,
                                            py: 0.7,
                                            "&:hover": {
                                              backgroundColor: "#7B1FA2",
                                            },
                                            "&:disabled": {
                                              backgroundColor: "#a9a9a9",
                                            },
                                          }}
                                        >
                                          {editLoading ? (
                                            <CircularProgress size={24} />
                                          ) : (
                                            "Lưu"
                                          )}
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          onClick={handleCancel}
                                          disabled={editLoading}
                                          sx={{
                                            color: "#f44336",
                                            borderColor: "#f44336",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            borderRadius: "8px",
                                            px: 2.5,
                                            py: 0.7,
                                            "&:hover": {
                                              borderColor: "#d32f2f",
                                              backgroundColor: "#ffebee",
                                            },
                                            "&:disabled": {
                                              color: "#a9a9a9",
                                              borderColor: "#a9a9a9",
                                            },
                                          }}
                                        >
                                          Hủy
                                        </Button>
                                      </Box>
                                      {editError && (
                                        <Typography color="error" mt={1}>
                                          {editError}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      p: 2,
                                      bgcolor: "#fff",
                                      borderRadius: "8px",
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      gutterBottom
                                      sx={{ fontWeight: 600, color: "#333" }}
                                    >
                                      Thông tin danh mục
                                    </Typography>
                                    <Box display="grid" gap={1}>
                                      <Typography>
                                        <strong>Tên danh mục:</strong>{" "}
                                        {cat.name}
                                      </Typography>
                                      <Typography>
                                        <strong>Mô tả:</strong>{" "}
                                        {cat.description}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                              </div>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {meta && meta.last_page > 1 && (
                <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                  <Pagination
                    count={meta.last_page}
                    page={page}
                    onChange={handlePageChange}
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    siblingCount={0} // 👉 không hiển thị số kề bên
                    boundaryCount={1} // 👉 chỉ hiển thị 1 đầu/cuối
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontSize: "14px",
                        borderRadius: "8px",
                        color: "#333",
                        fontWeight: 500,
                      },
                      "& .MuiPaginationItem-page.Mui-selected": {
                        backgroundColor: "#4318FF",
                        color: "#fff",
                        fontWeight: "bold",
                      },
                      "& .MuiPaginationItem-previousNext, & .MuiPaginationItem-firstLast":
                        {
                          color: "#999",
                        },
                    }}
                  />
                </Box>
              )}
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
          Xác nhận xóa danh mục
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không
            thể hoàn tác.
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Lưu ý: Nếu danh mục có dịch vụ liên kết, bạn cần xóa hoặc chuyển các
            dịch vụ sang danh mục khác trước.
          </Typography>
          {categoryToDelete && (
            <Button
              variant="text"
              onClick={() =>
                navigate(`/service?category_id=${categoryToDelete}`)
              }
              sx={{
                mt: 2,
                color: "#1976d2",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Xem danh sách dịch vụ liên kết
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: "#d32f2f",
              borderColor: "#d32f2f",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 2.5,
              py: 0.7,
              "&:hover": { borderColor: "#b71c1c", backgroundColor: "#ffebee" },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              bgcolor: "#d32f2f",
              "&:hover": { bgcolor: "#b71c1c" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 2.5,
              py: 0.7,
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={
            snackbarMessage.includes("thành công") ? "success" : "error"
          }
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ServiceCategoryList;
