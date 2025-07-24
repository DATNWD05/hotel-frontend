// src/layouts/main-layout/sidebar/DrawerItems.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CollapseListItem from './list-items/CollapseListItem';
import DrawerItem from './list-items/DrawerItem';
import Image from '../../../components/base/Image';
import LogoImg from '../../../assets/images/logo.png';
import sitemap, { MenuItem, SubMenuItem } from '../../../routes/sitemap';
import { fontFamily } from '../../../theme/typography';

export default function DrawerItems({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Bật cờ active cho từng route và item con dựa trên current URL (pathname)
  const processedMenu = React.useMemo<MenuItem[]>(() => {
    return sitemap.map(route => {
      const isParentActive =
        route.path === pathname ||
        !!route.items?.some(item => item.path === pathname);

      const items = route.items?.map((item: SubMenuItem) => ({
        ...item,
        active: item.path === pathname,
      }));

      return {
        ...route,
        active: isParentActive,
        items,
      };
    });
  }, [pathname]); 

  return (
    <>
      {/* Logo */}
      <Stack
        pt={4}
        pb={3}
        px={collapsed ? 1 : 3}
        position="sticky"
        top={0}
        bgcolor="#1A2A44"
        alignItems={collapsed ? 'center' : 'flex-start'}
        justifyContent="center"
        borderBottom={1}
        borderColor="rgba(255, 255, 255, 0.2)"
        zIndex={1000}
      >
        <ButtonBase
          component={Link}
          href="/"
          disableRipple
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%',
          }}
        >
          <Image
            src={LogoImg}
            alt="logo"
            height={collapsed ? 40 : 60}
            width={collapsed ? 40 : 60}
            sx={{ mr: collapsed ? 0 : 1.5 }}
          />
          {!collapsed && (
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
          )}
        </ButtonBase>
      </Stack>

      {/* Menu */}
      <List component="nav" sx={{ mt: 3, mb: 10, px: collapsed ? 0 : 2 }}>
        {processedMenu.map(route =>
          route.items && route.items.length > 0 ? (
<CollapseListItem
              key={route.id}
              id={route.id}
              subheader={route.subheader}
              icon={route.icon!}
              items={route.items}
              active={route.active!}
              collapsed={collapsed}
            />
          ) : (
            <DrawerItem
              key={route.id}
              label={route.subheader}
              icon={route.icon!}
              path={route.path}
              active={!!route.active}
              collapsed={collapsed}
            />
          )
        )}
      </List>
    </>
  );
}