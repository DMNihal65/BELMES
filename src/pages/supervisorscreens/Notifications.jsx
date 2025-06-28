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
  Spin,
  Input,
  DatePicker
} from 'antd';
import { Wrench, Package, Bell, CheckCircle, RefreshCw, Ruler, Filter } from 'lucide-react';
import useNotificationStore from '../../store/notificationNew';
import { ToolFilled, FilterOutlined, ToolOutlined, } from '@ant-design/icons';
import useInventoryStore from '../../store/inventory-store';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const Notifications = () => {
  // Get notification store hooks and state
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications,
    initialize,
    isLoading,
    error: storeError,
    userMap
  } = useNotificationStore();

  // Local state
  const [activeTabKey, setActiveTabKey] = useState('all');
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  const [isAcknowledgingAll, setIsAcknowledgingAll] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [itemDetailsMap, setItemDetailsMap] = useState(new Map());
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const { getItemDetails } = useInventoryStore();

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

  // Add new effect to fetch item details
  useEffect(() => {
    const fetchItemDetails = async () => {
      const detailsMap = new Map();
      
      // Get unique item names from notifications
      const uniqueItemNames = [...new Set(
        notifications
          .filter(n => n.notificationType === 'instrumentCalibration')
          .map(n => n.item_name)
          .filter(Boolean)
      )];

      // Fetch details for each unique item
      for (const itemName of uniqueItemNames) {
        if (!itemDetailsMap.has(itemName)) {
          const details = await getItemDetails(itemName);
          if (details) {
            detailsMap.set(itemName, details);
          }
        }
      }

      setItemDetailsMap(prev => new Map([...prev, ...detailsMap]));
    };

    if (notifications.length > 0) {
      fetchItemDetails();
    }
  }, [notifications]);

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
  const instrumentCalibrationNotifications = notifications.filter(n => n.notificationType === 'instrumentCalibration');
  const machineCalibrationNotifications = notifications.filter(n => n.notificationType === 'machineCalibration');
  const unacknowledgedNotifications = notifications.filter(n => !n.is_acknowledged);
  
  // Calculate counts
  const unreadMachineCount = machineNotifications.filter(n => !n.is_acknowledged).length;
  const unreadMaterialCount = materialNotifications.filter(n => !n.is_acknowledged).length;
  const unreadInstrumentCalibrationCount = instrumentCalibrationNotifications.filter(n => !n.is_acknowledged).length;
  const unreadMachineCalibrationCount = machineCalibrationNotifications.filter(n => !n.is_acknowledged).length;
  const totalUnacknowledgedCount = unreadMachineCount + unreadMaterialCount;

  // Filter notifications based on active tab
  let filteredNotifications = activeTabKey === 'all' 
    ? notifications 
    : activeTabKey === 'machine' 
      ? machineNotifications 
      : activeTabKey === 'material'
        ? materialNotifications
        : activeTabKey === 'instrumentCalibration'
          ? instrumentCalibrationNotifications
          : activeTabKey === 'machineCalibration'
            ? machineCalibrationNotifications
            : activeTabKey === 'unacknowledged'
              ? unacknowledgedNotifications
              : [];

  // Filter notifications based on search text and date range
  const getFilteredNotifications = () => {
    let filtered = [...filteredNotifications];

    // Apply search text filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(notification => {
        // Search in all relevant fields
        return (
          // Machine notifications
          (notification.machine_make?.toLowerCase().includes(searchLower)) ||
          (notification.machine_id?.toString().includes(searchLower)) ||
          (notification.status_name?.toLowerCase().includes(searchLower)) ||
          (notification.description?.toLowerCase().includes(searchLower)) ||
          // Material notifications
          (notification.part_number?.toString().includes(searchLower)) ||
          // Instrument calibration notifications
          (notification.item_name?.toLowerCase().includes(searchLower)) ||
          (notification.trade_name?.toLowerCase().includes(searchLower)) ||
          (notification.calibration_type?.toLowerCase().includes(searchLower)) ||
          // Machine calibration notifications
          (notification.machine_name?.toLowerCase().includes(searchLower)) ||
          (notification.machine_type?.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.updated_at || notification.timestamp);
        return notificationDate >= startDate && notificationDate <= endDate;
      });
    }

    return filtered;
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchText('');
    setDateRange(null);
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

  // Helper function to get user name - REMOVE THIS FUNCTION
  const getUserName = (userId) => {
    if (!userId) return '';
    
    // Convert userId to string for consistent comparison
    const userIdStr = userId.toString();
    
    // Log for debugging
    // console.log('Looking up user:', userIdStr, 'in map:', Object.fromEntries(userMap));
    
    const userName = userMap.get(userIdStr);
    if (userName) {
      return userName;
    }
    
    // If not found, try fetching users again
    useNotificationStore.getState().fetchUsers();
    
    // Return the ID as fallback
    return userIdStr;
  };

  // Add effect to fetch users when component mounts
  // useEffect(() => {
  //   useNotificationStore.getState().fetchUsers();
  // }, []);

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
      render: (text) => text || '',
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
      render: (isAcknowledged, record) => {
        if (record.notificationType === 'instrumentCalibration' || record.notificationType === 'machineCalibration') {
          return <Text type="secondary">Not Required</Text>;
        }
        
        return isAcknowledged ? (
          <div>
            <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
            <span>By: {record.acknowledged_by || ''}</span>
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: getTypeButtonColor(record.notificationType) }}
          >
            Acknowledge
          </Button>
        );
      }
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
      render: (text) => text || '',
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
      render: (isAcknowledged, record) => {
        if (record.notificationType === 'instrumentCalibration' || record.notificationType === 'machineCalibration') {
          return <Text type="secondary">Not Required</Text>;
        }
        
        return isAcknowledged ? (
          <div>
            <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
            <span>By: {record.acknowledged_by || ''}</span>
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: getTypeButtonColor(record.notificationType) }}
          >
            Acknowledge
          </Button>
        );
      }
    }
  ];

  // Define columns for instrument calibration notifications
  const getInstrumentCalibrationColumns = () => [
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
          background: '#f9f0ff',
          borderRadius: '50%',
          border: '1px solid #d3adf7'
        }}>
          <Ruler size={18} color="#722ed1" />
        </div>
      )
    },
    {
      title: 'Instrument',
      key: 'instrument',
      render: (_, record) => {
        const details = itemDetailsMap.get(record.item_name);
        const displayText = details
          ? `${details.categoryName} - ${details.subcategoryName}`
          : record.item_name || record.trade_name || 'Unknown';
    
        return (
          <span>
            <Tooltip title="Click to view calibration history for this item">
              <Tag
                icon={<ToolOutlined />}
                style={{ cursor: 'pointer', color: '#1890ff' }}
              >
                <strong>{displayText}</strong>
              </Tag>
            </Tooltip>
            {record.bel_part_number && <div>Part #: {record.bel_part_number}</div>}
          </span>
        );
      },
      sorter: (a, b) => {
        const aDetails = itemDetailsMap.get(a.item_name);
        const bDetails = itemDetailsMap.get(b.item_name);
        const aName = aDetails 
          ? `${aDetails.categoryName} - ${aDetails.subcategoryName}`
          : a.item_name || a.trade_name || '';
        const bName = bDetails 
          ? `${bDetails.categoryName} - ${bDetails.subcategoryName}`
          : b.item_name || b.trade_name || '';
        return aName.localeCompare(bName);
      },
    },
    {
      title: 'Calibration Type',
      dataIndex: 'calibration_type',
      key: 'calibration_type',
      render: (type) => (
        <Tag color="purple">
          {type || 'CALIBRATION'}
        </Tag>
      ),
      filters: (() => {
        const types = new Set();
        instrumentCalibrationNotifications.forEach(item => {
          if (item.calibration_type) {
            types.add(item.calibration_type);
          }
        });
        return Array.from(types).map(type => ({
          text: type,
          value: type
        }));
      })(),
      onFilter: (value, record) => record.calibration_type === value,
    },
    {
      title: 'Last Calibration',
      dataIndex: 'last_calibration',
      key: 'last_calibration',
      render: (date) => formatDate(date) || 'Unknown',
      sorter: (a, b) => {
        const aDate = a.last_calibration ? new Date(a.last_calibration) : new Date(0);
        const bDate = b.last_calibration ? new Date(b.last_calibration) : new Date(0);
        return aDate - bDate;
      },
    },
    {
      title: 'Next Calibration',
      dataIndex: 'next_calibration',
      key: 'next_calibration',
      render: (date) => formatDate(date) || 'Unknown',
      sorter: (a, b) => {
        const aDate = a.next_calibration ? new Date(a.next_calibration) : new Date(0);
        const bDate = b.next_calibration ? new Date(b.next_calibration) : new Date(0);
        return aDate - bDate;
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'calibration_due_date',
      key: 'calibration_due_date',
      render: (date) => (
        <Tag color={isDateNear(date) ? 'red' : 'orange'}>
          {date || 'Unknown'}
        </Tag>
      ),
      sorter: (a, b) => {
        const aDate = a.calibration_due_date ? new Date(a.calibration_due_date) : new Date(0);
        const bDate = b.calibration_due_date ? new Date(b.calibration_due_date) : new Date(0);
        return aDate - bDate;
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (text) => text || '',
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
      render: (isAcknowledged, record) => {
        if (record.notificationType === 'instrumentCalibration' || record.notificationType === 'machineCalibration') {
          return <Text type="secondary">Not Required</Text>;
        }
        
        return isAcknowledged ? (
          <div>
            <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
            <span>By: {record.acknowledged_by || ''}</span>
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: getTypeButtonColor(record.notificationType) }}
          >
            Acknowledge
          </Button>
        );
      }
    }
  ];

  // Define columns for machine calibration notifications
  const getMachineCalibrationColumns = () => [
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
          background: '#fff7e6',
          borderRadius: '50%',
          border: '1px solid #ffd591'
        }}>
          <ToolFilled size={18} color="#fa8c16" />
        </div>
      )
    },
    {
      title: 'Machine',
      key: 'machine',
      render: (_, record) => (
        <span>
          <strong>{record.machine_name || record.machine_make || 'Unknown'}</strong>
          <div>ID: {record.machine_id || 'N/A'}</div>
        </span>
      ),
      sorter: (a, b) => {
        const aName = a.machine_name || a.machine_make || '';
        const bName = b.machine_name || b.machine_make || '';
        return aName.localeCompare(bName);
      },
    },
    {
      title: 'Machine Type',
      dataIndex: 'machine_type',
      key: 'machine_type',
      render: (type) => (
        <Tag color="blue">
          {type || 'Unknown Type'}
        </Tag>
      ),
      filters: (() => {
        const types = new Set();
        machineCalibrationNotifications.forEach(item => {
          if (item.machine_type) {
            types.add(item.machine_type);
          }
        });
        return Array.from(types).map(type => ({
          text: type,
          value: type
        }));
      })(),
      onFilter: (value, record) => record.machine_type === value,
    },
    {
      title: 'Due Date',
      dataIndex: 'calibration_due_date',
      key: 'calibration_due_date',
      render: (date) => (
        <Tag color={isDateNear(date) ? 'red' : 'orange'}>
          {date || 'Unknown'}
        </Tag>
      ),
      sorter: (a, b) => {
        const aDate = a.calibration_due_date ? new Date(a.calibration_due_date) : new Date(0);
        const bDate = b.calibration_due_date ? new Date(b.calibration_due_date) : new Date(0);
        return aDate - bDate;
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Notification Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0),
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (text) => text || '',
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
      render: (isAcknowledged, record) => {
        if (record.notificationType === 'instrumentCalibration' || record.notificationType === 'machineCalibration') {
          return <Text type="secondary">Not Required</Text>;
        }
        
        return isAcknowledged ? (
          <div>
            <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
            <span>By: {record.acknowledged_by || ''}</span>
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: getTypeButtonColor(record.notificationType) }}
          >
            Acknowledge
          </Button>
        );
      }
    }
  ];

  // Helper function to check if a date is near (within 7 days)
  const isDateNear = (dateString) => {
    if (!dateString) return false;
    
    try {
      const dueDate = new Date(dateString);
      const now = new Date();
      
      // Reset time portion for accurate day comparison
      dueDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      // Calculate difference in days
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 7 && diffDays >= 0;
    } catch (error) {
      return false;
    }
  };

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
          background: getTypeBackground(record.notificationType),
          borderRadius: '50%',
          border: `1px solid ${getTypeBorderColor(record.notificationType)}`
        }}>
          {record.notificationType === 'machine' && <Wrench size={18} color="#1890ff" />}
          {record.notificationType === 'material' && <Package size={18} color="#52c41a" />}
          {record.notificationType === 'instrumentCalibration' && <Ruler size={18} color="#722ed1" />}
          {record.notificationType === 'machineCalibration' && <ToolFilled size={18} color="#fa8c16" />}
        </div>
      ),
      filters: [
        { text: 'Machine', value: 'machine' },
        { text: 'Material', value: 'material' },
        { text: 'Instrument Calibration', value: 'instrumentCalibration' },
        { text: 'Machine Calibration', value: 'machineCalibration' },
      ],
      onFilter: (value, record) => record.notificationType === value,
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <span>
          {record.notificationType === 'machine' && (
            <strong>{record.machine_make || 'Unknown'} #{record.machine_id || 'N/A'}</strong>
          )}
          {record.notificationType === 'material' && (
            <strong>Part #{record.part_number || 'Unknown'}</strong>
          )}
          {record.notificationType === 'instrumentCalibration' && (
            <strong>{record.item_name || record.trade_name || 'Unknown Instrument'}</strong>
          )}
          {record.notificationType === 'machineCalibration' && (
            <strong>{record.machine_name || record.machine_make || 'Unknown Machine'} #{record.machine_id || 'N/A'}</strong>
          )}
        </span>
      ),
    },
    {
      title: 'Status/Info',
      key: 'status_info',
      render: (_, record) => {
        if (record.notificationType === 'machine' || record.notificationType === 'material') {
          return (
            <Tag color={getStatusColor(record.status_name, record.notificationType)}>
              {record.status_name?.toUpperCase() || 'UNKNOWN'}
            </Tag>
          );
        } else if (record.notificationType === 'instrumentCalibration') {
          return (
            <Tag color="purple">
              {record.calibration_type || 'CALIBRATION'}
            </Tag>
          );
        } else if (record.notificationType === 'machineCalibration') {
          return (
            <Tag color="orange">
              CALIBRATION DUE: {record.calibration_due_date || 'Unknown'}
            </Tag>
          );
        }
        return null;
      },
      filters: [
        ...getUniqueStatusFilters('machine').map(f => ({ ...f, text: `Machine: ${f.text}` })),
        ...getUniqueStatusFilters('material').map(f => ({ ...f, text: `Material: ${f.text}` }))
      ],
      onFilter: (value, record) => {
        if (record.notificationType === 'machine' || record.notificationType === 'material') {
          return record.status_name?.toLowerCase() === value.toLowerCase();
        }
        return false;
      },
    },
    {
      title: 'Description/Due Date',
      key: 'description',
      width: '30%',
      ellipsis: { showTitle: false },
      render: (_, record) => {
        if (record.notificationType === 'machine' || record.notificationType === 'material') {
          return (
            <Tooltip title={record.description || 'No description'} placement="topLeft">
              <div style={{ 
                maxHeight: '60px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'normal', 
                display: '-webkit-box', 
                WebkitLineClamp: 3, 
                WebkitBoxOrient: 'vertical' 
              }}>
                {record.description || 'No description provided'}
              </div>
            </Tooltip>
          );
        } else if (record.notificationType === 'instrumentCalibration') {
          return (
            <Tooltip title={`Last: ${formatDate(record.last_calibration) || 'N/A'}, Next: ${formatDate(record.next_calibration) || 'N/A'}`} placement="topLeft">
              <div>
                <div>Due Date: {record.calibration_due_date || 'Unknown'}</div>
                <div>Last Calibration: {formatDate(record.last_calibration) || 'N/A'}</div>
              </div>
            </Tooltip>
          );
        } else if (record.notificationType === 'machineCalibration') {
          return (
            <Tooltip title={`Machine Type: ${record.machine_type || 'Unknown'}`} placement="topLeft">
              <div>
                <div>Due Date: {record.calibration_due_date || 'Unknown'}</div>
                <div>Machine Type: {record.machine_type || 'Unknown'}</div>
              </div>
            </Tooltip>
          );
        }
        return null;
      }
    },
    {
      title: 'Created/Updated',
      key: 'updated_at',
      sorter: (a, b) => new Date(a.updated_at || a.timestamp || 0) - new Date(b.updated_at || b.timestamp || 0),
      defaultSortOrder: 'descend',
      render: (_, record) => formatDate(record.updated_at || record.timestamp)
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'created_by',
      render: (text) => text || '',
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
      render: (isAcknowledged, record) => {
        if (record.notificationType === 'instrumentCalibration' || record.notificationType === 'machineCalibration') {
          return <Text type="secondary">Not Required</Text>;
        }
        
        return isAcknowledged ? (
          <div>
            <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
            <span>By: {record.acknowledged_by || ''}</span>
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleAcknowledge(record)}
            loading={processingIds.includes(record._uniqueId)}
            style={{ background: getTypeButtonColor(record.notificationType) }}
          >
            Acknowledge
          </Button>
        );
      }
    }
  ];

  // Helper functions for type-specific colors
  const getTypeBackground = (type) => {
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

  const getTypeBorderColor = (type) => {
    switch (type) {
      case 'machine':
        return '#91d5ff'; // Blue border
      case 'material':
        return '#b7eb8f'; // Green border
      case 'instrumentCalibration':
        return '#d3adf7'; // Purple border
      case 'machineCalibration':
        return '#ffd591'; // Orange border
      default:
        return '#d9d9d9'; // Gray border
    }
  };

  const getTypeButtonColor = (type) => {
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

  // Get the appropriate columns based on active tab
  const getColumns = () => {
    switch (activeTabKey) {
      case 'machine':
        return getMachineColumns();
      case 'material':
        return getMaterialColumns();
      case 'instrumentCalibration':
        return getInstrumentCalibrationColumns();
      case 'machineCalibration':
        return getMachineCalibrationColumns();
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
        
        {/* Header section with improved design */}
        <div className="notification-hero" style={{
          background: 'linear-gradient(120deg, #f0f7ff 0%, #e6f7ff 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  background: '#1890ff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 8px rgba(24,144,255,0.2)'
                }}>
                  <Bell size={24} color="#fff" />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>Notifications Center</Title>
                  <Text type="secondary">
                    Monitor and manage all system alerts in one place
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Space>
                <Button 
                  icon={<RefreshCw size={16} />}
                  onClick={handleManualRefresh}
                  loading={tableLoading}
                >
                  Refresh
                </Button>
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
              </Space>
            </Col>
          </Row>
        </div>
        
        {/* Improved summary cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={6}>
            <Card 
              size="small" 
              style={{ 
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                height: '100%',
                borderLeft: '4px solid #1890ff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary">Machine Notifications</Text>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px' }}>
                    {machineNotifications.length}
                  </div>
                  {unreadMachineCount > 0 && (
                    <Tag color="#1890ff" style={{ marginTop: '4px' }}>
                      {unreadMachineCount} Unacknowledged
                    </Tag>
                  )}
                </div>
                <div style={{ 
                  background: '#e6f7ff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Wrench size={24} color="#1890ff" />
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={6}>
            <Card 
              size="small" 
              style={{ 
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                height: '100%',
                borderLeft: '4px solid #52c41a'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary">Material Notifications</Text>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px' }}>
                    {materialNotifications.length}
                  </div>
                  {unreadMaterialCount > 0 && (
                    <Tag color="#52c41a" style={{ marginTop: '4px' }}>
                      {unreadMaterialCount} Unacknowledged
                    </Tag>
                  )}
                </div>
                <div style={{ 
                  background: '#f6ffed',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Package size={24} color="#52c41a" />
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={6}>
            <Card 
              size="small" 
              style={{ 
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                height: '100%',
                borderLeft: '4px solid #722ed1'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary">Instrument Calibrations</Text>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px' }}>
                    {instrumentCalibrationNotifications.length}
                  </div>
                  <Tag color="#722ed1" style={{ marginTop: '4px' }}>
                    Due for calibration
                  </Tag>
                </div>
                <div style={{ 
                  background: '#f9f0ff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Ruler size={24} color="#722ed1" />
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={6}>
            <Card 
              size="small" 
              style={{ 
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                height: '100%',
                borderLeft: '4px solid #fa8c16'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary">Machine Calibrations</Text>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px' }}>
                    {machineCalibrationNotifications.length}
                  </div>
                  <Tag color="#fa8c16" style={{ marginTop: '4px' }}>
                    Due for calibration
                  </Tag>
                </div>
                <div style={{ 
                  background: '#fff7e6',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <ToolFilled style={{ fontSize: '24px', color: '#fa8c16' }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tabs section with improved styling */}
        <Card 
          style={{ 
            marginBottom: '24px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          {/* Filter section */}
          <div style={{ marginBottom: '20px' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} lg={8}>
                <Input.Search
                  placeholder="Search notifications..."
                  allowClear
                  enterButton
                  size="middle"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} lg={12}>
                <Space size="middle">
                  <span>Date Range:</span>
                  <RangePicker 
                    allowClear
                    value={dateRange}
                    onChange={setDateRange}
                    style={{ width: '100%' }}
                  />
                </Space>
              </Col>
              <Col xs={24} lg={4} style={{ textAlign: 'right' }}>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </div>

          <Tabs 
            activeKey={activeTabKey} 
            onChange={setActiveTabKey}
            type="card"
            tabBarStyle={{ marginBottom: '16px' }}
            tabBarGutter={8}
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
                  Instrument Calibrations
                  {unreadInstrumentCalibrationCount > 0 && (
                    <Badge 
                      count={unreadInstrumentCalibrationCount} 
                      style={{ marginLeft: '8px' }} 
                    />
                  )}
                </span>
              } 
              key="instrumentCalibration" 
            />
            <TabPane 
              tab={
                <span>
                  Machine Calibrations
                  {unreadMachineCalibrationCount > 0 && (
                    <Badge 
                      count={unreadMachineCalibrationCount} 
                      style={{ marginLeft: '8px' }} 
                    />
                  )}
                </span>
              } 
              key="machineCalibration" 
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
              style={{ marginBottom: '16px', borderRadius: '4px' }}
            />
          )}

          {isLoading || tableLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <Spin size="large" style={{ marginBottom: '20px' }} />
                <div>
                  <Text>Loading notifications...</Text>
                </div>
              </div>
            </div>
          ) : getFilteredNotifications().length > 0 ? (
            <Table 
              dataSource={getFilteredNotifications()}
              columns={getColumns()}
              rowKey={(record) => record._uniqueId || `${record.notificationType}-${record.id || record.machine_id || record.part_number}-${record.updated_at || record.timestamp}`}
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
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            />
          ) : (
            <Empty 
              description={
                <span>
                  {searchText || dateRange ? 'No notifications match your search criteria' : 
                   activeTabKey === 'unacknowledged' 
                    ? 'No unacknowledged notifications' 
                    : 'No notifications found'}
                </span>
              }
              style={{ padding: '40px 0' }}
            />
          )}
        </Card>
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
