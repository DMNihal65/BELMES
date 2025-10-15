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
  DatePicker,
  message
} from 'antd';
import { Wrench, Package, CheckCircle, RefreshCw, Ruler, Filter } from 'lucide-react';
import useNotificationStore from '../../store/notificationNew';
import { ToolFilled, FilterOutlined, ToolOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';
import notificationAnimation from '../../assets/notification.json';
import useInventoryStore from '../../store/inventory-store';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Extend dayjs with plugins
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const NotificationsNew = () => {
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
  const [activeTabKey, setActiveTabKey] = useState('machine');
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  const [isAcknowledgingAll, setIsAcknowledgingAll] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [itemDetailsMap, setItemDetailsMap] = useState(new Map());
  const [searchText, setSearchText] = useState('');
  const [machineSearchText, setMachineSearchText] = useState('');
  const [materialSearchText, setMaterialSearchText] = useState('');
  const [instrumentSearchText, setInstrumentSearchText] = useState('');
  const [machineCalibrationSearchText, setMachineCalibrationSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const { getItemDetails } = useInventoryStore();
  const [lastAcknowledgedId, setLastAcknowledgedId] = useState(null);
  const [lastAcknowledgedType, setLastAcknowledgedType] = useState(null);

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

  // Add useEffect to refresh data after acknowledgment
  useEffect(() => {
    if (lastAcknowledgedId && lastAcknowledgedType) {
      const refreshData = async () => {
        setTableLoading(true);
        try {
          await fetchNotifications(true);
        } catch (error) {
          console.error('Error refreshing data after acknowledgment:', error);
        } finally {
          setTableLoading(false);
        }
      };
      refreshData();
    }
  }, [lastAcknowledgedId, lastAcknowledgedType]);

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
      // Get the current user's name
       // Get the current user's name from localStorage key 'user' (JSON: { "username": "...", ... })

       let username = 'admin';

       try {
 
         const userStr = localStorage.getItem('user');
 
         if (userStr) {
 
           const userObj = JSON.parse(userStr);
 
           if (userObj && userObj.username) {
 
             username = userObj.username;
 
           }
 
         }
 
       } catch (e) {
 
         console.error('Failed to parse user from localStorage:', e);
 
         username = localStorage.getItem('username') || localStorage.getItem('name') || 'admin';
 
       }
      
      // Handle both machine and material notifications
      if (notification.notificationType === 'material') {
        const response = await fetch('http://172.19.224.1:8002/api/v1/newlogs/raw_material_status_logs/acknowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            id: notification.id,
            acknowledged_by: username
          })
        });

        if (!response.ok) {
          throw new Error('Failed to acknowledge notification');
        }

        const data = await response.json();
        console.log('Material acknowledgment response:', data);
        
        // Set the last acknowledged ID and type to trigger the refresh
        setLastAcknowledgedId(notification.id);
        setLastAcknowledgedType('material');
      } else if (notification.notificationType === 'machine') {
        const response = await fetch('http://172.19.224.1:8002/api/v1/newlogs/machine-status-logs/acknowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            id: notification.id,
            acknowledged_by: username
          })
        });

        if (!response.ok) {
          throw new Error('Failed to acknowledge notification');
        }

        const data = await response.json();
        console.log('Machine acknowledgment response:', data);
        
        // Set the last acknowledged ID and type to trigger the refresh
        setLastAcknowledgedId(notification.id);
        setLastAcknowledgedType('machine');
      }

      // Update the notification in the store
      await markAsRead(notification);
      
      // Show success message
      message.success('Notification acknowledged successfully');
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      message.error('Failed to acknowledge notification');
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
  let filteredNotifications = activeTabKey === 'machine' 
    ? machineNotifications 
    : activeTabKey === 'material'
      ? materialNotifications
      : activeTabKey === 'instrumentCalibration'
        ? instrumentCalibrationNotifications
        : activeTabKey === 'machineCalibration'
          ? machineCalibrationNotifications
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
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
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

  // Helper function to extract username from created_by field
  const extractUsername = (createdBy) => {
    if (!createdBy) return '';
    
    // If created_by is in format "9 (operator)", extract just the username
    const match = createdBy.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      return match[1];
    }
    
    return createdBy;
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
      render: (text) => {
        // Debug log to check the created_by value
        console.log('Created By value:', text);
        return extractUsername(text);
      },
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
        // Debug log specifically in Machine Notifications column render
        console.log('Machine Column Render -> Record ID:', record.id, 'is_acknowledged:', record.is_acknowledged, 'acknowledged_by:', record.acknowledged_by);
        
        // For calibration notifications, show "Not Required" (should not happen in this tab, but kept for safety)
        if (record.notificationType === 'instrumentCalibration' || record.notificationType === 'machineCalibration') {
          return <Text type="secondary">Not Required</Text>;
        }
        
        // Debug log for button rendering condition
        console.log(`Record ID: ${record.id}, is_acknowledged: ${record.is_acknowledged}, should show button: ${record.is_acknowledged === false}`);

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              {/* Show green checkmark if acknowledged, red dot otherwise */}
              {record.is_acknowledged === true ? (
                <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
              ) : (
                <span style={{ color: '#ff4d4f', marginRight: '8px' }}>●</span>
              )}
              <span>By: {record.acknowledged_by || ''}</span>
            </div>
            
            {record.acknowledgment_message && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                {record.acknowledgment_message} 
              </div>
            )}
            
            {/* Only show acknowledge button if is_acknowledged is strictly false */}
            {record.is_acknowledged === false && (
              <Button 
                type="primary" 
                size="small" 
                onClick={() => handleAcknowledge(record)}
                loading={processingIds.includes(record._uniqueId)}
                style={{ background: '#1890ff' }}
              >
                Acknowledge
              </Button>
            )}
          </div>
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
      render: (text) => {
        // Debug log to check the created_by value
        console.log('Created By value:', text);
        return extractUsername(text);
      },
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
        // Debug log to check the value
        console.log('Material Record:', record.id, 'is_acknowledged:', record.is_acknowledged);
        
        // For calibration notifications, show "Not Required"
        if (record.notificationType === 'instrumentCalibration' || record.notificationType === 'machineCalibration') {
          return <Text type="secondary">Not Required</Text>;
        }
        
        return (
          <div>
            {/* Always show acknowledgment status */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              {record.is_acknowledged === true ? (
                <CheckCircle size={16} color="green" style={{ marginRight: '8px' }} />
              ) : (
                <span style={{ color: '#ff4d4f', marginRight: '8px' }}>●</span>
              )}
              <span>By: {record.acknowledged_by || ''}</span>
            </div>
            
            {/* Always show acknowledgment message if exists */}
            {record.acknowledgment_message && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                {record.acknowledgment_message}
              </div>
            )}
            
            {/* Only show acknowledge button if is_acknowledged is strictly false */}
            {record.is_acknowledged === false && (
              <Button 
                type="primary" 
                size="small" 
                onClick={() => handleAcknowledge(record)}
                loading={processingIds.includes(record._uniqueId)}
                style={{ background: '#52c41a' }}
              >
                Acknowledge
              </Button>
            )}
          </div>
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
        // Debug log to check the data structure
        console.log('Instrument record:', record);
        
        const details = record.instrument_details || {};
        const dynamicData = details.dynamic_data || {};
        
        return (
          <span>
            <div>
            Instrument Code: <Tag color="purple"><strong>{dynamicData['Instrument code'] || 'N/A'}</strong></Tag>
            </div>
            <div>Item Code: {details.item_code || 'N/A'}</div>
          </span>
        );
      },
      // sorter: (a, b) => {
      //   const aPartNumber = a.instrument_details?.dynamic_data?.['BEL Part Number '] || '';
      //   const bPartNumber = b.instrument_details?.dynamic_data?.['BEL Part Number '] || '';
      //   return aPartNumber.localeCompare(bPartNumber);
      // },
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => {
        const details = record.instrument_details || {};
        return (
          <Tag color="purple">
            {details.subcategory_name || 'Unknown'}
          </Tag>
        );
      },
      filters: (() => {
        const categories = new Set();
        instrumentCalibrationNotifications.forEach(item => {
          if (item.instrument_details?.subcategory_name) {
            categories.add(item.instrument_details.subcategory_name);
          }
        });
        return Array.from(categories).map(category => ({
          text: category,
          value: category
        }));
      })(),
      onFilter: (value, record) => record.instrument_details?.subcategory_name === value,
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
      // filters: (() => {
      //   const types = new Set();
      //   instrumentCalibrationNotifications.forEach(item => {
      //     if (item.calibration_type) {
      //       types.add(item.calibration_type);
      //     }
      //   });
      //   return Array.from(types).map(type => ({
      //     text: type,
      //     value: type
      //   }));
      // })(),
      onFilter: (value, record) => record.calibration_type === value,
    },
    {
      title: 'Last Calibration',
      key: 'last_calibration',
      render: (_, record) => {
        const lastCalibration = record.instrument_details?.last_calibration;
        return formatDate(lastCalibration) || 'Unknown';
      },
      sorter: (a, b) => {
        const aDate = a.instrument_details?.last_calibration ? new Date(a.instrument_details.last_calibration) : new Date(0);
        const bDate = b.instrument_details?.last_calibration ? new Date(b.instrument_details.last_calibration) : new Date(0);
        return aDate - bDate;
      },
    },
    {
      title: 'Next Calibration',
      key: 'next_calibration',
      render: (_, record) => {
        const nextCalibration = record.instrument_details?.next_calibration;
        return formatDate(nextCalibration) || 'Unknown';
      },
      sorter: (a, b) => {
        const aDate = a.instrument_details?.next_calibration ? new Date(a.instrument_details.next_calibration) : new Date(0);
        const bDate = b.instrument_details?.next_calibration ? new Date(b.instrument_details.next_calibration) : new Date(0);
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
        return getMachineColumns(); // Default to machine columns
    }
  };

  // Update the standardizeNotification function in the store to properly map the data
  const standardizeNotification = (notification, type) => {
    const baseNotification = {
      ...notification,
      notificationType: type,
      is_acknowledged: notification.is_acknowledged || 
                      (type === 'instrumentCalibration' || type === 'machineCalibration') ? 
                      notification.is_acknowledged_frontend || false : 
                      false,
      _uniqueId: notification._uniqueId || generateNotificationId({ ...notification, notificationType: type }),
    };
    
    // For instrument calibration, ensure we preserve the instrument_details
    if (type === 'instrumentCalibration' && notification.instrument_details) {
      baseNotification.instrument_details = {
        ...notification.instrument_details,
        dynamic_data: notification.instrument_details.dynamic_data || {}
      };
    }
    
    return baseNotification;
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
                  <Lottie 
                    animationData={notificationAnimation}
                    style={{ width: 55, height: 55 }}
                    loop={true}
                    autoplay={true}
                  />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>Notifications Centre</Title>
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
                {/* {totalUnacknowledgedCount > 0 && (
                  <Button 
                    type="primary" 
                    onClick={handleAcknowledgeAll}
                    loading={isAcknowledgingAll}
                    icon={<CheckCircle size={16} />}
                  >
                    Acknowledge All ({totalUnacknowledgedCount})
                  </Button>
                )} */}
              </Space>
            </Col>
          </Row>
        </div>
        
        {/* Improved summary cards
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
        </Row> */}

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
            <Row gutter={[16, 16]} align="stretch">
              
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
              
            </Row>
          </div>

          <Tabs 
            activeKey={activeTabKey} 
            onChange={setActiveTabKey}
            type="card"
            tabBarStyle={{ marginBottom: '16px' }}
            tabBarGutter={8}
          >
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
                  {/* {unreadInstrumentCalibrationCount > 0 && (
                    <Badge 
                      count={unreadInstrumentCalibrationCount} 
                      style={{ marginLeft: '8px' }} 
                    />
                  )} */}
                </span>
              } 
              key="instrumentCalibration" 
            />
            <TabPane 
              tab={
                <span>
                  Machine Calibrations
                  {/* {unreadMachineCalibrationCount > 0 && (
                    <Badge 
                      count={unreadMachineCalibrationCount} 
                      style={{ marginLeft: '8px' }} 
                    />
                  )} */}
                </span>
              } 
              key="machineCalibration" 
            />
          </Tabs>

          {/* Alert for unacknowledged tab */}
          {/* {activeTabKey === 'machine' && totalUnacknowledgedCount > 0 && (
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
          )} */}

          {/* Search inputs for Notifications */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            {activeTabKey === 'machine' && (
              <Input.Search
                placeholder="Search machine notifications..."
                allowClear
                style={{ width: 300, marginBottom: '16px' }}
                value={machineSearchText}
                onChange={(e) => setMachineSearchText(e.target.value)}
                onSearch={(value) => setMachineSearchText(value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  setMachineSearchText(pastedText);
                  e.preventDefault();
                }}
              />
            )}
            {activeTabKey === 'material' && (
              <Input.Search
                placeholder="Search material notifications..."
                allowClear
                style={{ width: 300, marginBottom: '16px' }}
                value={materialSearchText}
                onChange={(e) => setMaterialSearchText(e.target.value)}
                onSearch={(value) => setMaterialSearchText(value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  setMaterialSearchText(pastedText);
                  e.preventDefault();
                }}
              />
            )}
            {activeTabKey === 'instrumentCalibration' && (
              <Input.Search
                placeholder="Search instrument calibrations..."
                allowClear
                style={{ width: 300, marginBottom: '16px' }}
                value={instrumentSearchText}
                onChange={(e) => setInstrumentSearchText(e.target.value)}
                onSearch={(value) => setInstrumentSearchText(value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  setInstrumentSearchText(pastedText);
                  e.preventDefault();
                }}
              />
            )}
            {activeTabKey === 'machineCalibration' && (
              <Input.Search
                placeholder="Search machine calibrations..."
                allowClear
                style={{ width: 300, marginBottom: '16px' }}
                value={machineCalibrationSearchText}
                onChange={(e) => setMachineCalibrationSearchText(e.target.value)}
                onSearch={(value) => setMachineCalibrationSearchText(value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  setMachineCalibrationSearchText(pastedText);
                  e.preventDefault();
                }}
              />
            )}
          </div>

          {/* Filter and display notifications */}
          {(() => {
            // Filter notifications based on the active tab and search text
            let filteredNotifications = [...notifications];
            
            // Filter by notification type
            if (activeTabKey === 'machine') {
              filteredNotifications = filteredNotifications.filter(
                notification => notification.notificationType === 'machine'
              );
              
              // Apply machine search filter if there's search text
              if (machineSearchText) {
                const searchLower = machineSearchText.toLowerCase();
                filteredNotifications = filteredNotifications.filter(notification => {
                  // Check all searchable fields
                  return (
                    // Machine make/name
                    (notification.machine_make && String(notification.machine_make).toLowerCase().includes(searchLower)) ||
                    // Machine ID
                    (notification.machine_id && String(notification.machine_id).toLowerCase().includes(searchLower)) ||
                    // Status
                    (notification.status_name && String(notification.status_name).toLowerCase().includes(searchLower)) ||
                    // Description
                    (notification.description && String(notification.description).toLowerCase().includes(searchLower)) ||
                    // Created by
                    (notification.created_by && String(extractUsername(notification.created_by)).toLowerCase().includes(searchLower)) ||
                    // Updated at (formatted date)
                    (notification.updated_at && formatDate(notification.updated_at).toLowerCase().includes(searchLower)) ||
                    // Acknowledged by
                    (notification.acknowledged_by && String(notification.acknowledged_by).toLowerCase().includes(searchLower)) ||
                    // Acknowledged status
                    (notification.is_acknowledged ? 'acknowledged' : 'unacknowledged').includes(searchLower)
                  );
                });
              }
            } else if (activeTabKey === 'material') {
              filteredNotifications = filteredNotifications.filter(
                notification => notification.notificationType === 'material'
              );
              
              // Apply material search filter if there's search text
              if (materialSearchText) {
                const searchLower = materialSearchText.toLowerCase();
                filteredNotifications = filteredNotifications.filter(notification => {
                  // Check all searchable fields
                  return (
                    // Part number
                    (notification.part_number && String(notification.part_number).toLowerCase().includes(searchLower)) ||
                    // Status
                    (notification.status_name && String(notification.status_name).toLowerCase().includes(searchLower)) ||
                    // Description
                    (notification.description && String(notification.description).toLowerCase().includes(searchLower)) ||
                    // Created by
                    (notification.created_by && String(extractUsername(notification.created_by)).toLowerCase().includes(searchLower)) ||
                    // Updated at (formatted date)
                    (notification.updated_at && formatDate(notification.updated_at).toLowerCase().includes(searchLower)) ||
                    // Acknowledged status
                    (notification.is_acknowledged ? 'acknowledged' : 'unacknowledged').includes(searchLower)
                  );
                });
              }
            } else if (activeTabKey === 'instrumentCalibration') {
              filteredNotifications = filteredNotifications.filter(
                notification => notification.notificationType === 'instrumentCalibration'
              );
              
              // Apply instrument calibration search filter if there's search text
              if (instrumentSearchText) {
                const searchLower = instrumentSearchText.toLowerCase();
                filteredNotifications = filteredNotifications.filter(notification => {
                  const details = notification.instrument_details || {};
                  const dynamicData = details.dynamic_data || {};
                  const lastCalibration = details.last_calibration ? formatDate(details.last_calibration) : '';
                  const nextCalibration = details.next_calibration ? formatDate(details.next_calibration) : '';
                  
                  // Check all searchable fields
                  return (
                    // Instrument code
                    (dynamicData['Instrument code'] && String(dynamicData['Instrument code']).toLowerCase().includes(searchLower)) ||
                    // Item code
                    (details.item_code && String(details.item_code).toLowerCase().includes(searchLower)) ||
                    // Category
                    (details.subcategory_name && String(details.subcategory_name).toLowerCase().includes(searchLower)) ||
                    // Calibration type
                    (notification.calibration_type && String(notification.calibration_type).toLowerCase().includes(searchLower)) ||
                    // Last calibration date
                    (lastCalibration && lastCalibration.toLowerCase().includes(searchLower)) ||
                    // Next calibration date
                    (nextCalibration && nextCalibration.toLowerCase().includes(searchLower)) ||
                    // Due date
                    (notification.calibration_due_date && String(notification.calibration_due_date).toLowerCase().includes(searchLower))
                  );
                });
              }
            } else if (activeTabKey === 'machineCalibration') {
              filteredNotifications = filteredNotifications.filter(
                notification => notification.notificationType === 'machineCalibration'
              );
              
              // Apply machine calibration search filter if there's search text
              if (machineCalibrationSearchText) {
                const searchLower = machineCalibrationSearchText.toLowerCase();
                filteredNotifications = filteredNotifications.filter(notification => {
                  const timestamp = notification.timestamp ? formatDate(notification.timestamp) : '';
                  
                  // Check all searchable fields
                  return (
                    // Machine name/make
                    ((notification.machine_name || notification.machine_make || '').toLowerCase().includes(searchLower)) ||
                    // Machine ID
                    (notification.machine_id && String(notification.machine_id).toLowerCase().includes(searchLower)) ||
                    // Machine type
                    (notification.machine_type && String(notification.machine_type).toLowerCase().includes(searchLower)) ||
                    // Due date
                    (notification.calibration_due_date && String(notification.calibration_due_date).toLowerCase().includes(searchLower)) ||
                    // Notification time
                    (timestamp && timestamp.toLowerCase().includes(searchLower))
                  );
                });
              }
            }
            
            // Apply date range filter if set
            if (dateRange && dateRange[0] && dateRange[1]) {
              const startDate = dateRange[0].startOf('day');
              const endDate = dateRange[1].endOf('day');
              
              filteredNotifications = filteredNotifications.filter(notification => {
                const notificationDate = dayjs(notification.updated_at || notification.timestamp);
                return notificationDate.isBetween(startDate, endDate, null, '[]');
              });
            }
            
            // Handle loading state
            if (isLoading || tableLoading) {
              return (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Spin size="large" style={{ marginBottom: '20px' }} />
                    <div>
                      <Text>Loading notifications...</Text>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Handle empty state
            if (filteredNotifications.length === 0) {
              const hasSearchText = (activeTabKey === 'machine' && machineSearchText) || 
                                (activeTabKey === 'material' && materialSearchText) || 
                                (activeTabKey === 'instrumentCalibration' && instrumentSearchText) ||
                                (activeTabKey === 'machineCalibration' && machineCalibrationSearchText) ||
                                dateRange;
                                 
              return (
                <Empty 
                  description={
                    <span>
                      {hasSearchText 
                        ? 'No notifications match your search criteria' 
                        : activeTabKey === 'machine' 
                          ? 'No unacknowledged machine notifications' 
                          : activeTabKey === 'material'
                            ? 'No material notifications found'
                            : activeTabKey === 'instrumentCalibration'
                              ? 'No instrument calibrations found'
                              : activeTabKey === 'machineCalibration'
                                ? 'No machine calibrations found'
                                : 'No notifications found'
                      }
                    </span>
                  }
                  style={{ padding: '40px 0' }}
                />
              );
            }
            
            // Return the table with filtered notifications
            return (
              <Table 
                dataSource={filteredNotifications}
                columns={getColumns()}
                rowKey={(record) => record._uniqueId || `${record.notificationType}-${record.id || record.machine_id || record.part_number}-${record.updated_at || record.timestamp}`}
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
            );
          })()}


        </Card>
      </Card>
    </div>
  );
};

export default NotificationsNew;

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









//testing////////












