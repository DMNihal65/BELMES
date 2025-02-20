import React, { useEffect, useState } from 'react';
import useMachineMaintenanceStore from '../../../store/maintenance';
import { format } from 'date-fns';
import { Table, Switch, Select, Card, Button, Form, Space, Row, Col, DatePicker, Tag, Input } from 'antd';
import { ToolOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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

  const isEditing = (record) => record.machine_make === editingKey;

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
    setEditingKey(record.machine_make);
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
        status_id: values.status_id === '1' ? 1 : 2,
        available_from: dayjs(values.available_from).utc().format(),
        description: description || '' // Ensure description is never undefined or null
      };
      
      console.log('Saving with data:', formattedData); // Add logging to verify data
      
      await updateMachineStatus(record.id, formattedData);
      setEditingKey('');
      setCurrentStatus('');
      form.resetFields();
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
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
    <div className="p-6">
      <div className="mb-6">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Machine Name" style={{ marginBottom: 0 }}>
              <Select
                style={{ width: '100%' }}
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
          <Col span={8}>
            <Form.Item label="Status" style={{ marginBottom: 0 }}>
              <Select
                style={{ width: '100%' }}
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

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <div className="flex items-center">
              <ToolOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              <div>
                <div className="text-sm text-gray-500">Total Machines</div>
                <div className="text-lg font-semibold">{totalMachines}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div className="flex items-center">
              <CheckCircleOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#52c41a' }} />
              <div>
                <div className="text-sm text-gray-500">Active Machines</div>
                <div className="text-lg font-semibold">
                  {machines.filter(m => m.status_name === 'ON').length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div className="flex items-center">
              <CloseCircleOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#ff4d4f' }} />
              <div>
                <div className="text-sm text-gray-500">Inactive Machines</div>
                <div className="text-lg font-semibold">
                  {machines.filter(m => m.status_name === 'OFF').length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Form form={form} component={false}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="machine_make"
          onChange={handleTableChange}
          pagination={tableParams.pagination}
          size="middle"
          bordered
          scroll={{ x: 800 }}
        />
      </Form>
    </div>
  );
}
