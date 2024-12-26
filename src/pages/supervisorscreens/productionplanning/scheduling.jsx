import React, { useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Form,
  Modal,
  Typography,
  Divider
} from 'antd';
import {
  ScheduleOutlined,
  SyncOutlined,
  SearchOutlined,
  HistoryOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const Scheduling = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Mock data for Gantt-style visualization
  const scheduleData = [
    { date: '2024-01-19', machine: 'Machine 1', job: 'Job 001', value: 1 },
    { date: '2024-01-20', machine: 'Machine 1', job: 'Job 001', value: 1 },
    { date: '2024-01-21', machine: 'Machine 2', job: 'Job 002', value: 1 },
    { date: '2024-01-22', machine: 'Machine 2', job: 'Job 002', value: 1 },
    { date: '2024-01-23', machine: 'Machine 3', job: 'Job 003', value: 1 },
  ];

  // Chart configuration
  const chartConfig = {
    data: scheduleData,
    xField: 'date',
    yField: 'machine',
    seriesField: 'job',
    stepType: 'vh',
    xAxis: {
      type: 'time',
      tickCount: 5,
      label: {
        style: {
          fill: '#666',
          fontSize: 12,
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: '#666',
          fontSize: 12,
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
    },
    animation: {
      appear: {
        animation: 'fade-in',
        duration: 500,
      },
    },
    legend: {
      position: 'top-right',
      itemName: {
        style: {
          fill: '#666',
          fontSize: 12,
        },
      },
    },
    tooltip: {
      showMarkers: false,
      shared: true,
      domStyles: {
        'g2-tooltip': {
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          padding: '8px 12px',
          border: '1px solid #f0f0f0',
        },
      },
    },
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
  };

  // Schedule history columns
  const historyColumns = [
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Previous Start',
      dataIndex: 'previousStart',
      key: 'previousStart',
      render: (text) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          {text}
        </Space>
      ),
    },
    {
      title: 'Updated Start',
      dataIndex: 'updatedStart',
      key: 'updatedStart',
      render: (text) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          {text}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Updated' ? 'success' : 'warning'} style={{ borderRadius: '12px', padding: '0 12px' }}>
          {status}
        </Tag>
      ),
    },
  ];

  // Mock data for history
  const historyData = [
    {
      key: '1',
      jobId: 'JOB-001',
      previousStart: '2024-01-18 09:00',
      updatedStart: '2024-01-19 09:00',
      status: 'Updated',
    },
    {
      key: '2',
      jobId: 'JOB-002',
      previousStart: '2024-01-19 14:00',
      updatedStart: '2024-01-20 14:00',
      status: 'Pending',
    },
  ];

  const handleGenerateSchedule = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Modal.success({
        title: 'Schedule Generated',
        content: 'New schedule has been generated successfully.',
        className: 'custom-modal',
      });
    }, 1500);
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Sider width={300} theme="light" className="p-6 shadow-sm" style={{ background: '#fff' }}>
        <div className="flex items-center space-x-2 mb-6">
          <ScheduleOutlined className="text-xl text-blue-500" />
          <Title level={4} style={{ margin: 0 }}>Production Scheduling</Title>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <Form
          form={form}
          layout="vertical"
          className="scheduling-form"
        >
          <Form.Item 
            label={<Text strong>Machine ID</Text>}
            className="mb-4"
          >
            <Select
              placeholder="Select Machine"
              className="w-full"
              size="large"
            >
              <Option value="m1">Machine 1</Option>
              <Option value="m2">Machine 2</Option>
              <Option value="m3">Machine 3</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            label={<Text strong>Job ID</Text>}
            className="mb-4"
          >
            <Select
              placeholder="Select Job"
              className="w-full"
              size="large"
            >
              <Option value="j1">JOB-001</Option>
              <Option value="j2">JOB-002</Option>
              <Option value="j3">JOB-003</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            label={<Text strong>Part No.</Text>}
            className="mb-4"
          >
            <Input 
              placeholder="Enter Part Number"
              size="large"
            />
          </Form.Item>
          <Form.Item 
            label={<Text strong>Date Range</Text>}
            className="mb-6"
          >
            <DatePicker.RangePicker 
              className="w-full"
              size="large"
            />
          </Form.Item>
          <Button 
            type="primary" 
            size="large"
            block
            onClick={handleGenerateSchedule}
            loading={loading}
            className="scheduling-button"
            style={{
              height: '48px',
              fontSize: '16px',
              background: '#1890ff',
              borderRadius: '8px',
              boxShadow: '0 2px 0 rgba(0,0,0,0.045)',
            }}
          >
            Generate Schedule
          </Button>
        </Form>
      </Sider>
      
      <Content className="p-8">
        <Row gutter={[24, 24]}>
          {/* Gantt Chart Section */}
          <Col span={24}>
            <Card
              className="shadow-sm hover:shadow-md transition-shadow"
              style={{ borderRadius: '12px' }}
              title={
                <Space size="middle">
                  <BarChartOutlined className="text-xl text-blue-500" />
                  <Text strong style={{ fontSize: '16px' }}>Schedule Visualization</Text>
                </Space>
              }
              extra={
                <Space>
                  <Button 
                    type="default"
                    icon={<SyncOutlined />}
                    onClick={() => setLoading(true)}
                    size="large"
                    className="flex items-center"
                  >
                    Refresh
                  </Button>
                </Space>
              }
              bodyStyle={{ padding: '24px' }}
            >
              <Line {...chartConfig} height={400} />
            </Card>
          </Col>

          {/* Schedule History */}
          <Col span={24}>
            <Card
              className="shadow-sm hover:shadow-md transition-shadow"
              style={{ borderRadius: '12px' }}
              title={
                <Space size="middle">
                  <HistoryOutlined className="text-xl text-blue-500" />
                  <Text strong style={{ fontSize: '16px' }}>Schedule History</Text>
                </Space>
              }
              extra={
                <Input
                  placeholder="Search history"
                  prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                  style={{ width: 250 }}
                  size="large"
                  className="search-input"
                />
              }
              bodyStyle={{ padding: '24px' }}
            >
              <Table
                columns={historyColumns}
                dataSource={historyData}
                pagination={false}
                className="custom-table"
              />
            </Card>
          </Col>
        </Row>
      </Content>

      <style jsx global>{`
        .scheduling-form .ant-form-item-label > label {
          font-size: 14px;
        }
        
        .custom-table .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
        }
        
        .search-input .ant-input-prefix {
          margin-right: 8px;
        }
        
        .custom-modal .ant-modal-content {
          border-radius: 12px;
        }
        
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        
        .ant-card-body {
          padding: 24px;
        }
      `}</style>
    </Layout>
  );
};

export default Scheduling;