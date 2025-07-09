import React from "react";
import { useLocation } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import CollapseListItem from "./list-items/CollapseListItem";
import DrawerItem from "./list-items/DrawerItem";
import Image from "../../../components/base/Image";
import IconifyIcon from "../../../components/base/IconifyIcon";
import LogoImg from "../../../assets/images/logo.png";
import sitemap, { MenuItem, SubMenuItem } from "../../../routes/sitemap";
import { fontFamily } from "../../../theme/typography";

export default function DrawerItems({ collapsed }: { collapsed: boolean }) {
  const { pathname } = useLocation();

  const isAuthenticated = !!localStorage.getItem("auth_token");

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const roleId = user?.role_id;

  // Bật cờ active cho từng route và item con dựa trên current URL (pathname)
  const processedMenu = React.useMemo<MenuItem[]>(() => {
    return sitemap.map((route) => {
      const isParentActive =
        route.path === pathname ||
        !!route.items?.some((item) => item.path === pathname);

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
        alignItems={collapsed ? "center" : "flex-start"}
        justifyContent="center"
        borderBottom={1}
        borderColor="rgba(255, 255, 255, 0.2)"
        zIndex={1000}
      >
        <ButtonBase
          component={RouterLink}
          to="/"
          disableRipple
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            width: "100%",
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
        {processedMenu
          .filter((route) => {
            if (!isAuthenticated) return route.id === "authentication";

            if (roleId === 1) return true; // ✅ admin: hiển thị tất cả

            // ❌ role khác: chỉ hiển thị 3 mục
            return ["Room", "listbookings", "account"].includes(route.id);
          })
          .map((route) =>
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

      {/* Logout */}
      {isAuthenticated && (
        <Box
          mt="auto"
          px={collapsed ? 1 : 3}
          pb={4}
          textAlign={collapsed ? "center" : "left"}
        >
          <Button
            variant="contained"
            fullWidth={!collapsed}
            startIcon={<IconifyIcon icon="ic:baseline-logout" />}
            onClick={() => {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            sx={{
              bgcolor: "#FFD700",
              color: "#1A2A44",
              fontWeight: 600,
              borderRadius: 2,
              py: 1.5,
              px: collapsed ? 1 : undefined,
              "&:hover": {
                bgcolor: "#E6C200",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            {!collapsed && "Đăng xuất"}
          </Button>
        </Box>
      )}
    </>
  );
}
