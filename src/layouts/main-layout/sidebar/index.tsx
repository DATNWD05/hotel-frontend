import React from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import DrawerItems from './DrawerItems';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapsed: boolean;
}

const SIDEBAR_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

export default function Sidebar({
  mobileOpen,
  setMobileOpen,
  collapsed,
}: SidebarProps) {
  const location = useLocation();

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box
      component="nav"
      width={{ lg: collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      flexShrink={{ lg: 0 }}
      sx={{
        bgcolor: 'background.paper',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        transition: theme =>
          theme.transitions.create('width', { duration: theme.transitions.duration.standard }),
      }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            bgcolor: '#1A2A44',
            color: '#fff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DrawerItems currentPath={location.pathname} collapsed={false} />
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            bgcolor: '#1A2A44',
            color: '#fff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
            borderRight: 'none',
            overflowX: 'hidden',
            transition: theme =>
              theme.transitions.create('width', { duration: theme.transitions.duration.standard }),
          },
        }}
      >
        <DrawerItems currentPath={location.pathname} collapsed={collapsed} />
      </Drawer>
    </Box>
  );
}
