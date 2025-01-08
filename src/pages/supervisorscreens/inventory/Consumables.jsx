// src/pages/supervisorscreens/inventory/Consumables.jsx
import React from 'react';
import { Table, Card, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const Consumables = () => {
  const consumablesData = [
    {
      key: '1',
      name: 'Safety Gloves',
      category: 'PPE',
      quantity: 200,
      unit: 'pairs',
      reorderLevel: 50,
      status: 'Sufficient',
      supplier: 'Safety Equipment Co',
      lastOrder: '2024-01-01'
    },
    // Add more mock data as needed
  ];

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => `${quantity} ${record.unit}`,
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      render: (level, record) => `${level} ${record.unit}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Sufficient' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Last Order',
      dataIndex: 'lastOrder',
      key: 'lastOrder',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" />
          <Button icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card title="Consumables Inventory">
        <Table 
          columns={columns} 
          dataSource={consumablesData} 
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default Consumables;