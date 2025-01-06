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
  Clock,
  SquareActivity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MPP from '../Mpp';
import IPID from '../IPID';
import OperationDetails from '../OperationDetails';
import PokaYokeChecklist from '../PokaYokeChecklist';

const { Content } = Layout;
const { TabPane } = Tabs;

// Mock data
const mockJobData = {
  jobId: 'JOB-2024-001',
  partNumber: 'PA-0014',
  partName: 'Aluminum Housing',
  batchSize: 120,
  priority: 'High',
  jobDetails:{
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
    //   orderQuantity: 120,
    // completedQuantity: 75,
    // remainingQuantity: 45,
      // dueDate: '2024-01-15',
    }
  },
  machine: {
    id: 'OP10',
    name: 'DMG DMU 60 eVo',
    status: 'running',
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
  operator: {
    id: 'OP-001',
    name: 'John Doe',
    shift: 'Morning',
    experience: '5 years',
    certification: 'Level 3',
    photo: null,
    lastLogin: '08:00 AM'
  },
  schedule: {
    startTime: '2024-01-15T08:00:00',
    endTime: '2024-01-15T16:00:00',
    breakTimes: ['10:30-10:45', '13:00-13:30'],
    estimatedCompletion: '15:30'
  },
  quality: {
    inspectionPoints: 5,
    completedInspections: 3,
    lastInspection: '11:30 AM',
    deviations: 0
  },
  steps: [
    { id: 1, title: 'Safety Checks', status: 'completed', time: '08:00' },
    { id: 2, title: 'Tool Setup', status: 'completed', time: '08:15' },
    { id: 3, title: 'Material Loading', status: 'completed', time: '08:30' },
    { id: 4, title: 'Program Verification', status: 'in-progress', time: '08:45' },
    { id: 5, title: 'Production Start', status: 'pending', time: '09:00' }
  ]
};

const JobDetails = () => {
  // State management
  const [jobData, setJobData] = useState(mockJobData);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPokaYoke, setShowPokaYoke] = useState(false);
  const [partCount, setPartCount] = useState(jobData.machine.completedParts);

  // Handle part count update
  const handlePartCountUpdate = (newCount) => {
    if (newCount > jobData.batchSize) {
      message.error('Count cannot exceed batch size');
      return;
    }
    setPartCount(newCount);
    message.success('Part count updated successfully');
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Top Status Bar */}
      <div className="bg-white px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className='flex justify-between items-center gap-2'>
            
         
              
            <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/operator/dashboard')}
                        size="large"
                      >
                        Back to Dashboard
                      </Button>
            
            
          </Link> 
          
        </div>
        
        <Space>
          <Button type="primary" icon={<BellOutlined />}>
            Notifications
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <Content className="p-6">
        {/* Status Cards */}
       
        <div className="grid grid-cols-4 gap-6 mb-6 ">
          {/* Machine Status */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SquareActivity className="text-blue-500" />
                <span className="font-medium ">Machine Status</span>
              </div>
              <Tag color={jobData.machine.status === 'running' ? 'success' : 'warning'}>
                {jobData.machine.status.toUpperCase()}
              </Tag>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Efficiency</div>
                  <div className="text-2xl font-semibold text-green-500">
                    {jobData.machine.efficiency}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Cycle Time</div>
                  <div className="text-2xl font-semibold">
                    {jobData.machine.currentCycle}
                  </div>
                </div>
              </div>
              <Divider className="my-3" />
              <div className="space-y-2">
                {Object.entries(jobData.machine.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

           {/* Current Job Detials */}
           <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-500" />
                <span className="font-medium">Current Job Details</span>
              </div>
              <Tag color={jobData.machine.status === 'running' ? 'success' : 'warning'}>
                {jobData.machine.status.toUpperCase()}
              </Tag>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Job Name</div>
                  <div className="text-xl font-semibold text-blue-500">
                    {jobData.jobDetails.partname.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Part Number</div>
                  <div className="text-2xl font-semibold">
                    {jobData.jobDetails.partnumber}
                  </div>
                </div>
              </div>
              <Divider className="my-3 bg-blue-200" />
              <div className="space-y-2">
                {Object.entries(jobData.jobDetails.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <Divider className="my-3 bg-blue-200" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Total Quantity</div>
                  <div className="text-lg font-semibold text-blue-500">
                    {jobData.jobDetails.orderQuantity}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-lg font-semibold">
                    {jobData.jobDetails.completedQuantity}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Remaining</div>
                  <div className="text-lg font-semibold">
                    {jobData.jobDetails.remainingQuantity}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Production Progress */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle2 className="text-blue-500" />
              <span className="font-medium">Production Progress</span>
            </div>
            <div className="p-4 flex flex-col items-center">
              <div className="mb-4">
                <Progress 
                  type="circle" 
                  percent={Math.round((partCount / jobData.batchSize) * 100)}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  strokeWidth={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-8 w-full">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-2xl font-semibold text-blue-500">
                    {partCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Remaining</div>
                  <div className="text-2xl font-semibold text-orange-500">
                    {jobData.batchSize - partCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Status */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Eye className="text-blue-500" />
                <span className="font-medium">Quality Status</span>
              </div>
              <Tag color={jobData.quality.deviations > 0 ? 'error' : 'success'}>
                {jobData.quality.deviations > 0 ? 'Deviations' : 'No Deviations'}
              </Tag>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Inspections</div>
                  <div className="text-2xl font-semibold text-blue-500">
                    {jobData.quality.completedInspections}/{jobData.quality.inspectionPoints}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Deviations</div>
                  <div className="text-2xl font-semibold text-red-500">
                    {jobData.quality.deviations}
                  </div>
                </div>
              </div>
              <Divider className="my-3" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-2">
                  <span>Last Inspection:</span>
                  <span>{jobData.quality.lastInspection}</span>
                </div>
                <Space className="w-full">
                  <Button 
                    type="primary" 
                    icon={<FileTextOutlined />}
                    onClick={() => setShowPokaYoke(true)}
                    block
                  >
                    Poka-Yoke Checklist
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="custom-tabs"
            tabBarStyle={{ 
              background: '#f9fafb', 
              borderBottom: '1px solid #e5e7eb',
              padding: '0 16px'
            }}
          >
            <TabPane 
              tab={
                <span>
                  <FileText size={16} className="mr-2" />
                  Operation Details
                </span>
              } 
              key="operations"
            >
              <OperationDetails jobData={jobData} />
            </TabPane>
            {/* <TabPane 
              tab={
                <span>
                  < ToolOutlined size={16} className="mr-2" />
                  MPP
                </span>
              } 
              key="mpp"
            >
              <MPP jobData={jobData} />
            </TabPane> */}
            <TabPane 
              tab={
                <span>
                  <AlertTriangle size={16} className="mr-2" />
                  IPID
                </span>
              } 
              key="ipid"
            >
              <IPID jobData={jobData} />
            </TabPane>
          </Tabs>
        </div>
      </Content>

      {/* Poka-Yoke Modal */}
      <Modal
        title="Poka-Yoke Checklist"
        open={showPokaYoke}
        onCancel={() => setShowPokaYoke(false)}
        footer={null}
        width={800}
      >
        <PokaYokeChecklist jobId={jobData.jobId} />
      </Modal>

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-tabs .ant-tabs-nav {
          margin-bottom: 0;
        }
        
        .custom-tabs .ant-tabs-tab {
          padding: 12px 16px;
          transition: all 0.2s;
        }
        
        .custom-tabs .ant-tabs-tab:hover {
          background: #f3f4f6;
        }
        
        .custom-tabs .ant-tabs-tab-active {
          background: white !important;
        }

        .hover-card {
          transition: all 0.2s;
        }
        
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </Layout>
  );
};

export default JobDetails;
