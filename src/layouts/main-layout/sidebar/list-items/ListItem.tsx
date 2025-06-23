import Link from '@mui/material/Link';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconifyIcon from '../../../../components/base/IconifyIcon';
import { MenuItem } from '../../../../routes/sitemap';

const ListItem = ({ subheader, icon, path, active }: MenuItem) => {
  return (
    <ListItemButton
      component={Link}
      href={path}
      sx={{
        mb: 1,
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
            fontSize="h4.fontSize"
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
    </ListItemButton>
  );
};

export default ListItem;