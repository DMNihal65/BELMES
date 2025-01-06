import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Table, Progress, Space, Tag, 
  DatePicker, Select, Button, Statistic, Alert,
  Typography, Empty
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend
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
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setDateRange(null);
    setSelectedMachine(null);
  };

  // Machine utilization table columns
  const columns = [
    {
      title: 'Machine',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          <Tag color={record.status === 'available' ? 'green' : 'orange'}>
            {record.status}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Current Job',
      dataIndex: 'currentJob',
      key: 'currentJob',
      width: 200,
      render: (job) => job ? (
        <Space direction="vertical" size="small">
          <Text>{job.partNumber}</Text>
          <Progress 
            percent={Math.round((job.completed / job.quantity) * 100)} 
            size="small"
            status={job.completed === job.quantity ? 'success' : 'active'}
          />
        </Space>
      ) : <Text type="secondary">No active job</Text>
    },
    {
      title: 'Utilization',
      key: 'utilization',
      width: 250,
      render: (_, record) => {
        const used = record.usedCapacity || 0;
        const planned = record.plannedCapacity || 0;
        const total = record.totalCapacity || 0;
        const available = total - used - planned;
        
        return (
          <Space direction="vertical" size="small" className="w-full">
            <Progress
              percent={100}
              success={{ percent: (used / total) * 100 }}
              trailColor="#ffd591"
              strokeColor="#1890ff"
              showInfo={false}
            />
            <Space className="text-xs" wrap>
              <Tag color="blue">{`Used: ${used}h`}</Tag>
              <Tag color="orange">{`Planned: ${planned}h`}</Tag>
              <Tag color="green">{`Available: ${available}h`}</Tag>
            </Space>
          </Space>
        );
      }
    },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      width: 120,
      render: (value = 0) => (
        <Progress 
          type="circle" 
          percent={value} 
          width={50}
          format={(percent) => `${percent}%`}
          status={value >= 80 ? 'success' : value >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: 'Next Maintenance',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
      width: 150,
      render: (value) => value ? (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          {value}
        </Tag>
      ) : (
        <Tag color="success">No scheduled maintenance</Tag>
      )
    }
  ];

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
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Total Capacity</Text>}
              value={`${stats.totalCapacity}h`}
              prefix={<ClockCircleOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Used Capacity</Text>}
              value={`${stats.usedCapacity}h`}
              prefix={<ToolOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Planned Capacity</Text>}
              value={`${stats.plannedCapacity}h`}
              prefix={<AlertOutlined className="text-orange-500" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Average Efficiency</Text>}
              value={stats.averageEfficiency}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Utilization Chart */}
      <Card 
        title={<Title level={5}>Machine Utilization Overview</Title>}
        className="shadow-sm"
      >
        {machines.length > 0 ? (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={machines}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="usedCapacity" stackId="a" fill="#1890ff" name="Used" />
                <Bar dataKey="plannedCapacity" stackId="a" fill="#faad14" name="Planned" />
                <Bar 
                  dataKey={(data) => (data.totalCapacity || 0) - (data.usedCapacity || 0) - (data.plannedCapacity || 0)} 
                  stackId="a" 
                  fill="#52c41a" 
                  name="Available" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty description="No machine data available" />
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
          message="Selected Job Resource Requirements"
          description={
            <Space direction="vertical">
              <Text>Required Machine Types: {selectedJob.machineTypes.join(', ')}</Text>
              <Text>Estimated Total Time: {(selectedJob.cycleTime || 0) + (selectedJob.setupTime || 0)} minutes</Text>
            </Space>
          }
          type="info"
          showIcon
          className="shadow-sm"
        />
      )}
    </div>
  );
};

export default ResourceUtilization; 