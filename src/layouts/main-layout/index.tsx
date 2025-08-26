import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './sidebar';
import Topbar from './topbar';
import { Outlet } from 'react-router-dom';

const SIDEBAR_WIDTH = 280;
const COLLAPSED_WIDTH = 72;
const TOPBAR_HEIGHT = 64;

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const handleToggleSidebar = () => {
    if (isDesktop) {
      // Desktop: toggle collapse
      setCollapsed(prev => !prev);
    } else {
      // Mobile: mở Drawer
      setMobileOpen(prev => !prev);
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
      />

      {/* Nội dung */}
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
          sidebarWidth={isDesktop ? (collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH) : 0}
          height={TOPBAR_HEIGHT}
        />

        {/* Spacer tránh Topbar đè nội dung */}
        <Box sx={{ height: TOPBAR_HEIGHT }} />

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
