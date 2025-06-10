import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, parseISO } from 'date-fns';
import numeral from 'numeral';
import api from '../../api/axios';
import '../../css/Promotion.css'; // Đổi sang Promotion.css
import { JSX } from 'react/jsx-runtime';
import { Link } from 'react-router-dom';

type DiscountType = 'percent' | 'amount';

interface Promotion {
  id: number;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  bookings?: {
    id: number;
    promotion_id: number;
    created_by: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
    deposit_amount: string;
    raw_total: string;
    discount_amount: string;
    total_amount: string;
  }[];
}

interface ValidationErrors {
  code?: string;
  description?: string;
  discount_type?: string;
  discount_value?: string;
  start_date?: string;
  end_date?: string;
  usage_limit?: string;
  used_count?: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const formatCurrency = (value: number | null, discountType: DiscountType): string => {
  if (value === null || value === undefined) return 'N/A';
  if (discountType === 'percent') return `${value}%`;
  return numeral(value).format('0,0') + ' VNĐ';
};

const formatDate = (date: string): JSX.Element => {
  try {
    const parsedDate = parseISO(date);
    return (
      <Tooltip title={format(parsedDate, 'dd/MM/yyyy HH:mm:ss')}>
        <span>{format(parsedDate, 'dd/MM/yyyy')}</span>
      </Tooltip>
    );
  } catch {
    return <span>N/A</span>;
  }
};

const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editedDetail, setEditedDetail] = useState<Partial<Promotion>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [promotionToDelete, setPromotionToDelete] = useState<number | null>(null);

  const fetchAllPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      let allData: Promotion[] = [];
      let page = 1;

      while (true) {
        const response = await api.get('/promotions', { params: { page } });
        if (response.status === 200) {
          const data: { data: Promotion[]; meta: Meta } = response.data;
          const sanitizedData = data.data.map((item) => ({
            ...item,
            discount_type: item.discount_type === 'percent' || item.discount_type === 'amount' ? item.discount_type : 'amount',
            is_active: !!item.is_active,
            usage_limit: item.usage_limit === null ? null : Number(item.usage_limit),
            used_count: Number(item.used_count),
            bookings: item.bookings
              ? item.bookings.map((booking) => ({
                  id: Number(booking.id) || 0,
                  promotion_id: Number(booking.promotion_id) || 0,
                  created_by: booking.created_by || 'Không xác định',
                  check_in_date: booking.check_in_date || 'Không xác định',
                  check_out_date: booking.check_out_date || 'Không xác định',
                  status: booking.status || 'Không xác định',
                  deposit_amount: booking.deposit_amount || '0',
                  raw_total: booking.raw_total || '0',
                  discount_amount: booking.discount_amount || '0',
                  total_amount: booking.total_amount || '0',
                }))
              : [],
          }));
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
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      console.error('Lỗi khi tải danh sách khuyến mãi:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPromotions();
  }, []);

  useEffect(() => {
    let filtered = [...allPromotions];

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((prev) =>
        prev.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'Tất cả') {
      filtered = filtered.filter((prev) => {
        const { status } = getPromotionStatus(
          prev.is_active,
          prev.start_date,
          prev.end_date,
          prev.used_count,
          prev.usage_limit
        );
        return status === statusFilter;
      });
    }

    setFilteredPromotions(filtered);
    setLastPage(Math.ceil(filtered.length / 10));
    setPromotions(filtered.slice((currentPage - 1) * 10, currentPage * 10));
  }, [searchQuery, statusFilter, allPromotions, currentPage]);

  const getPromotionStatus = (
    isActive: boolean,
    startDate: string,
    endDate: string,
    usedCount: number,
    usageLimit: number | null
  ): { status: string; color: string } => {
    const today = new Date().toISOString().split('T')[0];
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];

    if (!isActive) return { status: 'Bị tắt', color: '#757575' };
    if (start > today) return { status: 'Chưa bắt đầu', color: '#757575' };
    if (start <= today && today <= end) {
      if (usageLimit !== null && usedCount >= usageLimit) {
        return { status: 'Hết lượt', color: '#FF8F00' };
      }
      return { status: 'Đang hoạt động', color: '#388E3C' };
    }
    if (today > end) return { status: 'Hết hạn', color: '#D32F2F' };
    return { status: 'Không xác định', color: '#757575' };
  };

  const validateForm = (data: Partial<Promotion>): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code?.trim()) errors.code = 'Mã CTKM không được để trống';
    else if (data.code && data.code.length > 20) errors.code = 'Mã CTKM không được vượt quá 20 ký tự';
    if (!data.description?.trim()) errors.description = 'Mô tả không được để trống';
    else if (data.description && data.description.length > 200) errors.description = 'Mô tả không được vượt quá 200 ký tự';
    if (!data.discount_type) errors.discount_type = 'Vui lòng chọn loại giảm';
    if (data.discount_value === undefined || data.discount_value <= 0) errors.discount_value = 'Giá trị giảm phải lớn hơn 0';
    else if (data.discount_type === 'percent' && data.discount_value > 100) {
      errors.discount_value = 'Giá trị giảm không được vượt quá 100%';
    }
    if (!data.start_date) errors.start_date = 'Ngày bắt đầu không được để trống';
    if (!data.end_date) errors.end_date = 'Ngày kết thúc không được để trống';
    else if (data.start_date && data.end_date && data.start_date > data.end_date) {
      errors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (data.usage_limit !== undefined && data.usage_limit !== null && data.usage_limit < 0) errors.usage_limit = 'Giới hạn số lần dùng không được âm';
    if (data.used_count !== undefined && data.used_count < 0) errors.used_count = 'Số lần đã dùng không được âm';
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

  const handleEditDetail = (promotion: Promotion) => {
    setViewDetailId(promotion.id);
    setEditingDetailId(promotion.id);
    setEditedDetail({
      id: promotion.id,
      code: promotion.code,
      description: promotion.description,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      usage_limit: promotion.usage_limit,
      used_count: promotion.used_count,
      is_active: promotion.is_active,
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
      return;
    }

    try {
      setLoading(true);
      const payload = {
        code: editedDetail.code?.trim() ?? '',
        description: editedDetail.description?.trim() ?? '',
        discount_type: editedDetail.discount_type ?? 'amount',
        discount_value: editedDetail.discount_value != null ? Number(editedDetail.discount_value) : 0,
        start_date: editedDetail.start_date ?? '',
        end_date: editedDetail.end_date ?? '',
        usage_limit: editedDetail.usage_limit !== undefined ? editedDetail.usage_limit : null,
        used_count: editedDetail.used_count != null ? Number(editedDetail.used_count) : 0,
        is_active: !!editedDetail.is_active,
      };

      const response = await api.put(`/promotions/${editedDetail.id}`, payload);
      if (response.status === 200) {
        await fetchAllPromotions();
        setEditingDetailId(null);
        setViewDetailId(null);
        setValidationErrors({});
        setSnackbarMessage('Mã khuyến mãi đã được cập nhật thành công!');
        setSnackbarOpen(true);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật khuyến mãi';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error('Lỗi khi cập nhật khuyến mãi:', errorMessage);
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
      if (!promotion) {
        throw new Error('Không tìm thấy mã khuyến mãi để xóa');
      }

      if (promotion.usage_limit !== null && promotion.used_count > 0) {
        const updatedPromotion = { ...promotion, is_active: false };
        const updateResponse = await api.put(`/promotions/${promotionToDelete}`, updatedPromotion);
        if (updateResponse.status !== 200) {
          throw new Error('Không thể ẩn mã giảm giá do lỗi từ phía server');
        }
        setSnackbarMessage('Mã giảm giá đã được tắt vì đã được sử dụng ít nhất 1 lần!');
      } else {
        const deleteResponse = await api.delete(`/promotions/${promotionToDelete}`);
        if (deleteResponse.status !== 200 && deleteResponse.status !== 204) {
          throw new Error('Không thể xóa mã giảm giá do lỗi từ phía server');
        }
        setSnackbarMessage('Mã giảm giá đã được xóa thành công vì chưa được sử dụng!');
      }

      await fetchAllPromotions();
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa khuyến mãi';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      console.error('Lỗi khi xóa khuyến mãi:', errorMessage);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setPromotionToDelete(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    setPromotions(filteredPromotions.slice((page - 1) * 10, page * 10));
  };

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Danh Sách <b>Khuyến Mãi</b>
          </h2>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm mã khuyến mãi"
              className="promotion-search-input"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: '300px' }}
            />
            <FormControl sx={{ width: '200px' }} variant="outlined" size="small">
              <InputLabel>Lọc theo trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as string)}
                label="Lọc theo trạng thái"
              >
                <MenuItem value="Tất cả">Tất cả</MenuItem>
                <MenuItem value="Chưa bắt đầu">Chưa bắt đầu</MenuItem>
                <MenuItem value="Đang hoạt động">Đang hoạt động</MenuItem>
                <MenuItem value="Hết lượt">Hết lượt</MenuItem>
                <MenuItem value="Hết hạn">Hết hạn</MenuItem>
                <MenuItem value="Bị tắt">Bị tắt</MenuItem>
              </Select>
            </FormControl>
            <Link
              className="promotion-btn-add"
              to="/promotions/add"
            >
              Thêm mới
            </Link>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="promotion-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách khuyến mãi...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="promotion-error-message">
          {error}
        </Typography>
      ) : filteredPromotions.length === 0 ? (
        <Typography className="promotion-no-data">
          {searchQuery || statusFilter !== 'Tất cả'
            ? 'Không tìm thấy mã khuyến mãi phù hợp.'
            : 'Không tìm thấy khuyến mãi nào.'}
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} className="promotion-table-container">
            <Table className="promotion-table">
              <TableHead>
                <TableRow>
                  <TableCell>Mã Khuyến Mãi</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Giá trị giảm</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promotions.map((promotion) => {
                  const { status, color } = getPromotionStatus(
                    promotion.is_active,
                    promotion.start_date,
                    promotion.end_date,
                    promotion.used_count,
                    promotion.usage_limit
                  );
                  return (
                    <React.Fragment key={promotion.id}>
                      <TableRow sx={{ opacity: promotion.is_active ? 1 : 0.5 }}>
                        <TableCell>{promotion.code}</TableCell>
                        <TableCell>{promotion.description}</TableCell>
                        <TableCell>{formatCurrency(promotion.discount_value, promotion.discount_type)}</TableCell>
                        <TableCell sx={{ color, fontWeight: 'bold' }}>
                          {status}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            className="promotion-action-view"
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(promotion.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            className="promotion-action-edit"
                            title="Sửa"
                            onClick={() => handleEditDetail(promotion)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            className="promotion-action-delete"
                            title="Xóa"
                            onClick={() => handleDelete(promotion.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} style={{ padding: 0 }}>
                          <Collapse in={viewDetailId === promotion.id}>
                            <div className="promotion-detail-container">
                              <h3>Thông tin khuyến mãi</h3>
                              {editingDetailId === promotion.id && editedDetail ? (
                                <>
                                  <Box display="flex" flexDirection="column" gap={2}>
                                    <Box display="flex" gap={2}>
                                      <TextField
                                        label="Mã khuyến mãi"
                                        name="code"
                                        value={editedDetail.code || ''}
                                        onChange={handleChangeDetail}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        error={!!validationErrors.code}
                                        helperText={validationErrors.code}
                                      />
                                      <TextField
                                        label="Mô tả"
                                        name="description"
                                        value={editedDetail.description || ''}
                                        onChange={handleChangeDetail}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        error={!!validationErrors.description}
                                        helperText={validationErrors.description}
                                      />
                                    </Box>
                                    <Box display="flex" gap={2}>
                                      <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.discount_type}>
                                        <InputLabel>Loại giảm</InputLabel>
                                        <Select
                                          name="discount_type"
                                          value={editedDetail.discount_type || 'amount'}
                                          onChange={handleSelectChange}
                                          label="Loại giảm"
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
                                        value={editedDetail.discount_value ?? ''}
                                        onChange={handleChangeDetail}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        error={!!validationErrors.discount_value}
                                        helperText={validationErrors.discount_value}
                                      />
                                    </Box>
                                    <Box display="flex" gap={2}>
                                      <TextField
                                        label="Ngày bắt đầu"
                                        name="start_date"
                                        type="date"
                                        value={editedDetail.start_date || ''}
                                        onChange={handleChangeDetail}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!validationErrors.start_date}
                                        helperText={validationErrors.start_date}
                                      />
                                      <TextField
                                        label="Ngày kết thúc"
                                        name="end_date"
                                        type="date"
                                        value={editedDetail.end_date || ''}
                                        onChange={handleChangeDetail}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!validationErrors.end_date}
                                        helperText={validationErrors.end_date}
                                      />
                                    </Box>
                                    <Box display="flex" gap={2}>
                                      <TextField
                                        label="Giới hạn số lần dùng"
                                        name="usage_limit"
                                        type="number"
                                        value={editedDetail.usage_limit ?? ''}
                                        onChange={handleChangeDetail}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        error={!!validationErrors.usage_limit}
                                        helperText={validationErrors.usage_limit || 'Để trống nếu không giới hạn'}
                                      />
                                      <TextField
                                        label="Số lần đã dùng"
                                        name="used_count"
                                        type="number"
                                        value={editedDetail.used_count ?? ''}
                                        onChange={handleChangeDetail}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        error={!!validationErrors.used_count}
                                        helperText={validationErrors.used_count}
                                      />
                                    </Box>
                                    <Box display="flex" gap={2}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={!!editedDetail.is_active}
                                            onChange={(e) => handleChangeDetail({ target: { name: 'is_active', value: e.target.checked } } as never)}
                                            color="default"
                                          />
                                        }
                                        label="Kích hoạt"
                                      />
                                    </Box>
                                  </Box>
                                  <Box mt={2} display="flex" gap={2}>
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      onClick={handleSaveDetail}
                                      disabled={loading}
                                    >
                                      Lưu
                                    </Button>
                                    <Button
                                      variant="outlined"
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
                                <>
                                  <Table className="promotion-detail-table">
                                    <TableBody>
                                      <TableRow>
                                        <TableCell><strong>Mã CTKM:</strong> {promotion.code}</TableCell>
                                        <TableCell><strong>Mô tả:</strong> {promotion.description}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell><strong>Loại giảm:</strong> {promotion.discount_type === 'percent' ? 'Phần trăm' : 'Số tiền'}</TableCell>
                                        <TableCell><strong>Giá trị giảm:</strong> {formatCurrency(promotion.discount_value, promotion.discount_type)}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell><strong>Ngày bắt đầu:</strong> {formatDate(promotion.start_date)}</TableCell>
                                        <TableCell><strong>Ngày kết thúc:</strong> {formatDate(promotion.end_date)}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell><strong>Giới hạn số lần:</strong> {promotion.usage_limit ?? 'Không giới hạn'}</TableCell>
                                        <TableCell><strong>Số lần sử dụng:</strong> {promotion.used_count}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell colSpan={2}>
                                          <strong>Trạng thái:</strong>{' '}
                                          <span style={{ color, fontWeight: 'bold' }}>{status}</span>
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </>
                              )}
                              <h3>Đặt phòng</h3>
                              {promotion.bookings && promotion.bookings.length > 0 ? (
                                <Table className="promotion-detail-table">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Mã Đặt Phòng</TableCell>
                                      <TableCell>Người Tạo</TableCell>
                                      <TableCell>Ngày Nhận Phòng</TableCell>
                                      <TableCell>Ngày Trả Phòng</TableCell>
                                      <TableCell>Trạng Thái</TableCell>
                                      <TableCell>Đặt Cọc</TableCell>
                                      <TableCell>Tổng Gốc</TableCell>
                                      <TableCell>Tổng Giảm Giá</TableCell>
                                      <TableCell>Tổng Cuối</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {promotion.bookings.map((booking) => (
                                      <TableRow key={booking.id}>
                                        <TableCell>{booking.id || 'Không xác định'}</TableCell>
                                        <TableCell>{booking.created_by || 'Không xác định'}</TableCell>
                                        <TableCell>{booking.check_in_date || 'Không xác định'}</TableCell>
                                        <TableCell>{booking.check_out_date || 'Không xác định'}</TableCell>
                                        <TableCell>{booking.status || 'Không xác định'}</TableCell>
                                        <TableCell>{booking.deposit_amount || '0'}</TableCell>
                                        <TableCell>{booking.raw_total || '0'}</TableCell>
                                        <TableCell>{booking.discount_amount || '0'}</TableCell>
                                        <TableCell>{booking.total_amount || '0'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Typography>Không có thông tin đặt phòng.</Typography>
                              )}
                            </div>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Pagination
              count={lastPage}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        classes={{ paper: 'promotion-dialog' }}
      >
        <DialogTitle>Xác nhận xóa khuyến mãi</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa hoặc tắt mã khuyến mãi này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes('thành công') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Promotions;
