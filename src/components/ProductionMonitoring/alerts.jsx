import React, { useState } from 'react';
import { Table, Tag, Badge, Card, Space, Button, Tooltip, Select, Timeline, Statistic } from 'antd';
import { AlertTriangle, Bell, CheckCircle2, Clock, AlertOctagon, ReloadOutlined } from 'lucide-react';

const ProductionAlerts = ({ machineData, timeRange, dateRange }) => {
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [loading, setLoading] = useState(false);

  // Mock alerts data - In real app, this would come from an API
  const alerts = [
    {
      id: 1,
      machineId: 'DMG-001',
      type: 'performance',
      message: 'Production rate below target',
      timestamp: new Date().toISOString(),
      priority: 'high',
      status: 'active',
      details: 'Current rate: 45 units/hr, Target: 60 units/hr',
    },
    {
      id: 2,
      machineId: 'HMC-001',
      type: 'maintenance',
      message: 'Tool wear threshold reached',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      priority: 'medium',
      status: 'active',
      details: 'Tool T1234 wear at 85%, Replace soon',
    },
    {
      id: 3,
      machineId: 'DMG-002',
      type: 'quality',
      message: 'Dimensional deviation detected',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      priority: 'high',
      status: 'resolved',
      details: 'Part dimension out of tolerance: 0.15mm',
      resolution: 'Tool offset adjusted',
    },
  ];

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'error',
      medium: 'warning',
      low: 'default',
    };
    return colors[priority] || 'default';
  };

  const getTypeIcon = (type) => {
    const icons = {
      performance: <AlertTriangle size={16} className="text-orange-500" />,
      maintenance: <Clock size={16} className="text-blue-500" />,
      quality: <AlertOctagon size={16} className="text-red-500" />,
    };
    return icons[type] || <Bell size={16} />;
  };

  const columns = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} className="uppercase">
          {priority}
        </Tag>
      ),
      filters: [
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Machine',
      dataIndex: 'machineId',
      width: 150,
      render: (machineId) => {
        const machine = machineData.find(m => m.id === machineId);
        return (
          <div>
            <div className="font-medium">{machineId}</div>
            <div className="text-xs text-gray-500">{machine?.name}</div>
          </div>
        );
      },
    },
    {
      title: 'Alert',
      dataIndex: 'type',
      render: (type, record) => (
        <Space>
          {getTypeIcon(type)}
          <div>
            <div className="font-medium">{record.message}</div>
            <div className="text-xs text-gray-500">{record.details}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (status) => (
        <Badge 
          status={status === 'active' ? 'processing' : 'success'} 
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      width: 150,
      render: (timestamp) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          <span>{new Date(timestamp).toLocaleTimeString()}</span>
        </Tooltip>
      ),
      sorter: (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small">
            Acknowledge
          </Button>
          <Button size="small">
            Details
          </Button>
        </Space>
      ),
    },
  ];

  // Filter alerts based on machine selection
  const filteredAlerts = alerts.filter(alert => {
    const machine = machineData.find(m => m.id === alert.machineId);
    return machine !== undefined;
  });

  return (
    <div className="space-y-6">
      {/* Header with Machine Selection and Time Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Production Alerts</h1>
          <Select
            mode="multiple"
            style={{ width: '300px' }}
            placeholder="Select Machines"
            defaultValue={['all']}
            onChange={setSelectedMachines}
            options={[
              { value: 'all', label: 'All Machines' },
              ...machineData.map(m => ({ value: m.id, label: `${m.name} (${m.id})` })),
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
          {timeRange === 'custom' && (
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              onChange={setDateRange}
            />
          )}
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card bordered={false} className="bg-red-50">
          <Statistic
            title="High Priority"
            value={filteredAlerts.filter(a => a.priority === 'high' && a.status === 'active').length}
            prefix={<AlertOctagon className="text-red-500" />}
          />
        </Card>
        <Card bordered={false} className="bg-orange-50">
          <Statistic
            title="Medium Priority"
            value={filteredAlerts.filter(a => a.priority === 'medium' && a.status === 'active').length}
            prefix={<AlertTriangle className="text-orange-500" />}
          />
        </Card>
        <Card bordered={false} className="bg-blue-50">
          <Statistic
            title="Maintenance"
            value={filteredAlerts.filter(a => a.type === 'maintenance' && a.status === 'active').length}
            prefix={<Clock className="text-blue-500" />}
          />
        </Card>
        <Card bordered={false} className="bg-green-50">
          <Statistic
            title="Resolved Today"
            value={filteredAlerts.filter(a => a.status === 'resolved').length}
            prefix={<CheckCircle2 className="text-green-500" />}
          />
        </Card>
      </div>

      {/* Alert Timeline */}
      <Card title="Recent Alerts Timeline" className="mb-6">
        <Timeline
          items={filteredAlerts.map(alert => ({
            color: alert.status === 'active' ? 'red' : 'green',
            children: (
              <div>
                <div className="font-medium">
                  {alert.message} - {alert.machineId}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
                {alert.status === 'resolved' && (
                  <div className="text-sm text-green-600">
                    Resolution: {alert.resolution}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Card>

      {/* Alert Table */}
      <Card 
        title="Active Alerts"
        extra={
          <Space>
            <Select
              value={filterType}
              style={{ width: 120 }}
              onChange={setFilterType}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'performance', label: 'Performance' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'quality', label: 'Quality' },
              ]}
            />
            <Select
              value={filterPriority}
              style={{ width: 120 }}
              onChange={setFilterPriority}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <Button type="primary">
              Acknowledge All
            </Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={filteredAlerts}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default ProductionAlerts; 