import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import OperatorDashboard from '../pages/operatorscreens/dashboard';
import Inventory from '../pages/operatorscreens/inventory/inventoryRequest';
import SupervisorDashboard from '../pages/supervisorscreens/dashboard';
import OrderManagement from '../pages/supervisorscreens/OrderManagement';
import JobDetails from '../pages/operatorscreens/jobdetails';
import AlertScreens from '../pages/operatorscreens/AlertScreens';
import Login from '../pages/auth/Login';
import Planning from '../pages/supervisorscreens/productionplanning/planning';
import Scheduling from '../pages/supervisorscreens/productionplanning/scheduling';

import InventoryUsageAndAnalytics from '../pages/supervisorscreens/inventory/inventoryMaster';
import RequestsCalibrationHistory from '../pages/supervisorscreens/inventory/requestsCalibrationHistory';
import JobDetails from '../pages/operatorscreens/jobdetails';
// import Inventory from '../pages/operatorscreens/inventory/inventory';
import ProductionMonitoring from '../pages/supervisorscreens/productionMonitoring';
import OrderDashboard from '../pages/supervisorscreens/ordermanagement/orderdashboard';


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
            element: (
              <ProtectedRoute allowedRole="operator">
                <OperatorDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'job-details',
            element: <JobDetails />,
          },
          {
            path: 'alerts',
            element: (
              <ProtectedRoute allowedRole="operator">
                <AlertScreens />
              </ProtectedRoute>
            ),
          },
          {
            path: 'maintenance',
            element: (
              <ProtectedRoute allowedRole="operator">
                <MaintenanceScreen />
              </ProtectedRoute>
            ),
          },
          // Updated Inspection Route
          {
            path: 'inspection',
            element: (
              <ProtectedRoute allowedRole="operator">
                <InspectionResult />
              </ProtectedRoute>
            ),
          },
          {
            path: 'inventory',
            element: <Inventory />,
          },
          {
            path: 'help',
            element: (
              <ProtectedRoute allowedRole="operator">
                <HelpAndSupport />
              </ProtectedRoute>
            ),
          },
        ],
      },
      // Supervisor Routes
      {
        path: 'supervisor',
        children: [
          {
            path: 'dashboard',
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'order-management',

            element: <OrderDashboard />,

          },
          {
            path: 'production-planning',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute allowedRole="supervisor">
                    <Planning />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'planning',
                element: (
                  <ProtectedRoute allowedRole="supervisor">
                    <Planning />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'scheduling',
                element: (
                  <ProtectedRoute allowedRole="supervisor">
                    <Scheduling />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'production',
            element: <ProductionMonitoring />,
          },
          {
            path: 'quality-management',
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <QualityManagement />
              </ProtectedRoute>
            ),
          },
          {

            path: 'inventory_master',
            children: [
              {
                path: 'inventory_usage_and_analytics',
                element: <InventoryUsageAndAnalytics />,
              },
              {
                path: 'requests_calibration_history',
                element: <RequestsCalibrationHistory />,
              },
            ]

          },
          {
            path: 'document-management',
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <DocumentManagement />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },

