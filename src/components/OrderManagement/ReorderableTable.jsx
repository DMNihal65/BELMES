import React, { useState, useEffect } from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip, Modal } from 'antd';
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

// Separate SortableRow component
const SortableRow = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: props['data-row-key']
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

const ReorderableTable = ({ orders, onOrdersReorder }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [swapDetails, setSwapDetails] = useState(null);
  const [localOrders, setLocalOrders] = useState([]);

  // Initialize and update local orders when props change
  useEffect(() => {
    const ordersWithIds = orders.map((order, index) => ({
      ...order,
      id: order.id || `${index}`,
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

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const activeIndex = localOrders.findIndex(i => i.id === active.id);
      const overIndex = localOrders.findIndex(i => i.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // Create new array with only the swapped items changed
        const newData = [...localOrders];
        const temp = newData[activeIndex];
        newData[activeIndex] = newData[overIndex];
        newData[overIndex] = temp;

        // Store swap details for modal
        setSwapDetails({
          from: {
            position: activeIndex + 1,
            order: localOrders[activeIndex].production_order,
            partNumber: localOrders[activeIndex].part_number
          },
          to: {
            position: overIndex + 1,
            order: localOrders[overIndex].production_order,
            partNumber: localOrders[overIndex].part_number
          }
        });

        setPendingChanges(newData);
        setIsModalVisible(true);
      }
    }
  };

  const handleConfirmReorder = () => {
    if (pendingChanges) {
      setLocalOrders(pendingChanges);
      onOrdersReorder(pendingChanges);
      setPendingChanges(null);
      setSwapDetails(null);
    }
    setIsModalVisible(false);
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
                row: SortableRow,
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

        <Modal
          title={
            <Space>
              <SwapOutlined />
              Confirm Position Swap
            </Space>
          }
          open={isModalVisible}
          onOk={handleConfirmReorder}
          onCancel={() => {
            setIsModalVisible(false);
            setPendingChanges(null);
            setSwapDetails(null);
          }}
          okText="Yes, Swap Positions"
          cancelText="Cancel"
        >
          {swapDetails && (
            <div>
              <p>Are you sure you want to swap the following orders?</p>
              <div className="bg-gray-50 p-4 rounded-md my-3">
                <div className="flex items-center gap-2 mb-3">
                  <div>
                    <div className="font-medium">From Position {swapDetails.from.position}</div>
                    <div>PO: {swapDetails.from.order}</div>
                    <div className="text-gray-500">Part: {swapDetails.from.partNumber}</div>
                  </div>
                  <SwapOutlined className="mx-4 text-blue-500" />
                  <div>
                    <div className="font-medium">To Position {swapDetails.to.position}</div>
                    <div>PO: {swapDetails.to.order}</div>
                    <div className="text-gray-500">Part: {swapDetails.to.partNumber}</div>
                  </div>
                </div>
              </div>
              <p className="text-gray-500">
                This action will swap the positions of these orders while maintaining the positions of all other orders.
              </p>
            </div>
          )}
        </Modal>
      </DndContext>
    </div>
  );
};

export default ReorderableTable;