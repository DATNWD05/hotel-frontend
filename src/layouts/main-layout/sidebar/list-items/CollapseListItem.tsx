// src/layouts/main-layout/sidebar/list-items/CollapseListItem.tsx
import React, { useState } from 'react';
import { MenuItem } from '../../../../routes/sitemap';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Collapse from '@mui/material/Collapse';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import IconifyIcon from '../../../../components/base/IconifyIcon';

interface CollapseListItemProps extends MenuItem {
  active: boolean;
  collapsed: boolean;
}

export default function CollapseListItem({
  subheader,
  active,
  items,
  icon,
  collapsed,
}: CollapseListItemProps) {
  const [open, setOpen] = useState(active);

  const handleClick = () => {
    if (!collapsed) setOpen((prev) => !prev);
  };

  return (
    <Box sx={{ pb: 1 }}>
      <ListItemButton
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 1.5,
          px: collapsed ? 1 : 2,
          borderRadius: 2,
          bgcolor: active ? 'rgba(255,215,0,0.2)' : 'transparent',
          color: '#fff',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.1)',
            transform: 'translateX(4px)',
            transition: 'all 0.2s ease',
          },
          // Icon
          '& .MuiListItemIcon-root': {
            minWidth: 0,
            justifyContent: 'center',
            color: active ? '#FFD700' : '#fff',
            '& svg': {
              fontSize: '1.8rem', // tăng kích thước icon
              transition: 'transform 0.1s ease',
            },
            '&:hover svg': {
              transform: 'scale(1.1)',
            },
          },
          // Header text
          '& .MuiListItemText-root': {
            ml: collapsed ? 0 : 2,
            '& .MuiTypography-body1': {
              fontSize: '1rem',                // tăng cỡ chữ
              color: active ? '#FFD700' : '#fff',// chắc chắn màu vàng khi active
              fontWeight: active ? 600 : 400,
              lineHeight: 1.2,
            },
          },
        }}
      >
        <ListItemIcon>
          {icon && <IconifyIcon icon={icon} />}
        </ListItemIcon>

        {!collapsed && (
          <ListItemText
            primary={subheader}
            primaryTypographyProps={{
              variant: 'body1',
            }}
          />
        )}

        {!collapsed && (
          <IconifyIcon
            icon="iconamoon:arrow-down-2-duotone"
            sx={{
              color: active ? '#FFD700' : '#fff',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              ml: 'auto',
              fontSize: '1.3rem', // tăng kích thước mũi tên
              transition: 'transform 0.3s ease',
            }}
          />
        )}
      </ListItemButton>

      {!collapsed && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {items?.map((route) => (
              <ListItemButton
                key={route.pathName}
                component={Link}
                href={route.path}
                sx={{
                  ml: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: route.active ? 'rgba(255,215,0,0.15)' : 'transparent',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease',
                  '& .MuiListItemText-root': {
                    '& .MuiTypography-body1': {
                      fontSize: '1rem',
                      fontWeight: route.active ? 500 : 400,
                      color: route.active ? '#FFD700' : '#fff',
                    },
                  },
                }}
              >
                <ListItemText
                  primary={route.name}
                  primaryTypographyProps={{
                    variant: 'body1',
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
