import React, { useState } from 'react';
import { Card, Button, Table, Space, Badge, Tag, Input } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Typography } from 'antd';

const { Title } = Typography;

function AlertScreens() {
  const navigate = useNavigate();
  const [activeAlerts, setActiveAlerts] = useState([
    {
      key: '1',
      alertId: 'ALT001',
      machine: 'DMG-01',
      type: 'Warning',
      message: 'Low coolant level detected',
      timestamp: '2024-12-18 15:30:00',
      status: 'Active',
    },
    {
      key: '2',
      alertId: 'ALT002',
      machine: 'DMG-01',
      type: 'Critical',
      message: 'Emergency stop activated',
      timestamp: '2024-12-18 15:45:00',
      status: 'Active',
    },
    {
      key: '3',
      alertId: 'ALT003',
      machine: 'DMG-01',
      type: 'Info',
      message: 'Maintenance due in 24 hours',
      timestamp: '2024-12-18 16:00:00',
      status: 'Active',
    },
  ]);

  const [resolvedAlerts, setResolvedAlerts] = useState([
    {
      key: '4',
      alertId: 'ALT004',
      machine: 'DMG-01',
      type: 'Warning',
      message: 'Tool wear detected',
      timestamp: '2024-12-18 14:30:00',
      resolvedAt: '2024-12-18 14:45:00',
      resolvedBy: 'John Doe',
    },
  ]);

  const handleAcknowledge = (record) => {
    setActiveAlerts(prev => prev.filter(alert => alert.key !== record.key));
    setResolvedAlerts(prev => [...prev, {
      ...record,
      resolvedAt: new Date().toLocaleString(),
      resolvedBy: 'John Doe', // This would come from auth context in real app
    }]);
  };

  const getAlertTypeTag = (type) => {
    const types = {
      'Critical': { color: 'red', icon: '🔴' },
      'Warning': { color: 'orange', icon: '⚠️' },
      'Info': { color: 'blue', icon: 'ℹ️' },
    };
    return (
      <Tag color={types[type]?.color} style={{ fontWeight: 'bold' }}>
        {types[type]?.icon} {type}
      </Tag>
    );
  };

  const activeAlertsColumns = [
    {
      title: 'Alert ID',
      dataIndex: 'alertId',
      key: 'alertId',
      width: 100,
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      width: 100,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => getAlertTypeTag(type),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      flex: 1,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleAcknowledge(record)}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Acknowledge
        </Button>
      ),
    },
  ];

  const resolvedAlertsColumns = [
    {
      title: 'Alert ID',
      dataIndex: 'alertId',
      key: 'alertId',
      width: 100,
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      width: 100,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => getAlertTypeTag(type),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      flex: 1,
    },
    {
      title: 'Resolved At',
      dataIndex: 'resolvedAt',
      key: 'resolvedAt',
      width: 180,
    },
    {
      title: 'Resolved By',
      dataIndex: 'resolvedBy',
      key: 'resolvedBy',
      width: 150,
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/operator/dashboard')}
            size="large"
          >
            Back to Dashboard
          </Button>
          <Title level={4} style={{ margin: 0 }}>Machine Alerts</Title>
        </div>
        <Space size="large" className="w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined />}
            placeholder="Search alerts..."
            style={{ width: '100%', minWidth: '200px', maxWidth: '300px' }}
            size="large"
          />
          <Badge count={activeAlerts.length}>
            <BellOutlined style={{ fontSize: '24px' }} />
          </Badge>
        </Space>
      </div>

      {/* Active Alerts Section */}
      <Card 
        title={
          <Space>
            <BellOutlined style={{ color: '#ff4d4f' }} />
            <span className="text-lg font-medium">Active Alerts</span>
            <Badge count={activeAlerts.length} style={{ backgroundColor: '#ff4d4f' }} />
          </Space>
        }
        className="mb-6 shadow-sm"
      >
        <div className="overflow-x-auto">
          <Table 
            columns={activeAlertsColumns} 
            dataSource={activeAlerts}
            pagination={false}
            className="border rounded-lg"
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>

      {/* Resolved Alerts Section */}
      <Card 
        title={
          <Space>
            <BellOutlined style={{ color: '#52c41a' }} />
            <span className="text-lg font-medium">Resolved Alerts Log</span>
            <Badge count={resolvedAlerts.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        className="shadow-sm"
      >
        <div className="overflow-x-auto">
          <Table 
            columns={resolvedAlertsColumns} 
            dataSource={resolvedAlerts}
            pagination={{ pageSize: 5, responsive: true }}
            className="border rounded-lg"
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>
    </div>
  );
}

export default AlertScreens;