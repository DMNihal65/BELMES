import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Card, Row, Col, Statistic, Progress, Badge, Space, Button, 
  Input, Select, Tooltip, Tag, Modal, Drawer, Switch, Empty,
  Divider, Table, Tabs, Avatar, Alert, Spin, Typography, DatePicker
} from 'antd';
import { 
  RefreshCw, Search, Grid, List, Filter, Bell, 
  Activity, CheckCircle, PauseCircle, Clock, 
  Zap, Percent, Award, Target, Box, Monitor,
  FileText, HashIcon, Code, Server, BarChart2, Settings,
  Cpu, RotateCw, Disc,
  Eye, Calendar
} from 'lucide-react';
import { 
  EyeOutlined, InfoCircleOutlined, CloseCircleFilled, 
  ToolOutlined, SortAscendingOutlined, SortDescendingOutlined,
  ToolFilled
} from '@ant-design/icons';
import useProductionStore from '../../store/productionStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatDuration } from '../../utils/timeUtils';

dayjs.extend(relativeTime);

const { TabPane } = Tabs;
const { Search: SearchInput } = Input;
const { Text, Title } = Typography;

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
  // Set date range to today only (from 00:00 to 23:59:59)
  const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
  
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

  // No date range presets or handlers needed as we're using today's date only

  // Get machine data in a stable order that won't change positions
  const stableSortedMachines = useMemo(() => {
    if (!filteredMachines.length) return [];
    
    // Create a stable sort key for each machine
    const machinesWithSortKey = filteredMachines.map(machine => ({
      ...machine,
      stableSortKey: `${machine.machine_id}-${machine.machine_name}`
    }));
    
    return machinesWithSortKey.sort((a, b) => {
      // First sort by the stable sort key
      const stableCompare = a.stableSortKey.localeCompare(b.stableSortKey);
      if (stableCompare !== 0) return stableCompare;
      
      // Then apply user-selected sort if machines have the same stable key
      if (sortOrder === 'name') {
        return (a.machine_name || '').localeCompare(b.machine_name || '');
      } else if (sortOrder === 'status') {
        const statusPriority = {
          'ON': 0,
          'IDLE': 0,
          'PRODUCTION': 1,
          'RUNNING': 1,
          'OFF': 2,
          'OFFLINE': 2,
          'STOPPED': 3,
          'MAINTENANCE': 4
        };
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      } else if (sortOrder === 'parts') {
        return (b.part_count || 0) - (a.part_count || 0);
      }
      return 0;
    });
  }, [filteredMachines, sortOrder]);

  // Helper function to safely access machine properties
  const getMachineData = (machine, property, defaultValue = 'N/A') => {
    // Check if the property exists directly on the machine object
    if (machine[property] !== undefined && machine[property] !== null) {
      return machine[property];
    }
    
    // Check if the property exists in the production_details
    if (machine.production_details && 
        machine.production_details[property] !== undefined && 
        machine.production_details[property] !== null) {
      return machine.production_details[property];
    }
    
    // Return default value if not found
    return defaultValue;
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    initializeWebSocket();
    // Refresh with today's date range
    fetchOverallOEEMetrics(dayjs().startOf('day'), dayjs().endOf('day'));
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Initialize WebSocket and OEE metrics on component mount
  useEffect(() => {
    initializeWebSocket();
    // Fetch OEE metrics for today only
    fetchOverallOEEMetrics(dayjs().startOf('day'), dayjs().endOf('day'));
    
    // Set up 5-minute interval for OEE metrics refresh
    oeeRefreshIntervalRef.current = setInterval(() => {
      // Always fetch today's data in the interval
      fetchOverallOEEMetrics(dayjs().startOf('day'), dayjs().endOf('day'));
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      if (oeeRefreshIntervalRef.current) {
        clearInterval(oeeRefreshIntervalRef.current);
      }
    };
  }, []); // No dependency on dateRange anymore

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

  // Extract workcenter and machine name
  const extractMachineInfo = (machineName) => {
    if (!machineName) return { workcenter: '', machine: 'Unknown' };
    
    // Check if the machine name contains a hyphen (indicating workcenter-machine format)
    const parts = machineName.split('-');
    if (parts.length >= 2) {
      // The last part is the machine name, the rest is the workcenter
      const machine = parts[parts.length - 1];
      const workcenter = parts.slice(0, parts.length - 1).join('-');
      return { workcenter, machine };
    }
    
    return { workcenter: '', machine: machineName };
  };

  // Format program name for better display
  const formatProgramName = (programPath) => {
    if (!programPath) return 'No Program';
    
    // If it has backslashes, get the filename only
    if (programPath.includes('\\')) {
      const parts = programPath.split('\\');
      return parts[parts.length - 1];
    }
    
    // If it has forward slashes, get the filename only
    if (programPath.includes('/')) {
      const parts = programPath.split('/');
      return parts[parts.length - 1];
    }
    
    return programPath;
  };

  // Render machine card - completely redesigned with fixed data access
  const renderMachineCard = (machine) => {
    const status = machine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig.OFFLINE;
    const hasIdleTimer = (status === 'IDLE' || status === 'ON') && machineTimers[machine.machine_id];
    
    // Extract workcenter and machine name
    const { workcenter, machine: machineName } = extractMachineInfo(machine.machine_name);
    
    // Get data safely with our helper function
    const part_count = getMachineData(machine, 'part_count', 0);
    const required_quantity = getMachineData(machine, 'required_quantity', 0);
    const launched_quantity = getMachineData(machine, 'launched_quantity', 0);
    const production_order = getMachineData(machine, 'production_order', '');
    const part_number = getMachineData(machine, 'part_number', '');
    const part_description = getMachineData(machine, 'part_description', '');
    const operation_number = getMachineData(machine, 'operation_number', '');
    const operation_description = getMachineData(machine, 'operation_description', '');
    
    // Format program name - handle both direct and nested properties
    const active_program = getMachineData(machine, 'active_program', '');
    const program_number = getMachineData(machine, 'program_number', '');
    const selected_program = getMachineData(machine, 'selected_program', '');
    
    const fullProgramPath = active_program || program_number || selected_program;
    const programName = formatProgramName(fullProgramPath);

    
    
    return (
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        style={{ 
          borderLeft: `6px solid ${statusInfo.color}`,
        }}
        onClick={() => setSelectedMachine(machine)}
      >
        {/* Status bar on top with machine name and status */}
        <div className="flex justify-between items-center px-4 py-3" style={{ backgroundColor: `${statusInfo.color}40` }}>
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-lg shadow-sm ">
              <Cpu size={18} className="text-gray-700" />
            </div>
            <div>
              {workcenter && (
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{workcenter}</div>
              )}
              <div className="text-lg font-bold text-gray-800">{machineName}</div>
            </div>
          </div>
          <Tag color={statusInfo.color} className="flex items-center gap-1 rounded-full py-1 px-3">
            {statusInfo.icon}
            <span className="font-medium">{statusInfo.label}</span>
          </Tag>
        </div>
        
        {/* Main content */}
        <div className="p-4 "style={{ backgroundColor: `${statusInfo.color}25` }}>
          {/* Order and Part number section */}
          <div className="flex flex-wrap gap-3 mb-2">
            {production_order && (
              <div className="flex-1 min-w-[140px] bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={16} className="text-blue-500" />
                  <span className="text-xs flex font-semibold text-blue-600">PRODUCTION ORDER</span>
                </div>
                <div className="text-base font-bold text-gray-800">{production_order}</div>
              </div>
            )}
            
            {part_number && (
              <div className="flex-1 min-w-[140px] bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Box size={16} className="text-green-500" />
                  <span className="text-xs font-semibold text-green-600">PART NUMBER</span>
                </div>
                <div className="text-base font-bold text-gray-800">{part_number}</div>
              </div>
            )}
          </div>
          
          
          
          {/* Production metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${statusInfo.color}25` }}>
                <BarChart2 size={20} style={{ color: statusInfo.color }} />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">PART COUNT</div>
                <div className="text-xl font-bold">{part_count}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Target size={20} className="text-purple-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">TARGET</div>
                <div className="text-xl font-bold">{launched_quantity}</div>
              </div>
            </div>
          </div>
          
          {/* Idle Timer Alert */}
          {/* {hasIdleTimer && (
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <span className="font-medium text-amber-700">
                Idle for: <span className="font-bold">{formatDuration(machineTimers[machine.machine_id].duration)}</span>
              </span>
            </div>
          )} */}
          
          {/* Program and Operation Info */}
          <div className="space-y-3 mt-4">
            {/* Program Info */}
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <Code size={14} className="text-gray-500" />
                <div className="text-xs font-semibold text-gray-600">PROGRAM</div>
              </div>
              <Tooltip title={fullProgramPath || 'No program'} placement="bottom">
                <div className="text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-200 truncate hover:bg-gray-100 transition-colors">
                  {programName || 'No program'}
                </div>
              </Tooltip>
            </div>
            
            {/* Operation Info */}
            {operation_number && (
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <ToolFilled size={14} className="text-gray-500" />
                  <div className="text-xs font-semibold text-gray-600">OPERATION</div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{operation_number}</span>
                  {operation_description && (
                    <span className="text-gray-600 ml-1">- {operation_description}</span>
                  )}
                </div>
              </div>
            )}
            
            
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end "style={{ backgroundColor: `${statusInfo.color}25` }}>
          <Button 
            type="primary"
            icon={<Eye size={16} />}
            className="flex items-center gap-1 shadow-sm hover:shadow"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMachine(machine);
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    );
  };

  // Render machine as a table row - with fixed data access
  const renderMachineListItem = (machine) => {
    const status = machine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig.OFFLINE;
    const hasIdleTimer = (status === 'IDLE' || status === 'ON') && machineTimers[machine.machine_id];

    
    
    // Extract workcenter and machine name
    const { workcenter, machine: machineName } = extractMachineInfo(machine.machine_name);
    
    // Get data safely with our helper function
    const part_count = getMachineData(machine, 'part_count', 0);
    const required_quantity = getMachineData(machine, 'required_quantity', 0);
    const launched_quantity = getMachineData(machine, 'launched_quantity', 0);
    const production_order = getMachineData(machine, 'production_order', '');
    const part_number = getMachineData(machine, 'part_number', '');
    
    // Format program name
    const active_program = getMachineData(machine, 'active_program', '');
    const program_number = getMachineData(machine, 'program_number', '');
    const selected_program = getMachineData(machine, 'selected_program', '');
    
    const fullProgramPath = active_program || program_number || selected_program;
    const programName = formatProgramName(fullProgramPath);

    const completionPercentage = launched_quantity > 0
    ? Math.min(Math.round((parseInt(part_count) || 0) / parseInt(launched_quantity) * 100), 100)
    : 0;
  
  // Determine if the machine is behind, on track, or ahead of schedule
  
    
    return (
      <Card 
        key={machine.machine_id}
        className="shadow-sm hover:shadow-md transition-shadow"
        bodyStyle={{ padding: '12px' }}
        onClick={() => setSelectedMachine(machine)}
      >
        <div className="flex items-center">
          <div 
            className="w-2 h-full min-h-[60px]"
            style={{ backgroundColor: statusInfo.color }}
          />
          <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between px-4 py-2 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                {workcenter && (
                  <div className="text-xs font-medium text-gray-500 uppercase">{workcenter}</div>
                )}
                <div className="text-lg font-bold">{machineName}</div>
                <Tag color={statusInfo.color} className="mt-1 flex items-center gap-1 w-fit">
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                  {hasIdleTimer && (
                    <span className="ml-1 text-xs">
                      ({formatDuration(machineTimers[machine.machine_id].duration)})
                    </span>
                  )}
                </Tag>
              </div>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 mt-3 md:mt-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                  <BarChart2 size={14} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Parts</div>
                  <div className="font-medium">{part_count}/{launched_quantity}</div>
                </div>
              </div>
              
              {production_order && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
                    <FileText size={14} className="text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Order</div>
                    <div className="font-medium">{production_order}</div>
                  </div>
                </div>
              )}
              
              {part_number && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                    <Box size={14} className="text-green-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Part</div>
                    <div className="font-medium">{part_number}</div>
                  </div>
                </div>
              )}
              
              <Tooltip title={fullProgramPath || 'No program'}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center">
                    <Code size={14} className="text-teal-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Program</div>
                    <div className="font-medium truncate max-w-[120px]">{programName}</div>
                  </div>
                </div>
              </Tooltip>
              
              <Button 
                type="primary" 
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
        </div>
      </Card>
    );
  };

  // Completely redesigned machine details modal
  const renderMachineDetailsModal = () => {
    if (!selectedMachine) return null;
    
    const status = selectedMachine.status || 'OFFLINE';
    const statusInfo = statusConfig[status] || statusConfig.OFFLINE;
    const hasIdleTimer = (status === 'IDLE' || status === 'ON') && machineTimers[selectedMachine.machine_id];
    
    // Extract workcenter and machine name
    const { workcenter, machine: machineName } = extractMachineInfo(selectedMachine.machine_name);
    
    // Get data safely with our helper function
    const part_count = getMachineData(selectedMachine, 'part_count', 0);
    const required_quantity = getMachineData(selectedMachine, 'required_quantity', 0);
    const launched_quantity = getMachineData(selectedMachine, 'launched_quantity', 0);
    const production_order = getMachineData(selectedMachine, 'production_order', 'N/A');
    const part_number = getMachineData(selectedMachine, 'part_number', 'N/A');
    const part_description = getMachineData(selectedMachine, 'part_description', 'N/A');
    const operation_number = getMachineData(selectedMachine, 'operation_number', 'N/A');
    const operation_description = getMachineData(selectedMachine, 'operation_description', 'N/A');
    
    // Format program name
    const active_program = getMachineData(selectedMachine, 'active_program', '');
    const program_number = getMachineData(selectedMachine, 'program_number', '');
    const selected_program = getMachineData(selectedMachine, 'selected_program', '');
    
    const fullProgramPath = active_program || program_number || selected_program;
    const programName = formatProgramName(fullProgramPath);
    
    return (
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gray-100">
              <Cpu size={20} className="text-gray-700" />
            </div>
            <div className="flex flex-col">
              {workcenter && (
                <span className="text-xs font-medium text-gray-500 uppercase">{workcenter}</span>
              )}
              <span className="text-xl font-bold">{machineName}</span>
            </div>
            <Tag color={statusInfo.color} className="ml-auto flex items-center gap-1 rounded-full px-3">
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
              {/* {hasIdleTimer && (
                <span className="ml-1 text-xs">
                  ({formatDuration(machineTimers[selectedMachine.machine_id].duration)})
                </span>
              )} */}
            </Tag>
          </div>
        }
        open={!!selectedMachine}
        onCancel={() => setSelectedMachine(null)}
        footer={null}
        width={800}
        bodyStyle={{ padding: '20px' }}
        centered
      >
        <div className="space-y-6">
          {/* Main Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Card */}
            
           
           
          </div>
          
          {/* Production Details */}
          <Card 
            title={
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                <span>Production Details</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Production Order */}
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                  <HashIcon size={14} />
                  <span>Production Order</span>
                </div>
                <div className="font-medium text-lg">
                  {production_order}
                </div>
              </div>
              
              {/* Part Information */}
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                  <Box size={14} />
                  <span>Part Number</span>
                </div>
                <div className="font-medium text-lg">
                  {part_number}
                </div>
                {part_description && part_description !== 'N/A' && (
                  <div className="text-sm text-gray-500">
                    {part_description}
                  </div>
                )}
              </div>
              
              {/* Operation */}
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                  <ToolFilled size={14} />
                  <span>Operation</span>
                </div>
                <div className="font-medium">
                  {operation_number !== 'N/A' 
                    ? `${operation_number} - ${operation_description}`
                    : 'N/A'
                  }
                </div>
              </div>
              
             
              
              {/* Active Program */}
              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                  <Code size={14} />
                  <span>Active Program</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 font-mono text-sm break-words">
                  {fullProgramPath || 'No program'}
                </div>
                {programName !== fullProgramPath && fullProgramPath && (
                  <div className="text-xs text-gray-500 mt-1">
                    File: {programName}
                  </div>
                )}
              </div>
              
              {/* Last Update */}
              <div className="col-span-2 pt-2 mt-2 border-t border-gray-100">
                <div className="text-sm text-gray-500 flex items-center gap-1.5">
                  <RotateCw size={14} />
                  <span>Last Updated:</span>
                  <span className="font-medium">{dayjs(selectedMachine.last_updated).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
              </div>
            </div>
          </Card>
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

        {/* Merged OEE and Status Summary - Combined into one modern section */}
        <Card className="shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left side - OEE Summary with radial gauges */}
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-white p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={20} className="text-blue-500" />
                  <span className="font-bold text-gray-800">Today's Overall Efficiency</span>
                </div>
                <div className="flex items-center gap-4">
                  <Tooltip title="Last updated">
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock size={14} className="mr-1 text-blue-400" />
                      {overallOEEMetrics?.lastUpdated ? dayjs(overallOEEMetrics.lastUpdated).format('HH:mm') : '--:--'}
                    </div>
                  </Tooltip>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {/* Overall OEE */}
                <div className="col-span-4 md:col-span-1 flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <Progress
                      type="circle"
                      percent={Math.round(overallOEEMetrics?.oee || 0)}
                      size={80}
                      strokeColor="#1890ff"
                      strokeWidth={10}
                    />
                    {/* <div className="absolute inset-0 flex items-center justify-center">
                      <Award size={24} className="text-blue-500" />
                    </div> */}
                  </div>
                  <div className="mt-2 text-center">
                    <div className='flex'><Award size={24} className="text-blue-500" />
                    <div className="text-sm font-medium text-gray-600">OEE</div></div>
                   
                    <div className="text-xl font-bold text-blue-600">{overallOEEMetrics?.oee?.toFixed(1)}%</div>
                  </div>
                </div>
                
                {/* OEE Factors */}
                <div className="col-span-4 md:col-span-3 grid grid-cols-3 gap-2">
                  {/* Availability */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <Progress
                        type="circle"
                        percent={Math.round(overallOEEMetrics?.availability || 0)}
                        size={64}
                        strokeColor="#52c41a"
                        strokeWidth={8}
                      />
                     
                    </div>
                    <div className="mt-1 text-center">
                    <div className='flex gap-1'> <Clock size={15} className="text-green-500" />
                    <div className="text-xs font-medium text-gray-500">Availability</div></div>
                   
                     
                      <div className="text-base font-bold text-green-600">{overallOEEMetrics?.availability?.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  {/* Performance */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <Progress
                        type="circle"
                        percent={Math.round(overallOEEMetrics?.performance || 0)}
                        size={64}
                        strokeColor="#faad14"
                        strokeWidth={8}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                       
                      </div>
                    </div>
                    <div className="mt-1 text-center ">
                    <div className='flex gap-1'>  <Zap size={15} className="text-yellow-500" />
                    <div className="text-xs font-medium text-gray-500">Performance</div></div>
                      
                      <div className="text-base font-bold text-yellow-600">{overallOEEMetrics?.performance?.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  {/* Quality */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <Progress
                        type="circle"
                        percent={Math.round(overallOEEMetrics?.quality || 0)}
                        size={64}
                        strokeColor="#722ed1"
                        strokeWidth={8}
                      />
                      
                    </div>
                    <div className="mt-1 text-center">
                    <div className='flex gap-1'> <Target size={15} className="text-purple-500" />
                    <div className="text-xs font-medium text-gray-500">Quality</div></div>
                     
                      <div className="text-base font-bold text-purple-600">{overallOEEMetrics?.quality?.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Machine Status Summary */}
            <div className="flex-1 p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-white border-t lg:border-t-0 lg:border-l border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server size={20} className="text-gray-700" />
                  <span className="font-bold text-gray-800">Machine Status</span>
                </div>
                <div className="text-sm flex items-center">
                  <span className="font-medium text-gray-600">Total: </span>
                  <span className="font-bold text-gray-800 ml-1">{stats.totalMachines}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Status pills with animations */}
                <div className="flex-1 min-w-[110px] p-3 rounded-xl flex items-center gap-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-100 shadow-sm transition-all hover:shadow-md">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center pulse-animation">
                      <Activity size={16} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-green-600">Production</div>
                    <div className="text-xl font-bold text-gray-800">{stats.production}</div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[110px] p-3 rounded-xl flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-100 shadow-sm transition-all hover:shadow-md">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <PauseCircle size={16} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-yellow-600">Idle</div>
                    <div className="text-xl font-bold text-gray-800">{stats.on + stats.idle}</div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[110px] p-3 rounded-xl flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-sm transition-all hover:shadow-md">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                      <InfoCircleOutlined className="text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Offline</div>
                    <div className="text-xl font-bold text-gray-800">{stats.off + stats.offline}</div>
                  </div>
                </div>
              </div>
              
              {/* Machine distribution bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Machine Distribution</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Production</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Idle</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      <span>Offline</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-3 w-full rounded-full overflow-hidden flex">
                  <div 
                    className="bg-green-500 transition-all duration-500" 
                    style={{ width: `${stats.totalMachines ? (stats.production / stats.totalMachines) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="bg-yellow-500 transition-all duration-500" 
                    style={{ width: `${stats.totalMachines ? ((stats.on + stats.idle) / stats.totalMachines) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="bg-gray-500 transition-all duration-500" 
                    style={{ width: `${stats.totalMachines ? ((stats.off + stats.offline) / stats.totalMachines) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
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
        ) : stableSortedMachines.length > 0 ? (
          <div className={`
            ${viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4'
            : 'space-y-3'
            }
          `}>
            {stableSortedMachines.map(machine => (
              <div key={machine.machine_id}>
                {viewMode === 'grid' 
                  ? renderMachineCard(machine)
                  : renderMachineListItem(machine)
                }
              </div>
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
      {renderMachineDetailsModal()}
      
      {/* Alerts Drawer */}
      
    </div>
  );
};

export default MachineDashboard;

<style jsx>{`
  .pulse-animation {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
    }
  }
`}</style>