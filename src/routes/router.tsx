import { rootPaths } from './paths';
import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/main-layout';
import Splash from '../components/loader/Splash';

import PageLoader from '../components/loader/PageLoader';
import AuthLayout from '../layouts/auth-layout';

const App = lazy(() => import('../App'));
const Dashboard = lazy(() => import('../pages/Dashboard'));

const router = createBrowserRouter(
  [
    {
      element: (
        <Suspense fallback={<Splash />}>
          <App />
        </Suspense>
      ),
      children: [
        {
          path: '/',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <Dashboard />,
            },
          ],
        },
        {
          path: rootPaths.authRoot,
          element: (
            <AuthLayout>
              <Outlet />
            </AuthLayout>
          ),
        },
      ],
    },
  ],
  {
    basename: '/venus',
  },
);

export default router;
