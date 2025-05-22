import { Avatar, Button, Dropdown, Input, Layout, Space, Badge, List, Typography, Empty, Tabs, Tag, Spin } from 'antd';
import { LogOut, Menu as MenuIcon, Search, User, Bell, Wrench, Package, Ruler } from 'lucide-react';
import useAuthStore from '../../store/auth-store';
import useStore from '../../store/useStore';
import useNotificationStore from '../../store/notification';
import { useNavigate } from 'react-router-dom';
// import belLogo from '../../assets/belKannada.png'
import belLogo from '../../assets/bel.png';
import { useEffect, useState } from 'react';
import { ToolFilled } from '@ant-design/icons';

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
  const instrumentCalibrationNotifications = notifications.filter(n => n.notificationType === 'instrumentCalibration');
  const machineCalibrationNotifications = notifications.filter(n => n.notificationType === 'machineCalibration');
  
  // Get filtered notifications based on active tab
  let filteredNotifications = activeTabKey === 'all' 
    ? notifications 
    : activeTabKey === 'machine' 
      ? machineNotifications 
      : activeTabKey === 'material'
        ? materialNotifications
        : activeTabKey === 'instrumentCalibration'
          ? instrumentCalibrationNotifications
          : machineCalibrationNotifications;
  
  // For dropdown display, limit to top 5 most recent
  const limitedNotifications = filteredNotifications.slice(0, 5);
  
  // Count unread by type
  const unreadMachineCount = machineNotifications.filter(n => !n.is_acknowledged).length;
  const unreadMaterialCount = materialNotifications.filter(n => !n.is_acknowledged).length;
  const unreadInstrumentCalibrationCount = instrumentCalibrationNotifications.filter(n => !n.is_acknowledged).length;
  const unreadMachineCalibrationCount = machineCalibrationNotifications.filter(n => !n.is_acknowledged).length;

  // Profile menu items
  const profileMenuItems = [
    {
      key: 'role',
      label: `Role: ${user?.role || ''}`,
      disabled: true,
    },
    // {
    //   key: 'profile',
    //   icon: <User size={16} />,
    //   label: 'Profile',
    //   onClick: () => navigate('/profile'),
    // },
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
        <TabPane tab={
          <span>
            Instrument
            {unreadInstrumentCalibrationCount > 0 && (
              <Badge count={unreadInstrumentCalibrationCount} size="small" style={{ marginLeft: '4px' }} />
            )}
          </span>
        } key="instrumentCalibration" />
        <TabPane tab={
          <span>
            Calibration
            {unreadMachineCalibrationCount > 0 && (
              <Badge count={unreadMachineCalibrationCount} size="small" style={{ marginLeft: '4px' }} />
            )}
          </span>
        } key="machineCalibration" />
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
                    background: getNotificationIconBackground(item.notificationType),
                    borderRadius: '50%',
                    flexShrink: 0
                  }}>
                    {item.notificationType === 'machine' && <Wrench size={14} color="#1890ff" />}
                    {item.notificationType === 'material' && <Package size={14} color="#52c41a" />}
                    {item.notificationType === 'instrumentCalibration' && <Ruler size={14} color="#722ed1" />}
                    {item.notificationType === 'machineCalibration' && <ToolFilled size={14} color="#fa8c16" />}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: '13px' }}>
                        {getNotificationTitle(item)}
                      </Text>
                      {item.status_name && (
                        <Tag color={getStatusColor(item.status_name, item.notificationType)} style={{ margin: 0 }}>
                          {item.status_name || 'UNKNOWN'}
                        </Tag>
                      )}
                      {item.notificationType === 'instrumentCalibration' && (
                        <Tag color="purple" style={{ margin: 0 }}>
                          {item.calibration_type || 'CALIBRATION'}
                        </Tag>
                      )}
                      {item.notificationType === 'machineCalibration' && (
                        <Tag color="orange" style={{ margin: 0 }}>
                          CALIBRATION DUE
                        </Tag>
                      )}
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
                      {getNotificationDescription(item)}
                    </Text>
                    
                    {/* Footer */}
                    <div style={{ 
                      marginTop: '6px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {formatDate(item.updated_at || item.timestamp)}
                      </Text>
                      
                      {!item.is_acknowledged && item.notificationType !== 'instrumentCalibration' && item.notificationType !== 'machineCalibration' && (
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
                            background: getNotificationButtonColor(item.notificationType)
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

  // Helper function to get the notification icon background color
  const getNotificationIconBackground = (type) => {
    switch (type) {
      case 'machine':
        return '#e6f7ff'; // Light blue
      case 'material':
        return '#f6ffed'; // Light green
      case 'instrumentCalibration':
        return '#f9f0ff'; // Light purple
      case 'machineCalibration':
        return '#fff7e6'; // Light orange
      default:
        return '#f0f0f0'; // Light gray
    }
  };

  // Helper function to get the title for a notification
  const getNotificationTitle = (notification) => {
    switch (notification.notificationType) {
      case 'machine':
        return `Machine ${notification.machine_make || ''} #${notification.machine_id || ''}`;
      case 'material':
        return `Material #${notification.part_number || ''}`;
      case 'instrumentCalibration':
        return `Instrument: ${notification.item_name || notification.trade_name || notification.bel_part_number || 'Unknown'}`;
      case 'machineCalibration':
        return `${notification.machine_name || notification.machine_make || ''} #${notification.machine_id || ''}`;
      default:
        return 'Unknown Notification';
    }
  };

  // Helper function to get the description for a notification
  const getNotificationDescription = (notification) => {
    switch (notification.notificationType) {
      case 'machine':
      case 'material':
        return notification.description || 'No description';
      case 'instrumentCalibration':
        return `Due: ${notification.calibration_due_date || 'Unknown'} | Last: ${formatDate(notification.last_calibration) || 'N/A'}`;
      case 'machineCalibration':
        return `Calibration due on: ${notification.calibration_due_date || 'Unknown date'}`;
      default:
        return 'No details available';
    }
  };

  // Helper function to get the button color for a notification type
  const getNotificationButtonColor = (type) => {
    switch (type) {
      case 'machine':
        return '#1890ff'; // Blue
      case 'material':
        return '#52c41a'; // Green
      case 'instrumentCalibration':
        return '#722ed1'; // Purple
      case 'machineCalibration':
        return '#fa8c16'; // Orange
      default:
        return '#1890ff'; // Default blue
    }
  };

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
    else if (type === 'material') {
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
    // For other types, just return default
    return 'default';
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
        <div style={{ 
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#000000',
            margin: 0,
            padding: 0
          }}>
            Fabrication Components
          </h1>
        </div>

        <img
          src={belLogo}
          alt="BEL Logo"
          style={{ height: '40px', width: '186px', marginRight: '16px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        {(user?.role === 'admin' || user?.role === 'supervisor') && (
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
        )}

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
