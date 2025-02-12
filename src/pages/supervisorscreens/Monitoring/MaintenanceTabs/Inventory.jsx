import React from 'react';
import { Table, Card, Button, Tag, Space, Progress } from 'antd';
import { PlusOutlined, WarningOutlined } from '@ant-design/icons';

const SparePartsInventory = () => {
  const columns = [
    {
      title: 'Part ID',
      dataIndex: 'partId',
      key: 'partId',
    },
    {
      title: 'Part Name',
      dataIndex: 'partName',
      key: 'partName',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Stock Level',
      dataIndex: 'stockLevel',
      key: 'stockLevel',
      render: (stockLevel, record) => (
        <Progress 
          percent={(stockLevel / record.maxStock) * 100}
          size="small"
          status={stockLevel <= record.minStock ? "exception" : "normal"}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const status = record.stockLevel <= record.minStock ? 'Low Stock' : 'In Stock';
        return (
          <Tag color={record.stockLevel <= record.minStock ? 'red' : 'green'}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Last Restocked',
      dataIndex: 'lastRestocked',
      key: 'lastRestocked',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small">Reorder</Button>
          <Button size="small">History</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      partId: 'SP001',
      partName: 'Hydraulic Filter',
      category: 'Filters',
      stockLevel: 5,
      minStock: 10,
      maxStock: 50,
      lastRestocked: '2024-02-01',
    },
    // Add more spare parts
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button type="primary" icon={<PlusOutlined />}>
          Add New Part
        </Button>
      </div>
      <Card>
        <Table 
          columns={columns} 
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default SparePartsInventory; 