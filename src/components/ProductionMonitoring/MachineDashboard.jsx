import React, { useEffect, useState, useRef } from 'react';
import { 
  Card, Row, Col, Statistic, Progress, Badge, Space, Button, 
  Input, Select, Tooltip, Tag, Modal, Drawer, Switch, Empty,
  Divider, Table, Tabs, Avatar, Alert, Spin
} from 'antd';
import { 
  RefreshCw, Search, Grid, List, Filter, Bell, 
  Activity, CheckCircle, PauseCircle, Clock, 
  Zap, Percent, Award, Target
} from 'lucide-react';
import { 
  EyeOutlined, InfoCircleOutlined, CloseCircleFilled, 
  ToolOutlined, SortAscendingOutlined, SortDescendingOutlined
} from '@ant-design/icons';
import useProductionStore from '../../stores/productionStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatDuration } from '../../utils/timeUtils';

dayjs.extend(relativeTime);

const { TabPane } = Tabs;
const { Search: SearchInput } = Input;

const MachineDashboard = () => {
  const { 
    machines, 
    isLoading, 
    wsConnection,
    initializeWebSocket,
    fetchKPIData,
    fetchOverallOEEMetrics,
    overallOEEMetrics
  } = useProductionStore();
  
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [alertsCount, setAlertsCount] = useState(3); // Mock alerts count
  const [sortOrder, setSortOrder] = useState('status');
  const [machineTimers, setMachineTimers] = useState({});
  
  // OEE refresh interval ref
  const oeeRefreshIntervalRef = useRef(null);
  
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
      icon: <PauseCircle size={16} />,
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
      icon: <CheckCircle size={16} />,
      label: 'Running'
    },
    'IDLE': { 
      color: '#faad14',
      bgColor: '#fffbe6', 
      borderColor: '#ffe58f',
      icon: <PauseCircle size={16} />,
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

  // Connection status
  const connectionStatus = wsConnection?.readyState === WebSocket.OPEN;

  // Filter machines based on status and search query
  const filteredMachines = machines.filter(machine => {
    const matchesStatus = filterStatus === 'ALL' || machine.status === filterStatus;
    const matchesSearch = !searchQuery || 
      (machine.machine_name && machine.machine_name.toLowerCase().includes(searchQuery.toLowerCase()));
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
    fetchOverallOEEMetrics();
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Initialize WebSocket and OEE metrics on component mount
  useEffect(() => {
        initializeWebSocket();
    fetchOverallOEEMetrics();
    
    // Set up 5-minute interval for OEE metrics refresh
    oeeRefreshIntervalRef.current = setInterval(() => {
      fetchOverallOEEMetrics();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      if (oeeRefreshIntervalRef.current) {
        clearInterval(oeeRefreshIntervalRef.current);
      }
    };
  }, []);

  // Update machine idle timers
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const updatedTimers = { ...machineTimers };
      let hasChanges = false;
      
      machines.forEach(machine => {
        if (machine.status === 'IDLE' || machine.status === 'ON') {
          const lastUpdated = machine.last_updated ? new Date(machine.last_updated) : new Date();
          const now = new Date();
          const duration = Math.floor((now - lastUpdated) / 1000); // in seconds
          
          if (!updatedTimers[machine.machine_id] || updatedTimers[machine.machine_id].duration !== duration) {
            updatedTimers[machine.machine_id] = {
              duration,
              lastUpdated
            };
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        setMachineTimers(updatedTimers);
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [machines]);

  // Render machine card
  const renderMachineCard = (machine) => {
    const status = machine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig.OFFLINE;
    const hasIdleTimer = (status === 'IDLE' || status === 'ON') && machineTimers[machine.machine_id];
    
    return (
      <Card 
        key={machine.machine_id}
        className="h-full shadow-sm hover:shadow-md transition-shadow"
        style={{ 
          borderLeft: `4px solid ${statusInfo.color}`,
          backgroundColor: statusInfo.bgColor,
          opacity: status === 'OFF' || status === 'OFFLINE' ? 0.8 : 1
        }}
        bodyStyle={{ padding: '16px' }}
        onClick={() => setSelectedMachine(machine)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-lg font-semibold">{machine.machine_name}</div>
              <div className="text-xs text-gray-500">ID: {machine.machine_id}</div>
            </div>
            <Tag color={statusInfo.color} className="flex items-center gap-1">
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </Tag>
          </div>
          
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

  // Render machine as a table row
  const renderMachineListItem = (machine) => {
    const status = machine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig.OFFLINE;
    const hasIdleTimer = (status === 'IDLE' || status === 'ON') && machineTimers[machine.machine_id];
    
    return (
      <Card 
        key={machine.machine_id}
        className="shadow-sm hover:shadow-md transition-shadow"
        bodyStyle={{ padding: '12px' }}
        onClick={() => setSelectedMachine(machine)}
      >
        <div className="flex items-center">
          <div 
            className="w-4 h-full min-h-[40px]"
            style={{ backgroundColor: statusInfo.color }}
          />
          <div className="flex-grow flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="font-medium">{machine.machine_name}</div>
                <div className="text-xs text-gray-500">ID: {machine.machine_id}</div>
              </div>
              
              <Tag color={statusInfo.color} className="flex items-center gap-1">
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
                {hasIdleTimer && (
                  <span className="ml-1 text-xs">
                    ({formatDuration(machineTimers[machine.machine_id].duration * 1000)})
                  </span>
                )}
              </Tag>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-gray-500">Parts</div>
                <div className="font-medium">{machine.part_count || 0}</div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-500">Job</div>
                <div className="font-medium">
                  {machine.job_in_progress ? (
                    <Badge status="processing" text="Active" />
                  ) : (
                    <Badge status="default" text="None" />
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-500">Last Updated</div>
                <div className="font-medium">{dayjs(machine.last_updated).fromNow()}</div>
              </div>
              
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMachine(machine);
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Machine details modal
  const renderMachineDetailsModal = () => {
    if (!selectedMachine) return null;
    
    const status = selectedMachine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig.OFFLINE;
    
    return (
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>{selectedMachine.machine_name} Details</span>
            <Tag color={statusInfo.color} className="flex items-center gap-1">
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </Tag>
          </div>
        }
        open={!!selectedMachine}
        onCancel={() => setSelectedMachine(null)}
        footer={null}
        width={700}
      >
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Machine Information" className="shadow-sm">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Machine ID</div>
                  <div className="font-medium">{selectedMachine.machine_id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Machine Type</div>
                  <div className="font-medium">{selectedMachine.machine_type || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium">{dayjs(selectedMachine.last_updated).format('YYYY-MM-DD HH:mm:ss')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusInfo.color }}></div>
                    {statusInfo.label}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card title="Production Details" className="shadow-sm">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Active Program</div>
                  <div className="font-medium">{selectedMachine.production_details?.active_program || 'No active program'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Production Order</div>
                  <div className="font-medium">
                    {selectedMachine.production_details?.production_order || 'No active order'}
                    {selectedMachine.job_status === 1 && (
                      <Badge status="processing" text="Active" className="ml-2" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Part Number</div>
                  <div className="font-medium">{selectedMachine.production_details?.part_number || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Parts Count</div>
                  <div className="font-medium">{selectedMachine.part_count || 0}</div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card title="Current Status" className="shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Statistic 
                    title="Uptime" 
                    value={selectedMachine.uptime || '0h 0m'} 
                    prefix={<Clock size={16} />} 
                  />
                </div>
                <div>
                  <Statistic 
                    title="Efficiency" 
                    value={selectedMachine.efficiency || 0} 
                    suffix="%" 
                    prefix={<Zap size={16} />} 
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Modal>
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

            <div className="flex items-center gap-3">
              <Button 
                icon={<Bell size={16} />} 
                onClick={() => setShowAlertsDrawer(true)}
                badge={{ count: alertsCount }}
              >
                Alerts
              </Button>
              
              <Button 
                icon={<Filter size={16} />} 
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status Filter</div>
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    style={{ width: 150 }}
                  >
                    <Select.Option value="ALL">All Statuses</Select.Option>
                    <Select.Option value="PRODUCTION">Production</Select.Option>
                    <Select.Option value="ON">Idle</Select.Option>
                    <Select.Option value="OFF">Offline</Select.Option>
                  </Select>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Sort By</div>
                  <Select
                    value={sortOrder}
                    onChange={setSortOrder}
                    style={{ width: 150 }}
                  >
                    <Select.Option value="status">Status</Select.Option>
                    <Select.Option value="name">Machine Name</Select.Option>
                    <Select.Option value="parts">Parts Count</Select.Option>
                  </Select>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Search</div>
                  <SearchInput 
                    placeholder="Search machines..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                  />
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">View Mode</div>
                  <div className="flex border rounded-md overflow-hidden">
                    <Button 
                      type={viewMode === 'grid' ? 'primary' : 'default'} 
                      icon={<Grid size={16} />}
                      onClick={() => setViewMode('grid')}
                      className="rounded-none border-0"
                    />
                    <Button 
                      type={viewMode === 'list' ? 'primary' : 'default'} 
                      icon={<List size={16} />}
                      onClick={() => setViewMode('list')}
                      className="rounded-none border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <Card className="shadow-sm">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                    <div className="text-sm text-gray-500">Overall OEE</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {overallOEEMetrics?.oee.toFixed(1)}%
                      </div>
                    </div>
                  <div className="p-3 rounded-full bg-blue-200">
                    <Award size={24} className="text-blue-600" />
                    </div>
                  </div>
                <Progress 
                  percent={overallOEEMetrics?.oee || 0} 
                  size="small" 
                  strokeColor="#1890ff"
                  className="mt-2"
                />
              </Card>
            </Col>
            
            <Col xs={24} md={12} lg={6}>
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Availability</div>
                    <div className="text-2xl font-bold text-green-600">
                      {overallOEEMetrics?.availability.toFixed(1)}%
                    </div>
                    </div>
                  <div className="p-3 rounded-full bg-green-200">
                    <Clock size={24} className="text-green-600" />
                    </div>
                  </div>
                <Progress 
                  percent={overallOEEMetrics?.availability || 0} 
                  size="small" 
                  strokeColor="#52c41a"
                  className="mt-2"
                />
                </Card>
            </Col>
                
            <Col xs={24} md={12} lg={6}>
              <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                    <div className="text-sm text-gray-500">Performance</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {overallOEEMetrics?.performance.toFixed(1)}%
                      </div>
                    </div>
                  <div className="p-3 rounded-full bg-yellow-200">
                    <Zap size={24} className="text-yellow-600" />
                    </div>
                  </div>
                <Progress 
                  percent={overallOEEMetrics?.performance || 0} 
                  size="small" 
                  strokeColor="#faad14"
                  className="mt-2"
                />
              </Card>
            </Col>
            
            <Col xs={24} md={12} lg={6}>
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                    <div className="text-sm text-gray-500">Quality</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {overallOEEMetrics?.quality.toFixed(1)}%
                      </div>
                    </div>
                  <div className="p-3 rounded-full bg-purple-200">
                    <Target size={24} className="text-purple-600" />
                      </div>
                    </div>
                <Progress 
                  percent={overallOEEMetrics?.quality || 0} 
                  size="small" 
                  strokeColor="#722ed1"
                  className="mt-2"
                />
                </Card>
            </Col>
          </Row>
            </Card>
        
        {/* Machine Status Summary - Enhanced Version */}
        <Card 
          className="shadow-sm mb-4"
          title={
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              <span className="font-semibold">Machine Status Summary</span>
            </div>
          }
          extra={
            <Tooltip title="Last updated">
              <div className="text-xs text-gray-500 flex items-center">
                <Clock size={14} className="mr-1 text-blue-400" />
                {overallOEEMetrics?.lastUpdated ? dayjs(overallOEEMetrics.lastUpdated).format('HH:mm') : '--:--'}
              </div>
            </Tooltip>
          }
        >
          <div className="flex flex-wrap justify-between items-center">
            {/* Status Indicators */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Production Status */}
              <div className="flex-1 min-w-[110px] bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg shadow-sm border border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-700">Production</span>
                  </div>
                  <Activity size={16} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-600 text-center">{stats.production}</div>
              </div>
              
              {/* Idle Status */}
              <div className="flex-1 min-w-[110px] bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg shadow-sm border border-yellow-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-yellow-700">Idle</span>
                  </div>
                  <PauseCircle size={16} className="text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-yellow-600 text-center">{stats.on + stats.idle}</div>
              </div>
              
              {/* Offline Status */}
              <div className="flex-1 min-w-[110px] bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-sm font-medium text-gray-700">Offline</span>
                  </div>
                  <InfoCircleOutlined className="text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-600 text-center">{stats.off + stats.offline}</div>
              </div>
            </div>
            
            {/* Divider for small screens */}
            <div className="hidden sm:block w-px h-16 bg-gray-200 mx-4"></div>
            
            {/* Summary Stats */}
            <div className="flex items-center gap-4 mt-3 sm:mt-0">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1 shadow-sm">
                  <span className="text-blue-600 font-bold">{stats.totalMachines}</span>
                </div>
                <div className="text-xs text-gray-600 text-center">Total<br/>Machines</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-1 shadow-sm">
                  <span className="text-purple-600 font-bold">{stats.activeJobs}</span>
                </div>
                <div className="text-xs text-gray-600 text-center">Active<br/>Jobs</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center mb-1 shadow-sm">
                  <RefreshCw size={16} className="text-cyan-600" />
                </div>
                <div className="text-xs text-gray-600 text-center">Auto<br/>Refresh</div>
              </div>
            </div>
          </div>
          
          {/* Progress bar showing machine distribution */}
          <div className="mt-4">
            <div className="h-2 w-full rounded-full overflow-hidden flex">
              <div 
                className="bg-green-500" 
                style={{ width: `${stats.totalMachines ? (stats.production / stats.totalMachines) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-yellow-500" 
                style={{ width: `${stats.totalMachines ? ((stats.on + stats.idle) / stats.totalMachines) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-gray-500" 
                style={{ width: `${stats.totalMachines ? ((stats.off + stats.offline) / stats.totalMachines) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </Card>

        {/* View Toggle and Machine Count */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Machine Status ({filteredMachines.length})</h2>
          <div className="bg-white rounded-lg shadow-sm p-1">
            <Space>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<Grid size={16} />}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<List size={16} />}
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
            <div className="text-center">
              <Spin size="large" />
              <div className="mt-4 text-gray-500">Loading machine data...</div>
            </div>
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
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedMachine?.status_color || '#d9d9d9' }}
            />
            <span>{selectedMachine?.machine_name || 'Machine Details'}</span>
          </div>
        }
        open={!!selectedMachine}
        onCancel={() => setSelectedMachine(null)}
        footer={null}
        width={700}
      >
        {selectedMachine && (
            <div className="space-y-4">
            {/* Overview Section */}
            <Card title="Machine Overview" className="shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                    <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag color={selectedMachine.status_color} className="flex items-center gap-1">
                      {statusConfig[selectedMachine.status]?.icon}
                      {statusConfig[selectedMachine.status]?.label || selectedMachine.status}
                    </Tag>
                    {(selectedMachine.status === 'IDLE' || selectedMachine.status === 'ON') && machineTimers[selectedMachine.machine_id] && (
                      <span className="text-sm text-gray-500">
                        for {formatDuration(machineTimers[selectedMachine.machine_id].duration * 1000)}
                      </span>
                    )}
                    </div>
                </div>
                
                  <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="mt-1">{dayjs(selectedMachine.last_updated).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </div>
                
                  <div>
                  <div className="text-sm text-gray-500">Machine ID</div>
                  <div className="mt-1">{selectedMachine.machine_id}</div>
                  </div>
                
                    <div>
                  <div className="text-sm text-gray-500">Part Count</div>
                  <div className="mt-1">{selectedMachine.part_count || 0}</div>
            </div>
                    </div>
            </Card>
            
            {/* Production Details */}
            {selectedMachine.job_in_progress ? (
              <Card title="Current Production" className="shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <div className="text-sm text-gray-500">Production Order</div>
                    <div className="mt-1 font-medium">{selectedMachine.production_details?.production_order || '-'}</div>
                    </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Part Number</div>
                    <div className="mt-1">{selectedMachine.production_details?.part_number || '-'}</div>
            </div>
                  
                    <div>
                    <div className="text-sm text-gray-500">Part Description</div>
                    <div className="mt-1">{selectedMachine.production_details?.part_description || '-'}</div>
                    </div>
                  
                    <div>
                    <div className="text-sm text-gray-500">Operation</div>
                    <div className="mt-1">{selectedMachine.production_details?.operation_number || '-'} - {selectedMachine.production_details?.operation_description || '-'}</div>
                    </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Quantity</div>
                    <div className="mt-1">
                      {selectedMachine.part_count || 0} / {selectedMachine.production_details?.required_quantity || 0}
                      <Progress 
                        percent={selectedMachine.production_details?.required_quantity ? 
                          (selectedMachine.part_count / selectedMachine.production_details.required_quantity) * 100 : 0
                        } 
                        size="small" 
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Program</div>
                    <div className="mt-1">{selectedMachine.production_details?.active_program || '-'}</div>
                  </div>
                </div>
              </Card>
            ) : (
              <Alert
                message="No Active Production"
                description="This machine is not currently running a production order."
                type="info"
                showIcon
              />
            )}
            </div>
        )}
      </Modal>
      
      {/* Alerts Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Bell size={16} />
            <span>Recent Alerts</span>
            <Badge count={alertsCount} style={{ backgroundColor: '#ff4d4f' }} />
          </div>
        }
        placement="right"
        onClose={() => setShowAlertsDrawer(false)}
        open={showAlertsDrawer}
        width={400}
      >
        <div className="space-y-4">
          {alerts.map(alert => (
            <Card 
              key={alert.id}
              size="small"
              className="shadow-sm"
              style={{ 
                borderLeft: `3px solid ${
                  alert.type === 'error' ? '#ff4d4f' : 
                  alert.type === 'warning' ? '#faad14' : '#1890ff'
                }`
              }}
            >
              <div className="flex justify-between items-start">
        <div>
                  <div className="font-medium">{alert.machine}</div>
                  <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
        </div>
                <Tag color={
                  alert.type === 'error' ? 'error' : 
                  alert.type === 'warning' ? 'warning' : 'processing'
                }>
                  {alert.type}
                </Tag>
        </div>
              <div className="text-xs text-gray-500 mt-2">{alert.time}</div>
            </Card>
          ))}
      </div>
      </Drawer>
    </div>
  );
};

export default MachineDashboard;