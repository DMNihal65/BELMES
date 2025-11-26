import React from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import MachineDashboard from '../../components/ProductionMonitoring/MachineDashboard';
import ProductionSchedule from '../../components/ProductionMonitoring/ProductionSchedule';
import ProductionAnalytics from '../../components/ProductionMonitoring/ProductionAnalytics';
import OEEDashboard from '../../components/ProductionMonitoring/OEEDashboard';
import ProductionOrderAnalysis from '../../components/ProductionMonitoring/ProductionOrderAnalysis';
import useProductionStore from '../../store/productionStore';
import OrderTracking from '../../components/ProductionMonitoring/OrderTracking';

const { Content } = Layout;

const ProductionMon = () => {
  const location = useLocation();
  const { initializeWebSocket, cleanup, fetchProductionSchedule } = useProductionStore();

  // Initialize WebSocket and fetch initial data
  React.useEffect(() => {
    initializeWebSocket();
    fetchProductionSchedule();
    return () => cleanup();
  }, []);

  // Render component based on current path
  const renderComponent = () => {
    const path = location.pathname;

    switch (path) {
      case '/supervisor/production-monitoring/dashboard':
        return <MachineDashboard />;
      case '/supervisor/production-monitoring/production-vs-actual':
        return <ProductionSchedule />;
      case '/supervisor/production-monitoring/order-analysis':
        return <ProductionOrderAnalysis />;
      case '/supervisor/production-monitoring/analytics':
        return <ProductionAnalytics />;
      case '/supervisor/production-monitoring/oee-overview':
        return <OEEDashboard />;
        case '/supervisor/production-monitoring/order-tracking':
        return <OrderTracking />;
      
        case '/admin/production-monitoring/dashboard':
          return <MachineDashboard />;
        case '/admin/production-monitoring/production-vs-actual':
          return <ProductionSchedule />;
        case '/admin/production-monitoring/order-analysis':
          return <ProductionOrderAnalysis />;
        case '/admin/production-monitoring/analytics':
          return <ProductionAnalytics />;
        case '/admin/production-monitoring/oee-overview':
          return <OEEDashboard />;
          case '/admin/production-monitoring/order-tracking':
            return <OrderTracking />;
      default:
        return <MachineDashboard />; // Default to machine dashboard
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        {renderComponent()}
      </Content>
    </Layout>
  );
};

export default ProductionMon;