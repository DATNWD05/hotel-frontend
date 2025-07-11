import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, CircularProgress, FormControlLabel, Checkbox } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: { id: number; name: string }[];
}

interface Permission {
  id: number;
  name: string;
}

interface PermissionCategory {
  name: string;
  permissions: string[];
  labels: { [key: string]: string };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const EditRole: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasPermission('edit_roles')) {
      fetchRoleAndPermissions();
    } else {
      setError('Bạn không có quyền chỉnh sửa vai trò');
      setLoading(false);
    }
  }, [hasPermission, id]);

  const fetchRoleAndPermissions = async () => {
    try {
      setLoading(true);
      const roleResponse = await api.get(`/roles/${id}`);
      const fetchedRole: Role = roleResponse.data.role || roleResponse.data;
      if (!fetchedRole) {
        throw new Error('Không tìm thấy vai trò');
      }
      setRole(fetchedRole);
      setSelectedPermissions(fetchedRole.permissions?.map((p: Permission) => p.id) || []);

      const permissionsResponse = await api.get('/permissions');
      const fetchedPermissions: Permission[] = permissionsResponse.data.permissions || permissionsResponse.data || [];
      if (!Array.isArray(fetchedPermissions)) {
        throw new Error('Dữ liệu quyền không đúng định dạng');
      }
      setAllPermissions(fetchedPermissions);
    } catch (err: unknown) {
      const errorMessage = (err as ApiError).response?.data?.message || 'Không thể tải vai trò hoặc quyền';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleChange = (field: keyof Role, value: string) => {
    setRole((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('edit_roles')) {
      toast.error('Bạn không có quyền chỉnh sửa vai trò');
      return;
    }
    if (!role) {
      toast.error('Không có dữ liệu vai trò để cập nhật');
      return;
    }

    try {
      // const roleUpdateResponse = await api.put(`/roles/${id}`, {
      //   name: role.name,
      //   description: role.description,
      //   permissions: selectedPermissions,
      // });

      const verifyResponse = await api.get(`/roles/${id}`);
      const updatedRole: Role = verifyResponse.data.role || verifyResponse.data;
      const updatedPermissions = updatedRole.permissions?.map((p: Permission) => p.id) || [];

      if (JSON.stringify(updatedPermissions.sort()) !== JSON.stringify(selectedPermissions.sort())) {
        const currentPermissions = role.permissions?.map((p) => p.id) || [];
        const permissionsToAdd = selectedPermissions.filter((id) => !currentPermissions.includes(id));
        const permissionsToRemove = currentPermissions.filter((id) => !selectedPermissions.includes(id));

        if (permissionsToAdd.length > 0) {
          await api.post(`/roles/${id}/permissions`, { permission_ids: permissionsToAdd });
        }

        if (permissionsToRemove.length > 0) {
          await api.delete(`/roles/${id}/permissions`, { data: { permission_ids: permissionsToRemove } });
        }
      }

      toast.success('Cập nhật vai trò và quyền thành công');
      navigate('/role', { state: { refetch: true } });
    } catch (err: unknown) {
      const errorMessage = (err as ApiError).response?.data?.message || 'Không thể cập nhật vai trò hoặc quyền';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      return;
    }
    try {
      await api.delete(`/roles/${id}`);
      toast.success('Xóa vai trò thành công');
      navigate('/role', { state: { refetch: true } });
    } catch (err: unknown) {
      const errorMessage = (err as ApiError).response?.data?.message || 'Không thể xóa vai trò';
      toast.error(errorMessage);
    }
  };

  const permissionCategories: PermissionCategory[] = [
    {
      name: 'Hệ thống',
      permissions: [
        'view_users', 'create_users', 'edit_users', 'delete_users',
        'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
        'assign_permissions', 'remove_permissions',
      ],
      labels: {
        view_users: 'Xem tài khoản truy cập',
        create_users: 'Thêm tài khoản truy cập',
        edit_users: 'Sửa tài khoản truy cập',
        delete_users: 'Xóa tài khoản truy cập',
        view_roles: 'Xem vai trò',
        create_roles: 'Tạo vai trò',
        edit_roles: 'Chỉnh sửa vai trò',
        delete_roles: 'Xóa vai trò',
        assign_permissions: 'Gán phân quyền',
        remove_permissions: 'Gỡ phân quyền',
      },
    },
    {
      name: 'Nhân viên',
      permissions: ['view_employees', 'create_employees', 'edit_employees', 'delete_employees'],
      labels: {
        view_employees: 'Xem nhân viên',
        create_employees: 'Thêm nhân viên',
        edit_employees: 'Sửa nhân viên',
        delete_employees: 'Xóa nhân viên',
      },
    },
    {
      name: 'Phòng ban',
      permissions: ['view_departments', 'create_departments', 'edit_departments', 'delete_departments'],
      labels: {
        view_departments: 'Xem phòng ban',
        create_departments: 'Thêm phòng ban',
        edit_departments: 'Sửa phòng ban',
        delete_departments: 'Xóa phòng ban',
      },
    },
    {
      name: 'Loại phòng & Tiện ích',
      permissions: [
        'view_room_types', 'create_room_types', 'edit_room_types', 'delete_room_types', 'sync_amenities_room_types',
        'view_amenities', 'create_amenities', 'edit_amenities', 'delete_amenities',
        'view_amenity_categories', 'create_amenity_categories', 'edit_amenity_categories', 'delete_amenity_categories',
        'restore_amenity_categories', 'force_delete_amenity_categories',
      ],
      labels: {
        view_room_types: 'Xem loại phòng',
        create_room_types: 'Thêm loại phòng',
        edit_room_types: 'Sửa loại phòng',
        delete_room_types: 'Xóa loại phòng',
        sync_amenities_room_types: 'Đồng bộ tiện ích – loại phòng',
        view_amenities: 'Xem tiện ích',
        create_amenities: 'Thêm tiện ích',
        edit_amenities: 'Sửa tiện ích',
        delete_amenities: 'Xóa tiện ích',
        view_amenity_categories: 'Xem nhóm tiện ích',
        create_amenity_categories: 'Thêm nhóm tiện ích',
        edit_amenity_categories: 'Sửa nhóm tiện ích',
        delete_amenity_categories: 'Xóa nhóm tiện ích',
        restore_amenity_categories: 'Khôi phục nhóm tiện ích',
        force_delete_amenity_categories: 'Xóa nhóm tiện ích vĩnh viễn',
      },
    },
    {
      name: 'Phòng',
      permissions: ['view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'restore_rooms', 'force_delete_rooms'],
      labels: {
        view_rooms: 'Xem phòng',
        create_rooms: 'Thêm phòng',
        edit_rooms: 'Sửa phòng',
        delete_rooms: 'Xóa phòng',
        restore_rooms: 'Khôi phục phòng',
        force_delete_rooms: 'Xóa phòng vĩnh viễn',
      },
    },
    {
      name: 'Đặt phòng',
      permissions: [
        'view_bookings', 'create_bookings', 'edit_bookings', 'cancel_bookings',
        'add_services_bookings', 'remove_services_bookings', 'checkin_bookings',
        'checkout_bookings', 'pay_cash_bookings',
      ],
      labels: {
        view_bookings: 'Xem đặt phòng',
        create_bookings: 'Tạo đặt phòng',
        edit_bookings: 'Sửa đặt phòng',
        cancel_bookings: 'Hủy đặt phòng',
        add_services_bookings: 'Thêm dịch vụ',
        remove_services_bookings: 'Xóa dịch vụ',
        checkin_bookings: 'Nhận phòng',
        checkout_bookings: 'Trả phòng',
        pay_cash_bookings: 'Thanh toán tiền mặt',
      },
    },
    {
      name: 'Khuyến mãi & Dịch vụ',
      permissions: [
        'view_promotions', 'create_promotions', 'edit_promotions', 'delete_promotions', 'apply_promotions',
        'view_services', 'create_services', 'edit_services', 'delete_services',
        'view_service_categories', 'create_service_categories', 'edit_service_categories', 'delete_service_categories',
      ],
      labels: {
        view_promotions: 'Xem khuyến mãi',
        create_promotions: 'Tạo khuyến mãi',
        edit_promotions: 'Sửa khuyến mãi',
        delete_promotions: 'Xóa khuyến mãi',
        apply_promotions: 'Áp dụng khuyến mãi',
        view_services: 'Xem dịch vụ',
        create_services: 'Thêm dịch vụ',
        edit_services: 'Sửa dịch vụ',
        delete_services: 'Xóa dịch vụ',
        view_service_categories: 'Xem nhóm dịch vụ',
        create_service_categories: 'Thêm nhóm dịch vụ',
        edit_service_categories: 'Sửa nhóm dịch vụ',
        delete_service_categories: 'Xóa nhóm dịch vụ',
      },
    },
    {
      name: 'Khách hàng & Hóa đơn',
      permissions: ['view_customers', 'create_customers', 'edit_customers', 'check_cccd_customers', 'view_invoices', 'print_invoices'],
      labels: {
        view_customers: 'Xem khách hàng',
        create_customers: 'Thêm khách hàng',
        edit_customers: 'Sửa khách hàng',
        check_cccd_customers: 'Kiểm tra CCCD',
        view_invoices: 'Xem hóa đơn',
        print_invoices: 'In hóa đơn',
      },
    },
    {
      name: 'Thống kê',
      permissions: [
        'view_total_revenue_statistics', 'view_by_day_statistics', 'view_total_per_booking_statistics',
        'view_by_customer_statistics', 'view_by_room_statistics', 'view_occupancy_rate_statistics',
        'view_avg_stay_statistics', 'view_cancellation_rate_statistics', 'view_top_customers_statistics',
        'view_bookings_by_month_statistics', 'view_by_room_type_statistics', 'view_total_service_revenue_statistics',
        'view_room_type_booking_count_statistics', 'view_revenue_table_statistics', 'view_booking_service_table_statistics',
      ],
      labels: {
        view_total_revenue_statistics: 'Doanh thu tổng',
        view_by_day_statistics: 'Theo ngày',
        view_total_per_booking_statistics: 'Doanh thu mỗi đặt phòng',
        view_by_customer_statistics: 'Theo khách hàng',
        view_by_room_statistics: 'Theo phòng',
        view_occupancy_rate_statistics: 'Tỉ lệ lấp đầy',
        view_avg_stay_statistics: 'Thời gian ở TB',
        view_cancellation_rate_statistics: 'Tỉ lệ hủy',
        view_top_customers_statistics: 'Top khách hàng',
        view_bookings_by_month_statistics: 'Đặt phòng theo tháng',
        view_by_room_type_statistics: 'Theo loại phòng',
        view_total_service_revenue_statistics: 'Doanh thu dịch vụ',
        view_room_type_booking_count_statistics: 'Số đặt theo loại phòng',
        view_revenue_table_statistics: 'Bảng doanh thu',
        view_booking_service_table_statistics: 'Bảng dịch vụ đặt phòng',
      },
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !role) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Không tìm thấy vai trò'}</Typography>
        <Button variant="contained" onClick={() => navigate('/role')} sx={{ mt: 2, bgcolor: '#e0e0e0', color: '#333', '&:hover': { bgcolor: '#d5d5d5' } }}>
          Quay lại
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: '1200px',
        margin: '32px auto',
        bgcolor: '#fff',
        p: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '24px' }}>
        <Box>
          <Typography sx={{ fontSize: '14px', color: '#666', mb: '4px' }}>Vai Trò  Chỉnh sửa</Typography>
          <Typography variant="h4" sx={{ fontSize: '24px', fontWeight: 600 }}>
            Chỉnh sửa Vai Trò
          </Typography>
        </Box>
        <Button
          onClick={handleDelete}
          variant="contained"
          sx={{
            bgcolor: '#e53935 !important',
            color: '#fff',
            px: '16px',
            py: '8px',
            borderRadius: '4px',
            fontSize: '14px',
            '&:hover': { bgcolor: '#d32f2f !important' },
          }}
        >
          Xóa
        </Button>
      </Box>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: '16px', mb: '32px' }}>
          <TextField
            fullWidth
            label="Tên hiển thị"
            value={role.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            sx={{
              '& .MuiInputBase-input': { p: '10px' },
              '& .MuiInputLabel-root': { fontWeight: 500, mb: '6px' },
              '& .MuiOutlinedInput-root': { borderRadius: '4px' },
            }}
          />
          <TextField
            fullWidth
            label="Mô tả"
            value={role.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            sx={{
              '& .MuiInputBase-input': { p: '10px' },
              '& .MuiInputLabel-root': { fontWeight: 500, mb: '6px' },
              '& .MuiOutlinedInput-root': { borderRadius: '4px' },
            }}
          />
        </Box>
        {permissionCategories.map((category) => (
          <Box key={category.name} sx={{ mb: '32px' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: '12px', color: '#333' }}>{category.name}</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: '10px 20px',
              }}
            >
              {allPermissions
                .filter((p) => category.permissions.includes(p.name))
                .map((permission) => (
                  <FormControlLabel
                    key={permission.id}
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        sx={{ mr: '8px' }}
                      />
                    }
                    label={category.labels[permission.name] || permission.name}
                    sx={{ color: '#444', fontSize: '14px', m: 0 }}
                  />
                ))}
            </Box>
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: '12px', mt: '16px' }}>
          <Button
            type="submit"
            variant="contained"
            sx={{
              bgcolor: '#1976d2 !important',
              color: '#fff',
              px: '20px',
              py: '10px',
              borderRadius: '4px',
              fontSize: '14px',
              '&:hover': { bgcolor: '#1565c0 !important' },
            }}
          >
            Lưu thay đổi
          </Button>
          <Button
            onClick={() => navigate('/role')}
            variant="contained"
            sx={{
              bgcolor: '#e0e0e0 !important',
              color: '#333',
              px: '20px',
              py: '10px',
              borderRadius: '4px',
              fontSize: '14px',
              '&:hover': { bgcolor: '#d5d5d5 !important' },
            }}
          >
            Quay lại
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default EditRole;