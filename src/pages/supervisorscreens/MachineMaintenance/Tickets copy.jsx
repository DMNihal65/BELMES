import React from 'react';
import { Table, Button, Space } from 'antd';

const Tickets = () => {
  const columns = [
    {
      title: 'Machine Name',
      dataIndex: 'machineName',
      key: 'machineName',
    },
    {
      title: 'Operator Name',
      dataIndex: 'operatorName',
      key: 'operatorName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Open Date',
      dataIndex: 'openDate',
      key: 'openDate',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'In Progress Date',
      dataIndex: 'inProgressDate',
      key: 'inProgressDate',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Closed Date',
      dataIndex: 'closedDate',
      key: 'closedDate',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'OPEN' && (
            <Button type="primary" onClick={() => handleAcknowledge(record.id)}>
              Acknowledge
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleAcknowledge = (ticketId) => {
    // Implement your acknowledge logic here
    console.log('Acknowledging ticket:', ticketId);
  };

  return (
    <div className="p-4">
      <Table 
        columns={columns} 
        dataSource={[]} // Connect to your data source
        rowKey="id"
      />
    </div>
  );
};

export default Tickets;