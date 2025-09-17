import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Select, Button, Space, Alert, Tabs, message, Table, Spin, Empty, Input, Switch, Modal } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FilterOutlined, MenuOutlined, PlusOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
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
    stopPolling,
    setOrderCompletion,
    fetchAllCompletionRecords,
    completionRecords,
    isLoadingCompletionRecords,
    completionRecordsError
  } = useOrderStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [localOrders, setLocalOrders] = useState([]);
  const [priorityOrders, setPriorityOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  

  const [completionSearchText, setCompletionSearchText] = useState('');
  const [filteredCompletionRecords, setFilteredCompletionRecords] = useState([]);
  const [scheduledSearchText, setScheduledSearchText] = useState('');
  const [filteredScheduledOrders, setFilteredScheduledOrders] = useState([]);
  const [parent] = useAutoAnimate();
  const [timelineError, setTimelineError] = useState(null);
  const [completedTabView, setCompletedTabView] = useState('completed'); // 'completed' or 'scheduled'
  const [scheduledTabView, setScheduledTabView] = useState('scheduled'); // 'scheduled' or 'all'
  const [prioritySearchText, setPrioritySearchText] = useState('');
  const [filteredPriorityOrders, setFilteredPriorityOrders] = useState([]);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [selectedOrderForCompletion, setSelectedOrderForCompletion] = useState(null);


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
        // Fetch completion records on initial load so they're available immediately
        try {
          await fetchAllCompletionRecords();
        } catch (completionError) {
          // Silently handle completion records errors
          console.warn('Completion records fetch failed, continuing without it:', completionError);
        }
      } catch (error) {
        console.error('Failed to initialize order data:', error);
        message.error('Failed to load order data. Please try refreshing the page.');
      }
    };
    
    initializeOrders();
    
    // Don't start polling - only fetch on page load
    // startPolling();

    // Cleanup: stop polling when component unmounts
    // return () => stopPolling();
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
      setFilteredPriorityOrders(ordersWithPriority);
    }
  }, [orders]);

  const handleRefresh = useCallback(async () => {
    try {
      // Clear all search states
      setSearchText('');
      setFilteredOrders([]);
      setScheduledSearchText('');
      setFilteredScheduledOrders([]);
      setPrioritySearchText('');
      setFilteredPriorityOrders([]);
      
      // Show loading state
      const hideLoading = message.loading('Refreshing data...', 0);
      
      try {
        // Fetch fresh data
        await fetchAllOrders();
        try {
          await fetchTimelineData();
          message.success('Data refreshed successfully');
        } catch (timelineError) {
          console.warn('Timeline refresh failed:', timelineError);
          setTimelineError(timelineError);
        }
      } finally {
        // Hide loading message
        hideLoading();
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      message.error('Failed to refresh data. Please try again.');
    }
  }, [fetchAllOrders, fetchTimelineData]);

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

      // Don't fetch fresh orders data - let it stay as is
      // Orders will only be refreshed on page load or manual refresh
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

  // Completion records columns configuration
  const completionRecordsColumns = [
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
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status) => (
        <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Completed'}
        </span>
      ),
    },
    { 
      title: 'Completed At', 
      dataIndex: 'completion_date', 
      key: 'completion_date',
      width: 180,
      render: (date) => (
        <span className="text-sm text-gray-600">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    // { 
    //   title: 'Message', 
    //   dataIndex: 'message', 
    //   key: 'message',
    //   width: 200,
    //   render: (message) => (
    //     <span className="text-sm text-gray-700 truncate" title={message}>
    //       {message || 'Order completed successfully'}
    //     </span>
    //   ),
    // },
  ];

  // Timeline columns with action column for scheduled jobs
  const timelineColumnsWithActions = [
    ...timelineColumns,
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined style={{ color: 'white', fontSize: '18px' }} />}
          onClick={() => handleCompletionClick(record)}
          className="bg-green-600 hover:bg-green-700 border-green-600"
          title="Mark as completed"
          style={{ 
            minWidth: '36px', 
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      ),
    },
  ];
  
  // Render timeline table with error handling
  const renderTimelineTable = () => {
    const dataToShow = scheduledSearchText ? filteredScheduledOrders : timelineData;
    
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
        dataSource={dataToShow}
        columns={timelineColumns}
        rowKey="key"
        size="small"
        pagination={{ 
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          pageSizeOptions: [5, 10, 20, 50],
          position: ['bottomCenter'],
          size: 'default',
          showSizeChanger: true
        }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 500px)' }}
        loading={isLoading}
      />
    );
  };

  // Render timeline table with actions for scheduled jobs
  const renderTimelineTableWithActions = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      );
    }
    
    if (timelineError) {
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
        dataSource={scheduledSearchText ? filteredScheduledOrders : timelineData}
        columns={timelineColumnsWithActions}
        rowKey="key"
        size="small"
        pagination={{ 
          // pageSize: 10,
          // showSizeChanger: true,
          // showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          pageSizeOptions: [5, 10, 20, 50],
          position: ['bottomCenter'],
          size: 'default'
        }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 500px)' }}
      />
    );
  };

  // Render completion records table
  const renderCompletionRecordsTable = () => {
    if (isLoadingCompletionRecords) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      );
    }
    
    if (completionRecordsError) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Alert
            message="Error Loading Completion Records"
            description={completionRecordsError}
            type="error"
            showIcon
            className="mb-4"
          />
          <Button onClick={handleRefresh} type="primary">
            Retry
          </Button>
        </div>
      );
    }
    
    if (!completionRecords || completionRecords.length === 0) {
      return (
        <Empty 
          description="No completion records found" 
          className="py-8"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    return (
      <Table
        dataSource={completionSearchText ? filteredCompletionRecords : completionRecords}
        columns={completionRecordsColumns}
        rowKey="order_id"
        size="small"
        pagination={{ 
          // pageSize: 10,
          showSizeChanger: true,
          // showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          pageSizeOptions: [5, 10, 20, 50],
          position: ['bottomCenter'],
          size: 'default'
        }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 500px)' }}
      />
    );
  };





  const handlePrioritySearch = (searchText) => {
    setPrioritySearchText(searchText);
    
    if (!searchText.trim()) {
      setFilteredPriorityOrders(priorityOrders);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/); // Split by any whitespace

    const filtered = priorityOrders.filter((order) => {
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
      return searchTerms.every(term => searchableFields.includes(term));
    });
    
    setFilteredPriorityOrders(filtered);
  };

  const handleSearch = (searchText) => {
    setSearchText(searchText);
    
    if (!searchText.trim()) {
      setFilteredOrders([]);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/); // Split by any whitespace

    // Search regular orders
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

  // Separate search function for completion records
  const handleCompletionSearch = (searchText) => {
    setCompletionSearchText(searchText);
    
    if (!searchText.trim()) {
      setFilteredCompletionRecords([]);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/); // Split by any whitespace

    const filteredCompletionRecords = completionRecords.filter((record) => {
      // Create a string with all searchable fields for completion records
      const searchableFields = [
        record.production_order?.toString().toLowerCase() || '',
        record.part_number?.toString().toLowerCase() || '',
        record.project_name?.toString().toLowerCase() || '',
        record.status?.toString().toLowerCase() || '',
        record.message?.toString().toLowerCase() || ''
      ].join(' ');

      // Check if all search terms are found in any of the fields
      return searchTerms.every(term => 
        searchableFields.includes(term)
      );
    });

    setFilteredCompletionRecords(filteredCompletionRecords);
  };

  // Search function for scheduled orders
  const handleScheduledSearch = (searchText) => {
    setScheduledSearchText(searchText);
    
    if (!searchText.trim()) {
      setFilteredScheduledOrders([]);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/); // Split by any whitespace

    const filteredScheduledOrders = timelineData.filter((record) => {
      // Create a string with all searchable fields for scheduled orders
      const searchableFields = [
        record.production_order?.toString().toLowerCase() || '',
        record.part_number?.toString().toLowerCase() || '',
        record.completed_total_quantity?.toString().toLowerCase() || '',
        record.operations_count?.toString().toLowerCase() || '',
        record.status?.toString().toLowerCase() || ''
      ].join(' ');

      // Check if all search terms are found in any of the fields
      return searchTerms.every(term => 
        searchableFields.includes(term)
      );
    });

    setFilteredScheduledOrders(filteredScheduledOrders);
  };

  // Reset search when tab changes
  const handleTabChange = (activeKey) => {
    if (activeKey !== 'all') {
      setSearchText('');
      setFilteredOrders([]);
      setCompletionSearchText('');
      setFilteredCompletionRecords([]);
      setScheduledSearchText('');
      setFilteredScheduledOrders([]);
    }
  };

  // Handle toggle for completed tab view
  const handleCompletedTabToggle = (checked) => {
    const newView = checked ? 'scheduled' : 'completed';
    setCompletedTabView(newView);
    
    // Clear search when switching views
    setCompletionSearchText('');
    setFilteredCompletionRecords([]);
    setScheduledSearchText('');
    setFilteredScheduledOrders([]);
    
    // Only fetch completion records when switching to completed view
    if (newView === 'completed') {
      fetchAllCompletionRecords().catch(error => {
        console.warn('Failed to fetch completion records:', error);
      });
    }
  };

  // Handle completion click - show confirmation modal
  const handleCompletionClick = (record) => {
    setSelectedOrderForCompletion(record);
    setCompletionModalVisible(true);
  };

  // Handle mark action for scheduled jobs
  const handleMarkAction = async (record) => {
    try {
      console.log('Marking job as completed:', record);
      message.loading({ content: 'Marking job as completed...', key: 'markJob' });
      
      // Use the setOrderCompletion function from the store
      const result = await setOrderCompletion(record.production_order);
      
      message.success({ 
        content: `Job ${record.production_order} marked as completed successfully`, 
        key: 'markJob' 
      });
      
      // Refresh the timeline data and completion records
      await handleRefresh();
    } catch (error) {
      console.error('Error marking job:', error);
      message.error({ 
        content: `Failed to mark job as completed: ${error.message}`, 
        key: 'markJob' 
      });
    }
  };

  // Handle completion confirmation
  const handleCompletionConfirm = async () => {
    if (!selectedOrderForCompletion) return;
    
    try {
      setCompletionModalVisible(false);
      message.loading({ content: 'Marking job as completed...', key: 'markJob' });
      
      // Use the setOrderCompletion function from the store
      const result = await setOrderCompletion(selectedOrderForCompletion.production_order);
      
      message.success({ 
        content: `Job ${selectedOrderForCompletion.production_order} marked as completed successfully`, 
        key: 'markJob' 
      });
      
      // Refresh both completion records and timeline data
      try {
        await Promise.all([
          fetchAllCompletionRecords(),
          fetchTimelineData() // Refresh timeline data to remove the completed order
        ]);
      } catch (error) {
        console.warn('Failed to refresh data:', error);
      }
      
      // Clear the selected order
      setSelectedOrderForCompletion(null);
    } catch (error) {
      console.error('Error marking job:', error);
      message.error({ 
        content: `Failed to mark job as completed: ${error.message}`, 
        key: 'markJob' 
      });
    }
  };

  // Handle completion modal cancel
  const handleCompletionCancel = () => {
    setCompletionModalVisible(false);
    setSelectedOrderForCompletion(null);
  };

  // Render completed tab content based on toggle state
  const renderCompletedTabContent = () => {
    if (completedTabView === 'scheduled') {
      return renderTimelineTableWithActions();
    } else {
      return renderCompletionRecordsTable();
    }
  };

  // Calculate the actual counts for each card based on tab data
  const totalOrdersCount = localOrders?.length || 0;
  
  // Calculate in_progress count - only count orders with 'in_progress' status
  const inProgressOrdersCount = localOrders?.filter(order => 
    order.status === 'in_progress'
  )?.length || 0;
  
  // Calculate scheduled count - only count orders with 'scheduled' status
  let scheduledOrdersCount = localOrders?.filter(order => 
    order.status === 'scheduled'
  )?.length || 0;
  
  // If no scheduled orders found in localOrders, use timelineData as fallback
  if (scheduledOrdersCount === 0 && timelineData && timelineData.length > 0) {
    scheduledOrdersCount = timelineData.length;
  }
  
  const priorityOrdersCount = priorityOrders?.length || 0;
  const completedOrdersCount = completionRecords?.length || 0;



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
        <Row gutter={[16, 16]} className="mb-6  " ref={parent}>
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
              className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 hover:scale-[1.03] overflow-hidden group cursor-pointer"
              bodyStyle={{ padding: 0 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-32 h-32 bg-orange-200 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-amber-200 rounded-full blur-xl animate-pulse delay-1000"></div>
              </div>
              
              {/* Main content container */}
              <div className="relative p-6 flex items-center justify-between h-32">
                
                {/* Left side - Icon and Label */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Animated icon container */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-200 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110 backdrop-blur-sm">
                      <Lottie
                        animationData={inprogressAnimation}
                        style={{ width: 52, height: 52 }}
                        {...lottieOptions}
                        loop={true}
                      />
                    </div>
                    {/* Pulse ring effect */}
                    <div className="absolute inset-0 bg-orange-200 rounded-xl animate-ping opacity-20"></div>
                  </div>
                  
                  {/* Label section */}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-orange-800 font-semibold text-xl leading-tight">
                      In Progress
                    </h3>
                    <p className="text-orange-600 text-sm font-medium opacity-80">
                      Currently Processing
                    </p>
                  </div>
                </div>
                
                {/* Right side - Big number display */}
                <div className="flex flex-col items-end justify-center">
                  <div className="text-right">
                    <div className="text-5xl font-bold text-orange-700 leading-none group-hover:text-orange-800 transition-colors duration-300">
                      {inProgressOrdersCount}
                    </div>
                    <div className="text-orange-500 text-xs font-medium mt-1 uppercase tracking-wider">
                      Active
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 group-hover:h-1.5 transition-all duration-300"></div>
            </Card>
          </Col>
          
          {/* Scheduled Card - 3rd */}
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
                      Scheduled 
                    </p>
                  </div>
                </div>
                
                {/* Right side - Big number display */}
                <div className="flex flex-col items-end justify-center">
                  <div className="text-right">
                    <div className="text-5xl font-bold text-emerald-700 leading-none group-hover:text-emerald-800 transition-colors duration-300">
                      {scheduledOrdersCount}
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
          
          {/* Completed Card - 4th */}
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
{/*            */}
        </Row>

        {/* Main Content Area - Full Width Order Management */}
        <Row className="flex-1">
          <Col span={24} className="h-full ">
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Order Management</span>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    size="small"
                    onClick={() => setIsModalVisible(true)}
                  >
                    New Order
                  </Button>
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
                  <div className="flex flex-col h-[calc(100vh-320px)]">
                    <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-base font-medium text-gray-700">All Orders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input.Search
                          placeholder="Search orders..."
                          size="small"
                          value={searchText}
                          onChange={(e) => handleSearch(e.target.value)}
                          style={{ width: 250 }}
                          allowClear
                        />
                        <Button 
                          size="small" 
                          onClick={handleRefresh}
                          loading={isLoading}
                          icon={<ReloadOutlined />}
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <OrderTable 
                        orders={searchText ? filteredOrders : localOrders} 
                        onRefresh={handleRefresh}
                        key={JSON.stringify(searchText ? filteredOrders : localOrders)}
                      />
                    </div>
                  </div>
                </TabPane>
                {/* <TabPane tab={<span className="font-semibold">In Progress</span>} key="in_progress">
                  <div className="h-full overflow-auto">
                    <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-base font-medium text-gray-700">In Progress Orders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input.Search
                          placeholder="Search in progress orders..."
                          size="small"
                          value={searchText}
                          onChange={(e) => handleSearch(e.target.value)}
                          style={{ width: 250 }}
                          allowClear
                        />
                        <Button 
                          size="small" 
                          onClick={handleRefresh}
                          loading={isLoading}
                          icon={<ReloadOutlined />}
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                    <div className="h-[calc(100vh-320px)] overflow-auto">
                      <OrderTable 
                        orders={searchText ? filteredOrders.filter(order => order.status === 'in_progress') : localOrders.filter(order => order.status === 'in_progress')} 
                        onRefresh={handleRefresh}
                        key={`in-progress-${JSON.stringify(searchText ? filteredOrders : localOrders)}`}
                      />
                    </div>
                  </div>
                </TabPane> */}
                <TabPane tab={<span className="font-semibold">Scheduled</span>} key="scheduled">
                  <div className="h-full overflow-auto">
                    <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-base font-medium text-gray-700">Scheduled Orders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input.Search
                          placeholder="Search by Production Order..."
                          size="small"
                          value={scheduledSearchText}
                          onChange={(e) => handleScheduledSearch(e.target.value)}
                          style={{ width: 250 }}
                          allowClear
                        />
                        <Button 
                          size="small" 
                          onClick={handleRefresh}
                          loading={isLoading}
                          icon={<ReloadOutlined />}
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                    {scheduledTabView === 'scheduled' ? renderTimelineTable() : (
                      <div className="h-[calc(100vh-320px)] overflow-auto">
                        <OrderTable 
                          orders={searchText ? filteredOrders : localOrders} 
                          onRefresh={handleRefresh}
                          key={`all-orders-${JSON.stringify(searchText ? filteredOrders : localOrders)}`}
                        />
                      </div>
                    )}
                  </div>
                </TabPane>
                <TabPane tab={<span className="font-semibold">Completed</span>} key="completed">
                  <div className="h-full overflow-auto">
                    {/* Toggle Switch */}
                    <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          {completedTabView === 'completed' ? 'Completed Orders' : 'Scheduled Orders'}
                        </span>
                        <Switch
                          checked={completedTabView === 'scheduled'}
                          onChange={handleCompletedTabToggle}
                          checkedChildren="Schedule"
                          unCheckedChildren="View Scheduled"
                          size="small"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          {completedTabView === 'completed' 
                            ? `Showing ${completedOrdersCount} completed orders` 
                            : 'Schedule orders for completion'
                          }
                        </div>
                        {completedTabView === 'completed' && (
                          <div className="flex items-center gap-2">
                            <Input.Search
                              placeholder="Search completed orders..."
                              size="small"
                              value={completionSearchText}
                              onChange={(e) => handleCompletionSearch(e.target.value)}
                              style={{ width: 200 }}
                              allowClear
                            />
                            <Button 
                              size="small" 
                              onClick={async () => {
                                try {
                                  // Clear search when refreshing
                                  setCompletionSearchText('');
                                  setFilteredCompletionRecords([]);
                                  
                                  // Fetch fresh completion records
                                  await fetchAllCompletionRecords();
                                  
                                  // Show success message
                                  message.success('Completion records refreshed successfully');
                                } catch (error) {
                                  console.warn('Failed to refresh completion records:', error);
                                  message.error('Failed to refresh completion records');
                                }
                              }}
                              loading={isLoadingCompletionRecords}
                              icon={<ReloadOutlined />}
                            >
                              Refresh
                            </Button>
                          </div>
                        )}
                        {completedTabView === 'scheduled' && (
                          <div className="flex items-center gap-2">
                            <Input.Search
                              placeholder="Search scheduled orders..."
                              size="small"
                              value={scheduledSearchText}
                              onChange={(e) => handleScheduledSearch(e.target.value)}
                              style={{ width: 200 }}
                              allowClear
                            />
                            <Button 
                              size="small" 
                              onClick={handleRefresh}
                              loading={isLoading}
                              icon={<ReloadOutlined />}
                            >
                              Refresh
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Content based on toggle state */}
                    {renderCompletedTabContent()}
                  </div>
                </TabPane>
                <TabPane tab={<span className="font-semibold">Priority</span>} key="priority">
                  <div className="h-full overflow-auto">
                    <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          Priority Orders
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input.Search
                          placeholder="Search by Order..."
                          size="small"
                          value={prioritySearchText}
                          onChange={(e) => handlePrioritySearch(e.target.value)}
                          style={{ width: 250 }}
                          allowClear
                        />
                        <Button 
                          size="small" 
                          onClick={() => {
                            setPrioritySearchText('');
                            handleRefresh();
                          }}
                          loading={isLoading}
                          icon={<ReloadOutlined />}
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                    <ReorderableTable 
                      orders={filteredPriorityOrders}
                      onOrdersUpdate={handlePriorityUpdate}
                      key={`priority-${JSON.stringify(priorityOrders)}-${prioritySearchText}`}
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
      
      {/* Completion Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            <span>Confirm Order Completion</span>
          </div>
        }
        open={completionModalVisible}
        onOk={handleCompletionConfirm}
        onCancel={handleCompletionCancel}
        okText="Mark as Completed"
        cancelText="Cancel"
        okButtonProps={{
          className: "bg-green-600 hover:bg-green-700 border-green-600"
        }}
        centered
        destroyOnClose
        maskClosable={false}
        keyboard={false}
      >

        {selectedOrderForCompletion && (
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to mark this order as completed?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Production Order:</span>
                  <p className="text-gray-800">{selectedOrderForCompletion.production_order}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Part Number:</span>
                  <p className="text-gray-800">{selectedOrderForCompletion.part_number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Completed Quantity:</span>
                  <p className="text-gray-800">{selectedOrderForCompletion.completed_total_quantity || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Operations:</span>
                  <p className="text-gray-800">{selectedOrderForCompletion.operations_count || 0}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This action will mark the order as completed and move it to the completed orders list.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderDashboard;