import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Space,
  Typography,
  Select,
  Form,
  Input,
  DatePicker,
  Modal,
  Upload,
  message,
  Tag,
  Tooltip,
  Progress
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { Area } from '@ant-design/charts';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Planning = () => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data for capacity utilization
  const capacityData = [
    { date: '2024-01-01', utilization: 75 },
    { date: '2024-01-02', utilization: 82 },
    { date: '2024-01-03', utilization: 65 },
    { date: '2024-01-04', utilization: 90 },
    { date: '2024-01-05', utilization: 85 },
    { date: '2024-01-06', utilization: 70 },
    { date: '2024-01-07', utilization: 88 },
  ];

  // Area chart configuration
  const areaConfig = {
    data: capacityData,
    xField: 'date',
    yField: 'utilization',
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    line: {
      color: '#1890ff',
    },
    yAxis: {
      label: {
        formatter: (v) => `${v}%`,
      },
    },
    tooltip: {
      formatter: (datum) => {
        return { name: 'Utilization', value: datum.utilization + '%' };
      },
    },
  };

  // Table columns for existing plans
  const columns = [
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      sorter: (a, b) => a.jobId.localeCompare(b.jobId),
    },
    {
      title: 'Part Number',
      dataIndex: 'partNumber',
      key: 'partNumber',
      sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
    },
    {
      title: 'Machine Type',
      dataIndex: 'machineType',
      key: 'machineType',
      filters: [
        { text: 'CNC', value: 'CNC' },
        { text: 'Assembly', value: 'Assembly' },
      ],
      onFilter: (value, record) => record.machineType === value,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: (a, b) => new Date(a.endDate) - new Date(b.endDate),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'Completed' ? 'green' : status === 'In Progress' ? 'blue' : 'orange';
        return (
          <Tag color={color}>
            {status}
          </Tag>
        );
      },
      filters: [
        { text: 'Completed', value: 'Completed' },
        { text: 'In Progress', value: 'In Progress' },
        { text: 'Planned', value: 'Planned' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link">Edit</Button>
          <Button type="link">View</Button>
        </Space>
      ),
    },
  ];

  // Mock data for plans table
  const plansData = [
    {
      key: '1',
      jobId: 'JOB-001',
      partNumber: 'PART-001',
      machineType: 'CNC',
      startDate: '2024-01-19',
      endDate: '2024-01-25',
      status: 'In Progress',
      progress: 45,
    },
    {
      key: '2',
      jobId: 'JOB-002',
      partNumber: 'PART-002',
      machineType: 'Assembly',
      startDate: '2024-01-20',
      endDate: '2024-01-23',
      status: 'Planned',
      progress: 0,
    },
  ];

  const handleNewJob = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        message.success('New job plan created successfully');
        setModalVisible(false);
        setLoading(false);
        form.resetFields();
      }, 1000);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      message.success('Data refreshed successfully');
    }, 1000);
  };

  return (
    <div className="p-6">
      <Row gutter={[16, 16]}>
        {/* Capacity Summary Section */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <AreaChartOutlined />
                <span>Capacity Utilization</span>
              </Space>
            }
            extra={
              <Space>
                <RangePicker />
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <Area {...areaConfig} height={300} />
          </Card>
        </Col>

        {/* Statistics Cards */}
        <Col span={8}>
          <Card>
            <Tooltip title="Jobs currently in progress">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '24px' }} />
                  <span>In Progress</span>
                </Space>
                <Title level={3}>5 Jobs</Title>
              </Space>
            </Tooltip>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Tooltip title="Jobs completed this week">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                  <span>Completed</span>
                </Space>
                <Title level={3}>12 Jobs</Title>
              </Space>
            </Tooltip>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Tooltip title="Jobs planned for next week">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '24px' }} />
                  <span>Planned</span>
                </Space>
                <Title level={3}>8 Jobs</Title>
              </Space>
            </Tooltip>
          </Card>
        </Col>

        {/* Existing Plans Section */}
        <Col span={24}>
          <Card
            title="Existing Plans"
            extra={
              <Space>
                <Input
                  placeholder="Search plans"
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                >
                  New Job Plan
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={plansData}
              loading={loading}
              pagination={{
                total: 100,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* New Job Modal */}
      <Modal
        title="Create New Job Plan"
        open={modalVisible}
        onOk={handleNewJob}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="partNumber"
                label="Part Number"
                rules={[{ required: true, message: 'Please enter part number' }]}
              >
                <Input placeholder="Enter part number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <Input type="number" min={1} placeholder="Enter quantity" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="machineType"
                label="Machine Type"
                rules={[{ required: true, message: 'Please select machine type' }]}
              >
                <Select placeholder="Select machine type">
                  <Option value="CNC">CNC</Option>
                  <Option value="Assembly">Assembly</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="files"
            label="Upload Files"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Planning;