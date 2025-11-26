import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import maintenanceAnimation from '../../../assets/maintence.json';
import { Tabs, Table, Card, Badge, Select, Button, Space, Tag, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import useMachineMaintenanceStore from '../../../store/maintenance';
import { format, parseISO } from 'date-fns';

const { TabPane } = Tabs;

const Notifications = () => {
  const {
    machineNotifications,
    componentNotifications,
    totalMachineNotifications,
    totalComponentNotifications,
    loading,
    error,
    fetchMachineNotifications,
    fetchComponentNotifications,
    setNotificationsLimit,
    notificationsLimit
  } = useMachineMaintenanceStore();

  const [activeTab, setActiveTab] = useState('machine');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch data on component mount and when limit changes
  useEffect(() => {
    if (activeTab === 'machine') {
      fetchMachineNotifications();
    } else {
      fetchComponentNotifications();
    }
    setCurrentPage(1); // Reset to first page when tab or limit changes
  }, [activeTab, notificationsLimit, fetchMachineNotifications, fetchComponentNotifications]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1); // Reset page when changing tabs
  };

  const handleLimitChange = (value) => {
    setNotificationsLimit(value);
    setCurrentPage(1); // Reset page when changing limit
  };

  const refreshData = () => {
    if (activeTab === 'machine') {
      fetchMachineNotifications();
    } else {
      fetchComponentNotifications();
    }
    setCurrentPage(1); // Reset page on refresh
  };

  // Improved sorting function that ensures latest notifications are at the top
  const sortNotificationsByDate = (notifications) => {
    return notifications.slice().sort((a, b) => {
      const dateA = parseISO(a.updated_at);
      const dateB = parseISO(b.updated_at);
      return dateB.getTime() - dateA.getTime();
    });
  };

  // Memoized sorted notifications
  const sortedMachineNotifications = React.useMemo(() => {
    return sortNotificationsByDate(machineNotifications);
  }, [machineNotifications]);

  const sortedComponentNotifications = React.useMemo(() => {
    return sortNotificationsByDate(componentNotifications);
  }, [componentNotifications]);

  // Handle pagination change
  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    
    // Fetch new data based on pagination
    if (activeTab === 'machine') {
      fetchMachineNotifications();
    } else {
      fetchComponentNotifications();
    }
  };

  // Get current page data
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };

  const machineColumns = [
    {
      title: 'Machine',
      dataIndex: 'machine_make',
      key: 'machine_make',
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      width: '10%',
      render: (status) => (
        <Tag color={status === 'ON' ? 'success' : 'error'}>
          {status}
        </Tag>
      )
    },
    
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: '20%',
      render: (date) => (
        <Tooltip title={format(parseISO(date), 'dd/MM/yyyy HH:mm:ss')}>
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {format(parseISO(date), 'dd/MM/yyyy HH:mm')}
          </span>
        </Tooltip>
      ),
      defaultSortOrder: 'descend',
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
    }
  ];

  const componentColumns = [
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      width: '10%',
      render: (status) => (
        <Tag color={status === 'Available' ? 'success' : 'error'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '45%',
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: '20%',
      render: (date) => (
        <Tooltip title={format(parseISO(date), 'dd/MM/yyyy HH:mm:ss')}>
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {format(parseISO(date), 'dd/MM/yyyy HH:mm')}
          </span>
        </Tooltip>
      ),
      defaultSortOrder: 'descend',
      sorter: true
    }
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 mr-2 drop-shadow-md">
              <Lottie
                animationData={maintenanceAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '56px', height: '56px', filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))' }}
              />
            </div>
            <div className="text-lg font-semibold">MAINTENANCE LOGS</div>
          </div>
          <Space>
            <Select
              value={notificationsLimit}
              onChange={handleLimitChange}
              style={{ width: 120 }}
            >
              <Select.Option value={5}>Latest 5</Select.Option>
              <Select.Option value={10}>Latest 10</Select.Option>
              <Select.Option value={20}>Latest 20</Select.Option>
              <Select.Option value={50}>Latest 50</Select.Option>
              <Select.Option value={-1}>All</Select.Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane 
            tab={
             
                <span>Machine Status</span>
             
            } 
            key="machine"
          >
            <Table
              columns={machineColumns}
              dataSource={sortedMachineNotifications}
              rowKey={(record) => `${record.machine_make}-${record.updated_at}`}
              loading={loading && activeTab === 'machine'}
              // pagination={{
              //   current: currentPage,
              //   pageSize: notificationsLimit === -1 ? undefined : pageSize,
              //   total: totalMachineNotifications,
              //   showSizeChanger: true,
              //   showQuickJumper: true,
              //   showTotal: (total) => `Total ${total} notifications`,
              //   position: ['bottomCenter'],
              //   onChange: (page) => {
              //     setCurrentPage(page);
              //     // Fetch new data when page changes
              //     fetchMachineNotifications();
              //   }
              // }}
              onChange={handleTableChange}
              size="middle"
              bordered
            />
          </TabPane>
          <TabPane 
            tab={
         
                <span>Component Status</span>
        
            } 
            key="component"
          >
            <Table
              columns={componentColumns}
              dataSource={sortedComponentNotifications}
              rowKey={(record) => `${record.part_number}-${record.updated_at}`}
              loading={loading && activeTab === 'component'}
              // pagination={{
              //   current: currentPage,
              //   pageSize: notificationsLimit === -1 ? undefined : pageSize,
              //   total: totalComponentNotifications,
              //   showSizeChanger: true,
              //   showQuickJumper: true,
              //   showTotal: (total) => `Total ${total} notifications`,
              //   position: ['bottomCenter'],
              //   onChange: (page) => {
              //     setCurrentPage(page);
              //     // Fetch new data when page changes
              //     fetchComponentNotifications();
              //   }
              // }}
              onChange={handleTableChange}
              size="middle"
              bordered
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Notifications; 