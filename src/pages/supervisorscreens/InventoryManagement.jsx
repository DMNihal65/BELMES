import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const InventoryManagement = () => {
  const [loading, setLoading] = useState(false);

  // Mock data for inventory items
  const inventoryData = [
    {
      key: '1',
      itemId: 'ITEM-001',
      name: 'Raw Material A',
      quantity: 100,
      unit: 'pcs',
      status: 'In Stock',
      location: 'Warehouse A',
      lastUpdated: '2024-01-19',
    },
    {
      key: '2',
      itemId: 'ITEM-002',
      name: 'Component B',
      quantity: 50,
      unit: 'kg',
      status: 'Low Stock',
      location: 'Warehouse B',
      lastUpdated: '2024-01-18',
    },
  ];

  const columns = [
    {
      title: 'Item ID',
      dataIndex: 'itemId',
      key: 'itemId',
      sorter: (a, b) => a.itemId.localeCompare(b.itemId),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'In Stock' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      sorter: (a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated),
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

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-6">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>
            <InboxOutlined /> Inventory 
            Management
          </Title>
        </Col>

        {/* Statistics Cards */}
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={150}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={5}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Stock Items"
              value={145}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={15000}
              prefix="$"
            />
          </Card>
        </Col>

        {/* Inventory Table */}
        <Col span={24}>
          <Card
            title="Inventory Items"
            extra={
              <Space>
                <Input
                  placeholder="Search items"
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Status</Option>
                  <Option value="inStock">In Stock</Option>
                  <Option value="lowStock">Low Stock</Option>
                </Select>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                >
                  Add Item
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={inventoryData}
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
    </div>
  );
};

export default InventoryManagement;