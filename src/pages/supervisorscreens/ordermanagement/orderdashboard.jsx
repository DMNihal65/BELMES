import React, { useState, useEffect, useCallback } from 'react';
import './orderdashboard.css';
import { Card, Row, Col, Statistic, Select, Button, Space, Alert, Tabs, message, Table, Spin, Empty, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FilterOutlined, MenuOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, AppstoreOutlined, PlayCircleOutlined, PauseCircleOutlined, DisconnectOutlined } from '@ant-design/icons';
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
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  
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
        className="in-progress-table"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
      />
    );
  };

  // Update useEffect to directly test the API call
  useEffect(() => {
    const testCompletionCheck = async () => {
      try {
        console.log('Testing completion check with specific order...');
        
        // Test with the specific order you mentioned
        const testOrder = {
          part_number: '213301940178',
          production_order: '10593133'
        };

        console.log('Test order details:', testOrder);

        // Get the store instance
        const orderStore = useOrderStore.getState();
        console.log('Order store instance:', !!orderStore);

        // Call the completion check
        const completionStatus = await orderStore.checkOrderCompletion(
          testOrder.part_number,
          testOrder.production_order
        );

        console.log('Received completion status:', completionStatus);

        // Update the completed orders with the completed_orders array from the response
        if (completionStatus.completed_orders && completionStatus.completed_orders.length > 0) {
          setCompletedOrders(completionStatus.completed_orders);
        } else {
          setCompletedOrders([]);
        }

      } catch (error) {
        console.error('Error in test completion check:', error);
        message.error('Failed to check completion status: ' + error.message);
      }
    };

    // Call the test function
    testCompletionCheck();
  }, []); // Empty dependency array to run only once on mount

  // Update the checkCompletedOrdersStatus function
  const checkCompletedOrdersStatus = useCallback(async (orders) => {
    setLoadingCompletion(true);
    try {
      console.log('Starting to check completion status for orders:', orders);
      
      const completedOrdersWithStatus = await Promise.all(
        orders.map(async (order) => {
          try {
            if (!order.part_number || !order.production_order) {
              console.log('Missing part_number or production_order for order:', order);
              return { ...order, completion_status: null };
            }

            console.log('Checking completion for order:', {
              part_number: order.part_number,
              production_order: order.production_order
            });

            const completionStatus = await useOrderStore.getState().checkOrderCompletion(
              order.part_number,
              order.production_order
            );

            console.log('Received completion status:', completionStatus);

            return {
              ...order,
              completion_status: completionStatus
            };
          } catch (error) {
            console.error(`Error checking completion for order ${order.production_order}:`, error);
            message.error(`Failed to check completion for order ${order.production_order}`);
            return { ...order, completion_status: null };
          }
        })
      );

      console.log('All orders processed with completion status:', completedOrdersWithStatus);
      setCompletedOrders(completedOrdersWithStatus);
    } catch (error) {
      console.error('Error checking completed orders:', error);
      message.error('Failed to check completion status for some orders');
    } finally {
      setLoadingCompletion(false);
    }
  }, []);

  // Filter orders for in-progress tab
  const inProgressOrders = orders.filter(order => order.status === 'in_progress');

  // Add columns for completed orders table
  const completedOrdersColumns = [
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
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
    },
    {
      title: 'Status',
      key: 'completion_date_status',
      width: 150,
      render: (_, record) => (
        <Tag color={record.is_order_completed ? 'success' : 'warning'}>
          {record.completion_date_status}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'completion_percentage',
      width: 120,
      render: (_, record) => (
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${record.completion_percentage}%` }}
            ></div>
          </div>
          <span className="text-sm">{record.completion_percentage}%</span>
        </div>
      ),
    },
    // {
    //   title: 'Operations',
    //   key: 'operations',
    //   width: 150,
    //   render: (_, record) => (
    //     <div>
    //       <div className="font-medium">
    //         {record.completed_operations}/{record.total_eligible_operations}
    //       </div>
    //       <div className="text-xs text-gray-500">
    //         Total: {record.total_all_operations}
    //       </div>
    //     </div>
    //   ),
    // },
    {
      title: 'Completion Date',
      key: 'overall_completion_date',
      width: 150,
      render: (_, record) => {
        if (!record.overall_completion_date) return 'Not completed';
        return new Date(record.overall_completion_date).toLocaleDateString();
      },
    },
    {
      title: 'Message',
      key: 'message',
      width: 300,
      render: (_, record) => (
        <div className="text-sm">
          <span className={record.is_order_completed ? 'text-green-600' : 'text-yellow-600'}>
            {record.message}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="h-screen bg-white flex flex-col">
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
        {/* Header Section */}
        <div className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col span={12}>
              <div className="flex items-center">
                <div className="bg-blue-600 h-10 w-10 rounded-md flex items-center justify-center mr-4 bg-indigo-600">
                  <MenuOutlined style={{ color: 'white', fontSize: '18px' }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold m-0">ORDER MANAGEMENT</h1>
                  {/* <p className="text-gray-500 text-sm m-0">Real-time machine monitoring system</p> */}
                </div>
              </div>
            </Col>
            <Col span={12} className="flex justify-end">
              <Space>
                <div className="relative">
                 
                 
                </div>
                
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => setIsModalVisible(true)}
                >
                  New Order
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

       
        {/* Main Content Area - Full Width Order Management */}
        <Row className="flex-1">
          <Col span={24} className="h-full">
            <Card
   Production Dashboard           title={
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold ">Order Lists</span>
                  {/* <Space>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={handleRefresh}
                    >
                      Refresh
                    </Button>
                  </Space> */}
                </div>
              }
              bordered={true}
              className="h-full shadow-sm"
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
                type="card"
                tabBarStyle={{ marginBottom: '16px' }}
                tabBarGutter={8}
              >
                <TabPane 
                  tab={
                    <div className="flex items-center px-2">
                      <div className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                          <path d="M18 12c-1.1 0-2 .9-2 2s.9 2 2 2h2v-4h-2z" />
                        </svg>
                      </div>
                      <span className="font-medium">All Orders</span>
                    </div>
                  } 
                  key="all"
                  className="custom-tab"
                >
                  <div className="h-[calc(100vh-420px)] overflow-auto bg-white rounded-md shadow-sm p-2">
                    <OrderTable 
                      orders={localOrders} 
                      onRefresh={handleRefresh}
                      key={JSON.stringify(localOrders)}
                    />
                  </div>
                </TabPane>
                <TabPane 
                  tab={
                    <div className="flex items-center px-2">
                      <div className="bg-green-100 text-green-700 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="font-medium">In Progress</span>
                    </div>
                  } 
                  key="in_progress"
                >
                  <div className="h-[calc(100vh-420px)] overflow-auto bg-white rounded-md shadow-sm p-2">
                    {renderTimelineTable()}
                  </div>
                </TabPane>
                <TabPane 
                  tab={
                    <div className="flex items-center px-2">
                      <div className="bg-yellow-100 text-yellow-700 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <span className="font-medium">Completed</span>
                    </div>
                  } 
                  key="completed"
                >
                  <div className="h-[calc(100vh-420px)] overflow-auto bg-white rounded-md shadow-sm p-2">
                    {loadingCompletion ? (
                      <div className="flex justify-center items-center py-8">
                        <Spin size="large" />
                      </div>
                    ) : (
                      <Table
                        dataSource={completedOrders}
                        columns={completedOrdersColumns}
                        rowKey="production_order"
                        className="completed-table"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 'max-content' }}
                      />
                    )}
                  </div>
                </TabPane>
                <TabPane 
                  tab={
                    <div className="flex items-center px-2">
                      <div className="bg-gray-100 text-gray-700 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                      </div>
                      <span className="font-medium">Priority</span>
                    </div>
                  } 
                  key="priority"
                >
                  <div className="h-[calc(100vh-420px)] overflow-auto bg-white rounded-md shadow-sm p-2">
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

