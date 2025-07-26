import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Typography,
  Box,
  Pagination,
  Collapse,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import api from "../../api/axios";
import { AxiosError } from "axios";
import "../../css/HiddenRoom.css";

interface Amenity {
  id: number;
  name: string;
  pivot: {
    quantity: number;
  };
}

interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  status: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  room_type: {
    id: number;
    name: string;
    amenities: Amenity[];
  };
}

interface RoomResponse {
  data: Room[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const HiddenRoom: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const fetchTrashedRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      }
      const response = await api.get<RoomResponse>("/rooms/trashed");
      if (response.status === 200) {
        setRooms(response.data.data);
        setFilteredRooms(response.data.data.slice(0, 10));
        setLastPage(Math.ceil(response.data.data.length / 10));
      } else {
        throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : err.response?.data?.message || `Không thể tải danh sách phòng bị ẩn: ${err.message}`
          : err instanceof Error
          ? `Không thể tải danh sách phòng bị ẩn: ${err.message}`
          : "Lỗi không xác định";
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Danh sách Phòng Bị Ẩn";
    fetchTrashedRooms();
  }, [navigate]);

  useEffect(() => {
    setFilteredRooms(rooms.slice((currentPage - 1) * 10, currentPage * 10));
    setLastPage(Math.ceil(rooms.length / 10));
  }, [currentPage, rooms]);

  const handleRestore = async (roomId: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      }
      const response = await api.post(`/rooms/${roomId}/restore`);
      if (response.status === 200) {
        toast.success("Phòng đã được khôi phục thành công!");
        fetchTrashedRooms();
        if (filteredRooms.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : err.response?.data?.message || `Không thể khôi phục phòng: ${err.message}`
          : err instanceof Error
          ? `Không thể khôi phục phòng: ${err.message}`
          : "Lỗi không xác định";
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  };

  const getStatusText = (status: string) => {
    return status === "booked"
      ? "Đã đặt"
      : status === "available"
      ? "Đang trống"
      : status === "cleaning"
      ? "Đang dọn dẹp"
      : status === "maintenance"
      ? "Bảo trì"
      : "Không xác định";
  };

  const handleViewDetails = (roomId: number) => {
    setSelectedRoomId(selectedRoomId === roomId ? null : roomId);
  };

  return (
    <div className="hidden-room-wrapper">
      <div className="hidden-room-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Hidden Rooms {">"} Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" fontWeight={700}>
            Hidden Rooms
          </Typography>
        </Box>
      </div>

      {loading ? (
        <div className="hidden-room-loading-container">
          <CircularProgress />
          <Typography>Đang tải danh sách phòng bị ẩn...</Typography>
        </div>
      ) : error ? (
        <Typography color="error" className="hidden-room-error-message">
          {error}
        </Typography>
      ) : filteredRooms.length === 0 ? (
        <Typography className="hidden-room-no-data">
          Không tìm thấy phòng bị ẩn.
        </Typography>
      ) : (
        <>
          <TableContainer
            component={Paper}
            className="hidden-room-table-container"
          >
            <Table className="hidden-room-table">
              <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                <TableRow>
                  <TableCell>
                    <b>Số Phòng</b>
                  </TableCell>
                  <TableCell>
                    <b>Loại Phòng</b>
                  </TableCell>
                  <TableCell>
                    <b>Trạng Thái</b>
                  </TableCell>
                  <TableCell align="center">
                    <b>Hành động</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRooms.map((room) => (
                  <React.Fragment key={room.id}>
                    <TableRow hover>
                      <TableCell
                        sx={{
                          maxHeight: "60px",
                          overflowY: "auto",
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        {room.room_number}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxHeight: "60px",
                          overflowY: "auto",
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        {room.room_type.name}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxHeight: "60px",
                          overflowY: "auto",
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        {getStatusText(room.status)}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <IconButton
                            title={selectedRoomId === room.id ? "Ẩn chi tiết" : "Xem chi tiết"}
                            sx={{
                              color: "#1976d2",
                              bgcolor: "#e3f2fd",
                              "&:hover": {
                                bgcolor: "#bbdefb",
                                boxShadow: "0 2px 6px rgba(25, 118, 210, 0.4)",
                              },
                              transition: "all 0.2s ease-in-out",
                            }}
                            onClick={() => handleViewDetails(room.id)}
                          >
                            {selectedRoomId === room.id ? (
                              <VisibilityOffIcon fontSize="small" />
                            ) : (
                              <VisibilityIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            title="Khôi phục"
                            sx={{
                              color: "#388E3C",
                              bgcolor: "#e8f5e9",
                              "&:hover": {
                                bgcolor: "#c8e6c9",
                                boxShadow: "0 2px 6px rgba(56, 142, 60, 0.4)",
                              },
                              transition: "all 0.2s ease-in-out",
                            }}
                            onClick={() => handleRestore(room.id)}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} style={{ padding: 0 }}>
                        <Collapse
                          in={selectedRoomId === room.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <div className="hidden-room-detail-container">
                            <h3>Thông tin chi tiết phòng</h3>
                            <Table className="hidden-room-detail-table">
                              <TableBody>
                                <TableRow>
                                  <TableCell>
                                    <strong>Số Phòng:</strong>{" "}
                                    {room.room_number}
                                  </TableCell>
                                  <TableCell>
                                    <strong>Loại Phòng:</strong>{" "}
                                    {room.room_type.name}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>
                                    <strong>Trạng Thái:</strong>{" "}
                                    {getStatusText(room.status)}
                                  </TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                            <h3>Tiện nghi</h3>
                            {room.room_type.amenities &&
                            room.room_type.amenities.length > 0 ? (
                              <Table className="hidden-room-detail-table">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Tên Tiện Nghi</TableCell>
                                    <TableCell>Số Lượng</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {room.room_type.amenities.map((amenity) => (
                                    <TableRow key={amenity.id}>
                                      <TableCell>{amenity.name}</TableCell>
                                      <TableCell>
                                        {amenity.pivot.quantity}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <Typography>Không có tiện nghi nào.</Typography>
                            )}
                          </div>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {lastPage > 1 && (
            <Box mt={2} pr={3} display="flex" justifyContent="flex-end">
              <Pagination
                count={lastPage}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </div>
  );
};

export default HiddenRoom;