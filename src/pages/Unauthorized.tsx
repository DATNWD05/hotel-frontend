import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Box textAlign="center" mt={10}>
      <Typography variant="h3" gutterBottom>
        403 - Không có quyền truy cập
      </Typography>
      <Typography variant="body1" mb={4}>
        Bạn không có quyền truy cập vào trang này. Vui lòng quay lại trang chính.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate("/")}
      >
        Quay về Dashboard
      </Button>
    </Box>
  );
};

export default Unauthorized;
