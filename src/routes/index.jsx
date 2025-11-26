import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import OperatorDashboard from '../pages/operatorscreens/dashboard';
import Inventory from '../pages/operatorscreens/inventory/inventoryRequest';
import SupervisorDashboard from '../pages/supervisorscreens/dashboard';

import MachineMaintenance from '../pages/supervisorscreens/MachineMaintenance/MachineMaintenance';

import JobDetails from '../pages/operatorscreens/jobdetails';
import JobDetails from '../pages/operatorscreen/NewOperatorDashboard';
import AlertScreens from '../pages/operatorscreens/AlertScreens';
import Login from '../pages/auth/Login';
import Planning from '../pages/supervisorscreens/productionplanning/planning';
import Scheduling from '../pages/supervisorscreens/productionplanning/scheduling';
import CapacityPlanning from '../components/ProductionPlanning/CapacityPlanning';
import RequestsCalibrationHistory from '../pages/supervisorscreens/inventory/requestsCalibrationHistory';


import ProductionMonitoring from '../pages/supervisorscreens/ProductionMon'
import OrderDashboard from '../pages/supervisorscreens/ordermanagement/orderdashboard';

import ConfigurationDashboard from '../pages/supervisorscreens/configuration/WorkcenterDashboard';

import MaintenanceScreen from '../pages/operatorscreens/maintanance/MaintenanceDashboard';
import InspectionResult from '../pages/operatorscreens/InspectionResult';
import HelpAndSupport from '../pages/operatorscreens/HelpAndSupport';
import MaintenanceDashboard from '../pages/supervisorscreens/MachineMaintenance/MaintenanceDashboard';
import DocumentManagement from '../pages/supervisorscreens/DocumentManagement';
import QualityManagement from '../pages/supervisorscreens/QualityManagement';
import EnergyMonitoring from '../pages/supervisorscreens/EnergyMonitoring/EnergyMonitoring';
import MaintenanceDashboard from '../pages/supervisorscreens/MachineMaintenance/MaintenanceDashboard';
import NewOperatorDashboard from '../pages/operatorscreen/NewOperatorDashboard';
// import HelpAndSupport from '../pages/operatorscreens/HelpAndSupport';


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
                <NewOperatorDashboard />
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
                <MaintenanceScreen/>
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
            path: 'maintenance',
            element: <MaintenanceDashboard />,

          },
          {
            path: 'configuration',
            element: <ConfigurationDashboard />,

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
                path: 'capacity_planning',
                element: (
                  <ProtectedRoute allowedRole="supervisor">
                    <CapacityPlanning />
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
            path: 'energy-monitoring',
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <EnergyMonitoring />
              </ProtectedRoute>
            ),
          },
          {
            path: 'machine_availability',
            element: (
              <ProtectedRoute allowedRole="supervisor">
                <MachineMaintenance />
              </ProtectedRoute>
            ),
          },
          {
            path: 'documents',
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
])