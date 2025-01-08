import React from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const OrderTable = ({ orders, onReorder, showReorderButton = false, isReorderList = false }) => {
  // Define status colors
  const statusColors = {
    in_progress: 'blue',
    pending: 'orange',
    completed: 'green',
    delayed: 'red'
  };

  // Define priority colors
  const priorityColors = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  };

  // Define columns before using them
  const columns = [
    {
      title: 'SI.No',
      key: 'serialNumber',
      render: (_, __, index) => index + 1,
      width: 70,
      fixed: 'left',
    },
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <a>{text}</a>,
      sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
    },
    {
      title: 'Part Number',
      dataIndex: 'partNumber',
      key: 'partNumber',
      sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
    },
    {
      title: 'Material Description',
      dataIndex: 'materialDescription',
      key: 'materialDescription',
      ellipsis: true,
    },
    {
      title: 'Target Qty',
      dataIndex: 'targetQuantity',
      key: 'targetQuantity',
      sorter: (a, b) => a.targetQuantity - b.targetQuantity,
    },
    {
      title: 'Launched Qty',
      dataIndex: 'launchedQuantity',
      key: 'launchedQuantity',
      sorter: (a, b) => a.launchedQuantity - b.launchedQuantity,
    },
    {
      title: 'Plant',
      dataIndex: 'plant',
      key: 'plant',
      filters: [
        { text: 'Plant-01', value: 'Plant-01' },
        { text: 'Plant-02', value: 'Plant-02' },
        { text: 'Plant-03', value: 'Plant-03' },
      ],
      onFilter: (value, record) => record.plant === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Pending', value: 'pending' },
        { text: 'Completed', value: 'completed' },
        { text: 'Delayed', value: 'delayed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priorityColors[priority]}>
          {priority.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      sorter: (a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate),
    }
  ];

  // Add reorder button column if needed
  if (showReorderButton && !isReorderList) {
    columns.push({
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => onReorder(record)}
            type="primary"
          >
            Reorder
          </Button>
        </Space>
      ),
    });
  }

  return (
    <Table
      columns={columns}
      dataSource={orders}
      scroll={{ x: 1300 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
    />
  );
};

export default OrderTable;