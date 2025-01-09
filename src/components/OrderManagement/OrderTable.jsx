
import React from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { message } from 'antd';

const OrderTable = ({ orders }) => {
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
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate),
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
    // {
    //   title: 'Priority',
    //   key: 'priority',
    //   render: (_, record) => {
    //     const priority = record.project?.priority;
    //     let displayPriority = 'normal';
    //     let tagColor = 'blue';

    //     if (priority === 1) {
    //       displayPriority = 'high';
    //       tagColor = 'red';
    //     } else if (priority === 2) {
    //       displayPriority = 'medium';
    //       tagColor = 'orange';
    //     } else if (priority === 3) {
    //       displayPriority = 'low';
    //       tagColor = 'blue';
    //     }

    //     return (
    //       <Tag color={tagColor}>
    //         {displayPriority.toUpperCase()}
    //       </Tag>
    //     );
    //   },
    //   filters: [
    //     { text: 'High', value: 1 },
    //     { text: 'Medium', value: 2 },
    //     { text: 'Low', value: 3 },
    //   ],
    //   onFilter: (value, record) => record.project?.priority === value,
    // },
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