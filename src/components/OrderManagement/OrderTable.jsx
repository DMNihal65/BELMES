import React, { useState } from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { message } from 'antd';
import dayjs from 'dayjs';
import useOrderStore from '../../store/order-store';

const OrderTable = ({ orders, onRefresh }) => {
  const { deleteOrder } = useOrderStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingOrder, setDeletingOrder] = useState(null);

  // Add useEffect for initial load and polling
  React.useEffect(() => {
    // Initial load
    if (onRefresh) {
      onRefresh();
    }

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [onRefresh]);

  // Handle delete action
  const handleDelete = async (record) => {
    try {
      setDeletingOrder(record.id);
      await deleteOrder(record.id);
      message.success(`Order ${record.production_order} deleted successfully`);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      message.error('Failed to delete order: ' + error.message);
    } finally {
      setDeletingOrder(null);
    }
  };

  const columns = [
    {
      title: 'Sl.No',
      key: 'serialNumber',
      width: 80,
      render: (_, __, index) => {
        // Calculate serial number based on current page
        return ((currentPage - 1) * pageSize) + index + 1;
      },
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
          <Tag color={getPriorityColor(record.project?.priority)}>
            Priority: {record.project?.priority || 'N/A'}
          </Tag>
        </div>
      ),
      sorter: (a, b) => {
        const priorityA = a.project?.priority || 999;
        const priorityB = b.project?.priority || 999;
        return priorityA - priorityB;
      },
      defaultSortOrder: 'ascend', // Sort by priority by default
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
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Delete Order">
          <Popconfirm
            title="Are you sure you want to delete this order?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deletingOrder === record.id}
            />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  // Helper function to determine priority tag color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'red';
      case 2:
        return 'orange';
      case 3:
        return 'yellow';
      case 4:
        return 'blue';
      default:
        return 'default';
    }
  };

  // Sort orders by priority before rendering
  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => {
      const priorityA = a.project?.priority || 999;
      const priorityB = b.project?.priority || 999;
      return priorityA - priorityB;
    });
  }, [orders]);

  return (
    <Table
      columns={columns}
      dataSource={sortedOrders} // Use sorted orders
      rowKey="id"
      scroll={{ 
        x: 1800, 
        y: 'calc(100vh - 420px)'
      }}
      pagination={{
        pageSize: pageSize,
        position: ['bottomCenter'],
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
        onChange: (page, newPageSize) => {
          setCurrentPage(page);
          if (pageSize !== newPageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }
        },
        style: { 
          marginBottom: '8px',
          marginTop: '8px'
        }
      }}
      size="middle"
      bordered
      rowClassName={(record) => {
        const priority = record.project?.priority;
        if (priority === 1) return 'bg-red-50';
        if (priority === 2) return 'bg-orange-50';
        if (priority === 3) return 'bg-yellow-50';
        return '';
      }}
    />
  );
};

export default OrderTable;

