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
    px: collapsed ? 1 : 2, // chỉnh lề 
    borderRadius: 2,
    bgcolor: active ? theme.palette.action.selected : 'transparent',
    color: '#fff',

    // Tăng kích thước icon
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      justifyContent: 'center',
      color: active ? '#FFD700' : '#fff',
      '& svg': {
        fontSize: '1.8rem', // tăng kích thước icon
        transition: 'transform 0.3s ease', // thêm hiệu ứng chuyển động
      },
    },

    // Tăng kích thước chữ
    '& .MuiListItemText-root': {
      ml: collapsed ? 0 : 2,
      '& .MuiTypography-body1': {    // để match variant body1 bên dưới
        fontSize: '1rem', // tăng kích thước chữ
        fontWeight: active ? 600 : 400, // đậm chữ nếu active
        color: active ? '#FFD700' : '#fff',
      },
    },

    '&:hover': {
      bgcolor: theme.palette.action.hover,
      transform: 'translateX(4px)',
      transition: 'all 0.2s ease',
    },
  }}
>
  <ListItemIcon>
    <IconifyIcon icon={icon} />
  </ListItemIcon>

  {!collapsed && (
    <ListItemText
      primary={label}
      primaryTypographyProps={{
        variant: 'body1',             // body1 để hook style lên đúng selector trên
        fontWeight: active ? 600 : 400,
        color: active ? '#FFD700' : '#fff',
      }}
    />
  )}
</ListItemButton>
  );
}
