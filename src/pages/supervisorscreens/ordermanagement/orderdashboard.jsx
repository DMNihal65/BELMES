import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
            <OrderTable orders={getFilteredOrders()} />
          </TabPane>
          <TabPane tab="In Progress" key="2">
            <OrderTable 
              orders={getFilteredOrders().filter(o => o.status === 'in_progress')} 
            />
          </TabPane>
          <TabPane tab="Completed" key="3">
            <OrderTable 
              orders={getFilteredOrders().filter(o => o.status === 'completed')} 
            />
          </TabPane>
          <TabPane tab="Delayed" key="4">
            <OrderTable 
              orders={getFilteredOrders().filter(o => o.status === 'delayed')} 
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Create Order Modal */}
      <CreateOrderModal 
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
      />
    </div>
  );
};

export default OrderDashboard;
