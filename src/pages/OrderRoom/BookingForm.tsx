import React, { useState } from 'react';
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
  Typography,
  CircularProgress,
} from '@mui/material';
import { 
  Close as CloseIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import '../../css/BookingForm.css';
import api from '../../api/axios';

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  roomNumber: string;
  roomId: number; // Thêm roomId để gửi trong API
}

interface BookingData {
  check_in_date: string;
  check_out_date: string;
  deposit_amount: string;
  raw_total: string;
  discount_amount: string;
  total_amount: string;
  note: string;
}

interface CustomerData {
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

const BookingForm: React.FC<BookingFormProps> = ({ open, onClose, roomNumber, roomId }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    check_in_date: '',
    check_out_date: '',
    deposit_amount: '',
    raw_total: '',
    discount_amount: '0',
    total_amount: '',
    note: '',
  });
  const [customerData, setCustomerData] = useState<CustomerData>({
    cccd: '',
    name: '',
    gender: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: 'Việt Nam',
    address: '',
    note: '',
  });

  const steps = [
    { label: 'Thông tin đặt phòng', icon: <InfoIcon /> },
    { label: 'Khách hàng', icon: <PersonIcon /> },
    { label: 'Đặt cọc', icon: <MoneyIcon /> },
  ];

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      // Gửi API khi hoàn thành
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/bookings', {
          room_id: roomId,
          customer: {
            cccd: customerData.cccd,
            name: customerData.name,
            gender: customerData.gender,
            email: customerData.email,
            phone: customerData.phone,
            date_of_birth: customerData.date_of_birth,
            nationality: customerData.nationality,
            address: customerData.address,
            note: customerData.note,
          },
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
          deposit_amount: bookingData.deposit_amount,
          raw_total: bookingData.raw_total,
          discount_amount: bookingData.discount_amount,
          total_amount: bookingData.total_amount,
          note: bookingData.note,
        });

        if (response.status === 201) {
          onClose();
        } else {
          throw new Error('Đặt phòng thất bại');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi đặt phòng');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      onClose();
    }
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const renderBookingStep = () => (
    <div className="step-content">
      <div className="booking-form-container">
        <div className="booking-info-section">
          <div className="section-header">
            <h3>Thông tin đặt phòng</h3>
          </div>
          <div className="booking-section">
            <div className="booking-grid">
              <div className="form-group">
                <TextField
                  name="check_in_date"
                  label="Nhận phòng"
                  type="date"
                  required
                  value={bookingData.check_in_date}
                  onChange={handleBookingChange}
                  InputLabelProps={{ shrink: true }}
                  className="booking-textfield"
                  size="small"
                />
              </div>
              <div className="form-group">
                <TextField
                  name="check_out_date"
                  label="Trả phòng"
                  type="date"
                  required
                  value={bookingData.check_out_date}
                  onChange={handleBookingChange}
                  InputLabelProps={{ shrink: true }}
                  className="booking-textfield"
                  size="small"
                />
              </div>
              <div className="form-group form-group-full">
                <TextField
                  name="note"
                  label="Ghi chú"
                  value={bookingData.note}
                  onChange={handleBookingChange}
                  multiline
                  rows={2}
                  className="booking-textfield"
                  placeholder="Nhập ghi chú thêm..."
                  size="small"
                />
              </div>
            </div>
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
          <div className="customer-grid">
            <div className="form-group">
              <TextField
                name="cccd"
                label="Số CCCD/CMND"
                required
                value={customerData.cccd}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Nhập số CCCD/CMND"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="name"
                label="Họ và tên"
                required
                value={customerData.name}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Nhập họ và tên đầy đủ"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="gender"
                label="Giới tính"
                select
                value={customerData.gender}
                onChange={handleCustomerChange}
                className="booking-textfield"
                size="small"
              >
                <MenuItem value="male">Nam</MenuItem>
                <MenuItem value="female">Nữ</MenuItem>
                <MenuItem value="other">Khác</MenuItem>
              </TextField>
            </div>
            <div className="form-group">
              <TextField
                name="email"
                label="Email"
                type="email"
                value={customerData.email}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="example@email.com"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="phone"
                label="Số điện thoại"
                required
                value={customerData.phone}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="0123 456 789"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="date_of_birth"
                label="Ngày sinh"
                type="date"
                value={customerData.date_of_birth}
                onChange={handleCustomerChange}
                InputLabelProps={{ shrink: true }}
                className="booking-textfield"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="nationality"
                label="Quốc tịch"
                value={customerData.nationality}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Việt Nam"
                size="small"
              />
            </div>
            <div className="form-group form-group-full">
              <TextField
                name="address"
                label="Địa chỉ"
                value={customerData.address}
                onChange={handleCustomerChange}
                className="booking-textfield"
                placeholder="Nhập địa chỉ chi tiết"
                size="small"
              />
            </div>
            <div className="form-group form-group-full">
              <TextField
                name="note"
                label="Ghi chú"
                value={customerData.note}
                onChange={handleCustomerChange}
                multiline
                rows= "2"
                className="booking-textfield"
                placeholder="Ghi chú thêm về khách hàng..."
                size="small"
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
          <div className="deposit-grid">
            <div className="form-group">
              <TextField
                name="deposit_amount"
                label="Tiền đặt cọc"
                type="number"
                required
                value={bookingData.deposit_amount}
                onChange={handleBookingChange}
                InputProps={{ endAdornment: <span className="currency">VND</span> }}
                className="booking-textfield"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="raw_total"
                label="Tổng gốc"
                type="number"
                required
                value={bookingData.raw_total}
                onChange={handleBookingChange}
                InputProps={{ endAdornment: <span className="currency">VND</span> }}
                className="booking-textfield"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="discount_amount"
                label="Tiền giảm giá"
                type="number"
                value={bookingData.discount_amount}
                onChange={handleBookingChange}
                InputProps={{ endAdornment: <span className="currency">VND</span> }}
                className="booking-textfield"
                size="small"
              />
            </div>
            <div className="form-group">
              <TextField
                name="total_amount"
                label="Tổng giá cuối"
                type="number"
                required
                value={bookingData.total_amount}
                onChange={handleBookingChange}
                InputProps={{ endAdornment: <span className="currency">VND</span> }}
                className="booking-textfield"
                size="small"
              />
            </div>
          </div>
          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );

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

  return (
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
      <div className="booking-header">
        <IconButton 
          className="close-button" 
          onClick={onClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
        <div className="stepper-container">
          <h2>Đặt phòng {roomNumber}</h2>
          <p>Vui lòng điền đầy đủ thông tin đặt phòng</p>
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
      <DialogContent className="booking-content">
        {loading ? (
          <div className="loading-state">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Đang xử lý...</Typography>
          </div>
        ) : (
          renderStepContent()
        )}
      </DialogContent>
      <div className="booking-actions">
        <Button 
          onClick={handleBack}
          className="back-btn"
          variant="outlined"
          startIcon={activeStep === 0 ? null : <ArrowBackIcon />}
          disabled={loading}
        >
          {activeStep === 0 ? 'Hủy bỏ' : 'Quay lại'}
        </Button>
        <Button 
          onClick={handleNext}
          className="next-btn"
          variant="contained"
          endIcon={activeStep === steps.length - 1 ? null : <ArrowForwardIcon />}
          disabled={loading}
        >
          {activeStep === steps.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
        </Button>
      </div>
    </Dialog> 
  );
};

export default BookingForm;