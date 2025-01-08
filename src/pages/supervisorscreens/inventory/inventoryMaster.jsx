import React, { useState } from 'react';
import { 
  Tabs, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Space,
  Alert,
  Button,
  Typography 
} from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowUpOutlined, 
  DashboardOutlined,
  ToolOutlined,
  ExperimentOutlined,
  BuildOutlined,
  BoxPlotOutlined,
  ShoppingOutlined,
  AreaChartOutlined,
  ReloadOutlined,
  WarningFilled
} from '@ant-design/icons';

import Tools from './Tools';
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Inventory() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const stockTrends = [
    { month: 'Jan', tools: 150, materials: 280, consumables: 200 },
    { month: 'Feb', tools: 180, materials: 250, consumables: 210 },
    { month: 'Mar', tools: 170, materials: 300, consumables: 190 },
    { month: 'Apr', tools: 200, materials: 320, consumables: 230 },
    { month: 'May', tools: 220, materials: 290, consumables: 220 },
    { month: 'Jun', tools: 190, materials: 350, consumables: 240 },
  ];

  const categoryData = [
    { name: 'Tools', value: 245 },
    { name: 'Raw Materials', value: 350 },
    { name: 'Gauges', value: 180 },
    { name: 'Consumables', value: 420 },
    { name: 'Fixtures', value: 150 }
  ];

  return (
    <div className="h-full bg-gray-50">
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="custom-inventory-tabs"
        tabBarExtraContent={
          <Button 
            icon={<ReloadOutlined />}
            type="primary"
            ghost
            className="mr-4"
          >
            Refresh Data
          </Button>
        }
      >
        {/* Overview Dashboard Tab */}
        <TabPane 
          tab={
            <span className="tab-label">
              <DashboardOutlined />
              Overview
            </span>
          }
          key="overview"
        >
          <div className="p-6">
            {/* Critical Alerts Section */}
            <div className="mb-6">
              <Alert
                message={
                  <Space>
                    <WarningFilled style={{ color: '#ff4d4f' }} />
                    <Text strong>Critical Stock Alerts</Text>
                  </Space>
                }
                description={
                  <Row gutter={[16, 16]} className="mt-3">
                    <Col xs={24} md={8}>
                      <Card className="alert-card" bordered={false}>
                        <Text type="danger">8 items below threshold</Text>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card className="alert-card" bordered={false}>
                        <Text type="warning">5 items need maintenance</Text>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card className="alert-card" bordered={false}>
                        <Text type="secondary">3 pending orders</Text>
                      </Card>
                    </Col>
                  </Row>
                }
                type="error"
                showIcon={false}
                className="custom-alert"
              />
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} md={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic
                    title={<Text strong>Total Items</Text>}
                    value={1458}
                    prefix={<DashboardOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Progress percent={70} showInfo={false} strokeColor="#1890ff" />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic
                    title={<Text strong>Stock Value</Text>}
                    value={2345600}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Progress percent={85} showInfo={false} strokeColor="#52c41a" />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic
                    title={<Text strong>Monthly Usage</Text>}
                    value={15.4}
                    prefix={<ArrowUpOutlined />}
                    suffix="%"
                    valueStyle={{ color: '#faad14' }}
                  />
                  <Progress percent={45} showInfo={false} strokeColor="#faad14" />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className="stat-card" bordered={false}>
                  <Statistic
                    title={<Text strong>Efficiency Rate</Text>}
                    value={92}
                    suffix="%"
                    valueStyle={{ color: '#13c2c2' }}
                  />
                  <Progress percent={92} showInfo={false} strokeColor="#13c2c2" />
                </Card>
              </Col>
            </Row>

            {/* Charts Section */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card 
                  title={<Title level={5}>Inventory Trends</Title>} 
                  className="chart-card"
                  bordered={false}
                >
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stockTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="tools" 
                        stroke="#1890ff" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="materials" 
                        stroke="#52c41a"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="consumables" 
                        stroke="#faad14"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card 
                  title={<Title level={5}>Category Distribution</Title>}
                  className="chart-card"
                  bordered={false}
                >
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>
        </TabPane>

        {/* Category Tabs */}
        <TabPane 
          tab={
            <span className="tab-label">
              <ToolOutlined />
              Tools
            </span>
          } 
          key="tools"
        >
          <Tools />
        </TabPane>

        <TabPane 
          tab={
            <span className="tab-label">
              <ExperimentOutlined />
              Gauges
            </span>
          } 
          key="gauges"
        >
          <GaugesAndInstruments />
        </TabPane>

        <TabPane 
          tab={
            <span className="tab-label">
              <BuildOutlined />
              Fixtures
            </span>
          } 
          key="fixtures"
        >
          <Fixtures />
        </TabPane>

        <TabPane 
          tab={
            <span className="tab-label">
              <BoxPlotOutlined />
              Materials
            </span>
          } 
          key="materials"
        >
          <RawMaterials />
        </TabPane>

        <TabPane 
          tab={
            <span className="tab-label">
              <ShoppingOutlined />
              Consumables
            </span>
          } 
          key="consumables"
        >
          <Consumables />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Inventory;