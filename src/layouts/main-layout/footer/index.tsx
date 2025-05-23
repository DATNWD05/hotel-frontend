import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

const Footer = () => {
  return (
    <Typography
      mt={0.5}
      py={3}
      color="text.secondary"
      variant="body2"
      sx={{ textAlign: 'center' }}
      letterSpacing={0.5}
      fontWeight={500}
    >
      Made with ❤️{' '}
      <Link href="https://themewagon.com/" target="_blank" rel="noreferrer">
        ThemeWagon
      </Link>
    </Typography>
  );
};

export default Footer;