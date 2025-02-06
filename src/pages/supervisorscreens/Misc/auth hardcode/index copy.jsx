import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../../../../components/layout/MainLayout';
import OperatorDashboard from '../../../operatorscreens/dashboard';
import Inventory from '../../../operatorscreens/inventory/inventoryRequest';
import SupervisorDashboard from '../../dashboard';

import JobDetails from '../../../operatorscreens/jobdetails';
import AlertScreens from '../../../operatorscreens/AlertScreens';
import Login from '../../../auth/Login';
import Planning from '../../productionplanning/planning';
import Scheduling from '../../productionplanning/scheduling';

import InventoryUsageAndAnalytics from '../../inventory/inventoryMaster';
import RequestsCalibrationHistory from '../../inventory/requestsCalibrationHistory';

import ProductionMonitoring from '../../ProductionMon'
import OrderDashboard from '../../ordermanagement/orderdashboard';

import MaintenanceScreen from '../../../operatorscreens/MaintenanceScreen';
import InspectionResult from '../../../operatorscreens/InspectionResult';
import HelpAndSupport from '../../../operatorscreens/HelpAndSupport';
import DocumentManagement from '../../documentmanagement';
import QualityManagement from '../../qualitymanagement';
// import HelpAndSupport from '../pages/operatorscreens/HelpAndSupport';


// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
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
     
        <MainLayout />
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
             
                <OperatorDashboard />
            ),
          },
          {
            path: 'job-details',
            element: <JobDetails />,
          },
          {
            path: 'alerts',
            element: (
             
                <AlertScreens />
            ),
          },
          {
            path: 'maintenance',
            element: (
            
                <MaintenanceScreen/>
            ),
          },
          // Updated Inspection Route
          {
            path: 'inspection',
            element: (
              
                <InspectionResult />
            ),
          },
          {
            path: 'inventory',
            element: <Inventory />,
          },
          {
            path: 'help',
            element: (
             
                <HelpAndSupport />
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
              
                <SupervisorDashboard />
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
                 
                    <Planning />
                ),
              },
              {
                path: 'planning',
                element: (
                  
                    <Planning />
                ),
              },
              {
                path: 'scheduling',
                element: (
                
                    <Scheduling />
                ),
              },
            ],
          },
          {
            path: 'production-monitoring',
            element: (
            
                <ProductionMonitoring />
            ),
          },
          {
            path: 'quality-management',
            element: (
             
                <QualityManagement />
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
            path: 'documents',
            element: (
              
                <DocumentManagement />
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
