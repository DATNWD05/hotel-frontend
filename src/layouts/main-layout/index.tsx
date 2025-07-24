import React, { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './sidebar';
import Topbar from './topbar';
import { Outlet } from 'react-router-dom';

const SIDEBAR_WIDTH = 280;
const COLLAPSED_WIDTH = 72;
const TOPBAR_HEIGHT = 64;

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          collapsed={collapsed}
          sidebarWidth={collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH}
          height={TOPBAR_HEIGHT}
        />

        {/* Spacer để đẩy nội dung xuống tránh bị che */}
        <Box sx={{ height: TOPBAR_HEIGHT }} />

        {/* Nội dung trang */}
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}