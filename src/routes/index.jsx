import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/profile/Profile'
import Settings from '../pages/settings/Settings'
import SalesReport from '../pages/reports/SalesReport'
import UserAnalytics from '../pages/reports/UserAnalytics.jsx'
// import Inventory from '../pages/reports/Inventory'
// import UserList from '../pages/users/UserList'
// import UserRoles from '../pages/users/UserRoles'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'reports',
        children: [
          {
            path: 'sales',
            element: <SalesReport />,
          },
          {
            path: 'users',
            element: <UserAnalytics />,
          },
        //   {
        //     path: 'inventory',
        //     element: <Inventory />,
        //   },
        ],
      },
      {
        path: 'users',
        // children: [
        //   {
        //     path: 'list',
        //     element: <UserList />,
        //   },
        //   {
        //     path: 'roles',
        //     element: <UserRoles />,
        //   },
        // ],
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
], {
  basename: '/bel', // Set the base path
}) 