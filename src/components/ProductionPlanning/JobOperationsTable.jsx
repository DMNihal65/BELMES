import React, { useState } from 'react';
import { 
  Table, Select, Button, Space, Tag, Tooltip, 
  Popconfirm, Input, Modal, TimePicker
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
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state
  const [isAddOperation, setIsAddOperation] = useState(false); // State to differentiate Add/Edit operation
  const [currentOperation, setCurrentOperation] = useState(null); // Current operation being edited/added

  // Handle Machine Change
  const handleMachineChange = (value, record) => {
    const updatedOperations = operations.map(op => 
      op.key === record.key ? { ...op, machine: value } : op
    );
    setOperations(updatedOperations);
  };

  // Handle Time Change
  const handleTimeChange = (field, time, record) => {
    const updatedOperations = operations.map(op =>
      op.key === record.key ? { ...op, [field]: time ? time.format('HH:mm:ss') : null } : op
    );
    setOperations(updatedOperations);
  };

  // Show Modal for Edit or Add Operation
  const showEditModal = (record) => {
    setIsAddOperation(false);
    setCurrentOperation({ ...record });
    setIsModalVisible(true);
  };

  // Show Modal for Add New Operation
  const showAddModal = () => {
    setIsAddOperation(true);
    setCurrentOperation({
      opNo: '',
      description: '',
      machine: '',
      cycleTime: null,
      setupTime: null,
      tools: [],
      fixtures: [],
    });
    setIsModalVisible(true);
  };

  // Handle Modal OK
  const handleOk = () => {
    if (isAddOperation) {
      // Add New Operation
      const newOperation = { 
        ...currentOperation, 
        key: `${operations.length + 1}`,
      };
      setOperations([...operations, newOperation]);
    } else {
      // Edit Existing Operation
      const updatedOperations = operations.map(op =>
        op.key === currentOperation.key ? currentOperation : op
      );
      setOperations(updatedOperations);
    }
    setIsModalVisible(false);
  };

  // Handle Modal Cancel
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Define Columns for the Table
  const columns = [
    {
      title: 'Op. No',
      dataIndex: 'opNo',
      width: 80,
      fixed: 'left',
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
              onClick={() => showEditModal(record)} 
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
          onClick={showAddModal} // Open modal for adding new operation
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

      {/* Modal for Add/Edit Operation */}
      <Modal
        title={isAddOperation ? "Add New Operation" : "Edit Operation Sequence"}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={500}
      >
        {/* Editable fields for the operation */}
        <p className="text-base">{isAddOperation ? 'Add details for a new operation' : `Edit details for: ${currentOperation?.opNo}`}</p>

        {/* Operation Number */}
        <div className="mt-4">
          <span className="font-semibold">Operation Number</span>
          <Input
            className='text-base'
            value={currentOperation?.opNo}
            onChange={(e) => setCurrentOperation({ ...currentOperation, opNo: e.target.value })}
            placeholder="Enter Operation Number" disabled={isAddOperation ? false : true}
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
      </Modal>
    </div>
  );
};

export default JobOperationsTable;
