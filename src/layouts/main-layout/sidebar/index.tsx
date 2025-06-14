import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import DrawerItems from './DrawerItems';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsClosing: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ mobileOpen, setMobileOpen, setIsClosing }: SidebarProps) => {
  const location = useLocation();
  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  return (
    <Box
      component="nav"
      width={{ lg: 280 }}
      flexShrink={{ lg: 0 }}
      sx={{
        bgcolor: 'background.paper',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        display: { xs: 'none', lg: 'block' },
        transition: 'width 0.3s ease',
      }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: '#1A2A44',
            color: '#fff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DrawerItems currentPath={location.pathname} />
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: '#1A2A44',
            color: '#fff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
            borderRight: 'none',
          },
        }}
        open
      >
        <DrawerItems currentPath={location.pathname} />
      </Drawer>
    </Box>
  );
};

export default Sidebar;