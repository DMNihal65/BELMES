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

const ReorderableTable = ({ orders = [], onOrdersReorder }) => {
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
    if (!Array.isArray(orders)) {
      console.warn('Orders prop is not an array:', orders);
      setLocalOrders([]);
      return;
    }

    const ordersWithIds = orders.map(order => ({
      ...order,
      key: order.id || order.production_order || Math.random().toString(),
      id: order.id || order.production_order || Math.random().toString()
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
          <Tag color={getTagColor(record.project?.priority)}>
            Priority: {record.project?.priority}
          </Tag>
        </div>
      ),
      sorter: (a, b) => {
        // Sort by priority number
        const priorityA = a.project?.priority || Infinity;
        const priorityB = b.project?.priority || Infinity;
        return priorityA - priorityB;
      },
      defaultSortOrder: 'ascend', // Start with ascending sort
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
      const activeIndex = localOrders.findIndex(i => i.id === active.id);
      const overIndex = localOrders.findIndex(i => i.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const activeOrder = localOrders[activeIndex];
        const overOrder = localOrders[overIndex];

        setSwapConfirmation({
          visible: true,
          order1: activeOrder,
          order2: overOrder,
          position1: activeIndex + 1,
          position2: overIndex + 1
        });
      }
    }
  };

  const handleSwapConfirm = async () => {
    const { order1, order2, position1, position2 } = swapConfirmation;
    
    try {
      if (!order1.production_order || !order2.production_order) {
        throw new Error('Missing production order numbers');
      }

      // Create new array with swapped items
      const newOrders = [...localOrders];
      const activeIndex = position1 - 1;
      const overIndex = position2 - 1;
      const temp = newOrders[activeIndex];
      newOrders[activeIndex] = newOrders[overIndex];
      newOrders[overIndex] = temp;

      // Update local state immediately to prevent flickering
      setLocalOrders(newOrders);

      // Call API to update priorities
      const result = await swapOrderPriority(
        order1.production_order,
        order2.production_order,
        position1,
        position2
      );

      if (result.updated_priorities) {
        // Update priorities based on API response
        const updatedOrders = newOrders.map(order => {
          const updatedPriority = result.updated_priorities.find(
            up => up.project_id === order.project?.id
          );
          if (updatedPriority) {
            return {
              ...order,
              project: {
                ...order.project,
                priority: updatedPriority.priority,
              }
            };
          }
          return order;
        });

        setLocalOrders(updatedOrders);
        onOrdersReorder(updatedOrders);
        message.success('Orders reordered successfully');
      }
    } catch (error) {
      // Revert the local state if there's an error
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
          <div className="flex items-center gap-2 text-lg">
            <SwapOutlined className="text-blue-500" />
            <span>Confirm Position Swap</span>
          </div>
        }
        open={swapConfirmation.visible}
        onOk={handleSwapConfirm}
        onCancel={() => setSwapConfirmation({ visible: false, order1: null, order2: null })}
        okText="Yes, Swap Positions"
        cancelText="Cancel"
        okButtonProps={{ 
          className: 'bg-blue-500 hover:bg-blue-600',
          size: 'large'
        }}
        cancelButtonProps={{ size: 'large' }}
        width={500}
        centered
      >
        <div className="py-4">
          <p className="text-gray-600 text-base mb-6">
            Are you sure you want to swap the following orders?
          </p>
          
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-2">
                <span className="text-sm text-gray-500">From Position</span>
                <p className="text-lg font-semibold text-gray-800">
                  {swapConfirmation.position1}
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Production Order</span>
                  <p className="font-medium text-gray-800">
                    {swapConfirmation.order1?.production_order}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Part Number</span>
                  <p className="font-medium text-gray-800">
                    {swapConfirmation.order1?.part_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <SwapOutlined className="text-blue-500 text-lg" rotate={90} />
              </div>
            </div>

            <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-2">
                <span className="text-sm text-gray-500">To Position</span>
                <p className="text-lg font-semibold text-gray-800">
                  {swapConfirmation.position2}
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Production Order</span>
                  <p className="font-medium text-gray-800">
                    {swapConfirmation.order2?.production_order}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Part Number</span>
                  <p className="font-medium text-gray-800">
                    {swapConfirmation.order2?.part_number}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
            This action will swap the positions of these orders while maintaining the positions of all other orders.
          </p>
        </div>
      </Modal>
    </>
  );
};

ReorderableTable.defaultProps = {
  orders: [],
  onOrdersReorder: () => {}
};

export default ReorderableTable;