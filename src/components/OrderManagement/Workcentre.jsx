import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Select, 
  message,
  DatePicker,
  Typography
} from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useWorkcentreStore from '../../store/workcentre-store';

const { Option } = Select;
const { Title, Text } = Typography;

const Workcentre = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [data, setData] = useState([]);
  const [selectedWorkcentre, setSelectedWorkcentre] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  const { 
    fetchWorkcentres, 
    updateWorkcentre, 
    workcentres, 
    isLoading,
    workcentreCodes,
    machineNames
  } = useWorkcentreStore();

  useEffect(() => {
    fetchWorkcentres();
  }, [fetchWorkcentres]);

  useEffect(() => {
    setData(workcentres);
  }, [workcentres]);

  const isEditing = (record) => record.work_centre_id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      ...record,
      calibration_date: record.calibration_date ? dayjs(record.calibration_date) : null,
      last_maintenance_date: record.last_maintenance_date ? dayjs(record.last_maintenance_date) : null,
    });
    setEditingKey(record.work_centre_id);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const updatedItem = {
        ...row,
        work_centre_id: key,
        calibration_date: row.calibration_date?.format('YYYY-MM-DD'),
        last_maintenance_date: row.last_maintenance_date?.format('YYYY-MM-DD'),
      };

      console.log('Updating workcentre with data:', updatedItem);

      await updateWorkcentre(updatedItem);
      setEditingKey('');
      message.success('Record updated successfully');
    } catch (errInfo) {
      console.error('Save failed:', errInfo);
      message.error('Failed to update record');
    }
  };

  const columns = [
    {
      title: 'Workcentre ID',
      dataIndex: 'work_centre_id',
      width: 120,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="work_centre_id" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
    },
    {
      title: 'Workcentre Code',
      dataIndex: ['work_centre', 'code'],
      width: 150,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name={['work_centre', 'code']} style={{ margin: 0 }}>
          <Select>
            {workcentreCodes.map((code, index) => (
              <Select.Option key={index} value={code}>{code}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      ) : text || '-',
    },
    {
      title: 'Machine Name',
      dataIndex: 'type',
      width: 130,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="type" style={{ margin: 0 }}>
          <Select>
            {machineNames.map((machine, index) => (
              <Select.Option key={index} value={machine}>{machine}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      ) : text,
    },
    {
      title: 'Make',
      dataIndex: 'make',
      width: 130,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="make" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      width: 150,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="model" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
    },
    {
      title: 'Year of Installation',
      dataIndex: 'year_of_installation',
      width: 150,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="year_of_installation" style={{ margin: 0 }}>
          <Input type="number" />
        </Form.Item>
      ) : text,
    },
    {
      title: 'CNC Controller',
      dataIndex: 'cnc_controller',
      width: 150,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="cnc_controller" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
    },
    {
      title: 'Controller Series',
      dataIndex: 'cnc_controller_series',
      width: 150,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="cnc_controller_series" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 200,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="remarks" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
    },
    {
      title: 'Calibration Date',
      dataIndex: 'calibration_date',
      width: 150,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="calibration_date" style={{ margin: 0 }}>
          <DatePicker />
        </Form.Item>
      ) : text ? dayjs(text).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'last_maintenance_date',
      width: 150,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="last_maintenance_date" style={{ margin: 0 }}>
          <DatePicker />
        </Form.Item>
      ) : text ? dayjs(text).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="link"
              icon={<SaveOutlined />}
              onClick={() => save(record.work_centre_id)}
              className="text-green-600 hover:text-green-700"
            >
              Save
            </Button>
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={cancel}
              className="text-red-600 hover:text-red-700"
            >
              Cancel
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              disabled={editingKey !== ''}
              onClick={() => edit(record)}
              className="text-blue-600 hover:text-blue-700"
            >
              Edit
            </Button>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              className="text-gray-600 hover:text-gray-700"
            >
              View
            </Button>
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
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const handleView = (record) => {
    setSelectedWorkcentre(record);
    setIsViewModalVisible(true);
  };

  const handleViewModalOk = () => {
    setIsViewModalVisible(false);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setEditingKey('');
  };

  const getStartId = (pageNumber) => {
    return (pageNumber - 1) * pageSize + 1;
  };

  const handleAddWorkcentre = async () => {
    try {
      const values = await addForm.validateFields();
      const { workcentreCode, machineIds, description, operation } = values;

      const newWorkcentres = machineIds.map((machineId, index) => ({
        id: Math.max(...data.map(item => item.id)) + 1 + index,
        code: workcentreCode,
        machine_id: machineId,
        description,
        operation,
        type: '',
        make: '',
        model: '',
        year_of_installation: '',
        cnc_controller: '',
        cnc_controller_series: '',
        remarks: '',
        callibration_date: null,
        last_maintainance_date: null,
        plant_id: '',
      }));

      const newData = [...data, ...newWorkcentres];
      setData(newData);
      
      message.success('New workcentre(s) added successfully');
      setIsAddModalVisible(false);
      addForm.resetFields();
    } catch (error) {
      console.error('Add failed:', error);
      message.error('Failed to add new workcentre: ' + error.message);
    }
  };

  const addWorkcentreForm = (
    <Form
      form={addForm}
      layout="vertical"
    >
      <Form.Item
        name="workcentreCode"
        label="Workcentre Code"
        rules={[{ required: true, message: 'Please select Workcentre Code' }]}
      >
        <Select placeholder="Select Workcentre Code">
          {workcentres.map(workcentre => (
            <Option key={workcentre.id} value={workcentre.code}>
              {workcentre.code}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="machineIds"
        label="Machine ID"
        rules={[{ required: true, message: 'Please select Machine ID' }]}
      >
        <Select mode="multiple" placeholder="Select Machine IDs">
          <Option value="MCH001">MCH001</Option>
          <Option value="MCH002">MCH002</Option>
          <Option value="MCH003">MCH003</Option>
          <Option value="MCH004">MCH004</Option>
          <Option value="MCH005">MCH005</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter Description' }]}
      >
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item
        name="operation"
        label="Operation"
        rules={[{ required: true, message: 'Please enter Operation' }]}
      >
        <Input />
      </Form.Item>
    </Form>
  );

  return (
    <div className="p-1">
      <div className="flex justify-end mb-4 gap-3">
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalVisible(true)}
        >
          Add Workcentre
        </Button>
      </div>

      <div className="border rounded-lg">
   <Form form={form} component={false}>
          <Table
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            dataSource={data.map((item, index) => ({
              ...item,
              sequential_id: index + 1,
            }))}
            columns={mergedColumns}
            rowClassName={(record) => 
              `${isEditing(record) ? 'bg-blue-50' : 'hover:bg-gray-50'}`
            }
            loading={isLoading}
            pagination={{
              current: currentPage,
              pageSize: 6,
              total: data.length,
              showSizeChanger: false,
              showQuickJumper: true,
              position: ['bottomcentre'],
              showTotal: (total, range) => (
                <span className="text-gray-600">
                  Showing {range[0]}-{range[1]} of {total} items
                </span>
              ),
              onChange: (page) => {
                setCurrentPage(page);
                setEditingKey('');
              }
            }}
            scroll={{ 
              x: 'max-content',
              y: 'calc(100vh - 460px)'
            }}
            sticky
            bordered
            className="ant-table-striped"
            size="middle"
            rowKey="work_centre_id"
          />
        </Form>
      </div>

      <Modal
        title={`Workcentre Details - ${selectedWorkcentre?.work_centre?.code}`}
        visible={isViewModalVisible}
        onOk={handleViewModalOk}
        onCancel={handleViewModalOk}
        width={400}
      >
        {selectedWorkcentre && (
          <Form layout="vertical">
            <Form.Item label="Plant ID">
              <Input value={selectedWorkcentre.work_centre.plant_id} readOnly />
            </Form.Item>
            <Form.Item label="Description">
              <Input.TextArea value={selectedWorkcentre.work_centre.description} readOnly />
            </Form.Item>
            <Form.Item label="Operation">
              <Input value={selectedWorkcentre.work_centre.operation} readOnly />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="Add New Workcentre"
        open={isAddModalVisible}
        onOk={handleAddWorkcentre}
        onCancel={() => {
          setIsAddModalVisible(false);
          addForm.resetFields();
        }}
        width={500}
        className="top-20"
      >
        {addWorkcentreForm}
      </Modal>
    </div>
  );
};

const EditableCell = ({
  editing,
  dataIndex,
  title,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = dataIndex === 'type' ? (
    <Select>
      <Option value="CNC">CNC</Option>
      <Option value="Manual">Manual</Option>
    </Select>
  ) : dataIndex === 'callibration_date' || dataIndex === 'last_maintainance_date' ? (
    <DatePicker />
  ) : (
    <Input />
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

const tableStyles = {
  '.ant-table-cell-fix-left, .ant-table-cell-fix-right': {
    backgroundColor: '#fff',
    boxShadow: '-6px 0 6px -4px rgba(0,0,0,0.15)',
  },
  '.ant-table-cell-fix-left-first': {
    boxShadow: 'none',
  },
  '.ant-table-row-selected .ant-table-cell-fix-left, .ant-table-row-selected .ant-table-cell-fix-right': {
    backgroundColor: '#e6f7ff',
  },
};

export default Workcentre;
