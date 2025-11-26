import React, { useState } from 'react';
import { 
  Card, Table, Tag, Space, Button, Select, 
  Timeline, Badge, Alert, Typography, Row, Col 
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
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [timeRange, setTimeRange] = useState('shift1');
  const [loading, setLoading] = useState(false);

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
      {/* Header with Machine Selection and Time Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
       
          <Select
            mode="multiple"
            style={{ width: '300px' }}
            placeholder="Select Machines"
            defaultValue={['all']}
            onChange={setSelectedMachines}
            options={[
              { value: 'all', label: 'All Machines' },
              ...machines.map(m => ({ value: m.id, label: `${m.name} (${m.id})` })),
            ]}
          />
        </div>
        <Space size="large">
          <Select
            value={timeRange}
            style={{ width: '120px' }}
            onChange={setTimeRange}
            options={[
              { value: 'shift1', label: 'Shift 1' },
              { value: 'shift2', label: 'Shift 2' },
              { value: 'shift3', label: 'Shift 3' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={loading}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {alertsData.some(alert => alert.priority === 'high') && (
        <Alert
          message="High Priority Alerts"
          description="There are unacknowledged high priority alerts that require immediate attention."
          type="error"
          showIcon
          closable
        />
      )}

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