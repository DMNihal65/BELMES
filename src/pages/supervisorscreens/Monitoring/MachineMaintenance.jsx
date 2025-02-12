import React from 'react';
import { Table, Card, Button, Tag, Space, Badge, Progress } from 'antd';
import { WrenchIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

const MachineMaintenance = () => {
  const columns = [
    {
      title: 'Machine ID',
      dataIndex: 'machineId',
      key: 'machineId',
    },
    {
      title: 'Machine Name',
      dataIndex: 'machineName',
      key: 'machineName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          operational: 'success',
          maintenance: 'processing',
          'needs attention': 'warning',
          breakdown: 'error',
        };
        return <Badge status={colors[status.toLowerCase()]} text={status} />;
      },
    },
    {
      title: 'Health',
      dataIndex: 'health',
      key: 'health',
      render: (health) => (
        <Progress percent={health} size="small" />
      ),
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
    },
    {
      title: 'Next Due',
      dataIndex: 'nextDue',
      key: 'nextDue',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small">Schedule</Button>
          <Button size="small">History</Button>
        </Space>
      ),
    },
  ];

  // Mock data
  const data = [
    {
      key: '1',
      machineId: 'CNM-001',
      machineName: 'CNC Machine 01',
      status: 'Operational',
      health: 85,
      lastMaintenance: '2024-02-15',
      nextDue: '2024-03-15',
    },
    // Add more machines
  ];

  return (
    <div className="p-6">
      <Card title="Machine Maintenance" className="shadow-sm">
        <Table 
          columns={columns} 
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default MachineMaintenance; 