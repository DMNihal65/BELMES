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
// import { mockTools } from '../../data/mockTools';
// import { mockFixtures } from '../../data/mockFixtures';
import dayjs from 'dayjs';
import { Modal } from 'antd'; 

const { Option } = Select;

const JobOperationsTable = ({ jobId, onOperationEdit, operations: initialOperations }) => {
  const [operations, setOperations] = useState(initialOperations || []);
  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility
  const [currentOperation, setCurrentOperation] = useState(null); // State for current operation being edited

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

    // Function to show modal with operation data
  const showEditModal = (record) => {
    setCurrentOperation({ ...record }); // Create a copy of the record
    setIsModalVisible(true);
  };

  // Function to handle modal OK
  const handleOk = () => {
    const updatedOperations = operations.map(op =>
      op.key === currentOperation.key ? currentOperation : op
    );
    setOperations(updatedOperations);
    setIsModalVisible(false);
  };

  // Function to handle modal Cancel
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Op. No',
      dataIndex: 'opNo',
      width: 80,
      fixed: 'left',
      // Added filter for Op. No
      filters: operations.map(op => ({ text: op.opNo, value: op.opNo })),
      onFilter: (value, record) => record.opNo.includes(value),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: 150,
      fixed: 'left',
      filters: operations.map(op => ({ text: op.description, value: op.description })),
      onFilter: (value, record) => record.description.includes(value),
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      width: 180,
      render: (text) => {
        const machine = mockMachines.find(machine => machine.id === text);
        return machine ? (
          <Space>
            {machine.name}
            <Tag color={machine.status === 'available' ? 'green' : 'orange'}>
              {machine.status}
            </Tag>
          </Space>
        ) : null;
      },
      filters: mockMachines.map(machine => ({ text: machine.name, value: machine.id })),
      onFilter: (value, record) => record.machine === value,
    },
    {
      title: 'Cycle Time',
      dataIndex: 'cycleTime',
      width: 120,
      render: (text) => text ? dayjs(text, 'HH:mm:ss').format('HH:mm:ss') : 'N/A',
    },
    {
      title: 'Setup Time',
      dataIndex: 'setupTime',
      width: 120,
      render: (text) => text ? dayjs(text, 'HH:mm:ss').format('HH:mm:ss') : 'N/A',
    },
    {
      title: 'Tools',
      dataIndex: 'tools',
      width: 150,
      render: (tools) => tools.join(', '), 
      // filters: mockTools.map(tool => ({ text: tool.name, value: tool.id })),
      // onFilter: (value, record) => record.tools.includes(value),
    },
    {
      title: 'Fixtures',
      dataIndex: 'fixtures',
      width: 150,
      render: (fixtures) => fixtures.join(', '), 
      // filters: mockFixtures.map(fixture => ({ text: fixture.name, value: fixture.id })),
      // onFilter: (value, record) => record.fixtures.includes(value),
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
              onClick={() => showEditModal(record)} // Show modal on click
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
        pagination={{ pageSize: 5 }} 
        size="middle"
      />

<Modal
      title="Edit Operation Sequence"
      visible={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={500} // You can adjust this width as needed
    >
      {/* Editable fields for the operation */}
      <p className="text-base">Edit details for: {currentOperation?.opNo}</p>

      {/* Operation Number */}
      <div className="mt-4">
        <span className="font-semibold">Operation Number</span>
        <Input
          className='text-base'
          value={currentOperation?.opNo}
          onChange={(e) => setCurrentOperation({ ...currentOperation, opNo: e.target.value })}
          placeholder="Enter Operation Number" disabled
        />
      </div>

      {/* Description */}
      <div className="mt-4">
        <span className="font-semibold">Description</span>
        <Select
          value={currentOperation?.description}
          onChange={(value) => setCurrentOperation({ ...currentOperation, description: value })}
          style={{ width: '100%' }}
          placeholder="Select Description"
        >
          {['Face Milling', 'Drilling'].map((desc) => (
            <Option key={desc} value={desc}>
              {desc}
            </Option>
          ))}
        </Select>
      </div>

      {/* Machine */}
      <div className="mt-4">
        <span className="font-semibold">Machine</span>
        <Select
          value={currentOperation?.machine}
          onChange={(value) => setCurrentOperation({ ...currentOperation, machine: value })}
          style={{ width: '100%' }}
          placeholder="Select Machine"
        >
          {mockMachines.map((machine) => (
            <Option key={machine.id} value={machine.id} disabled={machine.status === 'maintenance'}>
              <Space>
                {machine.name}
                <Tag color={machine.status === 'available' ? 'green' : 'orange'}>{machine.status}</Tag>
              </Space>
            </Option>
          ))}
        </Select>
      </div>

      {/* Cycle Time */}
      <div className="mt-4">
        <span className="font-semibold">Cycle Time</span>
        <TimePicker
          value={currentOperation?.cycleTime ? dayjs(currentOperation.cycleTime, 'HH:mm:ss') : null}
          format="HH:mm:ss"
          onChange={(time) => setCurrentOperation({ ...currentOperation, cycleTime: time ? time.format('HH:mm:ss') : null })}
          style={{ width: '100%' }}
          placeholder="Select Cycle Time"
        />
      </div>

      {/* Setup Time */}
      <div className="mt-4">
        <span className="font-semibold">Setup Time</span>
        <TimePicker
          value={currentOperation?.setupTime ? dayjs(currentOperation.setupTime, 'HH:mm:ss') : null}
          format="HH:mm:ss"
          onChange={(time) => setCurrentOperation({ ...currentOperation, setupTime: time ? time.format('HH:mm:ss') : null })}
          style={{ width: '100%' }}
          placeholder="Select Setup Time"
        />
      </div>

      {/* Tools */}
      <div className="mt-4">
        <span className="font-semibold">Tools</span>
        <Select
          mode="multiple"
          value={currentOperation?.tools}
          onChange={(value) => setCurrentOperation({ ...currentOperation, tools: value })}
          style={{ width: '100%' }}
          placeholder="Select Tools"
        >
          {['Tool1', 'Tool2', 'Tool3'].map((tool) => (
            <Option key={tool} value={tool}>
              {tool}
            </Option>
          ))}
        </Select>
      </div>

      {/* Fixtures */}
      <div className="mt-4">
        <span className="font-semibold">Fixtures</span>
        <Select
          mode="multiple"
          value={currentOperation?.fixtures}
          onChange={(value) => setCurrentOperation({ ...currentOperation, fixtures: value })}
          style={{ width: '100%' }}
          placeholder="Select Fixtures"
        >
          {['Fixture1', 'Fixture2', 'Fixture3'].map((fixture) => (
            <Option key={fixture} value={fixture}>
              {fixture}
            </Option>
          ))}
        </Select>
      </div>
    </Modal>

    </div>
  );
};

export default JobOperationsTable; 