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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../css/Client.css';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: string;
  country: string;
  company: string;
  cccdPassport: string;
  balance: string;
  issueDate: string;
  storageCount: string;
  storageStatus: string;
  bookings: {
    id: number;
    code: string;
    source: string;
    bookingDate: string;
    checkInDate: string;
    checkOutDate: string;
    bookingStatus: string;
    paymentStatus: string;
    amount: string;
    note: string;
  }[];
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  country?: string;
  cccdPassport?: string;
  issueDate?: string;
  storageStatus?: string;
  storageCount?: string;
  balance?: string;
}

const Client: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [editClientId, setEditClientId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Client | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('http://localhost:3001/clients');

        if (response.status === 200) {
          const data = response.data;

          let users: Client[] = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data && Array.isArray(data.clients)) {
            users = data.clients;
          } else {
            throw new Error('Định dạng dữ liệu không đúng: danh sách khách hàng không phải là mảng');
          }

          users = users.map((user) => ({
            id: user.id || 0,
            name: user.name || 'Không xác định',
            email: user.email || 'Không xác định',
            phone: user.phone || 'Không xác định',
            address: user.address || 'Không xác định',
            dob: user.dob || 'Không xác định',
            gender: user.gender || 'Không xác định',
            country: user.country || 'Không xác định',
            company: user.company || 'Không xác định',
            cccdPassport: user.cccdPassport || 'Không xác định',
            balance: user.balance || '0 đ',
            issueDate: user.issueDate || 'Không xác định',
            storageCount: user.storageCount || '0',
            storageStatus: user.storageStatus || 'Không xác định',
            bookings: user.bookings || [],
          }));

          setClients(users);
        } else {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
        setError(errorMessage);
        console.error('Lỗi khi tải danh sách khách hàng:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleViewDetails = (id: number) => {
    if (selectedClientId === id && editClientId !== id) {
      setSelectedClientId(null);
    } else {
      setSelectedClientId(id);
      setEditClientId(null);
      setEditFormData(null);
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleEdit = (client: Client) => {
    if (editClientId === client.id) {
      setEditClientId(null);
      setEditFormData(null);
    } else {
      setSelectedClientId(client.id);
      setEditClientId(client.id);
      setEditFormData({ ...client });
      setValidationErrors({});
      setEditError(null);
    }
  };

  const validateForm = (data: Client): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Họ tên không được để trống';
    else if (data.name.length > 50) errors.name = 'Họ tên không được vượt quá 50 ký tự';
    if (!data.email.trim()) errors.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email không hợp lệ';
    if (!data.phone.trim()) errors.phone = 'Số điện thoại không được để trống';
    else if (!/^\d{10,11}$/.test(data.phone)) errors.phone = 'Số điện thoại không hợp lệ';
    if (!data.address.trim()) errors.address = 'Địa chỉ không được để trống';
    if (!data.dob.trim()) errors.dob = 'Ngày sinh không được để trống';
    if (!data.gender) errors.gender = 'Vui lòng chọn giới tính';
    if (!data.country.trim()) errors.country = 'Quốc gia không được để trống';
    if (!data.cccdPassport.trim()) errors.cccdPassport = 'CCCD/Passport không được để trống';
    if (!data.issueDate.trim()) errors.issueDate = 'Ngày phát hành không được để trống';
    if (!data.storageStatus) errors.storageStatus = 'Vui lòng chọn tình trạng lưu trữ';
    if (data.storageCount && parseInt(data.storageCount) < 0)
      errors.storageCount = 'Số lần lưu trữ không được nhỏ hơn 0';
    if (data.balance) {
      const balanceValue = parseFloat(data.balance.replace(/[^0-9.-]+/g, ''));
      if (isNaN(balanceValue) || balanceValue < 0)
        errors.balance = 'Số dư hiện tại không hợp lệ';
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editFormData) {
      const updatedData = { ...editFormData, [name]: value };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name && editFormData) {
      const updatedData = { ...editFormData, [name]: value as string };
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

    setEditLoading(true);
    try {
      const response = await axios.put(`http://localhost:3001/clients/${editFormData.id}`, editFormData);
      if (response.status === 200) {
        setClients((prev) =>
          prev.map((client) =>
            client.id === editFormData.id ? { ...editFormData } : client
          )
        );
        setEditClientId(null);
        setEditFormData(null);
      } else {
        throw new Error('Không thể cập nhật khách hàng');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật khách hàng';
      setEditError(errorMessage);
      console.error('Lỗi khi cập nhật khách hàng:', errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setEditClientId(null);
    setEditFormData(null);
    setValidationErrors({});
    setEditError(null);
  };

  return (
    <div className="client-wrapper">
      <div className="client-title">
        <div className="header-content">
          <h2>
            Client <b>Details</b>
          </h2>
          <Link to="/client/add" className="btn-add">
            Thêm mới
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách khách hàng...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="error-message">
          {error}
        </Typography>
      ) : clients.length === 0 ? (
        <Typography className="no-data">Không tìm thấy khách hàng nào.</Typography>
      ) : (
        <TableContainer component={Paper} className="client-table-container">
          <Table className="client-table">
            <TableHead>
              <TableRow>
                <TableCell>Họ Tên</TableCell>
                <TableCell>Địa Chỉ Email</TableCell>
                <TableCell>Số Điện Thoại</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <React.Fragment key={client.id}>
                  <TableRow>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        className="action-view"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetails(client.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        className="action-edit"
                        title="Sửa"
                        onClick={() => handleEdit(client)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} style={{ padding: 0 }}>
                      <Collapse in={selectedClientId === client.id}>
                        <div className="detail-container">
                          {editClientId === client.id && editFormData ? (
                            <>
                              <h3>Thông tin khách hàng</h3>
                              <Box display="flex" flexDirection="column" gap={2}>
                                <Box display="flex" gap={2}>
                                  <TextField
                                    label="Họ Tên"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.name}
                                    helperText={validationErrors.name}
                                  />
                                  <TextField
                                    label="Email"
                                    name="email"
                                    value={editFormData.email}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.email}
                                    helperText={validationErrors.email}
                                  />
                                </Box>
                                <Box display="flex" gap={2}>
                                  <TextField
                                    label="Số Điện Thoại"
                                    name="phone"
                                    value={editFormData.phone}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.phone}
                                    helperText={validationErrors.phone}
                                  />
                                  <TextField
                                    label="Địa chỉ"
                                    name="address"
                                    value={editFormData.address}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.address}
                                    helperText={validationErrors.address}
                                  />
                                </Box>
                                <Box display="flex" gap={2}>
                                  <TextField
                                    label="Ngày sinh"
                                    name="dob"
                                    type="date"
                                    value={editFormData.dob}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    error={!!validationErrors.dob}
                                    helperText={validationErrors.dob}
                                  />
                                  <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.gender}>
                                    <InputLabel>Giới tính</InputLabel>
                                    <Select
                                      name="gender"
                                      value={editFormData.gender}
                                      onChange={handleSelectChange}
                                      label="Giới tính"
                                    >
                                      <MenuItem value="">Chọn giới tính</MenuItem>
                                      <MenuItem value="Nam">Nam</MenuItem>
                                      <MenuItem value="Nữ">Nữ</MenuItem>
                                      <MenuItem value="Không xác định">Không xác định</MenuItem>
                                    </Select>
                                    {validationErrors.gender && (
                                      <Typography color="error" variant="caption">
                                        {validationErrors.gender}
                                      </Typography>
                                    )}
                                  </FormControl>
                                </Box>
                                <Box display="flex" gap={2}>
                                  <TextField
                                    label="Quốc gia"
                                    name="country"
                                    value={editFormData.country}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.country}
                                    helperText={validationErrors.country}
                                  />
                                  <TextField
                                    label="Công ty"
                                    name="company"
                                    value={editFormData.company}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                  />
                                </Box>
                              </Box>

                              <h3>Thông tin lưu trữ</h3>
                              <Box display="flex" flexDirection="column" gap={2}>
                                <Box display="flex" gap={2}>
                                  <TextField
                                    label="CCCD/Passport"
                                    name="cccdPassport"
                                    value={editFormData.cccdPassport}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.cccdPassport}
                                    helperText={validationErrors.cccdPassport}
                                  />
                                  <TextField
                                    label="Số dư hiện tại"
                                    name="balance"
                                    value={editFormData.balance}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.balance}
                                    helperText={validationErrors.balance || 'Ví dụ: 1,500,000 đ'}
                                  />
                                </Box>
                                <Box display="flex" gap={2}>
                                  <TextField
                                    label="Ngày phát hành"
                                    name="issueDate"
                                    type="date"
                                    value={editFormData.issueDate}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    error={!!validationErrors.issueDate}
                                    helperText={validationErrors.issueDate}
                                  />
                                  <TextField
                                    label="Số lần lưu trữ"
                                    name="storageCount"
                                    type="number"
                                    value={editFormData.storageCount}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.storageCount}
                                    helperText={validationErrors.storageCount}
                                    inputProps={{ min: 0 }}
                                  />
                                </Box>
                                <Box display="flex" gap={2}>
                                  <FormControl fullWidth variant="outlined" size="small" error={!!validationErrors.storageStatus}>
                                    <InputLabel>Tình trạng lưu trữ</InputLabel>
                                    <Select
                                      name="storageStatus"
                                      value={editFormData.storageStatus}
                                      onChange={handleSelectChange}
                                      label="Tình trạng lưu trữ"
                                    >
                                      <MenuItem value="">Chọn tình trạng</MenuItem>
                                      <MenuItem value="Hoàn tất">Hoàn tất</MenuItem>
                                      <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
                                      <MenuItem value="Chưa xử lý">Chưa xử lý</MenuItem>
                                    </Select>
                                    {validationErrors.storageStatus && (
                                      <Typography color="error" variant="caption">
                                        {validationErrors.storageStatus}
                                      </Typography>
                                    )}
                                  </FormControl>
                                </Box>
                              </Box>

                              <Box mt={2} display="flex" gap={2}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={handleSave}
                                  disabled={editLoading}
                                >
                                  Lưu
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  onClick={handleCancel}
                                  disabled={editLoading}
                                >
                                  Hủy
                                </Button>
                              </Box>
                              {editError && (
                                <Typography color="error" mt={1}>
                                  {editError}
                                </Typography>
                              )}
                            </>
                          ) : (
                            <>
                              <h3>Thông tin khách hàng</h3>
                              <Table className="detail-table">
                                <TableBody>
                                  <TableRow>
                                    <TableCell><strong>Họ Tên:</strong> {client.name}</TableCell>
                                    <TableCell><strong>Email:</strong> {client.email}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell><strong>Số Điện Thoại:</strong> {client.phone}</TableCell>
                                    <TableCell><strong>Địa chỉ:</strong> {client.address}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell><strong>Ngày sinh:</strong> {client.dob}</TableCell>
                                    <TableCell><strong>Giới tính:</strong> {client.gender}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell><strong>Quốc gia:</strong> {client.country}</TableCell>
                                    <TableCell><strong>Công ty:</strong> {client.company}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>

                              <h3>Thông tin lưu trữ</h3>
                              <Table className="detail-table">
                                <TableBody>
                                  <TableRow>
                                    <TableCell><strong>CCCD/Passport:</strong> {client.cccdPassport}</TableCell>
                                    <TableCell><strong>Số dư hiện tại:</strong> {client.balance}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell><strong>Ngày phát hành:</strong> {client.issueDate}</TableCell>
                                    <TableCell><strong>Số lần lưu trữ:</strong> {client.storageCount}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell><strong>Tình trạng lưu trữ:</strong> {client.storageStatus}</TableCell>
                                    <TableCell></TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </>
                          )}

                          <h3>Đặt phòng</h3>
                          {client.bookings.length > 0 ? (
                            <Table className="detail-table">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Mã đặt phòng</TableCell>
                                  <TableCell>Nguồn</TableCell>
                                  <TableCell>Ngày đặt</TableCell>
                                  <TableCell>Ngày nhận phòng</TableCell>
                                  <TableCell>Ngày trả phòng</TableCell>
                                  <TableCell>Tình trạng đặt phòng</TableCell>
                                  <TableCell>Tình trạng thanh toán</TableCell>
                                  <TableCell>Số tiền</TableCell>
                                  <TableCell>Ghi chú hóa đơn</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {client.bookings.map((booking) => (
                                  <TableRow key={booking.id}>
                                    <TableCell>{booking.code}</TableCell>
                                    <TableCell>{booking.source}</TableCell>
                                    <TableCell>{booking.bookingDate}</TableCell>
                                    <TableCell>{booking.checkInDate}</TableCell>
                                    <TableCell>{booking.checkOutDate}</TableCell>
                                    <TableCell>{booking.bookingStatus}</TableCell>
                                    <TableCell>{booking.paymentStatus}</TableCell>
                                    <TableCell>{booking.amount}</TableCell>
                                    <TableCell>{booking.note}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default Client;