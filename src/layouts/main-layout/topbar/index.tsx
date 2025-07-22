import React, { useState } from 'react';
import {
  Box, IconButton, Paper, useTheme, Menu, MenuItem,
  Typography, Avatar
} from '@mui/material';
import { Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAuth } from '../../../contexts/AuthContext';

interface TopbarProps {
  onToggleSidebar: () => void;
  collapsed: boolean;
  sidebarWidth: number;
  height: number;
}

const DEFAULT_AVATAR = '/default-avatar.png';

export default function Topbar({ onToggleSidebar, sidebarWidth, height }: TopbarProps) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { logout(); handleClose(); };

  const avatarSrc = user?.avatarUrl || DEFAULT_AVATAR;

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
        height,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'white',
        zIndex: theme.zIndex.appBar,
      }}
    >
      <IconButton size="large" onClick={onToggleSidebar}>
        <MenuIcon />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton size="large"><NotificationsNoneIcon /></IconButton>
        <IconButton size="large"><DarkModeOutlinedIcon /></IconButton>
        <IconButton size="large"><InfoOutlinedIcon /></IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">{user?.name || 'Khách'}</Typography>
          <IconButton size="large" onClick={handleClick} color="inherit" sx={{ p: 0.5 }}>
            <Avatar
              src={avatarSrc}
              sx={{ width: 32, height: 32 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleClose} component={Link} to="/profile">Hồ sơ</MenuItem>
            <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
}
