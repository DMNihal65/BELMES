import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import OperatorDashboard from '../pages/operatorscreens/dashboard';
import SupervisorDashboard from '../pages/supervisorscreens/dashboard';
import OrderManagement from '../pages/supervisorscreens/OrderManagement';
import JobDetails from '../pages/operatorscreens/JobDetails';
import AlertScreens from '../pages/operatorscreens/AlertScreens';
import Login from '../pages/auth/Login';
import Planning from '../pages/supervisorscreens/productionplanning/planning';
import Scheduling from '../pages/supervisorscreens/productionplanning/scheduling';
import MaintenanceScreen from '../pages/operatorscreens/MaintenanceScreen';
import Inventory from '../pages/operatorscreens/Inventory';
import InspectionResult from '../pages/operatorscreens/InspectionResult';
import HelpAndSupport from '../pages/operatorscreens/HelpAndSupport';
import InventoryManagement from '../pages/supervisorscreens/InventoryManagement';
import ProductionMonitoring from '../pages/supervisorscreens/ProductionMonitoring';
import DocumentManagement from '../pages/supervisorscreens/DocumentManagement';
import QualityManagement from '../pages/supervisorscreens/QualityManagement';

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
            element: (
              <ProtectedRoute allowedRole="operator">
                <JobDetails />
              </ProtectedRoute>
            ),
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
          {
            path: 'inspection',
            element: (
              <ProtectedRoute allowedRole="operator">
                <InspectionResult />
              </ProtectedRoute>
            ),
          },
          {
            path: 'help',
            element: (
              <ProtectedRoute allowedRole="operator">
                <HelpAndSupport />
              </ProtectedRoute>
            ),
          },
          {
            path: 'inventory',
            element: (
              <ProtectedRoute allowedRole="operator">
                <Inventory />
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
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <OrderManagement />
              </ProtectedRoute>
            ),
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
            path: 'production-monitoring',
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <ProductionMonitoring />
              </ProtectedRoute>
            ),
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
            path: 'inventory-management',
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <InventoryManagement />
              </ProtectedRoute>
            ),
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
]);