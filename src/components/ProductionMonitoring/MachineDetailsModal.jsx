import React, { useState } from 'react';
import { 
  Modal, Descriptions, Card, Row, Col, 
  Statistic, Progress, Timeline, Space, Tag, Typography, 
  Divider, Tabs, Button, Alert, Badge
} from 'antd';
import {
  ClockCircleOutlined,
  ToolOutlined,
  NumberOutlined,
  FileTextOutlined,
  AimOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  UserOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { Clock, Box, Activity, Settings, Layers, BarChart2, TrendingUp, AlertCircle } from 'lucide-react';

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const MachineDetailsModal = ({ machine, visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('1');
  
  if (!machine) return null;

  // Safely calculate progress
  const productionProgress = machine.production_details.required_quantity 
    ? (machine.part_count / machine.production_details.required_quantity) * 100 
    : 0;

  // Calculate historical efficiency (mock data)
  const efficiencyData = {
    today: 87.2,
    week: 83.5,
    month: 79.8
  };

  // Random maintenance data (for demo)
  const maintenanceInfo = {
    lastMaintenance: moment().subtract(18, 'days').format('YYYY-MM-DD'),
    nextScheduled: moment().add(12, 'days').format('YYYY-MM-DD'),
    maintenanceHistory: [
      { date: moment().subtract(18, 'days').format('YYYY-MM-DD'), type: 'Preventive', technician: 'John Smith', duration: '4h' },
      { date: moment().subtract(45, 'days').format('YYYY-MM-DD'), type: 'Corrective', technician: 'Maria Johnson', duration: '6h' },
      { date: moment().subtract(72, 'days').format('YYYY-MM-DD'), type: 'Preventive', technician: 'Robert Lee', duration: '3h' }
    ],
    statistics: {
      mttr: '3.8h', // Mean Time To Repair
      mtbf: '42d',  // Mean Time Between Failures
      availability: 97.2
    }
  };

  // Random alerts (for demo)
  const alerts = [
    { level: 'warning', message: 'Approaching maintenance threshold', date: '2 days ago' },
    { level: 'info', message: 'Production order changed', date: '1 week ago' },
    { level: 'error', message: 'Emergency stop triggered', date: '2 weeks ago' }
  ];

  // Production history (mock data)
  const productionHistory = [
    { order: 'PO-2023-11542', completed: true, quantity: 250, startDate: '2023-10-05', endDate: '2023-10-07' },
    { order: 'PO-2023-10987', completed: true, quantity: 125, startDate: '2023-09-28', endDate: '2023-09-30' },
    { order: 'PO-2023-10421', completed: true, quantity: 300, startDate: '2023-09-20', endDate: '2023-09-23' }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xl font-semibold">{machine.machine_name || 'Unknown Machine'}</div>
            <Text type="secondary" className="text-sm">ID: {machine.machine_id}</Text>
          </div>
          <Tag color={machine.status_color} className="ml-auto text-base px-3 py-1">
            {machine.status || 'UNKNOWN'}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>Close</Button>,
        <Button 
          key="maintenance" 
          icon={<ToolOutlined />}
          onClick={() => setActiveTab('3')}
        >
          Schedule Maintenance
        </Button>,
        <Button 
          key="fullReport" 
          type="primary" 
          icon={<FileTextOutlined />}
        >
          Full Report
        </Button>
      ]}
      className="machine-details-modal"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <InfoCircleOutlined />
              Overview
            </span>
          } 
          key="1"
        >
          <div className="space-y-6">
            <Card className="shadow-sm">
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Title level={5}>Production Order Details</Title>
                  <Descriptions column={1} className="mt-4">
                    <Descriptions.Item label="Order Number">
                      {machine.production_details.production_order ? (
                        <Tag color="blue">{machine.production_details.production_order}</Tag>
                      ) : (
                        <Tag color="default">No Active Order</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Part Number">
                      {machine.production_details.part_number || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Part Description">
                      {machine.production_details.part_description || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Operation">
                      {machine.production_details.operation_number && machine.production_details.operation_description
                        ? `${machine.production_details.operation_number} - ${machine.production_details.operation_description}`
                        : '-'
                      }
                    </Descriptions.Item>
                    <Descriptions.Item label="Job Status">
                      <Badge status={machine.job_status === 1 ? 'success' : 'default'}>
                        {machine.job_status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Title level={5}>Production Progress</Title>
                  <div className="space-y-6 mt-4">
                    <Statistic 
                      title="Parts Completed"
                      value={machine.part_count}
                      suffix={machine.production_details.required_quantity ? 
                        `/ ${machine.production_details.required_quantity}` : 
                        ''
                      }
                    />
                    {machine.production_details.required_quantity > 0 && (
                      <Progress 
                        percent={productionProgress.toFixed(1)}
                        status={productionProgress >= 100 ? "success" : "active"}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    )}
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic 
                          title="Launched Quantity"
                          value={machine.production_details.launched_quantity || 0}
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Jobs In Progress"
                          value={machine.job_in_progress || 0}
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Program Information */}
            <Card title="Program Information" className="shadow-sm">
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <Statistic 
                    title="Active Program"
                    value={machine.production_details.active_program || '-'}
                    prefix={<AimOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Selected Program"
                    value={machine.production_details.selected_program || '-'}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Program Number"
                    value={machine.production_details.program_number || '-'}
                    prefix={<NumberOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* Machine Status */}
            <Card title="Machine Status" className="shadow-sm">
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <Statistic
                    title="Last Updated"
                    value={moment(machine.last_updated).fromNow()}
                    prefix={<Clock className="h-5 w-5" />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Uptime"
                    value={machine.uptime || '0h'}
                    prefix={<Activity className="h-5 w-5" />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Efficiency (Today)"
                    value={`${efficiencyData.today}%`}
                    prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: efficiencyData.today > 85 ? '#52c41a' : '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <BarChart2 size={16} />
              Performance
            </span>
          } 
          key="2"
        >
          <div className="space-y-6">
            <Card title="Efficiency Metrics" className="shadow-sm">
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <Statistic
                    title="Today's OEE"
                    value={`${efficiencyData.today}%`}
                    valueStyle={{ color: efficiencyData.today > 85 ? '#52c41a' : '#faad14' }}
                  />
                  <Progress 
                    percent={efficiencyData.today} 
                    status={efficiencyData.today > 85 ? "success" : "normal"} 
                    className="mt-2"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="This Week's OEE"
                    value={`${efficiencyData.week}%`}
                    valueStyle={{ color: efficiencyData.week > 85 ? '#52c41a' : '#faad14' }}
                  />
                  <Progress 
                    percent={efficiencyData.week} 
                    status={efficiencyData.week > 85 ? "success" : "normal"} 
                    className="mt-2"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="This Month's OEE"
                    value={`${efficiencyData.month}%`}
                    valueStyle={{ color: efficiencyData.month > 85 ? '#52c41a' : '#faad14' }}
                  />
                  <Progress 
                    percent={efficiencyData.month} 
                    status={efficiencyData.month > 85 ? "success" : "normal"} 
                    className="mt-2"
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <Statistic
                    title="Availability"
                    value="92.3%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Performance"
                    value="87.5%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Quality"
                    value="98.2%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>
            
            <Card title="Production History" className="shadow-sm">
              <Timeline mode="left">
                {productionHistory.map((item, index) => (
                  <Timeline.Item 
                    key={index} 
                    color={item.completed ? 'green' : 'blue'}
                    label={`${item.startDate} to ${item.endDate}`}
                  >
                    <div className="font-medium">
                      {item.order}
                      <Tag color={item.completed ? 'success' : 'processing'} className="ml-2">
                        {item.completed ? 'Completed' : 'In Progress'}
                      </Tag>
                    </div>
                    <div className="text-gray-500">Quantity: {item.quantity} units</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <ToolOutlined />
              Maintenance
            </span>
          } 
          key="3"
        >
          <div className="space-y-6">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Maintenance Overview" className="shadow-sm">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="Last Maintenance">
                      {maintenanceInfo.lastMaintenance}
                    </Descriptions.Item>
                    <Descriptions.Item label="Next Scheduled">
                      {maintenanceInfo.nextScheduled}
                      <Tag color="warning" className="ml-2">
                        In {moment(maintenanceInfo.nextScheduled).diff(moment(), 'days')} days
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="MTTR (Mean Time To Repair)">
                      {maintenanceInfo.statistics.mttr}
                    </Descriptions.Item>
                    <Descriptions.Item label="MTBF (Mean Time Between Failures)">
                      {maintenanceInfo.statistics.mtbf}
                    </Descriptions.Item>
                    <Descriptions.Item label="Maintenance Availability">
                      {maintenanceInfo.statistics.availability}%
                    </Descriptions.Item>
                  </Descriptions>
                  
                  <div className="mt-4">
                    <Button type="primary" icon={<ToolOutlined />}>
                      Schedule Maintenance
                    </Button>
                    <Button className="ml-2" icon={<FileTextOutlined />}>
                      Maintenance Records
                    </Button>
                  </div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Maintenance History" className="shadow-sm">
                  <Timeline>
                    {maintenanceInfo.maintenanceHistory.map((record, index) => (
                      <Timeline.Item 
                        key={index} 
                        color={record.type === 'Preventive' ? 'blue' : 'red'}
                      >
                        <div className="font-medium">{record.type} Maintenance</div>
                        <div className="text-gray-500">Date: {record.date}</div>
                        <div className="text-gray-500">Technician: {record.technician}</div>
                        <div className="text-gray-500">Duration: {record.duration}</div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </Col>
            </Row>
            
            <Card title="Maintenance Alerts & Recommendations" className="shadow-sm">
              <Alert
                message="Upcoming Scheduled Maintenance"
                description={`The next maintenance is scheduled on ${maintenanceInfo.nextScheduled}. Please ensure the machine is available for servicing.`}
                type="info"
                showIcon
                className="mb-3"
              />
              
              <Alert
                message="Part Replacement Recommended"
                description="Coolant pump shows early signs of wear. Consider replacement during next scheduled maintenance."
                type="warning"
                showIcon
                className="mb-3"
              />
              
              <div className="mt-4">
                <Title level={5}>Recommended Spare Parts</Title>
                <ul className="pl-5 list-disc space-y-1 mt-2">
                  <li>Coolant pump (Part #A-12345)</li>
                  <li>Drive belt assembly (Part #B-78901)</li>
                  <li>Filtration system sensors (Part #S-44556)</li>
                  <li>Control panel switches (Part #C-23498)</li>
                </ul>
              </div>
            </Card>
          </div>
        </TabPane>
        
        
        
        
      </Tabs>
    </Modal>
  );
};

const getStatusColor = (status) => {
  const statusMap = {
    'RUNNING': '#52c41a',
    'IDLE': '#faad14',
    'STOPPED': '#ff4d4f',
    'MAINTENANCE': '#1890ff',
    'PRODUCTION': '#722ed1',
    'OFFLINE': '#d9d9d9'
  };
  return statusMap[status] || '#d9d9d9';
};

export default MachineDetailsModal;