import { Avatar, Button, Dropdown, Input, Layout, Space, Badge, List, Typography, Empty, Tabs, Tag, Spin } from 'antd';
import { LogOut, Menu as MenuIcon, Search, User, Bell, Wrench, Package } from 'lucide-react';
import useAuthStore from '../../store/auth-store';
import useStore from '../../store/useStore';
import useNotificationStore from '../../store/notification';
import { useNavigate } from 'react-router-dom';
import belLogo from '../../assets/belKannada.png'
// import belLogo1 from '../../assets/bel.png';
import { useEffect, useState } from 'react';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { TabPane } = Tabs;

function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useStore();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState('all');
  const [acknowledging, setAcknowledging] = useState(false);
  const [processingNotificationId, setProcessingNotificationId] = useState(null);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    initialize,
    disconnectWebSockets,
    fetchNotifications,
    markAllAsRead,
    markAsRead
  } = useNotificationStore();

  // Initialize notifications when component mounts
  useEffect(() => {
    initialize();
    
    // Cleanup when component unmounts
    return () => {
      disconnectWebSockets();
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Handle acknowledging a single notification
  const handleAcknowledge = async (notification, e) => {
    if (acknowledging) return;
    
    e?.stopPropagation();
    setAcknowledging(true);
    setProcessingNotificationId(notification._uniqueId);
    
    try {
      await markAsRead(notification);
    } finally {
      setAcknowledging(false);
      setProcessingNotificationId(null);
    }
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    setAcknowledging(true);
    try {
      await markAllAsRead();
    } finally {
      setAcknowledging(false);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    await fetchNotifications(true);
  };

  // Filter notifications by type
  const machineNotifications = notifications.filter(n => n.notificationType === 'machine');
  const materialNotifications = notifications.filter(n => n.notificationType === 'material');
  
  // Get filtered notifications based on active tab
  let filteredNotifications = activeTabKey === 'all' 
    ? notifications 
    : activeTabKey === 'machine' 
      ? machineNotifications 
      : materialNotifications;
  
  // For dropdown display, limit to top 5 most recent
  const limitedNotifications = filteredNotifications.slice(0, 5);
  
  // Count unread by type
  const unreadMachineCount = machineNotifications.filter(n => !n.is_acknowledged).length;
  const unreadMaterialCount = materialNotifications.filter(n => !n.is_acknowledged).length;

  // Profile menu items
  const profileMenuItems = [
    {
      key: 'role',
      label: `Role: ${user?.role || ''}`,
      disabled: true,
    },
    {
      key: 'profile',
      icon: <User size={16} />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  // Notification dropdown content
  const notificationContent = (
    <div style={{ 
      width: '360px', 
      maxHeight: '500px', 
      overflow: 'hidden', 
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
      borderRadius: '8px',
      background: '#fff'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px', 
        borderBottom: '1px solid #f0f0f0', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Text strong>Notifications</Text>
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" style={{ marginLeft: '8px' }} />
          )}
        </div>
        
        <Space>
          {isLoading ? (
            <Spin size="small" />
          ) : (
            <Button 
              type="text" 
              size="small"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>}
              onClick={handleRefresh}
              style={{ marginRight: '8px' }}
            />
          )}
          
          {unreadCount > 0 && (
            <Button 
              type="link" 
              size="small"
              loading={acknowledging}
              onClick={handleMarkAllAsRead}
              style={{ padding: '0' }}
            >
              Mark all as read
            </Button>
          )}
        </Space>
      </div>
      
      {/* Tabs */}
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        style={{ padding: '0 8px', marginTop: '4px' }}
        size="small"
      >
        <TabPane tab="All" key="all" />
        <TabPane tab={
          <span>
            Machine
            {unreadMachineCount > 0 && (
              <Badge count={unreadMachineCount} size="small" style={{ marginLeft: '4px' }} />
            )}
          </span>
        } key="machine" />
        <TabPane tab={
          <span>
            Material
            {unreadMaterialCount > 0 && (
              <Badge count={unreadMaterialCount} size="small" style={{ marginLeft: '4px' }} />
            )}
          </span>
        } key="material" />
      </Tabs>
      
      {/* Notification List */}
      <div style={{ 
        overflowY: 'auto', 
        maxHeight: '350px',
        flex: 1
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <List
            dataSource={limitedNotifications}
            renderItem={(item) => (
              <List.Item 
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer',
                  borderLeft: !item.is_acknowledged ? '3px solid #1890ff' : '3px solid transparent',
                  background: !item.is_acknowledged ? 'rgba(24, 144, 255, 0.05)' : 'transparent'
                }}
                onClick={() => handleAcknowledge(item)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                  {/* Icon based on type */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: '30px',
                    height: '30px',
                    background: item.notificationType === 'machine' ? '#e6f7ff' : '#f6ffed',
                    borderRadius: '50%',
                    flexShrink: 0
                  }}>
                    {item.notificationType === 'machine' 
                      ? <Wrench size={14} color="#1890ff" /> 
                      : <Package size={14} color="#52c41a" />
                    }
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: '13px' }}>
                        {item.notificationType === 'machine' 
                          ? `Machine ${item.machine_make || ''} #${item.machine_id || ''}`
                          : `Material #${item.part_number || ''}`
                        }
                      </Text>
                      <Tag color={getStatusColor(item.status_name, item.notificationType)} style={{ margin: 0 }}>
                        {item.status_name || 'UNKNOWN'}
                      </Tag>
                    </div>
                    
                    {/* Description - truncated */}
                    <Text type="secondary" style={{ 
                      fontSize: '12px', 
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '4px'
                    }}>
                      {item.description || 'No description'}
                    </Text>
                    
                    {/* Footer */}
                    <div style={{ 
                      marginTop: '6px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {formatDate(item.updated_at)}
                      </Text>
                      
                      {!item.is_acknowledged && (
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={(e) => handleAcknowledge(item, e)}
                          loading={acknowledging && processingNotificationId === item._uniqueId}
                          style={{ 
                            height: '22px', 
                            padding: '0 8px', 
                            fontSize: '11px',
                            borderRadius: '4px',
                            background: item.notificationType === 'machine' ? '#1890ff' : '#52c41a'
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="No notifications" 
            style={{ padding: '30px 0' }} 
          />
        )}
      </div>
      
      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div style={{ 
          padding: '8px 12px', 
          borderTop: '1px solid #f0f0f0', 
          textAlign: 'center'
        }}>
          <Button 
            type="link" 
            onClick={() => {
              navigate('/supervisor/notifications');
              // Close dropdown after clicking
              document.body.click();
            }}
            style={{ padding: '0' }}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );

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

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <Button
        type="text"
        icon={<MenuIcon size={20} />}
        onClick={toggleSidebar}
      />

      {/* <Input
        placeholder="Search..."
        prefix={<Search size={16} />}
        style={{ maxWidth: '400px' }}
      /> */}

       
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div className="flex justify-between items-center mr-16 mt-2">
          <h1 className="text-2xl font-semibold">SBU-Fabrication Components</h1>
        </div>

        <img
          src={belLogo}
          alt="BEL Logo"
          style={{ height: '40px', width: '186px', marginRight: '16px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        <Dropdown 
          overlay={notificationContent} 
          placement="bottomRight" 
          trigger={['click']}
        >
          <Badge count={unreadCount} size="small" style={{ fontSize: '10px' }}>
            <Button
              type="text"
              icon={<Bell size={20} />}
              style={{ marginRight: '8px' }}
            />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar 
              style={{ 
                backgroundColor: '#1890ff',
                verticalAlign: 'middle',
              }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <span className="font-medium">{user?.username}</span>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
}

export default Header;




