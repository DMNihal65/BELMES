// src/pages/supervisorscreens/ordermanagement/orderdashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Button, Space, Alert, Tabs, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FilterOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import OrderTable from '../../../components/OrderManagement/OrderTable';
import ReorderableTable from '../../../components/OrderManagement/ReorderableTable';
import CreateOrderModal from '../../../components/OrderManagement/CreateOrderModal';
import useOrderStore from '../../../store/order-store';

const { TabPane } = Tabs;

const OrderDashboard = () => {
  const { orders, fetchAllOrders, isLoading, error } = useOrderStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parent] = useAutoAnimate();

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

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
                  title="In Progress"
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
        <Row className="h-[calc(100vh-240px)]">
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
                      <OrderTable orders={orders} />
                    </div>
                  </TabPane>
                  <TabPane tab="In Progress" key="in_progress">
                    <div className="h-full overflow-auto">
                      <OrderTable orders={orders.filter(order => order.status === 'in_progress')} />
                    </div>
                  </TabPane>
                  <TabPane tab="Completed" key="completed">
                    <div className="h-full overflow-auto">
                      <OrderTable orders={orders.filter(order => order.status === 'completed')} />
                    </div>
                  </TabPane>
                  <TabPane tab="Delayed" key="delayed">
                    <div className="h-full overflow-auto">
                      <OrderTable orders={orders.filter(order => order.status === 'delayed')} />
                    </div>
                  </TabPane>
                  <TabPane tab="Reorder" key="reorder">
                    <div className="h-full overflow-auto">
                      <ReorderableTable 
                        orders={orders.map(order => ({
                          ...order,
                          id: order.key
                        }))} 
                        onOrdersReorder={(newOrders) => {
                          console.log('Orders reordered:', newOrders);
                          message.success('Order sequence updated successfully');
                        }} 
                      />
                    </div>
                  </TabPane>
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
      />
    </div>
  );
};

export default OrderDashboard;

