import React, { useState } from 'react';
import { Table, Button, Modal, Space, Badge, Tooltip } from 'antd';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MenuOutlined } from '@ant-design/icons';
import { CSS } from '@dnd-kit/utilities';

// Separate SortableRow component
const SortableRow = ({ children, ...props }) => {
  const id = props['data-row-key'];
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: id 
  });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? {
      position: 'relative',
      zIndex: 999,
      background: '#fafafa',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    } : {}),
    cursor: 'move',
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
};

const ReorderableTable = ({ orders = [] }) => {
  // Transform orders to ensure they have the required properties
  const initialData = orders.map(order => ({
    ...order,
    id: order.key || String(Math.random()),
  }));

  const [dataSource, setDataSource] = useState(initialData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const columns = [
    {
      title: 'Sort',
      dataIndex: 'sort',
      width: 30,
      className: 'drag-visible',
      render: () => <MenuOutlined style={{ color: '#999' }} />,
    },
    {
      title: 'SI.No',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      render: (text) => text || '-',
    },
    {
      title: 'Part Number',
      dataIndex: 'partNumber',
      render: (text) => text || '-',
    },
    {
      title: 'Material',
      dataIndex: 'materialNumber',
      render: (text, record) => (
        <div>
          <div>{text || '-'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.materialDescription || '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => (
        <div>
          <div>Target: {record.targetQuantity || 0}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Launched: {record.launchedQuantity || 0}
          </div>
          <div style={{ width: '100%', background: '#f0f0f0', borderRadius: '6px', height: '6px', marginTop: '4px' }}>
            <div
              style={{
                width: `${((record.launchedQuantity || 0) / (record.targetQuantity || 1)) * 100}%`,
                background: '#1890ff',
                height: '100%',
                borderRadius: '6px',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Plant',
      dataIndex: 'plant',
      render: (text) => text || '-',
    },
    {
      title: 'Sales Order',
      dataIndex: 'salesOrderNumber',
      render: (text) => text || '-',
    },
    {
      title: 'WBS Element',
      dataIndex: 'wbsElement',
      render: (text) => text || '-',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      render: (text) => {
        const color = text === 'high' ? 'red' : text === 'medium' ? 'orange' : 'green';
        return <Badge color={color} text={text?.toUpperCase() || '-'} />;
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const statusMap = {
          in_progress: 'processing',
          completed: 'success',
          delayed: 'error',
          pending: 'warning',
        };
        return (
          <Badge
            status={statusMap[record.status] || 'default'}
            text={(record.status || 'pending').replace('_', ' ').toUpperCase()}
          />
        );
      },
    },
  ];

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const activeIndex = dataSource.findIndex(item => item.id === active.id);
      const overIndex = dataSource.findIndex(item => item.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const newData = arrayMove(dataSource, activeIndex, overIndex);
        setPendingChanges(newData);
        setIsModalVisible(true);
      }
    }
  };

  const handleConfirmReorder = () => {
    if (pendingChanges) {
      setDataSource(pendingChanges);
      setPendingChanges(null);
    }
    setIsModalVisible(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={dataSource.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Table
          components={{
            body: {
              row: SortableRow,
            },
          }}
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          onRow={(record) => ({
            'data-row-key': record.id,
            style: {
              backgroundColor: record.priority === 'high' ? '#fff1f0' : undefined,
            },
          })}
        />
      </SortableContext>

      <Modal
        title="Confirm Reorder"
        open={isModalVisible}
        onOk={handleConfirmReorder}
        onCancel={() => {
          setIsModalVisible(false);
          setPendingChanges(null);
        }}
        okText="Yes, Update Order"
        cancelText="Cancel"
      >
        <p>Are you sure you want to change the order sequence?</p>
        <p style={{ color: '#666' }}>This action will update the priority of the orders.</p>
      </Modal>
    </DndContext>
  );
};

export default ReorderableTable;