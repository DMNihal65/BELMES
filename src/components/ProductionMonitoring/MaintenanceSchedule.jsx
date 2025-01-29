import React, { useState } from 'react';
import { Card, Calendar, Badge, Table, Tag, Button, Space, Tooltip, Row, Col, Statistic, Select } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ToolOutlined,
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';

const MaintenanceSchedule = ({ machines }) => {
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [timeRange, setTimeRange] = useState('shift1');
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(false);

  const maintenanceData = machines.map(machine => ({
    key: machine.id,
    machine: machine.name,
    status: machine.maintenanceStatus,
    lastMaintenance: moment().subtract(15, 'days').format('YYYY-MM-DD'),
    nextMaintenance: machine.nextMaintenance,
    type: 'Preventive',
    priority: machine.maintenanceStatus === 'Good' ? 'Low' : 'High',
  }));

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Good' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
    },
    {
      title: 'Next Scheduled',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'High' ? 'red' : 'blue'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Schedule Maintenance">
            <Button 
              type="primary" 
              icon={<ToolOutlined />}
              size="small"
            />
          </Tooltip>
          <Tooltip title="View History">
            <Button 
              icon={<ClockCircleOutlined />}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getListData = (value) => {
    const maintenanceDates = maintenanceData.map(item => ({
      date: item.nextMaintenance,
      machine: item.machine,
      type: item.type,
    }));

    return maintenanceDates.filter(item => 
      moment(item.date).format('YYYY-MM-DD') === value.format('YYYY-MM-DD')
    );
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status="warning" text={`${item.machine} - ${item.type}`} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
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

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Maintenance Calendar">
            <Calendar dateCellRender={dateCellRender} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Maintenance Statistics">
            <Space direction="vertical" className="w-full">
              <Statistic
                title="Upcoming Maintenance"
                value={maintenanceData.length}
                prefix={<ClockCircleOutlined />}
              />
              <Statistic
                title="Completed This Month"
                value={12}
                prefix={<CheckCircleOutlined />}
              />
              <Statistic
                title="Overdue"
                value={2}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Maintenance Schedule">
        <Table 
          columns={columns} 
          dataSource={maintenanceData}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default MaintenanceSchedule; 