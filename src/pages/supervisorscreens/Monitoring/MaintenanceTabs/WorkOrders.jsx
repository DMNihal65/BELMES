import React from 'react';
import { Table, Card, Button, Tag, Space, Badge } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const WorkOrders = () => {
  const columns = [
    {
      title: 'Work Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Preventive' ? 'blue' : type === 'Corrective' ? 'orange' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'warning',
          'in-progress': 'processing',
          completed: 'success',
        };
        return <Badge status={colors[status.toLowerCase()]} text={status} />;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'green'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small">View</Button>
          <Button size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      id: 'WO-2024-001',
      machine: 'CNC Machine 01',
      type: 'Preventive',
      status: 'Pending',
      priority: 'High',
      dueDate: '2024-03-20',
      assignedTo: 'John Doe',
    },
    {
      key: '2',
      id: 'WO-2024-002',
      machine: 'Lathe Machine 03',
      type: 'Corrective',
      status: 'In-Progress',
      priority: 'Medium',
      dueDate: '2024-03-18',
      assignedTo: 'Jane Smith',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button type="primary" icon={<PlusOutlined />}>
          Create Work Order
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

export default WorkOrders; 