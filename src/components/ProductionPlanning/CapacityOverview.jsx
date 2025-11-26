import React from 'react';
import { Card, Row, Col, Progress, Statistic, Space, Alert, Tooltip } from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line 
} from 'recharts';
import { 
  ClockCircleOutlined, ToolOutlined, 
  WarningOutlined, CheckCircleOutlined 
} from '@ant-design/icons';

const CapacityOverview = ({ data, viewMode }) => {
  // Calculate overall statistics
  const stats = {
    totalCapacity: data.reduce((acc, m) => acc + m.totalCapacity, 0),
    usedCapacity: data.reduce((acc, m) => acc + m.usedCapacity, 0),
    plannedCapacity: data.reduce((acc, m) => acc + m.plannedCapacity, 0),
    availableCapacity: data.reduce((acc, m) => acc + (m.totalCapacity - m.usedCapacity - m.plannedCapacity), 0),
    averageEfficiency: data.reduce((acc, m) => acc + m.efficiency, 0) / data.length
  };

  // Prepare data for charts
  const capacityData = data.map(machine => ({
    name: machine.name,
    used: machine.usedCapacity,
    planned: machine.plannedCapacity,
    available: machine.totalCapacity - machine.usedCapacity - machine.plannedCapacity,
    efficiency: machine.efficiency
  }));

  return (
    <div className="space-y-6">
      {/* Capacity Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card hoverable className="border-l-4 border-l-blue-500">
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Total Capacity</span>
                </Space>
              }
              value={stats.totalCapacity}
              suffix="hrs"
              precision={1}
            />
            <Progress 
              percent={100} 
              status="active" 
              strokeColor="#1890ff"
              size="small"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable className="border-l-4 border-l-green-500">
            <Statistic
              title={
                <Space>
                  <CheckCircleOutlined />
                  <span>Used Capacity</span>
                </Space>
              }
              value={(stats.usedCapacity / stats.totalCapacity) * 100}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={(stats.usedCapacity / stats.totalCapacity) * 100}
              status="success"
              size="small"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable className="border-l-4 border-l-orange-500">
            <Statistic
              title={
                <Space>
                  <ToolOutlined />
                  <span>Planned Capacity</span>
                </Space>
              }
              value={(stats.plannedCapacity / stats.totalCapacity) * 100}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
            <Progress 
              percent={(stats.plannedCapacity / stats.totalCapacity) * 100}
              status="active"
              strokeColor="#faad14"
              size="small"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable className="border-l-4 border-l-red-500">
            <Statistic
              title={
                <Space>
                  <WarningOutlined />
                  <span>Available Capacity</span>
                </Space>
              }
              value={(stats.availableCapacity / stats.totalCapacity) * 100}
              suffix="%"
              precision={1}
              valueStyle={{ color: stats.availableCapacity < 20 ? '#ff4d4f' : '#52c41a' }}
            />
            <Progress 
              percent={(stats.availableCapacity / stats.totalCapacity) * 100}
              status={stats.availableCapacity < 20 ? 'exception' : 'success'}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Capacity Warnings */}
      {stats.availableCapacity < 20 && (
        <Alert
          message="Low Capacity Warning"
          description="Available capacity is below 20%. Consider optimizing schedules or adding capacity."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Row gutter={16}>
        {/* Capacity Distribution Chart */}
        <Col span={16}>
          <Card title="Capacity Distribution by Machine">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="used" stackId="a" name="Used" fill="#1890ff" />
                  <Bar dataKey="planned" stackId="a" name="Planned" fill="#52c41a" />
                  <Bar dataKey="available" stackId="a" name="Available" fill="#d9d9d9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Efficiency Trend */}
        <Col span={8}>
          <Card title="Machine Efficiency">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#1890ff" 
                    name="Efficiency %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CapacityOverview; 