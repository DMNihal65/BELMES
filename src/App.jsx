import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import SupervisorDashboard from './pages/supervisorscreens/dashboard';
import OperatorDashboard from './pages/operatorscreens/dashboard';
import OrderDashboard from './pages/supervisorscreens/ordermanagement/orderdashboard';
import Planning from './pages/supervisorscreens/productionplanning/planning';
import Scheduling from './pages/supervisorscreens/productionplanning/scheduling';
import ProductionMonitoring from './pages/supervisorscreens/ProductionMon';
import DocumentManagement from './pages/supervisorscreens/DocumentManagement';
import InventoryUsageAndAnalytics from './pages/supervisorscreens/inventory/inventoryMaster';
import RequestsCalibrationHistory from './pages/supervisorscreens/inventory/requestsCalibrationHistory';
import JobDetails from './pages/operatorscreens/jobdetails';
import Inventory from './pages/operatorscreens/inventory/inventoryRequest';
import HelpAndSupport from './pages/operatorscreens/HelpAndSupport';
import QualityManagementDashboard from './pages/supervisorscreens/qualitymanagement';
import AlertScreens from './pages/operatorscreens/AlertScreens';
import MaintenanceScreen from './pages/operatorscreens/MaintenanceScreen';
import InspectionResult from './pages/operatorscreens/InspectionResult';
import InventoryManagement from './pages/supervisorscreens/InventoryManagement';

const App = () => {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Supervisor Routes */}
          <Route path="/supervisor" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<SupervisorDashboard />} />
            <Route path="order-management" element={<OrderDashboard />} />
            <Route path="production-planning/planning" element={<Planning />} />
            <Route path="production-planning/scheduling" element={<Scheduling />} />
            <Route path="production-monitoring" element={<ProductionMonitoring />} />
            <Route path="documents" element={<DocumentManagement />} />
            <Route path="quality-management" element={<QualityManagementDashboard />} />
            <Route path="inventory_master/inventory_usage_and_analytics" element={<InventoryUsageAndAnalytics />} />
            <Route path="inventory_master/requests_calibration_history" element={<RequestsCalibrationHistory />} />
            <Route path="inventory-management/*" element={<InventoryManagement />} />
          </Route>

          {/* Operator Routes */}
          <Route path="/operator" element={
            // <ProtectedRoute>
              <MainLayout />
            // </ProtectedRoute>
          }>
            <Route path="dashboard" element={<JobDetails />} />
            <Route path="alerts" element={<AlertScreens />} />
            <Route path="maintenance" element={<MaintenanceScreen />} />
            <Route path="inspection" element={<InspectionResult />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="help" element={<HelpAndSupport />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      <style jsx global>{`
        * {
          font-family: 'CustomFont', system-ui, sans-serif;
        }

        /* Ant Design specific overrides */
        .ant-btn,
        .ant-input,
        .ant-select,
        .ant-modal-title,
        .ant-tabs-tab,
        .ant-menu-item,
        .ant-dropdown-menu-item,
        .ant-statistic-title,
        .ant-statistic-content,
        .ant-card-head-title,
        .ant-tag,
        .ant-badge,
        .ant-divider,
        .ant-modal-content,
        .ant-space,
        .ant-typography {
          font-family: 'CustomFont', system-ui, sans-serif !important;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default App;
