import { Avatar, Button, Dropdown, Input, Layout, Space, Badge, List, Typography, Empty, Tabs, Tag } from 'antd';
import { LogOut, Menu as MenuIcon, Search, User, Bell, Wrench, Package } from 'lucide-react';
import useAuthStore from '../../store/auth-store';
import useStore from '../../store/useStore';
import useNotificationStore from '../../store/notification';
import { useNavigate } from 'react-router-dom';
import cmtiLogo from '../../assets/bel.png';
import { useEffect, useState } from 'react';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { TabPane } = Tabs;

function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useStore();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState('all');
  const { 
    notifications, 
    unreadCount, 
    connectWebSockets, 
    disconnectWebSockets,
    fetchNotifications,
    markAllAsRead,
    markAsRead
  } = useNotificationStore();

  // Connect to WebSockets when component mounts and disconnect when unmounts
  useEffect(() => {
    // Fetch initial notifications and connect to WebSockets
    connectWebSockets();
    
    // Cleanup when component unmounts
    return () => {
      disconnectWebSockets();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    markAllAsRead();
  };

  // Filter notifications by type and limit to top 5 for display in dropdown
  const machineNotifications = notifications.filter(n => n.notificationType === 'machine');
  const materialNotifications = notifications.filter(n => n.notificationType === 'material');
  
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
      key: 'lozgout',
      icon: <LogOut size={16} />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  // Notification dropdown content
  const notificationContent = (
    <div style={{ 
      width: '440px', 
      maxHeight: '600px', 
      overflow: 'hidden', 
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
      borderRadius: '8px',
      background: '#fff'
    }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa'
      }}>
        <div>
          <Text strong style={{ fontSize: '16px' }}>Notifications</Text>
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </Text>
        </div>
        {notifications.length > 0 && (
          <Text 
            type="link" 
            onClick={markAllAsRead} 
            style={{ cursor: 'pointer', fontSize: '13px' }}
          >
            Mark all as read
          </Text>
        )}
      </div>
      
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        style={{ padding: '0 12px', marginTop: '8px' }}
        size="small"
      >
        <TabPane 
          tab={
            <span>
              All
              {unreadCount > 0 && (
                <Badge 
                  count={unreadCount} 
                  size="small" 
                  style={{ marginLeft: '4px', fontSize: '10px' }} 
                />
              )}
            </span>
          } 
          key="all" 
        />
        <TabPane 
          tab={
            <span>
              <Wrench size={14} style={{ marginRight: '4px' }} />
              Machines
              {unreadMachineCount > 0 && (
                <Badge 
                  count={unreadMachineCount} 
                  size="small" 
                  style={{ marginLeft: '4px', fontSize: '10px' }} 
                />
              )}
            </span>
          } 
          key="machine" 
        />
        <TabPane 
          tab={
            <span>
              <Package size={14} style={{ marginRight: '4px' }} />
              Materials
              {unreadMaterialCount > 0 && (
                <Badge 
                  count={unreadMaterialCount} 
                  size="small" 
                  style={{ marginLeft: '4px', fontSize: '10px' }} 
                />
              )}
            </span>
          } 
          key="material" 
        />
      </Tabs>
      
      <div style={{ 
        overflowY: 'auto', 
        maxHeight: '500px',
        flex: 1
      }}>
        {filteredNotifications.length > 0 ? (
          <>
            <List
              dataSource={limitedNotifications}
              renderItem={(item) => (
                <List.Item 
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer',
                    borderLeft: !item.is_acknowledged ? '3px solid #1890ff' : '3px solid transparent',
                    background: !item.is_acknowledged ? 'rgba(24, 144, 255, 0.05)' : 'transparent',
                    transition: 'all 0.3s ease',
                    marginBottom: '1px',
                    borderBottom: '1px solid #f5f5f5',
                    position: 'relative'
                  }}
                  onClick={() => markAsRead(item)}
                >
                  {/* Type indicator tag */}
                  <Tag 
                    color={item.notificationType === 'machine' ? 'blue' : 'green'}
                    style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px',
                      fontSize: '10px',
                      padding: '0 4px'
                    }}
                  >
                    {item.notificationType === 'machine' ? 'MACHINE' : 'MATERIAL'}
                  </Tag>
                  
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginRight: '50px' }}>
                      {/* Notification icon */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        width: '30px',
                        height: '30px',
                        background: item.notificationType === 'machine' ? '#e6f7ff' : '#f6ffed',
                        borderRadius: '50%',
                        marginTop: '2px'
                      }}>
                        {item.notificationType === 'machine' 
                          ? <Wrench size={14} color="#1890ff" /> 
                          : <Package size={14} color="#52c41a" />
                        }
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        {/* Title based on notification type */}
                        <Text 
                          strong={!item.is_acknowledged} 
                          style={{ 
                            fontSize: '14px', 
                            color: !item.is_acknowledged ? (item.notificationType === 'machine' ? '#1890ff' : '#52c41a') : 'inherit',
                            display: 'block'
                          }}
                        >
                          {item.notificationType === 'machine' 
                            ? `Machine ${item.machine_make} #${item.machine_id}`
                            : `Material Part #${item.part_number}`
                          }
                        </Text>
                        
                        {/* Status badge */}
                        <Badge 
                          color={getStatusColor(item.status_name, item.notificationType)} 
                          text={item.status_name} 
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    </div>

                    {/* Description box */}
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px 12px',
                      background: '#fafafa', 
                      borderRadius: '4px',
                      border: '1px solid #f0f0f0'
                    }}>
                      <Text style={{ fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {item.description || 'No description provided'}
                      </Text>
                    </div>

                    {/* Footer with metadata */}
                    <div style={{ 
                      marginTop: '8px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-end'
                    }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px', color: '#999', display: 'block' }}>
                          Created by: {item.created_by || 'System'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px', color: '#999' }}>
                          {formatDate(item.updated_at)}
                        </Text>
                      </div>
                      {item.is_acknowledged ? (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Acknowledged by: {item.acknowledged_by || 'System'}
                        </Text>
                      ) : (
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item);
                          }}
                          style={{
                            borderRadius: '16px',
                            background: item.notificationType === 'machine' ? '#1890ff' : '#52c41a'
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
            {filteredNotifications.length > 5 && (
              <div style={{ padding: '8px 16px', textAlign: 'center', borderTop: '1px dashed #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  {filteredNotifications.length - 5} more notification{filteredNotifications.length - 5 !== 1 ? 's' : ''}
                </Text>
              </div>
            )}
          </>
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="No notifications yet" 
            style={{ padding: '48px 16px' }} 
          />
        )}
      </div>
      
      {notifications.length > 0 && (
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #f0f0f0', 
          textAlign: 'center',
          background: '#fafafa'
        }}>
          <Button 
            type="primary" 
            onClick={() => {
              console.log('Navigating to notifications page');
              navigate('/supervisor/notifications');
              // Close dropdown after clicking
              document.body.click();
            }}
            style={{ borderRadius: '4px', width: '100%' }}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );

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

      <Input
        placeholder="Search..."
        prefix={<Search size={16} />}
        style={{ maxWidth: '400px' }}
      />

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <img
          src={cmtiLogo}
          alt="CMTI Logo"
          style={{ height: '40px', width: '186px', marginRight: '16px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        <Dropdown 
          overlay={notificationContent} 
          placement="bottomRight" 
          trigger={['click']}
          onVisibleChange={(visible) => {
            // Don't mark all as read automatically when opening
          }}
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




