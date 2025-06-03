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
  Collapse,
  TextField,
  Box,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';
import '../../css/Promotion.css';
import api from '../../api/axios';

// Định nghĩa kiểu DiscountType
type DiscountType = 'percent' | 'amount';

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

const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả'); // Bộ lọc trạng thái
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  const [editPromotionId, setEditPromotionId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Promotion | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  // Hàm lấy danh sách khuyến mãi từ API
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/promotions');
      if (response.status === 200) {
        const data: Promotion[] = Array.isArray(response.data) ? response.data : response.data.promotions || [];
        const sanitizedData = data.map((item) => ({
          ...item,
          discount_type: item.discount_type === 'percent' || item.discount_type === 'amount' ? item.discount_type : 'amount',
          is_active: !!item.is_active, // Chuyển đổi an toàn sang boolean
        }));
        setPromotions(sanitizedData);
        setFilteredPromotions(sanitizedData);
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      console.error('Lỗi khi tải danh sách khuyến mãi:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Lọc danh sách khuyến mãi dựa trên mã khuyến mãi và trạng thái
  useEffect(() => {
    let filtered = promotions;

    // Lọc theo mã khuyến mãi
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((promotion) =>
        promotion.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Lọc theo trạng thái
    if (statusFilter !== 'Tất cả') {
      filtered = filtered.filter((promotion) => {
        const { status } = getPromotionStatus(promotion.is_active, promotion.start_date, promotion.end_date);
        return status === statusFilter;
      });
    }

    setFilteredPromotions(filtered);
  }, [searchQuery, statusFilter, promotions]);

  // Hàm tính trạng thái khuyến mãi và trả về màu sắc tương ứng
  const getPromotionStatus = (isActive: boolean, startDate: string, endDate: string): { status: string; color: string } => {
    const today = new Date().toISOString().split('T')[0]; // Sử dụng ngày hiện tại (2025-06-03)
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];

    // Chưa kích hoạt: Chưa đến ngày bắt đầu hoặc chưa được bật
    if (!isActive || start > today) {
      return { status: 'Chưa kích hoạt', color: '#757575' }; // Màu xám
    }
    // Đang hoạt động: Đã bắt đầu, còn hiệu lực, và đã bật
    else if (isActive && start <= today && end >= today) {
      return { status: 'Đang hoạt động', color: '#388E3C' }; // Màu xanh lá
    }
    // Hết hạn: Kết thúc hoặc đã qua ngày hiệu lực
    else {
      return { status: 'Hết hạn', color: '#D32F2F' }; // Màu đỏ
    }
  };

  const validateForm = (data: Promotion): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code.trim()) errors.code = 'Mã CTKM không được để trống';
    else if (data.code.length > 20) errors.code = 'Mã CTKM không được vượt quá 20 ký tự';
    if (!data.description.trim()) errors.description = 'Mô tả không được để trống';
    else if (data.description.length > 200) errors.description = 'Mô tả không được vượt quá 200 ký tự';
    if (!data.discount_type) errors.discount_type = 'Vui lòng chọn loại giảm';
    if (data.discount_value <= 0) errors.discount_value = 'Giá trị giảm phải lớn hơn 0';
    else if (data.discount_type === 'percent' && data.discount_value > 100) {
      errors.discount_value = 'Giá trị giảm không được vượt quá 100%';
    }
    if (!data.start_date) errors.start_date = 'Ngày bắt đầu không được để trống';
    if (!data.end_date) errors.end_date = 'Ngày kết thúc không được để trống';
    else if (data.start_date && data.end_date && data.start_date > data.end_date) {
      errors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (data.usage_limit < 0) errors.usage_limit = 'Giới hạn số lần dùng không được âm';
    if (data.used_count < 0) errors.used_count = 'Số lần đã dùng không được âm';
    return errors;
  };

  const handleViewDetails = (id: number) => {
    if (selectedPromotionId === id && editPromotionId !== id) {
      setSelectedPromotionId(null);
    } else {
      setSelectedPromotionId(id);
      setEditPromotionId(null);
      setEditFormData(null);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotionId(promotion.id);
    setEditPromotionId(promotion.id);
    setEditFormData({ ...promotion });
    setValidationErrors({});
  };

  const handleCancel = () => {
    setEditPromotionId(null);
    setEditFormData(null);
    setValidationErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = {
        ...editFormData,
        [name]: name === 'discount_type' ? (value as DiscountType) : name === 'discount_value' || name === 'usage_limit' || name === 'used_count' ? Number(value) : value,
      };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editFormData) {
      const updatedData = {
        ...editFormData,
        is_active: e.target.checked,
      };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleSave = async () => {
    if (!editFormData) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.put(`/promotions/${editFormData.id}`, editFormData);
      if (response.status === 200) {
        await fetchPromotions();
        setEditPromotionId(null);
        setEditFormData(null);
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

  const handleDeleteClick = (id: number) => {
    setDeleteDialogOpen(id);
  };

  const handleDeleteConfirm = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const promotionToDelete = promotions.find((p) => p.id === id);
      if (!promotionToDelete) {
        throw new Error('Không tìm thấy mã khuyến mãi để xóa');
      }

      if (promotionToDelete.used_count > 0) {
        const updatedPromotion = { ...promotionToDelete, is_active: false };
        const updateResponse = await api.put(`/promotions/${id}`, updatedPromotion);
        if (updateResponse.status !== 200) {
          throw new Error('Không thể ẩn mã giảm giá do lỗi từ phía server');
        }
        setSnackbarMessage('Mã giảm giá đã được ẩn vì đã được sử dụng!');
      } else {
        const deleteResponse = await api.delete(`/promotions/${id}`);
        if (deleteResponse.status !== 200 && deleteResponse.status !== 204) {
          throw new Error('Không thể xóa mã giảm giá do lỗi từ phía server');
        }
        setSnackbarMessage('Mã giảm giá đã được xóa thành công vì chưa được sử dụng!');
      }

      await fetchPromotions();
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

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="header-content">
          <h2>
            Danh Sách Khuyến Mãi
          </h2>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm mã khuyến mãi"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: '300px' }}
            />
            <TextField
              label="Lọc theo trạng thái"
              variant="outlined"
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              select
              sx={{ width: '200px' }}
            >
              <MenuItem value="Tất cả">Tất cả</MenuItem>
              <MenuItem value="Chưa kích hoạt">Chưa kích hoạt</MenuItem>
              <MenuItem value="Đang hoạt động">Đang hoạt động</MenuItem>
              <MenuItem value="Hết hạn">Hết hạn</MenuItem>
            </TextField>
            <Link to="/promotions/add" className="btn-add">
              Thêm mới
            </Link>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách khuyến mãi...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="error-message">
          {error}
        </Typography>
      ) : filteredPromotions.length === 0 ? (
        <Typography className="no-data">
          {searchQuery || statusFilter !== 'Tất cả' ? 'Không tìm thấy mã khuyến mãi phù hợp.' : 'Không tìm thấy khuyến mãi nào.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} className="promotion-table-container">
          <Table className="promotion-table">
            <TableHead>
              <TableRow className='promotion-table-header'>
                <TableCell>Mã Khuyến Mãi</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Giá trị giảm</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPromotions.map((promotion) => {
                const { status, color } = getPromotionStatus(promotion.is_active, promotion.start_date, promotion.end_date);
                return (
                  <React.Fragment key={promotion.id}>
                    <TableRow
                      style={{
                        opacity: promotion.is_active ? 1 : 0.5, // Hiệu ứng mờ cho không hoạt động
                        transition: 'opacity 0.3s',
                      }}
                    >
                      <TableCell>{promotion.code}</TableCell>
                      <TableCell>{promotion.description}</TableCell>
                      <TableCell>{promotion.discount_value} {promotion.discount_type === 'percent' ? '%' : 'VNĐ'}</TableCell>
                      <TableCell sx={{ color: color, fontWeight: 'bold' }}>{status}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          className="action-view"
                          title="Xem chi tiết"
                          onClick={() => handleViewDetails(promotion.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          className="action-edit"
                          title="Sửa"
                          onClick={() => handleEdit(promotion)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          className="action-delete"
                          title="Xóa"
                          onClick={() => handleDeleteClick(promotion.id)}
                          sx={{ color: 'red' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} style={{ padding: 0 }}>
                        <Collapse in={selectedPromotionId === promotion.id}>
                          <div className="detail-container">
                            {editPromotionId === promotion.id && editFormData ? (
                              <>
                                <h3>Thông tin khuyến mãi</h3>
                                <Box display="flex" flexDirection="column" gap={2}>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Mã CTKM"
                                      name="code"
                                      value={editFormData.code}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.code}
                                      helperText={validationErrors.code}
                                    />
                                    <TextField
                                      label="Mô tả chi tiết"
                                      name="description"
                                      value={editFormData.description}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.description}
                                      helperText={validationErrors.description}
                                    />
                                  </Box>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Loại giảm"
                                      name="discount_type"
                                      value={editFormData.discount_type}
                                      onChange={handleChange}
                                      select
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.discount_type}
                                      helperText={validationErrors.discount_type}
                                    >
                                      <MenuItem value="percent">Phần trăm (%)</MenuItem>
                                      <MenuItem value="amount">Số tiền (VNĐ)</MenuItem>
                                    </TextField>
                                    <TextField
                                      label="Giá trị giảm"
                                      name="discount_value"
                                      value={editFormData.discount_value}
                                      onChange={handleChange}
                                      type="number"
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
                                      value={editFormData.start_date}
                                      onChange={handleChange}
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
                                      value={editFormData.end_date}
                                      onChange={handleChange}
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
                                      value={editFormData.usage_limit}
                                      onChange={handleChange}
                                      type="number"
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.usage_limit}
                                      helperText={validationErrors.usage_limit}
                                    />
                                    <TextField
                                      label="Số lần đã dùng"
                                      name="used_count"
                                      value={editFormData.used_count}
                                      onChange={handleChange}
                                      type="number"
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.used_count}
                                      helperText={validationErrors.used_count}
                                    />
                                  </Box>
                                  <Box display="flex" gap={2} alignItems="center">
                                    <Typography>Trạng thái:</Typography>
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          name="is_active"
                                          checked={editFormData.is_active}
                                          onChange={handleSwitchChange}
                                          color="primary"
                                        />
                                      }
                                      label={
                                        <Typography sx={{ color: getPromotionStatus(editFormData.is_active, editFormData.start_date, editFormData.end_date).color }}>
                                          {getPromotionStatus(editFormData.is_active, editFormData.start_date, editFormData.end_date).status}
                                        </Typography>
                                      }
                                    />
                                  </Box>
                                </Box>
                                <Box mt={2} display="flex" gap={2}>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSave}
                                    disabled={loading}
                                  >
                                    Lưu
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    onClick={handleCancel}
                                    disabled={loading}
                                    sx={{
                                      color: 'error.main',
                                      borderColor: 'error.main',
                                      '&:hover': {
                                        color: 'error.main',
                                        borderColor: 'error.main',
                                        backgroundColor: 'transparent',
                                      },
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                </Box>
                              </>
                            ) : (
                              <>
                                <h3>Thông tin khuyến mãi</h3>
                                <Table className="detail-table">
                                  <TableBody>
                                    <TableRow>
                                      <TableCell><strong>Mã CTKM:</strong> {promotion.code}</TableCell>
                                      <TableCell><strong>Mô tả:</strong> {promotion.description}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell><strong>Loại giảm:</strong> {promotion.discount_type === 'percent' ? 'Phần trăm' : 'Số tiền'}</TableCell>
                                      <TableCell><strong>Giá trị giảm:</strong> {promotion.discount_value} {promotion.discount_type === 'percent' ? '%' : 'VNĐ'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell><strong>Ngày bắt đầu:</strong> {promotion.start_date}</TableCell>
                                      <TableCell><strong>Ngày kết thúc:</strong> {promotion.end_date}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell><strong>Giới hạn số lần:</strong> {promotion.usage_limit}</TableCell>
                                      <TableCell><strong>Số lần đã dùng:</strong> {promotion.used_count}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell colSpan={2}>
                                        <strong>Trạng thái:</strong>{' '}
                                        <Typography component="span" sx={{ color: color, fontWeight: 'bold' }}>
                                          {status}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </>
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
      )}

      <Dialog
        open={deleteDialogOpen !== null}
        onClose={handleDeleteCancel}
      >
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
            onClick={() => handleDeleteConfirm(deleteDialogOpen!)}
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
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Promotions;