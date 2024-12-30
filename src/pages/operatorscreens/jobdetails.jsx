import React, { useState } from 'react';
import { 
  Card, Button, Input, Layout, Modal, Tabs,
  Row, Col, Statistic, Badge, Space, Progress, Avatar,
  Tooltip, Divider, Alert, message
} from 'antd';
import { 
  ClockCircleOutlined, UserOutlined, BellOutlined,
  ToolOutlined, CheckCircleOutlined, FileTextOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  FileText, Eye, Gauge, Settings, AlertOctagon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MPP from './JobDetails/Mpp';
import IPID from './JobDetails/IPID';
import OperationDetails from './JobDetails/OperationDetails';
import PokaYokeChecklist from './JobDetails/PokaYokeChecklist';

const { Content } = Layout;
const { TabPane } = Tabs;

// Mock data
const mockJobData = {
  jobId: 'JOB-2024-001',
  partNumber: 'PA-0014',
  partName: 'Aluminum Housing',
  batchSize: 120,
  priority: 'High',
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
      {/* Top Bar */}
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button type="text" icon={<ArrowLeftOutlined />}>Back</Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold m-0">{jobData.partName}</h1>
              <Badge 
                status={jobData.machine.status === 'running' ? 'success' : 'warning'} 
                text={jobData.machine.status.toUpperCase()} 
              />
            </div>
            <Space className="text-gray-500">
              <span>Job: {jobData.jobId}</span>
              <Divider type="vertical" />
              <span>Part: {jobData.partNumber}</span>
            </Space>
          </div>
        </div>
        
      </div>

      {/* Main Content */}
      <Content className="p-6">
        <Row gutter={[16, 16]}>
          {/* Machine Status Card */}
          <Col span={8}>
            <Card 
              title={
                <Space>
                  < ToolOutlined className="text-blue-500" />
                  <span>Machine Status</span>
                </Space>
              }
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Space direction="vertical" className="w-full">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="Efficiency" 
                      value={jobData.machine.efficiency} 
                      suffix="%" 
                      prefix={<Gauge size={16} />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Cycle Time" 
                      value={jobData.machine.currentCycle}
                      prefix={<Timer size={16} />}
                    />
                  </Col>
                </Row>
                <Divider className="my-3" />
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Machine Parameters</span>
                    <Button type="link" icon={<Settings size={14} />}>
                      Details
                    </Button>
                  </div>
                  <Space direction="vertical" className="w-full">
                    {Object.entries(jobData.machine.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-500">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </Space>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Production Progress Card */}
          <Col span={8}>
            <Card 
              title={
                <Space>
                  <CheckCircle2 className="text-blue-500" />
                  <span>Production Progress</span>
                </Space>
              }
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Space direction="vertical" className="w-full">
                <div className="text-center mb-4">
                  <Progress 
                    type="circle" 
                    percent={Math.round((partCount / jobData.batchSize) * 100)}
                    format={percent => (
                      <div>
                        <div className="text-lg font-semibold">{percent}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                    )}
                  />
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="Completed" 
                      value={partCount}
                      suffix={`/ ${jobData.batchSize}`}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Remaining" 
                      value={jobData.batchSize - partCount}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                </Row>
                <Divider className="my-3" />
                <Space className="w-full justify-between">
                  <Input 
                    type="number"
                    value={partCount}
                    onChange={e => setPartCount(parseInt(e.target.value))}
                    style={{ width: 100 }}
                  />
                  <Button 
                    type="primary"
                    onClick={() => handlePartCountUpdate(partCount)}
                  >
                    Update Count
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* Quality Status Card */}
          <Col span={8}>
            <Card 
              title={
                <Space>
                  <Eye className="text-blue-500" />
                  <span>Quality Status</span>
                </Space>
              }
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Space direction="vertical" className="w-full">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="Inspections" 
                      value={jobData.quality.completedInspections}
                      suffix={`/ ${jobData.quality.inspectionPoints}`}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Deviations" 
                      value={jobData.quality.deviations}
                      valueStyle={{ color: jobData.quality.deviations > 0 ? '#ff4d4f' : '#52c41a' }}
                    />
                  </Col>
                </Row>
                <Divider className="my-3" />
                <div>
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
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Main Content Tabs */}
        <Card className="mt-4 shadow-sm">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="custom-tabs"
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
            <TabPane 
              tab={
                <span>
                  < ToolOutlined size={16} className="mr-2" />
                  MPP
                </span>
              } 
              key="mpp"
            >
              <MPP jobData={jobData} />
            </TabPane>
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
        </Card>
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

      <style jsx global>{`
        .custom-tabs .ant-tabs-nav {
          margin-bottom: 16px;
        }
        
        .ant-card-head {
          border-bottom: none;
        }
        
        .hover\:shadow-md:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </Layout>
  );
};

export default JobDetails;
