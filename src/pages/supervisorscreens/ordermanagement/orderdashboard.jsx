import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Select, Button, Space, Alert, Tabs, message, Table, Spin, Empty, Tag, Input } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FilterOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import OrderTable from '../../../components/OrderManagement/OrderTable';
import ReorderableTable from '../../../components/OrderManagement/ReorderableTable';
import CreateOrderModal from '../../../components/OrderManagement/CreateOrderModal';
import useOrderStore from '../../../store/order-store';
import Workcenter from '../../../components/OrderManagement/Workcenter';
import Lottie from 'lottie-react';
import powerAnimation from '../../../assets/power.json';
import inprogressAnimation from '../../../assets/inprogress.json';
import completedAnimation from '../../../assets/completed.json';
import totalOrdersAnimation from '../../../assets/totalorders.json';
import priorityAnimation from '../../../assets/pritoriy.json';

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
  const [searchText, setSearchText] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [parent] = useAutoAnimate();
  const [timelineError, setTimelineError] = useState(null);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loadingCompletion, setLoadingCompletion] = useState(false);

  const lottieOptions = {
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    },
    loop: true,
    autoplay: true
  };
  
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
        pagination={{ pageSize: 10 }}
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

  const handleSearch = (searchText) => {
    setSearchText(searchText);
    
    if (!searchText.trim()) {
      setFilteredOrders([]);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/); // Split by any whitespace

    const filteredOrders = localOrders.filter((order) => {
      // Create a string with all searchable fields
      const searchableFields = [
        order.priority?.toString() || '', // Sl.No
        order.part_number?.toString().toLowerCase() || '',
        order.production_order?.toString().toLowerCase() || '',
        order.project?.toString().toLowerCase() || '',
        order.description?.toString().toLowerCase() || '',
        order.quantity?.toString().toLowerCase() || '',
        order.wbs_element?.toString().toLowerCase() || '',
        order.sales_order?.toString().toLowerCase() || ''
      ].join(' ');

      // Check if all search terms are found in any of the fields
      return searchTerms.every(term => 
        searchableFields.includes(term)
      );
    });

    setFilteredOrders(filteredOrders);
  };

  // Reset search when tab changes
  const handleTabChange = (activeKey) => {
    if (activeKey !== 'all') {
      setSearchText('');
      setFilteredOrders([]);
    }
  };

  // Calculate the actual counts for each card based on tab data
  const totalOrdersCount = localOrders?.length || 0;
  const inProgressOrdersCount = timelineData?.length || 0;
  const completedOrdersCount = completedOrders?.length || 0;
  const priorityOrdersCount = priorityOrders?.length || 0;

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
          {/* <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${record.completion_percentage}%` }}
            ></div>
          </div> */}
          <span className="text-sm">{record.completion_percentage}%</span>
        </div>
      ),
    },
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
      
      <div className="flex-1 p-4 overflow-hidden flex flex-col bg-sky-100 ">
        {/* Quick Stats Row - Reordered: Total Orders, In Progress, Completed, Priority */}
        <Row gutter={[12, 12]} className="mb-6  " ref={parent}>
          {/* Total Orders Card - 1st */}
          <Col xs={24} sm={12} md={6}>
            <Card 
              className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 hover:scale-[1.03] overflow-hidden group cursor-pointer"
              bodyStyle={{ padding: 0 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-32 h-32 bg-indigo-200 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-blue-200 rounded-full blur-xl animate-pulse delay-1000"></div>
              </div>
              
              {/* Main content container */}
              <div className="relative p-6 flex items-center justify-between h-32">
                
                {/* Left side - Icon and Label */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Animated icon container */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-200 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110 backdrop-blur-sm">
                      <Lottie
                        animationData={totalOrdersAnimation}
                        style={{ width: 52, height: 52 }}
                        {...lottieOptions}
                        loop={true}
                      />
                    </div>
                    {/* Pulse ring effect */}
                    <div className="absolute inset-0 bg-indigo-200 rounded-xl animate-ping opacity-20"></div>
                  </div>
                  
                  {/* Label section */}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-indigo-800 font-semibold text-xl leading-tight">
                      Total Orders
                    </h3>
                    <p className="text-indigo-600 text-sm font-medium opacity-80">
                      All Orders
                    </p>
                  </div>
                </div>
                
                {/* Right side - Big number display */}
                <div className="flex flex-col items-end justify-center">
                  <div className="text-right">
                    <div className="text-5xl font-bold text-indigo-700 leading-none group-hover:text-indigo-800 transition-colors duration-300">
                      {totalOrdersCount}
                    </div>
                    <div className="text-indigo-500 text-xs font-medium mt-1 uppercase tracking-wider">
                      Total
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="h-1 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 group-hover:h-1.5 transition-all duration-300"></div>
            </Card>
          </Col>
          
          {/* In Progress Card - 2nd */}
          <Col xs={24} sm={12} md={6}>
            <Card 
              className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 hover:scale-[1.03] overflow-hidden group cursor-pointer"
              bodyStyle={{ padding: 0 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-32 h-32 bg-emerald-200 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-green-200 rounded-full blur-xl animate-pulse delay-1000"></div>
              </div>
              
              {/* Main content container */}
              <div className="relative p-6 flex items-center justify-between h-32">
                
                {/* Left side - Icon and Label */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Animated icon container */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110 backdrop-blur-sm">
                      <Lottie
                        animationData={inprogressAnimation}
                        style={{ width: 52, height: 52 }}
                        {...lottieOptions}
                        loop={true}
                      />
                    </div>
                    {/* Pulse ring effect */}
                    <div className="absolute inset-0 bg-emerald-200 rounded-xl animate-ping opacity-20"></div>
                  </div>
                  
                  {/* Label section */}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-emerald-800 font-semibold text-xl leading-tight">
                    Scheduled
                    </h3>
                    <p className="text-emerald-600 text-sm font-medium opacity-80">
                      Active Orders
                    </p>
                  </div>
                </div>
                
                {/* Right side - Big number display */}
                <div className="flex flex-col items-end justify-center">
                  <div className="text-right">
                    <div className="text-5xl font-bold text-emerald-700 leading-none group-hover:text-emerald-800 transition-colors duration-300">
                      {inProgressOrdersCount}
                    </div>
                    <div className="text-emerald-500 text-xs font-medium mt-1 uppercase tracking-wider">
                      Total
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 group-hover:h-1.5 transition-all duration-300"></div>
            </Card>
          </Col>
          
          {/* Completed Card - 3rd */}
          <Col xs={24} sm={12} md={6}>
            <Card 
              className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 hover:scale-[1.03] overflow-hidden group cursor-pointer"
              bodyStyle={{ padding: 0 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-32 h-32 bg-gray-300 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-gray-400 rounded-full blur-xl animate-pulse delay-1000"></div>
              </div>
              
              {/* Main content container */}
              <div className="relative p-6 flex items-center justify-between h-32">
                
                {/* Left side - Icon and Label */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Animated icon container */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110 backdrop-blur-sm">
                      <Lottie
                        animationData={completedAnimation}
                        style={{ width: 52, height: 52 }}
                        {...lottieOptions}
                        loop={true}
                      />
                    </div>
                    {/* Pulse ring effect */}
                    <div className="absolute inset-0 bg-gray-300 rounded-xl animate-ping opacity-20"></div>
                  </div>
                  
                  {/* Label section */}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-gray-800 font-semibold text-xl leading-tight">
                      Completed
                    </h3>
                    <p className="text-gray-600 text-sm font-medium opacity-80">
                      Processed Orders
                    </p>
                  </div>
                </div>
                
                {/* Right side - Big number display */}
                <div className="flex flex-col items-end justify-center">
                  <div className="text-right">
                    <div className="text-5xl font-bold text-gray-700 leading-none group-hover:text-gray-800 transition-colors duration-300">
                      {completedOrdersCount}
                    </div>
                    <div className="text-gray-500 text-xs font-medium mt-1 uppercase tracking-wider">
                      Total
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="h-1 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 group-hover:h-1.5 transition-all duration-300"></div>
            </Card>
          </Col>
          
          {/* Priority Card - 4th (Last) */}
          {/*  */}
        </Row>

        {/* Main Content Area - Full Width Order Management */}
        <Row className="flex-1">
          <Col span={24} className="h-full ">
            <Card
              title={
                <div className="flex justify-between items-center ">
                  <span className="text-base font-semibold">Order Management</span>
                  <Space>
                    <Input.Search
                      placeholder="Search orders..."
                      size="small"
                      value={searchText}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={{ width: 200 }}
                      allowClear
                    />
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
              className="h-full "
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
                onChange={handleTabChange}
              >
                <TabPane tab={<span className="font-semibold">All Orders</span>} key="all">
                  <div className="h-[calc(100vh-320px)] overflow-auto">
                    <OrderTable 
                      orders={searchText ? filteredOrders : localOrders} 
                      onRefresh={handleRefresh}
                      key={JSON.stringify(searchText ? filteredOrders : localOrders)}
                    />
                  </div>
                </TabPane>
                <TabPane tab={<span className="font-semibold">Scheduled</span>} key="in_progress">
                  <div className="h-full overflow-auto">
                    {renderTimelineTable()}
                  </div>
                </TabPane>
                <TabPane tab={<span className="font-semibold">Completed</span>} key="completed">
                  <div className="h-full overflow-auto">
                    {loadingCompletion ? (
                      <div className="flex justify-center items-center py-8">
                        <Spin size="large" />
                      </div>
                    ) : (
                      <Table
                        dataSource={completedOrders}
                        columns={completedOrdersColumns}
                        rowKey="production_order"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 'max-content' }}
                      />
                    )}
                  </div>
                </TabPane>
                <TabPane tab={<span className="font-semibold">Priority</span>} key="priority">
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