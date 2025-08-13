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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Card,
  CardContent,
  InputAdornment,
  Menu as MuiMenu,
  MenuItem as MenuItemMenu,
  GlobalStyles,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Popper from "@mui/material/Popper";
import { SelectChangeEvent } from "@mui/material/Select";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { SearchIcon } from "lucide-react";
import FilterListIcon from "@mui/icons-material/FilterList";
import { format, parseISO, isValid } from "date-fns";
import numeral from "numeral";
import api from "../../api/axios";
import "../../css/Promotion.css";
import { JSX } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

/* ========= Types ========= */
type DiscountType = "percent" | "amount";
type StatusType = "scheduled" | "active" | "expired" | "cancelled" | "depleted";

interface Promotion {
  id: number;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  status: StatusType;
}

interface ValidationErrors {
  code?: string;
  description?: string;
  discount_type?: string;
  discount_value?: string;
  start_date?: string;
  end_date?: string;
  usage_limit?: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* ========= Helpers ========= */
const formatCurrency = (value: number | null, discountType: DiscountType): string => {
  if (value === null || value === undefined) return "N/A";
  if (discountType === "percent") return `${value}%`;
  return numeral(value).format("0,0") + " VNĐ";
};

/** Popper “tĩnh” để tooltip/menu không chạy từ ngoài vào */
const StaticPopper = styled(Popper)({
  position: "static !important",
  transform: "none !important",
  left: "0 !important",
  top: "auto !important",
  width: "auto !important",
  zIndex: "auto",
  transition: "none !important",
  animation: "none !important",
});

/** Tooltip formatter (không bay) */
const formatDate = (date: string): JSX.Element => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) throw new Error("Invalid date");
    return (
      <Tooltip
        title={format(parsedDate, "dd/MM/yyyy HH:mm:ss")}
        disablePortal
        TransitionProps={{ timeout: 0 }}
        placement="top"
        components={{ Popper: StaticPopper }}
      >
        <span>{format(parsedDate, "dd/MM/yyyy")}</span>
      </Tooltip>
    );
  } catch {
    return <span>N/A</span>;
  }
};

const formatDateForInput = (date: string): string => {
  try {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return "";
    return format(parsedDate, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const getPromotionStatus = (status: StatusType): { status: string; color: string } => {
  switch (status) {
    case "scheduled":
      return { status: "Chưa bắt đầu", color: "#757575" };
    case "active":
      return { status: "Đang hoạt động", color: "#388E3C" };
    case "expired":
      return { status: "Hết hạn", color: "#D32F2F" };
    case "cancelled":
      return { status: "Bị hủy", color: "#757575" };
    case "depleted":
      return { status: "Hết lượt", color: "#FF8F00" };
    default:
      return { status: "Không xác định", color: "#757575" };
  }
};

// Cập nhật trạng thái theo thời gian / usage
const updatePromotionStatus = (promotion: Promotion, currentDate: Date): StatusType => {
  const startDate = parseISO(promotion.start_date);
  const endDate = parseISO(promotion.end_date);

  if (promotion.status === "cancelled") return "cancelled";
  if (!isValid(startDate) || !isValid(endDate)) return "cancelled";
  if (currentDate < startDate) return "scheduled";
  if (currentDate >= startDate && currentDate <= endDate && promotion.used_count < promotion.usage_limit)
    return "active";
  if (currentDate > endDate) return "expired";
  if (promotion.used_count >= promotion.usage_limit) return "depleted";
  return promotion.status;
};

/* ========= Component ========= */
const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editedDetail, setEditedDetail] = useState<Partial<Promotion>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [promotionToDelete, setPromotionToDelete] = useState<number | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const fetchAllPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      let allData: Promotion[] = [];
      let page = 1;
      const currentDate = new Date();

      while (true) {
        const response = await api.get("/promotions", { params: { page } });
        if (response.status === 200) {
          const data: { data: Promotion[]; meta: Meta } = response.data;
          const sanitizedData = data.data.map((item) => {
            const sanitizedItem = {
              ...item,
              discount_type: item.discount_type === "percent" || item.discount_type === "amount" ? item.discount_type : "amount",
              status: ["scheduled", "active", "expired", "cancelled", "depleted"].includes(item.status)
                ? item.status
                : "cancelled",
              usage_limit: Number(item.usage_limit),
              used_count: Number(item.used_count),
              start_date: item.start_date && isValid(parseISO(item.start_date)) ? item.start_date : new Date().toISOString(),
              end_date: item.end_date && isValid(parseISO(item.end_date)) ? item.end_date : new Date().toISOString(),
            };
            sanitizedItem.status = updatePromotionStatus(sanitizedItem, currentDate);
            return sanitizedItem;
          });
          allData = [...allData, ...sanitizedData];
          if (page >= data.meta.last_page) break;
          page++;
        } else {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }
      }

      setAllPromotions(allData);
      setPromotions(allData.slice(0, 10));
      setLastPage(Math.ceil(allData.length / 10));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách khuyến mãi";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPromotions();
  }, []);

  useEffect(() => {
    let filtered = [...allPromotions];

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((prev) => prev.code.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (statusFilters.length > 0) {
      filtered = filtered.filter((prev) => {
        const { status } = getPromotionStatus(prev.status);
        return statusFilters.includes(status);
      });
    }

    setFilteredPromotions(filtered);
    setLastPage(Math.ceil(filtered.length / 10));
    setPromotions(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, statusFilters, allPromotions, currentPage]);

  const validateForm = (data: Partial<Promotion>): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code?.trim()) errors.code = "Mã khuyến mãi không được để trống";
    else if (data.code && data.code.length > 20) errors.code = "Mã khuyến mãi không được vượt quá 20 ký tự";
    if (!data.description?.trim()) errors.description = "Mô tả không được để trống";
    else if (data.description && data.description.length > 200) errors.description = "Mô tả không được vượt quá 200 ký tự";
    if (!data.discount_type) errors.discount_type = "Vui lòng chọn loại giảm giá";
    if (data.discount_value === undefined || data.discount_value <= 0) errors.discount_value = "Giá trị giảm phải lớn hơn 0";
    else if (data.discount_type === "percent" && data.discount_value > 100) errors.discount_value = "Giá trị giảm không được vượt quá 100%";
    if (!data.start_date) errors.start_date = "Ngày bắt đầu không được để trống";
    else if (!isValid(parseISO(data.start_date))) errors.start_date = "Ngày bắt đầu không hợp lệ";
    if (!data.end_date) errors.end_date = "Ngày kết thúc không được để trống";
    else if (!isValid(parseISO(data.end_date))) errors.end_date = "Ngày kết thúc không hợp lệ";
    else if (data.start_date && data.end_date && data.start_date > data.end_date) {
      errors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    if (data.usage_limit === undefined || data.usage_limit <= 0) {
      errors.usage_limit = "Giới hạn số lần dùng phải lớn hơn 0";
    }
    return errors;
  };

  const handleViewDetail = (id: number) => {
    setViewDetailId((prev) => {
      const newValue = prev === id ? null : id;
      if (prev !== id) setEditingDetailId(null), setValidationErrors({});
      return newValue;
    });
  };

  const handleEditDetail = (promotion: Promotion) => {
    setViewDetailId(promotion.id);
    setEditingDetailId(promotion.id);
    setEditedDetail({
      id: promotion.id,
      code: promotion.code,
      description: promotion.description,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      start_date: formatDateForInput(promotion.start_date),
      end_date: formatDateForInput(promotion.end_date),
      usage_limit: promotion.usage_limit,
      used_count: promotion.used_count,
      status: promotion.status,
    });
    setValidationErrors({});
  };

  const handleChangeDetail = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedDetail((prev) => ({ ...prev, [name]: value } as Partial<Promotion>));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as keyof typeof prev];
      return newErrors;
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<DiscountType>) => {
    const { name, value } = e.target;
    if (name && editedDetail) {
      setEditedDetail((prev) => ({ ...prev, [name]: value } as Partial<Promotion>));
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof prev];
        return newErrors;
      });
    }
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
        code: editedDetail.code?.trim() ?? "",
        description: editedDetail.description?.trim() ?? "",
        discount_type: editedDetail.discount_type ?? "amount",
        discount_value: editedDetail.discount_value != null ? Number(editedDetail.discount_value) : 0,
        start_date: editedDetail.start_date ?? new Date().toISOString(),
        end_date: editedDetail.end_date ?? new Date().toISOString(),
        usage_limit: editedDetail.usage_limit !== undefined ? Number(editedDetail.usage_limit) : 0,
        used_count: editedDetail.used_count != null ? Number(editedDetail.used_count) : 0,
        status: editedDetail.status ?? "cancelled",
      };

      const response = await api.put(`/promotions/${editedDetail.id}`, payload);
      if (response.status === 200) {
        await fetchAllPromotions();
        setEditingDetailId(null);
        setViewDetailId(null);
        setValidationErrors({});
        toast.success("Cập nhật khuyến mãi thành công!");
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật khuyến mãi";
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
  };

  const handleDelete = (id: number) => {
    setPromotionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (promotionToDelete === null) return;

    try {
      setLoading(true);
      setError(null);

      const promotion = promotions.find((p) => p.id === promotionToDelete);
      if (!promotion) throw new Error("Không tìm thấy mã khuyến mãi để xóa");

      if (promotion.used_count > 0) {
        const updatedPromotion = { ...promotion, status: "cancelled" };
        const updateResponse = await api.put(`/promotions/${promotionToDelete}`, updatedPromotion);
        if (updateResponse.status !== 200) throw new Error("Không thể hủy khuyến mãi do lỗi từ phía server");
        toast.success("Hủy khuyến mãi thành công!");
      } else {
        const deleteResponse = await api.delete(`/promotions/${promotionToDelete}`);
        if (deleteResponse.status !== 200 && deleteResponse.status !== 204)
          throw new Error("Không thể xóa khuyến mãi do lỗi từ phía server");
        toast.success("Xóa khuyến mãi thành công!");
      }

      await fetchAllPromotions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể xóa hoặc hủy khuyến mãi";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setPromotionToDelete(null);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    setPromotions(filteredPromotions.slice((page - 1) * 10, page * 10));
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (status: string) => {
    setStatusFilters((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
    handleFilterClose();
  };

  const statusOptions = [
    { value: "Chưa bắt đầu", color: "#757575" },
    { value: "Đang hoạt động", color: "#388E3C" },
    { value: "Hết lượt", color: "#FF8F00" },
    { value: "Hết hạn", color: "#D32F2F" },
    { value: "Bị hủy", color: "#757575" },
  ];

  return (
    <div className="promotions-wrapper">
      {/* Tắt animation của Tooltip để chống rung (tuỳ chọn nhưng khuyến nghị) */}
      <GlobalStyles
        styles={{
          ".MuiTooltip-popper, .MuiTooltip-tooltip, .MuiTooltip-tooltipPlacementTop": {
            transition: "none !important",
            animation: "none !important",
          },
        }}
      />

      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Khuyến Mãi {">"} Danh sách
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
          <Typography variant="h2" fontWeight="bold">
            Khuyến Mãi
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Tìm kiếm mã khuyến mãi"
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
            <IconButton
              onClick={handleFilterClick}
              sx={{ bgcolor: "#fff", borderRadius: "8px", p: 1, "&:hover": { bgcolor: "#f0f0f0" } }}
              className="filter-button"
            >
              <FilterListIcon />
            </IconButton>
            <MuiMenu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              // 🔒 Không portal + tắt transition để không “bay”
              disablePortal
              transitionDuration={0}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              components={{ Popper: StaticPopper }}
              sx={{
                "& .MuiPaper-root": {
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                },
              }}
            >
              {statusOptions.map((option) => (
                <MenuItemMenu
                  key={option.value}
                  onClick={() => handleFilterSelect(option.value)}
                  selected={statusFilters.includes(option.value)}
                  sx={{
                    "&:hover": { bgcolor: "#f0f0f0" },
                    "&.Mui-selected": { bgcolor: "#e0f7fa", "&:hover": { bgcolor: "#b2ebf2" } },
                  }}
                >
                  <Typography variant="body2" sx={{ color: option.color }}>
                    {option.value}
                  </Typography>
                </MenuItemMenu>
              ))}
            </MuiMenu>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
              {statusFilters.length > 0 && (
                <Chip
                  label={`Trạng thái: ${statusFilters.length} đã chọn`}
                  onDelete={() => setStatusFilters([])}
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
              component={Link}
              to="/promotions/add"
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
                "&:hover": { backgroundColor: "#7B1FA2", boxShadow: "0 4px 12px rgba(106, 27, 154, 0.4)" },
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
              <Typography>Đang tải danh sách khuyến mãi...</Typography>
            </div>
          ) : error ? (
            <Typography color="error" className="promotions-error-message">
              {error}
            </Typography>
          ) : filteredPromotions.length === 0 ? (
            <Typography className="promotions-no-data">
              {searchQuery || statusFilters.length > 0 ? "Không tìm thấy mã khuyến mãi phù hợp." : "Không tìm thấy khuyến mãi nào."}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} className="promotions-table-container">
                <Table className="promotions-table" sx={{ width: "100%" }}>
                  <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                    <TableRow>
                      <TableCell>
                        <strong>Mã Khuyến Mãi</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Giá trị giảm</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Ngày bắt đầu</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Ngày kết thúc</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Trạng thái</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Hành động</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {promotions.map((promotion) => {
                      const { status, color } = getPromotionStatus(promotion.status);
                      return (
                        <React.Fragment key={promotion.id}>
                          <TableRow hover>
                            <TableCell sx={{ maxHeight: "60px", overflowY: "auto", whiteSpace: "normal", wordWrap: "break-word" }}>
                              {promotion.code}
                            </TableCell>
                            <TableCell sx={{ maxHeight: "60px", overflowY: "auto", whiteSpace: "normal", wordWrap: "break-word" }}>
                              {formatCurrency(promotion.discount_value, promotion.discount_type)}
                            </TableCell>
                            <TableCell sx={{ maxHeight: "60px", overflowY: "auto", whiteSpace: "normal", wordWrap: "break-word" }}>
                              {formatDate(promotion.start_date)}
                            </TableCell>
                            <TableCell sx={{ maxHeight: "60px", overflowY: "auto", whiteSpace: "normal", wordWrap: "break-word" }}>
                              {formatDate(promotion.end_date)}
                            </TableCell>
                            <TableCell sx={{ maxHeight: "60px", overflowY: "auto", whiteSpace: "normal", wordWrap: "break-word" }}>
                              <span style={{ color, fontWeight: "bold" }}>{status}</span>
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" justifyContent="center" gap={1}>
                                <IconButton
                                  title="Xem chi tiết"
                                  sx={{
                                    color: "#1976d2",
                                    bgcolor: "#e3f2fd",
                                    "&:hover": { bgcolor: "#bbdefb", boxShadow: "0 2px 6px rgba(25, 118, 210, 0.4)" },
                                    transition: "all 0.2s ease-in-out",
                                  }}
                                  onClick={() => handleViewDetail(promotion.id)}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  title="Sửa"
                                  sx={{
                                    color: "#FACC15",
                                    bgcolor: "#fef9c3",
                                    "&:hover": { bgcolor: "#fff9c4", boxShadow: "0 2px 6px rgba(250, 204, 21, 0.4)" },
                                    transition: "all 0.2s ease-in-out",
                                  }}
                                  onClick={() => handleEditDetail(promotion)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  title="Xóa"
                                  sx={{
                                    color: "#d32f2f",
                                    bgcolor: "#ffebee",
                                    "&:hover": { bgcolor: "#ffcdd2", boxShadow: "0 2px 6px rgba(211, 47, 47, 0.4)" },
                                    transition: "all 0.2s ease-in-out",
                                  }}
                                  onClick={() => handleDelete(promotion.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell colSpan={6} style={{ padding: 0 }}>
                              <Collapse in={viewDetailId === promotion.id} timeout="auto" unmountOnExit>
                                <Box sx={{ width: "100%", bgcolor: "#f9f9f9", px: 3, py: 2, borderTop: "1px solid #ddd" }}>
                                  <div className="promotions-detail-container">
                                    <h3>Thông tin khuyến mãi</h3>
                                    {editingDetailId === promotion.id && editedDetail ? (
                                      <>
                                        <Box display="flex" flexDirection="column" gap={2}>
                                          <Box display="flex" gap={2}>
                                            <TextField
                                              label="Mã khuyến mãi"
                                              name="code"
                                              value={editedDetail.code || ""}
                                              onChange={handleChangeDetail}
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!validationErrors.code}
                                              helperText={validationErrors.code}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": { borderColor: "#ccc" },
                                                  "&:hover fieldset": { borderColor: "#888" },
                                                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                                                },
                                                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                                                "& label.Mui-focused": { color: "#1976d2" },
                                              }}
                                            />
                                            <TextField
                                              label="Mô tả"
                                              name="description"
                                              value={editedDetail.description || ""}
                                              onChange={handleChangeDetail}
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!validationErrors.description}
                                              helperText={validationErrors.description}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": { borderColor: "#ccc" },
                                                  "&:hover fieldset": { borderColor: "#888" },
                                                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                                                },
                                                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                                                "& label.Mui-focused": { color: "#1976d2" },
                                              }}
                                            />
                                          </Box>

                                          <Box display="flex" gap={2}>
                                            <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.discount_type}>
                                              <InputLabel>Loại giảm giá</InputLabel>
                                              <Select
                                                name="discount_type"
                                                value={editedDetail.discount_type || "amount"}
                                                onChange={handleSelectChange}
                                                label="Loại giảm giá"
                                                // 🔒 Không portal cho menu Select
                                                MenuProps={{
                                                  disablePortal: true,
                                                  transitionDuration: 0,
                                                  components: { Popper: StaticPopper },
                                                  PaperProps: { sx: { maxHeight: 300 } },
                                                }}
                                              >
                                                <MenuItem value="percent">Phần trăm (%)</MenuItem>
                                                <MenuItem value="amount">Số tiền (VNĐ)</MenuItem>
                                              </Select>
                                              {validationErrors.discount_type && (
                                                <Typography color="error" variant="caption">
                                                  {validationErrors.discount_type}
                                                </Typography>
                                              )}
                                            </FormControl>

                                            <TextField
                                              label="Giá trị giảm"
                                              name="discount_value"
                                              type="number"
                                              value={editedDetail.discount_value ?? ""}
                                              onChange={handleChangeDetail}
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!validationErrors.discount_value}
                                              helperText={validationErrors.discount_value}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": { borderColor: "#ccc" },
                                                  "&:hover fieldset": { borderColor: "#888" },
                                                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                                                },
                                                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                                                "& label.Mui-focused": { color: "#1976d2" },
                                              }}
                                            />
                                          </Box>

                                          <Box display="flex" gap={2}>
                                            <TextField
                                              label="Ngày bắt đầu"
                                              name="start_date"
                                              type="date"
                                              value={editedDetail.start_date || ""}
                                              onChange={handleChangeDetail}
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              InputLabelProps={{ shrink: true }}
                                              error={!!validationErrors.start_date}
                                              helperText={validationErrors.start_date}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": { borderColor: "#ccc" },
                                                  "&:hover fieldset": { borderColor: "#888" },
                                                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                                                },
                                                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                                                "& label.Mui-focused": { color: "#1976d2" },
                                              }}
                                            />
                                            <TextField
                                              label="Ngày kết thúc"
                                              name="end_date"
                                              type="date"
                                              value={editedDetail.end_date || ""}
                                              onChange={handleChangeDetail}
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              InputLabelProps={{ shrink: true }}
                                              error={!!validationErrors.end_date}
                                              helperText={validationErrors.end_date}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": { borderColor: "#ccc" },
                                                  "&:hover fieldset": { borderColor: "#888" },
                                                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                                                },
                                                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                                                "& label.Mui-focused": { color: "#1976d2" },
                                              }}
                                            />
                                          </Box>

                                          <Box display="flex" gap={2}>
                                            <TextField
                                              label="Giới hạn số lần dùng"
                                              name="usage_limit"
                                              type="number"
                                              value={editedDetail.usage_limit ?? ""}
                                              onChange={handleChangeDetail}
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              error={!!validationErrors.usage_limit}
                                              helperText={validationErrors.usage_limit}
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": { borderColor: "#ccc" },
                                                  "&:hover fieldset": { borderColor: "#888" },
                                                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                                                },
                                                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                                                "& label.Mui-focused": { color: "#1976d2" },
                                              }}
                                            />
                                            <TextField
                                              label="Số lần đã dùng"
                                              name="used_count"
                                              type="number"
                                              value={editedDetail.used_count ?? ""}
                                              fullWidth
                                              variant="outlined"
                                              size="small"
                                              disabled
                                              helperText="Không thể chỉnh sửa số lần đã dùng"
                                              sx={{
                                                "& .MuiOutlinedInput-root": {
                                                  "& fieldset": { borderColor: "#ccc" },
                                                  "&:hover fieldset": { borderColor: "#888" },
                                                  "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" },
                                                },
                                                "& label": { backgroundColor: "#fff", padding: "0 4px" },
                                              }}
                                            />
                                          </Box>
                                        </Box>

                                        <Box pb={2} mt={2} display="flex" gap={2}>
                                          <Button variant="contained" color="primary" className="promotions-btn-save" onClick={handleSaveDetail} disabled={loading}>
                                            {loading ? <CircularProgress size={24} /> : "Lưu"}
                                          </Button>
                                          <Button variant="outlined" className="promotions-btn-cancel" color="secondary" onClick={handleCancelEdit} disabled={loading}>
                                            Hủy
                                          </Button>
                                        </Box>
                                        {error && <Typography color="error" mt={1}>{error}</Typography>}
                                      </>
                                    ) : (
                                      <>
                                        <Table className="promotions-detail-table">
                                          <TableBody>
                                            <TableRow>
                                              <TableCell>
                                                <strong>Mã khuyến mãi:</strong> {promotion.code}
                                              </TableCell>
                                              <TableCell>
                                                <strong>Mô tả:</strong> {promotion.description}
                                              </TableCell>
                                            </TableRow>
                                            <TableRow>
                                              <TableCell>
                                                <strong>Loại giảm giá:</strong> {promotion.discount_type === "percent" ? "Phần trăm" : "Số tiền"}
                                              </TableCell>
                                              <TableCell>
                                                <strong>Giá trị giảm:</strong> {formatCurrency(promotion.discount_value, promotion.discount_type)}
                                              </TableCell>
                                            </TableRow>
                                            <TableRow>
                                              <TableCell>
                                                <strong>Ngày bắt đầu:</strong> {formatDate(promotion.start_date)}
                                              </TableCell>
                                              <TableCell>
                                                <strong>Ngày kết thúc:</strong> {formatDate(promotion.end_date)}
                                              </TableCell>
                                            </TableRow>
                                            <TableRow>
                                              <TableCell>
                                                <strong>Giới hạn số lần:</strong> {promotion.usage_limit}
                                              </TableCell>
                                              <TableCell>
                                                <strong>Số lần sử dụng:</strong> {promotion.used_count}
                                              </TableCell>
                                            </TableRow>
                                            <TableRow>
                                              <TableCell colSpan={2}>
                                                <strong>Trạng thái:</strong>{" "}
                                                <span style={{ color, fontWeight: "bold" }}>{getPromotionStatus(promotion.status).status}</span>
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      </>
                                    )}
                                  </div>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
                <Pagination count={lastPage} page={currentPage} onChange={handlePageChange} color="primary" shape="rounded" showFirstButton showLastButton />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{ "& .MuiDialog-paper": { borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)" } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Xác nhận xóa khuyến mãi</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa hoặc hủy mã khuyến mãi này không? Hành động này không thể hoàn tác.</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            className="promotions-btn-cancel"
            sx={{ color: "#d32f2f", borderColor: "#d32f2f", "&:hover": { borderColor: "#b71c1c", backgroundColor: "#ffebee" } }}
          >
            Hủy
          </Button>
          <Button onClick={confirmDelete} variant="contained" sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Promotions;
