import { Avatar, Button, Dropdown, Input, Layout, Space, Badge, List, Typography, Empty, Tag, Spin } from 'antd';
import { LogOut, Menu as MenuIcon, Search, User, Bell, Wrench, Package, Ruler } from 'lucide-react';
import useAuthStore from '../../store/auth-store';
import useStore from '../../store/useStore';
import useNotificationStore from '../../store/notification';
import { useNavigate } from 'react-router-dom';
// import belLogo from '../../assets/belKannada.png'
import belLogo from '../../assets/bel.png';
import { useEffect, useState } from 'react';
import { ToolFilled } from '@ant-design/icons';
import useOperatorStore from '../../store/operator-store';


const { Header: AntHeader } = Layout;
const { Text } = Typography;

function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useStore();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState('all');
  const [acknowledging, setAcknowledging] = useState(false);
  const [processingNotificationId, setProcessingNotificationId] = useState(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const { 
    notifications, 
    unreadCount, 
    isLoading,
    initialize,
    fetchNotifications,
    markAllAsRead,
    markNotificationAsRead
  } = useNotificationStore();

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation(); // Prevent dropdown from closing if event exists
    
    setMarkingAsRead(true);
    setProcessingNotificationId(notificationId);
    
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      message.error('Failed to mark notification as read');
    } finally {
      setMarkingAsRead(false);
      setProcessingNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (acknowledging) return; // Prevent multiple clicks
    
    setAcknowledging(true);
    try {
      const success = await markAllAsRead();
      if (success) {
        // Refresh notifications to ensure UI is in sync with the server
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Failed to mark all notifications as read');
    } finally {
      setAcknowledging(false);
    }
  };

  // Initialize notifications when component mounts
  useEffect(() => {
    initialize();
    
    // No cleanup needed as we're using polling
    return () => {};
  }, []);

  // Handle logout
  const handleLogout = () => {
    const resetStore = useOperatorStore.getState().resetStore;
    logout();
    resetStore();
    navigate('/login');
    // localStorage.removeItem('jobSource');
    // localStorage.removeItem('currentJobData');
    // localStorage.removeItem('activeOperation');
    // localStorage.removeItem('user-selected-job');
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
  
  // Handle manual refresh
  const handleRefresh = async () => {
    await fetchNotifications(true);
  };

  // Normalize notifications: flatten record_data if present and use table_name as type
  const normalizedNotifications = notifications.map(n => {
    if (n.table_name && n.record_data) {
      return {
        ...n,
        ...n.record_data,
        notificationType: n.table_name, // Use table_name as type
        original: n,
      };
    }
    return n;
  });
  const limitedNotifications = normalizedNotifications.slice(0, 5);
  
  // Count unread
  const unreadNotificationsCount = normalizedNotifications.filter(n => !n.read).length;

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
          {unreadNotificationsCount > 0 && (
            <Badge count={unreadNotificationsCount} size="small" style={{ marginLeft: '8px' }} />
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
          
          {unreadNotificationsCount > 0 && (
            <Button 
              type="link" 
              size="small"
              loading={acknowledging}
              onClick={handleMarkAllAsRead}
              disabled={acknowledging}
              style={{ 
                padding: '0',
                color: acknowledging ? 'rgba(0, 0, 0, 0.25)' : '#1890ff'
              }}
            >
              {acknowledging ? 'Marking all...' : 'Mark all as read'}
            </Button>
          )}
        </Space>
      </div>
      
      {/* Notification List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : notifications.length > 0 ? (
          <List
            dataSource={limitedNotifications}
            renderItem={item => (
              <List.Item 
                key={item._uniqueId || item.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: item.read ? '#fff' : '#f9f9f9',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  ':hover': {
                    backgroundColor: item.read ? '#f5f5f5' : '#f0f0f0',
                  },
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  {/* Icon */}
                  <div style={{ 
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: getNotificationIconBackground(item.notificationType),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(item.notificationType)}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Tag color={getNotificationTagColor(item.notificationType)} style={{ margin: 0, fontSize: '11px' }}>
                        {item.notificationType || 'Notification'}
                      </Tag>
                    </div>
                    <Text strong style={{ 
                      display: 'block',
                      fontSize: '13px',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {getNotificationTitle(item)}
                    </Text>
                    <Text style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      marginBottom: '4px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }}>
                      {getNotificationDescription(item)}
                    </Text>
                    {item.status_name && (
                      <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                        Status: {item.status_name}
                      </Text>
                    )}
                    {!item.read && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={(e) => handleMarkAsRead(item._uniqueId || item.id, e)}
                          loading={markingAsRead && processingNotificationId === (item._uniqueId || item.id)}
                          disabled={markingAsRead}
                          style={{ 
                            padding: '0 8px',
                            height: '24px',
                            fontSize: '12px',
                            lineHeight: '22px',
                            color: '#1890ff'
                          }}
                        >
                          {markingAsRead && processingNotificationId === (item._uniqueId || item.id) ? 'Marking...' : 'Mark as Read'}
                        </Button>
                      </div>
                    )}
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
      {notifications.length > 0 && (
        <div style={{ 
          padding: '8px 12px', 
          borderTop: '1px solid #f0f0f0', 
          textAlign: 'center'
        }}>
          <Button 
            type="link" 
            onClick={() => {
              // Get user from localStorage
              let userRole = 'supervisor'; // default fallback
              try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                  const userObj = JSON.parse(userStr);
                  if (userObj && userObj.role) {
                    userRole = userObj.role;
                  }
                }
              } catch (e) {
                // fallback to default
              }
              navigate(`/${userRole}/notifications_new`);
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

  // Helper function to get the notification icon
  const getNotificationIcon = (type) => {
    const iconProps = { size: 16, style: { color: '#fff' } };
    switch (type) {
      case 'machine':
        return <Wrench {...iconProps} />;
      case 'material':
        return <Package {...iconProps} />;
      case 'instrumentCalibration':
      case 'machineCalibration':
        return <Ruler {...iconProps} />;
      case 'PokaYokeCompletedLog':
        return <ToolFilled {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Helper function to get the notification tag color
  const getNotificationTagColor = (type) => {
    switch (type) {
      case 'machine':
        return 'blue';
      case 'material':
        return 'green';
      case 'PokaYokeCompletedLog':
        return 'purple';
      default:
        return 'default';
    }
  };

  // Helper function to get the notification icon background color
  const getNotificationIconBackground = (type) => {
    switch (type) {
      case 'machine':
        return '#1890ff'; // Blue
      case 'material':
        return '#52c41a'; // Green
      case 'instrumentCalibration':
        return '#722ed1'; // Purple
      case 'machineCalibration':
        return '#fa8c16'; // Orange
      case 'PokaYokeCompletedLog':
        return '#722ed1'; // Purple
      default:
        return '#8c8c8c'; // Gray
    }
  };

  // Generalized helper function to get the title for a notification
  const getNotificationTitle = (notification) => {
    // Try to use the most relevant field for each type
    if (notification.notificationType === 'PokaYokeCompletedLog') {
      return `Poka Yoke Checklist: ${notification.checklist_name || ''} (Order: ${notification.production_order || ''})`;
    }
    if (notification.notificationType === 'RawMaterialStatusLog') {
      return `Material #${notification.part_number || notification.material_id || ''}`;
    }
    if (notification.notificationType === 'MachineStatusLog') {
      return `Machine ${notification.machine_make || ''} #${notification.machine_id || ''}`;
    }
    // Fallback: use part_number, checklist_name, machine_make, or just the type
    return (
      notification.part_number ||
      notification.checklist_name ||
      notification.machine_make ||
      notification.notificationType ||
      'Notification'
    );
  };

  // Generalized helper function to get the description for a notification
  const getNotificationDescription = (notification) => {
    // Prefer description if present
    if (notification.description) return notification.description;
    // For PokaYokeCompletedLog, show pass/fail and comments
    if (notification.notificationType === 'PokaYokeCompletedLog') {
      const passFail = notification.all_items_passed === true ? 'All items passed' : 'Some items failed';
      return `Completed at: ${formatDate(notification.completed_at)} | ${passFail}${notification.comments ? ' | Comments: ' + notification.comments : ''}`;
    }
    // For RawMaterialStatusLog, show status
    if (notification.notificationType === 'RawMaterialStatusLog') {
      return notification.status_name ? `Status: ${notification.status_name}` : '';
    }
    // For MachineStatusLog, show status
    if (notification.notificationType === 'MachineStatusLog') {
      return notification.status_name ? `Status: ${notification.status_name}` : '';
    }
    // Fallback: show nothing
    return '';
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
            <Badge count={unreadNotificationsCount} size="small" style={{ fontSize: '10px' }}>
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
