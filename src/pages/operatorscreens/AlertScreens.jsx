import React, { useState } from 'react';
import { Card, Button, Table, Space, Badge, Tag, Input, Layout, Row, Col, Statistic, Progress } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Typography } from 'antd';
import { AlertTriangle, AlertOctagon, Info, Bell, CheckCircle2, Clock, Activity, AlertCircle } from 'lucide-react';

const { Title } = Typography;
const { Content } = Layout;

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
      resolvedBy: 'John Doe',
    }]);
  };

  const getAlertTypeTag = (type) => {
    const types = {
      'Critical': { 
        color: '#fff1f0', 
        textColor: '#cf1322',
        borderColor: '#ffa39e',
        icon: <AlertOctagon className="w-4 h-4" style={{ color: '#cf1322' }} /> 
      },
      'Warning': { 
        color: '#fffbe6', 
        textColor: '#d48806',
        borderColor: '#ffe58f',
        icon: <AlertTriangle className="w-4 h-4" style={{ color: '#d48806' }} /> 
      },
      'Info': { 
        color: '#e6f7ff', 
        textColor: '#1890ff',
        borderColor: '#91d5ff',
        icon: <Info className="w-4 h-4" style={{ color: '#1890ff' }} /> 
      },
    };
    return (
      <Tag 
        style={{ 
          backgroundColor: types[type]?.color,
          color: types[type]?.textColor,
          borderColor: types[type]?.borderColor,
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: '500'
        }}
      >
        {types[type]?.icon}
        {type}
      </Tag>
    );
  };

  const alertStats = {
    total: activeAlerts.length + resolvedAlerts.length,
    critical: activeAlerts.filter(a => a.type === 'Critical').length,
    warning: activeAlerts.filter(a => a.type === 'Warning').length,
    info: activeAlerts.filter(a => a.type === 'Info').length,
    resolved: resolvedAlerts.length
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
          style={{ 
            backgroundColor: '#52c41a', 
            borderColor: '#52c41a',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          icon={<CheckCircle2 className="w-4 h-4" />}
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
    <Layout className="h-screen flex flex-col bg-white">
      {/* Top Header Bar */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Alert </h1>
            {/* <div className="text-gray-500 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </div> */}
          </div>
        </div>
        <Space size="large">
          <Input 
            prefix={<SearchOutlined />}
            placeholder="Search alerts..."
            style={{ width: '250px' }}
            className="rounded-lg"
          />
          <Badge count={activeAlerts.length} style={{ backgroundColor: '#ff4d4f' }}>
            <Bell className="w-6 h-6 text-gray-600" />
          </Badge>
        </Space>
      </div>

      {/* Main Content Area */}
      <Content className="p-6 flex-1 overflow-auto bg-gray-50">
        {/* Alert Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={4}>
            <Card 
              bordered={false} 
              className="rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic 
                title={
                  <div className="flex items-center gap-2 mb-2">
                    {/* <div className="p-2 bg-blue-50 rounded-lg">
                      <Activity className="w-4 h-4 text-blue-500" />
                    </div> */}
                    <span className="text-gray-600">Total Alerts</span>
                  </div>
                }
                value={alertStats.total}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card 
              bordered={false} 
              className="rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic 
                title={
                  <div className="flex items-center gap-2 mb-2">
                    {/* <div className="p-2 bg-red-50 rounded-lg">
                      <AlertOctagon className="w-4 h-4 text-red-500" />
                    </div> */}
                    <span className="text-gray-600">Critical</span>
                  </div>
                }
                value={alertStats.critical}
                valueStyle={{ color: '#cf1322', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card 
              bordered={false} 
              className="rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic 
                title={
                  <div className="flex items-center gap-2 mb-2">
                    {/* <div className="p-2 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    </div> */}
                    <span className="text-gray-600">Warning</span>
                  </div>
                }
                value={alertStats.warning}
                valueStyle={{ color: '#d48806', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card 
              bordered={false} 
              className="rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic 
                title={
                  <div className="flex items-center gap-2 mb-2">
                    {/* <div className="p-2 bg-blue-50 rounded-lg">
                      <Info className="w-4 h-4 text-blue-500" />
                    </div> */}
                    <span className="text-gray-600">Info</span>
                  </div>
                }
                value={alertStats.info}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              bordered={false} 
              className="rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              bodyStyle={{ padding: '20px' }}
            >
              <div className="flex items-center justify-between">
                <Statistic 
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      {/* <div className="p-2 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div> */}
                      <span className="text-gray-600">Resolution Rate</span>
                    </div>
                  }
                  value={Math.round((alertStats.resolved / alertStats.total) * 100)}
                  suffix="%"
                  valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: '600' }}
                />
                <Progress 
                  type="circle" 
                  percent={Math.round((alertStats.resolved / alertStats.total) * 100)} 
                  width={60}
                  strokeColor={{
                    '0%': '#52c41a',
                    '100%': '#52c41a',
                  }}
                  strokeWidth={8}
                  className="mr-4"
                />
              </div>
            </Card>
          </Col>
        </Row>

        <div className="space-y-6">
          {/* Active Alerts Section */}
          <Card 
            title={
              <Space>
                {/* <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div> */}
                <span className="text-lg font-medium">Active Alerts</span>
                <Badge count={activeAlerts.length} style={{ backgroundColor: '#ff4d4f' }} />
              </Space>
            }
            className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            bodyStyle={{ padding: '0' }}
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={<SearchOutlined />}
                  className="hover:bg-gray-50 transition-colors"
                >
                  Filter
                </Button>
                <Button 
                  type="default" 
                  icon={<BellOutlined />}
                  className="hover:bg-gray-50 transition-colors"
                >
                  Notify
                </Button>
              </Space>
            }
          >
            <Table 
              columns={activeAlertsColumns} 
              dataSource={activeAlerts}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>

          {/* Resolved Alerts Section */}
          <Card 
            title={
              <Space>
                {/* <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div> */}
                <span className="text-lg font-medium">Resolved Alerts</span>
                <Badge count={resolvedAlerts.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            bodyStyle={{ padding: '0' }}
            extra={
              <Button 
                type="default" 
                icon={<SearchOutlined />}
                className="hover:bg-gray-50 transition-colors"
              >
                Filter
              </Button>
            }
          >
            <Table 
              columns={resolvedAlertsColumns} 
              dataSource={resolvedAlerts}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </div>
      </Content>

      <style jsx global>{`
        .ant-card {
          box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
        }

        .ant-card:hover {
          box-shadow: rgba(0, 0, 0, 0.15) 0px 8px 24px;
        }

        .ant-statistic-title {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .ant-statistic-content {
          font-size: 24px;
          font-weight: 600;
        }

        .ant-progress-circle .ant-progress-text {
          color: #52c41a;
          font-weight: 600;
          font-size: 16px;
        }

        .ant-table {
          background: white;
          border-radius: 0 0 12px 12px;
        }

        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #475569;
          font-weight: 600;
          padding: 16px 24px;
        }

        .ant-table-tbody > tr > td {
          padding: 16px 24px;
        }

        .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }

        .ant-btn {
          border-radius: 8px;
          height: 38px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .ant-btn:hover {
          transform: translateY(-1px);
        }

        .ant-input-affix-wrapper {
          border-radius: 8px;
          height: 38px;
          border: 1px solid #e5e7eb;
        }

        .ant-badge .ant-badge-count {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </Layout>
  );
}

export default AlertScreens;