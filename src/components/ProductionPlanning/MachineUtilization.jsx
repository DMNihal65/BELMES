import React, { useState } from 'react';
import { Card, Table, Progress, Tag, Space, Tooltip, Button, Row, Col, Statistic } from 'antd';
import { InfoCircleOutlined, WarningOutlined, ToolOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Line, ResponsiveContainer, LineChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip as RechartsTooltip } from 'recharts';

const MachineUtilization = ({ data, viewMode }) => {
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Generate hourly efficiency data for the selected machine
  const getHourlyData = (machine) => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      efficiency: Math.floor(Math.random() * 20) + 70,
      utilization: Math.floor(Math.random() * 30) + 60,
    }));
  };

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.id}</div>
        </div>
      ),
    },
    {
      title: 'Current Status',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const status = record.status;
        const colors = {
          running: 'green',
          idle: 'orange',
          maintenance: 'blue',
          breakdown: 'red',
        };
        return (
          <Tag color={colors[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Utilization',
      key: 'utilization',
      width: 200,
      render: (_, record) => {
        const utilization = (record.usedCapacity / record.totalCapacity) * 100;
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Progress 
              percent={Math.round(utilization)} 
              status={utilization > 90 ? 'exception' : 'normal'}
              size="small"
            />
            <div className="text-xs text-gray-500">
              {record.usedCapacity} / {record.totalCapacity} hrs
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      width: 120,
      render: (value) => (
        <Tag color={value >= 85 ? 'green' : value >= 70 ? 'orange' : 'red'}>
          {value}%
        </Tag>
      ),
    },
    {
      title: 'Current Job',
      key: 'currentJob',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.currentJob?.partNumber}</div>
          <div className="text-xs text-gray-500">
            Progress: {record.currentJob?.progress}%
          </div>
        </div>
      ),
    },
    {
      title: 'Next Planned Job',
      key: 'nextJob',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.nextJob?.partNumber}</div>
          <div className="text-xs text-gray-500">
            Starts: {record.nextJob?.startTime}
          </div>
        </div>
      ),
    },
    {
      title: 'Performance Metrics',
      key: 'metrics',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <span className="text-xs text-gray-500">OEE:</span>
            <Progress 
              percent={Math.round(record.efficiency * 0.9)} 
              size="small"
              status={record.efficiency * 0.9 >= 85 ? 'success' : 'normal'}
            />
          </div>
          <div>
            <span className="text-xs text-gray-500">MTBF:</span>
            <Tag color="blue">{Math.round(record.efficiency * 0.5)} hrs</Tag>
          </div>
        </Space>
      ),
    },
    {
      title: 'Maintenance',
      key: 'maintenance',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical">
          <Tag color={record.nextMaintenance <= 48 ? 'red' : 'green'}>
            Next: {record.nextMaintenance}hrs
          </Tag>
          {record.maintenanceAlert && (
            <Tag color="orange" icon={<WarningOutlined />}>
              Due Soon
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" type="link">Details</Button>
          <Button size="small" type="link">History</Button>
        </Space>
      ),
    },
  ];

  const renderMachineDetails = (machine) => (
    <Card className="mt-4">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="OEE"
            value={machine.efficiency * 0.9}
            suffix="%"
            precision={1}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="MTBF"
            value={machine.efficiency * 0.5}
            suffix="hrs"
            precision={1}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Downtime"
            value={100 - machine.efficiency}
            suffix="%"
            precision={1}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Parts/Hour"
            value={Math.round(machine.efficiency * 0.8)}
            precision={0}
          />
        </Col>
      </Row>

      <div style={{ height: 300 }} className="mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={getHourlyData(machine)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="#1890ff" 
              name="Efficiency"
            />
            <Line 
              type="monotone" 
              dataKey="utilization" 
              stroke="#52c41a" 
              name="Utilization"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Table 
        columns={columns} 
        dataSource={data}
        scroll={{ x: 1500 }}
        pagination={false}
        rowClassName={(record) => 
          record.status === 'breakdown' ? 'bg-red-50' : ''
        }
        onRow={(record) => ({
          onClick: () => setSelectedMachine(record),
          className: 'cursor-pointer hover:bg-gray-50'
        })}
      />
      {selectedMachine && renderMachineDetails(selectedMachine)}
    </div>
  );
};

export default MachineUtilization; 