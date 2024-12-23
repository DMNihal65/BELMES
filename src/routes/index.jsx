import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import OperatorDashboard from '../pages/operatorscreens/dashboard';
import SupervisorDashboard from '../pages/supervisorscreens/dashboard';
import Login from '../pages/auth/Login';
import Planning from '../pages/supervisorscreens/productionplanning/planning';
import Scheduling from '../pages/supervisorscreens/productionplanning/scheduling';
import JobDetails from '../pages/operatorscreens/jobdetails';
import Inventory from '../pages/operatorscreens/inventory/inventory';
import ProductionMonitoring from '../pages/supervisorscreens/productionMonitoring';

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
            element: <OperatorDashboard/>,
          },
          {
            path: 'job-details',
            element: <JobDetails/>,
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
            path: 'inventory',
            element:<Inventory />,
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
            element: <SupervisorDashboard />,
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
                element: <Planning />,
              },
              {
                path: 'scheduling',
                element: <Scheduling />,
              },
            ],
          },
          {
            path: 'production',
            element: <ProductionMonitoring/>,
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