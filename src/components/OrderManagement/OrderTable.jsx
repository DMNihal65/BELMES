import React, { useState, useRef } from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip, Modal, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, MenuOutlined, SwapOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './OrderTable.css';

const { Title, Text } = Typography;

const OrderTable = ({ orders, onReorder, showReorderButton = false, isReorderList = false }) => {
  const [dataSource, setDataSource] = useState(orders);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [tempDataSource, setTempDataSource] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const dragItem = useRef();
  const dragOverItem = useRef();

  // Update dataSource when orders prop changes
  React.useEffect(() => {
    setDataSource(orders);
  }, [orders]);

  const handleDragStart = (e, position) => {
    dragItem.current = position;
    setDraggedIndex(position);
    // Add dragging class to row
    e.target.closest('tr').classList.add('dragging');
    // Show helper message
    message.info({
      content: 'Drag to reorder production schedule',
      duration: 1,
      style: {
        marginTop: '50px',
      },
    });
  };

  const handleDragEnter = (e, position) => {
    e.preventDefault();
    dragOverItem.current = position;
    setDragOverIndex(position);

    // Remove drag-over class from all rows and add to current
    const rows = document.querySelectorAll('.draggable-row');
    rows.forEach(row => row.classList.remove('drag-over'));
    e.target.closest('tr').classList.add('drag-over');

    // Update temporary data order
    const listItems = [...dataSource];
    const dragItemContent = listItems[dragItem.current];
    listItems.splice(dragItem.current, 1);
    listItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = dragOverItem.current;
    setTempDataSource(listItems);
  };

  const handleDragEnd = (e) => {
    const fromIndex = draggedIndex + 1;
    const toIndex = dragOverIndex + 1;
    
    // Show confirmation modal
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    // Apply the changes
    if (tempDataSource) {
      setDataSource(tempDataSource);
      message.success({
        content: 'Production schedule has been reordered successfully',
        icon: <SwapOutlined style={{ color: '#52c41a' }} />,
        duration: 3,
      });
    }
    setIsModalVisible(false);
    resetDragState();
  };

  const handleModalCancel = () => {
    // Revert the changes
    setIsModalVisible(false);
    resetDragState();
    message.info('Reorder cancelled');
  };

  const resetDragState = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTempDataSource(null);
    // Remove dragging and drag-over classes from all rows
    const rows = document.querySelectorAll('.draggable-row');
    rows.forEach(row => {
      row.classList.remove('dragging', 'drag-over');
    });
  };

  // Handle actions
  const handleViewDetails = (record) => {
    message.info(`Viewing details for order ${record.orderNumber}`);
  };

  const handleEditOrder = (record) => {
    message.info(`Editing order ${record.orderNumber}`);
  };

  const handleDeleteOrder = (record) => {
    message.warning(`Deleting order ${record.orderNumber}`);
  };

  const handleReorder = (record) => {
    if (onReorder) {
      onReorder(record);
    }
  };

  const baseColumns = [
    isReorderList && {
      title: '',
      dataIndex: 'sort',
      width: 50,
      className: 'drag-handle',
      render: () => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />,
    },
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <a>{text}</a>,
      sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
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
        <Tag color={record.priority === 'high' ? 'red' : record.priority === 'medium' ? 'orange' : 'blue'}>
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
      width: 180,
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
          {showReorderButton && (
            <Tooltip title="Reorder">
              <Button 
                icon={<ReloadOutlined />} 
                size="small"
                onClick={() => handleReorder(record)}
              />
            </Tooltip>
          )}
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
  ].filter(Boolean);

  // Add Sl.No column for reorder list
  const columns = isReorderList ? [
    {
      title: 'Sl.No',
      key: 'slNo',
      width: 70,
      className: 'serial-number',
      render: (_, __, index) => {
        return {
          props: {
            className: 'serial-number',
          },
          children: index + 1
        };
      },
    },
    ...baseColumns
  ] : baseColumns;

  return (
    <>
      {isReorderList && (
        <div className="reorder-helper">
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <Text type="secondary">Drag rows to reorder the production schedule. Changes will be confirmed before applying.</Text>
        </div>
      )}

      <Table 
        columns={columns}
        dataSource={dataSource}
        rowKey="orderNumber"
        scroll={{ x: 1300 }}
        size="middle"
        className={`shadow-sm ${isReorderList ? 'reorder-table' : ''}`}
        pagination={{
          total: dataSource.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
        onRow={isReorderList ? (record, index) => ({
          draggable: true,
          className: `draggable-row ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`,
          onDragStart: (e) => handleDragStart(e, index),
          onDragEnter: (e) => handleDragEnter(e, index),
          onDragOver: (e) => e.preventDefault(),
          onDragEnd: handleDragEnd,
        }) : undefined}
      />

      <Modal
        title={
          <div className="modal-title">
            <SwapOutlined className="modal-icon" />
            <Title level={4} style={{ margin: 0 }}>Confirm Production Schedule Reorder</Title>
          </div>
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        centered
        okText="Confirm Reorder"
        cancelText="Cancel"
        className="reorder-modal"
      >
        <div className="modal-content">
          <div className="modal-description">
            Are you sure you want to reorder the production schedule?
          </div>
          
          <div className="move-details">
            <div className="detail-item">
              <Badge status="processing" text="From Position" />
              <Text strong>{draggedIndex + 1}</Text>
            </div>
            <SwapOutlined className="swap-icon" />
            <div className="detail-item">
              <Badge status="success" text="To Position" />
              <Text strong>{dragOverIndex + 1}</Text>
            </div>
          </div>

          <div className="order-info">
            <Text type="secondary">Order Number:</Text>
            <Text strong>{tempDataSource?.[dragOverIndex]?.orderNumber}</Text>
          </div>

          <div className="changes-summary">
            <Title level={5}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Changes to be made:
            </Title>
            <ul>
              <li>Serial numbers will be updated automatically</li>
              <li>Production schedule order will be modified</li>
              <li>All other order details will remain unchanged</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OrderTable;