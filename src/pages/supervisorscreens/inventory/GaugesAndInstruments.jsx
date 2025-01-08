import React from 'react';
import { Table, Card, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const GaugesAndInstruments = () => {
  const gaugesData = [
    {
      key: '1',
      name: 'Digital Caliper',
      type: 'Measuring',
      calibrationDate: '2024-01-10',
      nextCalibration: '2024-07-10',
      accuracy: '±0.02mm',
      status: 'Calibrated',
      location: 'Lab-01'
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
      title: 'Last Calibration',
      dataIndex: 'calibrationDate',
      key: 'calibrationDate',
    },
    {
      title: 'Next Calibration',
      dataIndex: 'nextCalibration',
      key: 'nextCalibration',
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Calibrated' ? 'green' : 'red'}>
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
      <Card title="Gauges and Instruments">
        <Table 
          columns={columns} 
          dataSource={gaugesData} 
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default GaugesAndInstruments;