import { useState } from "react";
import type { PropsWithChildren } from "react";
import Stack from "@mui/material/Stack";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
// import Footer from "./footer";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

//Tổng hợp của thanh menu

const MainLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh' }}>
    <Sidebar
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      setIsClosing={setIsClosing}
    />

    <Stack
      component="main"
      direction="column"
      flexGrow={1}
      width="100%"
      px={3}
    >
      <Topbar
        isClosing={isClosing}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <Outlet />
      {children}
      {/* <Footer /> */}
    </Stack>
  </Box>
  );
};

export default MainLayout;
