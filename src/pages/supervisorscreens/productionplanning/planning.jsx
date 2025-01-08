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
  CalendarOutlined, BarChartOutlined, UserOutlined,
  ToolOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  Gauge, Settings, Users, Calendar, Wrench,
  FileStack, FilePenLine, CircleCheckBig, Clock, FileSliders, BrickWall, CalendarX, Siren, User, LandPlot
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

      <div className="flex flex-wrap gap-4">
        {/* Stats Overview */}
        {/* Total Jobs Card */}
        <div className="w-64 bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-16 px-4 py-3 border-b border-gray-100 flex bg-sky-200 justify-between items-center">
            <div className="flex items-center gap-2 bg-sky-100 p-1 px-2 rounded-lg">
              <FileStack className="text-blue-500" />
              <span className="font-semibold">Total Jobs</span>
            </div>
            <span className="bg-blue-500 text-white text-sm font-semibold rounded-full px-3 py-1">
                {planningStats.totalJobs}
            </span>
          </div>
        </div>

        {/* In Planning Card */}
        <div className="w-64 bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-16 px-4 py-3 border-b border-gray-100 flex bg-sky-200 justify-between items-center">
            <div className="flex items-center gap-2 bg-sky-100 p-1 px-2 rounded-lg">
              <FilePenLine className="text-blue-500" />
              <span className="font-semibold">In Planning</span>
            </div>
            <span className="bg-blue-500 text-white text-sm font-semibold rounded-full px-3 py-1">
                {planningStats.inPlanning}
            </span>
          </div>
        </div>

      {/* Scheduled Card */}
      <div className="w-64 bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-16 px-4 py-3 border-b border-gray-100 flex bg-sky-200 justify-between items-center">
            <div className="flex items-center gap-2 bg-sky-100 p-1 px-2 rounded-lg">
              <CircleCheckBig className="text-blue-500" />
              <span className="font-semibold">Scheduled</span>
            </div>
            <span className="bg-green-500 text-white text-sm font-semibold rounded-full px-3 py-1">
                {planningStats.scheduled}
            </span>
          </div>
        </div>

        {/* Delayed Card */}
        <div className="w-64 bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-16 px-4 py-3 border-b border-gray-100 flex bg-sky-200 justify-between items-center">
            <div className="flex items-center gap-2 bg-sky-100 p-1 px-2 rounded-lg">
              <AlertTriangle className="text-blue-500" />
              <span className="font-semibold">Delayed</span>
            </div>
            <span className="bg-red-500 text-white text-sm font-semibold rounded-full px-3 py-1">
                {planningStats.delayed}
            </span>
          </div>
        </div>

        {/* Machine Utilization Card */}
        <div className="w-72 bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-16 px-4 py-3 border-b border-gray-100 flex bg-sky-200 justify-between items-center">
            <div className="flex items-center gap-2 bg-sky-100 p-1 px-2 rounded-lg">
              <Gauge className="text-blue-500" />
              <span className="font-semibold">Machine Utilization</span>
            </div>
            <span className="bg-blue-500 text-white text-sm font-semibold rounded-full px-3 py-1">
                {planningStats.machineUtilization}%
            </span>
          </div>
        </div>

      </div>

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
          <Alert 
          message="You can also modify details such as the MPP and order management number." 
          type="info" 
          className="mt-2 max-w-xl" 
        />
        </Row>
      </Card>

      {selectedJob && (
        <>
          {/* Job Details Section */}
          <Card className="shadow-sm">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              // tabBarExtraContent={
              //   <Link to="/supervisor/production-planning/scheduling">
              //     <Button type="primary" icon={<CalendarOutlined />}>
              //       Open Scheduler
              //     </Button>
              //   </Link>
              // }
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


              <div className="bg-sky-100/50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-6 gap-20">
                  <div className="flex items-center bg-white p-2 rounded">
                    <FileSliders className="w-7 h-7 text-blue-600" />
                    <div className="ml-2">
                      <div className="text-base text-gray-500">Project</div>
                      <div className="font-bold">Project 1</div>
                    </div>
                  </div>

                  <div className="flex items-center bg-white p-2 rounded">
                    <User className="w-7 h-7 text-blue-600" />
                    <div className="ml-2">
                      <div className="text-base text-gray-500">Customer</div>
                      <div className="font-bold">Naveesh</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-white p-2 rounded">
                    <LandPlot className="w-7 h-7 text-blue-600" />
                    <div className="ml-2">
                      <div className="text-base text-gray-500">Material</div>
                      <div className="font-bold">Raw material</div>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded">
                    <BrickWall className="w-7 h-7 text-blue-600" />
                    <div className="ml-2">
                      <div className="text-base text-gray-500">Quantity</div>
                      <div className="font-bold">20</div>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded">
                    <CalendarX className="w-7 h-7 text-red-600" />
                    <div className="ml-2">
                      <div className="text-base text-gray-500">Due Date</div>
                      <div className="font-bold">22/01/2025</div>
                    </div>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded">
                    <Siren className="w-7 h-7 text-red-600" />
                    <div className="ml-2">
                      <div className="text-base text-gray-500">Priority</div>
                      <Tag color={selectedJob.priority === 'high' ? 'red' : 'blue'}>
                        {selectedJob.priority.toUpperCase()}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>
                
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

              <TabPane 
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
              </TabPane>

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
                <div className="flex justify-center mb-4"> {/* Center the button */}
                  <Link to="/supervisor/production-planning/scheduling">
                    <Button type="primary" icon={<CalendarOutlined />}>
                      Open Scheduler
                    </Button>
                  </Link>
                </div>
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