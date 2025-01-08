import React, { useState } from 'react';
import { Tabs, Card, Row, Col, Alert, Badge, Space, Statistic } from 'antd';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  WarningOutlined, 
  ArrowUpOutlined, 
  InboxOutlined, 
  LineChartOutlined,
  DashboardOutlined,
  AlertOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import Tools from './Tools';
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';

function Inventory() {
  const [isLoading, setIsLoading] = useState(false);

  // Sample data - replace with your actual data
  const stockLevels = [
    { category: 'Tools', current: 245, minimum: 100, maximum: 300 },
    { category: 'Gauges', current: 120, minimum: 50, maximum: 150 },
    { category: 'Fixtures', current: 85, minimum: 40, maximum: 100 },
    { category: 'Raw Materials', current: 320, minimum: 200, maximum: 400 },
    { category: 'Consumables', current: 560, minimum: 300, maximum: 600 }
  ];

  const monthlyUsage = [
    { month: 'Jan', tools: 45, gauges: 12, fixtures: 8, materials: 120, consumables: 200 },
    { month: 'Feb', tools: 38, gauges: 15, fixtures: 10, materials: 140, consumables: 180 },
    { month: 'Mar', tools: 52, gauges: 18, fixtures: 12, materials: 100, consumables: 220 }
  ];

  const getLowStockItems = () => {
    return stockLevels.filter(item => item.current <= item.minimum * 1.2);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        <Space>
          <Badge count={getLowStockItems().length} offset={[-5, 5]}>
            <AlertOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
          </Badge>
          <ReloadOutlined 
            spin={isLoading}
            onClick={handleRefresh} 
            style={{ fontSize: '24px', cursor: 'pointer', marginLeft: '16px' }}
          />
        </Space>
      </div>
      
      {/* Analytics Section */}
      <div className="mb-6">
        {/* Summary Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} md={8}>
            <Card hoverable className="transition-shadow duration-300 hover:shadow-lg">
              <Statistic
                title={<span className="text-lg">Total Items in Stock</span>}
                value={stockLevels.reduce((acc, curr) => acc + curr.current, 0)}
                prefix={<InboxOutlined className="text-blue-500" />}
                valueStyle={{ color: '#1890ff' }}
              />
              <p className="text-gray-500 mt-2">Across all categories</p>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card hoverable className="transition-shadow duration-300 hover:shadow-lg">
              <Statistic
                title={<span className="text-lg">Low Stock Alerts</span>}
                value={getLowStockItems().length}
                prefix={<WarningOutlined className="text-red-500" />}
                valueStyle={{ color: '#ff4d4f' }}
              />
              <p className="text-gray-500 mt-2">Items below safety stock</p>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card hoverable className="transition-shadow duration-300 hover:shadow-lg">
              <Statistic
                title={<span className="text-lg">Monthly Usage Trend</span>}
                value={12}
                prefix={<LineChartOutlined className="text-green-500" />}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
              <p className="text-gray-500 mt-2">Compared to last month</p>
            </Card>
          </Col>
        </Row>

        {/* Low Stock Alerts Section */}
        {getLowStockItems().length > 0 && (
          <Card 
            className="mb-6"
            title={
              <span className="flex items-center">
                <WarningOutlined className="text-red-500 mr-2" />
                Low Stock Alerts
              </span>
            }
          >
            <Row gutter={[16, 16]}>
              {getLowStockItems().map((item) => (
                <Col xs={24} md={12} key={item.category}>
                  <Alert
                    message={
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.category}</span>
                        <Badge 
                          status="error" 
                          text="Reorder Required"
                        />
                      </div>
                    }
                    description={
                      <div className="mt-2">
                        <Space size="large">
                          <span>Current: {item.current}</span>
                          <span>Minimum: {item.minimum}</span>
                          <span className="text-red-500">
                            {((item.current / item.minimum) * 100).toFixed(1)}% of minimum
                          </span>
                        </Space>
                      </div>
                    }
                    type="warning"
                    showIcon
                    className="border border-orange-200"
                  />
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </div>

      {/* Inventory Tabs Section */}
      <Card 
        className="shadow-md"
        title={
          <span className="flex items-center">
            <DashboardOutlined className="mr-2" />
            Inventory Categories
          </span>
        }
      >
        <Tabs 
          defaultActiveKey="tools"
          type="card"
          className="custom-tabs"
          items={[
            {
              key: 'tools',
              label: 'Tools',
              children: <Tools />,
            },
            {
              key: 'gauges',
              label: 'Gauges & Instruments',
              children: <GaugesAndInstruments />,
            },
            {
              key: 'fixtures',
              label: 'Fixtures',
              children: <Fixtures />,
            },
            {
              key: 'rawMaterials',
              label: 'Raw Materials',
              children: <RawMaterials />,
            },
            {
              key: 'consumables',
              label: 'Consumables',
              children: <Consumables />,
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default Inventory;