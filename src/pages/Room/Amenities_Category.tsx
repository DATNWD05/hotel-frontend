import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  TextField,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Pagination,
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios, { AxiosError } from "axios";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import "../../css/Amenities.css"; // Sử dụng cùng file CSS với Amenities

interface AmenityCategory {
  id: string;
  name: string;
  description: string;
}

interface RawAmenityCategory {
  id?: number | string;
  name?: string;
  description?: string | null | undefined;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

interface ApiResponse {
  data: RawAmenityCategory[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const AmenitiesCategoryList: React.FC = () => {
  const [allCategories, setAllCategories] = useState<AmenityCategory[]>([]);
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<AmenityCategory | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>(""); // Thêm state tìm kiếm
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  ); // Thêm state cho bộ lọc
  const [activeFilters, setActiveFilters] = useState<string[]>([]); // Thêm state cho bộ lọc
  const navigate = useNavigate();

  const API_URL = "http://127.0.0.1:8000/api/amenity-categories";
  const PER_PAGE = 10;

  const fetchCategories = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      const response = await axios.get<ApiResponse>(
        `${API_URL}?page=${page}&per_page=${PER_PAGE}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const mapped: AmenityCategory[] = response.data.data.map(
        (cat: RawAmenityCategory) => ({
          id: cat.id != null ? String(cat.id) : "",
          name: cat.name || "Không xác định",
          description: cat.description ?? "",
        })
      );

      setAllCategories((prev) => [...prev, ...mapped]); // Lưu tất cả danh mục
      setCategories(mapped);
      setLastPage(response.data.meta.last_page);
      setCurrentPage(response.data.meta.current_page);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : `Không thể tải danh mục tiện ích: ${err.message}`
          : "Lỗi không xác định";
      setError(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        navigate("/login");
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Danh sách Danh Mục Tiện Ích";
    fetchCategories(1);
  }, []);

  useEffect(() => {
    let filtered = [...allCategories];

    // Lọc theo searchQuery
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Lọc theo activeFilters (giả định lọc theo trạng thái, nếu có)
    if (activeFilters.length > 0 && !activeFilters.includes("all")) {
      // Có thể thêm logic lọc nếu API trả về trạng thái hoặc thuộc tính khác
      // Ví dụ: filtered = filtered.filter((cat) => activeFilters.includes(cat.status));
    }

    setCategories(
      filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
    );
    setLastPage(Math.ceil(filtered.length / PER_PAGE));
  }, [searchQuery, activeFilters, currentPage, allCategories]);

  useEffect(() => {
    let filtered = [...allCategories];
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setLastPage(Math.ceil(filtered.length / 10));
    setCategories(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, currentPage, allCategories]);

  const validateForm = (data: AmenityCategory): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) {
      errors.name = "Tên danh mục không được để trống";
    } else if (data.name.length > 50) {
      errors.name = "Tên danh mục không được vượt quá 50 ký tự";
    }
    if (data.description && data.description.length > 500) {
      errors.description = "Mô tả không được vượt quá 500 ký tự";
    }
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

  const handleEdit = (category: AmenityCategory) => {
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

    setEditLoading(true);
    try {
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
          ? err.message
          : err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật danh mục";
      setEditError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
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

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Không tìm thấy token xác thực");
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/${categoryToDelete}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setAllCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryToDelete)
        );
        fetchCategories(currentPage);
        setSnackbarMessage("Xóa danh mục thành công!");
        setSnackbarOpen(true);
      } else {
        throw new Error("Không thể xóa danh mục");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? `Không thể xóa danh mục: ${err.message}`
          : err instanceof Error
          ? `Không thể xóa danh mục: ${err.message}`
          : "Lỗi không xác định";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
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
    setCurrentPage(newPage);
    fetchCategories(newPage);
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
    handleFilterClose();
  };

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Tiện ích {">"} Danh sách Danh Mục
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" fontWeight={700}>
            Danh Mục Tiện Ích
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
              onClick={() => navigate("/amenity-categories/add")}
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
              p={2}
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
                : "Không tìm thấy danh mục tiện ích nào."}
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
                        <b>Tên</b>
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
                    {categories.map((category) => (
                      <React.Fragment key={category.id}>
                        <TableRow hover>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.description || "–"}</TableCell>
                          <TableCell align="center">
                            <Box
                              display="flex"
                              justifyContent="center"
                              gap={1}
                              sx={{ flexWrap: "wrap" }}
                            >
                              <IconButton
                                title={
                                  selectedCategoryId === category.id
                                    ? "Ẩn chi tiết"
                                    : "Xem chi tiết"
                                }
                                onClick={() => handleViewDetails(category.id)}
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
                                {selectedCategoryId === category.id ? (
                                  <VisibilityOffIcon fontSize="small" />
                                ) : (
                                  <VisibilityIcon fontSize="small" />
                                )}
                              </IconButton>
                              <IconButton
                                title="Chỉnh sửa danh mục"
                                onClick={() => handleEdit(category)}
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
                                onClick={() => handleDelete(category.id)}
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
                            <Collapse in={selectedCategoryId === category.id}>
                              <div className="promotion-detail-container">
                                {editCategoryId === category.id &&
                                editFormData ? (
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
                                        label="Tên"
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
                                        <strong>Tên:</strong> {category.name}
                                      </Typography>
                                      <Typography>
                                        <strong>Mô tả:</strong>{" "}
                                        {category.description || "–"}
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
              <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                <Pagination
                  count={lastPage}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                  sx={{ "& .MuiPaginationItem-root": { fontSize: "14px" } }}
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
          Xác nhận xóa danh mục
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không
            thể hoàn tác.
          </Typography>
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
        autoHideDuration={3000}
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

export default AmenitiesCategoryList;
