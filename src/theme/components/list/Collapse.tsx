import type { Components, Theme } from '@mui/material/styles';


const Collapse: Components<Omit<Theme, 'components'>>['MuiCollapse'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(0, 2),

      '& .MuiList-root': {
        padding: 0,
        margin: theme.spacing(1, 0),
      },
    }),
  },
};

export default Collapse;