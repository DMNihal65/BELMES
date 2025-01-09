import React from 'react';
import { Table, Tag, Progress, Space, Button, Tooltip } from 'antd';
import { Cpu } from 'lucide-react';
import { EyeOutlined, ToolOutlined, AlertOutlined } from '@ant-design/icons';
import moment from 'moment';

const MachineList = ({ machines, onMachineSelect }) => {
  const columns = [
    {
      title: 'Machine',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Cpu size={16} />
          <span>{text}</span>
          <Tag color={record.status === 'running' ? 'green' : 'red'}>
            {record.status.toUpperCase()}
          </Tag>
        </div>
      )
    },
    {
      title: 'Current Job',
      dataIndex: 'currentJob',
      key: 'currentJob',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <span>{text}</span>
          <small className="text-gray-500">{record.currentOperation}</small>
        </Space>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <Tooltip title={`${record.actualUnits}/${record.plannedUnits} units`}>
          <Progress 
            percent={Math.round((record.actualUnits / record.plannedUnits) * 100)}
            size="small"
            status={record.status === 'running' ? 'active' : 'exception'}
          />
        </Tooltip>
      )
    },
    {
      title: 'OEE',
      dataIndex: ['oee', 'overall'],
      key: 'oee',
      render: (oee) => (
        <Tag color={oee >= 85 ? 'green' : oee >= 70 ? 'orange' : 'red'}>
          {oee}%
        </Tag>
      )
    },
    {
      title: 'Operator',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date) => moment(date).fromNow()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => onMachineSelect(record)}
            />
          </Tooltip>
          <Tooltip title="Maintenance Info">
            <Button 
              type="link" 
              icon={<ToolOutlined />}
              disabled={record.maintenanceStatus === 'Good'}
            />
          </Tooltip>
          {record.alerts > 0 && (
            <Tooltip title={`${record.alerts} active alerts`}>
              <Button 
                type="link" 
                danger 
                icon={<AlertOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={machines}
      rowKey="id"
      className="mt-4"
      pagination={false}
      scroll={{ x: true }}
    />
  );
};

export default MachineList; 