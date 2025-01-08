import React from 'react';
import { Table, Card, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const Fixtures = () => {
  const fixturesData = [
    {
      key: '1',
      name: 'Assembly Fixture XY-23',
      type: 'Assembly',
      status: 'In Use',
      lastInspection: '2024-01-05',
      nextInspection: '2024-02-05',
      location: 'Station-03',
      condition: 'Good'
    },
    // Add more mock data as needed
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'In Use' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Last Inspection',
      dataIndex: 'lastInspection',
      key: 'lastInspection',
    },
    {
      title: 'Next Inspection',
      dataIndex: 'nextInspection',
      key: 'nextInspection',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
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
      <Card title="Fixtures Inventory">
        <Table 
          columns={columns} 
          dataSource={fixturesData} 
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default Fixtures;