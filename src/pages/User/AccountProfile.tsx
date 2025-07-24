/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import api from "../../api/axios";
import "../../css/AccountProfile.css";

interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  gender?: string;
  address?: string;
  department?: string;
  language?: string;
}

export default function AccountProfile() {
  const [user, setUser] = useState<Employee | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/me");
      setUser(res.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu nhân viên:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Cập nhật avatar nếu có
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        await api.post(`/users/${user.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Cập nhật thông tin nhân viên
      await api.put(`/employees/${user.id}`, {
        name: user.name,
        phone: user.phone,
        address: user.address,
      });

      setSnackbar({ open: true, message: "Cập nhật thành công!", severity: "success" });
      fetchUser();
    } catch (err) {
      setSnackbar({ open: true, message: "Cập nhật thất bại!", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="account-wrapper">
      <Typography variant="h5" fontWeight={700} mb={3}>
        Tài khoản
      </Typography>

      <Box className="account-layout">
        {/* Thông tin cá nhân */}
        <Paper className="account-info-card" elevation={1}>
          <Typography fontWeight={600} mb={2}>
            Thông tin cá nhân
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Họ và tên"
              value={user?.name || ""}
              onChange={(e) => setUser((prev) => prev && { ...prev, name: e.target.value })}
            />
            <TextField label="Địa chỉ email" value={user?.email || ""} disabled />
            <TextField
              label="Số điện thoại"
              value={user?.phone || ""}
              onChange={(e) => setUser((prev) => prev && { ...prev, phone: e.target.value })}
            />
            <TextField
              label="Địa chỉ"
              value={user?.address || ""}
              onChange={(e) => setUser((prev) => prev && { ...prev, address: e.target.value })}
            />
            <TextField label="Phòng ban" value={user?.department || ""} disabled />
            <TextField label="Ngôn ngữ" value="Tiếng Việt" disabled />
          </Box>
          <Box mt={3}>
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Lưu thay đổi"}
            </Button>
          </Box>
        </Paper>

        {/* Ảnh đại diện */}
        <Paper className="account-avatar-card" elevation={1}>
          <Typography fontWeight={600} mb={2}>
            Ảnh đại diện
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Avatar
              src={preview || (user?.avatar ? `/storage/${user.avatar}` : "")}
              sx={{ width: 100, height: 100, fontSize: 40 }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Button variant="outlined" component="label">
              Tải ảnh lên
              <input hidden type="file" accept="image/*" onChange={handleFileChange} />
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity as never}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
