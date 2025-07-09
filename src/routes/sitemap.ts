export interface SubMenuItem {
  name: string;
  pathName: string;
  path: string;
  icon?: string;
  active?: boolean;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  subheader: string;
  path?: string;
  icon?: string;
  avatar?: string;
  active?: boolean;
  hidden?: boolean; // 👈 thêm để điều kiện hiển thị
  items?: SubMenuItem[];
}

// 👇 Kiểm tra đăng nhập
const token = localStorage.getItem('token');

const sitemap: MenuItem[] = [
  {
    id: 'Room',
    subheader: 'Phòng',
    path: '/',
    icon: 'material-symbols:hotel',
    active: true,
    hidden: !token,
  },
  {
    id: 'listbookings',
    subheader: 'Đặt Phòng',
    path: '/listbookings',
    icon: 'material-symbols:hotel',
    active: true,
    hidden: !token,
  },
  {
    id: 'room',
    subheader: 'Quản lý Phòng',
    icon: 'mdi:door',
    active: true,
    hidden: !token,
    items: [
      {
        name: 'Phòng Ẩn',
        pathName: 'hidden_rooms',
        path: '/hiddenrooms',
      },
      {
        name: 'Loại Phòng',
        pathName: 'room_types',
        path: '/room-types',
      },
      {
        name: 'Tiện nghi phòng',
        pathName: 'room_amenities',
        path: '/amenities',
      },
      {
        name: 'Danh mục Tiện nghi',
        pathName: 'amenity-categories',
        path: '/amenity-categories',
      },
    ],
  },
  {
    id: 'user',
    subheader: 'Người Dùng',
    icon: 'material-symbols:person',
    hidden: !token,
    items: [
      {
        name: 'Nhân viên',
        pathName: 'user',
        path: '/user',
      },
      {
        name: 'Phòng ban',
        pathName: 'departments',
        path: '/departments',
      },
    ],
  },
  {
    id: 'customer',
    subheader: 'Khách hàng',
    path: '/customer',
    icon: 'material-symbols:group',
    hidden: !token,
  },
  {
    id: 'promotions',
    subheader: 'Khuyến mãi',
    path: '/promotions',
    icon: 'material-symbols:percent',
    hidden: !token,
  },
  {
    id: 'calenda',
    subheader: 'Lịch',
    path: '/calenda',
    icon: 'material-symbols:calendar-month',
    hidden: !token,
  },
  {
    id: 'finance',
    subheader: 'Tài chính',
    path: '/finance',
    icon: 'mdi:finance',
    hidden: !token,
  },
  {
    id: 'service',
    subheader: 'Dịch vụ',
    icon: 'material-symbols:room-service-outline',
    hidden: !token,
    items: [
      {
        name: 'Dịch vụ',
        pathName: 'dichvu',
        path: '/service',
      },
      {
        name: 'Danh mục dịch vụ',
        pathName: 'dichvu_danhmuc',
        path: '/service-categories',
      },
    ],
  },
  {
    id: 'statistics',
    subheader: 'Thống kê',
    icon: 'material-symbols:analytics-outline',
    hidden: !token,
    items: [
      {
        name: 'Báo cáo',
        pathName: 'baocao',
        path: '/statistics',
      },
      {
        name: 'Dịch vụ',
        pathName: 'dichvu_thongke',
        path: '/statistics-services',
      },
      {
        name: 'Doanh thu',
        pathName: 'doanhthu_thongke',
        path: '/statistics-revenues',
      },
    ],
  },
  {
    id: 'account',
    subheader: 'Tài khoản',
    path: '/account',
    icon: 'material-symbols:account-circle',
    hidden: !token,
  },
  {
    id: 'settings',
    subheader: 'Cài đặt',
    path: '#!',
    icon: 'material-symbols:settings',
    hidden: !token,
  },
  {
    id: 'role',
    subheader: 'Vai trò',
    path: '/role',
    icon: 'material-symbols:admin-panel-settings',
    hidden: !token,
  },
  {
    id: 'authentication',
    subheader: 'Đăng nhập',
    icon: 'material-symbols:security',
    path: '/login',
    hidden: !!token, // Ẩn khi đã đăng nhập
  },
];

export default sitemap;
