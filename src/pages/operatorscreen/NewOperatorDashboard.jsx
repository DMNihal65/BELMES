import React, { useEffect, useState } from 'react';
import { Layout, Tabs, Card, Button, message, Spin, Badge, Dropdown, Row, Col, Tooltip, Modal } from 'antd';
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
  User,
  MessageCircle,
  Activity,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import JobSelectionPanel from './OperatorComponents/JobSelectionPanel';
import MachineStatusCard from './OperatorComponents/MachineStatusCard';
import CurrentJobCard from './OperatorComponents/CurrentJobCard';
import OperationDetailsCard from './OperatorComponents/OperationDetailsCard';
import ProductionCard from './OperatorComponents/ProductionCard';
import DocumentsCard from './OperatorComponents/DocumentsCard';
import FeedbackCard from './OperatorComponents/FeedbackCard';
import FeedbackModal from '../operatorscreens/FeedbackModal';
import PokaYokeChecklist from '../operatorscreens/JobDetails/PokaYokeChecklist';
import useOperatorStore from '../../store/operator-store';


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
    machineId,
    closeWebSocket // <-- Add this from the store
  } = useOperatorStore();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [showPokaYoke, setShowPokaYoke] = useState(false);
  const [showError, setShowError] = useState(false);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  


  // Initialize dashboard and clean up WebSocket on unmount
  useEffect(() => {
    console.log("NewOperatorDashboard: mount/initializeDashboard");
    initializeDashboard();
    return () => {
      console.log("NewOperatorDashboard: unmount/closeWebSocket");
      // Clean up WebSocket connection when component unmounts
      if (typeof closeWebSocket === 'function') {
        closeWebSocket();
      }
    };
  }, []); // Only run on mount/unmount

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMachineOperations(machineIdFromStorage, true);
      message.success('Dashboard refreshed');
    } catch (error) {
      message.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = (feedback) => {
    message.success('Feedback submitted successfully');
    setFeedbackModalVisible(false);
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

  // Get machine ID from local storage
  const getMachineIdFromStorage = () => {
    try {
      const currentMachineStr = localStorage.getItem('currentMachine');
      if (currentMachineStr) {
        const currentMachine = JSON.parse(currentMachineStr);
        return currentMachine?.id || machineId;
      }
      return machineId;
    } catch (error) {
      console.error('Error retrieving machine ID from localStorage:', error);
      return machineId;
    }
  };

  const userInfo = getUserInfo();
  const machineIdFromStorage = getMachineIdFromStorage();
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
      <Button type="text" icon={<User size={18} />} className="text-sky-500" />
    </Dropdown>
  );

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-sky-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm">
          <Spin size="large" />
          <div className="mt-4 text-gray-600 font-medium">Initializing dashboard...</div>
          <p className="text-gray-500 text-sm mt-2">Loading machine data and configurations</p>
        </div>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-sky-50">
      {/* Header with Dashboard Title and Status */}
      <div className="bg-white shadow-sm p-2 flex justify-between items-center sticky top-0 z-10 border-b border-sky-100">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-sky-600" size={20} />
          <div>
            <h1 className="text-lg font-bold mb-0 text-sky-800">Operator Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0">
              {machineStatus?.machine_name || 'Loading machine...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={machineStatus?.status === 'PRODUCTION' ? 'success' : machineStatus?.status === 'IDLE' ? 'warning' : 'error'} />
          <div className="text-xs flex flex-col items-end">
            <span className="text-gray-700 font-medium">{currentTime}</span>
          </div>
          
          
          
          <Tooltip title="Select Job">
            <Button 
              type="primary" 
              className="bg-sky-500 hover:bg-sky-600 flex items-center"
              size="large"
              icon={<Package size={14} />}
              onClick={() => setJobSelectionModalVisible(true)}
            >
              Select Job
            </Button>
          </Tooltip>
          
          {/* <Tooltip title="Refresh Dashboard">
            <Button 
              icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} 
              onClick={handleRefresh}
              disabled={refreshing}
              type="text"
              className="text-sky-500"
            />
          </Tooltip> */}
          
          {/* {userMenu} */}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <Content className="p-3 overflow-auto">
        { showError && error && (
          <div className="mb-3">
            <Card className="bg-red-50 border-red-200 shadow-sm">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            </Card>
          </div>
        )}

        {/* Dashboard Layout - Based on the reference image with lines */}
        <Row gutter={[12, 12]}>
          {/* Left Column - Machine Status */}
          <Col xs={24} lg={8}>
            <MachineStatusCard />
          </Col>
          
          {/* Middle Column - Production Progress */}
          <Col xs={24} lg={8}>
            <ProductionCard />
          </Col>
          
          {/* Right Column - Feedback Form */}
          
          
          {/* Bottom Row - Current Job Card */}
          <Col xs={24} lg={8}>
            <CurrentJobCard />
          </Col>
          
          {/* Bottom Middle/Right - Operations/Documents Tabs */}
          <Col xs={24} lg={16}>
            <Card 
              className="shadow-sm status-card border-sky-100" 
              bodyStyle={{ padding: 0 }}
            >
              <Tabs 
                defaultActiveKey="operations" 
                type="card"
                className="dashboard-tabs"
                tabBarStyle={{ marginBottom: 0, paddingLeft: 8, paddingRight: 8, paddingTop: 8 }}
                // tabBarExtraContent={
                //   <div className="text-xs text-gray-500 px-3">
                //     {selectedJob ? (
                //       <div className="flex items-center">
                //         <Package size={14} className="mr-1" />
                //         <span>{selectedJob.part_number} · {selectedOperation?.operation_description || 'No operation selected'}</span>
                //       </div>
                //     ) : 'No job selected'}
                //   </div>
                // }
              >
                <TabPane 
                  tab={<span className="flex items-center gap-1"><ClipboardList size={14} />Operations</span>} 
                  key="operations"
                >
                  <OperationDetailsCard />
                </TabPane>
                <TabPane 
                  tab={<span className="flex items-center gap-1"><FileText size={14} />Documents</span>} 
                  key="documents"
                >
                  <DocumentsCard />
                </TabPane>
              </Tabs>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="shadow-sm status-card border-sky-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-sky-600" size={18} />
                  <span className="font-medium">Poka Yoke & Feedback</span>
                </div>
              </div>
              
              {/* Poka Yoke Button */}
              <Button 
                type="primary"
                onClick={() => setShowPokaYoke(true)}
                className="w-full bg-white hover:bg-sky-50 text-sky-600 border-sky-200 hover:border-sky-300 flex items-center justify-center gap-2 h-auto py-3 mb-4"
              >
                <div className="flex flex-col items-center">
                  <span className="font-medium">Open Poka Yoke Checklist</span>
                  <span className="text-xs text-sky-400">Review and complete poka yoke checkpoints</span>
                </div>
              </Button>

              <FeedbackCard />
            </Card>
          </Col>
        </Row>
      </Content>

      {/* Modals */}
      <JobSelectionPanel
        visible={isJobSelectionModalVisible}
        onClose={() => setJobSelectionModalVisible(false)}
      />
      
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Poka Yoke Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-sky-500" />
            <span>Poka Yoke Checklist</span>
          </div>
        }
        open={showPokaYoke}
        onCancel={() => setShowPokaYoke(false)}
        footer={null}
        width={800}
        className="quality-modal"
      >
        <PokaYokeChecklist 
          jobId={selectedJob?.id} 
          partNumber={selectedJob?.part_number}
          machineId={machineIdFromStorage}
          visible={showPokaYoke}
          onClose={() => setShowPokaYoke(false)}
        />
      </Modal>
    </Layout>
  );
};

export default NewOperatorDashboard; 