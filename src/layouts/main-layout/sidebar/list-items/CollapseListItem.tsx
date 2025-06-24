// src/layouts/main-layout/sidebar/list-items/CollapseListItem.tsx
import React, { useState } from 'react';
import { MenuItem, SubMenuItem } from '../../../../routes/sitemap';
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
  items = [],
  icon,
  collapsed,
}: CollapseListItemProps) {
  const [open, setOpen] = useState(active);
  const handleClick = () => {
    if (!collapsed) setOpen(o => !o);
  };

  return (
    <Box sx={{ pb: 1 }}>
      {/* HEADER */}
      <ListItemButton
        disableRipple
        selected={active}
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 1.5,
          px: collapsed ? 1 : 2,
          borderRadius: 2,
          color: '#fff',

          // Active header: vàng đậm, chữ/icon trắng
          '&.Mui-selected': {
            bgcolor: '#FFB300',
            '& .MuiListItemIcon-root, & .MuiListItemText-root .MuiTypography-root': {
              color: '#fff !important',
            },
            // tắt hover trên header khi active
            '&:hover': { bgcolor: '#FFB300' },
          },

          // bỏ hover nền cho header khi chưa active
          '&:hover': {
            bgcolor: 'inherit',
            transform: 'none',
          },

          // icon
          '& .MuiListItemIcon-root': {
            minWidth: 0,
            justifyContent: 'center',
            color: '#fff',
            '& svg': { fontSize: '1.8rem' },
          },
          // header text
          '& .MuiListItemText-root .MuiTypography-root': {
            fontSize: '1rem',
            fontWeight: active ? 600 : 400,
            color: '#fff',
            ml: collapsed ? 0 : 2,
          },
        }}
      >
        <ListItemIcon>
          {icon && <IconifyIcon icon={icon} />}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText primary={subheader} primaryTypographyProps={{ variant: 'body1' }} />
        )}
        {!collapsed && items.length > 0 && (
          <IconifyIcon
            icon={open ? 'iconamoon:arrow-up-2-duotone' : 'iconamoon:arrow-down-2-duotone'}
            sx={{ color: '#fff', ml: 'auto', fontSize: '1.3rem' }}
          />
        )}
      </ListItemButton>

      {/* SUB-ITEMS */}
      {!collapsed && items.length > 0 && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {(items as SubMenuItem[]).map(route => (
              <ListItemButton
                key={route.pathName}
                component={Link}
                href={route.path}
                disableRipple
                selected={!!route.active}
                sx={{
                  ml: 2,
                  py: 1,
                  borderRadius: 2,
                  color: '#fff',

                  // Active sub-item: chỉ chữ vàng, giữ nền sidebar
                  '&.Mui-selected': {
                    bgcolor: 'inherit !important',
                    '& .MuiListItemText-root .MuiTypography-root': {
                      color: 'fff !important',
                      fontWeight: 500,
                    },
                  },

                  // bỏ hover
                  '&:hover': {
                    bgcolor: 'inherit !important',
                    transform: 'none',
                  },

                  // sub-item text
                  '& .MuiListItemText-root .MuiTypography-root': {
                    fontSize: '0.95rem',
                    fontWeight: route.active ? 500 : 400,
                    color: route.active ? '#FFB500' : '#fff',
                  },
                }}
              >
                <ListItemText primary={route.name} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
