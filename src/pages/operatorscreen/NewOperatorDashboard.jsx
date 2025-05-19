import React, { useEffect, useState } from 'react';
import { Layout, Tabs, Card, Button, message, Spin, Badge, Dropdown } from 'antd';
import { 
  LayoutDashboard, 
  Gauge, 
  Package, 
  ClipboardList, 
  FileText, 
  AlertTriangle,
  Clock,
  Menu as MenuIcon,
  RefreshCw,
  User
} from 'lucide-react';
import JobSelectionPanel from './OperatorComponents/JobSelectionPanel';
import MachineStatusCard from './OperatorComponents/MachineStatusCard';
import CurrentJobCard from './OperatorComponents/CurrentJobCard';
import OperationDetailsCard from './OperatorComponents/OperationDetailsCard';
import ProductionCard from './OperatorComponents/ProductionCard';
import DocumentsCard from './OperatorComponents/DocumentsCard';
import useOperatorStore from '../../store/operator-store';
import './OperatorDashboard.css';

const { Content } = Layout;
const { TabPane } = Tabs;

const NewOperatorDashboard = () => {
  const { 
    initializeDashboard,
    isInitializing,
    selectedJob,
    selectedOperation,
    machineStatus,
    error,
    isJobSelectionModalVisible,
    setJobSelectionModalVisible,
    fetchMachineOperations,
    machineId
  } = useOperatorStore();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [refreshing, setRefreshing] = useState(false);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Initialize the dashboard on component mount
    initializeDashboard();
  }, [initializeDashboard]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMachineOperations(machineId, true);
      message.success('Dashboard refreshed');
    } catch (error) {
      message.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Get user info
  const getUserInfo = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        return parsedData?.state?.user || {};
      }
      return {};
    } catch (error) {
      return {};
    }
  };

  const userInfo = getUserInfo();
  const userMenu = (
    <Dropdown
      menu={{
        items: [
          {
            key: '1',
            label: 'User: ' + (userInfo.username || 'Unknown'),
          },
          {
            key: '2',
            label: 'Role: ' + (userInfo.role || 'Operator'),
          },
          {
            type: 'divider',
          },
          {
            key: '3',
            label: 'Last Login: ' + (new Date().toLocaleDateString()),
          },
        ],
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button type="text" icon={<User size={18} />} className="text-blue-500" />
    </Dropdown>
  );

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm">
          <Spin size="large" />
          <div className="mt-4 text-gray-600 font-medium">Initializing dashboard...</div>
          <p className="text-gray-500 text-sm mt-2">Loading machine data and configurations</p>
        </div>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Header with Dashboard Title and Status */}
      <div className="bg-white shadow-sm p-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-blue-600" size={22} />
          <div>
            <h1 className="text-xl font-bold mb-0 text-blue-800">Operator Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">
              {machineStatus?.machine_name || 'Loading machine...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge status={machineStatus?.status === 'PRODUCTION' ? 'success' : machineStatus?.status === 'IDLE' ? 'warning' : 'error'} />
          <div className="text-xs flex flex-col items-end">
            <span className="text-gray-700 font-medium">{currentTime}</span>
            <span className="text-gray-500">Machine ID: {machineId}</span>
          </div>
          
          <Button 
            type="primary" 
            className="bg-blue-500 ml-2"
            onClick={() => setJobSelectionModalVisible(true)}
          >
            Select Job
          </Button>
          
          <Button 
            icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} 
            onClick={handleRefresh}
            disabled={refreshing}
          />
          
          {userMenu}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <Content className="p-4 overflow-auto">
        {error && (
          <div className="mb-4">
            <Card className="bg-red-50 border-red-200 shadow-sm">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Status Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <MachineStatusCard />
          <CurrentJobCard />
          <ProductionCard />
        </div>

        {/* Main Dashboard Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <Tabs 
            defaultActiveKey="operations" 
            type="card"
            className="dashboard-tabs"
            tabBarExtraContent={
              <div className="text-xs text-gray-500 px-3">
                {selectedJob ? (
                  <div className="flex items-center">
                    <Package size={14} className="mr-1" />
                    <span>{selectedJob.part_number} · {selectedOperation?.operation_description || 'No operation selected'}</span>
                  </div>
                ) : 'No job selected'}
              </div>
            }
          >
            <TabPane 
              tab={<span className="flex items-center gap-2"><ClipboardList size={16} />Operations</span>} 
              key="operations"
            >
              <OperationDetailsCard />
            </TabPane>
            <TabPane 
              tab={<span className="flex items-center gap-2"><FileText size={16} />Documents</span>} 
              key="documents"
            >
              <DocumentsCard />
            </TabPane>
          </Tabs>
        </div>
      </Content>

      {/* Job Selection Modal */}
      <JobSelectionPanel
        visible={isJobSelectionModalVisible}
        onClose={() => setJobSelectionModalVisible(false)}
      />
    </Layout>
  );
};

export default NewOperatorDashboard; 