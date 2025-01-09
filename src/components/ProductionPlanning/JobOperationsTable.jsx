import React, { useState } from 'react';
import { 
  Table, Button, Space, Tooltip, Form, Input, 
  Popconfirm, Select, Tag, TimePicker 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, FileTextOutlined, 
  SaveOutlined, PlusOutlined 
} from '@ant-design/icons';
import EditableCell from './EditableCell';
import dayjs from 'dayjs';

const { Option } = Select;

// Mock data for machines
const mockMachines = [
  { id: 'M1', name: 'Machine 1', status: 'available' },
  { id: 'M2', name: 'Machine 2', status: 'maintenance' },
  { id: 'M3', name: 'Machine 3', status: 'available' },
];

// Mock data for tools
const mockTools = [
  { id: 'T1', name: 'Tool 1' },
  { id: 'T2', name: 'Tool 2' },
  { id: 'T3', name: 'Tool 3' },
];

const JobOperationsTable = ({ jobId, onOperationEdit, operations: initialOperations }) => {
  const [form] = Form.useForm();
  const [operations, setOperations] = useState(initialOperations || []);
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...operations];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        setOperations(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
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
      editable: false,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: 200,
      editable: true,
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      width: 180,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="machine"
            style={{ margin: 0 }}
          >
            <Select style={{ width: '100%' }}>
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
          </Form.Item>
        ) : (
          text
        );
      }
    },
    {
      title: 'Cycle Time',
      dataIndex: 'cycleTime',
      width: 120,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="cycleTime"
            style={{ margin: 0 }}
          >
            <TimePicker format="HH:mm:ss" />
          </Form.Item>
        ) : (
          text ? dayjs(text).format('HH:mm:ss') : ''
        );
      }
    },
    {
      title: 'Setup Time',
      dataIndex: 'setupTime',
      width: 120,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="setupTime"
            style={{ margin: 0 }}
          >
            <TimePicker format="HH:mm:ss" />
          </Form.Item>
        ) : (
          text ? dayjs(text).format('HH:mm:ss') : ''
        );
      }
    },
    {
      title: 'Tools',
      dataIndex: 'tools',
      width: 150,
      editable: true,
      render: (tools, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="tools"
            style={{ margin: 0 }}
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select tools"
              maxTagCount="responsive"
            >
              {mockTools.map(tool => (
                <Option key={tool.id} value={tool.id}>
                  {tool.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <Space>
            {(tools || []).map(tool => (
              <Tag key={tool}>{tool}</Tag>
            ))}
          </Space>
        );
      }
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
      render: (_, record) => {
        const editable = isEditing(record);
        return (
          <Space>
            {/* MPP Details button always first */}
            <Tooltip title="Edit MPP Details">
              <Button 
                type="link" 
                icon={<FileTextOutlined />} 
                onClick={() => onOperationEdit(record)}
              />
            </Tooltip>
            
            {/* Edit/Save button */}
            {editable ? (
              <Space>
                <Button 
                  type="link" 
                  icon={<SaveOutlined />}
                  onClick={() => save(record.key)}
                />
                <Button 
                  type="link"
                  onClick={cancel}
                >
                  Cancel
                </Button>
              </Space>
            ) : (
              <Tooltip title="Edit Operation">
                <Button 
                  type="link" 
                  icon={<EditOutlined />}
                  onClick={() => edit(record)}
                />
              </Tooltip>
            )}

            {/* Delete button only shown when not editing */}
            {!editable && (
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
            )}
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <Form form={form} component={false}>
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
              edit(newOperation); // Make new operation editable immediately
            }}
          >
            Add Operation
          </Button>
        </div>

        <Table 
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          columns={mergedColumns} 
          dataSource={operations}
          scroll={{ x: 1500 }}
          pagination={false}
          size="middle"
        />
      </div>
    </Form>
  );
};

export default JobOperationsTable;
