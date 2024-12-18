import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Login from '../pages/auth/Login';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }

  return children;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
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
        element: <Navigate to="/operator/dashboard" replace />,
      },
      // Operator Routes
      {
        path: 'operator',
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'job-details',
            element: <div>Job Details Page</div>,
          },
          {
            path: 'alerts',
            element: <div>Alert Screen</div>,
          },
          {
            path: 'maintenance',
            element: <div>Maintenance Guide</div>,
          },
          {
            path: 'inspection',
            element: <div>Inspection Results</div>,
          },
          {
            path: 'help',
            element: <div>Help and Support</div>,
          },
        ],
      },
      // Supervisor Routes
      {
        path: 'supervisor',
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'order-management',
            element: <div>Order Management</div>,
          },
          {
            path: 'capacity-planning',
            children: [
              {
                path: 'planning',
                element: <div>Capacity Planning</div>,
              },
              {
                path: 'scheduling',
                element: <div>Scheduling</div>,
              },
            ],
          },
          {
            path: 'production',
            element: <div>Production Monitoring</div>,
          },
          {
            path: 'quality',
            element: <div>Quality Management</div>,
          },
          {
            path: 'inventory',
            element: <div>Inventory Management</div>,
          },
          {
            path: 'documents',
            element: <div>Document Management</div>,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);