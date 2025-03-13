import React, { useEffect, useState } from 'react';
import { Tabs, Table, Card, Badge, Select, Button, Space, Tag, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import useMachineMaintenanceStore from '../../../store/maintenance';
import { format, parseISO } from 'date-fns';

const { TabPane } = Tabs;

const LogsDashboard = () => {
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

  useEffect(() => {
    if (activeTab === 'machine') {
      fetchMachineNotifications();
    } else {
      fetchComponentNotifications();
    }
    setCurrentPage(1);
  }, [activeTab, notificationsLimit, fetchMachineNotifications, fetchComponentNotifications]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const handleLimitChange = (value) => {
    setNotificationsLimit(value);
    setCurrentPage(1);
  };

  const refreshData = () => {
    if (activeTab === 'machine') {
      fetchMachineNotifications();
    } else {
      fetchComponentNotifications();
    }
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

  const notificationColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '15%',
      render: (type) => (
        <Tag color={type === 'machine' ? 'blue' : 'purple'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '45%',
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      width: '10%',
      render: (status) => (
        <Tag color={status === 'active' ? 'warning' : 'success'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '20%',
      render: (date) => (
        <Tooltip title={format(parseISO(date), 'dd/MM/yyyy HH:mm:ss')}>
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {format(parseISO(date), 'dd/MM/yyyy HH:mm')}
          </span>
        </Tooltip>
      ),
    },
  ];

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    
    if (activeTab === 'machine') {
      fetchMachineNotifications();
    } else {
      fetchComponentNotifications();
    }
  };

  return (
    <div className="p-6">
      <Card bordered={false}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">System Logs</h1>
          <Space>
            <Select
              value={notificationsLimit}
              onChange={handleLimitChange}
              style={{ width: 120 }}
            >
              <Select.Option value={5}>Latest 5</Select.Option>
              <Select.Option value={10}>Latest 10</Select.Option>
              <Select.Option value={15}>Latest 15</Select.Option>
              <Select.Option value={20}>Latest 20</Select.Option>
              <Select.Option value={-1}>All</Select.Option>
            </Select>
            <Tooltip title="Refresh">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={refreshData}
                loading={loading}
              />
            </Tooltip>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane
            tab={
              <Badge count={0} offset={[10, 0]}>
                <span>Notifications</span>
              </Badge>
            }
            key="notifications"
          >
            <Table
              columns={notificationColumns}
              dataSource={[]}
              rowKey={(record) => record.id}
              loading={loading && activeTab === 'notifications'}
              pagination={{
                current: currentPage,
                pageSize: notificationsLimit === -1 ? undefined : pageSize,
                total: 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} notifications`,
                position: ['bottomCenter'],
              }}
              onChange={handleTableChange}
              size="middle"
              bordered
              locale={{ emptyText: 'No notifications available' }}
            />
          </TabPane>
          <TabPane 
            tab={
              <Badge count={totalMachineNotifications} offset={[10, 0]}>
                <span>Machine Status</span>
              </Badge>
            } 
            key="machine"
          >
            <Table
              columns={machineColumns}
              dataSource={machineNotifications}
              rowKey={(record) => `${record.machine_make}-${record.updated_at}`}
              loading={loading && activeTab === 'machine'}
              pagination={{
                current: currentPage,
                pageSize: notificationsLimit === -1 ? undefined : pageSize,
                total: totalMachineNotifications,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} notifications`,
                position: ['bottomCenter'],
              }}
              onChange={handleTableChange}
              size="middle"
              bordered
            />
          </TabPane>
          <TabPane 
            tab={
              <Badge count={totalComponentNotifications} offset={[10, 0]}>
                <span>Component Status</span>
              </Badge>
            } 
            key="component"
          >
            <Table
              columns={componentColumns}
              dataSource={componentNotifications}
              rowKey={(record) => `${record.part_number}-${record.updated_at}`}
              loading={loading && activeTab === 'component'}
              pagination={{
                current: currentPage,
                pageSize: notificationsLimit === -1 ? undefined : pageSize,
                total: totalComponentNotifications,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} notifications`,
                position: ['bottomCenter'],
              }}
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

export default LogsDashboard; 