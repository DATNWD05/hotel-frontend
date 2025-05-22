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
    id: 'dashboard',
    subheader: 'Dashboard',
    path: '/',
    icon: 'ri:dashboard-fill',
    // active: true,
  },
  {
    id: 'activity',
    subheader: 'Activity',
    path: '#!',
    icon: 'ic:baseline-show-chart',
  },
  {
    id: 'library',
    subheader: 'Library',
    path: '/auth',
    icon: 'material-symbols:local-library-outline',
  },
  {
    id: 'authentication',
    subheader: 'Authentication',
    icon: 'ic:round-security',
    // active: true,
    items: [
      {
        name: 'Đăng nhập',
        pathName: 'sigin',
        path: '/auth/login',
      },
      {
        name: 'Đăng ký',
        pathName: 'signup',
        path: '/auth/register',
      },
    ],
  },
  {
    id: 'schedules',
    subheader: 'Schedules',
    path: '#!',
    icon: 'ic:outline-calendar-today',
  },
  {
    id: 'payouts',
    subheader: 'Payouts',
    path: '#!',
    icon: 'material-symbols:account-balance-wallet-outline',
  },
  {
    id: 'settings',
    subheader: 'Settings',
    path: '#!',
    icon: 'ic:outline-settings',
  },
];

export default sitemap;
