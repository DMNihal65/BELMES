import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Typography,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  message,
  Spin,
  InputNumber,
  Tabs,
  Cascader,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../../store/inventory-store';
import moment from 'moment';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const { Title, Text } = Typography;
const { Option } = Select;

function Calibration() {
  const [form] = Form.useForm();
  const [historyForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [editingCalibration, setEditingCalibration] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('current');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);
  const [dateRange, setDateRange] = useState([null, null]);
  const [historyDateRange, setHistoryDateRange] = useState([null, null]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [searchText, setSearchText] = useState('');

  const {
    calibrations,
    calibrationHistory,
    categories,
    loading,
    fetchCalibrations,
    fetchCalibrationHistory,
    fetchCategories,
    addCalibration,
    updateCalibration,
    deleteCalibration,
    addCalibrationHistory,
    fetchItems,
    fetchAllSubcategories,
    fetchUpcomingCalibrations,
    upcomingCalibrations
  } = useInventoryStore();

  const filterCalibrations = async (status) => {
    setSelectedStatus(status);
    if (status === 'due_soon') {
      try {
        await fetchUpcomingCalibrations(7);
      } catch (error) {
        console.error('Error fetching due soon calibrations:', error);
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const [calibrationsData, historyData, categoriesData, itemsData, subcatsData, upcomingData] = await Promise.all([
          fetchCalibrations(),
          fetchCalibrationHistory(),
          fetchCategories(),
          loadInventoryItems(),
          loadSubcategories(),
          fetchUpcomingCalibrations(daysFilter)
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load some data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchCalibrations, fetchCalibrationHistory, fetchCategories, daysFilter]);

  // Add a new useEffect to refresh upcoming calibrations periodically
  useEffect(() => {
    // Initial fetch
    fetchUpcomingCalibrations(daysFilter);

    // Set up interval to refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchUpcomingCalibrations(daysFilter);
    }, 5 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [daysFilter]);

  const loadInventoryItems = async () => {
    try {
      const items = await fetchItems();
      console.log('Loaded items:', items); // Debug log
      setInventoryItems(items || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast.error('Failed to load inventory items');
      setInventoryItems([]);
    }
  };

  const loadSubcategories = async () => {
    try {
      const subCats = await fetchAllSubcategories();
      console.log('Loaded subcategories:', subCats); // Debug log
      setSubcategories(subCats || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      toast.error('Failed to load subcategories');
      setSubcategories([]);
    }
  };

  const showModal = (record = null) => {
    setEditingCalibration(record);
    if (record) {
      form.setFieldsValue({
        calibration_type: record.calibration_type,
        frequency_days: record.frequency_days,
        last_calibration: moment(record.last_calibration),
        next_calibration: moment(record.next_calibration),
        remarks: record.remarks,
        inventory_item_id: record.inventory_item_id
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Calibration Record',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this calibration record?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteCalibration(id);
          // Update the local state instead of fetching
          const updatedCalibrations = calibrations.filter(cal => cal.id !== id);
          useInventoryStore.setState({ calibrations: updatedCalibrations });
          toast.success('Calibration record deleted successfully');
        } catch (error) {
          toast.error('Failed to delete calibration record');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        calibration_type: values.calibration_type,
        frequency_days: values.frequency_days,
        last_calibration: values.last_calibration.toISOString(),
        next_calibration: values.next_calibration.toISOString(),
        remarks: values.remarks || '',
        inventory_item_id: values.inventory_item_id
      };

      if (editingCalibration) {
        await updateCalibration(editingCalibration.id, formattedValues);
        // Update the local state instead of fetching
        const updatedCalibrations = calibrations.map(cal => 
          cal.id === editingCalibration.id ? { ...cal, ...formattedValues } : cal
        );
        useInventoryStore.setState({ calibrations: updatedCalibrations });
        toast.success('Calibration record updated successfully');
      } else {
        const newCalibration = await addCalibration(formattedValues);
        // Update the local state instead of fetching
        const updatedCalibrations = [...calibrations, newCalibration];
        useInventoryStore.setState({ calibrations: updatedCalibrations });
        toast.success('Calibration record added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingCalibration(null);
    } catch (error) {
      console.error('Error saving calibration:', error);
      toast.error(error.response?.data?.message || 'Failed to save calibration record');
    }
  };

  const getCalibrationStatus = (nextCalibrationDate) => {
    const daysRemaining = moment(nextCalibrationDate).diff(moment(), 'days');
    
    if (daysRemaining < 0) {
      return { 
        status: 'overdue', 
        color: '#ffccc7',  // Light Red background
        textColor: '#cf1322', // Dark Red text
        icon: <ExclamationCircleOutlined style={{ color: '#cf1322' }} />, 
        text: 'OVERDUE' 
      };
    } else if (daysRemaining <= 2) {
      return { 
        status: 'due_soon', 
        color: '#fff1b8',  // Light Yellow background
        textColor: '#d48806', // Dark Yellow text
        icon: <WarningOutlined style={{ color: '#d48806' }} />, 
        text: 'DUE SOON' 
      };
    } else if (daysRemaining <= 15) {
      return { 
        status: 'warning', 
        color: '#ffe7ba',  // Light Orange background
        textColor: '#d46b08', // Dark Orange text
        icon: <WarningOutlined style={{ color: '#d46b08' }} />, 
        text: 'WARNING' 
      };
    } else {
      return { 
        status: 'normal', 
        color: '#d9f7be',  // Light Green background
        textColor: '#389e0d', // Dark Green text
        icon: <CheckCircleOutlined style={{ color: '#389e0d' }} />, 
        text: 'NORMAL' 
      };
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const colors = {
      'up_to_date': 'success',
      'due_soon': 'warning',
      'overdue': 'error',
      'in_progress': 'processing'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    const icons = {
      'up_to_date': <CheckCircleOutlined />,
      'due_soon': <WarningOutlined />,
      'overdue': <ExclamationCircleOutlined />,
      'in_progress': <SyncOutlined spin />
    };
    return icons[status] || null;
  };

  const handleInventoryItemClick = (itemId) => {
    setSelectedInventoryItem(itemId);
    setActiveTab('history');  // Switch to history tab
    
    // Get item details for the message
    const item = inventoryItems.find(item => item.id === itemId);
    const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
    const itemName = item ? `${subcategory?.name || 'N/A'} - ${item.item_code}` : itemId;
    
    message.info(`Showing calibration history for ${itemName}`);
  };

  const getFilteredHistory = () => {
    if (!calibrationHistory) return [];

    let filtered = [...calibrationHistory];

    // Filter by selected inventory item if any
    if (selectedInventoryItem) {
      filtered = filtered.filter(history => {
        // Find the calibration record for this history
        const calibration = calibrations.find(cal => cal.id === history.calibration_schedule_id);
        // Check if this calibration belongs to the selected item
        return calibration && calibration.inventory_item_id === selectedInventoryItem;
      });
    }

    // Apply date range filter for history
    if (historyDateRange && historyDateRange[0] && historyDateRange[1]) {
      filtered = filtered.filter(history => {
        const calibrationDate = moment(history.calibration_date);
        return calibrationDate.isBetween(historyDateRange[0], historyDateRange[1], 'day', '[]');
      });
    }

    // Sort by calibration date in descending order (newest first)
    filtered.sort((a, b) => moment(b.calibration_date).valueOf() - moment(a.calibration_date).valueOf());

    return filtered;
  };

  const generateCertificateNumber = (itemId) => {
    const today = moment();
    const year = today.format('YYYY');
    const month = today.format('MM');
    const day = today.format('DD');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CAL-${year}${month}${day}-${itemId}-${randomNum}`;
  };

  const columns = [
    {
      //Inventory1111
      title: 'Inventory Item',
      dataIndex: 'inventory_item_id',
      key: 'inventory_item_id',
      render: (itemId) => {
        const item = inventoryItems.find(item => item.id === itemId);
        const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
        return (
          <Tooltip title={`Click to view calibration history for this item`}>
            <Tag 
              icon={<ToolOutlined />} 
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => handleInventoryItemClick(itemId)}
            >
              {item ? `${subcategory?.name || 'N/A'} - ${item.dynamic_data["Instrument code"]}` : itemId}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Calibration Type',
      dataIndex: 'calibration_type',
      key: 'calibration_type',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Frequency (Days)',
      dataIndex: 'frequency_days',
      key: 'frequency_days',
      render: (text, record) => {
        const isEditing = editingCalibration?.id === record.id;
        return isEditing ? (
          <InputNumber
            defaultValue={text}
            min={1}
            onChange={(value) => {
              const newData = { ...editingCalibration, frequency_days: value };
              setEditingCalibration(newData);
            }}
          />
        ) : (
          <Tag>{text} days</Tag>
        );
      }
    },
    {
      title: 'Last Calibration',
      dataIndex: 'last_calibration',
      key: 'last_calibration',
      render: (date, record) => {
        const isEditing = editingCalibration?.id === record.id;
        return isEditing ? (
          <DatePicker
            showTime
            defaultValue={moment(date)}
            format="DD MMM YYYY HH:mm"
            onChange={(value) => {
              const newData = { ...editingCalibration, last_calibration: value };
              setEditingCalibration(newData);
            }}
          />
        ) : (
          moment(date).format('DD MMM YYYY')
        );
      }
    },
    {
      title: 'Next Calibration',
      dataIndex: 'next_calibration',
      key: 'next_calibration',
      render: (date) => {
        const { color, textColor, icon, text } = getCalibrationStatus(date);
        const daysRemaining = moment(date).diff(moment(), 'days');
        
        return (
          <Space direction="vertical" size="small">
            <Tag 
              icon={<CalendarOutlined style={{ color: textColor }} />} 
              color={color}
              style={{ 
                color: textColor,
                borderColor: textColor
              }}
            >
              {moment(date).format('DD MMM YYYY HH:mm')}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text, record) => {
        const isEditing = editingCalibration?.id === record.id;
        return isEditing ? (
          <Input.TextArea
            defaultValue={text}
            onChange={(e) => {
              const newData = { ...editingCalibration, remarks: e.target.value };
              setEditingCalibration(newData);
            }}
          />
        ) : (
          <Tooltip title={text}>
            <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
          </Tooltip>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const { color, textColor, icon, text } = getCalibrationStatus(record.next_calibration);
        return (
          <Tag 
            color={color} 
            icon={icon}
            style={{ 
              color: textColor,
              borderColor: textColor
            }}
          >
            {text}
          </Tag>
        );
      }
    },
    {
      title: 'Calibrate',
      key: 'calibrate',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          className="bg-green-500 text-white"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => {
            const certificateNumber = generateCertificateNumber(record.inventory_item_id);
            setIsHistoryModalVisible(true);
            historyForm.setFieldsValue({
              calibration_schedule_id: record.id,
              certificate_number: certificateNumber,
              calibration_date: moment(),
              next_due_date: moment().add(record.frequency_days, 'days')
            });
            console.log('Selected Calibration ID:', record.id);
          }}
        >
          Calibrate
        </Button>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const isEditing = editingCalibration?.id === record.id;
        return isEditing ? (
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => handleSaveInline(record.id)}
            >
              Save
            </Button>
            <Button
              size="small"
              onClick={() => {
                setEditingCalibration(null);
              }}
            >
              Cancel
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => {
                setEditingCalibration({ ...record });
              }}
              size="small"
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              size="small"
            />
          </Space>
        );
      }
    }
  ];

  const historyColumns = [
    {
      title: 'Inventory Item',
      key: 'inventory_item',
      render: (_, record) => {
        const calibration = calibrations.find(cal => cal.id === record.calibration_schedule_id);
        const item = inventoryItems.find(item => item.id === calibration?.inventory_item_id);
        const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
        return (
          <Tag icon={<ToolOutlined />}>
            {item ? `${subcategory?.name || 'N/A'} - ${item.item_code}` : 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Calibration Type',
      key: 'calibration_type',
      render: (_, record) => {
        const calibration = calibrations.find(cal => cal.id === record.calibration_schedule_id);
        return <Text strong>{calibration?.calibration_type || 'N/A'}</Text>;
      }
    },
    {
      title: 'Certificate Number',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Calibration Date',
      dataIndex: 'calibration_date',
      key: 'calibration_date',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Next Due Date',
      dataIndex: 'next_due_date',
      key: 'next_due_date',
      render: (date) => (
        <Tag icon={<CalendarOutlined />} color={moment(date).isBefore(moment()) ? 'error' : 'success'}>
          {moment(date).format('DD MMM YYYY HH:mm')}
        </Tag>
      )
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result) => (
        <Tag color={result?.toLowerCase() === 'pass' ? 'success' : 'error'}>
          {result?.toUpperCase() || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>{text || '-'}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              // Handle edit if needed
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              // Handle delete if needed
            }}
          />
        </Space>
      )
    }
  ];

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const getFilteredCalibrations = () => {
    if (!calibrations) return [];
    
    // Return only upcoming calibrations for due_soon status
    if (selectedStatus === 'due_soon') {
      const dueSoonItems = upcomingCalibrations.map(cal => {
        const item = inventoryItems.find(item => item.id === cal.item_id);
        const status = getCalibrationStatus(cal.next_calibration);
        return {
          ...cal,
          id: `${cal.item_id}-${cal.next_calibration}`,
          calibration_type: 'Regular',
          status: status.status,
          inventory_item_id: cal.item_id,
          quantity: item?.quantity,
          available_quantity: item?.available_quantity,
          item_status: item?.status,
          next_calibration: cal.next_calibration
        };
      });
      return dueSoonItems;
    }

    // For other statuses, work with the main calibrations array
    let filtered = [...calibrations];

    // Apply date range filter if exists
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(cal => {
        const nextCalDate = moment(cal.next_calibration);
        return nextCalDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      });
    }
    
    // Apply status filter for up_to_date and overdue
    if (selectedStatus === 'up_to_date') {
      filtered = filtered.filter(cal => {
        const nextCalDate = moment(cal.next_calibration);
        return nextCalDate.isAfter(moment()) && 
               !upcomingCalibrations.some(upcoming => upcoming.item_id === cal.inventory_item_id);
      });
    } else if (selectedStatus === 'overdue') {
      filtered = filtered.filter(cal => {
        const nextCalDate = moment(cal.next_calibration);
        return nextCalDate.isBefore(moment());
      });
    }

    // Add status to all items
    filtered = filtered.map(cal => {
      const status = getCalibrationStatus(cal.next_calibration);
      return {
        ...cal,
        status: status.status
      };
    });
    
    // Apply category filter if not 'all'
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cal => {
        const category = categories.find(cat => 
          cat.items?.some(item => item.id === cal.inventory_item_id)
        );
        return category?.id === selectedCategory;
      });
    }

    // Apply master search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(cal => {
        // Get the inventory item details for searching
        const item = inventoryItems.find(item => item.id === cal.inventory_item_id);
        const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
        
        // Search across all relevant fields
        return (
          (cal.calibration_type?.toLowerCase().includes(searchLower)) ||
          (cal.remarks?.toLowerCase().includes(searchLower)) ||
          (item?.dynamic_data["Instrument code"]?.toLowerCase().includes(searchLower)) ||
          (subcategory?.name?.toLowerCase().includes(searchLower)) ||
          (moment(cal.last_calibration).format('DD MMM YYYY').toLowerCase().includes(searchLower)) ||
          (moment(cal.next_calibration).format('DD MMM YYYY').toLowerCase().includes(searchLower)) ||
          (cal.frequency_days?.toString().includes(searchLower))
        );
      });
    }
    
    return filtered;
  };

  const getStatistics = () => {
    if (!calibrations) return { total: 0, upToDate: 0, dueSoon: 0, overdue: 0 };
    
    const total = calibrations.length;
    const upToDate = calibrations.filter(cal => moment(cal.next_calibration).isAfter(moment())).length;
    const dueSoon = upcomingCalibrations.length; // Use the separate upcoming calibrations data
    const overdue = calibrations.filter(cal => moment(cal.next_calibration).isBefore(moment())).length;

    return { total, upToDate, dueSoon, overdue };
  };

  const stats = getStatistics();

  const handleHistorySubmit = async (values) => {
    try {
      const formattedValues = {
        calibration_date: values.calibration_date.toISOString(),
        result: values.result,
        certificate_number: values.certificate_number,
        remarks: values.remarks || '',
        next_due_date: values.next_due_date.toISOString(),
        calibration_schedule_id: values.calibration_schedule_id,
        performed_by: 1
      };

      const newHistory = await addCalibrationHistory(formattedValues);
      // Update the local state instead of fetching
      const updatedHistory = [...calibrationHistory, newHistory];
      useInventoryStore.setState({ calibrationHistory: updatedHistory });
      
      toast.success('Calibration history record added successfully');
      setIsHistoryModalVisible(false);
      historyForm.resetFields();
    } catch (error) {
      console.error('Error saving calibration history:', error);
      toast.error(error.response?.data?.message || 'Failed to save calibration history');
    }
  };

  const dueSoonColumns = [
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Next Calibration',
      dataIndex: 'next_calibration',
      key: 'next_calibration',
      render: (date) => (
        <Tag icon={<CalendarOutlined />} color="warning">
          {moment(date).format('DD MMM YYYY HH:mm')}
        </Tag>
      )
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => {
        const item = inventoryItems.find(item => item.id === record.item_id);
        return <Text>{item?.quantity || 'N/A'}</Text>;
      }
    },
    {
      title: 'Available Quantity',
      key: 'available_quantity',
      render: (_, record) => {
        const item = inventoryItems.find(item => item.id === record.item_id);
        return <Text>{item?.available_quantity || 'N/A'}</Text>;
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const item = inventoryItems.find(item => item.id === record.item_id);
        return (
          <Tag color={item?.status === 'Active' ? 'success' : 'error'}>
            {item?.status || 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Days Remaining',
      key: 'days_remaining',
      render: (_, record) => {
        const daysRemaining = moment(record.next_calibration).diff(moment(), 'days');
        return (
          <Tag color={daysRemaining <= 3 ? 'error' : 'warning'}>
            {daysRemaining} days
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          className="bg-green-500 text-white"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => {
            const certificateNumber = generateCertificateNumber(record.item_id);
            setIsHistoryModalVisible(true);
            historyForm.setFieldsValue({
              calibration_schedule_id: record.item_id,
              certificate_number: certificateNumber,
              calibration_date: moment(),
              next_due_date: moment().add(30, 'days') // Default to 30 days for due soon items
            });
          }}
        >
          Calibrate
        </Button>
      )
    }
  ];

  const handleSaveInline = async (id) => {
    try {
      const formattedValues = {
        calibration_type: editingCalibration.calibration_type,
        frequency_days: editingCalibration.frequency_days,
        last_calibration: moment(editingCalibration.last_calibration).toISOString(),
        next_calibration: moment(editingCalibration.next_calibration).toISOString(),
        remarks: editingCalibration.remarks || '',
        inventory_item_id: editingCalibration.inventory_item_id
      };

      await updateCalibration(id, formattedValues);
      // Update the local state instead of fetching
      const updatedCalibrations = calibrations.map(cal => 
        cal.id === id ? { ...cal, ...formattedValues } : cal
      );
      useInventoryStore.setState({ calibrations: updatedCalibrations });
      
      toast.success('Calibration record updated successfully');
      setEditingCalibration(null);
    } catch (error) {
      console.error('Error saving calibration:', error);
      toast.error(error.response?.data?.message || 'Failed to save calibration record');
    }
  };

  const getOverdueCount = () => {
    if (!calibrations) return 0;
    return calibrations.filter(cal => moment(cal.next_calibration).isBefore(moment())).length;
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="loading-container">
          <Spin size="large" />
          <Text>Loading calibration data...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="calibration-container">
      {/* Header Card */}
      <Card className="header-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24}>
            <div className="header-content">
              <div className="header-title">
                <Title level={3} className="title">
                  <ToolOutlined /> Calibration Management
                </Title>
                <Text type="secondary" className="subtitle">
                  Track and manage calibration schedules for all equipment
                </Text>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                
                className="add-button"
              >
                <span className="button-text">Add New Calibration</span>
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      {activeTab === 'current' && (
        <div className="stats-container">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card 
                hoverable 
                bodyStyle={{ padding: '16px' }}
                style={{ 
                  background: 'rgba(24, 144, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(24, 144, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                       style={{ 
                         background: 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)',
                         boxShadow: '0 4px 8px rgba(24, 144, 255, 0.2)'
                       }}>
                    <ToolOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
                  </div>
                  <div className="flex-1">
                    <Text style={{ fontSize: '14px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Total Equipment
                    </Text>
                    <div className="flex items-end justify-between">
                      <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                        {stats.total}
                      </Title>
                      <Text style={{ fontSize: '12px', color: '#1890ff' }}>Total</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card 
                hoverable 
                bodyStyle={{ padding: '16px' }}
                style={{ 
                  background: 'rgba(82, 196, 26, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(82, 196, 26, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                       style={{ 
                         background: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)',
                         boxShadow: '0 4px 8px rgba(82, 196, 26, 0.2)'
                       }}>
                    <CheckCircleOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
                  </div>
                  <div className="flex-1">
                    <Text style={{ fontSize: '14px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Up to Date
                    </Text>
                    <div className="flex items-end justify-between">
                      <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                        {stats.upToDate}
                      </Title>
                      <Text style={{ fontSize: '12px', color: '#52c41a' }}>Current</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card 
                hoverable 
                bodyStyle={{ padding: '16px' }}
                style={{ 
                  background: 'rgba(250, 173, 20, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(250, 173, 20, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                       style={{ 
                         background: 'linear-gradient(135deg, #faad14 0%, #ffd666 100%)',
                         boxShadow: '0 4px 8px rgba(250, 173, 20, 0.2)'
                       }}>
                    <WarningOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
                  </div>
                  <div className="flex-1">
                    <Text style={{ fontSize: '14px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Due Soon
                    </Text>
                    <div className="flex items-end justify-between">
                      <Title level={3} style={{ margin: 0, color: '#faad14' }}>
                        {stats.dueSoon}
                      </Title>
                      <Text style={{ fontSize: '12px', color: '#faad14' }}>Pending</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card 
                hoverable 
                bodyStyle={{ padding: '16px' }}
                style={{ 
                  background: 'rgba(245, 34, 45, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(245, 34, 45, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                       style={{ 
                         background: 'linear-gradient(135deg, #f5222d 0%, #ff7875 100%)',
                         boxShadow: '0 4px 8px rgba(245, 34, 45, 0.2)'
                       }}>
                    <ExclamationCircleOutlined style={{ fontSize: '20px', color: '#ffffff' }} />
                  </div>
                  <div className="flex-1">
                    <Text style={{ fontSize: '14px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Overdue
                    </Text>
                    <div className="flex items-end justify-between">
                      <Title level={3} style={{ margin: 0, color: '#f5222d' }}>
                        {stats.overdue}
                      </Title>
                      <Text style={{ fontSize: '12px', color: '#f5222d' }}>Delayed</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Main Content */}
      <Card className="main-content">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key === 'current') {
              setSelectedInventoryItem(null); // Clear selected item when switching back to current
            }
          }}
          className="custom-tabs"
        >
          <Tabs.TabPane tab="Current Calibrations" key="current">
            <div className="filter-section">
              <Card className="filter-card">
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={24} md={8}>
                    <div className="date-filter">
                      <DatePicker.RangePicker
                        style={{ width: '100%' }}
                        onChange={(dates) => setDateRange(dates)}
                        format="YYYY-MM-DD"
                        allowClear
                        className="custom-date-picker"
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <div className="search-filter">
                      <Space style={{ width: '100%' }}>
                        <Input
                          placeholder="Search across all columns data"
                          allowClear
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="search-input"
                          prefix={<SearchOutlined className="search-icon" />}
                        />
                        <Button 
                          type="primary" 
                          icon={<SearchOutlined />}
                          onClick={() => handleSearch(searchText)}
                          className="search-button"
                        >
                          Search
                        </Button>
                        <Button 
                          type="default" 
                          icon={<ReloadOutlined />}
                          onClick={() => {
                            setSearchText('');
                            handleSearch('');
                          }}
                          className="reset-button"
                        >
                          Reset
                        </Button>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <div className="status-filter">
                      <Space size={[8, 8]} wrap={false} style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto' }}>
                        <Button
                          type={selectedStatus === 'all' ? 'primary' : 'default'}
                          onClick={() => filterCalibrations('all')}
                          className="status-button"
                        >
                          All
                        </Button>
                        <Button
                          type={selectedStatus === 'due_soon' ? 'primary' : 'default'}
                          icon={<WarningOutlined />}
                          onClick={() => filterCalibrations('due_soon')}
                          className="status-button"
                        >
                          Due Soon ({upcomingCalibrations.length})
                        </Button>
                        <Button
                          type={selectedStatus === 'overdue' ? 'primary' : 'default'}
                          danger={selectedStatus === 'overdue'}
                          icon={<ExclamationCircleOutlined />}
                          onClick={() => filterCalibrations('overdue')}
                          className="status-button"
                        >
                          Overdue ({getOverdueCount()})
                        </Button>
                      </Space>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>

            <div className="table-container">
              <Table
                columns={selectedStatus === 'due_soon' ? dueSoonColumns : columns}
                dataSource={getFilteredCalibrations()}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  responsive: true
                }}
                scroll={{ x: 'max-content' }}
                className="responsive-table"
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Calibration History" key="history">
            <div className="filter-section">
              <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <Card>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={24} md={8}>
                      <DatePicker.RangePicker
                        style={{ width: '100%' }}
                        onChange={(dates) => setHistoryDateRange(dates)}
                        format="YYYY-MM-DD"
                        allowClear
                      />
                    </Col>
                    {selectedInventoryItem && (
                      <Col xs={24} sm={24} md={16}>
                        <Alert
                          message={(() => {
                            const item = inventoryItems.find(item => item.id === selectedInventoryItem);
                            const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
                            return (
                              <Space>
                                <span>
                                  Showing history for: <Text strong>{item ? `${subcategory?.name || 'N/A'} - ${item.item_code}` : selectedInventoryItem}</Text>
                                </span>
                                <Button 
                                  type="link" 
                                  icon={<CloseOutlined />}
                                  onClick={() => setSelectedInventoryItem(null)}
                                >
                                  Clear Filter
                                </Button>
                              </Space>
                            );
                          })()}
                          type="info"
                          showIcon
                        />
                      </Col>
                    )}
                  </Row>
                </Card>
              </Space>
            </div>
            <div className="table-container">
              <Table
                columns={historyColumns}
                dataSource={getFilteredHistory()}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  responsive: true
                }}
                scroll={{ x: 1500, y: 500 }}
                className="responsive-table"
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingCalibration ? "Edit Calibration Record" : "Add New Calibration Record"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingCalibration(null);
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="calibration_type"
            label="Calibration Type"
            rules={[{ required: true, message: 'Please enter calibration type' }]}
          >
            <Input 
              placeholder="Enter calibration type"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="frequency_days"
            label="Frequency (Days)"
            rules={[{ required: true, message: 'Please enter frequency in days' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="inventory_item_id"
            label="Inventory Item"
            rules={[{ required: true, message: 'Please select an inventory item' }]}
          >
            <Cascader
              placeholder="Select Category > Subcategory > Item"
              loading={isLoading}
              style={{ width: '100%' }}
              options={categories.map(category => ({
                label: category.name,
                value: category.id,
                isLeaf: false,
                children: subcategories
                  .filter(sub => sub.category_id === category.id)
                  .map(subcategory => ({
                    label: subcategory.name,
                    value: subcategory.id,
                    isLeaf: false,
                    children: inventoryItems
                      .filter(item => item.subcategory_id === subcategory.id)
                      .map(item => ({
                        label: item.dynamic_data["Instrument code"],
                        value: item.id,
                        isLeaf: true
                      }))
                  }))
              }))}
              showSearch={{
                filter: (inputValue, path) => {
                  return path.some(option => 
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                  );
                }
              }}
              displayRender={(labels) => labels.join(' > ')}
              onChange={(value, selectedOptions) => {
                if (value && value.length === 3) {
                  form.setFieldsValue({
                    inventory_item_id: value[2]
                  });
                }
              }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="last_calibration"
                label="Last Calibration Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="next_calibration"
                label="Next Calibration Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add History Modal */}
      <Modal
        title="Add Calibration History Record"
        open={isHistoryModalVisible}
        onOk={() => historyForm.submit()}
        onCancel={() => {
          setIsHistoryModalVisible(false);
          historyForm.resetFields();
        }}
        width={600}
      >
        <Form
          form={historyForm}
          layout="vertical"
          onFinish={handleHistorySubmit}
        >
          <Form.Item
            name="calibration_schedule_id"
            label="Calibration Schedule"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="certificate_number"
            hidden
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="calibration_date"
                label="Calibration Date"
                rules={[{ required: true, message: 'Please select calibration date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="next_due_date"
                label="Next Due Date"
                rules={[{ required: true, message: 'Please select next due date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="result"
            label="Result"
            rules={[{ required: true, message: 'Please select result' }]}
          >
            <Select>
              <Option value="Pass">Pass</Option>
              <Option value="Fail">Fail</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={4} placeholder="Enter remarks" />
          </Form.Item>
        </Form>
      </Modal>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <style jsx global>{`
        .calibration-container {
          padding: 16px;
          max-width: 100%;
          overflow-x: hidden;
        }

        .header-card {
          background: linear-gradient(to right, #ffffff, #f0f7ff);
          border: none;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-title {
          flex: 1;
          min-width: 200px;
        }

        .title {
          margin: 0 !important;
          color: #1890ff;
          font-size: 24px;
        }

        @media (max-width: 576px) {
          .title {
            font-size: 20px;
          }
          
          .button-text {
            display: none;
          }
        }

        .subtitle {
          display: block;
          margin-top: 4px;
        }

        .stats-container {
          margin-bottom: 24px;
        }

        .stat-card {
          height: 100%;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          overflow: hidden;
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          min-height: 100px;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .stat-content {
          display: flex;
          align-items: center;
          padding: 16px;
          height: 100%;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 20px;
        }

        .stat-title {
          font-size: 18px;
          color: #666;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #262626;
        }

        .total-equipment .stat-icon {
          background: rgba(24, 144, 255, 0.1);
          color: #1890ff;
        }

        .up-to-date .stat-icon {
          background: rgba(82, 196, 26, 0.1);
          color: #52c41a;
        }

        .due-soon .stat-icon {
          background: rgba(250, 173, 20, 0.1);
          color: #faad14;
        }

        .overdue .stat-icon {
          background: rgba(255, 77, 79, 0.1);
          color: #ff4d4f;
        }

        @media (max-width: 768px) {
          .stat-content {
            padding: 12px;
          }

          .stat-icon {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }

          .stat-value {
            font-size: 18px;
          }
        }

        .filter-container {
          margin-bottom: 24px;
        }

        .filter-space {
          width: 100%;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }

        .category-select {
          max-width: 100%;
        }

        .main-content {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .custom-tabs {
          margin-top: -16px;
        }

        .filter-buttons {
          width: 100%;
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .filter-buttons::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .filter-buttons .ant-space {
          padding-bottom: 4px; /* Add some padding to account for scroll bar */
        }

        .filter-buttons .ant-btn {
          flex-shrink: 0;
          margin-right: 8px;
        }

        .filter-buttons .ant-btn:last-child {
          margin-right: 0;
        }

        @media (max-width: 768px) {
          .filter-buttons {
            padding-bottom: 8px;
          }
          
          .filter-buttons .ant-space {
            gap: 8px !important;
          }
        }

        .table-container {
          overflow-x: auto;
          margin: 0 -16px;
          padding: 0 16px;
        }

        .responsive-table {
          min-width: 600px;
        }

        .history-header {
          margin-bottom: 16px;
        }

        .add-button {
          background: #52c41a;
          border-color: #52c41a;
          box-shadow: 0 2px 0 rgba(82, 196, 26, 0.1);
        }

        .add-button:hover {
          background: #73d13d;
          border-color: #73d13d;
        }

        .ant-table-wrapper {
          overflow-x: auto;
        }

        .ant-table {
          background: #ffffff;
          border-radius: 8px;
        }

        .ant-table-thead > tr > th {
          background: #fafafa;
          color: #262626;
          font-weight: 600;
          white-space: nowrap;
        }

        .ant-table-tbody > tr > td {
          white-space: normal;
          word-break: break-word;
        }

        .ant-btn {
          border-radius: 6px;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
        }

        .ant-tag {
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 13px;
          white-space: nowrap;
        }

        .ant-modal {
          max-width: 95%;
        }

        .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }

        .ant-modal-header {
          background: #fafafa;
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .ant-form-item-label > label {
          font-weight: 500;
          color: #262626;
        }

        .ant-input, .ant-select-selector, .ant-picker {
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .calibration-container {
            padding: 12px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .add-button {
            width: 100%;
          }

          .filter-space {
            flex-direction: column;
            align-items: flex-start;
          }

          .category-select {
            width: 100% !important;
          }

          .ant-table {
            font-size: 14px;
          }

          .ant-statistic-title {
            font-size: 14px;
          }

          .ant-statistic-content {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .calibration-container {
            padding: 8px;
          }

          .header-card {
            margin-bottom: 16px;
          }

          .ant-table {
            font-size: 12px;
          }

          .ant-btn {
            padding: 4px 8px;
            font-size: 12px;
          }

          .ant-tag {
            padding: 2px 6px;
            font-size: 12px;
          }
        }

        .filter-section {
          margin-bottom: 16px;
        }

        .filter-section .ant-card {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .filter-section .ant-picker {
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .filter-section .ant-space {
            width: 100%;
          }
          
          .filter-section .ant-picker {
            width: 100%;
          }
        }

        .filter-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #f0f0f0;
          margin-bottom: 4px;
        }

        

        .filter-card .ant-card-body {
          padding: 8px;
        }

        .date-filter, .search-filter, .status-filter {
          background: #fafafa;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }

        .search-input {
          border-radius: 6px;
          border: 1px solid #d9d9d9;
          transition: all 0.3s;
        }

        .search-input:hover, .search-input:focus {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
        }

        .search-icon {
          color: #bfbfbf;
        }

        .search-button {
          border-radius: 6px;
          background: #1890ff;
          border-color: #1890ff;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
        }

        .reset-button {
          border-radius: 6px;
          border: 1px solid #d9d9d9;
        }

        .status-button {
          border-radius: 6px;
          transition: all 0.3s;
        }

        .status-button:hover {
          transform: translateY(-1px);
        }

        .custom-date-picker {
          border-radius: 6px;
        }

        .custom-date-picker .ant-picker-input > input {
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .filter-card .ant-card-body {
            padding: 16px;
          }

          .date-filter, .search-filter, .status-filter {
            padding: 8px;
          }

          .search-button, .reset-button {
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default Calibration;