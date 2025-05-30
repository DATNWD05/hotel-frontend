import type { Theme } from '@mui/material/styles';


const scrollbar = (theme: Theme) => ({
  '@supports (-moz-appearance:none)': {
    scrollbarColor: `${theme.palette.grey[300]} transparent`,
  },
  '*::-webkit-scrollbar': {
    width: 5,
    height: 5,
    WebkitAppearance: 'none',
    backgroundColor: 'transparent',
    visibility: 'hidden',
  },
  '*::-webkit-scrollbar-track': {
    marginTop: 120,
  },
  '*::-webkit-scrollbar-thumb': {
    borderRadius: 3,
    backgroundColor: theme.palette.info.dark,
    visibility: 'hidden',
  },
});

export default scrollbar;
