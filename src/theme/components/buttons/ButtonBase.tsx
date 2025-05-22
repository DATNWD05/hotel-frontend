import type { Components, Theme } from '@mui/material/styles';

const ButtonBase: Components<Omit<Theme, 'components'>>['MuiButtonBase'] = {
  defaultProps: {
    disableRipple: false,
  },
  styleOverrides: {
    root: {
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  },
};

export default ButtonBase;