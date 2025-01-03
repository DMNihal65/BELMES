import React, { useState } from 'react';
import { 
  Table, Select, Button, Space, Tag, Tooltip, 
  InputNumber, TimePicker, Popconfirm, Input
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, 
  PlusOutlined, FileTextOutlined 
} from '@ant-design/icons';
import { mockMachines } from '../../data/mockPlanningData';
import dayjs from 'dayjs';

const { Option } = Select;

const JobOperationsTable = ({ jobId, onOperationEdit, operations: initialOperations }) => {
  const [operations, setOperations] = useState(initialOperations || []);

  const handleMachineChange = (value, record) => {
    const updatedOperations = operations.map(op => 
      op.key === record.key ? { ...op, machine: value } : op
    );
    setOperations(updatedOperations);
  };

  const handleTimeChange = (field, time, record) => {
    const updatedOperations = operations.map(op =>
      op.key === record.key ? { ...op, [field]: time ? time.format('HH:mm:ss') : null } : op
    );
    setOperations(updatedOperations);
  };

  const columns = [
    {
      title: 'Op. No',
      dataIndex: 'opNo',
      width: 80,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: 200,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => {
            const updatedOperations = operations.map(op =>
              op.key === record.key ? { ...op, description: e.target.value } : op
            );
            setOperations(updatedOperations);
          }}
        />
      ),
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      width: 180,
      render: (text, record) => (
        <Select
          value={text}
          onChange={(value) => handleMachineChange(value, record)}
          style={{ width: '100%' }}
          showSearch // Enable search functionality
          filterOption={(input, option) => {
            // Check if option is a valid React element
            if (React.isValidElement(option)) {
              const children = option.props.children;
              // Extract text from children
              const childText = typeof children === 'string' ? children : children.props.children;
              return childText.toLowerCase().includes(input.toLowerCase());
            }
            return false;
          }}
        >
          {mockMachines.map(machine => (
            <Option 
              key={machine.id} 
              value={machine.id}
              disabled={machine.status === 'maintenance'}
            >
              <Space>
                {machine.name}
                <Tag color={machine.status === 'available' ? 'green' : 'orange'}>
                  {machine.status}
                </Tag>
              </Space>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Cycle Time',
      dataIndex: 'cycleTime',
      width: 120,
      render: (text, record) => (
        <TimePicker 
          value={text ? dayjs(text, 'HH:mm:ss') : null}
          format="HH:mm:ss"
          onChange={(time) => handleTimeChange('cycleTime', time, record)}
        />
      ),
    },
    {
      title: 'Setup Time',
      dataIndex: 'setupTime',
      width: 120,
      render: (text, record) => (
        <TimePicker 
          value={text ? dayjs(text, 'HH:mm:ss') : null}
          format="HH:mm:ss"
          onChange={(time) => handleTimeChange('setupTime', time, record)}
        />
      ),
    },
    {
      title: 'Tools',
      dataIndex: 'tools',
      width: 150,
      render: (tools) => (
        <Select
          mode="multiple"
          value={tools}
          style={{ width: '100%' }}
          placeholder="Select tools"
          maxTagCount="responsive"
        >
          {/* Add tool options */}
        </Select>
      ),
    },
    {
      title: 'Fixtures',
      dataIndex: 'fixtures',
      width: 150,
      render: (fixtures) => (
        <Select
          mode="multiple"
          value={fixtures}
          style={{ width: '100%' }}
          placeholder="Select fixtures"
          maxTagCount="responsive"
        >
          {/* Add fixture options */}
        </Select>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit MPP Details">
            <Button 
              type="link" 
              icon={<FileTextOutlined />} 
              onClick={() => onOperationEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Operation">
            <Button 
              type="link" 
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this operation?"
            onConfirm={() => {
              const updatedOperations = operations.filter(op => op.key !== record.key);
              setOperations(updatedOperations);
            }}
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Operations Sequence</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            const newOperation = {
              key: `${operations.length + 1}`,
              opNo: `OP${(operations.length + 1) * 10}`,
              description: '',
              machine: '',
              cycleTime: null,
              setupTime: null,
              tools: [],
              fixtures: [],
              status: 'planned',
              precedingOps: []
            };
            setOperations([...operations, newOperation]);
          }}
        >
          Add Operation
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={operations}
        scroll={{ x: 1500 }}
        pagination={false}
        size="middle"
      />
    </div>
  );
};

export default JobOperationsTable; 