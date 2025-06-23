import React from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import LanguageSelect from './LanguageSelect';
import ProfileMenu from './ProfileMenu';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  return (
    <Paper
      component="header"
      elevation={3}
      square
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 1.5,
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        bgcolor: 'white',
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
