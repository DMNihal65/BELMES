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

const ReorderableTable = ({ orders = [] }) => {
  const [localOrders, setLocalOrders] = useState([]);
  const { swapOrderPriority } = useOrderStore();
  const [swapConfirmation, setSwapConfirmation] = useState({
    visible: false,
    order1: null,
    order2: null,
    position1: null,
    position2: null
  });

  useEffect(() => {
    if (!Array.isArray(orders) || localOrders.length > 0) {
      return;
    }

    // Sort orders by priority only on initial load
    const sortedOrders = [...orders].sort((a, b) => {
      const priorityA = a.project?.priority || a.priority || 999;
      const priorityB = b.project?.priority || b.priority || 999;
      return priorityA - priorityB;
    });

    setLocalOrders(sortedOrders);
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
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: 150,
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: 150,
    },
    {
      title: 'Material Description',
      dataIndex: 'part_description',
      key: 'part_description',
      width: 200,
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Target: {record.required_quantity || 0}</div>
          <div className="text-xs text-gray-500">
            Launched: {record.launched_quantity || 0}
          </div>
        </div>
      ),
    },
    {
      title: 'WBS Element',
      dataIndex: 'wbs_element',
      key: 'wbs_element',
      width: 250,
    },
    {
      title: 'Sales Order',
      dataIndex: 'sale_order',
      key: 'sale_order',
      width: 150,
    },
    {
      title: 'Project',
      key: 'project',
      width: 200,
      render: (_, record) => (
        <div>
          {record.project?.name || record.project_name}
          <div>
            <Tag color="blue">Priority: {record.project?.priority || record.priority || 'N/A'}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <div className="flex items-center">
          <span className="mr-2">•</span>
          <span>PENDING</span>
        </div>
      ),
    }
  ];

  // Helper function to determine tag color based on priority
  const getTagColor = (priority) => {
    switch (priority) {
      case 1:
        return 'red';
      case 2:
        return 'orange';
      case 3:
        return 'yellow';
      case 4:
        return 'blue';
      case 5:
        return 'cyan';
      default:
        return 'default';
    }
  };

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = localOrders.findIndex(i => i.id === active.id);
      const newIndex = localOrders.findIndex(i => i.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const activeOrder = localOrders[oldIndex];
        const overOrder = localOrders[newIndex];

        setSwapConfirmation({
          visible: true,
          order1: activeOrder,
          order2: overOrder,
          position1: oldIndex + 1,
          position2: newIndex + 1
        });
      }
    }
  };

  const handleSwapConfirm = async () => {
    try {
      const { order1, order2, position1, position2 } = swapConfirmation;
      
      // Create a new array by removing the dragged item and inserting it at the new position
      let newOrders = [...localOrders];
      const [draggedItem] = newOrders.splice(position1 - 1, 1);
      newOrders.splice(position2 - 1, 0, draggedItem);

      // Update priorities based on new positions
      newOrders = newOrders.map((order, index) => {
        return {
          ...order,
          project: {
            ...order.project,
            priority: index + 1
          },
          priority: index + 1
        };
      });

      // Update the local state first for immediate UI feedback
      setLocalOrders(newOrders);

      // Then try to update the backend
      try {
        await swapOrderPriority(
          order1.production_order,
          order2.production_order,
          position1,
          position2
        );
        message.success('Orders reordered successfully');
      } catch (error) {
        // If backend update fails, keep the UI change but show error
        message.warning('Order display updated locally only. Server sync failed: ' + error.message);
      }
    } catch (error) {
      message.error('Failed to reorder: ' + error.message);
    } finally {
      setSwapConfirmation({ visible: false, order1: null, order2: null, position1: null, position2: null });
    }
  };

  return (
    <>
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
              rowKey={record => record.id || record.production_order}
              pagination={false}
              rowClassName={(record) => {
                const priority = record.project?.priority;
                if (priority === 1) return 'bg-red-50';
                if (priority === 2) return 'bg-orange-50';
                if (priority === 3) return 'bg-yellow-50';
                return '';
              }}
              scroll={{ y: 480 }}
              size="middle"
              onChange={(pagination, filters, sorter) => {
                if (sorter.field === 'project') {
                  console.log('Project column sorted:', sorter.order);
                }
              }}
            />
          </SortableContext>
        </DndContext>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <SwapOutlined className="text-blue-500" />
            <span>Confirm Priority Change</span>
          </div>
        }
        open={swapConfirmation.visible}
        onOk={handleSwapConfirm}
        onCancel={() => setSwapConfirmation({ visible: false, order1: null, order2: null })}
        footer={[
          <Button key="cancel" onClick={() => setSwapConfirmation({ visible: false, order1: null, order2: null })}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSwapConfirm}>
            Yes, Change Priority
          </Button>
        ]}
        width={400}
        className="position-swap-modal"
      >
        <p className="text-gray-600 mb-6">Are you sure you want to change the priority of these orders?</p>
        
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600 mb-2">From Position</div>
            <div className="text-2xl font-semibold mb-4">{swapConfirmation.position1}</div>
            
            <div className="text-gray-600 text-sm mb-1">Production Order</div>
            <div className="font-medium mb-3">{swapConfirmation.order1?.production_order}</div>
            
            <div className="text-gray-600 text-sm mb-1">Part Number</div>
            <div className="font-medium">{swapConfirmation.order1?.part_number}</div>
          </div>

          <div className="bg-blue-100 rounded-full p-2">
            <SwapOutlined className="text-blue-500 text-lg" rotate={90} />
          </div>

          <div className="flex-1 bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600 mb-2">To Position</div>
            <div className="text-2xl font-semibold mb-4">{swapConfirmation.position2}</div>
            
            <div className="text-gray-600 text-sm mb-1">Production Order</div>
            <div className="font-medium mb-3">{swapConfirmation.order2?.production_order}</div>
            
            <div className="text-gray-600 text-sm mb-1">Part Number</div>
            <div className="font-medium">{swapConfirmation.order2?.part_number}</div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 p-3 rounded-lg text-sm text-gray-600">
          This action will update the priority of these orders while maintaining the priority of all other orders.
        </div>
      </Modal>
    </>
  );
};

ReorderableTable.defaultProps = {
  orders: [],
  onRefresh: () => {}
};

export default ReorderableTable;