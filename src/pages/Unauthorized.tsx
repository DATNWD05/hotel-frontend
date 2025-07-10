import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
      <Typography variant="h4" color="error" gutterBottom>
        Không có quyền truy cập
      </Typography>
      <Typography variant="body1" gutterBottom>
        Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Quay về trang chủ
      </Button>
    </Box>
  );
};

export default Unauthorized;