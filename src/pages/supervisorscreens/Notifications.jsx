import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Badge, 
  Tag, 
  Button, 
  Tabs, 
  Empty, 
  Space, 
  Row,
  Col,
  Divider,
  Alert,
  Table,
  Tooltip,
  Spin
} from 'antd';
import { Wrench, Package, Bell, CheckCircle, RefreshCw } from 'lucide-react';
import useNotificationStore from '../../store/notification';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Notifications = () => {
  // Get notification store hooks and state
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications,
    initialize,
    isLoading,
    error: storeError
  } = useNotificationStore();

  // Local state
  const [activeTabKey, setActiveTabKey] = useState('all');
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  const [isAcknowledgingAll, setIsAcknowledgingAll] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Initialize store on component mount
  useEffect(() => {
    initialize();
  }, []);
  
  // Sync store error to local error state
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  // Handle manual refresh
  const handleManualRefresh = async () => {
    setTableLoading(true);
    setError(null);
    
    try {
      await fetchNotifications(true);
    } catch (error) {
      console.error('Error in manual refresh:', error);
      setError(error.message || 'Failed to refresh notifications');
    } finally {
      setTableLoading(false);
    }
  };

  // Handle acknowledging a notification
  const handleAcknowledge = async (notification) => {
    const notificationId = notification._uniqueId;
    
    if (processingIds.includes(notificationId)) {
      return; // Already processing this notification
    }
    
    setProcessingIds(prev => [...prev, notificationId]);
    
    try {
      await markAsRead(notification);
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== notificationId));
    }
  };

  // Handle acknowledging all notifications
  const handleAcknowledgeAll = async () => {
    if (isAcknowledgingAll) return;
    
    setIsAcknowledgingAll(true);
    
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error acknowledging all notifications:', error);
    } finally {
      setIsAcknowledgingAll(false);
    }
  };

  // Filter notifications by type and acknowledgment status
  const machineNotifications = notifications.filter(n => n.notificationType === 'machine');
  const materialNotifications = notifications.filter(n => n.notificationType === 'material');
  const unacknowledgedNotifications = notifications.filter(n => !n.is_acknowledged);
  
  // Calculate counts
  const unreadMachineCount = machineNotifications.filter(n => !n.is_acknowledged).length;
  const unreadMaterialCount = materialNotifications.filter(n => !n.is_acknowledged).length;
  const totalUnacknowledgedCount = unacknowledgedNotifications.length;

  // Filter notifications based on active tab
  let filteredNotifications = activeTabKey === 'all' 
    ? notifications 
    : activeTabKey === 'machine' 
      ? machineNotifications 
      : activeTabKey === 'material'
        ? materialNotifications
        : activeTabKey === 'unacknowledged'
          ? unacknowledgedNotifications
          : [];

  // Helper function to get color based on status and type
  const getStatusColor = (status, type) => {
    if (!status) return 'default';
    
    // For machine statuses
    if (type === 'machine') {
      switch (status.toUpperCase()) {
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
      switch (status.toUpperCase()) {
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

  // Get unique status filters
  const getUniqueStatusFilters = (type) => {
    const statuses = new Set();
    const typeNotifications = type === 'all' ? notifications : notifications.filter(n => n.notificationType === type);
    
    typeNotifications.forEach(item => {
      if (item.status_name) {
        statuses.add(item.status_name.toLowerCase());
      }
    });
    
    return Array.from(statuses).map(status => ({
      text: status.toUpperCase(),
      value: status.toLowerCase()
    }));
  };

  // Define columns for machine notifications
  const getMachineColumns = () => [
    {
      title: 'Type',
      key: 'type',
      width: '80px',
      render: () => (
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
        <span><strong>{text || 'Unknown'}</strong> #{record.machine_id || 'N/A'}</span>
      ),
      sorter: (a, b) => {
        const aMake = a.machine_make || '';
        const bMake = b.machine_make || '';
        return aMake.localeCompare(bMake);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      render: (status) => (
        <Tag color={getStatusColor(status, 'machine')}>
          {status?.toUpperCase() || 'UNKNOWN'}
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
        <Tooltip title={text || 'No description'} placement="topLeft">
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
        </Tooltip>
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
      sorter: (a, b) => new Date(a.updated_at || 0) - new Date(b.updated_at || 0),
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
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: '#1890ff' }}
          >
            Acknowledge
          </Button>
        )
      )
    }
  ];

  // Define columns for material notifications
  const getMaterialColumns = () => [
    {
      title: 'Type',
      key: 'type',
      width: '80px',
      render: () => (
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
      render: (text) => <strong>Part #{text || 'Unknown'}</strong>,
      sorter: (a, b) => {
        const aNum = a.part_number || '';
        const bNum = b.part_number || '';
        return aNum.localeCompare(bNum);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      render: (status) => (
        <Tag color={getStatusColor(status, 'material')}>
          {status?.toUpperCase() || 'UNKNOWN'}
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
        <Tooltip title={text || 'No description'} placement="topLeft">
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
        </Tooltip>
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
      sorter: (a, b) => new Date(a.updated_at || 0) - new Date(b.updated_at || 0),
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
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: '#52c41a' }}
          >
            Acknowledge
          </Button>
        )
      )
    }
  ];

  // Get combined columns for all and unacknowledged tabs
  const getCombinedColumns = () => [
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
      ),
      filters: [
        { text: 'Machine', value: 'machine' },
        { text: 'Material', value: 'material' },
      ],
      onFilter: (value, record) => record.notificationType === value,
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <span>
          {record.notificationType === 'machine' 
            ? <strong>{record.machine_make || 'Unknown'} #{record.machine_id || 'N/A'}</strong>
            : <strong>Part #{record.part_number || 'Unknown'}</strong>
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
          {status?.toUpperCase() || 'UNKNOWN'}
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
        <Tooltip title={text || 'No description'} placement="topLeft">
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
        </Tooltip>
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
      sorter: (a, b) => new Date(a.updated_at || 0) - new Date(b.updated_at || 0),
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
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: record.notificationType === 'machine' ? '#1890ff' : '#52c41a' }}
          >
            Acknowledge
          </Button>
        )
      )
    }
  ];

  // Get the appropriate columns based on active tab
  const getColumns = () => {
    switch (activeTabKey) {
      case 'machine':
        return getMachineColumns();
      case 'material':
        return getMaterialColumns();
      default:
        return getCombinedColumns();
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} loading={isLoading && !tableLoading}>
        {error && (
          <Row style={{ marginBottom: '20px' }}>
            <Col span={24}>
              <Alert
                message="Error Loading Notifications"
                description={
                  <>
                    <p>{error}</p>
                    <p>Please try refreshing or check your network connection.</p>
                  </>
                }
                type="error"
                showIcon
                action={
                  <Button
                    type="primary"
                    danger
                    onClick={handleManualRefresh}
                    loading={tableLoading}
                  >
                    Retry
                  </Button>
                }
              />
            </Col>
          </Row>
        )}
        
        <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>Notifications</Title>
            <Text type="secondary">
              View and manage all system notifications {notifications.length > 0 && `(${notifications.length} total)`}
            </Text>
          </Col>
          <Col>
            <Button 
              type="primary"
              onClick={handleManualRefresh}
              loading={tableLoading}
              icon={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
          </Col>
        </Row>
        
        {/* Summary card */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={24}>
            <Card 
              size="small" 
              style={{ 
                background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <Text type="secondary">Total</Text>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{notifications.length}</div>
                  </div>
                  
                  <div>
                    <Space>
                      <Wrench size={16} color="#1890ff" />
                      <Text type="secondary">Machine</Text>
                    </Space>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {machineNotifications.length}
                      {unreadMachineCount > 0 && (
                        <Badge 
                          count={unreadMachineCount} 
                          style={{ backgroundColor: '#1890ff', marginLeft: '8px' }} 
                        />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Space>
                      <Package size={16} color="#52c41a" />
                      <Text type="secondary">Material</Text>
                    </Space>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {materialNotifications.length}
                      {unreadMaterialCount > 0 && (
                        <Badge 
                          count={unreadMaterialCount} 
                          style={{ backgroundColor: '#52c41a', marginLeft: '8px' }} 
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {totalUnacknowledgedCount > 0 && (
                  <Button 
                    type="primary" 
                    onClick={handleAcknowledgeAll}
                    loading={isAcknowledgingAll}
                    icon={<CheckCircle size={16} />}
                  >
                    Acknowledge All ({totalUnacknowledgedCount})
                  </Button>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Tabs 
          activeKey={activeTabKey} 
          onChange={setActiveTabKey}
          style={{ marginBottom: '24px' }}
          type="card"
        >
          <TabPane tab="All Notifications" key="all" />
          <TabPane 
            tab={
              <span>
                Machine Notifications
                {unreadMachineCount > 0 && (
                  <Badge 
                    count={unreadMachineCount} 
                    style={{ marginLeft: '8px' }} 
                  />
                )}
              </span>
            } 
            key="machine" 
          />
          <TabPane 
            tab={
              <span>
                Material Notifications
                {unreadMaterialCount > 0 && (
                  <Badge 
                    count={unreadMaterialCount} 
                    style={{ marginLeft: '8px' }} 
                  />
                )}
              </span>
            } 
            key="material" 
          />
          <TabPane 
            tab={
              <span>
                Unacknowledged
                {totalUnacknowledgedCount > 0 && (
                  <Badge 
                    count={totalUnacknowledgedCount} 
                    style={{ marginLeft: '8px' }} 
                  />
                )}
              </span>
            } 
            key="unacknowledged" 
          />
        </Tabs>

        {/* Alert for unacknowledged tab */}
        {activeTabKey === 'unacknowledged' && totalUnacknowledgedCount > 0 && (
          <Alert
            message={`${totalUnacknowledgedCount} notifications require your attention`}
            type="warning"
            showIcon
            action={
              <Button 
                type="primary" 
                onClick={handleAcknowledgeAll}
                loading={isAcknowledgingAll}
              >
                Acknowledge All
              </Button>
            }
            style={{ marginBottom: '24px', borderRadius: '4px' }}
          />
        )}

        <Divider />

        {isLoading || tableLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" style={{ marginBottom: '20px' }} />
              <div>
                <Text>Loading notifications...</Text>
              </div>
            </div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <Table 
            dataSource={filteredNotifications}
            columns={getColumns()}
            rowKey={(record) => record._uniqueId || `${record.notificationType}-${record.id || record.machine_id || record.part_number}-${record.updated_at}`}
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
            style={{ padding: '40px 0' }}
          />
        )}
      </Card>
    </div>
  );
};

export default Notifications;

// Add component styles
const styles = {
  unreadRow: {
    backgroundColor: '#fafafa',
    transition: 'background-color 0.3s ease',
  },
  unreadRowHover: {
    backgroundColor: '#f0f0f0',
  },
  tableRow: {
    transition: 'all 0.3s ease',
  },
  tableRowHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  card: {
    transition: 'all 0.3s ease',
  },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  badge: {
    transition: 'all 0.3s ease',
  },
  badgeHover: {
    transform: 'scale(1.1)',
  },
  button: {
    transition: 'all 0.3s ease',
  },
  buttonHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
  }
}; 