import type { Components, Theme } from '@mui/material/styles';


const List: Components<Omit<Theme, 'components'>>['MuiList'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(1),
    }),
  },
};

export default List;