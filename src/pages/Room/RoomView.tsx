import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
      Paper,
      Typography,
      Box,
      TextField,
      FormControl,
      InputLabel,
      Select,
      MenuItem,
      Button,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface ApiRoom {
      id: number;
      room_number: string;
      status: 'ready' | 'closed';
      floor: number;
      area?: string;
      note?: string;
}

interface RoomForm {
      id: number;
      name: string;
      status: 'ready' | 'closed';
      floor: number;
      area: string;
      note: string;
}

const floorOptions = [1, 2, 3, 4, 5];
const areaOptions = ['Phòng Riêng', 'Phòng Gia Đình', 'President','VIP'];

const STORAGE_KEY = 'rooms_data';

async function loadAllRooms(): Promise<ApiRoom[]> {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
            return JSON.parse(stored) as ApiRoom[];
      }
      // first time: fetch db.json and seed
      const res = await fetch(`http://localhost:3000/rooms/:id`);
      const json = (await res.json()) as { rooms: ApiRoom[] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json.rooms));
      return json.rooms;
}

async function loadRoom(id: number): Promise<ApiRoom | undefined> {
      const rooms = await loadAllRooms();
      return rooms.find(r => r.id === id);
}

async function saveRoom(updated: ApiRoom): Promise<void> {
      const rooms = await loadAllRooms();
      const idx = rooms.findIndex(r => r.id === updated.id);
      if (idx >= 0) {
            rooms[idx] = updated;
      } else {
            rooms.push(updated);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

const RoomView: React.FC = () => {
      const { id } = useParams<{ id: string }>();
      const navigate = useNavigate();
      const roomId = Number(id);

      const [formData, setFormData] = useState<RoomForm>({
            id: roomId,
            name: '',
            status: 'ready',
            floor: 1,
            area: '',
            note: '',
      });
      const [loading, setLoading] = useState(true);
      const [saving, setSaving] = useState(false);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
            loadRoom(roomId)
                  .then(room => {
                        if (!room) throw new Error('Không tìm thấy phòng');
                        setFormData({
                              id: room.id,
                              name: room.room_number,
                              status: room.status,
                              floor: room.floor,
                              area: room.area ?? '',
                              note: room.note ?? '',
                        });
                  })
                  .catch((err: unknown) => {
                        const msg = err instanceof Error ? err.message : String(err);
                        setError(msg);
                  })
                  .finally(() => setLoading(false));
      }, [roomId]);

      const handleInputChange = (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
      };

      const handleStatusChange = (e: SelectChangeEvent<'ready' | 'closed'>) => {
            setFormData(prev => ({ ...prev, status: e.target.value }));
      };
      const handleFloorChange = (e: SelectChangeEvent<string>) => {
            setFormData(prev => ({ ...prev, floor: Number(e.target.value) }));
      };
      const handleAreaChange = (e: SelectChangeEvent<string>) => {
            setFormData(prev => ({ ...prev, area: e.target.value }));
      };

      const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setSaving(true);
            setError(null);

            const updated: ApiRoom = {
                  id: formData.id,
                  room_number: formData.name,
                  status: formData.status,
                  floor: formData.floor,
                  area: formData.area,
                  note: formData.note,
            };

            try {
                  await saveRoom(updated);
                  navigate('/room');
            } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : String(err);
                  setError(msg || 'Lưu thất bại');
            } finally {
                  setSaving(false);
            }
      };

      if (loading) return <Typography>Đang tải...</Typography>;

      return (
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                  <Typography variant="h5" mb={3}>
                        Chỉnh sửa Phòng #{formData.id}
                  </Typography>

                  {error && (
                        <Typography color="error" mb={2}>
                              {error}
                        </Typography>
                  )}

                  <Box
                        component="form"
                        onSubmit={handleSubmit}
                        display="grid"
                        gridTemplateColumns="1fr 1fr"
                        gap={3}
                  >
                        <TextField
                              label="Tên phòng"
                              name="name"
                              required
                              fullWidth
                              value={formData.name}
                              onChange={handleInputChange}
                        />

                        <FormControl fullWidth required>
                              <InputLabel id="status-label">Trạng thái</InputLabel>
                              <Select
                                    labelId="status-label"
                                    label="Trạng thái"
                                    value={formData.status}
                                    onChange={handleStatusChange}
                              >
                                    <MenuItem value="ready">Sẵn sàng</MenuItem>
                                    <MenuItem value="closed">Đóng phòng</MenuItem>
                              </Select>
                        </FormControl>

                        <FormControl fullWidth>
                              <InputLabel id="floor-label">Tầng</InputLabel>
                              <Select
                                    labelId="floor-label"
                                    label="Tầng"
                                    value={String(formData.floor)}
                                    onChange={handleFloorChange}
                              >
                                    {floorOptions.map(f => (
                                          <MenuItem key={f} value={String(f)}>
                                                {f}
                                          </MenuItem>
                                    ))}
                              </Select>
                        </FormControl>

                        <FormControl fullWidth>
                              <InputLabel id="area-label">Khu vực</InputLabel>
                              <Select
                                    labelId="area-label"
                                    label="Khu vực"
                                    value={formData.area}
                                    onChange={handleAreaChange}
                              >
                                    {areaOptions.map(a => (
                                          <MenuItem key={a} value={a}>
                                                {a}
                                          </MenuItem>
                                    ))}
                              </Select>
                        </FormControl>

                        <TextField
                              label="Ghi chú"
                              name="note"
                              multiline
                              rows={4}
                              fullWidth
                              value={formData.note}
                              onChange={handleInputChange}
                              sx={{ gridColumn: 'span 2' }}
                        />

                        <Box
                              sx={{
                                    gridColumn: 'span 2',
                                    display: 'flex',
                                    gap: 2,
                                    justifyContent: 'flex-start',
                                    mt: 2,
                              }}
                        >
                              <Button variant="contained" type="submit" disabled={saving}>
                                    {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                              </Button>
                              <Button variant="outlined" type='primary' onClick={() => navigate(-1)}>
                                    Quay lại
                              </Button>
                        </Box>
                  </Box>
            </Paper>
      );
};

export default RoomView;
