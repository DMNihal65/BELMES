
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  List, 
  Badge, 
  Tag, 
  Button, 
  Tabs, 
  Empty, 
  Select, 
  DatePicker, 
  Space, 
  Input,
  Row,
  Col,
  Divider,
  Switch,
  Alert,
  Table
} from 'antd';
import { Wrench, Package, Search, Filter, Bell, CheckCircle } from 'lucide-react';
import useNotificationStore from '../../store/notification';
import { format, parseISO } from 'date-fns';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock data for testing UI when API fails
const MOCK_NOTIFICATIONS = [
  {
    id: 'm1',
    machine_id: 86,
    machine_make: 'CNC Machine',
    status_name: 'MAINTENANCE',
    description: 'Routine maintenance required. Please check lubrication system.',
    created_by: 'System',
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    is_acknowledged: false,
    notificationType: 'machine'
  },
  {
    id: 'm2',
    machine_id: 92,
    machine_make: 'Lathe',
    status_name: 'ERROR',
    description: 'Temperature exceeds normal range. Shutdown recommended.',
    created_by: 'Monitoring System',
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    is_acknowledged: true,
    acknowledged_by: 'John Doe',
    acknowledged_at: new Date(Date.now() - 3600000).toISOString(),
    notificationType: 'machine'
  },
  {
    id: 'r1',
    part_number: '213001220002',
    status_name: 'LOW STOCK',
    description: 'Material inventory below threshold. Please reorder.',
    created_by: 'Inventory System',
    updated_at: new Date(Date.now() - 5400000).toISOString(),
    is_acknowledged: false,
    notificationType: 'material'
  }
];

const Notifications = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    connectWebSockets,
    fetchNotifications
  } = useNotificationStore();

  const [activeTabKey, setActiveTabKey] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [acknowledgedFilter, setAcknowledgedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [useMockData, setUseMockData] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchNotifications(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      // Any cleanup if needed
    };
  }, []);

  useEffect(() => {
    if (useMockData || (notifications.length === 0 && !isLoading && !error)) {
      setDisplayNotifications(MOCK_NOTIFICATIONS);
    } else {
      setDisplayNotifications(notifications);
    }
    
    console.log('Current notifications state:', {
      total: notifications.length,
      machines: notifications.filter(n => n.notificationType === 'machine').length,
      materials: notifications.filter(n => n.notificationType === 'material').length
    });
  }, [notifications, isLoading, error, useMockData]);

  // Add a manual refresh function
  const handleManualRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass true to show error messages for manual refreshes
      await fetchNotifications(true);
      
      // Update debug info
      setDebugInfo({
        time: new Date().toISOString(),
        notificationsCount: notifications.length,
        machineCount: notifications.filter(n => n.notificationType === 'machine').length,
        materialCount: notifications.filter(n => n.notificationType === 'material').length
      });
    } catch (error) {
      console.error('Error in manual refresh:', error);
      setError(error.message || 'Failed to refresh notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notifications by type and acknowledgment status
  const machineNotifications = displayNotifications.filter(n => n.notificationType === 'machine');
  const materialNotifications = displayNotifications.filter(n => n.notificationType === 'material');
  const unacknowledgedNotifications = displayNotifications.filter(n => !n.is_acknowledged);
  
  // Calculate counts
  const unreadMachineCount = machineNotifications.filter(n => !n.is_acknowledged).length;
  const unreadMaterialCount = materialNotifications.filter(n => !n.is_acknowledged).length;
  const totalUnacknowledgedCount = unacknowledgedNotifications.length;
  const unreadCount = unreadMachineCount + unreadMaterialCount;

  // Base filtered notifications by tab
  let filteredNotifications = activeTabKey === 'all' 
    ? displayNotifications 
    : activeTabKey === 'machine' 
      ? machineNotifications 
      : activeTabKey === 'material'
        ? materialNotifications
        : activeTabKey === 'unacknowledged'
          ? unacknowledgedNotifications
          : [];

  // Get unique statuses for the filter dropdown
  const getUniqueStatuses = () => {
    const statuses = new Set();
    displayNotifications.forEach(item => {
      if (item.status_name) {
        statuses.add(item.status_name.toLowerCase());
      }
    });
    return Array.from(statuses);
  };

  // Helper function to get color based on status and type
  const getStatusColor = (status, type) => {
    // For machine statuses
    if (type === 'machine') {
      switch (status?.toUpperCase()) {
        case 'ON':
          return 'green';
        case 'OFF':
          return 'red';
        case 'IDLE':
          return 'orange';
        case 'MAINTENANCE':
          return 'blue';
        case 'ERROR':
          return 'red';
        default:
          return 'blue';
      }
    } 
    // For material statuses
    else {
      switch (status?.toUpperCase()) {
        case 'AVAILABLE':
          return 'green';
        case 'LOW STOCK':
          return 'orange';
        case 'OUT OF STOCK':
          return 'red';
        case 'PENDING':
          return 'blue';
        default:
          return 'green';
      }
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Define columns for the table view
  const getMachineColumns = () => [
    {
      title: 'Type',
      key: 'type',
      width: '80px',
      render: (_, record) => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: '40px',
          height: '40px',
          background: '#e6f7ff',
          borderRadius: '50%',
          border: '1px solid #91d5ff'
        }}>
          <Wrench size={18} color="#1890ff" />
        </div>
      )
    },
    {
      title: 'Machine',
      dataIndex: 'machine_make',
      key: 'machine_make',
      render: (text, record) => (
        <span><strong>{text}</strong> #{record.machine_id}</span>
      ),
      sorter: (a, b) => a.machine_make.localeCompare(b.machine_make),
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      render: (status) => (
        <Tag color={getStatusColor(status, 'machine')}>
          {status?.toUpperCase()}
        </Tag>
      ),
      filters: getUniqueStatusFilters('machine'),
      onFilter: (value, record) => record.status_name?.toLowerCase() === value.toLowerCase(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '30%',
      ellipsis: { showTitle: false },
      render: (text) => (
        <div style={{ 
          maxHeight: '60px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'normal', 
          display: '-webkit-box', 
          WebkitLineClamp: 3, 
          WebkitBoxOrient: 'vertical' 
        }}>
          {text || 'No description provided'}
        </div>
      )
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (text) => text || 'System',
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
      defaultSortOrder: 'descend',
      render: (date) => formatDate(date)
    },
    {
      title: 'Acknowledged',
      dataIndex: 'is_acknowledged',
      key: 'is_acknowledged',
      filters: [
        { text: 'Acknowledged', value: true },
        { text: 'Unacknowledged', value: false },
      ],
      onFilter: (value, record) => record.is_acknowledged === value,
      render: (isAcknowledged, record) => (
        isAcknowledged ? (
          <div>
            <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
            <span>By: {record.acknowledged_by || 'System'}</span>
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => markAsRead(record)}
            style={{ background: '#1890ff' }}
          >
            Acknowledge
          </Button>
        )
      )
    }
  ];

  const getMaterialColumns = () => [
    {
      title: 'Type',
      key: 'type',
      width: '80px',
      render: (_, record) => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: '40px',
          height: '40px',
          background: '#f6ffed',
          borderRadius: '50%',
          border: '1px solid #b7eb8f'
        }}>
          <Package size={18} color="#52c41a" />
        </div>
      )
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      render: (text) => <strong>Part #{text}</strong>,
      sorter: (a, b) => a.part_number.localeCompare(b.part_number),
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      render: (status) => (
        <Tag color={getStatusColor(status, 'material')}>
          {status?.toUpperCase()}
        </Tag>
      ),
      filters: getUniqueStatusFilters('material'),
      onFilter: (value, record) => record.status_name?.toLowerCase() === value.toLowerCase(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '30%',
      ellipsis: { showTitle: false },
      render: (text) => (
        <div style={{ 
          maxHeight: '60px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'normal', 
          display: '-webkit-box', 
          WebkitLineClamp: 3, 
          WebkitBoxOrient: 'vertical' 
        }}>
          {text || 'No description provided'}
        </div>
      )
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (text) => text || 'System',
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
      defaultSortOrder: 'descend',
      render: (date) => formatDate(date)
    },
    {
      title: 'Acknowledged',
      dataIndex: 'is_acknowledged',
      key: 'is_acknowledged',
      filters: [
        { text: 'Acknowledged', value: true },
        { text: 'Unacknowledged', value: false },
      ],
      onFilter: (value, record) => record.is_acknowledged === value,
      render: (isAcknowledged, record) => (
        isAcknowledged ? (
          <div>
            <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
            <span>By: {record.acknowledged_by || 'System'}</span>
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => markAsRead(record)}
            style={{ background: '#52c41a' }}
          >
            Acknowledge
          </Button>
        )
      )
    }
  ];

  // Function to get unique status values for filters
  function getUniqueStatusFilters(type) {
    const statuses = new Set();
    displayNotifications
      .filter(n => n.notificationType === type)
      .forEach(item => {
        if (item.status_name) {
          statuses.add(item.status_name.toLowerCase());
        }
      });
    
    return Array.from(statuses).map(status => ({
      text: status.toUpperCase(),
      value: status.toLowerCase()
    }));
  }

  // Function to handle table changes (sorting, filtering, pagination)
  const handleTableChange = (pagination, filters, sorter, extra) => {
    console.log('Table params changed:', { pagination, filters, sorter, extra });
  };

  // Add debug information display (you can remove this in production)
  {process.env.NODE_ENV === 'development' && (
    <Row style={{ marginBottom: '16px' }}>
      <Col span={24}>
        <Card size="small" title="Debug Info">
          <pre>
            {JSON.stringify({
              total: displayNotifications.length,
              machine: machineNotifications.length,
              material: materialNotifications.length,
              unacknowledged: unacknowledgedNotifications.length,
              unreadMachine: unreadMachineCount,
              unreadMaterial: unreadMaterialCount
            }, null, 2)}
          </pre>
        </Card>
      </Col>
    </Row>
  )}

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} loading={isLoading}>
        {error && (
          <Row style={{ marginBottom: '20px' }}>
            <Col span={24}>
              <Card
                title="Error Loading Notifications"
                style={{ borderColor: '#ff4d4f' }}
                extra={
                  <Button
                    type="primary"
                    danger
                    onClick={handleManualRefresh}
                  >
                    Retry
                  </Button>
                }
              >
                <p>{error}</p>
                <p>Please try refreshing the page or check your network connection.</p>
              </Card>
            </Col>
          </Row>
        )}
        
        <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>Notifications</Title>
            <Text type="secondary">
              View and manage all system notifications {displayNotifications.length > 0 && `(${displayNotifications.length} total)`}
            </Text>
          </Col>
        </Row>

        <Row style={{ marginBottom: '16px' }}>
          <Col span={24}>
            {/* Removing the Notification Filter card */}
          </Col>
          {filteredNotifications.length > 0 && (
            <Col span={24}>
              <Text type="secondary" style={{ display: 'block', textAlign: 'right' }}>
                Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} 
                {activeTabKey !== 'all' && ` (${activeTabKey})`}
                {searchText && ` matching "${searchText}"`}
              </Text>
            </Col>
          )}
        </Row>
        
        {/* Summary cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={8}>
            <Card 
              size="small" 
              style={{ 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div>
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>Total Notifications</Text>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  margin: '12px 0',
                  color: '#262626' 
                }}>
                  {notifications.length}
                </div>
                <Text type="secondary">
                  <Badge status={unreadCount > 0 ? "warning" : "success"} />
                  {unreadCount} unacknowledged
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} md={8}>
            <Card 
              size="small" 
              style={{ 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div>
                <Space>
                  <Wrench size={16} color="#1890ff" />
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>Machine Notifications</Text>
                </Space>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  margin: '12px 0',
                  color: '#262626'
                }}>
                  {machineNotifications.length}
                </div>
                <Text type="secondary">
                  <Badge status={unreadMachineCount > 0 ? "warning" : "success"} />
                  {unreadMachineCount} unacknowledged
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} md={8}>
            <Card 
              size="small" 
              style={{ 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div>
                <Space>
                  <Package size={16} color="#52c41a" />
                  <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>Material Notifications</Text>
                </Space>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  margin: '12px 0',
                  color: '#262626'
                }}>
                  {materialNotifications.length}
                </div>
                <Text type="secondary">
                  <Badge status={unreadMaterialCount > 0 ? "warning" : "success"} />
                  {unreadMaterialCount} unacknowledged
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Tabs 
          activeKey={activeTabKey} 
          onChange={setActiveTabKey}
          size="large"
          style={{ 
            marginBottom: '24px',
            background: '#fff',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          type="card"
        >
          <TabPane 
            tab={
              <span style={{ padding: '0 8px' }}>
                <Space>
                  <Bell size={18} />
                  All Notifications
                  {notifications.length > 0 && (
                    <Badge 
                      count={notifications.length} 
                      style={{ 
                        backgroundColor: '#1890ff',
                        boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
                      }} 
                    />
                  )}
                </Space>
              </span>
            } 
            key="all" 
          />
          <TabPane 
            tab={
              <span style={{ padding: '0 8px' }}>
                <Space>
                  <Wrench size={18} />
                  Machine Notifications
                  {machineNotifications.length > 0 && (
                    <Badge 
                      count={machineNotifications.length} 
                      style={{ 
                        backgroundColor: '#1890ff',
                        boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
                      }} 
                    />
                  )}
                </Space>
              </span>
            } 
            key="machine" 
          />
          <TabPane 
            tab={
              <span style={{ padding: '0 8px' }}>
                <Space>
                  <Package size={18} />
                  Material Notifications
                  {materialNotifications.length > 0 && (
                    <Badge 
                      count={materialNotifications.length} 
                      style={{ 
                        backgroundColor: '#52c41a',
                        boxShadow: '0 2px 4px rgba(82,196,26,0.3)'
                      }} 
                    />
                  )}
                </Space>
              </span>
            } 
            key="material" 
          />
          <TabPane 
            tab={
              <span style={{ padding: '0 8px' }}>
                <Space>
                  <Bell size={18} />
                  Unacknowledged
                  {unacknowledgedNotifications.length > 0 && (
                    <Badge 
                      count={unacknowledgedNotifications.length} 
                      style={{ 
                        backgroundColor: '#ff4d4f',
                        boxShadow: '0 2px 4px rgba(255,77,79,0.3)'
                      }} 
                    />
                  )}
                </Space>
              </span>
            } 
            key="unacknowledged" 
          />
        </Tabs>

        {/* Add summary for unacknowledged tab */}
        {activeTabKey === 'unacknowledged' && (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              {totalUnacknowledgedCount > 0 ? (
                <Alert
                  message={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Space size="large">
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {totalUnacknowledgedCount} Unacknowledged Notification{totalUnacknowledgedCount !== 1 ? 's' : ''}
                        </span>
                        <Divider type="vertical" />
                        <Space>
                          <Wrench size={16} />
                          <span>{unreadMachineCount} Machine</span>
                        </Space>
                        <Space>
                          <Package size={16} />
                          <span>{unreadMaterialCount} Material</span>
                        </Space>
                      </Space>
                      <Button 
                        type="primary" 
                        onClick={markAllAsRead}
                        icon={<CheckCircle size={16} />}
                        style={{
                          background: '#1890ff',
                          borderColor: '#1890ff',
                          boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
                        }}
                      >
                        Acknowledge All
                      </Button>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(250,173,20,0.1)'
                  }}
                />
              ) : (
                <Alert
                  message="All Caught Up!"
                  description="All notifications have been acknowledged."
                  type="success"
                  showIcon
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(82,196,26,0.1)'
                  }}
                />
              )}
            </Col>
          </Row>
        )}

        <Divider />

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '20px' }}>
                {activeTabKey === 'machine' ? (
                  <Wrench size={40} color="#1890ff" />
                ) : activeTabKey === 'material' ? (
                  <Package size={40} color="#52c41a" />
                ) : (
                  <Bell size={40} color="#722ed1" />
                )}
              </div>
              <Text>Loading notifications...</Text>
            </div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <Table 
            dataSource={filteredNotifications}
            columns={
              activeTabKey === 'machine' ? getMachineColumns() :
              activeTabKey === 'material' ? getMaterialColumns() :
              // Use combined columns for 'all' and 'unacknowledged' tabs
              [
                {
                  title: 'Type',
                  key: 'type',
                  width: '80px',
                  render: (_, record) => (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      width: '40px',
                      height: '40px',
                      background: record.notificationType === 'machine' ? '#e6f7ff' : '#f6ffed',
                      borderRadius: '50%',
                      border: `1px solid ${record.notificationType === 'machine' ? '#91d5ff' : '#b7eb8f'}`
                    }}>
                      {record.notificationType === 'machine' 
                        ? <Wrench size={18} color="#1890ff" /> 
                        : <Package size={18} color="#52c41a" />
                      }
                    </div>
                  )
                },
                {
                  title: 'Details',
                  key: 'details',
                  render: (_, record) => (
                    <span>
                      {record.notificationType === 'machine' 
                        ? <strong>{record.machine_make} #{record.machine_id}</strong>
                        : <strong>Part #{record.part_number}</strong>
                      }
                    </span>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'status_name',
                  key: 'status_name',
                  render: (status, record) => (
                    <Tag color={getStatusColor(status, record.notificationType)}>
                      {status?.toUpperCase()}
                    </Tag>
                  ),
                  filters: [
                    ...getUniqueStatusFilters('machine').map(f => ({ ...f, text: `Machine: ${f.text}` })),
                    ...getUniqueStatusFilters('material').map(f => ({ ...f, text: `Material: ${f.text}` }))
                  ],
                  onFilter: (value, record) => record.status_name?.toLowerCase() === value.toLowerCase(),
                },
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                  width: '30%',
                  ellipsis: { showTitle: false },
                  render: (text) => (
                    <div style={{ 
                      maxHeight: '60px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'normal', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical' 
                    }}>
                      {text || 'No description provided'}
                    </div>
                  )
                },
                {
                  title: 'Created By',
                  dataIndex: 'created_by',
                  key: 'created_by',
                  render: (text) => text || 'System',
                },
                {
                  title: 'Updated At',
                  dataIndex: 'updated_at',
                  key: 'updated_at',
                  sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
                  defaultSortOrder: 'descend',
                  render: (date) => formatDate(date)
                },
                {
                  title: 'Acknowledged',
                  dataIndex: 'is_acknowledged',
                  key: 'is_acknowledged',
                  filters: [
                    { text: 'Acknowledged', value: true },
                    { text: 'Unacknowledged', value: false },
                  ],
                  onFilter: (value, record) => record.is_acknowledged === value,
                  render: (isAcknowledged, record) => (
                    isAcknowledged ? (
                      <div>
                        <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
                        <span>By: {record.acknowledged_by || 'System'}</span>
                      </div>
                    ) : (
                      <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => markAsRead(record)}
                        style={{ background: record.notificationType === 'machine' ? '#1890ff' : '#52c41a' }}
                      >
                        Acknowledge
                      </Button>
                    )
                  )
                }
              ]
            }
            rowKey={(record) => `${record.notificationType}-${record.id || record.machine_id || record.part_number}-${record.updated_at}`}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Total ${total} notification${total !== 1 ? 's' : ''}`,
              style: { marginTop: '16px' }
            }}
            rowClassName={(record) => 
              !record.is_acknowledged 
                ? 'unread-row' 
                : ''
            }
            style={{
              background: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
        ) : (
          <Empty 
            description={
              <span>
                {activeTabKey === 'unacknowledged' 
                  ? 'No unacknowledged notifications' 
                  : 'No notifications found'}
              </span>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default Notifications; 

<style jsx>{`
  .unread-row {
    background-color: #fafafa;
    transition: background-color 0.3s ease;
  }
  
  .unread-row:hover {
    background-color: #f0f0f0;
  }

  .ant-table-row {
    transition: all 0.3s ease;
  }

  .ant-table-row:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .ant-card {
    transition: all 0.3s ease;
  }

  .ant-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .ant-badge {
    transition: all 0.3s ease;
  }

  .ant-badge:hover {
    transform: scale(1.1);
  }

  .ant-btn {
    transition: all 0.3s ease;
  }

  .ant-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(24,144,255,0.3);
  }
`}</style> 