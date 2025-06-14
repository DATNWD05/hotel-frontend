import { fontFamily } from '../../../theme/typography';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ListItem from './list-items/ListItem';
import CollapseListItem from './list-items/CollapseListItem';
import Image from '../../../components/base/Image';
import IconifyIcon from '../../../components/base/IconifyIcon';
import LogoImg from '../../../assets/images/logo.png';
import sitemap from '../../../routes/sitemap';
import { useNavigate } from 'react-router-dom';

interface DrawerItemsProps {
  currentPath: string;
}

const DrawerItems = ({ currentPath }: DrawerItemsProps) => {
  const navigate = useNavigate();

  const getFilteredMenu = () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return [];

    const roleId = JSON.parse(userJson).role_id;

    if (roleId === 2) {
      return sitemap.filter((item) => item.id === 'oderRoom' || item.id === 'authentication');
    }

    return sitemap;
  };

  const filteredMenu = getFilteredMenu();

  return (
    <>
      <Stack
        pt={4}
        pb={3}
        px={3}
        position="sticky"
        top={0}
        bgcolor="#1A2A44"
        alignItems="center"
        justifyContent="center"
        borderBottom={1}
        borderColor="rgba(255, 255, 255, 0.2)"
        zIndex={1000}
      >
        <ButtonBase component={Link} href="/" disableRipple>
          <Image src={LogoImg} alt="logo" height={60} width={60} sx={{ mr: 1.5 }} />
          <Box>
            <Typography
              variant="h4"
              color="#FFD700"
              textTransform="uppercase"
              letterSpacing={1.5}
              fontFamily={fontFamily.poppins}
              fontWeight={700}
            >
             Hotel Hobilo
            </Typography>
          </Box>
        </ButtonBase>
      </Stack>

      <List component="nav" sx={{ mt: 3, mb: 10, px: 2 }}>
        {filteredMenu.map((route) =>
          route.items ? (
            <CollapseListItem
              key={route.id}
              {...route}
              active={route.path === currentPath || route.items.some((item) => item.path === currentPath)}
            />
          ) : (
            <ListItem key={route.id} {...route} active={route.path === currentPath} />
          )
        )}
      </List>

      <Box mt="auto" px={3} pb={4}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<IconifyIcon icon="ic:baseline-logout" />}
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }}
          sx={{
            bgcolor: '#FFD700',
            color: '#1A2A44',
            fontWeight: 600,
            borderRadius: 2,
            py: 1.5,
            '&:hover': {
              bgcolor: '#E6C200',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Đăng xuất
        </Button>
      </Box>
    </>
  );
};

export default DrawerItems;