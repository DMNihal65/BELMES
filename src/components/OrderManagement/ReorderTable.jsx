import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Tooltip, Badge, Modal, message } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DragOutlined 
} from '@ant-design/icons';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DraggableReorderTable = ({ orders: initialOrders }) => {
  const [orders, setOrders] = useState(initialOrders);
  const [tempOrders, setTempOrders] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Handle view, edit, delete actions
  const handleViewDetails = (record) => {
    message.info(`Viewing details for order ${record.orderNumber}`);
  };

  const handleEditOrder = (record) => {
    message.info(`Editing order ${record.orderNumber}`);
  };

  const handleDeleteOrder = (record) => {
    message.warning(`Deleting order ${record.orderNumber}`);
  };

  // Handle row dragging with confirmation
  const moveRow = (dragIndex, hoverIndex) => {
    const dragRow = orders[dragIndex];
    const newOrders = [...orders];
    newOrders.splice(dragIndex, 1);
    newOrders.splice(hoverIndex, 0, dragRow);
    setTempOrders(newOrders);
    setIsModalOpen(true);
  };

  // Handle confirmation modal actions
  const handleReschedule = () => {
    setOrders(tempOrders);
    setIsModalOpen(false);
    navigate('/supervisor/production-planning/scheduling');
  };

  const handleCancel = () => {
    setTempOrders(null);
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: '',
      dataIndex: 'sort',
      width: 30,
      className: 'drag-visible',
      render: () => <DragOutlined style={{ cursor: 'move', color: '#999' }} />
    },
    {
        title: 'Sl No',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        render: (_, __, index) => <span>{index + 1}</span>, // Added Serial Number column
      },
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
    },
    {
      title: 'Material',
      dataIndex: 'materialNumber',
      key: 'materialNumber',
      render: (text, record) => (
        <>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.materialDescription}</div>
        </>
      ),
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
        <>
          <div>Target: {record.targetQuantity}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Launched: {record.launchedQuantity || 0}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${Math.min((record.launchedQuantity / record.targetQuantity) * 100, 100)}%` 
              }} 
            />
          </div>
        </>
      ),
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
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Badge 
          status={record.status === 'in_progress' ? 'processing' : 
                 record.status === 'completed' ? 'success' : 'error'} 
          text={record.status.replace('_', ' ').toUpperCase()} 
        />
      ),
    },
    
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '24px' }}>
        <Table 
          columns={columns} 
          dataSource={orders}
          rowKey="orderNumber"
          components={{
            body: {
              row: DraggableTableRow
            }
          }}
          onRow={(record, index) => ({
            index,
            moveRow,
            className: record.priority === 'high' ? 'high-priority-row' : ''
          })}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} orders`
          }}
        />

        <Modal
          title="Order Sequence Changed"
          open={isModalOpen}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button key="reschedule" type="primary" onClick={handleReschedule}>
              Reschedule
            </Button>
          ]}
        >
          <p>The order sequence has been changed. Would you like to reschedule the production plan?</p>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            • Clicking "Reschedule" will take you to the scheduling page to update the production schedule
            <br />
            • Clicking "Cancel" will revert the order sequence to its previous state
          </p>
        </Modal>
      </div>
    </DndProvider>
  );
};

// Draggable row component
const DraggableTableRow = ({ index, moveRow, className, style, ...restProps }) => {
  const ref = React.useRef(null);
  
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: 'DraggableTableRow',
    collect: monitor => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: 'drop-over-row'
      };
    },
    drop: item => {
      moveRow(item.index, index);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'DraggableTableRow',
    item: { index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drop(drag(ref));

  return (
    <tr
      ref={ref}
      className={`
        ${className}
        ${isOver ? dropClassName : ''}
        ${isDragging ? 'dragging-row' : ''}
      `}
      style={{ cursor: 'move', ...style }}
      {...restProps}
    />
  );
};

const styles = `
.high-priority-row {
  background-color: #fff1f0;
}

.drop-over-row {
  background-color: #e6f7ff;
}

.dragging-row {
  opacity: 0.5;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-top: 4px;
}

.progress-bar-fill {
  height: 100%;
  background-color: #1890ff;
  border-radius: 4px;
  transition: width 0.3s ease;
}
`;

export default DraggableReorderTable;