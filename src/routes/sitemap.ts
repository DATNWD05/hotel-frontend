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
    id: 'oderRoom',
    subheader: 'Đặt Phòng',
    path: '/',
    icon: 'material-symbols:hotel',
    active: true,
  },
  {
    id: 'room',
    subheader: 'Phòng',
    icon: 'mdi:door',
    active: true,
    items: [
      {
        name: 'Loại Phòng',
        pathName: 'roomtype',
        path: '/rooms',
      },
      {
        name: 'Tầng',
        pathName: 'floor',
        path: '/room/floor',
      },
      {
        name: 'Cài Đặt Giá',
        pathName: 'price',
        path: '/room/price',
      },
    ],
  },
  {
    id: 'user',
    subheader: 'Người Dùng',
    path: '/user',
    icon: 'material-symbols:person',
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
    path: '/',
    icon: 'mdi:finance',
  },
  {
    id: 'service',
    subheader: 'Dịch vụ',
    path: '#!',
    icon: 'material-symbols:room-service-outline',
  },
  {
    id: 'report',
    subheader: 'Báo cáo',
    path: '#!',
    icon: 'material-symbols:analytics-outline',
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