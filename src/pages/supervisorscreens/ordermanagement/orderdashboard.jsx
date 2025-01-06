import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Button, Space, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import OrderStats from '../../../components/OrderManagement/OrderStats';
import OrderTable from '../../../components/OrderManagement/OrderTable';
import CreateOrderModal from '../../../components/OrderManagement/CreateOrderModal';
import OrderFilters from '../../../components/OrderManagement/OrderFilters';
import { mockOrders } from '../../../data/mockOrders';

const { TabPane } = Tabs;

const OrderDashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reorderList, setReorderList] = useState([
    {
      orderNumber: 'ORD-2024-001-R1',
      materialNumber: 'MAT-001',
      materialDescription: 'Aluminum Casting Component',
      targetQuantity: 1000,
      launchedQuantity: 0,
      plant: 'Plant-01',
      wbsElement: 'WBS-001',
      salesOrderNumber: 'SO-001',
      deliveryDate: '2024-04-15',
      status: 'in_progress',
      priority: 'high'
    },
    {
      orderNumber: 'ORD-2024-002-R1',
      materialNumber: 'MAT-002',
      materialDescription: 'Steel Bearing Housing',
      targetQuantity: 500,
      launchedQuantity: 0,
      plant: 'Plant-02',
      wbsElement: 'WBS-002',
      salesOrderNumber: 'SO-002',
      deliveryDate: '2024-04-20',
      status: 'in_progress',
      priority: 'high'
    }
  ]);

  // Filter orders based on selected filters
  const getFilteredOrders = () => {
    let filtered = [...mockOrders];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        order.materialNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        order.materialDescription.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply date range filter
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.deliveryDate);
        return orderDate >= start && orderDate <= end;
      });
    }

    return filtered;
  };

  // Handle reorder action
  const handleReorder = (order) => {
    const newOrder = {
      orderNumber: `${order.orderNumber}-R${Math.floor(Math.random() * 1000)}`,
      materialNumber: order.materialNumber,
      materialDescription: order.materialDescription,
      targetQuantity: order.targetQuantity,
      launchedQuantity: 0,
      plant: order.plant,
      wbsElement: order.wbsElement,
      salesOrderNumber: order.salesOrderNumber,
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'in_progress',
      priority: order.priority
    };

    setReorderList(prev => [...prev, newOrder]);
    setActiveTab('5');
    message.success(`Order ${order.orderNumber} has been reordered successfully`);
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <OrderStats orders={getFilteredOrders()} />

      {/* Main Content */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Order Management</h2>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              className="bg-blue-500"
            >
              Create New Order
            </Button>
          </Space>
        </div>

        {/* Filters Section */}
        <OrderFilters 
          searchText={searchText}
          setSearchText={setSearchText}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {/* Orders Table with Tabs */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="production-tabs mt-4"
        >
          <TabPane tab="All Orders" key="1">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">All Orders List</h3>
              </div>
              <OrderTable 
                orders={getFilteredOrders()} 
                onReorder={handleReorder}
                showReorderButton={true}
              />
            </Card>
          </TabPane>
          <TabPane tab="In Progress" key="2">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">In Progress Orders</h3>
              </div>
              <OrderTable 
                orders={getFilteredOrders().filter(o => o.status === 'in_progress')}
                onReorder={handleReorder}
                showReorderButton={true}
              />
            </Card>
          </TabPane>
          <TabPane tab="Completed" key="3">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Completed Orders</h3>
              </div>
              <OrderTable 
                orders={getFilteredOrders().filter(o => o.status === 'completed')}
                onReorder={handleReorder}
                showReorderButton={true}
              />
            </Card>
          </TabPane>
          <TabPane tab="Delayed" key="4">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Delayed Orders</h3>
              </div>
              <OrderTable 
                orders={getFilteredOrders().filter(o => o.status === 'delayed')}
                onReorder={handleReorder}
                showReorderButton={true}
              />
            </Card>
          </TabPane>
          <TabPane 
            tab={
              <span>
                <ReloadOutlined />
                Reorder List
              </span>
            } 
            key="5"
          >
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Reordered Items</h3>
                <Space>
                  
                </Space>
              </div>
             
              <OrderTable 
                orders={getFilteredOrders()} 
                onReorder={handleReorder}
                showReorderButton={true}
                isReorderList={true}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Create Order Modal */}
      <CreateOrderModal 
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSubmit={(values) => {
          console.log('New order:', values);
          setIsModalVisible(false);
        }}
      />
    </div>
  );
};

export default OrderDashboard;
