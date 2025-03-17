import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Select, message, Tabs, Badge, Space, Tag } from 'antd';
import useMachineMaintenanceStore from '../../../store/maintenance';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

function MachineMaintenance() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchText, setSearchText] = useState('');
  
  const { 
    machines, 
    statuses, 
    loading, 
    error,
    notifications,
    fetchOperatorMachineStatuses, 
    fetchAvailableStatuses,
    requestMachineStatusChange,
    fetchNotifications,
    updateNotificationStatus
  } = useMachineMaintenanceStore();

  useEffect(() => {
    // Initial fetch
    fetchOperatorMachineStatuses();
    fetchAvailableStatuses();
    fetchNotifications();

    // Set up intervals for automatic updates every minute
    const machineStatusInterval = setInterval(() => {
      fetchOperatorMachineStatuses();
    }, 1000);

    const notificationsInterval = setInterval(() => {
      fetchNotifications();
    }, 1000);

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(machineStatusInterval);
      clearInterval(notificationsInterval);
    };
  }, [fetchOperatorMachineStatuses, fetchAvailableStatuses, fetchNotifications]);

  

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine_make',
      key: 'machine_make',
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    // {
    //   title: 'Available From',
    //   dataIndex: 'available_from',
    //   key: 'available_from',
    //   render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    // },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type='primary' onClick={() => handleRequestChange(record)}>
          Request Change
        </Button>
      ),
    },
  ];

  const handleRequestChange = (machine) => {
    setSelectedMachine(machine);
    form.setFieldsValue({
      status_id: statuses.find(s => s.name === machine.status_name)?.id,
      description: machine.description,
      available_from: dayjs(machine.available_from),
    });
    setIsModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      await requestMachineStatusChange(selectedMachine.id, {
        ...values,
        available_from: values.available_from.toISOString(),
      });
      message.success('Status change request submitted for approval');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit status change request');
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredData = machines.filter((record) => {
    const searchValue = searchText.toLowerCase();
    return (
      record.machine_make?.toLowerCase().includes(searchValue) ||
      record.status_name?.toLowerCase().includes(searchValue) ||
      record.description?.toLowerCase().includes(searchValue) ||
      dayjs(record.available_from).format('YYYY-MM-DD HH:mm').toLowerCase().includes(searchValue)
    );
  });

  const notificationColumns = [
    {
      title: 'Status',
      key: 'status',
      width: 80,
      render: (_, record) => (
        <Badge status={record.read ? 'default' : 'processing'} text={record.read ? 'Read' : 'New'} />
      ),
    },
    {
      title: 'Machine ID',
      dataIndex: 'machine_id',
      key: 'machine_id',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        if (!type) return '-';
        return type === 'rejection' ? (
          <Tag color="red">Rejected</Tag>
        ) : (
          <Tag color="green">Approved</Tag>
        );
      },
    },
    {
      title: 'Status Change',
      key: 'status_change',
      render: (_, record) => {
        if (record.type === 'rejection') {
          return record.requested_status ? (
            <Tag color={record.requested_status === 'ON' ? 'green' : 'red'}>
              {record.requested_status}
            </Tag>
          ) : '-';
        }
        return (
          <Space>
            <Tag color={record.old_status === 'ON' ? 'green' : 'red'}>
              {record.old_status || '-'}
            </Tag>
            →
            <Tag color={record.new_status === 'ON' ? 'green' : 'red'}>
              {record.new_status || '-'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description) => description || '-',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => reason || '-',
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => handleMarkAsRead(record.machine_id, record.timestamp)}
          >
            Mark as Read
          </Button>
        </Space>
      ),
    },
  ];

  const handleMarkAsRead = async (machineId, timestamp) => {
    try {
      await updateNotificationStatus(machineId, timestamp, true, false);
      message.success('Notification marked as read');
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      message.error('Failed to mark notification as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (error) {
    return <div>Error: {error}</div>;
  }

  const renderMachineMaintenanceTab = () => (
    <>
      <div className="mb-4">
        <Search
          placeholder="Search in all columns..."
          allowClear
          enterButton
          size="large"
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ maxWidth: 500 }}
        />
      </div>
      <Table 
        dataSource={filteredData} 
        columns={columns} 
        loading={loading}
        rowKey="machine_make"
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} items`,
        }}
      />
    </>
  );

  const renderNotificationsTab = () => (
    <Table 
      dataSource={notifications}
      columns={notificationColumns}
      rowKey={(record) => `${record.machine_id}-${record.timestamp}`}
      pagination={{
        pageSize: 8,
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} notifications`,
      }}
    />
  );

  return (
    <div className="p-6">
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Machine Maintenance" key="1">
            {renderMachineMaintenanceTab()}
          </TabPane>
          <TabPane 
            tab={
              <Badge count={unreadCount} offset={[10, 0]}>
                Notifications
              </Badge>
            } 
            key="2"
          >
            {renderNotificationsTab()}
          </TabPane>
        </Tabs>

        <Modal
          title="Request Status Change"
          open={isModalVisible}
          onOk={handleModalSubmit}
          onCancel={() => setIsModalVisible(false)}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="status_id"
              label="New Status"
              rules={[{ required: true }]}
            >
              <Select>
                {statuses.map(status => (
                  <Option key={status.id} value={status.id}>
                    {status.name} - {status.description}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true }]}
            >
              <Input.TextArea />
            </Form.Item>
            {/* <Form.Item
              name="available_from"
              label="Available From"
              rules={[{ required: true }]}
            >
              <DatePicker showTime />
            </Form.Item> */}
          </Form>
        </Modal>
      </Card>
    </div>
  );
}

export default MachineMaintenance;