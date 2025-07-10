import React, { useState } from 'react';
import { Box, IconButton, Paper, useTheme, Menu, MenuItem, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../../contexts/AuthContext'; // Import useAuth từ AuthContext

interface TopbarProps {
  onToggleSidebar: () => void;
  collapsed: boolean;
  sidebarWidth: number;
  height: number;
}

export default function Topbar({ onToggleSidebar, sidebarWidth, height }: TopbarProps) {
  const theme = useTheme();
  const { user, logout } = useAuth(); // Lấy user và logout từ AuthContext
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout(); // Gọi hàm logout từ AuthContext
    handleClose();
  };

  return (
    <Paper
      component="header"
      elevation={3}
      square
      sx={{
        position: 'fixed',
        top: 0,
        left: sidebarWidth,
        right: 0,
        height: height,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'white',
        zIndex: theme.zIndex.appBar,
      }}
    >
      {/* Nút toggle sidebar */}
      <IconButton size="large" onClick={onToggleSidebar}>
        <MenuIcon />
      </IconButton>

      {/* Các control bên phải */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton size="large">
          <NotificationsNoneIcon />
        </IconButton>
        <IconButton size="large">
          <DarkModeOutlinedIcon />
        </IconButton>
        <IconButton size="large">
          <InfoOutlinedIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">
            {user ? user.name : 'Khách'} {/* Hiển thị tên người dùng hoặc 'Khách' */}
          </Typography>
          <IconButton
            size="large"
            onClick={handleClick}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleClose}>Hồ sơ</MenuItem>
            <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
}