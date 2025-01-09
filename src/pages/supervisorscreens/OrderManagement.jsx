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
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import ReorderableTable from '../../components/OrderManagement/ReorderableTable';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

function OrderManagement() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [parent] = useAutoAnimate();

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

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const columns = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      sorter: (a, b) => a.orderNo.localeCompare(b.orderNo),
      render: (text) => (
        <Button type="link" className="p-0">
          {text}
        </Button>
      ),
    },
    {
      title: 'Part No',
      dataIndex: 'partNo',
      key: 'partNo',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'In Progress' ? 'processing' :
          status === 'Completed' ? 'success' :
          'default'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => (
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-semibold">{rate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
        </Space>
      ),
    },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 p-0 overflow-hidden">
        {/* Quick Stats Row */}
        <Row gutter={[8, 8]} className="mb-2 px-2" ref={parent}>
          <Col span={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="Total Orders"
                  value={orders.length}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="In Progress"
                  value={orders.filter(o => o.status === 'In Progress').length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="Completion Rate"
                  value={75.5}
                  precision={1}
                  prefix={<BarChartOutlined />}
                  suffix="%"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="On-Time Delivery"
                  value={92}
                  precision={1}
                  prefix={<ArrowUpOutlined />}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Main Content Area */}
        <Row gutter={[8, 8]} className="px-2 h-[calc(100vh-160px)]">
          {/* Order List */}
          <Col span={16} className="h-full">
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Order List</span>
                  <Space>
                    <Button icon={<FilterOutlined />} size="small">Filter</Button>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      size="small"
                      onClick={() => setIsModalVisible(true)}
                    >
                      New Order
                    </Button>
                  </Space>
                </div>
              }
              bordered={false}
              className="hover:shadow-lg transition-shadow duration-300 h-full"
              bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)', overflow: 'hidden' }}
            >
              <Tabs defaultActiveKey="all" className="h-full">
                <TabPane tab="All Orders" key="all">
                  <div className="h-full overflow-auto">
                    <Table
                      columns={columns}
                      dataSource={orders}
                      pagination={false}
                      size="small"
                      scroll={{ y: true }}
                      className="h-full"
                    />
                  </div>
                </TabPane>
                <TabPane tab="In Progress" key="in_progress">
                  <div className="h-full overflow-auto">
                    <Table
                      columns={columns}
                      dataSource={orders.filter(order => order.status === 'In Progress')}
                      pagination={false}
                      size="small"
                      scroll={{ y: true }}
                      className="h-full"
                    />
                  </div>
                </TabPane>
                <TabPane tab="Completed" key="completed">
                  <div className="h-full overflow-auto">
                    <Table
                      columns={columns}
                      dataSource={orders.filter(order => order.status === 'Completed')}
                      pagination={false}
                      size="small"
                      scroll={{ y: true }}
                      className="h-full"
                    />
                  </div>
                </TabPane>
                <TabPane tab="Delayed" key="delayed">
                  <div className="h-full overflow-auto">
                    <Table
                      columns={columns}
                      dataSource={orders.filter(order => order.status === 'Delayed')}
                      pagination={false}
                      size="small"
                      scroll={{ y: true }}
                      className="h-full"
                    />
                  </div>
                </TabPane>
                <TabPane tab="Reorder" key="reorder">
                  <div className="h-full overflow-auto">
                    <ReorderableTable 
                      orders={orders} 
                      onOrdersReorder={(newOrders) => {
                        // Handle the reordered list here
                        console.log('Orders reordered:', newOrders);
                        message.success('Order sequence updated successfully');
                      }} 
                    />
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          {/* Order Details and Analytics */}
          <Col span={8} className="h-full">
            <Row gutter={[8, 8]} className="h-full">
              <Col span={24} style={{ height: '50%' }}>
                <Card
                  title={
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Order Analytics</span>
                      <Select defaultValue="month" size="small" style={{ width: 100 }}>
                        <Option value="week">Week</Option>
                        <Option value="month">Month</Option>
                        <Option value="year">Year</Option>
                      </Select>
                    </div>
                  }
                  bordered={false}
                  className="hover:shadow-lg transition-shadow duration-300 h-full"
                  bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)' }}
                >
                </Card>
              </Col>
              <Col span={24} style={{ height: '50%' }}>
                <Card
                  title={
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Recent Activities</span>
                      <Button icon={<ReloadOutlined />} size="small" />
                    </div>
                  }
                  bordered={false}
                  className="hover:shadow-lg transition-shadow duration-300 h-full"
                  bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)', overflow: 'hidden' }}
                >
                  <div className="h-full overflow-auto">
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* New Order Modal */}
      <Modal
        title="Create New Order"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={loading}>
            Create
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="partNo"
            label="Part Number"
            rules={[{ required: true, message: 'Please input the part number!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="customer"
            label="Customer"
            rules={[{ required: true, message: 'Please select the customer!' }]}
          >
            <Select>
              <Option value="aerospace">Aerospace Corp</Option>
              <Option value="defense">Defense Systems</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input the quantity!' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select the start date!' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderManagement;