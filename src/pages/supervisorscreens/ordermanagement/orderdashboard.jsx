import React, { useState, Suspense } from 'react';
import { Card, Row, Col, Badge, Progress, Statistic, Timeline, Select, Button, Space, Alert, Modal, List, Tabs } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, BellOutlined, FilterOutlined, ReloadOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import OrderTable from '../../../components/OrderManagement/OrderTable';
import ReorderableTable from '../../../components/OrderManagement/ReorderableTable';
import CreateOrderModal from '../../../components/OrderManagement/CreateOrderModal';

const { TabPane } = Tabs;

// Mock data
const orders = [
  {
    key: '1',
    orderNumber: 'ORD-2024-001',
    partNumber: 'PART-A123',
    materialNumber: 'MAT-001',
    materialDescription: 'High-Grade Steel Component',
    targetQuantity: 100,
    launchedQuantity: 75,
    plant: 'Plant-01',
    wbsElement: 'WBS-2024-001',
    salesOrderNumber: 'SO-2024-001',
    deliveryDate: '2024-02-15',
    status: 'in_progress',
    priority: 'high',
    customer: 'Aerospace Corp',
    revenue: 125000,
  },
  {
    key: '2',
    orderNumber: 'ORD-2024-002',
    partNumber: 'PART-B456',
    materialNumber: 'MAT-002',
    materialDescription: 'Precision Machined Component',
    targetQuantity: 50,
    launchedQuantity: 0,
    plant: 'Plant-02',
    wbsElement: 'WBS-2024-002',
    salesOrderNumber: 'SO-2024-002',
    deliveryDate: '2024-03-01',
    status: 'pending',
    priority: 'medium',
    customer: 'Defense Systems',
    revenue: 85000,
  },
  {
    key: '3',
    orderNumber: 'ORD-2024-003',
    partNumber: 'PART-C789',
    materialNumber: 'MAT-003',
    materialDescription: 'Composite Assembly',
    targetQuantity: 200,
    launchedQuantity: 200,
    plant: 'Plant-01',
    wbsElement: 'WBS-2024-003',
    salesOrderNumber: 'SO-2024-003',
    deliveryDate: '2024-01-30',
    status: 'completed',
    priority: 'medium',
    customer: 'Aviation Corp',
    revenue: 175000,
  },
  {
    key: '4',
    orderNumber: 'ORD-2024-004',
    partNumber: 'PART-D012',
    materialNumber: 'MAT-004',
    materialDescription: 'Titanium Component',
    targetQuantity: 75,
    launchedQuantity: 15,
    plant: 'Plant-03',
    wbsElement: 'WBS-2024-004',
    salesOrderNumber: 'SO-2024-004',
    deliveryDate: '2024-02-28',
    status: 'delayed',
    priority: 'high',
    customer: 'Space Systems',
    revenue: 95000,
  },
];

const recentActivities = [
  { id: 1, type: 'update', content: 'Order ORD-2024-001 status updated to In Progress', timestamp: '10 mins ago' },
  { id: 2, type: 'new', content: 'New order ORD-2024-002 created', timestamp: '30 mins ago' },
  { id: 3, type: 'complete', content: 'Order ORD-2024-003 completed', timestamp: '1 hour ago' },
];

const OrderDashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parent] = useAutoAnimate();

  // Chart options for Order Analytics
  const orderAnalyticsOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Orders',
        type: 'bar',
        data: [10, 15, 8, 12, 9],
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
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

        {/* Main Content Area */}
        <Row gutter={[16, 16]} className="h-[calc(100vh-240px)]">
          {/* Order List */}
          <Col xs={24} lg={16} className="h-full">
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
                          id: order.key // Ensure each order has an id that matches the key
                        }))} 
                        onOrdersReorder={(newOrders) => {
                          console.log('Orders reordered:', newOrders);
                          // Here you can update your state or make an API call
                          message.success('Order sequence updated successfully');
                        }} 
                      />
                    </div>
                  </TabPane>
                </Tabs>
              </div>
            </Card>
          </Col>

          {/* Right Side Analytics */}
          <Col xs={24} lg={8} className="h-full">
            <Row gutter={[16, 16]} className="h-full">
              <Col span={24} style={{ height: '50%' }}>
                <Card
                  title={
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Order Analytics</span>
                      <Select defaultValue="month" size="small" style={{ width: 100 }}>
                        <Option value="week">Week</Option>
                        <Option value="month">Month</Option>
                        <Option value="year">Year</Option>
                      </Select>
                    </div>
                  }
                  bordered={false}
                  className="hover:shadow-lg transition-shadow duration-300 h-full"
                  bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)' }}
                >
                  <ReactECharts option={orderAnalyticsOptions} style={{ height: '100%' }} />
                </Card>
              </Col>
              <Col span={24} style={{ height: '50%' }}>
                <Card
                  title={
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Recent Activities</span>
                      <Button icon={<ReloadOutlined />} size="small" />
                    </div>
                  }
                  bordered={false}
                  className="hover:shadow-lg transition-shadow duration-300 h-full"
                  bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)', overflow: 'hidden' }}
                >
                  <div className="h-full overflow-auto">
                    <Timeline className="px-4">
                      {recentActivities.map(activity => (
                        <Timeline.Item 
                          key={activity.id}
                          color={
                            activity.type === 'new' ? 'blue' :
                            activity.type === 'update' ? 'orange' :
                            'green'
                          }
                        >
                          <p className="mb-0">{activity.content}</p>
                          <small className="text-gray-500">{activity.timestamp}</small>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
      <CreateOrderModal 
        visible={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        onCreate={(newOrder) => {
          console.log('New order created:', newOrder);
          // Here you can update your state or make an API call
          setIsModalVisible(false);
        }} 
      />
    </div>
  );
};

export default OrderDashboard;
