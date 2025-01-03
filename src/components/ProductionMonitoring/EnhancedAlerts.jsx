import React, { useState } from 'react';
import { 
  Card, Table, Tag, Space, Button, Select, 
  Timeline, Badge, Alert, Typography ,Row,Col 
} from 'antd';
import { 
  AlertOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { Text } = Typography;

const EnhancedAlerts = ({ machines }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Generate mock alerts data
  const alertsData = machines.flatMap(machine => 
    machine.alerts > 0 ? [{
      id: `${machine.id}-alert-1`,
      machineId: machine.id,
      machineName: machine.name,
      type: 'Performance',
      message: `Performance below threshold (${machine.oee.performance}%)`,
      status: 'active',
      priority: 'high',
      timestamp: moment().subtract(30, 'minutes').toISOString(),
      acknowledged: false
    }] : []
  );

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machineName',
      key: 'machineName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Performance' ? 'blue' : 'red'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'high' ? 'red' : 'orange'}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment(timestamp).fromNow(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'active' ? 'error' : 'success'} 
          text={status.toUpperCase()} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            disabled={record.acknowledged}
          >
            Acknowledge
          </Button>
          <Button size="small">Details</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {alertsData.some(alert => alert.priority === 'high') && (
        <Alert
          message="High Priority Alerts"
          description="There are unacknowledged high priority alerts that require immediate attention."
          type="error"
          showIcon
          closable
        />
      )}

      <Space className="w-full justify-between">
        <Space>
          <Select 
            value={filterStatus} 
            onChange={setFilterStatus}
            style={{ width: 120 }}
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="resolved">Resolved</Option>
          </Select>
          <Select 
            value={filterPriority} 
            onChange={setFilterPriority}
            style={{ width: 120 }}
          >
            <Option value="all">All Priority</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<CheckCircleOutlined />}>
          Acknowledge All
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Active Alerts">
            <Table 
              columns={columns} 
              dataSource={alertsData}
              rowKey="id"
              scroll={{ x: 1000 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Alert Timeline">
            <Timeline mode="left">
              {alertsData.map(alert => (
                <Timeline.Item 
                  key={alert.id}
                  color={alert.priority === 'high' ? 'red' : 'blue'}
                  label={moment(alert.timestamp).format('HH:mm:ss')}
                >
                  <Text strong>{alert.machineName}</Text>
                  <br />
                  <Text type="secondary">{alert.message}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EnhancedAlerts; 