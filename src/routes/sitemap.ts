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
  items?: SubMenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: 'Room',
    subheader: 'Phòng',
    path: '/',
    icon: 'material-symbols:hotel',
    active: true,
  },
  {
    id: 'listbookings',
    subheader: 'Đặt Phòng',
    path: '/listbookings',
    icon: 'material-symbols:hotel',
    active: true,
  },
  {
    id: 'room',
    subheader: 'Quản lý Phòng',
    icon: 'mdi:door',
    active: true,
    items: [
      {
        name: 'Phòng Ẩn',
        pathName: 'hidden_rooms ',
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
    ]
  },
  {
    id: 'customer',
    subheader: 'Khách hàng',
    path: '/customer',
    icon: 'material-symbols:group',
  },
  {
    id: 'promotions',
    subheader: 'Khuyến mãi',
    path: '/promotions',
    icon: 'material-symbols:percent',
  },
  {
    id: 'calenda',
    subheader: 'Lịch',
    path: '/calenda',
    icon: 'material-symbols:calendar-month',
  },
  {
    id: 'finance',
    subheader: 'Tài chính',
    path: '/finance',
    icon: 'mdi:finance',
  },
  {
    id: 'service',
    subheader: 'Dịch vụ',
    icon: 'material-symbols:room-service-outline', // dịch vụ phòng
    items:[
      {
        name: 'Dịch vụ',
        pathName: 'dichvu',
        path: '/service'
      },
      {
        name: 'Danh mục dịch vụ',
        pathName: 'dichvu_danhmuc',
        path: '/service-categories'
      }
    ]
  },
  {
    id: 'statistics',
    subheader: 'Thống kê',
    icon: 'material-symbols:analytics-outline', // dịch vụ phòng
    items:[
      {
        name: 'Báo cáo',
        pathName: 'dichvu',
        path: '/statistics'
      },
      {
        name: 'Dịch vụ',
        pathName: 'dichvu_thongke',
        path: '/statistics-services'
      },
      {
        name: 'Doanh thu',
        pathName: 'doanhthu_thongke',
        path: '/statistics-revenues'
      }
    ]
  },
  {
    id: 'account',
    subheader: 'Tài khoản',
    path: '#!',
    icon: 'material-symbols:account-circle',
  },
  {
    id: 'settings',
    subheader: 'Cài đặt',
    path: '#!',
    icon: 'material-symbols:settings',
  },
  {
    id: 'role',
    subheader: 'Vai trò',
    path: '/role',
    icon: 'material-symbols:admin-panel-settings', // Updated icon
  },
  {
    id: 'authentication',
    subheader: 'Đăng nhập',
    icon: 'material-symbols:security',
    path: '/login',
  },
];

export default sitemap;