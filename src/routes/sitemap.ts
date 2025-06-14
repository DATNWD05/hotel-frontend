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
        name: 'Danh sách Phòng',
        pathName: 'rooms',
        path: '/rooms',
      },
      {
        name: 'Loại Phòng',
        pathName: 'room_types',
        path: '/room-types',
      },
      {
        name: 'Cài Đặt Giá',
        pathName: 'price',
        path: '/room-price',
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