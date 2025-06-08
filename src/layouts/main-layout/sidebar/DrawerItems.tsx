import { fontFamily } from "../../../theme/typography";
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ListItem from './list-items/ListItem';
import CollapseListItem from './list-items/CollapseListItem';
import Image from "../../../components/base/Image";
import IconifyIcon from '../../../components/base/IconifyIcon';
import LogoImg from "../../../assets/images/logo.png";
import sitemap from "../../../routes/sitemap";
import { useNavigate } from "react-router-dom";

const DrawerItems = () => {
  const navigate = useNavigate();
  // 👇 Lọc menu theo role_id
  const getFilteredMenu = () => {
    const userJson = localStorage.getItem("user");
    if (!userJson) return [];

    const roleId = JSON.parse(userJson).role_id;

    if (roleId === 2) {
      return sitemap.filter((item) => item.id === "oderRoom" || item.id === "authentication");
    }

    return sitemap;
  };

  const filteredMenu = getFilteredMenu();

  return (
    <>
      <Stack
        pt={5}
        pb={3.5}
        px={4.5}
        position="sticky"
        top={0}
        bgcolor="info.light"
        alignItems="center"
        justifyContent="flex-start"
        borderBottom={1}
        borderColor="info.main"
        zIndex={1000}
      >
        <ButtonBase component={Link} href="/" disableRipple>
          <Image src={LogoImg} alt="logo" height={52} width={52} sx={{ mr: 1.75 }} />
          <Box>
            <Typography
              mt={0.25}
              variant="h3"
              color="primary.main"
              textTransform="uppercase"
              letterSpacing={1}
              fontFamily={fontFamily.poppins}
            >
              Venus
            </Typography>
            <Typography
              mt={-0.35}
              variant="body2"
              color="primary.main"
              textTransform="uppercase"
              fontWeight={500}
              fontFamily={fontFamily.poppins}
            >
              Dashboard
            </Typography>
          </Box>
        </ButtonBase>
      </Stack>

      <List component="nav" sx={{ mt: 2.5, mb: 10, px: 4.5 }}>
        {filteredMenu.map((route) =>
          route.items ? (
            <CollapseListItem key={route.id} {...route} />
          ) : (
            <ListItem key={route.id} {...route} />
          )
        )}
      </List>

      <Box mt="auto" px={3} pb={6}>
  <Button
    variant="text"
    startIcon={<IconifyIcon icon="ic:baseline-logout" />}
    onClick={() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }}
  >
    Log Out
  </Button>
</Box>

    </>
  );
};

export default DrawerItems;
