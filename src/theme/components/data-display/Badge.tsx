import type { Theme } from '@mui/material/styles';
import type { Components } from '@mui/material/styles';

const Badge: Components<Omit<Theme, 'components'>>['MuiBadge'] = {
  styleOverrides: {
    root: {},
    badge: {
      top: 4,
      right: 4,
    },
  },
};

export default Badge;