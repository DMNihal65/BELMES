import React from 'react';
import { Table, Card, DatePicker, Select, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const MaintenanceHistory = () => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
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
      filters: [
        { text: 'Preventive', value: 'Preventive' },
        { text: 'Corrective', value: 'Corrective' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Technician',
      dataIndex: 'technician',
      key: 'technician',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => `$${cost.toFixed(2)}`,
    },
  ];

  const data = [
    {
      key: '1',
      date: '2024-02-15',
      machine: 'CNC Machine 01',
      type: 'Preventive',
      description: 'Regular maintenance check',
      technician: 'John Doe',
      duration: '2h 30m',
      cost: 250.00,
    },
    // Add more history records
  ];

  return (
    <div className="space-y-4">
      <Card>
        <Space className="w-full justify-end mb-4">
          <RangePicker />
          <Select
            defaultValue="all"
            style={{ width: 200 }}
            options={[
              { value: 'all', label: 'All Machines' },
              { value: 'cnc', label: 'CNC Machines' },
              { value: 'lathe', label: 'Lathe Machines' },
            ]}
          />
        </Space>
        <Table 
          columns={columns} 
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default MaintenanceHistory; 