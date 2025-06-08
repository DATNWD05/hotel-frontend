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
    icon: 'material-symbols:hotel', // khách sạn
    active: true,
  },
  {
    id: 'room',
    subheader: 'Phòng',
    icon: 'mdi:door', // cửa/phòng
    active: true,
    items: [
      {
        name: 'Loại Phòng',
        pathName: 'roomtype',
        path: '/room/type',
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
    icon: 'material-symbols:person', // biểu tượng người
  },
  {
    id: 'client',
    subheader: 'Khách hàng',
    path: '/client',
    icon: 'material-symbols:group', // nhóm người
  },
  {
  id: 'promotions',
  subheader: 'Khuyến mãi',
  path: '/promotions',
  icon: 'material-symbols:percent'
  },
  {
    id: 'calenda',
    subheader: 'Lịch',
    path: '/calenda',
    icon: 'material-symbols:calendar-month', // lịch
  },
  {
    id: 'finance',
    subheader: 'Tài chính',
    path: '/',
    icon: 'mdi:finance', // tài chính
  },
  {
    id: 'service',
    subheader: 'Dịch vụ',
    path: '#!',
    icon: 'material-symbols:room-service-outline', // dịch vụ phòng
  },
  {
    id: 'report',
    subheader: 'Báo cáo',
    path: '#!',
    icon: 'material-symbols:analytics-outline', // biểu tượng báo cáo
  },
  {
    id: 'account',
    subheader: 'Tài khoản',
    path: '#!',
    icon: 'material-symbols:account-circle', // tài khoản cá nhân
  },
  {
    id: 'settings',
    subheader: 'Cài đặt',
    path: '#!',
    icon: 'material-symbols:settings', // bánh răng
  },
  {
    id: 'authentication',
    subheader: 'Xác thực người dùng',
    icon: 'material-symbols:security', // bảo mật
    active: true,
    items: [
      {
        name: 'Đăng nhập',
        pathName: 'signin',
        path: '/auth/login',
      },
      {
        name: 'Đăng ký',
        pathName: 'signup',
        path: '/auth/register',
      },
    ],
  }
];

export default sitemap;