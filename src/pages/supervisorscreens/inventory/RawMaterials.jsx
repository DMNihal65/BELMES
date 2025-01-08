// src/pages/supervisorscreens/inventory/RawMaterials.jsx
import React from 'react';
import { Table, Card, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const RawMaterials = () => {
  const materialsData = [
    {
      key: '1',
      name: 'Steel Grade 304',
      type: 'Stainless Steel',
      quantity: '500',
      unit: 'kg',
      reorderLevel: '100',
      status: 'Sufficient',
      supplier: 'Steel Corp Ltd',
      location: 'Warehouse A'
    },
    // Add more mock data as needed
  ];

  const columns = [
    {
      title: 'Material Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
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
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
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
      <Card title="Raw Materials Inventory">
        <Table 
          columns={columns} 
          dataSource={materialsData} 
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default RawMaterials;