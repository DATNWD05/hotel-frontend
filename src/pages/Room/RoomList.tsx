import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
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
  status: 'available' | 'booked' | 'cleaning' | 'maintenance';
  note?: string;
}

const statusOptions: Array<{ key: 'all' | 'available' | 'booked' | 'cleaning' | 'maintenance'; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'available', label: 'Phòng trống' },
  { key: 'booked', label: 'Đã đặt' },
  { key: 'cleaning', label: 'Đang dọn' },
  { key: 'maintenance', label: 'Bảo trì' },
];

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'booked' | 'cleaning' | 'maintenance'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/room-types')
      .then((res) => {
        setRoomTypes(res.data.data || []);
      })
      .catch((error) => {
        console.error('Error fetching room types:', error);
      });

    api
      .get('/rooms')
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

  const handleStatusChange = (key: 'all' | 'available' | 'booked' | 'cleaning' | 'maintenance') => {
    setSelectedStatus((prev) => (prev === key ? 'all' : key));
  };

  const filteredRooms = rooms.filter((r) => (
    (selectedType === 'all' || r.room_type_id === selectedType) &&
    (selectedStatus === 'all' || r.status === selectedStatus) &&
    r.room_number.toLowerCase().includes(search.toLowerCase())
  ));

  const roomsByType = filteredRooms.reduce((acc, room) => {
    const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
    const typeName = roomType?.name || 'Khác';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  const sortedTypes = Object.keys(roomsByType).sort();

  const getStatusColor = (status: 'available' | 'booked' | 'cleaning' | 'maintenance') => {
    switch (status) {
      case 'available':
        return '#28A745'; // Soft green
      case 'booked':
        return '#DC3545'; // Muted red
      case 'cleaning':
        return '#FFC107'; // Warm yellow
      case 'maintenance':
        return '#17A2B8'; // Teal blue
      default:
        return '#6C757D'; // Default gray
    }
  };

  return (
    <Paper sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ color: '#333333', fontWeight: 600 }}>
          Sơ đồ phòng
        </Typography>
        <Box>
          <TextField
            placeholder="Tìm kiếm"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 200,
              mr: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: '#FFFFFF',
              },
              '& .MuiInputBase-input': { color: '#333333' },
            }}
          />
        </Box>
      </Box>

      <Box display="flex" alignItems="center" mb={2} gap={2}>
        <Typography sx={{ color: '#333333' }}>Loại phòng:</Typography>
        <Select
          value={selectedType}
          size="small"
          onChange={handleTypeChange}
          sx={{
            minWidth: 120,
            borderRadius: '8px',
            bgcolor: '#FFFFFF',
            '& .MuiSelect-select': { color: '#333333' },
          }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          {roomTypes.map((rt) => (
            <MenuItem key={rt.id} value={rt.id}>
              {rt.name}
            </MenuItem>
          ))}
        </Select>

        <Typography sx={{ color: '#333333' }}>Trạng thái phòng:</Typography>
        {statusOptions.map((opt) => {
          const count = opt.key === 'all'
            ? filteredRooms.length
            : rooms.filter((r) => r.status === opt.key).length;
          return (
            <Chip
              key={opt.key}
              label={opt.key === 'all' ? opt.label : `${opt.label} (${count})`}
              onClick={() => handleStatusChange(opt.key)}
              color={opt.key === selectedStatus ? 'primary' : 'default'}
              variant={opt.key === selectedStatus ? 'filled' : 'outlined'}
              clickable
              sx={{
                bgcolor: opt.key === selectedStatus ? '#E9ECEF' : 'transparent',
                color: opt.key === selectedStatus ? '#333333' : '#6C757D',
                borderColor: '#CED4DA',
                '&:hover': { bgcolor: opt.key === selectedStatus ? '#D3D8DC' : '#F1F3F5' },
              }}
            />
          );
        })}
      </Box>

      <Box display="flex" flexDirection="column" gap={3}>
        {sortedTypes.map((typeName) => (
          <Box key={typeName}>
            <Typography variant="subtitle1" mb={1} sx={{ color: '#333333', fontWeight: 500 }}>
              {typeName}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {roomsByType[typeName]
                .sort((a, b) => a.room_number.localeCompare(b.room_number))
                .map((room) => (
                  <Box
                    key={room.id}
                    onClick={() => navigate(`/room/${room.id}`)}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: getStatusColor(room.status),
                      borderRadius: 1,
                      boxShadow: 1,
                      color: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4 },
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {room.room_number}
                    </Typography>
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