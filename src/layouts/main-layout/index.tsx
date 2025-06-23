import React, { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Box } from '@mui/material';
import Sidebar from './sidebar';
import Topbar from './topbar';
import { Outlet } from 'react-router-dom';

export default function MainLayout({ children }: PropsWithChildren) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh' }}>
      {/* Bạn không còn cần isClosing nữa */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
      />

      <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'grey.100' }}>
        <Topbar onToggleSidebar={handleToggleSidebar} />
        <Box sx={{ p: 3 }}>
          <Outlet />
          {children}
        </Box>
      </Box>
    </Box>
  );
}
