import type { Components, Theme } from '@mui/material/styles';


const Toolbar: Components<Omit<Theme, 'components'>>['MuiToolbar'] = {
  styleOverrides: {
    root: {
      padding: '0 !important',
    },
  },
};

export default Toolbar;