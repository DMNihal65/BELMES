import React from 'react';
import { Table, Card, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const Tools = () => {
  const toolsData = [
    {
      key: '1',
      name: 'Cutting Tool A23',
      category: 'Cutting Tools',
      quantity: 15,
      status: 'In Stock',
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-02-15',
      location: 'Section A-12'
    },
    // Add more mock data as needed
  ];

  const columns = [
    {
      title: 'Tool Name',
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
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'In Stock' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
    },
    {
      title: 'Next Maintenance',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
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
      <Card title="Tools Inventory">
        <Table 
          columns={columns} 
          dataSource={toolsData} 
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default Tools;