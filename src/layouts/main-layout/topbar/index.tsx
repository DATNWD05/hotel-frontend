// src/layouts/main-layout/topbar/index.tsx
import React from 'react';
import { Box, IconButton, Paper, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import LanguageSelect from './LanguageSelect';
import ProfileMenu from './ProfileMenu';

interface TopbarProps {
  onToggleSidebar: () => void;
  collapsed: boolean;
  sidebarWidth: number;
  height: number;
}

export default function Topbar({ onToggleSidebar, sidebarWidth, height }: TopbarProps) {
  const theme = useTheme();

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
        px: 3,
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton size="large">
          <NotificationsNoneIcon />
        </IconButton>
        <IconButton size="large">
          <DarkModeOutlinedIcon />
        </IconButton>
        <IconButton size="large">
          <InfoOutlinedIcon />
        </IconButton>
        <LanguageSelect />
        <ProfileMenu />
      </Box>
    </Paper>
  );
}
