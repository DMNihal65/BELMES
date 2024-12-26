import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Input, Select, Typography, Space, Modal, Form, Badge, Row, Col, Statistic } from 'antd';
import { SearchOutlined, ToolOutlined, FilterOutlined, InboxOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

function Inventory() {
  const navigate = useNavigate();
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form] = Form.useForm();

  const toolsData = [
    {
      key: '1',
      toolName: 'Hydraulic Jack',
      toolId: '1',
      quantity: 18,
      location: 'Cabinet 1',
      lastUpdated: '2024/12/15',
      status: 'Available'
    },
    {
      key: '2',
      toolName: 'T-2',
      toolId: '2',
      quantity: 45,
      location: 'Cabinet 2',
      lastUpdated: '2024/11/15',
      status: 'Low Stock'
    },
    {
      key: '3',
      toolName: 'T-3',
      toolId: '3',
      quantity: 36,
      location: 'Cabinet 3',
      lastUpdated: '2024/11/15',
      status: 'Available'
    },
  ];

  // Filter tools based on search text and status
  const filteredTools = useMemo(() => {
    return toolsData.filter(tool => {
      const matchesSearch = 
        tool.toolName.toLowerCase().includes(searchText.toLowerCase()) ||
        tool.toolId.toLowerCase().includes(searchText.toLowerCase()) ||
        tool.location.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'available' && tool.status === 'Available') ||
        (statusFilter === 'low' && tool.status === 'Low Stock');

      return matchesSearch && matchesStatus;
    });
  }, [toolsData, searchText, statusFilter]);

  // Calculate statistics based on filtered data
  const totalTools = filteredTools.reduce((acc, curr) => acc + curr.quantity, 0);
  const lowStockItems = filteredTools.filter(tool => tool.status === 'Low Stock').length;
  const availableItems = filteredTools.filter(tool => tool.status === 'Available').length;

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const columns = [
    {
      title: 'Tool Name',
      dataIndex: 'toolName',
      key: 'toolName',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Tool ID',
      dataIndex: 'toolId',
      key: 'toolId',
      width: 100,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity) => (
        <Text type={quantity < 20 ? 'warning' : 'success'}>
          {quantity}
        </Text>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Badge 
          status={status === 'Available' ? 'success' : 'warning'} 
          text={status}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => showRequestModal(record)}
          size="small"
          className="hover:scale-105 transition-transform"
        >
          Request
        </Button>
      ),
    },
  ];

  const showRequestModal = (tool) => {
    setSelectedTool(tool);
    setIsRequestModalVisible(true);
    form.setFieldsValue({
      toolName: tool.toolName,
      toolId: tool.toolId,
      quantity: 1,
    });
  };

  const handleRequestSubmit = () => {
    form.validateFields().then(values => {
      console.log('Request submitted:', values);
      setIsRequestModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm gap-4">
          <div>
            <Title level={4} style={{ margin: 0 }}>Inventory Management</Title>
            <Text type="secondary">Track and manage your tools inventory</Text>
          </div>
          <Space size="large" className="flex-wrap">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Search tools..."
              style={{ width: 200 }}
              className="rounded-lg"
              value={searchText}
              onChange={handleSearch}
              allowClear
            />
            <Select
              placeholder="Select Status"
              style={{ width: 150 }}
              className="rounded-lg"
              value={statusFilter}
              onChange={handleStatusChange}
              options={[
                { value: 'all', label: 'All Tools' },
                { value: 'available', label: 'Available' },
                { value: 'low', label: 'Low Stock' },
              ]}
            />
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={8}>
            <Card bordered={false} className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="Total Tools"
                value={totalTools}
                prefix={<InboxOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="Low Stock Items"
                value={lowStockItems}
                prefix={<WarningOutlined className="text-yellow-500" />}
                valueStyle={{ color: lowStockItems > 0 ? '#faad14' : undefined }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="Available Items"
                value={availableItems}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tools Table */}
        <Card 
          title={<Title level={5} style={{ margin: 0 }}>Tools Inventory</Title>}
          className="mb-6 rounded-lg shadow-sm"
          extra={
            <Text type="secondary">
              Showing {filteredTools.length} items
            </Text>
          }
        >
          <Table 
            columns={columns} 
            dataSource={filteredTools}
            pagination={{ 
              pageSize: 10,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
            className="rounded-lg"
            scroll={{ x: 'max-content' }}
          />
        </Card>

        {/* Request Tool Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <ToolOutlined className="text-blue-500" />
              <span>Request Tool</span>
            </div>
          }
          open={isRequestModalVisible}
          onCancel={() => setIsRequestModalVisible(false)}
          footer={null}
          className="rounded-lg"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRequestSubmit}
          >
            <Form.Item
              name="toolName"
              label="Tool Name"
            >
              <Input disabled className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="toolId"
              label="Tool ID"
            >
              <Input disabled className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <Input type="number" min={1} className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="remarks"
              label="Remarks"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="Additional remarks..." 
                className="rounded-lg"
              />
            </Form.Item>
            <Form.Item className="mb-0 flex justify-end gap-2">
              <Button 
                onClick={() => setIsRequestModalVisible(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                className="rounded-lg hover:scale-105 transition-transform"
              >
                Submit Request
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default Inventory;