import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Select, message } from 'antd';
import useMachineMaintenanceStore from '../../../store/maintenance';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

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
    fetchOperatorMachineStatuses, 
    fetchAvailableStatuses,
    requestMachineStatusChange 
  } = useMachineMaintenanceStore();

  useEffect(() => {
    fetchOperatorMachineStatuses();
    fetchAvailableStatuses();
  }, []);

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

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <Card title="Machine Maintenance">
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