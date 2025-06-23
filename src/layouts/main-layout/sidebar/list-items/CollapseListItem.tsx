import { useState } from 'react';
import { MenuItem } from '../../../../routes/sitemap';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Collapse from '@mui/material/Collapse';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import IconifyIcon from '../../../../components/base/IconifyIcon';

const CollapseListItem = ({ subheader, active, items, icon }: MenuItem) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ pb: 1 }}>
      <ListItemButton
        onClick={handleClick}
        sx={{
          py: 1.5,
          px: 3,
          borderRadius: 2,
          bgcolor: active ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
          color: '#fff',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(4px)',
            transition: 'all 0.2s ease',
          },
        }}
      >
        <ListItemIcon>
          {icon && (
            <IconifyIcon
              icon={icon}
              sx={{
                color: active ? '#FFD700' : '#fff',
              }}
            />
          )}
        </ListItemIcon>
        <ListItemText
          primary={subheader}
          sx={{
            '& .MuiListItemText-primary': {
              fontWeight: active ? 600 : 400,
              fontSize: '0.95rem',
              color: active ? '#FFD700' : '#fff',
            },
          }}
        />
        <IconifyIcon
          icon="iconamoon:arrow-down-2-duotone"
          sx={{
            color: active ? '#FFD700' : '#fff',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        />
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {items?.map((route) => (
            <ListItemButton
              key={route.pathName}
              component={Link}
              href={route.path}
              sx={{
                ml: 4,
                py: 1,
                borderRadius: 2,
                bgcolor: route.active ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                color: '#fff',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateX(4px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemText
                primary={route.name}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.9rem',
                    fontWeight: route.active ? 500 : 400,
                    color: route.active ? '#FFD700' : '#fff',
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </Box>
  );
};

export default CollapseListItem;