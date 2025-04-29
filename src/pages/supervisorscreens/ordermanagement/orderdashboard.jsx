import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Select, Button, Space, Alert, Tabs, message, Table, Spin, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FilterOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import OrderTable from '../../../components/OrderManagement/OrderTable';
import ReorderableTable from '../../../components/OrderManagement/ReorderableTable';
import CreateOrderModal from '../../../components/OrderManagement/CreateOrderModal';
import useOrderStore from '../../../store/order-store';
import Workcenter from '../../../components/OrderManagement/Workcenter';

const { TabPane } = Tabs;

const OrderDashboard = () => {
  const { 
    orders, 
    fetchAllOrders, 
    fetchTimelineData, 
    timelineData, 
    isLoading, 
    error,
    startPolling,
    stopPolling 
  } = useOrderStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [localOrders, setLocalOrders] = useState([]);
  const [priorityOrders, setPriorityOrders] = useState([]);
  const [parent] = useAutoAnimate();
  const [timelineError, setTimelineError] = useState(null);
  
  // Initialize orders and start polling when component mounts
  useEffect(() => {
    const initializeOrders = async () => {
      try {
        await fetchAllOrders();
        try {
          await fetchTimelineData();
        } catch (timelineError) {
          // Silently handle timeline errors
          console.error('Timeline data fetch failed, continuing without it:', timelineError);
          setTimelineError(timelineError);
        }
      } catch (error) {
        console.error('Failed to initialize order data:', error);
        message.error('Failed to load order data. Please try refreshing the page.');
      }
    };
    
    initializeOrders();
    
    // Start polling with 1-hour interval
    startPolling();

    // Cleanup: stop polling when component unmounts
    return () => stopPolling();
  }, []);

  // Update local state when orders change
  useEffect(() => {
    if (orders && orders.length > 0) {
      const ordersWithPriority = orders.map((order, index) => ({
        ...order,
        priority: index + 1
      }));
      setLocalOrders(ordersWithPriority);
      setPriorityOrders(ordersWithPriority);
    }
  }, [orders]);

  const handleRefresh = useCallback(async () => {
    try {
      await fetchAllOrders();
      try {
        await fetchTimelineData();
      } catch (timelineError) {
        // Silently handle timeline errors
        console.warn('Timeline refresh failed:', timelineError);
        setTimelineError(timelineError);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      // Only show error message for critical failures
      message.error('Failed to refresh data. Please try again.');
    }
  }, [fetchTimelineData, fetchAllOrders]);

  const handleOrderCreate = async (newOrder) => {
    try {
      console.log('New order created:', newOrder);
      
      // Create the new order object with required properties
      const newOrderWithProps = {
        ...newOrder,
        key: newOrder.production_order || newOrder.orderNumber,
        status: 'scheduled',
        priority: (localOrders.length || 0) + 1
      };

      // Update both local and priority orders immediately
      const updatedOrders = [newOrderWithProps, ...localOrders];
      setLocalOrders(updatedOrders);
      setPriorityOrders(updatedOrders);

      // Close modal and show success message
      setIsModalVisible(false);

      // Fetch fresh data in the background
      await handleRefresh();
    } catch (error) {
      console.error('Error creating order:', error);
      message.error('Failed to create order');
    }
  };

  const handlePriorityUpdate = (updatedOrders) => {
    // Update both tables when priority changes
    const ordersWithUpdatedPriority = updatedOrders.map((order, index) => ({
      ...order,
      priority: index + 1
    }));
    setPriorityOrders(ordersWithUpdatedPriority);
    setLocalOrders(ordersWithUpdatedPriority);
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  // Update timeline columns configuration
  const timelineColumns = [
    { 
      title: 'Production Order', 
      dataIndex: 'production_order', 
      key: 'production_order',
      width: 150,
    },
    { 
      title: 'Part Number', 
      dataIndex: 'part_number', 
      key: 'part_number',
      width: 150,
    },
    { 
      title: 'Completed Quantity', 
      dataIndex: 'completed_total_quantity', 
      key: 'completed_total_quantity',
      width: 150,
    },
    { 
      title: 'Operations Count', 
      dataIndex: 'operations_count', 
      key: 'operations_count',
      width: 140,
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status) => (
        <span className={`
          px-2 py-1 rounded-full text-sm
          ${status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
          ${status === 'completed' ? 'bg-green-100 text-green-800' : ''}
          ${status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${!status ? 'bg-gray-100 text-gray-800' : ''}
        `}>
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
        </span>
      ),
    },
  ];
  
  // Render timeline table with error handling
  const renderTimelineTable = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      );
    }
    
    if (timelineError) {
      // Instead of showing error message, just show empty state
      return (
        <Empty 
          description="No timeline data available" 
          className="py-8" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    if (!timelineData || timelineData.length === 0) {
      return (
        <Empty description="No timeline data available" className="py-8" />
      );
    }
    
    return (
      <Table
        dataSource={timelineData}
        columns={timelineColumns}
        rowKey="key"
        size="small"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
      />
    );
  };

  // Filter orders for in-progress tab
  const inProgressOrders = orders.filter(order => order.status === 'in_progress');

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="m-4"
        />
      )}
      
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        {/* Quick Stats Row */}
        <Row gutter={[16, 16]} className="mb-6" ref={parent}></Row>

        {/* Main Content Area - Full Width Order Management */}
        <Row className="flex-1">
          <Col span={24} className="h-full">
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Order Management</span>
                  <Space>
                    {/* <Button icon={<FilterOutlined />} size="small">Filter</Button> */}
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      size="small"
                      onClick={() => setIsModalVisible(true)}
                    >
                      New Order
                    </Button>
                  </Space>
                </div>
              }
              bordered={false}
              className="h-full"
              bodyStyle={{ 
                padding: '12px', 
                height: 'calc(100% - 56px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Tabs 
                defaultActiveKey="all" 
                className="h-full flex flex-col"
                style={{ flex: 1 }}
              >
                <TabPane tab="All Orders" key="all">
                  <div className="h-[calc(100vh-320px)] overflow-auto">
                    <OrderTable 
                      orders={localOrders} 
                      onRefresh={handleRefresh}
                      key={JSON.stringify(localOrders)}
                    />
                  </div>
                </TabPane>
                <TabPane tab="In Progress" key="in_progress">
                  <div className="h-full overflow-auto">
                    {renderTimelineTable()}
                  </div>
                </TabPane>
                <TabPane tab="Completed" key="completed">
                  <div className="h-full overflow-auto">
                    <OrderTable orders={orders.filter(order => order.status === 'completed')} onRefresh={handleRefresh} />
                  </div>
                </TabPane>
                <TabPane tab="Priority" key="priority">
                  <div className="h-full overflow-auto">
                    <ReorderableTable 
                      orders={priorityOrders}
                      onOrdersUpdate={handlePriorityUpdate}
                      key={JSON.stringify(priorityOrders)}
                    />
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>
      <CreateOrderModal 
        visible={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        onCreate={handleOrderCreate}
        onRefresh={handleRefresh} 
      />
    </div>
  );
};

export default OrderDashboard;

