import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Space, DatePicker, Spin, Empty, 
  Select, Input, Badge, Tooltip, Button, Dropdown, Menu, Tabs, 
  Progress, Alert, Switch, Drawer, Avatar, Tag
} from 'antd';
import { 
  Activity, Clock, AlertTriangle, Filter, Search, 
  BarChart2, PieChart, Grid, List, RefreshCw, 
  Settings, Info, TrendingUp, Calendar, ExternalLink,
  Zap, ChevronRight, ToggleRight, Bell, MoreVertical,
  
  
  CheckCircle,
  PauseCircle
} from 'lucide-react';
import { 
  ToolOutlined, ReloadOutlined, AppstoreOutlined, 
  UnorderedListOutlined, BellOutlined, 
  ExclamationCircleOutlined, ThunderboltOutlined,
  EyeOutlined, HistoryOutlined, TeamOutlined,
  SettingOutlined, DashboardOutlined, FilterOutlined,
  CloseCircleFilled,
  InfoCircleOutlined
} from '@ant-design/icons';
import useProductionStore from '../../stores/productionStore';
import MachineCard from './MachineCard';
import MachineDetailsModal from './MachineDetailsModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;
const { Search: AntSearch } = Input;
const { TabPane } = Tabs;

const MachineDashboard = () => {
  const { 
    machines, 
    isLoading, 
    wsConnection,
    initializeWebSocket,
    fetchKPIData,
    kpiData,
    setKPITimeframe,
    kpiTimeframe 
  } = useProductionStore();
  
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [alertsCount, setAlertsCount] = useState(3); // Mock alerts count
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [timeframe, setTimeframe] = useState('today');
  const [sortOrder, setSortOrder] = useState('status');
  
  // Status colors and icons mapping
  const statusConfig = {
    'RUNNING': { 
      color: '#52c41a', 
      bgColor: '#f6ffed', 
      borderColor: '#b7eb8f',
      icon: <CheckCircle />,
      label: 'Running'
    },
    'IDLE': { 
      color: '#faad14', 
      bgColor: '#fffbe6', 
      borderColor: '#ffe58f',
      icon: <PauseCircle />,
      label: 'Idle'
    },
    'STOPPED': { 
      color: '#ff4d4f', 
      bgColor: '#fff2f0', 
      borderColor: '#ffccc7',
      icon: <CloseCircleFilled />,
      label: 'Stopped'
    },
    'MAINTENANCE': { 
      color: '#1890ff', 
      bgColor: '#e6f7ff', 
      borderColor: '#91d5ff',
      icon: <ToolOutlined />,
      label: 'Maintenance'
    },
    'PRODUCTION': { 
      color: '#722ed1', 
      bgColor: '#f9f0ff', 
      borderColor: '#d3adf7',
      icon: <BarChart2 size={16} />,
      label: 'Production'
    },
    'OFFLINE': { 
      color: '#8c8c8c', 
      bgColor: '#fafafa', 
      borderColor: '#d9d9d9',
      icon: <InfoCircleOutlined />,
      label: 'Offline'
    }
  };

  // Mock data for alerts
  const alerts = [
    { id: 1, machine: 'CNC-001', type: 'error', message: 'Machine stopped unexpectedly', time: '10 minutes ago' },
    { id: 2, machine: 'MILL-003', type: 'warning', message: 'Approaching maintenance threshold', time: '25 minutes ago' },
    { id: 3, machine: 'LASER-002', type: 'info', message: 'Production order completed', time: '1 hour ago' },
  ];

  // Updated stats calculation
  const stats = {
    totalMachines: machines.length,
    running: machines.filter(m => m?.status === 'RUNNING').length,
    production: machines.filter(m => m?.status === 'PRODUCTION').length,
    maintenance: machines.filter(m => m?.status === 'MAINTENANCE').length,
    stopped: machines.filter(m => m?.status === 'STOPPED').length,
    idle: machines.filter(m => m?.status === 'IDLE').length,
    activeJobs: machines.filter(m => m?.job_status === 1).length,
    offline: machines.filter(m => m?.status === 'OFFLINE').length,
  };

  // Calculate efficiency metrics
  const efficiencyMetrics = {
    oee: 78.5,
    availability: 92.3,
    performance: 85.1,
    quality: 97.8,
    efficiency: stats.running / Math.max(1, stats.totalMachines) * 100
  };

  // Connection status
  const connectionStatus = wsConnection?.readyState === WebSocket.OPEN;

  // Filter machines based on status and search query
  const filteredMachines = machines.filter(machine => {
    if (!machine) return false;
    
    const matchesStatus = filterStatus === 'ALL' || machine.status === filterStatus;
    const matchesSearch = (machine?.machine_name || '')
      .toLowerCase()
      .includes((searchQuery || '').toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Sort machines based on selected order
  const sortedMachines = [...filteredMachines].sort((a, b) => {
    if (sortOrder === 'name') {
      return (a.machine_name || '').localeCompare(b.machine_name || '');
    } else if (sortOrder === 'status') {
      // Priority order: STOPPED > MAINTENANCE > IDLE > RUNNING > PRODUCTION > OFFLINE
      const statusPriority = {
        'STOPPED': 0,
        'MAINTENANCE': 1,
        'IDLE': 2,
        'RUNNING': 3,
        'PRODUCTION': 4,
        'OFFLINE': 5,
      };
      return statusPriority[a.status] - statusPriority[b.status];
    } else if (sortOrder === 'parts') {
      return (b.part_count || 0) - (a.part_count || 0);
    }
    return 0;
  });

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    initializeWebSocket();
    fetchKPIData();
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        initializeWebSocket();
        fetchKPIData();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, fetchKPIData, initializeWebSocket]);

  // Initialize WebSocket on component mount
  useEffect(() => {
    initializeWebSocket();
    fetchKPIData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update KPI timeframe when local timeframe changes
  useEffect(() => {
    switch(timeframe) {
      case 'today':
        setKPITimeframe('24h');
        break;
      case 'week':
        setKPITimeframe('7d');
        break;
      case 'month':
        setKPITimeframe('30d');
        break;
      default:
        setKPITimeframe('24h');
    }
  }, [timeframe, setKPITimeframe]);

  // Render machine card
  const renderMachineCard = (machine) => {
    const status = machine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig['OFFLINE'];
    
    return (
      <Card 
        key={machine.machine_id}
        className="h-full transition-all hover:shadow-md"
        style={{ 
          borderTop: `3px solid ${statusInfo.color}`,
          backgroundColor: statusInfo.bgColor,
          borderColor: statusInfo.borderColor
        }}
        bodyStyle={{ padding: '16px' }}
        onClick={() => setSelectedMachine(machine)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold m-0 text-gray-800">{machine.machine_name}</h3>
              <div className="text-xs text-gray-500">ID: {machine.machine_id}</div>
            </div>
            <Tag color={statusInfo.color} icon={statusInfo.icon}>
              {statusInfo.label}
            </Tag>
          </div>
          
          {/* Content */}
          <div className="flex-grow">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Statistic 
                title="Parts Count" 
                value={machine.part_count || 0} 
                valueStyle={{ fontSize: '1.25rem' }}
              />
              <Statistic 
                title="Last Updated" 
                value={dayjs(machine.last_updated).fromNow()} 
                valueStyle={{ fontSize: '1.25rem' }}
              />
            </div>
            
            {/* Program Info */}
            <div className="mt-3 border-t pt-3 border-gray-200">
              <div className="text-sm font-medium mb-1">Active Program:</div>
              <div className="text-sm bg-white p-2 rounded border border-gray-200 truncate">
                {machine.production_details?.active_program || 'No active program'}
              </div>
            </div>
            
            {/* Production Order */}
            {machine.production_details?.production_order && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Production Order:</div>
                <div className="flex items-center">
                  <Tag color="blue">{machine.production_details.production_order}</Tag>
                  {machine.job_status === 1 && (
                    <Badge status="processing" text="Active" />
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {machine.production_details?.part_number 
                ? `Part: ${machine.production_details.part_number}` 
                : 'No part assigned'}
            </div>
            <Button 
              type="link" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMachine(machine);
              }}
            >
              Details
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Render machine list item
  const renderMachineListItem = (machine) => {
    const status = machine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig['OFFLINE'];
    
    return (
      <Card 
        key={machine.machine_id}
        className="transition-all hover:shadow-md"
        style={{ 
          borderLeft: `4px solid ${statusInfo.color}`,
          backgroundColor: statusInfo.bgColor,
          borderColor: statusInfo.borderColor
        }}
        bodyStyle={{ padding: '12px 16px' }}
        onClick={() => setSelectedMachine(machine)}
      >
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center">
          {/* Machine Info */}
          <div className="w-full md:w-1/4 mb-2 md:mb-0">
            <div className="flex items-center">
              <div className="mr-3">
                <Avatar 
                  style={{ 
                    backgroundColor: statusInfo.color,
                    color: '#fff'
                  }}
                  icon={statusInfo.icon}
                />
              </div>
              <div>
                <h3 className="text-base font-semibold m-0 text-gray-800">{machine.machine_name}</h3>
                <div className="text-xs text-gray-500">ID: {machine.machine_id}</div>
              </div>
            </div>
          </div>
          
          {/* Status */}
          <div className="w-full md:w-1/6 mb-2 md:mb-0 md:text-center">
            <div className="text-xs text-gray-500 md:mb-1">Status</div>
            <Tag color={statusInfo.color} icon={statusInfo.icon}>
              {statusInfo.label}
            </Tag>
          </div>
          
          {/* Parts Count */}
          <div className="w-full md:w-1/6 mb-2 md:mb-0 md:text-center">
            <div className="text-xs text-gray-500 md:mb-1">Parts Count</div>
            <div className="font-semibold">{machine.part_count || 0}</div>
          </div>
          
          {/* Active Program */}
          <div className="w-full md:w-1/4 mb-2 md:mb-0">
            <div className="text-xs text-gray-500 md:mb-1">Active Program</div>
            <div className="text-sm truncate max-w-xs">
              {machine.production_details?.active_program || 'No active program'}
            </div>
          </div>
          
          {/* Actions */}
          <div className="w-full md:w-auto flex justify-end">
            <Button 
              type="primary" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMachine(machine);
              }}
            >
              Details
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Production Monitoring</h1>
                <div className={`w-2 h-2 rounded-full ${connectionStatus ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={connectionStatus ? 'text-green-600' : 'text-red-600'}>
                  {connectionStatus ? 'System Connected' : 'Connection Lost'}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500">Last updated: {dayjs().format('HH:mm:ss')}</span>
                <Tooltip title="Refresh data">
                  <Button 
                    type="text" 
                    icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} 
                    onClick={handleRefresh}
                  />
                </Tooltip>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Select
                defaultValue="today"
                value={timeframe}
                onChange={setTimeframe}
                className="w-28"
                options={[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'custom', label: 'Custom' }
                ]}
              />
              
              <div className="flex items-center ml-2">
                <Switch 
                  checked={autoRefresh} 
                  onChange={setAutoRefresh} 
                  size="small" 
                  className="mr-2"
                />
                <span className="text-sm">Auto-refresh</span>
              </div>
              
              <Button 
                type="primary" 
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                className="ml-2"
              >
                Filters
              </Button>
              
              <Badge count={alertsCount} offset={[-5, 5]}>
                <Button 
                  icon={<BellOutlined />} 
                  onClick={() => setShowAlertsDrawer(true)}
                  className="ml-2"
                />
              </Badge>
            </div>
          </div>

          {/* Expanded Filters Section */}
          {showFilters && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    className="w-40"
                    options={[
                      { value: 'ALL', label: 'All Status' },
                      ...Object.entries(statusConfig).map(([key, config]) => ({
                        value: key,
                        label: (
                          <div className="flex items-center">
                            <span 
                              className="inline-block w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: config.color }}
                            />
                            {config.label}
                          </div>
                        )
                      }))
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <Select
                    value={sortOrder}
                    onChange={setSortOrder}
                    className="w-40"
                    options={[
                      { value: 'status', label: 'Status Priority' },
                      { value: 'name', label: 'Machine Name' },
                      { value: 'parts', label: 'Parts Count' }
                    ]}
                  />
                </div>
                
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <AntSearch
                    placeholder="Search by machine name, order number..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                    className="max-w-md"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button onClick={() => {
                    setFilterStatus('ALL');
                    setSearchQuery('');
                    setSortOrder('status');
                  }}>
                    Reset Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Machine Status Overview */}
        <Card 
          title={
            <div className="flex items-center gap-2">
              <DashboardOutlined />
              <span>Machine Status Overview</span>
            </div>
          } 
          className="shadow-sm"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div 
                key={status}
                className="rounded-lg p-4 flex flex-col items-center justify-center text-center"
                style={{ 
                  backgroundColor: config.bgColor,
                  borderColor: config.borderColor,
                  border: `1px solid ${config.borderColor}`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                  style={{ 
                    backgroundColor: config.color,
                    color: 'white'
                  }}
                >
                  {config.icon}
                </div>
                <div className="text-lg font-bold" style={{ color: config.color }}>
                  {stats[status.toLowerCase()] || 0}
                </div>
                <div className="text-xs font-medium text-gray-600">{config.label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card size="small" title="Machine Utilization" className="shadow-none border">
              <div className="flex justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-800">
                    {efficiencyMetrics.efficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Current utilization</div>
                </div>
                
                <div>
                  <Progress 
                    type="circle" 
                    percent={efficiencyMetrics.efficiency} 
                    size={80}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Running</div>
                  <div className="text-lg font-semibold text-green-600">{stats.running}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Idle</div>
                  <div className="text-lg font-semibold text-yellow-500">{stats.idle}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Stopped</div>
                  <div className="text-lg font-semibold text-red-500">{stats.stopped}</div>
                </div>
              </div>
            </Card>
            
            <Card size="small" title="Overall Equipment Effectiveness" className="shadow-none border">
              <div className="flex justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-800">
                    {efficiencyMetrics.oee.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">OEE Score</div>
                </div>
                
                <div>
                  <Progress 
                    type="circle" 
                    percent={efficiencyMetrics.oee} 
                    size={80}
                    strokeColor={{
                      '0%': '#722ed1',
                      '100%': '#13c2c2',
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Availability</span>
                    <span>{efficiencyMetrics.availability}%</span>
                  </div>
                  <Progress percent={efficiencyMetrics.availability} size="small" strokeColor="#1890ff" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Performance</span>
                    <span>{efficiencyMetrics.performance}%</span>
                  </div>
                  <Progress percent={efficiencyMetrics.performance} size="small" strokeColor="#52c41a" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Quality</span>
                    <span>{efficiencyMetrics.quality}%</span>
                  </div>
                  <Progress percent={efficiencyMetrics.quality} size="small" strokeColor="#722ed1" />
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Machine Status ({filteredMachines.length})</h2>
          <div className="bg-white rounded-lg shadow-sm p-1">
            <Space>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </Space>
          </div>
        </div>

        {/* Machines Grid/List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow-sm">
            <Spin size="large" />
          </div>
        ) : filteredMachines.length > 0 ? (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4'
              : 'space-y-3'
            }
          `}>
            {sortedMachines.map(machine => (
              viewMode === 'grid' 
                ? renderMachineCard(machine)
                : renderMachineListItem(machine)
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Empty 
              description={
                <div className="space-y-2">
                  <p>No machines match your current filters</p>
                  <Button onClick={() => {
                    setFilterStatus('ALL');
                    setSearchQuery('');
                  }}>
                    Reset Filters
                  </Button>
                </div>
              } 
              className="py-10"
            />
          </div>
        )}
      </div>

      {/* Machine Details Modal */}
      <MachineDetailsModal
        machine={selectedMachine}
        visible={!!selectedMachine}
        onClose={() => setSelectedMachine(null)}
      />

      {/* Alerts Drawer */}
      <Drawer
        title="Alerts & Notifications"
        placement="right"
        width={400}
        onClose={() => setShowAlertsDrawer(false)}
        open={showAlertsDrawer}
        extra={
          <Space>
            <Button>Mark All as Read</Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="All" key="1">
            <div className="space-y-4">
              {alerts.map(alert => (
                <Alert
                  key={alert.id}
                  type={alert.type}
                  message={alert.machine}
                  description={
                    <div>
                      <div>{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                    </div>
                  }
                  className="mb-2"
                  showIcon
                />
              ))}
              <Alert
                type="info"
                message="System Update"
                description={
                  <div>
                    <div>Scheduled maintenance tonight at 22:00</div>
                    <div className="text-xs text-gray-500 mt-1">2 hours ago</div>
                  </div>
                }
                className="mb-2"
                showIcon
              />
              <Alert
                type="warning"
                message="CNC-005"
                description={
                  <div>
                    <div>Material inventory running low</div>
                    <div className="text-xs text-gray-500 mt-1">3 hours ago</div>
                  </div>
                }
                className="mb-2"
                showIcon
              />
            </div>
          </TabPane>
          <TabPane tab="Critical" key="2">
            <div className="space-y-4">
              {alerts.filter(a => a.type === 'error').map(alert => (
                <Alert
                  key={alert.id}
                  type={alert.type}
                  message={alert.machine}
                  description={
                    <div>
                      <div>{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                    </div>
                  }
                  className="mb-2"
                  showIcon
                />
              ))}
            </div>
          </TabPane>
          <TabPane tab="Warnings" key="3">
            <div className="space-y-4">
              {alerts.filter(a => a.type === 'warning').map(alert => (
                <Alert
                  key={alert.id}
                  type={alert.type}
                  message={alert.machine}
                  description={
                    <div>
                      <div>{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                    </div>
                  }
                  className="mb-2"
                  showIcon
                />
              ))}
              <Alert
                type="warning"
                message="CNC-005"
                description={
                  <div>
                    <div>Material inventory running low</div>
                    <div className="text-xs text-gray-500 mt-1">3 hours ago</div>
                  </div>
                }
                className="mb-2"
                showIcon
              />
            </div>
          </TabPane>
        </Tabs>
      </Drawer>
    </div>
  );
};

// Enhanced Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MachineDashboard;