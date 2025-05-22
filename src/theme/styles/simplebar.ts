import type { Theme } from '@mui/material/styles';


const simplebar = (theme: Theme) => ({
  '& .simplebar-track': {
    '&.simplebar-vertical': {
      '& .simplebar-scrollbar': {
        '&:before': {
          backgroundColor: theme.palette.grey[300],
        },
        '&.simplebar-visible': {
          '&:before': {
            opacity: 1,
          },
        },
      },
    },
  },
});

export default simplebar;
