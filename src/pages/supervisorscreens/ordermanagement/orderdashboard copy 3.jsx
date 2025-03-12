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
    // Only fetch timeline data on refresh
    fetchTimelineData();
  }, [fetchTimelineData]);

  useEffect(() => {
    // Initial load only
    fetchAllOrders();
    fetchTimelineData();
  }, []); // Empty dependency array means this runs once on mount

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
      title: 'Material Description',
      dataIndex: 'part_description',
      key: 'part_description',
      width: 200,
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
      fixed: 'right',
      width: 120,
      render: (status) => (
        <span className={`
          px-2 py-1 rounded-full text-sm
          ${status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
          ${status === 'completed' ? 'bg-green-100 text-green-800' : ''}
          ${status === 'delayed' ? 'bg-red-100 text-red-800' : ''}
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
      
      <div className="flex-1 p-4 overflow-hidden">
        {/* Quick Stats Row */}
        <Row gutter={[16, 16]} className="mb-6" ref={parent}>
          <Col xs={24} sm={12} lg={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="Total Orders"
                  value={orders.length}
                  prefix={<MenuOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="In  Progress"
                  value={orders.filter(o => o.status === 'in_progress').length}
                  prefix={<ArrowUpOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="Revenue"
                  value={orders.reduce((acc, curr) => acc + curr.revenue, 0)}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <motion.div {...fadeIn}>
              <Card bordered={false} className="hover:shadow-lg transition-shadow duration-300">
                <Statistic
                  title="On-Time Delivery"
                  value={92}
                  suffix="%"
                  prefix={<ArrowUpOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Main Content Area - Full Width Order Management */}
        <Row className="h-[calc(100vh-20px)]">
          <Col span={24} className="h-full">
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Order Management</span>
                  <Space>
                    <Button icon={<FilterOutlined />} size="small">Filter</Button>
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
              className="hover:shadow-lg transition-shadow duration-300 h-full"
              bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)', overflow: 'hidden' }}
            >
              <div className="flex-1 overflow-hidden">
                <Tabs defaultActiveKey="all" className="h-full">
                  <TabPane tab="All Orders" key="all">
                    <div className="h-full overflow-auto">
                      <OrderTable orders={orders} onRefresh={handleRefresh} />
                    </div>
                  </TabPane>
                  <TabPane tab="In Progress" key="in_progress">
                    <div className="h-full overflow-auto">
                      <Table 
                        columns={timelineColumns}
                        dataSource={inProgressOrders}
                        loading={isLoading}
                        rowKey={record => record.id || record.production_order}
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
                  <TabPane tab="Priority" key="reorder">
                    <div className="h-full overflow-auto">
                      <ReorderableTable 
                        orders={Array.isArray(orders) ? orders.map(order => ({
                          ...order,
                          key: order.id || order.production_order,
                          id: order.id || order.production_order
                        })) : []} 
                        onOrdersReorder={(newOrders) => {
                          console.log('Orders reordered:', newOrders);
                          message.success('Order sequence updated successfully');
                        }} 
                      />
                    </div>
                  </TabPane>
                  {/* <TabPane tab="Workcenter" key="workcenter">
                    <div className="h-full overflow-auto">
                      <Workcenter />
                    </div>
                  </TabPane> */}
                </Tabs>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      <CreateOrderModal 
        visible={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        onCreate={(newOrder) => {
          console.log('New order created:', newOrder);
          setIsModalVisible(false);
        }} 
        onRefresh={handleRefresh} 
      />
    </div>
  );
};

export default OrderDashboard;

