import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, Upload, message,
  Typography, Tag, Tooltip, Form, Drawer, Descriptions,
  Statistic, Progress, Badge, Alert, Divider
} from 'antd';
import {
  UploadOutlined, FileTextOutlined, EditOutlined,
  SaveOutlined, PlusOutlined, ClockCircleOutlined,
  CalendarOutlined, BarChartOutlined,
  ToolOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  Gauge, Settings, Users, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JobOperationsTable from '../../../components/ProductionPlanning/JobOperationsTable';
import OperationMPPDetails from '../../../components/ProductionPlanning/OperationMPPDetails';
import ResourceUtilization from '../../../components/ProductionPlanning/ResourceUtilization';
import { mockJobData, mockPartNumbers, mockMachines } from '../../../data/mockPlanningData';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Planning = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMPPDetails, setShowMPPDetails] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [activeTab, setActiveTab] = useState('jobDetails');

  // Use mockJobData for available jobs
  const availableJobs = [
    mockJobData,
    // Add more jobs if needed
  ];

  const handleJobSelect = (jobId) => {
    const job = availableJobs.find(j => j.id === jobId);
    setSelectedJob(job);
  };

  const handleOperationEdit = (operation) => {
    setSelectedOperation(operation);
    setShowMPPDetails(true);
  };

  const handleUpload = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  // Stats data
  const planningStats = {
    totalJobs: 45,
    inPlanning: 12,
    scheduled: 28,
    delayed: 5,
    machineUtilization: 78,
    upcomingMaintenance: 3
  };

  return (
    <div className="space-y-3 p-1">
      {/* Stats Overview */}
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Total Jobs"
              value={planningStats.totalJobs}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="In Planning"
              value={planningStats.inPlanning}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Scheduled"
              value={planningStats.scheduled}
              prefix={<CheckCircle2 size={16} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Delayed"
              value={planningStats.delayed}
              prefix={<AlertTriangle size={16} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Machine Utilization"
              value={planningStats.machineUtilization}
              prefix={<Gauge size={16} />}
              suffix="%"
            />
          </Card>
        </Col>
        {/* <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Upcoming Maintenance"
              value={planningStats.upcomingMaintenance}
              prefix={<Settings size={16} />}
            />
          </Card>
        </Col> */}
      </Row>

      {/* Job Selection Section with improved layout */}
      <Card className="shadow-sm">
        <Row gutter={24} align="middle">
          <Col span={16}>
            <Space size="large" className="w-full">
              <Form.Item label="Select Job/Part Number" className="mb-0 flex-1">
                <Select
                  showSearch
                  placeholder="Search by Job ID or Part Number"
                  onChange={handleJobSelect}
                  optionFilterProp="children"
                  className="w-full"
                >
                  {availableJobs.map(job => (
                    <Option key={job.id} value={job.id}>
                      <Space>
                        {`${job.partNumber} - ${job.partName}`}
                        <Tag color={job.priority === 'high' ? 'red' : 'blue'}>
                          {job.priority.toUpperCase()}
                        </Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {/* <Upload 
                accept=".pdf"
                onChange={handleUpload}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              >
                <Button icon={<UploadOutlined />}>Upload OARC</Button>
              </Upload> */}
            </Space>
          </Col>
          <Col span={8} className="text-right">
            <Space>
              <Button type="primary" icon={<SaveOutlined />}>
                Save Plan
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                New Job
              </Button>
            </Space>
          </Col>
        </Row>
        <Alert 
          message="You can also modify details such as the MPP and order management number." 
          type="info" 
          className="mt-2 max-w-xl" 
        />
      </Card>

      {selectedJob && (
        <>
          {/* Job Details Section */}
          <Card className="shadow-sm">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarExtraContent={
                <Link to="/supervisor/production-planning/scheduling">
                  <Button type="primary" icon={<CalendarOutlined />}>
                    Open Scheduler
                  </Button>
                </Link>
              }
            >
             <TabPane 
                tab={
                  <span>
                    <FileTextOutlined />
                    Job Details
                  </span>
                }
                key="jobDetails"
              >
                <Row gutter={[24, 24]}>
                  <Col span={4}>
                    <strong>Project:</strong> {selectedJob.project}
                  </Col>
                  <Col span={4}>
                    <strong>Customer:</strong> {selectedJob.customer}
                  </Col>
                  <Col span={4}>
                    <strong>Material:</strong> {selectedJob.material}
                  </Col>
                  <Col span={4}>
                    <strong>Quantity:</strong> {selectedJob.quantity}
                  </Col>
                  <Col span={4}>
                    <strong>Due Date:</strong> {selectedJob.dueDate}
                  </Col>
                  <Col span={4}>
                    <strong>Priority:</strong> 
                    <Tag color={selectedJob.priority === 'high' ? 'red' : 'blue'}>
                      {selectedJob.priority.toUpperCase()}
                    </Tag>
                  </Col>
                </Row>
                <Divider style={{ margin: '16px 0' }} />
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <JobOperationsTable 
                      jobId={selectedJob.id}
                      onOperationEdit={handleOperationEdit}
                      operations={selectedJob.operations}
                    />
                  </Col>
                </Row>
              </TabPane>

              {/* <TabPane 
                tab={
                  <span>
                    <BarChartOutlined />
                    Resources
                  </span>
                }
                key="resources"
              >
                <ResourceUtilization 
                  machines={mockMachines}
                  selectedJob={selectedJob}
                />
              </TabPane> */}

              <TabPane 
                tab={
                  <span>
                    <CalendarOutlined />
                    Schedule Guide
                  </span>
                }
                key="schedule"
              >
                <Card className="bg-gray-50">
                  <Steps 
                    direction="vertical" 
                    current={1}
                    className="max-w-3xl mx-auto"
                  >
                    <Steps.Step 
                      title="Plan Operations" 
                      description="Define all operations and their requirements"
                      icon={<ToolOutlined size={16} />}
                    />
                    <Steps.Step 
                      title="Check Resources" 
                      description="Verify machine and tool availability"
                      icon={<Gauge size={16} />}
                    />
                    <Steps.Step 
                      title="Schedule Operations" 
                      description="Allocate time slots for each operation"
                      icon={<Calendar size={16} />}
                    />
                    <Steps.Step 
                      title="Assign Personnel" 
                      description="Assign operators to scheduled operations"
                      icon={<Users size={16} />}
                    />
                  </Steps>
                </Card>
              </TabPane>
            </Tabs>
          </Card>

          {/* MPP Details Drawer */}
          <Drawer
            title={`Operation Details - ${selectedOperation?.opNo}`}
            width={1200}
            open={showMPPDetails}
            onClose={() => setShowMPPDetails(false)}
            destroyOnClose
          >
            <OperationMPPDetails 
              operation={selectedOperation}
              onSave={() => {
                setShowMPPDetails(false);
                message.success('Operation details updated');
              }}
            />
          </Drawer>
        </>
      )}
    </div>
  );
};

export default Planning;