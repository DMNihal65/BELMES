import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Progress, Space, Tag, 
  DatePicker, Select, Button, Statistic, Alert,
  Typography, Empty, Divider
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend, AreaChart, Area
} from 'recharts';
import { 
  ClockCircleOutlined, ToolOutlined, 
  AlertOutlined, CheckCircleOutlined,
  FilterOutlined, ReloadOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const ResourceUtilization = ({ machines = [], selectedJob = null }) => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFilter = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setDateRange(null);
    setSelectedMachine(null);
  };

  // Stats cards data
  const stats = {
    totalCapacity: machines.reduce((acc, m) => acc + (m.totalCapacity || 0), 0),
    usedCapacity: machines.reduce((acc, m) => acc + (m.usedCapacity || 0), 0),
    plannedCapacity: machines.reduce((acc, m) => acc + (m.plannedCapacity || 0), 0),
    averageEfficiency: machines.length ? Math.round(
      machines.reduce((acc, m) => acc + (m.efficiency || 0), 0) / machines.length
    ) : 0
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-sm">
        <Space size="large" wrap className="flex justify-between">
          <Space size="large" wrap>
            <RangePicker 
              onChange={setDateRange}
              value={dateRange}
              placeholder={['Start Date', 'End Date']}
              className="w-64"
            />
            <Select
              placeholder="Select Machine"
              style={{ width: 200 }}
              onChange={setSelectedMachine}
              value={selectedMachine}
              allowClear
            >
              {machines.map(machine => (
                <Select.Option key={machine.id} value={machine.id}>
                  {machine.name}
                </Select.Option>
              ))}
            </Select>
            <Space>
              <Button 
                type="primary" 
                icon={<FilterOutlined />}
                onClick={handleFilter}
                loading={loading}
              >
                Apply Filters
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Space>
          </Space>
          
          <Button 
            type="primary"
            size="large"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/supervisor/production-planning/scheduling')}
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            Open Scheduler
          </Button>
        </Space>
      </Card>

      {/* Stats Overview */}
      <Row gutter={[8, 8]}>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} className="shadow-sm rounded-lg" size="small">
            <Statistic
              title={
                <Space size={4}>
                  <ClockCircleOutlined className="text-blue-500" />
                  <Text strong className="text-sm">Total Capacity</Text>
                </Space>
              }
              value={`${stats.totalCapacity}h`}
              valueStyle={{ fontSize: '20px' }}
            />
            <Progress percent={100} showInfo={false} strokeColor="#1890ff" size="small" className="mt-1" />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} className="shadow-sm rounded-lg" size="small">
            <Statistic
              title={
                <Space size={4}>
                  <ToolOutlined className="text-blue-500" />
                  <Text strong className="text-sm">Used Capacity</Text>
                </Space>
              }
              value={`${stats.usedCapacity}h`}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
            />
            <Progress 
              percent={(stats.usedCapacity / stats.totalCapacity) * 100} 
              strokeColor="#1890ff"
              size="small"
              className="mt-1" 
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} className="shadow-sm rounded-lg" size="small">
            <Statistic
              title={
                <Space size={4}>
                  <AlertOutlined className="text-orange-500" />
                  <Text strong className="text-sm">Planned Capacity</Text>
                </Space>
              }
              value={`${stats.plannedCapacity}h`}
              valueStyle={{ color: '#faad14', fontSize: '20px' }}
            />
            <Progress 
              percent={(stats.plannedCapacity / stats.totalCapacity) * 100} 
              strokeColor="#faad14"
              size="small"
              className="mt-1" 
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} className="shadow-sm rounded-lg" size="small">
            <Statistic
              title={
                <Space size={4}>
                  <CheckCircleOutlined className="text-green-500" />
                  <Text strong className="text-sm">Efficiency</Text>
                </Space>
              }
              value={stats.averageEfficiency}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
            <Progress 
              percent={stats.averageEfficiency} 
              strokeColor="#52c41a"
              size="small"
              className="mt-1" 
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm rounded-lg" size="small">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex-1">
            <Title level={5} className="mb-1">Resource Management</Title>
            <div className="flex flex-wrap gap-4 items-center">
              <RangePicker 
                onChange={setDateRange}
                value={dateRange}
                placeholder={['Start Date', 'End Date']}
                size="small"
              />
              <Select
                placeholder="Select Machine"
                style={{ width: 180 }}
                onChange={setSelectedMachine}
                value={selectedMachine}
                allowClear
                size="small"
              >
                {machines.map(machine => (
                  <Select.Option key={machine.id} value={machine.id}>
                    {machine.name}
                  </Select.Option>
                ))}
              </Select>
              <Button 
                type="primary" 
                icon={<FilterOutlined />}
                onClick={handleFilter}
                loading={loading}
                size="small"
              >
                Apply
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleReset}
                size="small"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {/* Charts Section */}
      <Card 
        className="shadow-sm rounded-lg"
        size="small"
        title={
          <div className="flex justify-between items-center">
            <Space size={4}>
              <DashboardOutlined className="text-blue-500" />
              <Text strong>Machine Utilization</Text>
            </Space>
            <Tag color="blue" className="text-xs">Last 7 Days</Tag>
          </div>
        }
        bodyStyle={{ padding: '12px' }}
      >
        {machines.length > 0 ? (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={machines}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                barSize={25}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  height={20}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  contentStyle={{ 
                    background: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}
                />
                <Legend 
                  verticalAlign="top"
                  height={20}
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar 
                  dataKey="usedCapacity" 
                  stackId="a" 
                  fill="#1890ff" 
                  name="Used"
                  radius={[2, 2, 0, 0]} 
                />
                <Bar 
                  dataKey="plannedCapacity" 
                  stackId="a" 
                  fill="#faad14" 
                  name="Planned"
                  radius={[2, 2, 0, 0]} 
                />
                <Bar 
                  dataKey={(data) => (data.totalCapacity || 0) - (data.usedCapacity || 0) - (data.plannedCapacity || 0)} 
                  stackId="a" 
                  fill="#52c41a" 
                  name="Available"
                  radius={[2, 2, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty 
            description="No machine data available" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* Machine Details Table */}
      {/* <Card 
        title={<Title level={5}>Machine Details</Title>}
        className="shadow-sm"
      >
        <Table 
          columns={columns} 
          dataSource={machines}
          pagination={false}
          scroll={{ x: 1000 }}
          loading={loading}
          rowKey="id"
        />
      </Card> */}

      {/* Selected Job Alert if applicable */}
      {selectedJob && selectedJob.machineTypes && (
        <Alert
          message={
            <div className="flex justify-between items-center">
              <Space size={4}>
                <ToolOutlined className="text-blue-500" />
                <Text strong className="text-sm">Job Requirements</Text>
              </Space>
              <Space>
                {selectedJob.machineTypes.map(type => (
                  <Tag key={type} color="blue" className="text-xs">{type}</Tag>
                ))}
                <Tag color="green" className="text-xs">
                  {(selectedJob.cycleTime || 0) + (selectedJob.setupTime || 0)} min
                </Tag>
              </Space>
            </div>
          }
          type="info"
          showIcon={false}
          className="shadow-sm rounded-lg border-blue-100"
        />
      )}
    </div>
  );
};

export default ResourceUtilization;