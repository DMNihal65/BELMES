import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/profile/Profile'
import Settings from '../pages/settings/Settings'
import SalesReport from '../pages/reports/SalesReport'
import UserAnalytics from '../pages/reports/UserAnalytics'
import Login from '../pages/auth/Login'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Unauthorized from '../pages/auth/Unauthorized'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
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
            element: (
              <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                <SalesReport />
              </ProtectedRoute>
            ),
          },
          {
            path: 'users',
            element: (
              <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                <UserAnalytics />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
  },
]) 