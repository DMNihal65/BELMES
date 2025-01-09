import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Switch,
  Button,
  Select,
  Typography,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  ReloadOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';

const { Title, Text } = Typography;
const { Option } = Select;

const ProductionMonitoring = () => {
  const [loading, setLoading] = useState(false);

  // Mock data for statistics
  const stats = {
    completedJobs: 24,
    completedJobsPercent: 15,
    pendingJobs: 6,
    pendingJobsPercent: -8,
    oee: 85,
    oeePercent: 5,
    rejectedJobs: 2,
    rejectedJobsPercent: -20,
    operatorEfficiency: 92,
    operatorEfficiencyPercent: 10
  };

  // Mock data for charts
  const productionData = [
    { date: '2024-01-15', planned: 100, actual: 85 },
    { date: '2024-01-16', planned: 120, actual: 110 },
    { date: '2024-01-17', planned: 90, actual: 95 },
    { date: '2024-01-18', planned: 110, actual: 105 },
    { date: '2024-01-19', planned: 100, actual: 98 },
  ];

  const completionData = [
    { type: 'Completed', value: 75 },
    { type: 'Assigned', value: 25 },
  ];

  const machineUtilization = [
    { type: 'Utilized', value: 85 },
    { type: 'Idle', value: 15 },
  ];

  // Active jobs table columns
  const columns = [
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Machine ID',
      dataIndex: 'machineId',
      key: 'machineId',
      render: (text) => (
        <Tag color="blue" style={{ padding: '4px 8px', borderRadius: '4px' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Operator',
      dataIndex: 'operator',
      key: 'operator',
      render: (text) => (
        <Space>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {text.split(' ').map(word => word[0]).join('')}
          </div>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Completion',
      dataIndex: 'completion',
      key: 'completion',
      render: (value) => (
        <Progress
          percent={value}
          size="small"
          strokeColor={{
            from: '#108ee9',
            to: '#87d068',
          }}
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        if (status === 'In Progress') {
          color = 'processing';
          icon = <ClockCircleOutlined />;
        }
        if (status === 'Completed') {
          color = 'success';
          icon = <CheckCircleOutlined />;
        }
        if (status === 'On Hold') {
          color = 'warning';
          icon = <ClockCircleOutlined />;
        }
        return (
          <Tag color={color} style={{ padding: '4px 8px', borderRadius: '12px' }}>
            <Space>
              {icon}
              {status}
            </Space>
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" ghost>
            View Details
          </Button>
          <Button type="default" size="small">
            Update
          </Button>
        </Space>
      ),
    },
  ];

  // Mock data for active jobs
  const activeJobs = [
    {
      key: '1',
      jobId: 'JOB-001',
      machineId: 'MCH-01',
      operator: 'John Doe',
      completion: 75,
      status: 'In Progress',
    },
    {
      key: '2',
      jobId: 'JOB-002',
      machineId: 'MCH-02',
      operator: 'Jane Smith',
      completion: 45,
      status: 'On Hold',
    },
  ];

  // Chart configurations
  const productionChartConfig = {
    data: productionData,
    xField: 'date',
    yField: ['planned', 'actual'],
    seriesField: 'type',
    legend: {
      position: 'top',
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#1890ff', '#52c41a'],
  };

  const pieConfig = {
    data: completionData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    legend: {
      position: 'bottom',
    },
    color: ['#52c41a', '#1890ff'],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '24px',
          fontWeight: 600,
        },
        content: '75%',
      },
    },
  };

  const utilizationConfig = {
    data: machineUtilization,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    legend: {
      position: 'bottom',
    },
    color: ['#52c41a', '#f5f5f5'],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '24px',
          fontWeight: 600,
        },
        content: '85%',
      },
    },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Completed Jobs</Text>}
              value={stats.completedJobs}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              suffix={
                <span className={stats.completedJobsPercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.completedJobsPercent}%
                  {stats.completedJobsPercent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Pending Jobs</Text>}
              value={stats.pendingJobs}
              prefix={<ClockCircleOutlined className="text-yellow-500" />}
              suffix={
                <span className={stats.pendingJobsPercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.pendingJobsPercent}%
                  {stats.pendingJobsPercent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>OEE</Text>}
              value={stats.oee}
              prefix={<BarChartOutlined className="text-blue-500" />}
              suffix={
                <span className={stats.oeePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.oeePercent}%
                  {stats.oeePercent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Rejected Jobs</Text>}
              value={stats.rejectedJobs}
              prefix={<ClockCircleOutlined className="text-red-500" />}
              suffix={
                <span className={stats.rejectedJobsPercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.rejectedJobsPercent}%
                  {stats.rejectedJobsPercent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title={<Text strong>Operator Efficiency</Text>}
              value={stats.operatorEfficiency}
              prefix={<BarChartOutlined className="text-purple-500" />}
              suffix={
                <span className={stats.operatorEfficiencyPercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.operatorEfficiencyPercent}%
                  {stats.operatorEfficiencyPercent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <LineChartOutlined className="text-blue-500" />
                <Text strong>Planned vs Actual Production</Text>
              </Space>
            }
            bordered={false}
            className="hover:shadow-md transition-shadow"
          >
            <Line {...productionChartConfig} height={200} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <PieChartOutlined className="text-green-500" />
                <Text strong>Completed vs Assigned Jobs</Text>
              </Space>
            }
            bordered={false}
            className="hover:shadow-md transition-shadow"
          >
            <Pie {...pieConfig} height={200} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <PieChartOutlined className="text-purple-500" />
                <Text strong>Machine Utilization</Text>
              </Space>
            }
            bordered={false}
            className="hover:shadow-md transition-shadow"
          >
            <Pie {...utilizationConfig} height={200} />
          </Card>
        </Col>
      </Row>

      {/* Active Jobs Table */}
      <Card
        title={
          <Space>
            <BarChartOutlined className="text-blue-500" />
            <Text strong>Active Jobs</Text>
          </Space>
        }
        extra={
          <Space>
            <Select
              defaultValue="all"
              style={{ width: 140 }}
              placeholder="Filter by status"
              size="middle"
              className="rounded-lg"
            >
              <Option value="all">All Status</Option>
              <Option value="progress">In Progress</Option>
              <Option value="hold">On Hold</Option>
              <Option value="completed">Completed</Option>
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => setLoading(true)}
              className="flex items-center"
              ghost
            >
              Refresh
            </Button>
          </Space>
        }
        bordered={false}
        className="hover:shadow-md transition-shadow"
      >
        <Table
          columns={columns}
          dataSource={activeJobs}
          loading={loading}
          pagination={{
            total: activeJobs.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          className="custom-table"
        />
      </Card>

      <style jsx global>{`
        .ant-card {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
          min-height: auto;
        }
        
        .ant-card-head-title {
          padding: 0;
        }
        
        .ant-card-body {
          padding: 24px;
        }
        
        .ant-statistic-title {
          color: #8c8c8c;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .ant-statistic-content {
          font-size: 24px;
          font-weight: 600;
          color: #262626;
        }
        
        .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
        }
        
        .ant-table-tbody > tr > td {
          padding: 16px 24px;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: #f5f5f5;
        }
        
        .ant-progress-bg {
          transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        }
        
        .ant-tag {
          border: none;
          padding: 4px 8px;
          font-weight: 500;
        }
        
        .ant-btn {
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .ant-select {
          border-radius: 6px;
        }
        
        .ant-select-selector {
          border-radius: 6px !important;
        }
      `}</style>
    </div>
  );
};

export default ProductionMonitoring;