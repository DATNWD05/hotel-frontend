import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Thử lại: refresh trang hiện tại hoặc quay về trang trước
    navigate(-1);
  };

  return (
    <Box
      sx={{
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h6" color="error" gutterBottom>
        Request failed with status code 403
      </Typography>
      <Button variant="contained" onClick={handleRetry}>
        Thử lại
      </Button>
    </Box>
  );
};

export default Unauthorized;
