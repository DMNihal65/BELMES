import React, { useState } from 'react';
import { 
  Card, 
  Col, 
  Row, 
  Button, 
  Statistic, 
  Typography, 
  Space, 
  Table, 
  Badge, 
  Progress, 
  Select, 
  DatePicker,
  Tooltip
} from 'antd';
import { 
  BarChartOutlined,
  UserOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('today');
  const [selectedMachine, setSelectedMachine] = useState('all');

  // Mock data for production overview
  const productionMetrics = {
    totalOrders: 145,
    completedOrders: 98,
    inProgress: 42,
    delayed: 5,
    efficiency: 87,
    utilization: 92,
    quality: 95,
    oee: 89
  };

  // Mock data for recent orders
  const recentOrders = [
    {
      key: '1',
      orderId: 'ORD-2024-001',
      customer: 'Aerospace Corp',
      status: 'In Progress',
      progress: 75,
      dueDate: '2024-12-25',
      priority: 'High'
    },
    {
      key: '2',
      orderId: 'ORD-2024-002',
      customer: 'Defense Systems',
      status: 'Pending',
      progress: 0,
      dueDate: '2024-12-28',
      priority: 'Medium'
    },
    {
      key: '3',
      orderId: 'ORD-2024-003',
      customer: 'Naval Tech',
      status: 'Completed',
      progress: 100,
      dueDate: '2024-12-15',
      priority: 'Low'
    }
  ];

  // Table columns for recent orders
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'In Progress': 'processing',
          'Completed': 'success',
          'Pending': 'warning',
          'Delayed': 'error'
        };
        return <Badge status={colors[status]} text={status} />;
      },
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Progress percent={progress} size="small" status={progress === 100 ? "success" : "active"} />
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colors = {
          High: 'red',
          Medium: 'orange',
          Low: 'green'
        };
        return <Badge color={colors[priority]} text={priority} />;
      },
    },
  ];

  return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-6 rounded-lg shadow-sm">
          <Space>
            <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>Supervisor Dashboard</Title>
              <Text type="secondary">Production Overview and Analytics</Text>
            </div>
          </Space>
        <Space>
            <Select
              defaultValue="today"
              style={{ width: 120 }}
            onChange={setTimeRange}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
              ]}
            />
          <RangePicker />
          </Space>
        </div>

        {/* Key Metrics Section */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
          <Card hoverable>
              <Statistic
                title={
                  <Space>
                    <ShoppingOutlined style={{ color: '#1890ff' }} />
                    <span>Total Orders</span>
                  </Space>
                }
                value={productionMetrics.totalOrders}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
          <Card hoverable>
              <Statistic
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span>Completed</span>
                  </Space>
                }
                value={productionMetrics.completedOrders}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
          <Card hoverable>
              <Statistic
                title={
                  <Space>
                    <ClockCircleOutlined style={{ color: '#faad14' }} />
                    <span>In Progress</span>
                  </Space>
                }
                value={productionMetrics.inProgress}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
          <Card hoverable>
              <Statistic
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    <span>Delayed</span>
                  </Space>
                }
                value={productionMetrics.delayed}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Performance Metrics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} md={12}>
            <Card 
              title={
                <Space>
                  <LineChartOutlined />
                  <span>Performance Metrics</span>
                </Space>
              }
              hoverable
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Tooltip title="Machine Efficiency Rate">
                    <Card className="text-center" bordered={false}>
                      <Statistic
                        title="Efficiency"
                        value={productionMetrics.efficiency}
                        suffix="%"
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<RiseOutlined />}
                      />
                    <Progress percent={productionMetrics.efficiency} strokeColor="#1890ff" />
                    </Card>
                  </Tooltip>
                </Col>
                <Col span={12}>
                  <Tooltip title="Product Quality Rate">
                    <Card className="text-center" bordered={false}>
                      <Statistic
                        title="Quality"
                        value={productionMetrics.quality}
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    <Progress percent={productionMetrics.quality} strokeColor="#52c41a" />
                    </Card>
                  </Tooltip>
                </Col>
                <Col span={12}>
                  <Tooltip title="Machine Utilization Rate">
                    <Card className="text-center" bordered={false}>
                      <Statistic
                        title="Utilization"
                        value={productionMetrics.utilization}
                        suffix="%"
                        valueStyle={{ color: '#722ed1' }}
                        prefix={<DashboardOutlined />}
                      />
                    <Progress percent={productionMetrics.utilization} strokeColor="#722ed1" />
                    </Card>
                  </Tooltip>
                </Col>
                <Col span={12}>
                  <Tooltip title="Overall Equipment Effectiveness">
                    <Card className="text-center" bordered={false}>
                      <Statistic
                        title="OEE"
                        value={productionMetrics.oee}
                        suffix="%"
                        valueStyle={{ color: '#eb2f96' }}
                        prefix={<LineChartOutlined />}
                      />
                    <Progress percent={productionMetrics.oee} strokeColor="#eb2f96" />
                    </Card>
                  </Tooltip>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card 
              title={
                <Space>
                  <SettingOutlined />
                  <span>Quick Actions</span>
                </Space>
              }
              hoverable
            >
              <div className="grid grid-cols-2 gap-4">
                <Tooltip title="Create New Production Order">
                  <Button 
                    type="primary" 
                    icon={<ShoppingOutlined />}
                    onClick={() => navigate('/supervisor/order-management')}
                    className="h-16"
                  >
                    New Order
                  </Button>
                </Tooltip>
                <Tooltip title="Schedule Machine Maintenance">
                  <Button 
                    type="default"
                    icon={<ToolOutlined />}
                    onClick={() => navigate('/supervisor/maintenance')}
                    className="h-16"
                  >
                    Schedule Maintenance
                  </Button>
                </Tooltip>
                <Tooltip title="Manage Workforce Schedule">
                  <Button 
                    type="default"
                    icon={<TeamOutlined />}
                    onClick={() => navigate('/supervisor/workforce')}
                    className="h-16"
                  >
                    Workforce Management
                  </Button>
                </Tooltip>
                <Tooltip title="Generate Production Reports">
                  <Button 
                    type="default"
                    icon={<BarChartOutlined />}
                    onClick={() => navigate('/supervisor/reports')}
                    className="h-16"
                  >
                    Generate Reports
                  </Button>
                </Tooltip>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent Orders Table */}
        <Card 
          title={
            <Space>
              <ShoppingOutlined />
              <span>Recent Orders</span>
            </Space>
          }
          extra={
          <Button type="primary" icon={<FileTextOutlined />} onClick={() => navigate('/supervisor/order-management')}>
                View All Orders
              </Button>
          }
        >
          <Table 
            columns={columns} 
            dataSource={recentOrders}
          pagination={false}
          />
        </Card>
      </div>
  );
}

export default Dashboard;