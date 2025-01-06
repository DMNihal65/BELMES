import React, { useState, useRef } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, message,
  Typography, Tag, Tooltip, Form, Drawer, Descriptions,
  Statistic, Progress, Badge, Alert, Collapse
} from 'antd';
import {
  FileTextOutlined, EditOutlined,
  SaveOutlined, PlusOutlined, ClockCircleOutlined,
  CalendarOutlined, BarChartOutlined,
  ToolOutlined, InfoCircleOutlined
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
const { Panel } = Collapse;

const Planning = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [mppDrawerVisible, setMppDrawerVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [activeTab, setActiveTab] = useState('jobDetails');
  const operationsTableRef = useRef(null);

  // Use mockJobData for available jobs
  const availableJobs = [mockJobData];

  const handleJobSelect = (jobId) => {
    const job = availableJobs.find(j => j.id === jobId);
    setSelectedJob(job);
  };

  const handleMPPClick = (operation) => {
    setSelectedOperation(operation);
    setMppDrawerVisible(true);
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

  const handleOperationsChange = (operations) => {
    setSelectedJob({ ...selectedJob, operations });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Overview */}
      <Row gutter={[16, 16]}>
        {[
          { title: 'Total Jobs', value: planningStats.totalJobs, icon: <FileTextOutlined /> },
          { title: 'In Planning', value: planningStats.inPlanning, icon: <EditOutlined /> },
          { title: 'Scheduled', value: planningStats.scheduled, icon: <CheckCircle2 size={16} /> },
          { title: 'Delayed', value: planningStats.delayed, icon: <AlertTriangle size={16} /> },
          { title: 'Machine Utilization', value: planningStats.machineUtilization, icon: <Gauge size={16} />, suffix: '%'},
          { title: 'Upcoming Maintenance', value: planningStats.upcomingMaintenance, icon: <Settings size={16} /> },
        ].map((stat, index) => (
          <Col span={4} key={index}>
            <Card 
              bordered={false} 
              className="hover:shadow-lg transition-shadow"
              style={{ background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)` }}
            >
              <Statistic 
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Job Selection Section */}
      <Card className="shadow-sm rounded-lg">
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
      </Card>

      {selectedJob && (
        <>
          {/* Job Details Section */}
          <Card className="shadow-sm">
            <Tabs 
              defaultActiveKey="jobDetails" 
              items={[
                {
                  key: 'jobDetails',
                  label: 'Job Details',
                  children: (
                    <div className="flex flex-col h-full space-y-4">
                      {/* Project Information Card */}
                      <div className="bg-gradient-to-r from-blue-50 via-blue-50/50 to-blue-50 rounded-lg shadow-sm mb-4">
                        <div className="px-6 py-2 border-b border-blue-100">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-blue-100 rounded-md">
                              <FileTextOutlined className="text-blue-500 text-sm" />
                            </div>
                            <Text strong className="text-base text-blue-700">Project Information</Text>
                          </div>
                        </div>
                        <div className="px-6 py-3">
                          <div className="flex items-center justify-between space-x-8">
                            {/* Project */}
                            <div className="flex items-center space-x-2">
                              <Text strong className="text-xs text-blue-600">PROJECT:</Text>
                              <Text className="text-sm">{selectedJob.partNumber}</Text>
                            </div>

                            {/* Customer */}
                            <div className="flex items-center space-x-2">
                              <Text strong className="text-xs text-blue-600">CUSTOMER:</Text>
                              <Text className="text-sm">{selectedJob.customer}</Text>
                            </div>

                            {/* Material */}
                            <div className="flex items-center space-x-2">
                              <Text strong className="text-xs text-blue-600">MATERIAL:</Text>
                              <Text className="text-sm">{selectedJob.material}</Text>
                            </div>

                            {/* Quantity */}
                            <div className="flex items-center space-x-2">
                              <Text strong className="text-xs text-blue-600">QUANTITY:</Text>
                              <Text className="text-sm">{selectedJob.quantity} units</Text>
                            </div>

                            {/* Due Date */}
                            <div className="flex items-center space-x-2">
                              <Text strong className="text-xs text-blue-600">DUE DATE:</Text>
                              <Text className="text-sm">{selectedJob.dueDate}</Text>
                            </div>

                            {/* Priority */}
                            <div className="flex items-center space-x-2">
                              <Text strong className="text-xs text-blue-600">PRIORITY:</Text>
                              <Tag 
                                color={selectedJob.priority === 'high' ? 'red' : 'blue'}
                                className="rounded-full px-2 py-0 text-xs"
                              >
                                {selectedJob.priority}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operations Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Text strong className="text-lg">Operations</Text>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              if (operationsTableRef.current) {
                                operationsTableRef.current.handleAddOperation();
                              }
                            }}
                          >
                            Add Operation
                          </Button>
                        </div>
                        <JobOperationsTable
                          ref={operationsTableRef}
                          jobId={selectedJob?.id}
                          operations={selectedJob?.operations || []}
                          onOperationsChange={(updatedOperations) => {
                            setSelectedJob(prev => ({
                              ...prev,
                              operations: updatedOperations
                            }));
                          }}
                          onMPPClick={handleMPPClick}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'resources',
                  label: 'Resources',
                  children: (
                    <ResourceUtilization 
                      machines={mockMachines}
                      selectedJob={selectedJob}
                    />
                  ),
                },
                {
                  key: 'schedule',
                  label: 'Schedule Guide',
                  children: (
                    <Card className="bg-gray-50">
                      <Collapse
                        defaultActiveKey={['1']}
                        expandIconPosition="end"
                        bordered={false}
                        ghost
                      >
                        {[
                          {
                            key: '1',
                            label: (
                              <div className="flex items-center space-x-2">
                                <ToolOutlined className="text-blue-500" />
                                <Text strong>1. Plan Operations</Text>
                              </div>
                            ),
                            description: (
                              <div className="mt-2">
                                <Text strong>Define operation requirements:</Text>
                                <ul className="list-disc pl-8 mt-1 space-y-1">
                                  <li>List all required manufacturing operations</li>
                                  <li>Specify machine types and tools needed</li>
                                  <li>Define setup time and cycle time for each operation</li>
                                  <li>Add any special instructions or quality requirements</li>
                                  <li>Ensure operations are in correct sequence</li>
                                </ul>
                              </div>
                            ),
                          },
                          {
                            key: '2',
                            label: (
                              <div className="flex items-center space-x-2">
                                <Gauge size={16} className="text-orange-500" />
                                <Text strong>2. Check Resources</Text>
                              </div>
                            ),
                            description: (
                              <div className="mt-2">
                                <Text strong>Verify resource availability:</Text>
                                <ul className="list-disc pl-8 mt-1 space-y-1">
                                  <li>Check machine availability and capacity</li>
                                  <li>Verify required tools are available</li>
                                  <li>Confirm material availability and lead times</li>
                                  <li>Check operator skill requirements</li>
                                  <li>Review maintenance schedules</li>
                                </ul>
                              </div>
                            ),
                          },
                          {
                            key: '3',
                            label: (
                              <div className="flex items-center space-x-2">
                                <Calendar size={16} className="text-blue-500" />
                                <Text strong>3. Schedule Operations</Text>
                              </div>
                            ),
                            description: (
                              <div className="mt-2">
                                <Text strong>Allocate time slots:</Text>
                                <ul className="list-disc pl-8 mt-1 space-y-1">
                                  <li>Consider job priority and due dates</li>
                                  <li>Account for setup and changeover times</li>
                                  <li>Plan for potential bottlenecks</li>
                                  <li>Include buffer time for uncertainties</li>
                                  <li>Optimize machine utilization</li>
                                </ul>
                                <Alert
                                  className="mt-2"
                                  message="Important Note"
                                  description="Always consider dependencies between operations and ensure adequate time for quality checks."
                                  type="info"
                                  showIcon
                                />
                              </div>
                            ),
                          },
                          {
                            key: '4',
                            label: (
                              <div className="flex items-center space-x-2">
                                <Users size={16} className="text-green-500" />
                                <Text strong>4. Assign Personnel</Text>
                              </div>
                            ),
                            description: (
                              <div className="mt-2">
                                <Text strong>Operator assignment:</Text>
                                <ul className="list-disc pl-8 mt-1 space-y-1">
                                  <li>Match operator skills with operation requirements</li>
                                  <li>Consider shift patterns and availability</li>
                                  <li>Plan for breaks and handovers</li>
                                  <li>Ensure proper training if needed</li>
                                  <li>Assign backup operators for critical operations</li>
                                </ul>
                              </div>
                            ),
                          },
                          {
                            key: '5',
                            label: (
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 size={16} className="text-purple-500" />
                                <Text strong>5. Review and Optimize</Text>
                              </div>
                            ),
                            description: (
                              <div className="mt-2">
                                <Text strong>Final checks and optimization:</Text>
                                <ul className="list-disc pl-8 mt-1 space-y-1">
                                  <li>Review complete schedule for conflicts</li>
                                  <li>Check for resource overallocation</li>
                                  <li>Optimize for efficiency and cost</li>
                                  <li>Ensure all quality requirements are met</li>
                                  <li>Get necessary approvals</li>
                                </ul>
                                <Space className="mt-2" size="middle">
                                  <Tag color="blue">Expected Duration</Tag>
                                  <Tag color="green">Resource Requirements</Tag>
                                  <Tag color="orange">Quality Checks</Tag>
                                </Space>
                              </div>
                            ),
                          },
                        ].map((step) => (
                          <Panel
                            key={step.key}
                            header={step.label}
                            extra={
                              <Tooltip title="Click to expand/collapse">
                                <InfoCircleOutlined className="text-gray-500" />
                              </Tooltip>
                            }
                          >
                            {step.description}
                          </Panel>
                        ))}
                      </Collapse>
                    </Card>
                  ),
                },
              ]}
              tabBarExtraContent={
                <Link to="/scheduling">
                  <Button type="primary" icon={<CalendarOutlined />}>
                    Open Scheduler
                  </Button>
                </Link>
              }
            />
          </Card>

          {/* MPP Details Drawer */}
          <Drawer
            title={
              <Space>
                <FileTextOutlined />
                <span>MPP Details - Operation {selectedOperation?.opNo}</span>
              </Space>
            }
            placement="right"
            width={720}
            onClose={() => setMppDrawerVisible(false)}
            open={mppDrawerVisible}
          >
            {selectedOperation && (
              <OperationMPPDetails
                operation={selectedOperation}
                onUpdate={(updatedOperation) => {
                  const updatedOperations = selectedJob.operations.map(op =>
                    op.key === updatedOperation.key ? updatedOperation : op
                  );
                  setSelectedJob(prev => ({
                    ...prev,
                    operations: updatedOperations
                  }));
                }}
              />
            )}
          </Drawer>
        </>
      )}
    </div>
  );
};

export default Planning; 