import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Modal, 
  Form,
  Input,
  DatePicker,
  Space,
  Typography,
  Statistic,
  Tabs,
  Badge,
  Tag,
  Tooltip,
  Select,
  Divider,
  message
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

function OrderManagement() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  // Mock data for orders
  const orders = [
    {
      key: '1',
      orderNo: 'ORD-2024-001',
      partNo: 'PART-A123',
      startDate: '2024-01-15',
      status: 'In Progress',
      priority: 'High',
      customer: 'Aerospace Corp',
      quantity: 100,
      completionRate: 75
    },
    {
      key: '2',
      orderNo: 'ORD-2024-002',
      partNo: 'PART-B456',
      startDate: '2024-01-16',
      status: 'Pending',
      priority: 'Medium',
      customer: 'Defense Systems',
      quantity: 50,
      completionRate: 0
    }
  ];

  const columns = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      sorter: (a, b) => a.orderNo.localeCompare(b.orderNo),
      render: (text) => (
        <Button type="link" className="p-0" onClick={() => handleView({ orderNo: text })}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Part No',
      dataIndex: 'partNo',
      key: 'partNo',
      sorter: (a, b) => a.partNo.localeCompare(b.partNo),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Completed': 'success',
          'In Progress': 'processing',
          'Pending': 'warning',
          'Delayed': 'error'
        };
        return <Badge status={colors[status]} text={status} />;
      },
      filters: [
        { text: 'Completed', value: 'Completed' },
        { text: 'In Progress', value: 'In Progress' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Delayed', value: 'Delayed' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colors = {
          'High': 'red',
          'Medium': 'orange',
          'Low': 'green'
        };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      },
      filters: [
        { text: 'High', value: 'High' },
        { text: 'Medium', value: 'Medium' },
        { text: 'Low', value: 'Low' }
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit Order">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Order">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    }
  ];

  const handleNewOrder = () => {
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    message.info(`Editing order ${record.orderNo}`);
  };

  const handleView = (record) => {
    message.info(`Viewing order ${record.orderNo}`);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Order',
      content: `Are you sure you want to delete order ${record.orderNo}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        message.success(`Order ${record.orderNo} deleted successfully`);
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
      message.success('Order created successfully');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Data refreshed');
    }, 1000);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div className="p-6">
      {/* Header Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card hoverable className="hover:shadow-md transition-shadow">
            <Statistic
              title={
                <Space>
                  <FileTextOutlined className="text-blue-500" />
                  <Text>Total Orders</Text>
                </Space>
              }
              value={156}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable className="hover:shadow-md transition-shadow">
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined className="text-orange-500" />
                  <Text>In Progress</Text>
                </Space>
              }
              value={42}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable className="hover:shadow-md transition-shadow">
            <Statistic
              title={
                <Space>
                  <BarChartOutlined className="text-green-500" />
                  <Text>Completion Rate</Text>
                </Space>
              }
              value={85}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Orders Management</span>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Refresh Data">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              />
            </Tooltip>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleNewOrder}
            >
              New Order
            </Button>
          </Space>
        }
        className="shadow-sm"
      >
        <div className="mb-4">
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Input
                placeholder="Search orders..."
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={16}>
              <Space>
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Status</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="in-progress">In Progress</Option>
                  <Option value="pending">Pending</Option>
                </Select>
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Priority</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
                <Button icon={<FilterOutlined />}>More Filters</Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table 
          columns={columns} 
          dataSource={orders}
          rowSelection={rowSelection}
          loading={loading}
          pagination={{ 
            total: orders.length,
            pageSize: 10,
            showTotal: (total) => `Total ${total} orders`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
        />
      </Card>

      {/* New Order Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>Create New Order</span>
          </Space>
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderNo"
                label="Order Number"
                rules={[{ required: true, message: 'Please enter order number' }]}
              >
                <Input placeholder="Enter order number" prefix={<FileTextOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="partNo"
                label="Part Number"
                rules={[{ required: true, message: 'Please enter part number' }]}
              >
                <Input placeholder="Enter part number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <Input type="number" placeholder="Enter quantity" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer"
                label="Customer"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} placeholder="Enter order description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderManagement;