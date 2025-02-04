import React, { useState } from 'react';
import { 
  Card, Button, Input, Layout, Modal, Tabs,
  Row, Col, Statistic, Badge, Space, Progress, Avatar,
  Tooltip, Divider, Alert, message, Tag
} from 'antd';
import { 
  ClockCircleOutlined, UserOutlined, BellOutlined,
  ToolOutlined, CheckCircleOutlined, FileTextOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  FileText, Eye, Gauge, Settings, AlertOctagon,
  Clock, Activity, Power, ArrowUpCircle,
  AlertCircle, Ticket,
  Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';
import IPID from '../operatorscreens/JobDetails/IPID';
import OperationDetails from '../operatorscreens/JobDetails/OperationDetails';
import PokaYokeChecklist from '../operatorscreens/JobDetails/PokaYokeChecklist';

const { Content } = Layout;
const { TabPane } = Tabs;

// Mock data definition
const mockJobData = {
  jobId: 'JOB-2024-001',
  partNumber: 'PA-0014',
  partName: 'Aluminum Housing',
  batchSize: 120,
  priority: 'High',
  jobDetails: {
    customer: 'ABC Manufacturing',
    orderNumber: 'ORD-2024-001',
    dueDate: '2024-01-15',
    orderQuantity: 120,
    completedQuantity: 75,
    remainingQuantity: 45,
    partnumber: 'PA-001',
    partname: 'Aluminum Housing',
    parameters: {
      orderNumber: 'ORD-2024-001',
      customer: 'ABC Manufacturing',
      dueDate: '2024-01-15'
    }
  },
  machine: {
    id: 'OP10',
    name: 'DMG DMU 60 eVo',
    status: 'down',
    efficiency: 92,
    currentCycle: '02:45',
    nextMaintenance: '4hrs',
    alerts: 2,
    totalParts: 120,
    completedParts: 75,
    parameters: {
      speed: '1200 RPM',
      feed: '300 mm/min',
      temperature: '28°C'
    }
  },
  quality: {
    inspectionPoints: 5,
    completedInspections: 3,
    lastInspection: '11:30 AM',
    deviations: 0
  }
};

const JobDetails = () => {
  // State management
  const [jobData, setJobData] = useState(mockJobData);
  const [activeTab, setActiveTab] = useState('operations');
  const [showPokaYoke, setShowPokaYoke] = useState(false);
  const [partCount, setPartCount] = useState(jobData.machine.completedParts);
  const currentShift = "Morning"; // This could be dynamic
  const currentTime = new Date().toLocaleTimeString();

  const [inputValue, setInputValue] = useState('');
  
  const handleUpdate = () => {
    const newCount = parseInt(inputValue);
    if (isNaN(newCount) || newCount > jobData.batchSize) {
      message.error('Invalid count value');
      return;
    }
    setPartCount(newCount);
    setInputValue('');
    message.success('Part count updated successfully');
  };

  const handleRaiseTicket = () => {
    message.success('Maintenance ticket raised successfully');
  };

  const getMachineStatusColor = (status) => {
    const colors = {
      running: 'green',
      idle: 'orange',
      down: 'red',
      maintenance: 'blue'
    };
    return colors[status] || 'gray';
  };

  return (
    <Layout className="h-screen flex flex-col bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button icon={<ArrowLeftOutlined />} size="large">
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold mb-1">Job Details</h1>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={16} />
              <span>Last updated: 5 mins ago</span>
            </div>
          </div>
        </div>
        
        <Space size="large">
          <Button type="primary" icon={<BellOutlined />}>
            Notifications
          </Button>
          
        </Space>
      </div>

      {/* Main Content Area */}
      <Content className="p-6 flex-1 overflow-hidden">
        <div className="h-full flex flex-col gap-6">
          {/* Status Cards Grid */}
          <div className="grid grid-cols-4 gap-6 h-1/2">
            {/* Machine Status Card */}
            <div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100 flex bg-sky-200 justify-between items-center">
                <div className="flex items-center gap-2 bg-sky-100 p-1 px-2 rounded-lg">
                  <Wrench className="text-blue-500" />
                  <span className="font-semibold">Machine Status</span>
                </div>
                <Badge 
                  status={getMachineStatusColor(jobData.machine.status)}
                  text={jobData.machine.status.toUpperCase()}
                />
              </div>
              <div className="p-4 ">
                <div className="mb-4 ">
                  <img 
                    src="/dmg.png"
                    alt="Machine" 
                    className="w-full bg-sky-100 h-36 object-fit rounded-lg mb-3"
                  />
                  <div className='bg-sky-100 p-1 px-2 rounded-lg'>
                  <div className="text-lg font-bold ">{jobData.machine.name}</div>
                  <div className="text-gray-500 text-sm">ID: {jobData.machine.id}</div>
                  </div>
                  
                </div>
                <Divider className="my-2" />
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <div className="text-sm text-gray-500">Efficiency</div>
                    <div className="text-xl font-semibold text-green-500">
                      {jobData.machine.efficiency}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Cycle Time</div>
                    <div className="text-xl font-semibold">
                      {jobData.machine.currentCycle}
                    </div>
                  </div>
                </div>
                {jobData.machine.status !== 'running' && (
                  <Button 
                    type="primary" 
                    danger
                    icon={<Ticket className="h-4 w-4" />}
                    onClick={handleRaiseTicket}
                    className="w-full"
                  >
                    Raise Ticket
                  </Button>
                )}
              </div>
            </div>

            {/* Current Job Details Card */}
            <div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-sky-100">
    <div className="px-4 py-3 border-b border-sky-100 flex items-center gap-2 bg-gradient-to-r from-sky-100 to-sky-50">
      <FileText className="text-blue-600" />
      <span className="font-semibold">Current Job</span>
    </div>
    <div className="p-4">
      <div className="bg-sky-100/50 rounded-lg p-3 mb-4">
        <div className="text-sm text-gray-600">Part Name</div>
        <div className="text-xl font-bold text-blue-700">
          {jobData.jobDetails.partname}
        </div>
        <div className="inline-block bg-sky-200 px-2 py-1 rounded mt-1 text-sm">
          #{jobData.jobDetails.partnumber}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center bg-sky-50 p-2 rounded">
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <UserOutlined className="text-blue-600" />
          </div>
          <div className="ml-3 flex-1 bg-white p-1 px-2 rounded-lg">
            <div className="text-sm text-gray-500">Customer</div>
            <div className="font-medium">{jobData.jobDetails.customer}</div>
          </div>
        </div>
        <div className="flex items-center bg-sky-50 p-2 rounded">
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <FileTextOutlined className="text-blue-600" />
          </div>
          <div className="ml-3 flex-1 bg-white p-1 px-2 rounded-lg">
            <div className="text-sm text-gray-500 ">Order #</div>
            <div className="font-medium">{jobData.jobDetails.orderNumber}</div>
          </div>
        </div>
        <div className="flex items-center bg-sky-50 p-2 rounded">
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm text-gray-500">Due Date</div>
            <Tag color="blue" className="mt-1">{jobData.jobDetails.dueDate}</Tag>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-sky-100">
      <div className="px-4 py-3 border-b border-sky-100 flex items-center gap-2 bg-gradient-to-r from-sky-100 to-sky-50">
        <Activity className="text-blue-600" />
        <span className="font-semibold">Production Progress</span>
      </div>
      <div className="p-2">
        <div className="flex justify-center mb-4">
          <Progress 
            type="dashboard"
            percent={Math.round((partCount / jobData.batchSize) * 100)}
            strokeColor={{
              '0%': '#38bdf8',
              '100%': '#0ea5e9',
            }}
            width={160}
          />
        </div>
        <div className="bg-sky-100/50 rounded-lg p-2 mb-2">
          <div className="grid grid-cols-3 gap-4">
            <Statistic 
              title={<span className="text-gray-600">Total</span>}
              value={jobData.batchSize}
              className="text-center"
            />
            <Statistic 
              title={<span className="text-gray-600">Completed</span>}
              value={partCount}
              className="text-center"
              valueStyle={{ color: '#0ea5e9' }}
            />
            <Statistic 
              title={<span className="text-gray-600">Remaining</span>}
              value={jobData.batchSize - partCount}
              className="text-center"
              valueStyle={{ color: '#ef4444' }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm font-medium mb-2">Update Part Count</div>
          <Space.Compact className="w-full">
            <Input 
              placeholder="Enter count"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              type="number"
              max={jobData.batchSize}
            />
            <Button 
              type="primary"
              onClick={handleUpdate}
              className="bg-blue-500"
            >
              Update
            </Button>
          </Space.Compact>
        </div>
      </div>
    </div>

            {/* Quality Status Card */}
            <div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-sky-100">
      <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-100 to-sky-50">
        <div className="flex items-center gap-2">
          <Eye className="text-blue-600" />
          <span className="font-semibold">Quality Status and Poka Yoke</span>
        </div>
        <Tag color={jobData.quality.deviations === 0 ? 'success' : 'error'}>
          {jobData.quality.deviations === 0 ? 'No Issues' : `${jobData.quality.deviations} Issues`}
        </Tag>
      </div>
      <div className="p-4">
        <div className="bg-sky-100/50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center bg-white p-2 rounded">
              <Clock className="w-4 h-4 text-blue-600" />
              <div className="ml-2">
                <div className="text-xs text-gray-500">Current Time</div>
                <div className="font-medium">{currentTime}</div>
              </div>
            </div>
            <div className="flex items-center bg-white p-2 rounded">
              <UserOutlined className="text-blue-600" />
              <div className="ml-2">
                <div className="text-xs text-gray-500">Shift</div>
                <div className="font-medium">{currentShift}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 mb-4">
          <div className="text-sm font-medium mb-2">Inspection Status</div>
          <Progress 
            percent={Math.round((jobData.quality.completedInspections / jobData.quality.inspectionPoints) * 100)}
            status="active"
            strokeColor="#0ea5e9"
            className="mb-2"
          />
          <div className="text-xs text-gray-500">
            {jobData.quality.completedInspections} of {jobData.quality.inspectionPoints} checks completed
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => setShowPokaYoke(true)}
            className="w-full bg-blue-500"
          >
            Poka Yoke Checklist
          </Button>
          <div className="text-center text-xs text-gray-500">
            Last inspection: {jobData.quality.lastInspection}
          </div>
        </div>
      </div>
    </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden border border-gray-100">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              className="h-full flex flex-col"
              tabBarStyle={{ 
                background: '#f8fafc', 
                borderBottom: '1px solid #e2e8f0',
                padding: '0 16px',
                marginBottom: 0
              }}
            >
              <TabPane 
                tab={
                  <span className="flex items-center gap-2 px-2">
                    <FileText size={16} />
                    Operation Details
                  </span>
                } 
                key="operations"
              >
                <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 46px)' }}>
                  <OperationDetails jobData={jobData} />
                </div>
              </TabPane>
              <TabPane 
                tab={
                  <span className="flex items-center gap-2 px-2">
                    <AlertTriangle size={16} />
                    IPID
                  </span>
                } 
                key="ipid"
              >
                <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 46px)' }}>
                  <IPID jobData={jobData} />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </Content>

      {/* Poka-Yoke Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="text-blue-500" />
            <span>Quality Checklist</span>
          </div>
        }
        open={showPokaYoke}
        onCancel={() => setShowPokaYoke(false)}
        footer={null}
        width={800}
        className="quality-modal"
      >
        <PokaYokeChecklist jobId={jobData.jobId} />
      </Modal>

      <style jsx global>{`
        .ant-tabs-content {
          height: 100%;
        }
        
        .ant-tabs-tabpane {
          height: 100%;
        }

        .quality-modal .ant-modal-content {
          border-radius: 12px;
        }

        .quality-modal .ant-modal-header {
          border-radius: 12px 12px 0 0;
        }

        /* Card hover effects */
        .ant-card {
          transition: all 0.3s ease;
        }

        .ant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Button hover effects */
        .ant-btn {
          transition: all 0.2s ease;
        }

        .ant-btn:hover {
          transform: translateY(-1px);
        }

        /* Progress bar animations */
        .ant-progress-bg {
          transition: all 0.3s ease;
        }

        /* Tag hover effects */
        .ant-tag {
          transition: all 0.2s ease;
        }

        .ant-tag:hover {
          transform: scale(1.05);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* Tab animations */
        .ant-tabs-tab {
          transition: all 0.2s ease;
        }

        .ant-tabs-tab:hover {
          color: #1890ff;
          transform: translateY(-1px);
        }

        /* Modal animations */
        .ant-modal {
          transform-origin: top;
        }

        .ant-modal-enter,
        .ant-modal-appear {
          opacity: 0;
          transform: scale(0.95);
        }

        .ant-modal-enter-active,
        .ant-modal-appear-active {
          opacity: 1;
          transform: scale(1);
          transition: opacity 0.2s, transform 0.2s;
        }

        /* Stats animation */
        .ant-statistic-content {
          transition: all 0.3s ease;
        }

        .ant-statistic:hover .ant-statistic-content {
          transform: scale(1.05);
        }

        /* Badge animations */
        .ant-badge-status-dot {
          transition: all 0.3s ease;
        }

        .ant-badge:hover .ant-badge-status-dot {
          transform: scale(1.2);
        }

        /* Divider styling */
        .ant-divider {
          margin: 16px 0;
          border-top: 1px solid #f0f0f0;
        }

        /* Card header styling */
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          min-height: 48px;
        }

        /* Button group spacing */
        .ant-space {
          gap: 8px !important;
        }

        /* Dashboard layout */
        .dashboard-layout {
          min-height: 100vh;
        }

        /* Header styling */
        .site-header {
          background: #fff;
          padding: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        /* Content area */
        .site-content {
          padding: 24px;
          background: #f0f2f5;
        }

        /* Card grid responsive */
        @media (max-width: 1200px) {
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .grid-cols-4 {
            grid-template-columns: repeat(1, 1fr);
          }
        }

        /* Override Ant Design's default font family */
        :root {
          --font-family: 'CustomFont', system-ui, sans-serif;
        }

        body {
          font-family: var(--font-family);
        }

        .ant-btn,
        .ant-input,
        .ant-modal-title,
        .ant-tabs-tab,
        .ant-statistic-title,
        .ant-statistic-content,
        .ant-card-head-title,
        .ant-tag,
        .ant-badge,
        .ant-divider,
        .ant-modal-content,
        .ant-space {
          font-family: var(--font-family) !important;
        }
      `}</style>
    </Layout>
  );
};

export default JobDetails;