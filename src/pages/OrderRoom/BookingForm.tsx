import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import MultiStepBookingForm from './MultiStepBookingForm'; // Import MultiStepBookingForm

import '../../css/BookingForm.css';

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  roomNumber: string;
}

interface FormData {
  checkInDate: string;
  checkOutDate: string;
  source: string;
  adults: number;
  children: number;
  infants: number;
  price: string;
  note: string;
  roomDetails: { roomType: string; room: string; category: string; deposit: number }[];
}

const BookingForm: React.FC<BookingFormProps> = ({ open, onClose, roomNumber }) => {
  const [formData, setFormData] = useState<FormData>({
    checkInDate: '',
    checkOutDate: '',
    source: '',
    adults: 1,
    children: 0,
    infants: 0,
    price: '',
    note: '',
    roomDetails: [{ roomType: '', room: '', category: '', deposit: 0 }],
  });

  const [showMultiStepForm, setShowMultiStepForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoomDetailChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newRoomDetails = [...formData.roomDetails];
    newRoomDetails[index] = { ...newRoomDetails[index], [e.target.name]: e.target.value };
    setFormData({ ...formData, roomDetails: newRoomDetails });
  };

  const handleSubmit = () => {
    setShowMultiStepForm(true); // Mở MultiStepBookingForm khi nhấn Tiếp theo
  };

  const addRoomDetail = () => {
    setFormData({
      ...formData,
      roomDetails: [...formData.roomDetails, { roomType: '', room: '', category: '', deposit: 0 }],
    });
  };

  const removeRoomDetail = (index: number) => {
    const newRoomDetails = formData.roomDetails.filter((_, i) => i !== index);
    setFormData({ ...formData, roomDetails: newRoomDetails });
  };

  const handleMultiStepClose = () => {
    setShowMultiStepForm(false);
    onClose(); // Đóng cả BookingForm khi MultiStepBookingForm đóng
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        className="booking-dialog"
        PaperProps={{
          className: "booking-dialog-paper"
        }}
      >
        <DialogTitle className="booking-dialog-title">
          <div className="title-content">
            <h2>Đặt phòng {roomNumber}</h2>
            <p>Vui lòng điền đầy đủ thông tin đặt phòng</p>
          </div>
          <IconButton 
            className="close-button" 
            onClick={onClose}
            size="small"
          >
            ×
          </IconButton>
        </DialogTitle>

        <DialogContent className="booking-dialog-content">
          <div className="booking-form-container">
            {/* Cột trái - Thông tin đặt phòng */}
            <div className="booking-column">
              <div className="section-header">
                <h3>Thông tin đặt phòng</h3>
              </div>
              <div className="booking-section">
                <div className="form-row">
                  <TextField
                    name="checkInDate"
                    label="Nhận phòng"
                    type="datetime-local"
                    fullWidth
                    required
                    value={formData.checkInDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    className="booking-textfield"
                  />
                </div>

                <div className="form-row">
                  <TextField
                    name="checkOutDate"
                    label="Trả phòng"
                    type="datetime-local"
                    fullWidth
                    required
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    className="booking-textfield"
                  />
                </div>

                <div className="form-row">
                  <TextField
                    name="source"
                    label="Nguồn"
                    select
                    fullWidth
                    required
                    value={formData.source}
                    onChange={handleChange}
                    className="booking-textfield"
                  >
                    <MenuItem value="PPTT">PPTT</MenuItem>
                    <MenuItem value="Booking.com">Booking.com</MenuItem>
                    <MenuItem value="Agoda">Agoda</MenuItem>
                    <MenuItem value="Direct">Trực tiếp</MenuItem>
                  </TextField>
                </div>

                <div className="form-row-group">
                  <TextField
                    name="adults"
                    label="Người lớn"
                    type="number"
                    value={formData.adults}
                    onChange={handleChange}
                    className="booking-textfield"
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    name="children"
                    label="Trẻ em"
                    type="number"
                    value={formData.children}
                    onChange={handleChange}
                    className="booking-textfield"
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    name="infants"
                    label="Trẻ sơ sinh"
                    type="number"
                    value={formData.infants}
                    onChange={handleChange}
                    className="booking-textfield"
                    inputProps={{ min: 0 }}
                  />
                </div>

                <div className="form-row">
                  <TextField
                    name="price"
                    label="Phí hoa hồng"
                    type="number"
                    fullWidth
                    value={formData.price}
                    onChange={handleChange}
                    InputProps={{ 
                      endAdornment: <span className="currency">VND</span>
                    }}
                    className="booking-textfield"
                  />
                </div>

                <div className="form-row">
                  <TextField
                    name="note"
                    label="Ghi chú"
                    fullWidth
                    value={formData.note}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    className="booking-textfield"
                    placeholder="Nhập ghi chú thêm..."
                  />
                </div>
              </div>
            </div>

            {/* Cột phải - Chi tiết phòng */}
            <div className="booking-column">
              <div className="section-header">
                <h3>Chi tiết phòng</h3>
                <Button
                  variant="contained"
                  onClick={addRoomDetail}
                  className="add-room-button"
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Thêm phòng
                </Button>
              </div>
              
              <div className="booking-section room-details-section">
                {formData.roomDetails.map((roomDetail, index) => (
                  <div key={index} className="room-detail-card">
                    <div className="room-detail-header">
                      <span className="room-number">Phòng #{index + 1}</span>
                      {index > 0 && (
                        <IconButton
                          onClick={() => removeRoomDetail(index)}
                          className="delete-room-button"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </div>
                    
                    <div className="room-detail-fields">
                      <div className="form-row-group">
                        <TextField
                          name="roomType"
                          label="Loại phòng"
                          select
                          value={roomDetail.roomType}
                          onChange={handleRoomDetailChange(index)}
                          className="booking-textfield"
                        >
                          <MenuItem value="standard">Standard</MenuItem>
                          <MenuItem value="deluxe">Deluxe</MenuItem>
                          <MenuItem value="suite">Suite</MenuItem>
                        </TextField>
                        
                        <TextField
                          name="room"
                          label="Phòng"
                          select
                          value={roomDetail.room}
                          onChange={handleRoomDetailChange(index)}
                          className="booking-textfield"
                        >
                          <MenuItem value={roomNumber}>{roomNumber}</MenuItem>
                        </TextField>
                      </div>
                      
                      <div className="form-row-group">
                        <TextField
                          name="category"
                          label="Phân loại giá"
                          select
                          value={roomDetail.category}
                          onChange={handleRoomDetailChange(index)}
                          className="booking-textfield"
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="weekend">Weekend</MenuItem>
                          <MenuItem value="holiday">Holiday</MenuItem>
                        </TextField>
                        
                        <TextField
                          name="deposit"
                          label="Giá/đêm"
                          type="number"
                          value={roomDetail.deposit}
                          onChange={handleRoomDetailChange(index)}
                          InputProps={{ 
                            endAdornment: <span className="currency">VND</span>
                          }}
                          className="booking-textfield"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions className="booking-dialog-actions">
          <Button 
            onClick={onClose} 
            className="cancel-btn"
            variant="outlined"
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="submit-btn"
            variant="contained"
          >
            Tiếp theo
          </Button>
        </DialogActions>
      </Dialog>

      {/* MultiStepBookingForm được mở khi nhấn Tiếp theo */}
      <MultiStepBookingForm
        open={showMultiStepForm}
        onClose={handleMultiStepClose}
        roomNumber={roomNumber}
        initialData={formData} // Truyền dữ liệu ban đầu
      />
    </>
  );
};

export default BookingForm;