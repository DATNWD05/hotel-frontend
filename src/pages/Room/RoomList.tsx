import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Chip,
  Button,
  SelectChangeEvent
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface RoomType {
  id: number;
  name: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: 'available' | 'unavailable';
  floor: number;
  note?: string;
}

const statusOptions: Array<{ key: 'all' | 'available' | 'unavailable'; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'available', label: 'Phòng trống' },
  { key: 'unavailable', label: 'Phòng đóng' }
];

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'unavailable'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/room-types')
      .then((res) => {
        setRoomTypes(res.data.data || []);
      })
      .catch((error) => {
        console.error('Error fetching room types:', error);
      });

    api.get('/rooms')
      .then((res) => {
        setRooms(res.data.data || []);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
      });
  }, []);

  const handleTypeChange = (event: SelectChangeEvent<number | 'all'>) => {
    setSelectedType(event.target.value as number | 'all');
  };

  const handleStatusChange = (key: 'all' | 'available' | 'unavailable') => {
    setSelectedStatus(prev => (prev === key ? 'all' : key));
  };

  const filteredRooms = rooms.filter(r => (
    (selectedType === 'all' || r.room_type_id === selectedType) &&
    (selectedStatus === 'all' || r.status === selectedStatus) &&
    r.room_number.toLowerCase().includes(search.toLowerCase())
  ));

  // Group rooms by room type name
  const roomsByType = filteredRooms.reduce((acc, room) => {
    const roomType = roomTypes.find(rt => rt.id === room.room_type_id);
    const typeName = roomType?.name || 'Khác';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  // Sort room types alphabetically
  const sortedTypes = Object.keys(roomsByType).sort();

  const getStatusColor = (status: 'available' | 'unavailable') =>
    status === 'available' ? 'success.main' : 'error.main';

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Sơ đồ phòng</Typography>
        <Box>
          <TextField
            placeholder="Tìm kiếm"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 200, mr: 2 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/rooms/add')}
          >
            Thêm phòng
          </Button>
        </Box>
      </Box>

      <Box display="flex" alignItems="center" mb={2} gap={2}>
        <Typography>Loại phòng:</Typography>
        <Select
          value={selectedType}
          size="small"
          onChange={handleTypeChange}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          {roomTypes.map(rt => (
            <MenuItem key={rt.id} value={rt.id}>{rt.name}</MenuItem>
          ))}
        </Select>

        <Typography>Trạng thái phòng:</Typography>
        {statusOptions.map(opt => {
          const count = opt.key === 'all'
            ? filteredRooms.length
            : rooms.filter(r => r.status === opt.key).length;
          return (
            <Chip
              key={opt.key}
              label={opt.key === 'all' ? opt.label : `${opt.label} (${count})`}
              onClick={() => handleStatusChange(opt.key)}
              color={opt.key === selectedStatus ? 'primary' : 'default'}
              variant={opt.key === selectedStatus ? 'filled' : 'outlined'}
              clickable
            />
          );
        })}
      </Box>

      <Box display="flex" flexDirection="column" gap={3}>
        {sortedTypes.map(typeName => (
          <Box key={typeName}>
            <Typography variant="subtitle1" mb={1}>{typeName}</Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {roomsByType[typeName]
                .sort((a, b) => a.room_number.localeCompare(b.room_number))
                .map(room => (
                  <Box
                    key={room.id}
                    onClick={() => navigate(`/room/${room.id}`)}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: getStatusColor(room.status),
                      borderRadius: 1,
                      boxShadow: 1,
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4 }
                    }}
                  >
                    <Typography variant="h6">{room.room_number}</Typography>
                    <Typography variant="caption">{typeName}</Typography>
                    <CheckCircleIcon fontSize="small" sx={{ mt: 0.5 }} />
                  </Box>
                ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default RoomList;