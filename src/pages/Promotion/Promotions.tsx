import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Tooltip,
  Box,
  TextField,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Pagination,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/axios';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

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
      filtered = filtered.filter((promotion) =>
        promotion.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'Tất cả') {
      filtered = filtered.filter((promotion) => {
        const { status } = getPromotionStatus(
          promotion.is_active,
          promotion.start_date,
          promotion.end_date,
          promotion.used_count,
          promotion.usage_limit
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
    setViewDetailId((prev) => (prev === id ? null : id));
    setEditingDetailId(null);
    setValidationErrors({});
  };

  const handleEditDetail = (promotion: Promotion) => {
    setEditingDetailId(promotion.id);
    setEditedDetail({
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

  const handleChangeDetail = (field: keyof Promotion, value: string | number | boolean) => {
  setEditedDetail((prev) => ({ ...prev, [field]: value }));

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as keyof typeof prev];
      return newErrors;
    });
  };



  const handleSaveDetail = async (id: number) => {
  try {
    setLoading(true);
    setValidationErrors({});

    const errors = validateForm(editedDetail);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
      }

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

          const response = await api.put(`/promotions/${id}`, payload);
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
          console.error('Lỗi khi cập nhật khuyến mãi:', errorMessage);
        } finally {
          setLoading(false);
        }
      };


  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa mã khuyến mãi này?');
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      const promotionToDelete = promotions.find((p) => p.id === id);
      if (!promotionToDelete) {
        throw new Error('Không tìm thấy mã khuyến mãi để xóa');
      }

      if (promotionToDelete.usage_limit !== null && promotionToDelete.used_count > 0) {
        const updatedPromotion = { ...promotionToDelete, is_active: false };
        const updateResponse = await api.put(`/promotions/${id}`, updatedPromotion);
        if (updateResponse.status !== 200) {
          throw new Error('Không thể ẩn mã giảm giá do lỗi từ phía server');
        }
        setSnackbarMessage('Mã giảm giá đã được Tắt vì đã được sử dụng ít nhất 1 lần!');
      } else {
        const deleteResponse = await api.delete(`/promotions/${id}`);
        if (deleteResponse.status !== 200 && deleteResponse.status !== 204) {
          throw new Error('Không thể xóa mã giảm giá do lỗi từ phía server');
        }
        setSnackbarMessage('Mã giảm giá đã được xóa thành công vì chưa được sử dụng!');
      }

      await fetchAllPromotions();
      setDeleteDialogOpen(null);
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa khuyến mãi';
      setError(errorMessage);
      console.error('Lỗi khi xóa khuyến mãi:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(null);
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
    <div>
      <Typography variant="h5" mb={2}>
        Promotion <b>Details</b>
      </Typography>
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          label="Tìm kiếm mã khuyến mãi"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: '300px' }}
        />
        <FormControl sx={{ width: '200px' }}>
          <InputLabel>Lọc theo trạng thái</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Lọc theo trạng thái"
            size="small"
          >
            <MenuItem value="Tất cả">Tất cả</MenuItem>
            <MenuItem value="Chưa bắt đầu">Chưa bắt đầu</MenuItem>
            <MenuItem value="Đang hoạt động">Đang hoạt động</MenuItem>
            <MenuItem value="Hết lượt">Hết lượt</MenuItem>
            <MenuItem value="Hết hạn">Hết hạn</MenuItem>
            <MenuItem value="Bị tắt">Bị tắt</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/promotions/add"
        >
          Thêm khuyến mãi mới
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center">
          <CircularProgress />
          <Typography>Đang tải dữ liệu...</Typography>
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredPromotions.length === 0 ? (
        <Typography>
          {searchQuery || statusFilter !== 'Tất cả'
            ? 'Không tìm thấy mã khuyến mãi phù hợp.'
            : 'Không tìm thấy khuyến mãi nào.'}
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
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
                        <TableCell>
                          {promotion.discount_value} {promotion.discount_type === 'percent' ? '%' : 'VNĐ'}
                        </TableCell>
                        <TableCell sx={{ color, fontWeight: 'bold' }}>
                          {status}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Chi tiết khuyến mãi">
                            <IconButton onClick={() => handleViewDetail(promotion.id)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton onClick={() => handleDelete(promotion.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {viewDetailId === promotion.id && (
                        <TableRow>
                          <TableCell colSpan={5} style={{ padding: 0 }}>
                            <Collapse in={true}>
                              <Box p={2}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                  Thông tin khuyến mãi
                                </Typography>
                                {editingDetailId === promotion.id ? (
                                  <>
                                    {error && (
                                      <Typography color="error" variant="caption">
                                        {error}
                                      </Typography>
                                    )}
                                    {[
                                      'code',
                                      'description',
                                      'discount_type',
                                      'discount_value',
                                      'start_date',
                                      'end_date',
                                      'usage_limit',
                                      'used_count',
                                      'is_active',
                                    ].map((field) => {
                                      if (field === 'discount_type') {
                                        return (
                                          <FormControl
                                            fullWidth
                                            margin="normal"
                                            key={field}
                                            error={!!validationErrors.discount_type}
                                          >
                                            <InputLabel>Loại giảm</InputLabel>
                                            <Select
                                              value={editedDetail.discount_type || 'amount'}
                                              onChange={(e) =>
                                                handleChangeDetail('discount_type', e.target.value as DiscountType)
                                              }
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
                                        );
                                      }
                                      if (field === 'start_date' || field === 'end_date') {
                                        return (
                                          <TextField
                                            key={field}
                                            label={field === 'start_date' ? 'Ngày bắt đầu' : 'Ngày kết thúc'}
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            InputLabelProps={{ shrink: true }}
                                            value={editedDetail[field as keyof Promotion] || ''}
                                            onChange={(e) =>
                                              handleChangeDetail(field as keyof Promotion, e.target.value)
                                            }
                                            error={!!validationErrors[field as keyof ValidationErrors]}
                                            helperText={validationErrors[field as keyof ValidationErrors] || ''}
                                          />
                                        );
                                      }
                                      if (field === 'is_active') {
                                        return (
                                          <FormControlLabel
                                            key={field}
                                            control={
                                              <Switch
                                                checked={!!editedDetail.is_active}
                                                onChange={(e) =>
                                                  handleChangeDetail('is_active', e.target.checked)
                                                }
                                                color="primary"
                                              />
                                            }
                                            label={
                                              <Typography
                                                sx={{
                                                  color: getPromotionStatus(
                                                    !!editedDetail.is_active,
                                                    editedDetail.start_date || promotion.start_date,
                                                    editedDetail.end_date || promotion.end_date,
                                                    editedDetail.used_count ?? promotion.used_count,
                                                    editedDetail.usage_limit ?? promotion.usage_limit
                                                  ).color,
                                                }}
                                              >
                                                {getPromotionStatus(
                                                  !!editedDetail.is_active,
                                                  editedDetail.start_date || promotion.start_date,
                                                  editedDetail.end_date || promotion.end_date,
                                                  editedDetail.used_count ?? promotion.used_count,
                                                  editedDetail.usage_limit ?? promotion.usage_limit
                                                ).status}
                                              </Typography>
                                            }
                                            sx={{ mt: 2 }}
                                          />
                                        );
                                      }
                                      return (
                                        <TextField
                                          key={field}
                                          label={
                                            field === 'code' ? 'Mã khuyến mãi' :
                                            field === 'description' ? 'Mô tả' :
                                            field === 'discount_value' ? 'Giá trị giảm' :
                                            field === 'usage_limit' ? 'Giới hạn số lần dùng' :
                                            field === 'used_count' ? 'Số lần đã dùng' :
                                            field
                                          }
                                          fullWidth
                                          margin="normal"
                                          type={['discount_value', 'usage_limit', 'used_count'].includes(field) ? 'number' : 'text'}
                                          value={editedDetail[field as keyof Promotion] ?? ''}
                                          onChange={(e) =>
                                            handleChangeDetail(
                                              field as keyof Promotion,
                                              ['discount_value', 'usage_limit', 'used_count'].includes(field)
                                                ? Number(e.target.value)
                                                : e.target.value
                                            )
                                          }
                                          error={!!validationErrors[field as keyof ValidationErrors]}
                                          helperText={validationErrors[field as keyof ValidationErrors] || ''}
                                        />
                                      );
                                    })}
                                    <Box mt={2}>
                                      <Button
                                        variant="contained"
                                        onClick={() => handleSaveDetail(promotion.id)}
                                        disabled={loading}
                                      >
                                        {loading ? <CircularProgress size={24} /> : 'Lưu'}
                                      </Button>
                                      <Button
                                        sx={{ ml: 1 }}
                                        variant="outlined"
                                        onClick={() => {
                                          setEditingDetailId(null);
                                          setViewDetailId(null);
                                          setValidationErrors({});
                                        }}
                                        disabled={loading}
                                      >
                                        Hủy
                                      </Button>
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <Box display="flex" flexWrap="wrap" rowGap={1} columnGap={4} mt={2}>
                                      <Box width="45%">
                                        <Typography><strong>Mã CTKM:</strong> {promotion.code}</Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography><strong>Mô tả:</strong> {promotion.description}</Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Loại giảm:</strong>{' '}
                                          {promotion.discount_type === 'percent' ? 'Phần trăm' : 'Số tiền'}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Giá trị giảm:</strong>{' '}
                                          {promotion.discount_value} {promotion.discount_type === 'percent' ? '%' : 'VNĐ'}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography><strong>Ngày bắt đầu:</strong> {promotion.start_date}</Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography><strong>Ngày kết thúc:</strong> {promotion.end_date}</Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Giới hạn số lần:</strong>{' '}
                                          {promotion.usage_limit ?? 'Không giới hạn'}
                                        </Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography><strong>Số lần đã dùng:</strong> {promotion.used_count}</Typography>
                                      </Box>
                                      <Box width="45%">
                                        <Typography>
                                          <strong>Trạng thái:</strong>{' '}
                                          <Typography component="span" sx={{ color, fontWeight: 'bold' }}>
                                            {status}
                                          </Typography>
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Box mt={2}>
                                      <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEditDetail(promotion)}
                                        sx={{ color: 'black', borderColor: 'black' }}
                                      >
                                        Chỉnh sửa thông tin
                                      </Button>
                                    </Box>
                                  </>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
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

      <Dialog open={deleteDialogOpen !== null} onClose={handleDeleteCancel}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa mã khuyến mãi này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Hủy
          </Button>
          <Button
            onClick={() => handleDelete(deleteDialogOpen!)}
            color="error"
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Promotions;