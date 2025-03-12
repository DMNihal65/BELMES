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
  PauseCircle, Timer
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
  const [machineTimers, setMachineTimers] = useState({});
  
  // Updated status colors and icons mapping
  const statusConfig = {
    'PRODUCTION': { 
      color: '#52c41a', // Green for production
      bgColor: '#f6ffed', 
      borderColor: '#b7eb8f',
      icon: <Activity size={16} />,
      label: 'Production'
    },
    'ON': { 
      color: '#faad14', // Yellow for ON (idle)
      bgColor: '#fffbe6', 
      borderColor: '#ffe58f',
      icon: <PauseCircle />,
      label: 'Idle'
    },
    'OFF': { 
      color: '#8c8c8c', // Grey for OFF (offline)
      bgColor: '#fafafa', 
      borderColor: '#d9d9d9',
      icon: <InfoCircleOutlined />,
      label: 'Offline'
    },
    // Keep these for backward compatibility
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
    production: machines.filter(m => m?.status === 'PRODUCTION').length,
    on: machines.filter(m => m?.status === 'ON').length,
    off: machines.filter(m => m?.status === 'OFF').length,
    // Keep these for backward compatibility
    running: machines.filter(m => m?.status === 'RUNNING').length,
    idle: machines.filter(m => m?.status === 'IDLE').length,
    stopped: machines.filter(m => m?.status === 'STOPPED').length,
    maintenance: machines.filter(m => m?.status === 'MAINTENANCE').length,
    offline: machines.filter(m => m?.status === 'OFFLINE').length,
    activeJobs: machines.filter(m => m?.job_status === 1).length,
  };

  // Calculate efficiency metrics
  const efficiencyMetrics = {
    oee: 78.5,
    efficiency: (stats.production + stats.running) / Math.max(1, stats.totalMachines) * 100
  };

  // Connection status
  const connectionStatus = wsConnection?.readyState === WebSocket.OPEN;

  // Update machine timers
  useEffect(() => {
    // Initialize timers for machines that are in 'ON' state
    const newTimers = {};
    const now = new Date().getTime();
    
    machines.forEach(machine => {
      if (machine && (machine.status === 'ON' || machine.status === 'IDLE')) {
        // If we already have a timer for this machine, keep it
        if (machineTimers[machine.machine_id]) {
          newTimers[machine.machine_id] = machineTimers[machine.machine_id];
        } else {
          // Otherwise, start a new timer from the last_updated time
          const lastUpdated = new Date(machine.last_updated).getTime();
          newTimers[machine.machine_id] = {
            startTime: lastUpdated,
            duration: now - lastUpdated
          };
        }
      }
    });
    
    setMachineTimers(newTimers);
    
    // Update durations every second
    const timerInterval = setInterval(() => {
      setMachineTimers(prevTimers => {
        const updatedTimers = { ...prevTimers };
        const currentTime = new Date().getTime();
        
        Object.keys(updatedTimers).forEach(machineId => {
          updatedTimers[machineId] = {
            ...updatedTimers[machineId],
            duration: currentTime - updatedTimers[machineId].startTime
          };
        });
        
        return updatedTimers;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [machines]);

  // Format duration in HH:MM:SS
  const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
      // Priority order: ON > PRODUCTION > OFF
      const statusPriority = {
        'ON': 0,
        'IDLE': 0, // Same priority as ON
        'PRODUCTION': 1,
        'RUNNING': 1, // Same priority as PRODUCTION
        'OFF': 2,
        'OFFLINE': 2, // Same priority as OFF
        'STOPPED': 3,
        'MAINTENANCE': 4
      };
      return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
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
    const hasIdleTimer = (status === 'ON' || status === 'IDLE') && machineTimers[machine.machine_id];
    
    return (
      <Card 
        key={machine.machine_id}
        className="h-full transition-all hover:shadow-md cursor-pointer"
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
            
            {/* Idle Timer */}
            {hasIdleTimer && (
              <div className="mt-2 mb-3">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock size={16} />
                  <span className="font-medium">Idle for: {formatDuration(machineTimers[machine.machine_id].duration)}</span>
                </div>
              </div>
            )}
            
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
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
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
    const hasIdleTimer = (status === 'ON' || status === 'IDLE') && machineTimers[machine.machine_id];
    
    return (
      <Card 
        key={machine.machine_id}
        className="transition-all hover:shadow-md cursor-pointer"
        style={{ 
          borderLeft: `4px solid ${statusInfo.color}`,
          backgroundColor: statusInfo.bgColor,
          borderColor: statusInfo.borderColor
        }}
        bodyStyle={{ padding: '12px' }}
        onClick={() => setSelectedMachine(machine)}
      >
        <div className="flex items-center">
          <div className="flex-grow">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold m-0">{machine.machine_name}</h3>
              <Tag color={statusInfo.color} icon={statusInfo.icon}>
                {statusInfo.label}
              </Tag>
              {hasIdleTimer && (
                <div className="flex items-center gap-1 text-yellow-600 text-sm">
                  <Clock size={14} />
                  <span>Idle: {formatDuration(machineTimers[machine.machine_id].duration)}</span>
                </div>
              )}
            </div>
            
            <div className="mt-1 grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-500">Parts: </span>
                <span className="font-medium">{machine.part_count || 0}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Program: </span>
                <span className="font-medium truncate">{machine.production_details?.active_program || 'None'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Updated: </span>
                <span className="font-medium">{dayjs(machine.last_updated).fromNow()}</span>
              </div>
            </div>
          </div>
          
          <div className="ml-4">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
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
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">Production Monitoring</h1>
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
                  { value: 'month', label: 'This Month' }
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
                      { value: 'PRODUCTION', label: (
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500" />
                          Production
                        </div>
                      )},
                      { value: 'ON', label: (
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full mr-2 bg-yellow-400" />
                          Idle
                        </div>
                      )},
                      { value: 'OFF', label: (
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full mr-2 bg-gray-400" />
                          Offline
                        </div>
                      )}
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
              <span>Machine Status</span>
            </div>
          } 
          className="shadow-sm"
        >
          <Row gutter={[16, 16]}>
            {/* Main Status Indicators */}
            <Col xs={24} lg={16}>
              <div className="grid grid-cols-3 gap-4">
                {/* Production */}
                <div 
                  className="rounded-lg p-4 flex flex-col items-center justify-center text-center"
                  style={{ 
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f'
                  }}
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: '#52c41a',
                      color: 'white'
                    }}
                  >
                    <Activity size={24} />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.production + stats.running}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Production</div>
                </div>
                
                {/* Idle */}
                <div 
                  className="rounded-lg p-4 flex flex-col items-center justify-center text-center"
                  style={{ 
                    backgroundColor: '#fffbe6',
                    border: '1px solid #ffe58f'
                  }}
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: '#faad14',
                      color: 'white'
                    }}
                  >
                    <PauseCircle size={24} />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.on + stats.idle}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Idle</div>
                </div>
                
                {/* Offline */}
                <div 
                  className="rounded-lg p-4 flex flex-col items-center justify-center text-center"
                  style={{ 
                    backgroundColor: '#fafafa',
                    border: '1px solid #d9d9d9'
                  }}
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: '#8c8c8c',
                      color: 'white'
                    }}
                  >
                    <InfoCircleOutlined style={{ fontSize: '24px' }} />
                  </div>
                  <div className="text-2xl font-bold text-gray-600">
                    {stats.off + stats.offline}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Offline</div>
                </div>
              </div>
            </Col>
            
            {/* Metrics */}
            <Col xs={24} lg={8}>
              <div className="h-full flex flex-col justify-center">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" className="text-center h-full">
                      <Statistic
                        title="Machine Utilization"
                        value={efficiencyMetrics.efficiency.toFixed(1)}
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                      />
                      <Progress 
                        percent={efficiencyMetrics.efficiency} 
                        size="small" 
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                        className="mt-2"
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" className="text-center h-full">
                      <Statistic
                        title="OEE Score"
                        value={efficiencyMetrics.oee.toFixed(1)}
                        suffix="%"
                        valueStyle={{ color: '#722ed1' }}
                      />
                      <Progress 
                        percent={efficiencyMetrics.oee} 
                        size="small" 
                        strokeColor={{
                          '0%': '#722ed1',
                          '100%': '#13c2c2',
                        }}
                        className="mt-2"
                      />
                    </Card>
                  </Col>
                </Row>
                
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-500">Total Machines</div>
                  <div className="text-2xl font-bold">{stats.totalMachines}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Active Jobs: {stats.activeJobs}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
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
    </div>
  );
};

export default MachineDashboard;