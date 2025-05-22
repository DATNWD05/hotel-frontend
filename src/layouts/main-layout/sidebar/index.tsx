import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import DrawerItems from './DrawerItems'; // Giữ nguyên vì cùng thư mục

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsClosing: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ mobileOpen, setMobileOpen, setIsClosing }: SidebarProps) => {
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
      width={{ lg: 300 }}
      flexShrink={{ lg: 0 }}
      display={{ xs: 'none', lg: 'block' }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' } }}
      >
        <DrawerItems />
      </Drawer>

      {/* Desktop drawer */}
      <Drawer variant="permanent" sx={{ display: { xs: 'none', lg: 'block' } }} open>
        <DrawerItems />
      </Drawer>
    </Box>
  );
};

export default Sidebar;
