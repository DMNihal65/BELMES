import React, { useState, useEffect } from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip, Modal, message } from 'antd';
import { EyeOutlined, MenuOutlined, SwapOutlined } from '@ant-design/icons';
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
import { CSS } from '@dnd-kit/utilities';
import useOrderStore from '../../store/order-store';
import Row from './Row';

const ReorderableTable = ({ orders, onOrdersReorder }) => {
  const [localOrders, setLocalOrders] = useState([]);
  const { swapOrderPriority, fetchAllOrders } = useOrderStore();

  // Initialize and update local orders when props change
  useEffect(() => {
    const ordersWithIds = orders.map((order, index) => ({
      ...order,
      id: (index + 1).toString(),
    }));
    setLocalOrders(ordersWithIds);
  }, [orders]);

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
      title: '',
      key: 'drag',
      width: 50,
      fixed: 'left',
      render: () => (
        <MenuOutlined
          className="text-gray-400 cursor-move"
          style={{ cursor: 'move' }}
        />
      ),
    },
    {
      title: 'SI.No',
      key: 'serialNumber',
      width: 70,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
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
    // }
  ];

  const onDragEnd = async ({ active, over }) => {
    if (active.id !== over?.id) {
      const activeIndex = localOrders.findIndex(i => i.id === active.id);
      const overIndex = localOrders.findIndex(i => i.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        try {
          const activeOrder = localOrders[activeIndex];
          const overOrder = localOrders[overIndex];

          // Make sure we have the production orders
          if (!activeOrder.production_order || !overOrder.production_order) {
            throw new Error('Missing production order numbers');
          }

          await swapOrderPriority(
            activeOrder.production_order,  // Use production_order
            overOrder.production_order,    // Use production_order
            activeIndex + 1,              // Position as priority
            overIndex + 1                 // Position as priority
          );

          // Refresh orders after successful swap
          await fetchAllOrders();
          message.success('Orders reordered successfully');
        } catch (error) {
          message.error('Failed to reorder: ' + error.message);
        }
      }
    }
  };

  return (
    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={localOrders.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            components={{
              body: {
                row: Row,
              },
            }}
            columns={columns}
            dataSource={localOrders}
            rowKey="id"
            pagination={false}
            rowClassName={(record) =>
              record.project?.priority === 1 ? 'bg-red-50' : ''
            }
            scroll={{ y: 480 }}
            size="middle"
          />
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ReorderableTable;