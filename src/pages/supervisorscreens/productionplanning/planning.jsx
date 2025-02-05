import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, Upload, message,
  Typography, Tag, Tooltip, Form, Drawer, Descriptions,
  Statistic, Progress, Badge, Alert
} from 'antd';
import {
  UploadOutlined, FileTextOutlined, EditOutlined,
  SaveOutlined, PlusOutlined, ClockCircleOutlined,
  CalendarOutlined, BarChartOutlined,
  ToolOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  Gauge, Settings, Users, Calendar,  CheckCircle, Hourglass, CalendarCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JobOperationsTable from '../../../components/ProductionPlanning/JobOperationsTable';
import OperationMPPDetails from '../../../components/ProductionPlanning/OperationMPPDetails';
import ResourceUtilization from '../../../components/ProductionPlanning/ResourceUtilization';
import { mockJobData, mockPartNumbers, mockMachines } from '../../../data/mockPlanningData';
import usePlanningStore from '../../../store/planning-store';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Planning = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMPPDetails, setShowMPPDetails] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [activeTab, setActiveTab] = useState('jobDetails');
  const { 
    fetchAllOrders, 
    searchOrders, 
    partNumbers, 
    searchResults,
    isLoading,
    fetchActiveParts,
    activeParts,
    changePartStatus 
  } = usePlanningStore();

  // Fetch part numbers and active parts on component mount
  React.useEffect(() => {
    fetchAllOrders();
    fetchActiveParts();
  }, [fetchAllOrders, fetchActiveParts]);

  const getJobStatus = (partNumber) => {
    const activePart = activeParts.find(part => part.part_number === partNumber);
    return activePart ? activePart.status : 'unknown';
  };

  const handleStatusChange = (partNumber, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const modalTitle = currentStatus === 'active' ? 'Deactivate Part' : 'Activate Part';
    const modalContent = currentStatus === 'active' 
      ? 'Are you sure you want to deactivate this part?' 
      : 'Are you sure you want to activate this part?';

    Modal.confirm({
      title: modalTitle,
      content: modalContent,
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await changePartStatus(partNumber, newStatus);
          message.success(`Part status successfully changed to ${newStatus}`);
        } catch (error) {
          message.error('Failed to change part status');
        }
      }
    });
  };

  const renderStatusButton = (partNumber) => {
    const status = getJobStatus(partNumber);
    
    switch (status) {
      case 'active':
        return (
          <Button 
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => handleStatusChange(partNumber, status)}
          >
            <CalendarCheck className="w-5 h-5 mr-2" /> Active
          </Button>
        );
      case 'inactive':
        return (
          <Button 
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={() => handleStatusChange(partNumber, status)}
          >
            <Hourglass className="w-5 h-5 mr-2" /> Inactive
          </Button>
        );
      default:
        return (
          <Button 
            className="bg-gray-600 text-white hover:bg-gray-700"
            onClick={() => handleStatusChange(partNumber, 'unknown')}
          >
            <AlertTriangle className="w-5 h-5 mr-2" /> Unknown
          </Button>
        );
    }
  };

  const handleJobSelect = async (partNumber) => {
    const results = await searchOrders(partNumber);
    if (results.orders && results.orders.length > 0) {
      const selectedJobData = results.orders[0];
      setSelectedJob(selectedJobData);
    }
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

  const handleReset = () => {
    // Only reset the select input value
    const select = document.querySelector('.ant-select-selector input');
    if (select) {
      select.value = '';
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
    <div className="space-y-6 p-6">
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
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Upcoming Maintenance"
              value={planningStats.upcomingMaintenance}
              prefix={<Settings size={16} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Job Selection Section with improved layout */}
      <Card className="shadow-sm">
        <Row gutter={24} align="middle">
          <Col span={20}>
            <Space size="large" className="w-full">
              <Form.Item label="Select Job/Part Number" className="mb-0" style={{ flex: 1 }}>
                <Space className="w-full">
                  <Select
                    className="job-select"
                    showSearch
                    loading={isLoading}
                    placeholder="Search by Part Number"
                    onChange={handleJobSelect}
                    optionFilterProp="children"
                    style={{ width: '500px' }}
                    allowClear
                  >
                    {partNumbers.map(item => (
                      <Option key={item.id} value={item.partNumber}>
                        {item.partNumber}
                      </Option>
                    ))}
                  </Select>
                  <Button onClick={handleReset}>Reset</Button>
                </Space>
              </Form.Item>
              <Upload 
                accept=".pdf"
                onChange={handleUpload}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              >
                {/* <Button icon={<UploadOutlined />}>Upload OARC</Button> */}
              </Upload>
            </Space>
          </Col>
          <Col span={8} className="text-right">
            <Space>
              {/* <Button type="primary" icon={<SaveOutlined />}>
                Save Plan
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                New Job
              </Button> */}
            </Space>
          </Col>
        </Row>
      </Card>

      {selectedJob && (
        <>
          {/* Job Details Section */}
          <Card className="shadow-sm">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarExtraContent={
                <Link to="/scheduling">
                  {/* <Button type="primary" icon={<CalendarOutlined />}>
                    Open Scheduler
                  </Button> */}
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
                <Card 
                  className={`shadow-sm mb-6 hover:shadow-md transition-shadow ${
                    getJobStatus(selectedJob.part_number) === 'active' 
                      ? 'bg-green-50' 
                      : getJobStatus(selectedJob.part_number) === 'inactive'
                      ? 'bg-yellow-50'
                      : 'bg-gray-50'
                  }`}
                  size="small"
                >
                  <Descriptions column={3}>
                    <Descriptions.Item label="Part Number">
                      {selectedJob.part_number}
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={selectedJob.project?.priority === 1 ? 'red' : 'blue'}>
                        {selectedJob.project?.priority === 1 ? 'HIGH' : 'NORMAL'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Required Quantity">
                      {selectedJob.required_quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="End Date">
                      {selectedJob.project?.end_date || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Production Order">
                      {selectedJob.production_order}
                    </Descriptions.Item>
                    <Descriptions.Item label="Project Name">
                      {selectedJob.project?.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Part Description">
                      {selectedJob.part_description}
                    </Descriptions.Item>
                    <Descriptions.Item label="Launched Quantity">
                      {selectedJob.launched_quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="Delivery Date">
                      {selectedJob.project?.delivery_date || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Operations">
                      {selectedJob.total_operations}
                    </Descriptions.Item>
                    <Descriptions.Item label="Start Date">
                      {selectedJob.project?.start_date || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <div className="flex items-center space-x-2">
                        {renderStatusButton(selectedJob.part_number)}
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <JobOperationsTable 
                  jobId={selectedJob.id}
                  onOperationEdit={handleOperationEdit}
                  operations={selectedJob.operations}
                  partNumber={selectedJob.part_number}
                />
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
                      description={
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>1. Define all manufacturing operations in sequence</p>
                          <p>2. Specify required tools and fixtures</p>
                          <p>3. Set up operation parameters and instructions</p>
                        </div>
                      }
                      icon={<ToolOutlined size={16} />}
                    />
                    <Steps.Step 
                      title="Check Resources" 
                      description={
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>1. Review machine availability in Resources tab</p>
                          <p>2. Verify tool and fixture availability</p>
                          <p>3. Check operator skill requirements</p>
                        </div>
                      }
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

                  <Alert
                    className="mt-6 max-w-3xl mx-auto"
                    message="Scheduling Tips"
                    description={
                      <ul className="list-disc pl-4">
                        <li>Consider machine maintenance schedules</li>
                        <li>Account for setup and changeover times</li>
                        <li>Plan for potential bottlenecks</li>
                        <li>Leave buffer time for unexpected delays</li>
                      </ul>
                    }
                    type="info"
                    showIcon
                  />
                </Card>
              </TabPane>
            </Tabs>
          </Card>

          {/* MPP Details Drawer */}
          <Drawer
            title={`Operation Details - ${selectedOperation?.operation_number}`}
            width={1200}
            open={showMPPDetails}
            onClose={() => setShowMPPDetails(false)}
            destroyOnClose
          >
            <OperationMPPDetails 
              operation={selectedOperation}
              partNumber={selectedJob?.part_number}
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




