import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Input, message, Form } from 'antd';
import useMachineMaintenanceStore from '../../../store/maintenance';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

const OperatorRequests = () => {
  const [searchText, setSearchText] = useState('');
  const { 
    operatorPendingRequests, 
    fetchOperatorPendingRequests, 
    approveOperatorRequest, 
    rejectOperatorRequest,
    loading 
  } = useMachineMaintenanceStore();

  const [form] = Form.useForm();

  useEffect(() => {
    // Initial fetch
    fetchOperatorPendingRequests();

    // Set up interval for automatic updates every minute
    const intervalId = setInterval(() => {
      fetchOperatorPendingRequests();
    }, 1000); // 10000 ms = 1 minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchOperatorPendingRequests]);

  const handleApprove = async (machineId) => {
    try {
      await approveOperatorRequest(machineId);
      message.success('Request approved successfully');
    } catch (error) {
      message.error('Failed to approve request');
    }
  };

  const handleReject = (machineId) => {
    Modal.confirm({
      title: 'Reject Request',
      content: (
        <Input.TextArea 
          placeholder="Enter reason for rejection"
          id="rejectionReason"
        />
      ),
      onOk: async () => {
        const reason = document.getElementById('rejectionReason').value;
        if (!reason) {
          message.error('Please provide a reason for rejection');
          return;
        }
        try {
          await rejectOperatorRequest(machineId, reason);
          message.success('Request rejected successfully');
        } catch (error) {
          message.error('Failed to reject request');
        }
      }
    });
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => confirm()}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
  });

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredData = searchText
    ? operatorPendingRequests.filter((record) =>
        Object.values(record).some(
          (val) =>
            val &&
            val.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      )
    : operatorPendingRequests;

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine_make',
      key: 'machine_make',
      ...getColumnSearchProps('machine_make'),
    },
    {
      title: 'Current Status',
      dataIndex: 'current_status',
      key: 'current_status',
      ...getColumnSearchProps('current_status'),
    },
    {
      title: 'Current Description',
      dataIndex: 'current_description',
      key: 'current_description',
      ...getColumnSearchProps('current_description'),
    },
    {
      title: 'Requested Status',
      dataIndex: 'requested_status',
      key: 'requested_status',
      ...getColumnSearchProps('requested_status'),
    },
    {
      title: 'Requested Description',
      dataIndex: 'requested_description',
      key: 'requested_description',
      ...getColumnSearchProps('requested_description'),
    },
    {
      title: 'Requested At',
      dataIndex: 'requested_at',
      key: 'requested_at',
      render: (text) => new Date(text).toLocaleString(),
      ...getColumnSearchProps('requested_at'),
    },
    {
      title: 'Available From',
      dataIndex: 'available_from',
      key: 'available_from',
      render: (text) => new Date(text).toLocaleString(),
      ...getColumnSearchProps('available_from'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <div className="space-x-2">
          <Button type="primary" onClick={() => handleApprove(record.machine_id)}>
            Approve
          </Button>
          <Button danger onClick={() => handleReject(record.machine_id)}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-4">
        <Search
          placeholder="Search in all columns..."
          allowClear
          enterButton
          size="large"
          onSearch={handleSearch}
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          style={{ maxWidth: '300px', width: '100%' }}
       
        />
      </div>

      <Form form={form} component={false}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          size="middle"
          bordered
          scroll={{ x: 'max-content' }}
          className="responsive-table"
          pagination={{
            position: ['bottomCenter'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            pageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            responsive: true
          }}
        />
      </Form>
    </div>
  );
};

export default OperatorRequests; 