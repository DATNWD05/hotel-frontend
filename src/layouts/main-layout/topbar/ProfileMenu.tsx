import { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconifyIcon from 'components/base/IconifyIcon';
import ProfileImage from 'assets/images/profile.png';

// Icon hình thằng người

interface MenuItems {
  id: number;
  title: string;
  icon: string;
}

const menuItems: MenuItems[] = [
  {
    id: 1,
    title: 'View Profile',
    icon: 'ic:outline-account-circle',
  },
  {
    id: 2,
    title: 'Account Settings',
    icon: 'ic:outline-manage-accounts',
  },
  {
    id: 3,
    title: 'Notifications',
    icon: 'ic:outline-notifications-none',
  },
  {
    id: 4,
    title: 'Switch Account',
    icon: 'ic:outline-switch-account',
  },
  {
    id: 5,
    title: 'Help Center',
    icon: 'ic:outline-contact-support',
  },
  {
    id: 6,
    title: 'Logout',
    icon: 'ic:baseline-logout',
  },
];

const ProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <ButtonBase
        sx={{ ml: 1 }}
        onClick={handleProfileClick}
        aria-controls={open ? 'account-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        disableRipple
      >
        <Avatar
          src={ProfileImage}
          sx={{
            height: 44,
            width: 44,
            bgcolor: 'primary.main',
          }}
        />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        sx={{
          mt: 1.5,
          '& .MuiList-root': {
            p: 0,
            width: 230,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box p={1}>
          <MenuItem onClick={handleProfileMenuClose} sx={{ '&:hover': { bgcolor: 'info.dark' } }}>
            <Avatar src={ProfileImage} sx={{ mr: 1, height: 42, width: 42 }} />
            <Stack direction="column">
              <Typography variant="body2" color="text.primary" fontWeight={600}>
                Alex Manda
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={400}>
                alex@example.com
              </Typography>
            </Stack>
          </MenuItem>
        </Box>

        <Divider sx={{ my: 0 }} />

        <Box p={1}>
          {menuItems.map((item) => {
            return (
              <MenuItem key={item.id} onClick={handleProfileMenuClose} sx={{ py: 1 }}>
                <ListItemIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'h5.fontSize' }}>
                  <IconifyIcon icon={item.icon} />
                </ListItemIcon>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {item.title}
                </Typography>
              </MenuItem>
            );
          })}
        </Box>
      </Menu>
    </>
  );
};

export default ProfileMenu;
