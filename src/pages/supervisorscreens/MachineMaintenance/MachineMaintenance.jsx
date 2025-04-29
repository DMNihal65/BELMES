import React, { useEffect, useState } from 'react';
import useMachineMaintenanceStore from '../../../store/maintenance';
import { format } from 'date-fns';
import { Table, Switch, Select, Card, Button, Form, Space, Row, Col, DatePicker, Tag, Input, Typography  } from 'antd';
import { ToolOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

export default function MachineMaintenance() {
  const {
    machines,
    totalMachines,
    statuses,
    loading,
    error,
    fetchMachineStatuses,
    fetchAvailableStatuses,
    updateMachineStatus
  } = useMachineMaintenanceStore();

  const [editingKey, setEditingKey] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form] = Form.useForm();
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => `Total ${total} items`,
    },
  });
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    fetchMachineStatuses();
    fetchAvailableStatuses();
  }, []);

  const isEditing = (record) => record.machine_id === editingKey;

  const edit = (record) => {
    const availableFrom = record.available_from ? dayjs(record.available_from) : dayjs();
    const statusId = record.status_name === 'ON' ? '1' : '2';
    setCurrentStatus(statusId);
    form.setFieldsValue({
      status_id: statusId,
      available_from: availableFrom,
      machine_make: record.machine_make,
      description: record.description
    });
    setEditingKey(record.machine_id);
  };

  const handleStatusChange = (checked) => {
    const newStatusId = checked ? '1' : '2';
    setCurrentStatus(newStatusId);
    form.setFieldsValue({ status_id: newStatusId });
  };

  const cancel = () => {
    setEditingKey('');
    setCurrentStatus('');
    form.resetFields();
  };

  const save = async (record) => {
    try {
      const values = await form.validateFields();
      const description = values.description?.trim();
      
      const formattedData = {
        machine_id: record.machine_id,
        status_id: values.status_id === '1' ? 1 : 2,
        available_from: dayjs(values.available_from).utc().format(),
        description: description || '' // Ensure description is never undefined or null
      };
      
      console.log('Sending request data:', formattedData); // Log the request data
      
      // Use the machine_id from the record to update the status
      await updateMachineStatus(record.machine_id, formattedData); // Ensure record.machine_id is used
      setEditingKey('');
      setCurrentStatus('');
      form.resetFields();
      
      // Show success toast
      toast.success('Machine status updated successfully!');


      
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
      // Show error toast
      toast.error('Failed to update machine status. Please try again.');
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sorter,
    });
  };

  const columns = [
    // {
    //   title: 'Machine ID',
    //   dataIndex: 'machine_id', // Add this line
    //   key: 'machine_id', // Add this line
    //   width: '15%', // Adjust width as needed
    // },
    {
      title: 'Machine Name',
      dataIndex: 'machine_make',
      key: 'machine_make',
      sorter: (a, b) => a.machine_make.localeCompare(b.machine_make),
      width: '20%',
    },
    {
      title: 'Available From',
      dataIndex: 'available_from',
      key: 'available_from',
      sorter: (a, b) => new Date(a.available_from) - new Date(b.available_from),
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="available_from"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Please select date and time!' }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm:ss' }}
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              allowClear={false}
            />
          </Form.Item>
        ) : (
          format(new Date(record.available_from), 'dd/MM/yyyy HH:mm')
        );
      },
      width: '35%',
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      width: '20%',
      render: (_, record) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <Form.Item
              name="status_id"
              style={{ margin: 0 }}
              rules={[{ required: true, message: 'Please select status!' }]}
            >
              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentStatus === '1'}
                  onChange={handleStatusChange}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
                <Tag color={currentStatus === '1' ? 'success' : 'error'}>
                  {currentStatus === '1' ? 'ON' : 'OFF'}
                </Tag>
              </div>
            </Form.Item>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <Tag color={record.status_name === 'ON' ? 'success' : 'error'}>
              {record.status_name}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Remarks',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="description"
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: 'Please enter a remarks',
                transform: (value) => value?.trim()
              }
            ]}
          >
            <Input.TextArea
              rows={2}
              placeholder="Enter remarks"
              maxLength={200}
              defaultValue={record.description || ''}
            />
          </Form.Item>
        ) : (
          <span>{record.description || '-'}</span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button 
              type="primary" 
              onClick={() => save(record)} 
              size="small"
              loading={loading}
            >
              Save
            </Button>
            <Button onClick={cancel} size="small">
              Cancel
            </Button>
          </Space>
        ) : (
          <Button
            type="primary"
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            size="small"
          >
            Edit
          </Button>
        );
      },
      align: 'center',
    }
  ];

  const filteredData = machines.filter(machine => {
    const matchesMachine = !filterMachine || machine.machine_make === filterMachine;
    const matchesStatus = !filterStatus || machine.status_name === filterStatus;
    return matchesMachine && matchesStatus;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full ">
      {/* Toast Container */}
      <ToastContainer />
      <Title className="text-xl font-semibold text-gray-800" level={3} style={{ margin: 8}}>Assests Availability</Title>
      <div className="mb-6">
      <div className="bg-white p-4 rounded-xl shadow-md">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label={<span className="font-medium text-gray-700">Machine Name</span>} className="mb-0">
              <Select
                className="w-full"
                value={filterMachine}
                onChange={setFilterMachine}
                placeholder="Select machine"
                allowClear
              >
                <Select.Option value="">All Machines</Select.Option>
                {machines.map((machine) => (
                  <Select.Option key={machine.machine_make} value={machine.machine_make}>
                    {machine.machine_make}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Form.Item label={<span className="font-medium text-gray-700">Status</span>} className="mb-0">
              <Select
                className="w-full"
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Select status"
                allowClear
              >
                <Select.Option value="">All Status</Select.Option>
                {statuses.map((status) => (
                  <Select.Option key={status.id} value={status.name}>
                    {status.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>

      </div>

      <Row gutter={[16, 16]} className="mb-6">
  {/* Total Machines */}
  <Col xs={24} sm={12} md={12} lg={8}>
    <Card
      hoverable
      bodyStyle={{ padding: '16px' }}
      style={{
        background: 'rgba(24, 144, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(24, 144, 255, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)',
            boxShadow: '0 4px 8px rgba(24, 144, 255, 0.2)',
          }}
        >
          <ToolOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
        </div>
        <div className="flex-1">
          <Text style={{ fontSize: '14px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
            Total Machines
          </Text>
          <div className="flex items-end justify-between">
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {totalMachines}
            </Title>
            <Text style={{ fontSize: '12px', color: '#1890ff' }}>Total</Text>
          </div>
        </div>
      </div>
    </Card>
  </Col>

  {/* Active Machines */}
  <Col xs={24} sm={12} md={12} lg={8}>
    <Card
      hoverable
      bodyStyle={{ padding: '16px' }}
      style={{
        background: 'rgba(82, 196, 26, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(82, 196, 26, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #52c41a 0%, #b7eb8f 100%)',
            boxShadow: '0 4px 8px rgba(82, 196, 26, 0.2)',
          }}
        >
          <CheckCircleOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
        </div>
        <div className="flex-1">
          <Text style={{ fontSize: '14px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
            Active Machines
          </Text>
          <div className="flex items-end justify-between">
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              {machines.filter(m => m.status_name === 'ON').length}
            </Title>
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>Running</Text>
          </div>
        </div>
      </div>
    </Card>
  </Col>

  {/* Inactive Machines */}
  <Col xs={24} sm={12} md={12} lg={8}>
    <Card
      hoverable
      bodyStyle={{ padding: '16px' }}
      style={{
        background: 'rgba(255, 77, 79, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 77, 79, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ff4d4f 0%, #ffa39e 100%)',
            boxShadow: '0 4px 8px rgba(255, 77, 79, 0.2)',
          }}
        >
          <CloseCircleOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
        </div>
        <div className="flex-1">
          <Text style={{ fontSize: '14px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
            Inactive Machines
          </Text>
          <div className="flex items-end justify-between">
            <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
              {machines.filter(m => m.status_name === 'OFF').length}
            </Title>
            <Text style={{ fontSize: '12px', color: '#ff4d4f' }}>Down</Text>
          </div>
        </div>
      </div>
    </Card>
  </Col>
</Row>


      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100">
      <Form form={form} component={false}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="machine_id"
          onChange={handleTableChange}
          pagination={{
            ...tableParams.pagination,
            pageSize: 7,
            responsive: true,
            position: ['bottomCenter']
          }}
          size="middle"
          bordered
          scroll={{ x: 'max-content' }}
          className="responsive-table"
        />
      </Form>
      </div>
    </div>
  );
}
