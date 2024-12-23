import React from 'react';
import { Card, Steps, Button, Progress, Tag, Space, Descriptions, Statistic } from 'antd';
import { 
  ArrowLeft,
  Clock, 
 
  FileText,
  Settings,
  Ruler,
  BarChart,
  CheckCircle,
  Activity
} from 'lucide-react';
import { ToolFilled } from '@ant-design/icons';

// const {Activity} = AntDesignIcons;

const JobDetails = () => {
  const jobData = {
    jobId: 'JOB-2024-001',
    partNumber: 'PART-001',
    partDesc: 'Motor Casing',
    machine: 'DMG DMU 60 eVo linear',
    operator: 'John Doe',
    status: 'In Progress',
    priority: 'High',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    progress: 75,
    setupSteps: [
      { title: 'Machine Setup', description: 'Parameters configured', status: 'finish' },
      { title: 'Tool Verification', description: 'All tools checked', status: 'finish' },
      { title: 'Material Loading', description: 'Raw material loaded', status: 'process' },
      { title: 'Quality Check', description: 'Initial measurements', status: 'wait' },
      { title: 'Production', description: 'Start machining', status: 'wait' }
    ],
    tools: [
      { id: 'T1', name: 'End Mill 10mm', status: 'available', wear: 85 },
      { id: 'T2', name: 'Drill Bit 8mm', status: 'in-use', wear: 62 },
      { id: 'T3', name: 'Face Mill 50mm', status: 'available', wear: 90 }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Details</h1>
          <Space className="mt-2">
            <Tag color="blue">ID: {jobData.jobId}</Tag>
            <Tag color="green">Status: {jobData.status}</Tag>
            <Tag color="orange">Priority: {jobData.priority}</Tag>
          </Space>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Job Information">
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Part Number">{jobData.partNumber}</Descriptions.Item>
              <Descriptions.Item label="Description">{jobData.partDesc}</Descriptions.Item>
              <Descriptions.Item label="Machine">{jobData.machine}</Descriptions.Item>
              <Descriptions.Item label="Operator">{jobData.operator}</Descriptions.Item>
              <Descriptions.Item label="Start Time">{jobData.startTime}</Descriptions.Item>
              <Descriptions.Item label="End Time">{jobData.endTime}</Descriptions.Item>
            </Descriptions>

            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Overall Progress</span>
                <span>{jobData.progress}%</span>
              </div>
              <Progress 
                percent={jobData.progress} 
                strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
              />
            </div>
          </Card>

          <Card title="Quick Actions" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <FileText />, label: 'Documents' },
              { icon: <ToolFilled />, label: 'Setup Guide' },
              { icon: <Ruler />, label: 'Quality Check' },
              { icon: <BarChart />, label: 'Analytics' }
            ].map((action, index) => (
              <Button 
                key={index}
                type="default"
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                {action.icon}
                <span>{action.label}</span>
              </Button>
            ))}
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <Card title="Setup Progress">
            <Steps
              direction="vertical"
              current={2}
              items={jobData.setupSteps.map(step => ({
                title: step.title,
                description: step.description,
                status: step.status
              }))}
            />
          </Card>

          <Card title="Tool Status">
            <Space direction="vertical" className="w-full">
              {jobData.tools.map(tool => (
                <Card key={tool.id} size="small" className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{tool.name}</span>
                    <Tag color={tool.status === 'available' ? 'green' : 'gold'}>
                      {tool.status}
                    </Tag>
                  </div>
                  <Progress 
                    percent={tool.wear} 
                    size="small"
                    status={tool.wear > 80 ? 'exception' : 'active'}
                  />
                </Card>
              ))}
            </Space>
          </Card>

          <Card>
            <Space direction="vertical" className="w-full">
              <Statistic 
                title="Machine Utilization" 
                value={93.2} 
                suffix="%" 
                prefix={<Activity className="w-4 h-4" />}
              />
              <Statistic 
                title="Estimated Time Left" 
                value="2h 15m" 
                prefix={<Clock className="w-4 h-4" />}
              />
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;