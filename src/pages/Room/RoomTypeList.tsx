import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface RoomType {
  id: number;
  name: string;
}

const RoomTypeList: React.FC = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/room-types')
      .then((res) => {
        setRoomTypes(res.data.data || []);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching room types:', error);
        setError('Không thể tải danh sách loại phòng. Vui lòng thử lại.');
      });
  }, []);

  const filteredRoomTypes = roomTypes.filter(rt =>
    rt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Danh sách loại phòng
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Tìm kiếm loại phòng"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/room-types/add')}
          >
            Thêm loại phòng
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {filteredRoomTypes.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          Không tìm thấy loại phòng nào.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredRoomTypes
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(roomType => (
              <Grid item xs={12} sm={6} md={4} key={roomType.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.02)', boxShadow: 6 }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {roomType.name}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/room-types/${roomType.id}`)}
                    >
                      Xem chi tiết
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}
    </Paper>
  );
};

export default RoomTypeList;