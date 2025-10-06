import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip, Modal, message, Switch, Spin } from 'antd';
import { EyeOutlined, MenuOutlined, SwapOutlined, SwapRightOutlined } from '@ant-design/icons';
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
  const [swapConfirmation, setSwapConfirmation] = useState({
    visible: false,
    order1: null,
    order2: null,
    position1: null,
    position2: null
  });
  const [showScheduled, setShowScheduled] = useState(true); // Set to true by default
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [showHighPriority, setShowHighPriority] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const { swapOrderPriority, fetchScheduledOrders } = useOrderStore();

  // Fetch scheduled orders when the component mounts or when showScheduled changes
  useEffect(() => {
    const loadScheduledOrders = async () => {
      try {
        if (showScheduled) {
          setIsLoadingScheduled(true);
          const scheduled = await fetchScheduledOrders();
          console.log('Fetched scheduled orders:', scheduled);
          setScheduledOrders(scheduled);
        } else {
          // Reset scheduled orders when toggle is off
          setScheduledOrders([]);
        }
      } catch (error) {
        console.error('Error loading scheduled orders:', error);
        message.error('Failed to load scheduled orders');
      } finally {
        setIsLoadingScheduled(false);
      }
    };

    loadScheduledOrders();
  }, [fetchScheduledOrders, showScheduled]);

  // Filter and sort orders based on the toggle state
  useEffect(() => {
    if (!Array.isArray(orders)) return;

    let filteredOrders = [...orders];
    
    // If showing scheduled orders
    if (showScheduled) {
      if (scheduledOrders.length > 0) {
        // Create a set of scheduled production order numbers for quick lookup
        const scheduledOrderNumbers = new Set(
          scheduledOrders
            .map(order => order.production_order?.toString())
            .filter(Boolean) // Remove any undefined/null values
        );
        
        console.log('Scheduled order numbers:', Array.from(scheduledOrderNumbers));
        
        // Filter orders to only include those that are in the scheduled orders list
        filteredOrders = filteredOrders.filter(order => {
          const orderNumber = order.production_order?.toString() || order.id?.toString();
          return scheduledOrderNumbers.has(orderNumber);
        });
        
        console.log('Filtered orders:', filteredOrders);
      } else {
        filteredOrders = [];
      }
    }
    
    // First sort by priority
    let sortedAndFiltered = [...filteredOrders].sort((a, b) => {
      const priorityA = a.project?.priority || a.priority || 999;
      const priorityB = b.project?.priority || b.priority || 999;
      return priorityA - priorityB;
    });

    // If high priority is enabled, show only first 15 orders after sorting
    if (showHighPriority && showScheduled) {
      sortedAndFiltered = sortedAndFiltered.slice(0, 15);
    }

    // Reset pagination to first page when switching between scheduled/all orders
    setPagination(prev => ({
      ...prev,
      current: 1
    }));

    setLocalOrders(sortedAndFiltered);
  }, [orders, showScheduled, scheduledOrders, showHighPriority]);

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
      render: (_, record, index) => {
        const currentPage = pagination.current;
        const pageSize = pagination.pageSize;
        const continuousIndex = ((currentPage - 1) * pageSize) + index + 1;
        const priority = showScheduled ? continuousIndex : (record.project?.priority || record.priority);
        const priorityLabel = priority ? `Priority ${priority}` : 'N/A';
        
        return (
          <div>
            <div className="font-medium">{record.project?.name || record.project_name}</div>
            <span 
              className="font-bold text-sm px-3 py-1 mt-1 inline-block"
              style={{
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                cursor: 'default',
                backgroundColor: getPriorityBackgroundColor(priority),
                color: getPriorityTextColor(priority),
                border: '1px solid ' + getPriorityBorderColor(priority)
              }}
            >
              {priorityLabel}
            </span>
          </div>
        );
      },
    },
    // {
    //   title: 'Status',
    //   dataIndex: 'status',
    //   key: 'status',
    //   width: 120,
    //   render: (status) => (
    //     <div className="flex items-center">
    //       <span className="mr-2">•</span>
    //       <span>PENDING</span>
    //     </div>
    //   ),
    // }
  ];

  const getPriorityBackgroundColor = (priority) => {
    switch (priority) {
      case 1: return '#FEE2E2'; // Light red
      case 2: return '#FFEDD5'; // Light orange
      case 3: return '#FEF3C7'; // Light yellow
      case 4: return '#DBEAFE'; // Light blue
      case 5: return '#CCFBF1'; // Light teal
      default: return '#F3F4F6'; // Light gray
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case 1: return '#991B1B'; // Dark red
      case 2: return '#9A3412'; // Dark orange
      case 3: return '#92400E'; // Dark yellow
      case 4: return '#1E40AF'; // Dark blue
      case 5: return '#065F46'; // Dark teal
      default: return '#1F2937'; // Dark gray
    }
  };

  const getPriorityBorderColor = (priority) => {
    // Using text color for border for consistency and good contrast
    return getPriorityTextColor(priority);
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
    <div className="w-full">
      <style jsx>{`
        .priority-pagination .ant-pagination {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 16px 0 !important;
          padding: 8px 0 !important;
          min-height: 48px !important;
        }
        
        .priority-pagination .ant-pagination-item,
        .priority-pagination .ant-pagination-prev,
        .priority-pagination .ant-pagination-next,
        .priority-pagination .ant-pagination-jump-prev,
        .priority-pagination .ant-pagination-jump-next {
          min-width: 32px !important;
          height: 32px !important;
          line-height: 30px !important;
          font-size: 14px !important;
          margin: 0 4px !important;
        }
        
        .priority-pagination .ant-pagination-options {
          margin-left: 16px !important;
        }
        
        .priority-pagination .ant-pagination-total-text {
          font-size: 14px !important;
          color: #666 !important;
          margin-right: 16px !important;
        }
        
        .priority-table .ant-table-pagination {
          margin-top: 16px !important;
          padding: 8px 0 !important;
        }
      `}</style>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-gray-700">
          {showScheduled ? 'Scheduled Orders' : 'All Orders'}
          {!isLoadingScheduled && (
            <span className="ml-2 text-sm text-gray-500">
              ({localOrders.length} {localOrders.length === 1 ? 'order' : 'orders'})
            </span>
          )}
        </div>
        <Space>
          {isLoadingScheduled && <Spin size="small" />}
          {showScheduled && (
            <Button 
              type={showHighPriority ? 'primary' : 'default'}
              onClick={() => setShowHighPriority(!showHighPriority)}
              className={`mr-2 ${showHighPriority ? 'bg-green-500 text-white' : ''}`}
              style={showHighPriority ? { border: '2px solid #166534' } : {}}
            >
              High Priority
            </Button>
          )}
          <span className="text-sm font-medium text-gray-600">Show Scheduled</span>
          <Switch 
            checked={showScheduled}
            onChange={(checked) => {
              setIsLoadingScheduled(true); // Show loading state immediately
              setShowScheduled(checked);
              if (!checked) {
                setShowHighPriority(false);
                setIsLoadingScheduled(false); // Clear loading immediately when switching to all orders
              }
            }}
            checkedChildren="Yes"
            unCheckedChildren="No"
            className={showScheduled ? 'bg-blue-500' : 'bg-gray-300'}
            disabled={isLoadingScheduled} // Prevent multiple clicks while loading
          />
        </Space>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '400px' }}>
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
              rowKey="id"
              columns={columns}
              dataSource={localOrders}
              pagination={{
                ...pagination,
                style: { 
                  margin: '8px 0',
                  fontSize: '10px'
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                pageSizeOptions: ['10', '20', '50', '100'],
                position: ['bottomCenter'],
                size: 'default',
                className: 'priority-pagination',
                style: {
                  marginTop: '16px',
                  padding: '8px 0',
                  fontSize: '14px',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                },
                onShowSizeChange: (current, size) => {
                  setPagination({
                    ...pagination,
                    current: 1,
                    pageSize: size,
                  });
                },
                onChange: (page, pageSize) => {
                  setPagination({
                    ...pagination,
                    current: page,
                    pageSize: pageSize,
                  });
                },
                size: 'small',
                showQuickJumper: false
              }}
              className="text-2xs"
              style={{ 
                fontSize: '10px',
                lineHeight: '1'
              }}
              bordered
              loading={isLoadingScheduled}
              locale={{
                emptyText: showScheduled 
                  ? 'No scheduled orders found' 
                  : 'No orders available'
              }}
              rowClassName={(record) => {
                const priority = record.project?.priority;
                if (priority === 1) return 'bg-red-50';
                if (priority === 2) return 'bg-orange-50';
                if (priority === 3) return 'bg-yellow-50';
                return '';
              }}
              scroll={{ y: 450 }}
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
    </div>
  );
};

ReorderableTable.defaultProps = {
  orders: [],
  onRefresh: () => {}
};

export default ReorderableTable;