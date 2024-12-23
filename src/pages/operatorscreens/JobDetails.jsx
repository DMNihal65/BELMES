import React, { useState } from 'react';
import { Card, Input, Button, Checkbox, Select, Space, Badge, Tag, Progress, Table, Typography } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, ClockCircleOutlined, UserOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

function JobDetails() {
  const navigate = useNavigate();
  const [partCount, setPartCount] = useState('15');
  const [jobStatus, setJobStatus] = useState('in-progress');
  const [taskProgress, setTaskProgress] = useState({
    prepareWorkstation: false,
    installFixtures: false,
    loadMaterials: false,
    calibrateMachine: false,
    beginMachining: false,
  });

  const jobInfo = {
    jobId: 'JOB-2024-001',
    partNumber: 'PA-0678',
    batchSize: '120',
    priority: 'High',
    assignedMachine: 'DMG-01',
    operator: 'John Doe',
    startDate: '2/15/2024, 10:00 AM',
    endDate: '2/16/2024, 10:00 PM',
  };

  const handleTaskCheck = (task) => {
    setTaskProgress((prev) => ({
      ...prev,
      [task]: !prev[task],
    }));
  };

  const handleStatusChange = (value) => {
    setJobStatus(value);
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/operator/dashboard')}
            size="large"
          >
            Back to Dashboard
          </Button>
          <Title level={4} style={{ margin: 0 }}>Job Details</Title>
        </div>
        <Space size="large" className="w-full md:w-auto">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search job details..."
            style={{ width: '100%', minWidth: '200px', maxWidth: '300px' }}
            size="large"
          />
        </Space>
      </div>

      {/* Job Information Card */}
      <Card className="mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ToolOutlined className="text-gray-500" />
              <span className="font-medium">Machine:</span>
              <span>{jobInfo.assignedMachine}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserOutlined className="text-gray-500" />
              <span className="font-medium">Operator:</span>
              <span>{jobInfo.operator}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ClockCircleOutlined className="text-gray-500" />
              <span className="font-medium">Start Time:</span>
              <span>{jobInfo.startDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockCircleOutlined className="text-gray-500" />
              <span className="font-medium">End Time:</span>
              <span>{jobInfo.endDate}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tag color={getPriorityColor(jobInfo.priority)}>Priority: {jobInfo.priority}</Tag>
              <Tag color="green">Status: {jobStatus}</Tag>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Completion:</span>
              <Progress percent={75} size="small" />
            </div>
          </div>
        </div>
      </Card>

      {/* Tasks Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Tasks</span>
            <div className="flex gap-2">
              <Select
                defaultValue="all"
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'All Tasks' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
          </div>
        }
        className="mb-6 shadow-sm"
      >
        <div className="overflow-x-auto">
          <Table
            columns={[
              {
                title: 'Task',
                dataIndex: 'task',
                key: 'task',
                render: (text) => <span className="font-medium">{text}</span>,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 120,
                render: (status) => (
                  <Badge
                    status={status === 'Completed' ? 'success' : 'processing'}
                    text={status}
                  />
                ),
              },
              {
                title: 'Action',
                key: 'action',
                width: 120,
                render: (_, record) => (
                  <Checkbox checked={record.status === 'Completed'}>
                    Complete
                  </Checkbox>
                ),
              },
            ]}
            dataSource={[
              {
                key: '1',
                task: 'Setup Machine Parameters',
                status: 'Completed',
              },
              {
                key: '2',
                task: 'Quality Check',
                status: 'In Progress',
              },
              {
                key: '3',
                task: 'Material Preparation',
                status: 'Completed',
              },
            ]}
            pagination={false}
            className="border rounded-lg"
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>

      {/* Update Part Count Section */}
      <Card title={<span className="text-lg font-medium">Update Part Count</span>} className="mb-6 shadow-sm">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="mb-3 font-medium text-gray-700">Machine1 OP10</p>
            <Space size="large">
              <Input
                value={partCount}
                onChange={(e) => setPartCount(e.target.value)}
                style={{ width: '120px' }}
                size="large"
              />
              <Button type="primary" size="large">
                Submit Count
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Notes Section */}
      <Card title="Notes" className="shadow-sm">
        <div className="space-y-4">
          <Input.TextArea
            rows={4}
            placeholder="Add notes about the job..."
            className="mb-4"
          />
          <div className="flex justify-end">
            <Button type="primary">Save Notes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default JobDetails;
