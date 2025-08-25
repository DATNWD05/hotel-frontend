import React, { useState, useEffect, ChangeEvent } from "react";
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
  Collapse,
  TextField,
  Box,
  Button,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import axios, { AxiosError } from "axios";
import "../../css/service.css";
// 👇 để tái dùng style bảng 2 cột & container giống Customer.tsx
import "../../css/Customer.css";

interface Amenity {
  id: number;
  name: string;
  quantity?: number;
}

interface RoomType {
  id: number;
  code: string;
  name: string;
  description: string;
  max_occupancy: number;
  base_rate: number;
  hourly_rate: number; // ✅ THEO GIỜ
  amenities: Amenity[];
}

interface ApiResponse {
  data: RoomType[];
  meta: { last_page: number };
}

interface ValidationErrors {
  code?: string;
  name?: string;
  description?: string;
  max_occupancy?: string;
  base_rate?: string;
  hourly_rate?: string;
}

interface AmenityPayload {
  id: number;
  quantity: number;
}

// Helper định dạng VND giống Customer.tsx
const vnd = (n: number | string) => {
  const num = typeof n === "string" ? Number(n) : n;
  return isNaN(num) ? "0 đ" : num.toLocaleString("vi-VN") + " đ";
};

const RoomTypesList: React.FC = () => {
  const navigate = useNavigate();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(
    null
  );
  const [editRoomTypeId, setEditRoomTypeId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<RoomType | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<number | null>(null);

  // tiện nghi đang chỉnh
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [amenityQuantities, setAmenityQuantities] = useState<
    Record<number, number>
  >({});

  // dialog thêm
  const [addAmenityDialogOpen, setAddAmenityDialogOpen] =
    useState<boolean>(false);
  const [addSelected, setAddSelected] = useState<Record<number, boolean>>({});
  const [addQuantities, setAddQuantities] = useState<Record<number, number>>(
    {}
  );

  useEffect(() => {
    document.title = "Danh sách Loại Phòng";
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomTypesResponse, amenitiesResponse] = await Promise.all([
          axios.get<ApiResponse>(
            `http://127.0.0.1:8000/api/room-types?page=${currentPage}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axios.get<{ data: Amenity[] }>("http://127.0.0.1:8000/api/amenities", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          !roomTypesResponse.data.data ||
          !Array.isArray(roomTypesResponse.data.data)
        ) {
          throw new Error("Dữ liệu loại phòng không đúng định dạng");
        }

        const mappedRoomTypes: RoomType[] = roomTypesResponse.data.data.map(
          (item: any) => ({
            id: item.id,
            code: item.code || "",
            name: item.name || "",
            description: item.description || "",
            max_occupancy: item.max_occupancy ?? 0,
            base_rate: Number(item.base_rate ?? 0),
            hourly_rate: Number(item.hourly_rate ?? 0), // ✅ MAP THEO GIỜ
            amenities: (item.amenities || []).map((a: any) => ({
              id: a.id,
              name: a.name,
              quantity:
                typeof a?.pivot?.quantity === "number"
                  ? a.pivot.quantity
                  : typeof a?.quantity === "number"
                  ? a.quantity
                  : 1,
            })),
          })
        );

        setRoomTypes(mappedRoomTypes);
        setLastPage(roomTypesResponse.data.meta?.last_page || 1);
        setAllAmenities(amenitiesResponse.data.data || []);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof AxiosError
            ? err.response?.status === 401
              ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
              : (err.response?.data as any)?.message ||
                `Không thể tải dữ liệu: ${err.message}`
            : err instanceof Error
            ? err.message
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

    fetchData();
  }, [currentPage, navigate]);

  const validateForm = (data: RoomType): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.code.trim()) errors.code = "Mã không được để trống";
    if (!data.name.trim()) errors.name = "Tên không được để trống";
    if (data.max_occupancy <= 0)
      errors.max_occupancy = "Số người tối đa phải lớn hơn 0";
    if (data.base_rate < 100000)
      errors.base_rate = "Giá cơ bản tối thiểu 100.000đ"; // khớp BE
    if (data.hourly_rate < 100000)
      errors.hourly_rate = "Giá theo giờ tối thiểu 100.000đ";
    if (data.description && data.description.length > 500)
      errors.description = "Mô tả không được vượt quá 500 ký tự";
    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editFormData) {
      const numericFields = ["max_occupancy", "base_rate", "hourly_rate"];
      const updatedData = {
        ...editFormData,
        [name as keyof RoomType]: numericFields.includes(name)
          ? Number(value) || 0
          : value,
      } as RoomType;
      setEditFormData(updatedData);
      const errors = validateForm(updatedData);
      setValidationErrors(errors);
    }
  };

  const handleEdit = (roomType: RoomType) => {
    setSelectedRoomTypeId(roomType.id);
    setEditRoomTypeId(roomType.id);
    setEditFormData({ ...roomType });

    const ids = (roomType.amenities || []).map((a) => a.id);
    setSelectedAmenities(ids);
    const qtyMap: Record<number, number> = {};
    (roomType.amenities || []).forEach((a) => {
      qtyMap[a.id] = Math.max(1, Number(a.quantity ?? 1));
    });
    setAmenityQuantities(qtyMap);

    setValidationErrors({});
    setEditError(null);
  };

  // ========== Lưu tiện nghi + số lượng + cả hourly_rate ==========
  const handleSave = async () => {
    if (!editFormData) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Vui lòng sửa các lỗi trong biểu mẫu trước khi lưu.");
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token)
        throw new Error(
          "Không tìm thấy token xác thực. Vui lòng đăng nhập lại."
        );

      // 1) Lưu thông tin cơ bản (bao gồm hourly_rate)
      const baseRes = await axios.put(
        `http://127.0.0.1:8000/api/room-types/${editFormData.id}`,
        {
          code: editFormData.code,
          name: editFormData.name,
          description: editFormData.description,
          max_occupancy: editFormData.max_occupancy,
          base_rate: editFormData.base_rate,
          hourly_rate: editFormData.hourly_rate,
          amenities: selectedAmenities, // giữ tương thích nếu BE cần
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (baseRes.status !== 200) {
        throw new Error(`Yêu cầu thất bại với mã: ${baseRes.status}`);
      }

      // 2) Đồng bộ tiện nghi kèm quantity
      const payload: AmenityPayload[] = selectedAmenities.map((id) => ({
        id,
        quantity: Math.max(1, amenityQuantities[id] ?? 1),
      }));

      const amenRes = await axios.put(
        `http://127.0.0.1:8000/api/room-types/${editFormData.id}/amenities`,
        { amenities: payload },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedFromBE: Amenity[] = (amenRes?.data?.data || []).map(
        (a: any) => ({
          id: a.id,
          name: a.name,
          quantity: Number(a?.quantity ?? a?.pivot?.quantity ?? 1),
        })
      );

      setRoomTypes((prev) =>
        prev.map((rt) =>
          rt.id === editFormData.id
            ? {
                ...editFormData,
                amenities: updatedFromBE.length ? updatedFromBE : rt.amenities,
              }
            : rt
        )
      );

      // reset form
      setEditRoomTypeId(null);
      setEditFormData(null);
      setSelectedRoomTypeId(null);
      setSelectedAmenities([]);
      setAmenityQuantities({});

      toast.success(
        "Cập nhật loại phòng, giá theo giờ & tiện nghi thành công!"
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : (err.response?.data as any)?.message ||
              `Không thể cập nhật loại phòng: ${err.message}`
          : err instanceof Error
          ? `Không thể cập nhật loại phòng: ${err.message}`
          : "Lỗi không xác định";
      setEditError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    } finally {
      setEditLoading(false);
    }
  };
  // ======================================================

  const handleCancel = () => {
    setEditRoomTypeId(null);
    setEditFormData(null);
    setSelectedRoomTypeId(null);
    setSelectedAmenities([]);
    setAmenityQuantities({});
    setValidationErrors({});
    setEditError(null);
  };

  const handleViewDetails = (id: number) => {
    if (selectedRoomTypeId === id && editRoomTypeId !== id) {
      setSelectedRoomTypeId(null);
    } else {
      setSelectedRoomTypeId(id);
      setEditRoomTypeId(null);
      setEditFormData(null);
      setSelectedAmenities([]);
      setAmenityQuantities({});
      setValidationErrors({});
      setEditError(null);
    }
  };

  const handleDelete = (id: number) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    setRoomTypeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomTypeToDelete) return;

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await axios.delete(
        `http://127.0.0.1:8000/api/room-types/${roomTypeToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setRoomTypes((prev) => prev.filter((rt) => rt.id !== roomTypeToDelete));
        toast.success("Xóa loại phòng thành công!");
        if (roomTypes.length === 1 && currentPage > 1) {
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
            : (err.response?.data as any)?.message ||
              `Không thể xóa loại phòng: ${err.message}`
          : err instanceof Error
          ? `Không thể xóa loại phòng: ${err.message}`
          : "Lỗi không xác định";
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    } finally {
      setDeleteDialogOpen(false);
      setRoomTypeToDelete(null);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // ====== tiện nghi hiện có (UI chỉnh số lượng) ======
  const handleRemoveAmenity = (amenityId: number) => {
    setSelectedAmenities((prev) => prev.filter((id) => id !== amenityId));
    setAmenityQuantities((prev) => {
      const p = { ...prev };
      delete p[amenityId];
      return p;
    });
  };

  const handleQtyChange = (amenityId: number, value: number) => {
    setAmenityQuantities((prev) => ({
      ...prev,
      [amenityId]: Math.max(1, Math.floor(value || 1)),
    }));
  };

  const incQty = (amenityId: number) => {
    setAmenityQuantities((prev) => ({
      ...prev,
      [amenityId]: Math.max(1, (prev[amenityId] || 1) + 1),
    }));
  };

  const decQty = (amenityId: number) => {
    setAmenityQuantities((prev) => ({
      ...prev,
      [amenityId]: Math.max(1, (prev[amenityId] || 1) - 1),
    }));
  };

  // ====== dialog thêm tiện nghi ======
  const handleAddAmenityClick = () => {
    const initialSelected: Record<number, boolean> = {};
    const initialQuantities: Record<number, number> = {};
    allAmenities
      .filter((a) => !selectedAmenities.includes(a.id))
      .forEach((a) => {
        initialSelected[a.id] = false;
        initialQuantities[a.id] = 1;
      });
    setAddSelected(initialSelected);
    setAddQuantities(initialQuantities);
    setAddAmenityDialogOpen(true);
  };

  const toggleAddAmenity = (amenityId: number, checked: boolean) => {
    setAddSelected((prev) => ({ ...prev, [amenityId]: checked }));
    if (checked)
      setAddQuantities((prev) => ({
        ...prev,
        [amenityId]: prev[amenityId] ?? 1,
      }));
  };

  const handleAddQtyChange = (amenityId: number, value: number) => {
    setAddQuantities((prev) => ({
      ...prev,
      [amenityId]: Math.max(1, Math.floor(value || 1)),
    }));
  };

  const handleCancelAddAmenity = () => {
    setAddAmenityDialogOpen(false);
  };

  const handleAddAmenityConfirm = async () => {
    if (!editFormData) return;

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const currentPayload: AmenityPayload[] = selectedAmenities.map((id) => ({
        id,
        quantity: Math.max(1, amenityQuantities[id] ?? 1),
      }));

      const newOnes: AmenityPayload[] = Object.keys(addSelected)
        .filter((id) => addSelected[Number(id)])
        .map((id) => ({
          id: Number(id),
          quantity: Math.max(1, addQuantities[Number(id)] ?? 1),
        }));

      if (newOnes.length === 0) {
        toast.info("Bạn chưa chọn tiện nghi nào để thêm.");
        return;
      }

      const mergedMap = new Map<number, number>();
      currentPayload.forEach((a) => mergedMap.set(a.id, a.quantity));
      newOnes.forEach((a) => mergedMap.set(a.id, a.quantity));

      const updatedAmenities: AmenityPayload[] = Array.from(
        mergedMap.entries()
      ).map(([id, quantity]) => ({ id, quantity }));

      const response = await axios.put(
        `http://127.0.0.1:8000/api/room-types/${editFormData.id}/amenities`,
        { amenities: updatedAmenities },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const updated = response.data.data as Amenity[];
        setSelectedAmenities(updated.map((a) => a.id));
        const newQtyMap: Record<number, number> = {};
        updated.forEach((a) => {
          newQtyMap[a.id] = Math.max(
            1,
            Number((a as any)?.quantity ?? (a as any)?.pivot?.quantity ?? 1)
          );
        });
        setAmenityQuantities(newQtyMap);

        setRoomTypes((prev) =>
          prev.map((rt) =>
            rt.id === editFormData.id
              ? {
                  ...rt,
                  amenities: updated.map((u) => ({
                    id: u.id,
                    name: u.name,
                    quantity: newQtyMap[u.id],
                  })),
                }
              : rt
          )
        );

        setAddAmenityDialogOpen(false);
        toast.success("Cập nhật tiện nghi thành công!");
      } else {
        throw new Error(`Yêu cầu thất bại với mã: ${response.status}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.status === 401
            ? "Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại."
            : (err.response?.data as any)?.message ||
              `Không thể cập nhật tiện nghi: ${err.message}`
          : err instanceof Error
          ? `Không thể cập nhật tiện nghi: ${err.message}`
          : "Lỗi không xác định";
      setError(errorMessage);
      toast.error(errorMessage);
      if (err instanceof AxiosError && err.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    }
  };

  const handleAddNew = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      toast.error(
        "Bạn cần đăng nhập để thêm loại phòng mới. Vui lòng đăng nhập lại."
      );
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    navigate("/room-types/add");
  };

  const QtyFieldInline = ({
    amenityId,
    value,
    onChange,
  }: {
    amenityId: number;
    value: number;
    onChange: (val: number) => void;
  }) => (
    <Box display="flex" alignItems="center" gap={0.5}>
      <IconButton
        size="small"
        onClick={() => onChange(Math.max(1, (value || 1) - 1))}
      >
        <RemoveCircleOutlineIcon fontSize="small" />
      </IconButton>
      <TextField
        type="number"
        size="small"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(Math.max(1, Number(e.target.value) || 1))
        }
        inputProps={{ min: 1, style: { width: 56, textAlign: "center" } }}
      />
      <IconButton
        size="small"
        onClick={() => onChange(Math.max(1, (value || 1) + 1))}
      >
        <AddCircleOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <div className="promotions-wrapper">
      <div className="promotions-title">
        <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
          Loại phòng {">"} Danh sách
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Typography variant="h2" fontWeight={700}>
            Loại Phòng
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Tìm kiếm loại phòng"
              variant="outlined"
              size="small"
              sx={{
                width: { xs: "100%", sm: 300 },
                bgcolor: "#fff",
                borderRadius: "8px",
                "& input": { fontSize: "15px" },
              }}
              disabled
            />
            <Button
              variant="contained"
              onClick={handleAddNew}
              sx={{
                backgroundColor: "#4318FF",
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2.5,
                py: 0.7,
                boxShadow: "0 2px 6px rgba(106, 27, 154, 0.3)",
                "&:hover": {
                  backgroundColor: "#7B1FA2",
                  boxShadow: "0 4px 12px rgba(106, 27, 154, 0.4)",
                },
              }}
            >
              + Thêm mới
            </Button>
          </Box>
        </Box>
      </div>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography ml={2}>Đang tải danh sách loại phòng...</Typography>
        </Box>
      ) : error ? (
        <Typography color="error" p={2} textAlign="center">
          {error}
        </Typography>
      ) : roomTypes.length === 0 ? (
        <Typography p={2} textAlign="center">
          Không tìm thấy loại phòng nào.
        </Typography>
      ) : (
        <>
          <TableContainer
            component={Paper}
            className="promotions-table-container"
            sx={{ maxWidth: "100%", overflowX: "auto" }}
          >
            <Table sx={{ width: "100%", tableLayout: "fixed" }}>
              <TableHead sx={{ backgroundColor: "#f4f6fa" }}>
                <TableRow>
                  <TableCell sx={{ minWidth: "120px" }}>
                    <b>Mã</b>
                  </TableCell>
                  <TableCell sx={{ minWidth: "150px" }}>
                    <b>Tên</b>
                  </TableCell>
                  <TableCell sx={{ minWidth: "200px" }}>
                    <b>Mô tả</b>
                  </TableCell>
                  <TableCell sx={{ minWidth: "120px" }}>
                    <b>Số người tối đa</b>
                  </TableCell>
                  <TableCell sx={{ minWidth: "140px" }}>
                    <b>Giá cơ bản</b>
                  </TableCell>
                  <TableCell sx={{ minWidth: "140px" }}>
                    <b>Giá theo giờ</b>
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: "150px" }}>
                    <b>Hành động</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roomTypes.map((rt) => (
                  <React.Fragment key={rt.id}>
                    <TableRow hover>
                      <TableCell>{rt.code}</TableCell>
                      <TableCell>{rt.name}</TableCell>
                      <TableCell>{rt.description}</TableCell>
                      <TableCell>{rt.max_occupancy}</TableCell>
                      <TableCell>{vnd(rt.base_rate)}</TableCell>
                      <TableCell>{vnd(rt.hourly_rate)}</TableCell>
                      <TableCell align="center">
                        <Box
                          display="flex"
                          justifyContent="center"
                          gap={1}
                          sx={{ flexWrap: "wrap" }}
                        >
                          <IconButton
                            title={
                              selectedRoomTypeId === rt.id
                                ? "Ẩn chi tiết"
                                : "Xem chi tiết"
                            }
                            onClick={() => handleViewDetails(rt.id)}
                            sx={{
                              color: "#1976d2",
                              bgcolor: "#e3f2fd",
                              p: "6px",
                              "&:hover": {
                                bgcolor: "#bbdefb",
                                boxShadow:
                                  "0 2px 6px rgba(25,118,210,0.4)",
                              },
                              transition: "all 0.2s ease-in-out",
                            }}
                          >
                            {selectedRoomTypeId === rt.id ? (
                              <VisibilityOffIcon fontSize="small" />
                            ) : (
                              <VisibilityIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            title="Chỉnh sửa loại phòng"
                            onClick={() => handleEdit(rt)}
                            sx={{
                              color: "#FACC15",
                              bgcolor: "#fef9c3",
                              p: "6px",
                              "&:hover": {
                                bgcolor: "#fff9c4",
                                boxShadow:
                                  "0 2px 6px rgba(250, 204, 21, 0.4)",
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            title="Xóa loại phòng"
                            onClick={() => handleDelete(rt.id)}
                            sx={{
                              color: "#d32f2f",
                              bgcolor: "#ffebee",
                              p: "6px",
                              "&:hover": {
                                bgcolor: "#ffcdd2",
                                boxShadow:
                                  "0 2px 6px rgba(211, 47, 47, 0.4)",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={7} style={{ padding: 0 }}>
                        <Collapse in={selectedRoomTypeId === rt.id}>
                          <div className="promotion-detail-container">
                            {editRoomTypeId === rt.id && editFormData ? (
                              // EDIT MODE
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: "#fff",
                                  borderRadius: "8px",
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  gutterBottom
                                  sx={{ fontWeight: 600, color: "#333" }}
                                >
                                  Chỉnh sửa loại phòng
                                </Typography>

                                <Box
                                  display="flex"
                                  flexDirection="column"
                                  gap={2}
                                >
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Mã"
                                      name="code"
                                      value={editFormData.code}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.code}
                                      helperText={validationErrors.code}
                                    />
                                    <TextField
                                      label="Tên"
                                      name="name"
                                      value={editFormData.name}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.name}
                                      helperText={validationErrors.name}
                                    />
                                  </Box>
                                  <Box display="flex" gap={2}>
                                    <TextField
                                      label="Số người tối đa"
                                      name="max_occupancy"
                                      type="number"
                                      value={editFormData.max_occupancy}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.max_occupancy}
                                      helperText={
                                        validationErrors.max_occupancy
                                      }
                                      inputProps={{ min: 0 }}
                                    />
                                    <TextField
                                      label="Giá cơ bản"
                                      name="base_rate"
                                      type="number"
                                      value={editFormData.base_rate}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.base_rate}
                                      helperText={validationErrors.base_rate}
                                      inputProps={{ min: 0 }}
                                      InputProps={{
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            đ
                                          </InputAdornment>
                                        ),
                                      }}
                                    />
                                    <TextField
                                      label="Giá theo giờ"
                                      name="hourly_rate"
                                      type="number"
                                      value={editFormData.hourly_rate}
                                      onChange={handleChange}
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      error={!!validationErrors.hourly_rate}
                                      helperText={validationErrors.hourly_rate}
                                      inputProps={{ min: 0 }}
                                      InputProps={{
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            đ/giờ
                                          </InputAdornment>
                                        ),
                                      }}
                                    />
                                  </Box>
                                  <TextField
                                    label="Mô tả"
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    multiline
                                    rows={3}
                                    error={!!validationErrors.description}
                                    helperText={validationErrors.description}
                                  />

                                  <Typography
                                    variant="h6"
                                    mt={1}
                                    mb={1}
                                    sx={{ fontWeight: 600, color: "#333" }}
                                  >
                                    Tiện nghi (kèm số lượng)
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 1,
                                      bgcolor: "#fff",
                                      p: 2,
                                      borderRadius: "8px",
                                      border: "1px solid #eee",
                                    }}
                                  >
                                    {selectedAmenities.length > 0 ? (
                                      selectedAmenities.map((amenityId) => {
                                        const amenity = allAmenities.find(
                                          (a) => a.id === amenityId
                                        );
                                        const qty =
                                          amenityQuantities[amenityId] ?? 1;
                                        if (!amenity) return null;
                                        return (
                                          <Box
                                            key={amenityId}
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 1,
                                              p: 1,
                                              borderRadius: "8px",
                                              border: "1px solid #E0E0E0",
                                              bgcolor: "#fafbff",
                                            }}
                                          >
                                            <Chip
                                              label={amenity.name}
                                              size="small"
                                              color="primary"
                                              variant="outlined"
                                              sx={{
                                                borderColor: "#4318FF",
                                                color: "#4318FF",
                                              }}
                                            />
                                            <QtyFieldInline
                                              amenityId={amenityId}
                                              value={qty}
                                              onChange={(val) =>
                                                handleQtyChange(amenityId, val)
                                              }
                                            />
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleRemoveAmenity(amenityId)
                                              }
                                              title="Gỡ tiện nghi"
                                              sx={{ ml: 0.5 }}
                                            >
                                              <CloseIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        );
                                      })
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="textSecondary"
                                      >
                                        Chưa có tiện nghi nào được gán
                                      </Typography>
                                    )}

                                    <IconButton
                                      onClick={handleAddAmenityClick}
                                      sx={{
                                        color: "#blue",
                                        border: "1px dashed #blue",
                                        borderRadius: "8px",
                                        p: "6px",
                                        ml: 1,
                                      }}
                                    >
                                      <AddIcon />
                                    </IconButton>
                                  </Box>

                                  <Box mt={2} display="flex" gap={2}>
                                    <Button
                                      variant="contained"
                                      onClick={handleSave}
                                      disabled={editLoading}
                                      sx={{
                                        backgroundColor: "#4318FF",
                                        color: "#fff",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: "8px",
                                        px: 2.5,
                                        py: 0.7,
                                        "&:hover": {
                                          backgroundColor: "#7B1FA2",
                                        },
                                        "&:disabled": {
                                          backgroundColor: "#a9a9a9",
                                        },
                                      }}
                                    >
                                      {editLoading ? (
                                        <CircularProgress size={24} />
                                      ) : (
                                        "Lưu"
                                      )}
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      onClick={handleCancel}
                                      disabled={editLoading}
                                      sx={{
                                        color: "#f44336",
                                        borderColor: "#f44336",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: "8px",
                                        px: 2.5,
                                        py: 0.7,
                                        "&:hover": {
                                          borderColor: "#d32f2f",
                                          backgroundColor: "#ffebee",
                                        },
                                        "&:disabled": {
                                          color: "#a9a9a9",
                                          borderColor: "#a9a9a9",
                                        },
                                      }}
                                    >
                                      Hủy
                                    </Button>
                                  </Box>
                                  {editError && (
                                    <Typography color="error" mt={1}>
                                      {editError}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              // VIEW MODE (giống Customer.tsx)
                              <Box
                                sx={{
                                  width: "100%",
                                  bgcolor: "#f9f9f9",
                                  px: 3,
                                  py: 2,
                                  borderTop: "1px solid #ddd",
                                }}
                              >
                                <div className="customer-detail-container">
                                  <h3>Thông tin loại phòng</h3>

                                  <Table
                                    className="customer-detail-table"
                                    sx={{ mb: 2 }}
                                  >
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Mã:</strong> {rt.code}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Tên:</strong> {rt.name}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Số người tối đa:</strong>{" "}
                                          {rt.max_occupancy}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Giá cơ bản:</strong>{" "}
                                          {vnd(rt.base_rate)}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>
                                          <strong>Giá theo giờ:</strong>{" "}
                                          {vnd(rt.hourly_rate)}
                                        </TableCell>
                                        <TableCell>
                                          <strong>Mô tả:</strong>{" "}
                                          {rt.description || "—"}
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>

                                  <h3>Tiện nghi</h3>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 1,
                                      bgcolor: "#fff",
                                      p: 2,
                                      borderRadius: "8px",
                                      border: "1px solid #eee",
                                    }}
                                  >
                                    {rt.amenities.length > 0 ? (
                                      rt.amenities.map((amenity) => (
                                        <Chip
                                          key={amenity.id}
                                          label={
                                            typeof amenity.quantity === "number"
                                              ? `${amenity.name} × ${amenity.quantity}`
                                              : amenity.name
                                          }
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{
                                            borderColor: "#4318FF",
                                            color: "#4318FF",
                                            "&:hover": { bgcolor: "#f4f6fa" },
                                          }}
                                        />
                                      ))
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Không có tiện nghi.
                                      </Typography>
                                    )}
                                  </Box>
                                </div>
                              </Box>
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
                sx={{ "& .MuiPaginationItem-root": { fontSize: "14px" } }}
              />
            </Box>
          )}
        </>
      )}

      {/* Dialog xóa */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Xác nhận xóa loại phòng
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa loại phòng này không? Hành động này không
            thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: "#d32f2f",
              borderColor: "#d32f2f",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 2.5,
              py: 0.7,
              "&:hover": { borderColor: "#b71c1c", backgroundColor: "#ffebee" },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              bgcolor: "#d32f2f",
              "&:hover": { bgcolor: "#b71c1c" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 2.5,
              py: 0.7,
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog thêm tiện nghi */}
      <Dialog
        open={addAmenityDialogOpen}
        onClose={handleCancelAddAmenity}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Chọn tiện nghi để thêm
        </DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={1}>
            {allAmenities
              .filter((a) => !selectedAmenities.includes(a.id))
              .map((amenity) => {
                const checked = addSelected[amenity.id] || false;
                const qty = addQuantities[amenity.id] ?? 1;
                return (
                  <Box
                    key={amenity.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      bgcolor: checked ? "#fafbff" : "#fff",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={(e) =>
                            toggleAddAmenity(amenity.id, e.target.checked)
                          }
                        />
                      }
                      label={amenity.name}
                    />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        SL:
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={qty}
                        onChange={(e) =>
                          handleAddQtyChange(
                            amenity.id,
                            Number(e.target.value)
                          )
                        }
                        inputProps={{ min: 1, style: { width: 80 } }}
                        disabled={!checked}
                      />
                    </Box>
                  </Box>
                );
              })}
            {allAmenities.filter((a) => !selectedAmenities.includes(a.id))
              .length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Không còn tiện nghi để thêm.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelAddAmenity}
            sx={{
              color: "#d32f2f",
              borderColor: "#d32f2f",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 2.5,
              py: 0.7,
              "&:hover": { borderColor: "#b71c1c", backgroundColor: "#ffebee" },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleAddAmenityConfirm}
            variant="contained"
            sx={{
              bgcolor: "#4318FF",
              "&:hover": { bgcolor: "#7B1FA2" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 2.5,
              py: 0.7,
            }}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RoomTypesList;
