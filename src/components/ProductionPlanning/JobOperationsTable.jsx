import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Table, Select, Button, Space, Tag, Tooltip, 
  InputNumber, TimePicker, Popconfirm, Typography, Input, Form 
} from 'antd';
import {
  EditOutlined, DeleteOutlined, SaveOutlined,
  CloseOutlined, FileTextOutlined, PlusOutlined
} from '@ant-design/icons';
import { mockMachines } from '../../data/mockPlanningData';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { v4 as uuidv4 } from 'uuid';

dayjs.extend(customParseFormat);

const { Option } = Select;
const { Text } = Typography;

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? (
    <InputNumber style={{ width: '100%' }} />
  ) : inputType === 'time' ? (
    <TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
  ) : inputType === 'select' ? (
    <Select style={{ width: '100%' }}>
      {mockMachines.map(machine => (
        <Option 
          key={machine.id} 
          value={machine.id}
          disabled={machine.status === 'maintenance'}
        >
          <Space>
            {machine.name}
            <Tag color={machine.status === 'available' ? 'success' : 'warning'}>
              {machine.status}
            </Tag>
          </Space>
        </Option>
      ))}
    </Select>
  ) : inputType === 'multiSelect' ? (
    <Select
      mode="multiple"
      style={{ width: '100%' }}
      placeholder={`Select ${title}`}
      options={
        title === 'Tools' ? 
        [
          { label: 'End Mill Ø10', value: 'end_mill_10' },
          { label: 'Face Mill Ø50', value: 'face_mill_50' },
          { label: 'Drill Ø8', value: 'drill_8' },
          { label: 'Boring Tool', value: 'boring_tool' },
        ] :
        [
          { label: 'Vise', value: 'vise' },
          { label: 'Clamps', value: 'clamps' },
          { label: 'Chuck', value: 'chuck' },
          { label: 'Angle Plate', value: 'angle_plate' },
        ]
      }
    />
  ) : (
    <Input style={{ width: '100%' }} />
  );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const JobOperationsTable = forwardRef(({ jobId, operations, onOperationsChange, onMPPClick }, ref) => {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    setData(operations);
  }, [operations]);

  useImperativeHandle(ref, () => ({
    handleAddOperation: () => {
      const newOperation = {
        key: uuidv4(),
        opNo: `OP${(data.length + 1) * 10}`,
        description: '',
        machine: '',
        cycleTime: null,
        setupTime: null,
        tools: [],
        fixtures: [],
        status: 'pending',
        setupInformation: {
          machineSetup: {},
          toolingSetup: {},
          fixtureSetup: {}
        },
        processParameters: {
          cutting: {},
          feeding: {},
          other: {}
        },
        qualityParameters: {
          measurements: [],
          inspections: []
        },
        documentation: {
          drawings: [],
          instructions: []
        }
      };
      
      const newData = [...data, newOperation];
      setData(newData);
      setEditingKey(newOperation.key);
      onOperationsChange(newData);
    }
  }));

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    const formValues = {
      opNo: record.opNo,
      description: record.description,
      machine: record.machine,
      tools: record.tools || [],
      fixtures: record.fixtures || [],
    };

    // Handle time values
    if (record.cycleTime) {
      const cycleTime = dayjs(record.cycleTime, 'HH:mm:ss', true);
      if (cycleTime.isValid()) {
        formValues.cycleTime = cycleTime;
      }
    }

    if (record.setupTime) {
      const setupTime = dayjs(record.setupTime, 'HH:mm:ss', true);
      if (setupTime.isValid()) {
        formValues.setupTime = setupTime;
      }
    }

    form.setFieldsValue(formValues);
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);
      
      if (index > -1) {
        const item = newData[index];
        const updatedItem = { ...item, ...row };
        
        // Format time values
        if (row.cycleTime) {
          updatedItem.cycleTime = row.cycleTime.format('HH:mm:ss');
        }
        if (row.setupTime) {
          updatedItem.setupTime = row.setupTime.format('HH:mm:ss');
        }
        
        newData.splice(index, 1, updatedItem);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleDelete = (record) => {
    const newOperations = data.filter(item => item.key !== record.key);
    setData(newOperations);
    onOperationsChange(newOperations);
  };

  const columns = [
    {
      title: 'Op. No',
      dataIndex: 'opNo',
      width: 80,
      fixed: 'left',
      editable: true,
      render: (text) => <Text strong>{text}</Text>,
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
      inputType: 'select',
    },
    {
      title: 'Cycle Time',
      dataIndex: 'cycleTime',
      width: 120,
      editable: true,
      inputType: 'time',
      render: (text) => text || '-',
    },
    {
      title: 'Setup Time',
      dataIndex: 'setupTime',
      width: 120,
      editable: true,
      inputType: 'time',
      render: (text) => text || '-',
    },
    {
      title: 'Tools',
      dataIndex: 'tools',
      width: 200,
      editable: true,
      inputType: 'multiSelect',
      render: (tools) => (
        <Space wrap>
          {(tools || []).map(tool => (
            <Tag key={tool} color="blue">{tool}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Fixtures',
      dataIndex: 'fixtures',
      width: 200,
      editable: true,
      inputType: 'multiSelect',
      render: (fixtures) => (
        <Space wrap>
          {(fixtures || []).map(fixture => (
            <Tag key={fixture} color="purple">{fixture}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => save(record.key)}
              style={{ marginRight: 8 }}
            >
              Save
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={cancel}
            >
              Cancel
            </Button>
          </Space>
        ) : (
          <Space>
            <Tooltip title="View MPP Details">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                onClick={() => onMPPClick(record)}
                className="text-blue-600 hover:text-blue-800"
              />
            </Tooltip>
            <Tooltip title="Edit Operation">
              <Button
                type="text"
                disabled={editingKey !== ''}
                icon={<EditOutlined />}
                onClick={() => edit(record)}
                className="text-green-600 hover:text-green-800"
              />
            </Tooltip>
            <Tooltip title="Delete Operation">
              <Popconfirm
                title="Delete Operation"
                description="Are you sure you want to delete this operation?"
                onConfirm={() => handleDelete(record)}
                okText="Yes"
                cancelText="No"
                placement="left"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.inputType || 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: cancel,
          pageSize: 5,
          total: data.length,
          showTotal: (total) => `Total ${total} operations`,
          showSizeChanger: false,
          showQuickJumper: true,
          position: ['bottomRight']
        }}
        scroll={{ x: 'max-content' }}
      />
    </Form>
  );
});

JobOperationsTable.displayName = 'JobOperationsTable';

export default JobOperationsTable;