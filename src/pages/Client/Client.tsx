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
import { SelectChangeEvent } from '@mui/material/Select';
import '../../css/Client.css';
import api from '../../api/axios';

interface Client {
  id: number; // Đổi thành number
  cccd: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  note: string;
  bookings: {
    id: number; // Đổi thành number
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
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  cccd?: string;
  note?: string;
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

        const response = await api.get('/customers');

        if (response.status === 200) {
          let users: Client[] = Array.isArray(response.data)
            ? response.data
            : response.data.clients || [];

          users = users.map((user) => ({
            id: Number(user.id) || 0, // Chuyển id từ string sang number
            cccd: user.cccd || 'Không xác định',
            name: user.name || 'Không xác định',
            email: user.email || 'Không xác định',
            phone: user.phone || 'Không xác định',
            address: user.address || 'Không xác định',
            date_of_birth: user.date_of_birth || 'Không xác định',
            gender: user.gender || 'Không xác định',
            nationality: user.nationality || 'Không xác định',
            note: user.note || '',
            bookings: user.bookings
              ? user.bookings.map((booking) => ({
                  ...booking,
                  id: Number(booking.id) || 0, // Chuyển id của booking sang number
                }))
              : [],
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

  const validateForm = (data: Client): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Họ tên không được để trống';
    else if (data.name.length > 50) errors.name = 'Họ tên không được vượt quá 50 ký tự';
    if (!data.email.trim()) errors.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email không hợp lệ';
    if (!data.phone.trim()) errors.phone = 'Số điện thoại không được để trống';
    else if (!/^\d{10,11}$/.test(data.phone)) errors.phone = 'Số điện thoại không hợp lệ';
    if (!data.address.trim()) errors.address = 'Địa chỉ không được để trống';
    if (!data.date_of_birth.trim()) errors.date_of_birth = 'Ngày sinh không được để trống';
    if (!data.gender) errors.gender = 'Vui lòng chọn giới tính';
    if (!data.nationality.trim()) errors.nationality = 'Quốc gia không được để trống';
    if (!data.cccd.trim()) errors.cccd = 'CCCD không được để trống';
    else if (!/^\d{12}$/.test(data.cccd)) errors.cccd = 'CCCD phải là dãy số gồm 12 chữ số';
    if (data.note && data.note.length > 200) errors.note = 'Ghi chú không được vượt quá 200 ký tự';
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

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name && editFormData) {
      const updatedData = { ...editFormData, [name]: value };
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClientId(client.id);
    setEditClientId(client.id);
    setEditFormData({ ...client });
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
      const response = await api.put(`/customers/${editFormData.id}`, editFormData);
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
                                    name="date_of_birth"
                                    type="date"
                                    value={editFormData.date_of_birth}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    error={!!validationErrors.date_of_birth}
                                    helperText={validationErrors.date_of_birth}
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
                                    name="nationality"
                                    value={editFormData.nationality}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.nationality}
                                    helperText={validationErrors.nationality}
                                  />
                                  <TextField
                                    label="CCCD"
                                    name="cccd"
                                    value={editFormData.cccd}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.cccd}
                                    helperText={validationErrors.cccd || "Ví dụ: 123456789012"}
                                  />
                                </Box>
                                <Box display="flex" gap={2}>
                                  <TextField
                                    label="Ghi chú"
                                    name="note"
                                    value={editFormData.note}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    error={!!validationErrors.note}
                                    helperText={validationErrors.note || "Tối đa 200 ký tự"}
                                  />
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
                                    <TableCell><strong>Ngày sinh:</strong> {client.date_of_birth}</TableCell>
                                    <TableCell><strong>Giới tính:</strong> {client.gender}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell><strong>Quốc gia:</strong> {client.nationality}</TableCell>
                                    <TableCell><strong>CCCD:</strong> {client.cccd}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell colSpan={2}><strong>Ghi chú:</strong> {client.note}</TableCell>
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