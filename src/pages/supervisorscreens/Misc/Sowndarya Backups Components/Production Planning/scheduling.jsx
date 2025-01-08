import React, { useState } from 'react';
import { Card, Row, Col, Form, Select, DatePicker, Button, Typography, Tabs, Badge, Tooltip, Tag, Space, Progress, Table } from 'antd';
import { ClockCircleOutlined, BarChartOutlined, SyncOutlined, SwapOutlined, SearchOutlined } from '@ant-design/icons';
import AllMachineAnalytics from '../../../components/ProductionPlanning/AllMachineAnalytics'
import ScheduleTimelineChart from '../productionplanning/ScheduleTimeline'

const { Title, Text } = Typography;


const { Option } = Select;
const { TabPane } = Tabs;

const Scheduling = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [viewMode, setViewMode] = useState('Day');
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  // Updated machine data
  const machineData = [
    { id: 'DMG-001', name: 'DMG DMU 60 eVo' },
    { id: 'DMG-002', name: 'DMG DMU 50' },
    { id: 'DMG-003', name: 'Makino A81' },
  ];

  // Mock machine status data
  const mockMachineData = [
    { id: 'DMG-001', name: 'DMG DMU 60 eVo', status: 'running', currentJob: { partNumber: 'PN001', progress: 95 }, nextMaintenance: '2025-05-01' },
    { id: 'DMG-002', name: 'DMG DMU 50', status: 'idle', currentJob: { partNumber: 'PN002', progress: 30 }, nextMaintenance: '2025-06-01' },
    { id: 'DMG-003', name: 'Makino A81', status: 'stopped', currentJob: null, nextMaintenance: '2025-07-01' },
  ];

  // Mock schedule history data
  const scheduleHistoryData = [
    { date: '2024-12-01', machine: 'DMG DMU 60 eVo', partNumber: 'PN001', status: 'Completed', duration: '8 hrs', remarks: 'Routine operation' },
    { date: '2024-12-02', machine: 'DMG DMU 50', partNumber: 'PN002', status: 'In Progress', duration: '4 hrs', remarks: 'Delayed due to tool change' },
    { date: '2024-12-03', machine: 'Makino A81', partNumber: 'PN003', status: 'Completed', duration: '10 hrs', remarks: 'Issue with material feed' },
  ];

  const handleViewSchedule = () => {
    // Handle the "View Schedule Details" button click
    const scheduleData = selectedMachine === 'all' 
      ? mockMachineData 
      : mockMachineData.filter(machine => machine.id === selectedMachine);
    setScheduleDetails(scheduleData);  // Update the schedule details state
  };

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Machine', dataIndex: 'machine', key: 'machine' },
    { title: 'Part Number', dataIndex: 'partNumber', key: 'partNumber' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Duration', dataIndex: 'duration', key: 'duration' },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
  ];

  return (
    <div className="p-1">
      {/* Production Schedule Card */}
      <Card bordered={false} className="shadow-lg mb-2 p-1">
        {/* Flex layout for Title and Filters */}
        <Row justify="space-between" align="middle">
          {/* Production Schedule Title */}
          <Col>
            <Title level={4} className="mb-0 mt-0">Production Schedule</Title>
          </Col>

          {/* Filter Options Form */}
          <Col>
            <Form layout="inline" onFinish={handleViewSchedule}>
              <Row gutter={4} align="middle">
                {/* Machine Select */}
                <Col>
                  <Form.Item label={<Text strong>Machine</Text>} name="machine">
                    <Select
                      placeholder="Select Machine"
                      onChange={setSelectedMachine}
                      className="w-full"
                      value={selectedMachine}
                      dropdownStyle={{ width: '220px' }} 
                    >
                      <Option value="all">All Machines</Option>
                      {machineData.map(machine => (
                        <Option key={machine.id} value={machine.id}>
                          {machine.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Date Range Picker */}
                <Col>
                  <Form.Item label={<Text strong>Date Range</Text>} name="dateRange">
                    <DatePicker.RangePicker
                      onChange={setDateRange}
                      value={dateRange}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>

                {/* View Mode Select */}
                <Col>
                  <Form.Item label={<Text strong>View Mode</Text>} name="viewMode">
                    <Select
                      placeholder="Select View Mode"
                      onChange={setViewMode}
                      className="w-full"
                      value={viewMode}
                      dropdownStyle={{ width: '100px' }} 
                    >
                      <Option value="Day">Day</Option>
                      <Option value="Week">Week</Option>
                      <Option value="Month">Month</Option>
                    </Select>
                  </Form.Item>
                </Col>

                {/* View Schedule Details Button */}
                <Col>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SearchOutlined />}
                      className="mt-1"
                    >
                      View Schedule Details
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Card>

      {/* Machine Analytics */}
      <AllMachineAnalytics machineData={mockMachineData} scheduleHistoryData={scheduleHistoryData} />

      {/* Tabs for Machine Details */}
      {(selectedMachine && selectedMachine !== 'all') && (
        <Tabs defaultActiveKey="current">
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
                {mockMachineData.filter(machine => machine.id === selectedMachine).map(machine => (
                  <Col span={8} key={machine.id}>
                    <Card 
                      size="small" 
                      className={`hover:shadow-md transition-shadow ${
                        machine.status === 'running' ? 'border-green-500' : 
                        machine.status === 'idle' ? 'border-yellow-500' : 
                        'border-red-500'
                      } border-l-4`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{machine.name}</div>
                          <div className="text-sm text-gray-500">{machine.id}</div>
                        </div>
                        <Badge 
                          status={machine.status === 'running' ? 'success' :
                            machine.status === 'idle' ? 'warning' : 'error'} 
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
                            status={
                              machine.status === 'running'
                                ? 'normal'
                                : machine.status === 'idle'
                                ? 'active'
                                : 'exception'
                            }
                            strokeColor={
                              machine.status === 'running' 
                                ? 'green' 
                                : machine.status === 'idle' 
                                ? 'orange' 
                                : 'red'
                            }
                          />
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
      <ScheduleTimelineChart selectedMachines={selectedMachines} />
    </Card>
          </TabPane>

          {/* Schedule History Tab */}
          <TabPane 
            tab={ 
              <span>
                <ClockCircleOutlined />
                Schedule History
              </span> 
            } 
            key="history"
          >
            {/* Schedule History Table */}
            <Card className="mb-6">
              <Table 
                columns={columns} 
                dataSource={scheduleHistoryData} 
                rowKey="date"
                pagination={false}
              />
            </Card>
          </TabPane>
        </Tabs>
      )}

      {/* If "All Machines" is selected */}
      {selectedMachine === 'all' && (
  <Tabs defaultActiveKey="current">
    <TabPane 
      tab={ 
        <span>
          <ClockCircleOutlined />
          All Machines Schedule
        </span> 
      } 
      key="current"
    >
      {/* Machine Status Overview for All Machines */}
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
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{machine.name}</div>
                    <div className="text-sm text-gray-500">{machine.id}</div>
                  </div>
                  <Badge 
                    status={machine.status === 'running' ? 'success' :
                      machine.status === 'idle' ? 'warning' : 'error'} 
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
                  status={
                    machine.status === 'running'
                      ? 'normal'
                      : machine.status === 'idle'
                      ? 'active'
                      : 'exception'
                  }
                  strokeColor={
                    machine.status === 'running' 
                      ? 'green' 
                      : machine.status === 'idle' 
                      ? 'orange' 
                      : 'red'
                  }
                />
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Schedule Timeline for All Machines */}
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
<ScheduleTimelineChart selectedMachines={selectedMachines} />
      </Card>
    </TabPane>

    {/* Schedule History Tab for All Machines */}
    <TabPane 
      tab={ 
        <span>
          <ClockCircleOutlined />
          Schedule History
        </span> 
      } 
      key="history"
    >
      {/* Schedule History Table for All Machines */}
      <Card className="mb-6">
        <Table 
          columns={columns} 
          dataSource={scheduleHistoryData} 
          rowKey="date"
          pagination={false}
        />
      </Card>
    </TabPane>
  </Tabs>
)}

    </div>
  );
};

export default Scheduling;