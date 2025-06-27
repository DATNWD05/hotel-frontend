import React, { useEffect, useState } from 'react';
import {
  Typography,
  TextField,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import '../../css/Promotion.css';

interface RoomType {
  id: number;
  name: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: 'available' | 'booked' | 'cleaning' | 'maintenance';
  note?: string;
}

interface ValidationErrors {
  room_number?: string;
}

const RoomEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/rooms/${id}`),
      api.get('/room-types'),
    ])
      .then(([roomRes, typesRes]) => {
        setRoom(roomRes.data.data);
        setRoomTypes(typesRes.data.data);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Không lấy được dữ liệu phòng', severity: 'error' });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const validate = (data: Room): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!data.room_number.trim()) errs.room_number = 'Số phòng không được để trống';
    return errs;
  };

  const handleChange = <K extends keyof Room>(field: K, value: Room[K]) => {
    if (!room) return;
    const updated = { ...room, [field]: value };
    setRoom(updated);
    setValidationErrors(validate(updated));
  };

  const handleSave = () => {
    if (!room) return;
    const errs = validate(room);
    if (Object.keys(errs).length) {
      setValidationErrors(errs);
      return;
    }
    setSaving(true);
    api
      .put(`/rooms/${room.id}`, {
        room_number: room.room_number,
        room_type_id: room.room_type_id,
        status: room.status, // Keep the current status, no user edit
        note: room.note,
      })
      .then(() => {
        setSnackbar({ open: true, message: 'Cập nhật phòng thành công', severity: 'success' });
        setTimeout(() => navigate('/rooms'), 2000);
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Lỗi khi cập nhật phòng', severity: 'error' });
      })
      .finally(() => setSaving(false));
  };

  const handleCancel = () => navigate('/rooms');

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="promotion-wrapper">
      <div className="promotion-title">
        <div className="promotion-header-content">
          <h2>
            Edit <b>Room</b>
          </h2>
          <Box className="promotion-form-buttons">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              sx={{ mr: 1 }}
            >
              {saving ? <CircularProgress size={24} /> : 'Lưu'}
            </Button>
            <Button
              variant="outlined"
              className="promotion-btn-cancel"
              color="secondary"
              onClick={handleCancel}
              disabled={saving}
              component={Link}
              to="/rooms"
            >
              Hủy
            </Button>
          </Box>
        </div>
      </div>

      {loading ? (
        <div className="promotion-loading-container">
          <CircularProgress />
          <Typography>Đang xử lý...</Typography>
        </div>
      ) : room ? (
        <div className="promotion-detail-container">
          <h3>Thông tin phòng</h3>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2}>
              <TextField
                label="Số phòng"
                value={room.room_number}
                onChange={(e) => handleChange('room_number', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                error={!!validationErrors.room_number}
                helperText={validationErrors.room_number}
              />
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Loại phòng</InputLabel>
                <Select
                  value={room.room_type_id}
                  label="Loại phòng"
                  onChange={(e) => handleChange('room_type_id', Number(e.target.value))}
                >
                  {roomTypes.map((rt) => (
                    <MenuItem key={rt.id} value={rt.id}>
                      {rt.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Trạng thái"
                value={room.status === 'available'
                  ? 'Phòng trống'
                  : room.status === 'booked'
                  ? 'Đã đặt'
                  : room.status === 'cleaning'
                  ? 'Đang dọn'
                  : 'Bảo trì'}
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                }}
                sx={{ '& .MuiInputBase-input': { color: '#333333' } }}
              />
              <TextField
                label="Ghi chú"
                value={room.note || ''}
                multiline
                minRows={2}
                onChange={(e) => handleChange('note', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </div>
      ) : (
        <Typography color="error" className="promotion-error-message">
          Không tìm thấy thông tin phòng
        </Typography>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RoomEdit;