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
      {/* Header Section - Made more compact */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        <Space>
          <Badge count={getLowStockItems().length} offset={[-5, 5]}>
            <AlertOutlined className="text-red-500 text-xl" />
          </Badge>
          <ReloadOutlined 
            spin={isLoading}
            onClick={handleRefresh} 
            className="text-xl cursor-pointer text-gray-600 hover:text-blue-500 transition-colors"
          />
        </Space>
      </div>
      
      {/* Analytics Section - Made cards smaller and more compact */}
      <div className="mb-4">
        <Row gutter={[12, 12]} className="mb-4">
          <Col xs={24} md={8}>
            <Card 
              hoverable 
              className="shadow-sm hover:shadow-md transition-shadow duration-300"
              bodyStyle={{ padding: '12px' }}
            >
              <Statistic
                title={<span className="text-sm">Total Items</span>}
                value={stockLevels.reduce((acc, curr) => acc + curr.current, 0)}
                prefix={<InboxOutlined className="text-blue-500" />}
                valueStyle={{ color: '#1890ff', fontSize: '1.5rem' }}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card 
              hoverable 
              className="shadow-sm hover:shadow-md transition-shadow duration-300"
              bodyStyle={{ padding: '12px' }}
            >
              <Statistic
                title={<span className="text-sm">Low Stock</span>}
                value={getLowStockItems().length}
                prefix={<WarningOutlined className="text-red-500" />}
                valueStyle={{ color: '#ff4d4f', fontSize: '1.5rem' }}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card 
              hoverable 
              className="shadow-sm hover:shadow-md transition-shadow duration-300"
              bodyStyle={{ padding: '12px' }}
            >
              <Statistic
                title={<span className="text-sm">Monthly Usage</span>}
                value={12}
                prefix={<LineChartOutlined className="text-green-500" />}
                suffix="%"
                valueStyle={{ color: '#52c41a', fontSize: '1.5rem' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Low Stock Alerts - Made more compact */}
        {getLowStockItems().length > 0 && (
          <Card 
            className="mb-4 shadow-sm"
            title={
              <span className="flex items-center text-sm">
                <WarningOutlined className="text-red-500 mr-2" />
                Low Stock Alerts
              </span>
            }
            bodyStyle={{ padding: '12px' }}
          >
            <Row gutter={[12, 12]}>
              {getLowStockItems().map((item) => (
                <Col xs={24} md={12} key={item.category}>
                  <Alert
                    message={item.category}
                    description={
                      <Space size="small" className="text-xs">
                        <span>Current: {item.current}</span>
                        <span>Min: {item.minimum}</span>
                        <span className="text-red-500">
                          {((item.current / item.minimum) * 100).toFixed(0)}%
                        </span>
                      </Space>
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
        className="shadow-sm"
        title={
          <span className="flex items-center text-base">
            <DashboardOutlined className="mr-2" />
            Inventory Categories
          </span>
        }
        bodyStyle={{ padding: '12px' }}
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