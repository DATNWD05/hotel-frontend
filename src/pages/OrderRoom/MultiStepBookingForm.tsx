import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  TextField, 
  MenuItem, 
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import '../../css/MultiStepBookingForm.css';

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  roomNumber: string;
  initialData?: BookingData; // Thêm prop để nhận dữ liệu ban đầu
}

interface BookingData {
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

interface CustomerData {
  id: string;
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  note: string;
}

const MultiStepBookingForm: React.FC<BookingFormProps> = ({ open, onClose, roomNumber, initialData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({
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
  const [customerData, setCustomerData] = useState<CustomerData>({
    id: '',
    cccd: '',
    name: '',
    gender: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: 'Việt Nam',
    address: '',
    note: ''
  });

  // Cập nhật dữ liệu ban đầu khi component mount
  useEffect(() => {
    if (initialData) {
      setBookingData(initialData);
    }
  }, [initialData]);

  const steps = [
    { label: 'Thông tin đặt phòng', icon: <InfoIcon /> },
    { label: 'Khách hàng', icon: <PersonIcon /> },
    { label: 'Đặt cọc', icon: <MoneyIcon /> }
  ];

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const handleRoomDetailChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newRoomDetails = [...bookingData.roomDetails];
    newRoomDetails[index] = { ...newRoomDetails[index], [e.target.name]: e.target.value };
    setBookingData({ ...bookingData, roomDetails: newRoomDetails });
  };

  const addRoomDetail = () => {
    setBookingData({
      ...bookingData,
      roomDetails: [...bookingData.roomDetails, { roomType: '', room: '', category: '', deposit: 0 }],
    });
  };

  const removeRoomDetail = (index: number) => {
    const newRoomDetails = bookingData.roomDetails.filter((_, i) => i !== index);
    setBookingData({ ...bookingData, roomDetails: newRoomDetails });
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      // Submit final form
      console.log('Booking Data:', bookingData);
      console.log('Customer Data:', customerData);
      onClose();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBookingStep();
      case 1:
        return renderCustomerStep();
      case 2:
        return renderDepositStep();
      default:
        return null;
    }
  };

  const renderBookingStep = () => (
    <div className="step-content">
      <div className="booking-form-container">
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
                value={bookingData.checkInDate}
                onChange={handleBookingChange}
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
                value={bookingData.checkOutDate}
                onChange={handleBookingChange}
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
                value={bookingData.source}
                onChange={handleBookingChange}
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
                value={bookingData.adults}
                onChange={handleBookingChange}
                className="booking-textfield"
                inputProps={{ min: 1 }}
              />
              <TextField
                name="children"
                label="Trẻ em"
                type="number"
                value={bookingData.children}
                onChange={handleBookingChange}
                className="booking-textfield"
                inputProps={{ min: 0 }}
              />
              <TextField
                name="infants"
                label="Trẻ sơ sinh"
                type="number"
                value={bookingData.infants}
                onChange={handleBookingChange}
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
                value={bookingData.price}
                onChange={handleBookingChange}
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
                value={bookingData.note}
                onChange={handleBookingChange}
                multiline
                rows={3}
                className="booking-textfield"
                placeholder="Nhập ghi chú thêm..."
              />
            </div>
          </div>
        </div>

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
            {bookingData.roomDetails.map((roomDetail, index) => (
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
    </div>
  );

  const renderCustomerStep = () => (
    <div className="step-content">
      <div className="customer-form-container">
        <div className="section-header">
          <h3>Thông tin khách hàng</h3>
        </div>
        <div className="booking-section">
          <div className="customer-form-grid">
            <div className="form-row">
              <TextField
                name="id"
                label="ID khách hàng"
                fullWidth
                value={customerData.id}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Mã khách hàng (tự động tạo)"
              />
            </div>

            <div className="form-row">
              <TextField
                name="cccd"
                label="Số CCCD/CMND"
                fullWidth
                required
                value={customerData.cccd}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Nhập số CCCD/CMND"
              />
            </div>

            <div className="form-row-group">
              <TextField
                name="name"
                label="Họ và tên"
                fullWidth
                required
                value={customerData.name}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Nhập họ và tên đầy đủ"
              />
              
              <TextField
                name="gender"
                label="Giới tính"
                select
                value={customerData.gender}
                onChange={handleCustomerChange}
                className="booking-textfield"
              >
                <MenuItem value="male">Nam</MenuItem>
                <MenuItem value="female">Nữ</MenuItem>
                <MenuItem value="other">Khác</MenuItem>
              </TextField>
            </div>

            <div className="form-row-group">
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={customerData.email}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="example@email.com"
              />
              
              <TextField
                name="phone"
                label="Số điện thoại"
                fullWidth
                required
                value={customerData.phone}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="0123 456 789"
              />
            </div>

            <div className="form-row-group">
              <TextField
                name="date_of_birth"
                label="Ngày sinh"
                type="date"
                value={customerData.date_of_birth}
                onChange={handleCustomerChange}
                InputLabelProps={{ shrink: true }}
                className="booking-textfield"
              />
              
              <TextField
                name="nationality"
                label="Quốc tịch"
                fullWidth
                value={customerData.nationality}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Việt Nam"
              />
            </div>

            <div className="form-row">
              <TextField
                name="address"
                label="Địa chỉ"
                fullWidth
                value={customerData.address}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Nhập địa chỉ chi tiết"
              />
            </div>

            <div className="form-row">
              <TextField
                name="note"
                label="Ghi chú"
                fullWidth
                value={customerData.note}
                onChange={handleCustomerChange}
                multiline
                rows={3}
                className="booking-textfield"
                placeholder="Ghi chú thêm về khách hàng..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDepositStep = () => (
    <div className="step-content">
      <div className="deposit-container">
        <div className="section-header">
          <h3>Thông tin đặt cọc</h3>
        </div>
        <div className="booking-section">
          <div className="deposit-summary">
            <h4>Tóm tắt đặt phòng</h4>
            <div className="summary-item">
              <span>Phòng:</span>
              <span>{roomNumber}</span>
            </div>
            <div className="summary-item">
              <span>Khách hàng:</span>
              <span>{customerData.name || 'Chưa nhập'}</span>
            </div>
            <div className="summary-item">
              <span>Nhận phòng:</span>
              <span>{bookingData.checkInDate ? new Date(bookingData.checkInDate).toLocaleString('vi-VN') : 'Chưa chọn'}</span>
            </div>
            <div className="summary-item">
              <span>Trả phòng:</span>
              <span>{bookingData.checkOutDate ? new Date(bookingData.checkOutDate).toLocaleString('vi-VN') : 'Chưa chọn'}</span>
            </div>
            <div className="summary-item">
              <span>Tổng tiền:</span>
              <span className="total-amount">{bookingData.price ? `${parseInt(bookingData.price).toLocaleString()} VND` : '0 VND'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      className="multi-step-dialog"
      PaperProps={{
        className: "multi-step-dialog-paper"
      }}
    >
      <div className="multi-step-header">
        <IconButton 
          className="close-button" 
          onClick={onClose}
          size="small"
        >
          ×
        </IconButton>
        
        <div className="stepper-container">
          <Stepper activeStep={activeStep} className="custom-stepper">
            {steps.map((step, index) => (
              <Step 
                key={step.label} 
                className={`custom-step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
                onClick={() => handleStepClick(index)}
              >
                <StepLabel 
                  className="custom-step-label"
                  StepIconComponent={() => (
                    <div className={`step-icon ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}>
                      {step.icon}
                    </div>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>
      </div>

      <DialogContent className="multi-step-content">
        {renderStepContent()}
      </DialogContent>

      <div className="multi-step-actions">
        <Button 
          onClick={activeStep === 0 ? onClose : handleBack}
          className="back-btn"
          variant="outlined"
          startIcon={activeStep === 0 ? null : <ArrowBackIcon />}
        >
          {activeStep === 0 ? 'Hủy bỏ' : 'Quay lại'}
        </Button>
        
        <Button 
          onClick={handleNext}
          className="next-btn"
          variant="contained"
          endIcon={activeStep === steps.length - 1 ? null : <ArrowForwardIcon />}
        >
          {activeStep === steps.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
        </Button>
      </div>
    </Dialog>
  );
};

export default MultiStepBookingForm;