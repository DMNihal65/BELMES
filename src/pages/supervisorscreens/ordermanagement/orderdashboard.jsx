import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Select, Button, Space, Alert, Tabs, message, Table } from 'antd';
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
  const { orders, fetchAllOrders, fetchTimelineData, timelineData, isLoading, error } = useOrderStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parent] = useAutoAnimate();
  
  const handleRefresh = useCallback(() => {
    fetchTimelineData();
    fetchAllOrders();
  }, [fetchTimelineData, fetchAllOrders]);

  // Add effect to refresh orders when priorities change
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchAllOrders();
    }, 20000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [fetchAllOrders]);

  useEffect(() => {
    fetchAllOrders();
    fetchTimelineData();
  }, []);

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
                      orders={orders} 
                      onRefresh={handleRefresh}
                      key={JSON.stringify(orders)} // Force re-render when orders change
                    />
                  </div>
                </TabPane>
                <TabPane tab="In Progress" key="in_progress">
                  <div className="h-full overflow-auto">
                    <Table 
                      columns={timelineColumns}
                      dataSource={timelineData}
                      loading={isLoading}
                      rowKey="production_order"
                      scroll={{ x: 1800, y: 'calc(100vh - 300px)' }}
                      pagination={{ 
                        pageSize: 10,
                        position: ['bottomCenter'],
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`
                      }}
                      size="middle"
                      bordered
                    />
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
                      orders={orders}
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
        onCreate={async (newOrder) => {
          console.log('New order created:', newOrder);
          await handleRefresh();
          setIsModalVisible(false);
          message.success('Order created successfully');
        }} 
        onRefresh={handleRefresh} 
      />
    </div>
  );
};

export default OrderDashboard;