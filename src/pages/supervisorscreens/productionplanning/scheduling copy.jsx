import React, { useState } from 'react';
import {
  Layout, Card, Row, Col, Button, Space, Input, Select, 
  DatePicker, Table, Tag, Form, Modal, Typography, Divider,
  Tabs, Badge, Timeline, Alert, Tooltip, Progress, Statistic,
  message
} from 'antd';
import {
  ScheduleOutlined, SyncOutlined, SearchOutlined,
  HistoryOutlined, CalendarOutlined, ClockCircleOutlined,
  BarChartOutlined, WarningOutlined, SwapOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { mockMachineData, mockPartNumbers } from '../../../data/mockPlanningData';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Scheduling = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedPartNo, setSelectedPartNo] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [viewMode, setViewMode] = useState('Day');
  const [scheduleView, setScheduleView] = useState('gantt');
  const [selectedJob, setSelectedJob] = useState(null);

  // Enhanced mock data
  const currentSchedule = [
    {
      id: '1',
      machineId: 'DMG-001',
      partNo: 'PART-001',
      startTime: '08:00',
      endTime: '16:00',
      status: 'running',
      operator: 'John Doe',
      progress: 75,
      efficiency: 92,
      plannedQuantity: 100,
      completedQuantity: 75,
      nextMaintenance: '2hrs',
      shiftSupervisor: 'Jane Smith',
      priority: 'high'
    },
    // ... more schedule data
  ];

  const scheduleHistory = [
    {
      date: '2024-01-19',
      changes: [
        {
          type: 'reschedule',
          machine: 'DMG-001',
          reason: 'Machine Maintenance',
          from: '08:00',
          to: '10:00',
          by: 'John Supervisor'
        }
      ]
    }
  ];

  const scheduleAnalytics = {
    machineUtilization: 85,
    scheduledJobs: 12,
    completedJobs: 8,
    delayedJobs: 2,
    averageEfficiency: 89,
    upcomingMaintenance: 3
  };

  // Gantt chart data
  const ganttData = {
    tasks: currentSchedule.map((schedule, index) => ({
      id: `task-${index}`,
      name: `${schedule.machineId} - ${schedule.partNo}`,
      start: new Date(),
      end: new Date(new Date().getTime() + 3600000),
      progress: schedule.progress,
      type: 'task',
      styles: { progressColor: '#1890ff', backgroundColor: '#e6f7ff' }
    }))
  };

  // Handle reschedule
  const handleReschedule = (values) => {
    Modal.confirm({
      title: 'Confirm Rescheduling',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to reschedule this job?</p>
          <p>Reason: {values.reason}</p>
          <p>New Time Slot: {values.newTimeSlot}</p>
        </div>
      ),
      onOk() {
        // Implement rescheduling logic
        message.success('Job rescheduled successfully');
        setIsRescheduleModalVisible(false);
      }
    });
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Enhanced Sidebar */}
      <Sider width={300} theme="light" className="p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <ScheduleOutlined className="text-xl text-blue-500" />
          <Title level={4} style={{ margin: 0 }}>Production Schedule</Title>
        </div>
        
        <Form form={form} layout="vertical" className="scheduling-form">
          <Form.Item label={<Text strong>Machine</Text>}>
            <Select
              placeholder="Select Machine"
              onChange={setSelectedMachine}
              className="w-full"
            >
              {mockMachineData.map(machine => (
                <Option key={machine.id} value={machine.id}>
                  {machine.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={<Text strong>Part Number</Text>}>
            <Select
              placeholder="Select Part"
              onChange={setSelectedPartNo}
              className="w-full"
            >
              {mockPartNumbers.map(part => (
                <Option key={part.id} value={part.id}>
                  {part.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={<Text strong>Date Range</Text>}>
            <DatePicker.RangePicker 
              className="w-full"
              onChange={setDateRange}
            />
          </Form.Item>

          <Form.Item label={<Text strong>Schedule View</Text>}>
            <Select
              value={scheduleView}
              onChange={setScheduleView}
              className="w-full"
            >
              <Option value="gantt">Gantt Chart</Option>
              <Option value="timeline">Timeline</Option>
              <Option value="calendar">Calendar</Option>
            </Select>
          </Form.Item>

          <Form.Item label={<Text strong>View Mode</Text>}>
            <Select
              value={viewMode}
              onChange={setViewMode}
              className="w-full"
            >
              <Option value="Day">Daily</Option>
              <Option value="Week">Weekly</Option>
              <Option value="Month">Monthly</Option>
            </Select>
          </Form.Item>

          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            block
            size="large"
          >
            View Schedule
          </Button>
        </Form>

        {/* Enhanced Quick Stats */}
        <Divider />
        <div className="space-y-4">
          <Card size="small" className="hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="flex items-center gap-2"><CalendarOutlined /> Scheduled Jobs</span>}
              value={scheduleAnalytics.scheduledJobs}
              suffix={
                <Tooltip title="View Details">
                  <Button type="link" size="small">Details</Button>
                </Tooltip>
              }
            />
          </Card>
          <Card size="small" className="hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="flex items-center gap-2"><BarChartOutlined /> Machine Utilization</span>}
              value={scheduleAnalytics.machineUtilization}
              suffix="%"
              valueStyle={{ color: scheduleAnalytics.machineUtilization > 80 ? '#52c41a' : '#faad14' }}
            />
          </Card>
          <Card size="small" className="hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="flex items-center gap-2"><WarningOutlined /> Delayed Jobs</span>}
              value={scheduleAnalytics.delayedJobs}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </div>

        {/* Quick Actions */}
        <Divider>Quick Actions</Divider>
        <Space direction="vertical" className="w-full">
          <Button 
            icon={<SwapOutlined />} 
            block
            onClick={() => setIsRescheduleModalVisible(true)}
          >
            Reschedule Job
          </Button>
          <Button 
            icon={<WarningOutlined />} 
            block
            type="danger"
            ghost
          >
            Report Issue
          </Button>
        </Space>
      </Sider>

      {/* Enhanced Main Content */}
      <Content className="p-8">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          className="schedule-tabs"
        >
          {/* Current Schedule Tab */}
          <TabPane 
            tab={
              <span>
                <ClockCircleOutlined />
                Current Schedule
              </span>
            } 
            key="current"
          >
            {/* Machine Status Overview */}
            <Card className="mb-6">
              <Row gutter={[16, 16]}>
                {mockMachineData.map(machine => (
                  <Col span={8} key={machine.id}>
                    <Card 
                      size="small" 
                      className={`hover:shadow-md transition-shadow ${
                        machine.status === 'running' ? 'border-green-500' : 
                        machine.status === 'idle' ? 'border-yellow-500' : 
                        'border-red-500'
                      } border-l-4`}
                      actions={[
                        <Tooltip title="View Details">
                          <Button type="link" size="small">Details</Button>
                        </Tooltip>,
                        <Tooltip title="View History">
                          <Button type="link" size="small">History</Button>
                        </Tooltip>
                      ]}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{machine.name}</div>
                          <div className="text-sm text-gray-500">{machine.id}</div>
                        </div>
                        <Badge 
                          status={
                            machine.status === 'running' ? 'success' :
                            machine.status === 'idle' ? 'warning' :
                            'error'
                          } 
                          text={machine.status.toUpperCase()}
                        />
                      </div>
                      {machine.currentJob && (
                        <div className="mt-2">
                          <div className="text-sm flex justify-between">
                            <span>Current: {machine.currentJob.partNumber}</span>
                            <Tag color={machine.currentJob.progress > 90 ? 'success' : 'processing'}>
                              {machine.currentJob.progress}%
                            </Tag>
                          </div>
                          <Progress 
                            percent={machine.currentJob.progress} 
                            size="small"
                            status={machine.currentJob.progress < 50 ? 'active' : 'normal'}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Next Maintenance: {machine.nextMaintenance || 'N/A'}
                          </div>
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* Schedule Timeline */}
            <Card 
              title={
                <Space>
                  <BarChartOutlined />
                  <span>Schedule Timeline</span>
                </Space>
              }
              extra={
                <Space>
                  <Select
                    value={viewMode}
                    onChange={setViewMode}
                    style={{ width: 120 }}
                  >
                    <Option value="Day">Daily</Option>
                    <Option value="Week">Weekly</Option>
                    <Option value="Month">Monthly</Option>
                  </Select>
                  <Button icon={<SyncOutlined />}>Refresh</Button>
                  <Button 
                    type="primary"
                    icon={<SwapOutlined />}
                    onClick={() => setIsRescheduleModalVisible(true)}
                  >
                    Reschedule
                  </Button>
                </Space>
              }
            >
              <div style={{ height: '400px' }}>
                <Gantt
                  tasks={ganttData.tasks}
                  viewMode={ViewMode[viewMode]}
                  onDateChange={() => {}}
                  onProgressChange={() => {}}
                  onDoubleClick={() => {}}
                  listCellWidth=""
                  columnWidth={60}
                />
              </div>
            </Card>
          </TabPane>

          {/* Enhanced Schedule History Tab */}
          <TabPane 
            tab={
              <span>
                <HistoryOutlined />
                Schedule History
              </span>
            } 
            key="history"
          >
            <Card>
              <Timeline mode="left">
                {scheduleHistory.map((item, index) => (
                  <Timeline.Item 
                    key={index}
                    color={item.changes[0].type === 'reschedule' ? 'blue' : 'green'}
                    label={item.date}
                  >
                    {item.changes.map((change, changeIndex) => (
                      <Card size="small" key={changeIndex} className="mb-3">
                        <p className="font-medium">{change.type.toUpperCase()}</p>
                        <p>Machine: {change.machine}</p>
                        <p>Reason: {change.reason}</p>
                        <p className="text-sm text-gray-500">
                          Changed by {change.by}
                        </p>
                      </Card>
                    ))}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </TabPane>

          {/* Enhanced Analytics Tab */}
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Analytics
              </span>
            }
            key="analytics"
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Average Efficiency"
                    value={scheduleAnalytics.averageEfficiency}
                    suffix="%"
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              {/* Add more analytics cards */}
            </Row>
          </TabPane>
        </Tabs>
      </Content>

      {/* Enhanced Reschedule Modal */}
      <Modal
        title={
          <div>
            <h3 className="text-lg font-semibold">Reschedule Job</h3>
            <p className="text-sm text-gray-500">
              Provide details for rescheduling
            </p>
          </div>
        }
        open={isRescheduleModalVisible}
        onCancel={() => setIsRescheduleModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleReschedule} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason for Rescheduling"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="maintenance">Machine Maintenance</Option>
              <Option value="breakdown">Machine Breakdown</Option>
              <Option value="operator">Operator Unavailable</Option>
              <Option value="material">Material Shortage</Option>
              <Option value="priority">Priority Change</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="newTimeSlot"
            label="New Time Slot"
            rules={[{ required: true }]}
          >
            <DatePicker.RangePicker 
              showTime 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="notes" label="Additional Notes">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsRescheduleModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Confirm Reschedule
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .schedule-tabs .ant-tabs-nav {
          margin-bottom: 16px;
        }
        
        .ant-card-actions {
          background: #fafafa;
        }
        
        .hover\:shadow-md:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </Layout>
  );
};

export default Scheduling;