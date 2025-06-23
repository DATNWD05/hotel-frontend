// src/layouts/main-layout/sidebar/DrawerItems.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CollapseListItem from './list-items/CollapseListItem';
import DrawerItem from './list-items/DrawerItem';
import Image from '../../../components/base/Image';
import IconifyIcon from '../../../components/base/IconifyIcon';
import LogoImg from '../../../assets/images/logo.png';
import sitemap from '../../../routes/sitemap';
import { fontFamily } from '../../../theme/typography';

interface DrawerItemsProps {
  currentPath: string;
  collapsed: boolean;
}

export default function DrawerItems({ currentPath, collapsed }: DrawerItemsProps) {
  const navigate = useNavigate();

  const getFilteredMenu = () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return [];
    const roleId = JSON.parse(userJson).role_id;
    return roleId === 2
      ? sitemap.filter(item => item.id === 'oderRoom' || item.id === 'authentication')
      : sitemap;
  };

  const filteredMenu = getFilteredMenu();

  return (
    <>
      {/* Logo & Title */}
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
          )}
        </ButtonBase>
      </Stack>

      {/* Menu List */}
      <List component="nav" sx={{ mt: 3, mb: 10, px: collapsed ? 0 : 2 }}>
        {filteredMenu.map(route =>
          route.items ? (
            <CollapseListItem
              key={route.id}
              {...route}
              active={
                route.path === currentPath ||
                route.items.some(item => item.path === currentPath)
              }
              collapsed={collapsed}
            />
          ) : (
            <DrawerItem
              key={route.id}
              label={route.subheader}
              // fallback '' nếu route.icon undefined
              icon={route.icon ?? ''}
              path={route.path}
              active={route.path === currentPath}
              collapsed={collapsed}
            />
          )
        )}
      </List>

      {/* Logout Button */}
      <Box mt="auto" px={collapsed ? 1 : 3} pb={4} textAlign={collapsed ? 'center' : 'left'}>
        <Button
          variant="contained"
          fullWidth={!collapsed}
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
            px: collapsed ? 1 : undefined,
            minWidth: collapsed ? 'auto' : undefined,
            '&:hover': {
              bgcolor: '#E6C200',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {!collapsed && 'Đăng xuất'}
        </Button>
      </Box>
    </>
  );
}
