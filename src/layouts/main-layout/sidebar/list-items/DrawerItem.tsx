// src/layouts/main-layout/sidebar/list-items/DrawerItem.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import IconifyIcon from '../../../../components/base/IconifyIcon';

interface DrawerItemProps {
  label: string;
  icon: string;
  path?: string;
  active: boolean;
  collapsed: boolean;
}

export default function DrawerItem({
  label,
  icon,
  path = '/',
  active,
  collapsed,
}: DrawerItemProps) {
  const theme = useTheme();

  return (
    <ListItemButton
      component={RouterLink}
      to={path}
      selected={active}
      sx={{
        mb: 1,
        py: 1.5,
        px: collapsed ? 1 : 2,
        borderRadius: 2,

        // chỉ đổi nền khi selected, giữ icon/text trắng
        '&.Mui-selected': {
          bgcolor: '#FFB300',
        },
        '&.Mui-selected:hover': {
          bgcolor: '#FFB300',
        },

        // chung icon và text luôn trắng
        color: '#fff',
        '& .MuiListItemIcon-root, & .MuiListItemText-root': {
          color: '#fff !important',
        },

        // tăng kích thước icon
        '& .MuiListItemIcon-root svg': {
          fontSize: '1.8rem',
          transition: 'transform 0.2s ease',
        },

        // tăng kích thước chữ và ép trắng
        '& .MuiListItemText-root .MuiTypography-body1': {
          fontSize: '1rem',
          fontWeight: active ? 600 : 400,
          lineHeight: 1.2,
          color: '#fff !important',
        },

        '&:hover': {
          bgcolor: theme.palette.action.hover,
          transform: 'translateX(4px)',
          transition: 'all 0.2s ease',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
        <IconifyIcon icon={icon} />
      </ListItemIcon>

      {!collapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            variant: 'body1',
            // màu này thường bị CSS override, nên mình cũng set ở sx bên trên
            color: '#fff',
          }}
        />
      )}
    </ListItemButton>
  );
}
