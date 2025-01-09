import React from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { message } from 'antd';
import dayjs from 'dayjs';

const OrderTable = ({ orders, onRefresh }) => {

    // Add useEffect for initial load and polling
    React.useEffect(() => {
      // Initial load
      if (onRefresh) {
        onRefresh();
      }
  
      // Set up polling every 30 seconds
      const intervalId = setInterval(() => {
        if (onRefresh) {
          onRefresh();
        }
      }, 10000);
  
      return () => clearInterval(intervalId);
    }, [onRefresh]);

  // Handle view action
  const handleViewDetails = (record) => {
    message.info(`Viewing details for order ${record.orderNumber}`);
    // Implement view logic
  };

  const columns = [
    {
      title: 'SI.No',
      key: 'serialNumber',
      render: (_, __, index) => index + 1,
      width: 70,
      fixed: 'left',
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      sorter: (a, b) => a.part_number.localeCompare(b.part_number),
      searchable: true,
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      render: (text) => <a>{text}</a>,
      sorter: (a, b) => a.production_order.localeCompare(b.production_order),
    },
    {
      title: 'Material Description',
      dataIndex: 'part_description',
      key: 'part_description',
      render: (text) => (
        <div className="font-medium">{text}</div>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => (
        <div>
          <div>Target: {record.required_quantity}</div>
          <div className="text-xs text-gray-500">
            Launched: {record.launched_quantity || 0}
          </div>
        </div>
      ),
      sorter: (a, b) => a.required_quantity - b.required_quantity,
    },
    {
      title: 'WBS Element',
      dataIndex: 'wbs_element',
      key: 'wbs_element',
    },
    {
      title: 'Sales Order',
      dataIndex: 'sale_order',
      key: 'sale_order',
    },
    {
      title: 'Project',
      key: 'project',
      render: (_, record) => (
        <div>
          <div>{record.project?.name}</div>
          <Tag color={record.project?.priority === 1 ? 'red' : 'blue'}>
            Priority: {record.project?.priority}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate', // Ensure this matches the transformed field
      key: 'deliveryDate',
      render: (date) => date ? dayjs(date).format('MM/DD/YYYY') : 'N/A',
      sorter: (a, b) => {
        const dateA = a.deliveryDate ? dayjs(a.deliveryDate).unix() : 0;
        const dateB = b.deliveryDate ? dayjs(b.deliveryDate).unix() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = record.status || 'pending';
        const statusColors = {
          in_progress: 'processing',
          completed: 'success',
          delayed: 'error',
          pending: 'default'
        };
        return (
          <Badge
            status={statusColors[status]}
            text={status.replace('_', ' ').toUpperCase()}
          />
        );
      },
      filters: [
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Delayed', value: 'delayed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={orders}
      rowKey="id"
      scroll={{ x: 1300, y: 'calc(100vh - 460px)' }}
      rowClassName={(record) =>
        record.project?.priority === 1 ? 'bg-red-50' : ''
      }
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `Total ${total} orders`,
        position: ['bottomCenter']
      }}
    />
  );
};

export default OrderTable;

