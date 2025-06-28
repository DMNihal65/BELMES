import React, { useEffect, useState } from 'react';
import useMachineMaintenanceStore from '../../../store/maintenance';
import { format } from 'date-fns';
import { Table, Switch, Card, Button, Form, Space, Row, Col, DatePicker, Tag, Input, Dropdown, Menu, Typography, Statistic } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, FilterOutlined, AppstoreOutlined, ReloadOutlined, PoweroffOutlined, DesktopOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';
import shopAnimation from '../../../assets/assets.json';
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
    const availableTo = record.available_to ? dayjs(record.available_to) : dayjs();
    const statusId = record.status_name === 'ON' ? '1' : '2';
    setCurrentStatus(statusId);
    form.setFieldsValue({
      status_id: statusId,
      available_from: availableFrom,
      available_to: availableTo,
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
        available_from: dayjs(values.available_from).format('YYYY-MM-DDTHH:mm:ss'),
        description: description || '' // Ensure description is never undefined or null
      };

      if (formattedData.status_id === 2 && values.available_to) {
        formattedData.available_to = dayjs(values.available_to).format('YYYY-MM-DDTHH:mm:ss');
      } else if (formattedData.status_id === 1) {
        formattedData.available_to = formattedData.available_from;
      }
      
      console.log('Sending request data:', formattedData); // Log the request data
      
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
    //   dataIndex: 'machine_id',
    //   key: 'machine_id',
    //   width: '15%',
    // },
    {
      title: 'Machine Name',
      dataIndex: 'machine_make',
      key: 'machine_make',
      sorter: (a, b) => a.machine_make.localeCompare(b.machine_make),
      width: '20%',
    },
    {
      title: 'From',
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
      width: '15%',
    },
    {
      title: 'To',
      dataIndex: 'available_to',
      key: 'available_to',
      sorter: (a, b) => {
        if (!a.available_to && !b.available_to) return 0;
        if (!a.available_to) return 1;
        if (!b.available_to) return -1;
        return new Date(a.available_to) - new Date(b.available_to);
      },
      render: (_, record) => {
        const editable = isEditing(record);
        if (editable) {
          if (currentStatus === '2') { 
            return (
              <Form.Item
                name="available_to"
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
            );
          }
          return null;
        }
        return record.status_name === 'OFF' && record.available_to 
          ? format(new Date(record.available_to), 'dd/MM/yyyy HH:mm') 
          : '-';
      },
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      width: '10%',
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
      width: '10%',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button 
              type="primary" 
              onClick={() => save(record)} 
              size="small"
              loading={loading}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Save
            </Button>
            <Button onClick={cancel} size="small" className="bg-red-500 hover:bg-red-600 text-white">
              Cancel
            </Button>
          </Space>
        ) : (
          <Button
            type="primary"
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            size="small"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Edit
          </Button>
        );
      },
      align: 'center',
    }
  ];

  const filteredData = machines
    .filter(machine => machine.machine_make !== 'Default') // Filter out machines with name "Default"
    .filter(machine => {
      const matchesMachine = !filterMachine || machine.machine_make.toLowerCase().includes(filterMachine.toLowerCase());
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
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 bg-fixed">
      <ToastContainer position="top-right" theme="colored" />
      <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-indigo-100">
        <Row>
          <Col xs={24}>
            <div className="flex flex-wrap items-center justify-between">
              {/* LEFT SIDE: Title & Icon */}
              <div className="flex items-center mb-2 md:mb-0">
                
                  <Lottie 
                    animationData={shopAnimation}
                    style={{ width: 55, height: 55 }}
                    loop={true}
                    autoplay={true}
                  />
               
                <div>
                  <Title level={3} className="text-2xl font-bold m-0 text-gray-800">ASSETS AVAILABILITY</Title>
                  <p className="text-sm text-indigo-600 m-0">Real-time machine status and maintenance overview</p>
                </div>
              </div>
              {/* RIGHT SIDE: Filters */}
              <Space size="middle" wrap>
                <Form.Item label={<span className="font-medium text-gray-700">Machine Name</span>} className="mb-0">
                  <Dropdown
                    overlay={
                      <Menu onClick={(e) => setFilterMachine(e.key)} className="rounded-xl shadow-lg p-1">
                        <Menu.Item key="" icon={<AppstoreOutlined style={{ color: '#4f46e5' }} />} className="rounded-lg">
                          <span className="font-medium">All Machines</span>
                        </Menu.Item>
                        <Menu.Divider />
                        {[...new Set(machines
                          .filter(machine => machine.machine_make !== 'Default') // Filter out Default machines from dropdown
                          .map(machine => machine.machine_make))].map(machineMake => (
                          <Menu.Item key={machineMake} className="rounded-lg">
                            <span className="font-medium">{machineMake}</span>
                          </Menu.Item>
                        ))}
                      </Menu>
                    }
                    trigger={['click']}
                  >
                    <Button 
                      icon={<SearchOutlined />} 
                      className={`rounded-xl ${filterMachine !== '' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : ''} hover:shadow-md transition-all duration-300`}
                    >
                      <span className="font-medium">{filterMachine === '' ? 'All Machines' : filterMachine}</span>
                    </Button>
                  </Dropdown>
                </Form.Item>

                <Form.Item label={<span className="font-medium text-gray-700">Status</span>} className="mb-0">
                  <Dropdown
                    overlay={
                      <Menu onClick={(e) => setFilterStatus(e.key)} className="rounded-xl shadow-lg p-1">
                        <Menu.Item key="" icon={<AppstoreOutlined style={{ color: '#4f46e5' }} />} className="rounded-lg">
                          <span className="font-medium">All Statuses</span>
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item key="ON" icon={<CheckCircleOutlined style={{ color: '#10b981' }} />} className="rounded-lg">
                          <span className="font-medium">ON</span>
                        </Menu.Item>
                        <Menu.Item key="OFF" icon={<PoweroffOutlined style={{ color: '#64748b' }} />} className="rounded-lg">
                          <span className="font-medium">OFF</span>
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={['click']}
                  >
                    <Button 
                      icon={<FilterOutlined />} 
                      className={`rounded-xl ${filterStatus !== '' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : ''} hover:shadow-md transition-all duration-300`}
                    >
                      <span className="font-medium">{filterStatus === '' ? 'All Statuses' : filterStatus}</span>
                    </Button>
                  </Dropdown>
                </Form.Item>

                <Button
                  onClick={() => {
                    setFilterMachine('');
                    setFilterStatus('');
                    fetchMachineStatuses();
                  }}
                  className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                  icon={<ReloadOutlined />}
                >
                  Reset Filters
                </Button>
              </Space>
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-3 mt-5">
          {/* Total Machines */}
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card 
              className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-indigo-50 to-blue-100 hover:scale-[1.02] overflow-hidden"
              bodyStyle={{ padding: '20px', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
                <DesktopOutlined className="text-7xl text-indigo-600" />
              </div>
              <Statistic 
                title={<span className="text-indigo-600 font-medium text-base flex items-center gap-2">
                  <DesktopOutlined className="text-indigo-700" /> Total Machines
                </span>} 
                value={machines.filter(machine => machine.machine_make !== 'Default').length} 
                valueStyle={{ color: '#4338ca', fontWeight: 700, fontSize: '28px' }}
                suffix={<span className="text-xs text-indigo-400 ml-1">Machines</span>}
              />
            </Card>
          </Col>

          {/* Active Machines */}
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card 
              className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-green-50 to-emerald-100 hover:scale-[1.02] overflow-hidden"
              bodyStyle={{ padding: '20px', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
                <CheckCircleOutlined className="text-7xl text-green-600" />
              </div>
              <Statistic 
                title={<span className="text-green-800 font-medium text-base flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-600" /> Active Machines
                </span>} 
                value={machines.filter(m => m.machine_make !== 'Default' && m.status_name === 'ON').length}
                valueStyle={{ color: '#16a34a', fontWeight: 700, fontSize: '28px' }}
                suffix={<span className="text-xs text-green-400 ml-1">Machines</span>}
              />
            </Card>
          </Col>

          {/* Inactive Machines */}
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card 
              className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-red-50 to-rose-100 hover:scale-[1.02] overflow-hidden"
              bodyStyle={{ padding: '20px', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
                <CloseCircleOutlined className="text-7xl text-red-600" />
              </div>
              <Statistic 
                title={<span className="text-red-800 font-medium text-base flex items-center gap-2">
                  <CloseCircleOutlined className="text-red-600" /> Inactive Machines
                </span>} 
                value={machines.filter(m => m.machine_make !== 'Default' && m.status_name === 'OFF').length}
                valueStyle={{ color: '#dc2626', fontWeight: 700, fontSize: '28px' }}
                suffix={<span className="text-xs text-red-400 ml-1">Machines</span>}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-indigo-600"
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          padding: '24px',
        }}
      >
        <Form form={form} component={false}>
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey="machine_id"
            onChange={handleTableChange}
            pagination={{
              ...tableParams.pagination,
              responsive: true,
              position: ['bottomCenter'],
            }}
            size="middle"
            bordered
            scroll={{ x: 'max-content' }}
            className="responsive-table custom-machine-maintenance-table"
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          />
        </Form>
      </div>
    </div>
  );
}






//testing











// fghf