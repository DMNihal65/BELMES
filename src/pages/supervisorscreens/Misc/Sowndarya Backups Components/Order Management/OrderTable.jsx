import React from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { message } from 'antd';

const OrderTable = ({ orders }) => {
  // Handle actions
  const handleViewDetails = (record) => {
    message.info(`Viewing details for order ${record.orderNumber}`);
    // Implement view logic
  };

  const handleEditOrder = (record) => {
    message.info(`Editing order ${record.orderNumber}`);
    // Implement edit logic
  };

  const handleDeleteOrder = (record) => {
    message.warning(`Deleting order ${record.orderNumber}`);
    // Implement delete logic
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <span>{text}</span>,
      sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
      filters: [
        // Add unique order numbers for filtering
        ...new Set(orders.map(order => ({ text: order.orderNumber, value: order.orderNumber })))
      ],
      onFilter: (value, record) => record.orderNumber === value,
    },
    {
      title: 'Material',
      dataIndex: 'materialNumber',
      key: 'materialNumber',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.materialDescription}</div>
        </div>
      ),
      sorter: (a, b) => a.materialNumber.localeCompare(b.materialNumber),
    },
    {
      title: 'Part Number',
      dataIndex: 'partNumber',
      key: 'partNumber',
      render: (text) => <span>{text}</span>,
      sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
      filters: [
        // Add unique part numbers for filtering
        ...new Set(orders.map(order => ({ text: order.partNumber, value: order.partNumber })))
      ],
      onFilter: (value, record) => record.partNumber === value,
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => (
        <div>
          <div>Target: {record.targetQuantity}</div>
          <div className="text-xs text-gray-500">
            Launched: {record.launchedQuantity || 0}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ 
                width: `${(record.launchedQuantity / record.targetQuantity) * 100}%` 
              }}
            />
          </div>
        </div>
      ),
      sorter: (a, b) => a.targetQuantity - b.targetQuantity,
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
      title: 'WBS Element',
      dataIndex: 'wbsElement',
      key: 'wbsElement',
    },
    {
      title: 'Sales Order',
      dataIndex: 'salesOrderNumber',
      key: 'salesOrderNumber',
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const statusColors = {
          in_progress: 'processing',
          completed: 'success',
          delayed: 'error',
        };
        return (
          <Badge 
            status={statusColors[record.status]} 
            text={record.status.replace('_', ' ').toUpperCase()} 
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
      title: 'Priority',
      key: 'priority',
      render: (_, record) => (
        <Tag color={record.priority === 'high' ? 'red' : 'blue'}>
          {record.priority.toUpperCase()}
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
      title: 'Actions',
      key: 'actions',
      width: 150,
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
          <Tooltip title="Edit Order">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditOrder(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Order">
            <Button 
              icon={<DeleteOutlined />} 
              size="small"
              danger
              onClick={() => handleDeleteOrder(record)}
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
      rowKey="key"
      scroll={{ x: 1300 }}
      rowClassName={(record) => 
        record.priority === 'high' ? 'bg-red-50' : ''
      }
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `Total ${total} orders`,
      }}
    />
  );
};

export default OrderTable; 