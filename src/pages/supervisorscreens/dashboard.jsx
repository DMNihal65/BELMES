import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Badge, Tag, Empty, Alert, Button, Tooltip, Drawer, Typography, Space, Divider, Avatar, Input, Collapse, Dropdown, Menu } from 'antd';
import { 
  ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, 
  BarcodeOutlined, BarChartOutlined, 
  SearchOutlined, FilterOutlined, DesktopOutlined,
  ExclamationCircleOutlined, SyncOutlined,
  FileTextOutlined, CodeSandboxOutlined, FullscreenOutlined,
  SettingOutlined, LineChartOutlined, PieChartOutlined,
  CaretDownOutlined, AppstoreOutlined, TableOutlined,
  ThunderboltOutlined, FireOutlined, RocketOutlined,
  PoweroffOutlined
} from '@ant-design/icons';
import Lottie from 'lottie-react';
import powerAnimation from '../../assets/power.json';
import idleAnimation from '../../assets/idle.json';
import offAnimation from '../../assets/off.json';
import shopAnimation from '../../assets/shop.json';
import useDashboardStore from '../../store/dashboard';

// Function to get status information including color, badge status, and border class
const getStatusInfo = (status) => {
  // Common Lottie animation options for better appearance
  const lottieOptions = {
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    },
    loop: true,
    autoplay: true
  };

  switch(status) {
    case 'PRODUCTION':
      return {
        color: 'green',
        badgeStatus: 'success',
        borderClass: 'border-green-700',
        // Using Lottie with fallback to icon
        icon: <Lottie 
                animationData={powerAnimation} 
                style={{ width: 24, height: 24 }} 
                {...lottieOptions}
                loop={true}
                className="production-animation"
              />,
        bgColor: '#328a58',
        textColor: 'text-white',
        shimmer: 'animate-pulse',
        glow: 'shadow-lg shadow-green-200',
        iconBg: '#328a58'
      };
    case 'ON':
      return {
        color: 'amber',
        badgeStatus: 'warning',
        borderClass: 'border-amber-500',
        icon: <Lottie 
                animationData={idleAnimation} 
                style={{ width: 54, height: 54 }} 
                {...lottieOptions}
                loop={true}
                className="idle-animation"
              />,
        bgColor: '#ebb625',
        textColor: 'text-white',
        shimmer: '',
        glow: 'shadow-md shadow-amber-100',
        iconBg: '#faa200'
      };
    
   
    case 'OFF':
    default:
      return {
        color: 'slate',
        badgeStatus: 'default',
        borderClass: 'border-slate-400',
        icon: <Lottie 
        animationData={offAnimation} 
        style={{ width: 34, height: 34 }} 
        {...lottieOptions}
        loop={true}
        className="off-animation"
      />,
        bgColor: '#A9A9A9',
        textColor: 'text-white',
        shimmer: '',
        glow: 'shadow-sm shadow-slate-100',
        iconBg: '#a8032a'
      };
  }
};

// Enhanced machine card component with rich UI and modern aesthetics
const ModernMachineCard = ({ machine, isSelected }) => {
  // Calculate completion percentage
  const completionPercentage = 
    machine.targetCount > 0 
      ? Math.round((machine.totalCount / machine.targetCount) * 100) 
      : 0;
      
  // Get status color and icon
  const statusInfo = getStatusInfo(machine.status);
  
  // Improved capitalization for all machine names and parts
  const displayName = machine.name?.toUpperCase() || 'UNKNOWN MACHINE';
  
  // Capitalize part number and program name
  const partNumber = machine.partNumber ? 
    machine.partNumber.toUpperCase() : 'N/A';
  const programName = machine.currentProgram ? 
    machine.currentProgram.toUpperCase() : 'N/A';
  const machineType = machine.type ? 
    machine.type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 
    'General';
  
  return (
    <Card
      className={`
        h-full rounded-xl overflow-hidden transition-all duration-300
        ${isSelected ? `shadow-xl ring-2 ring-${statusInfo.color}-500 ${statusInfo.shimmer}` : `${statusInfo.glow} hover:shadow-lg hover:scale-[1.02]`}
        backdrop-blur-sm backdrop-filter
        border border-${statusInfo.color}-200
      `}
      style={{ backgroundColor: statusInfo.bgColor }}
      bodyStyle={{ padding: '18px' }}
      bordered={true}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md mr-2.5 ${machine.status === 'PRODUCTION' ? 'animate-pulse' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {statusInfo.icon}
          </div>
          <span className={`text-base font-semibold ${statusInfo.textColor}`}>{displayName}</span>
        </div>
        <Tag 
          className={`rounded-full px-3 py-0.5 border-white text-white bg-opacity-20 shadow-sm font-medium`}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          {machine.status}
        </Tag>
      </div>
      
      <Divider className={`my-2.5 border-white opacity-30`} />
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-2.5 rounded-lg bg-white bg-opacity-90 shadow-sm border border-white border-opacity-30`}>
          <div className="text-xs text-gray-500 mb-1">Part Number</div>
          <div className="text-sm font-medium truncate">{partNumber}</div>
        </div>
        <div className={`p-2.5 rounded-lg bg-white bg-opacity-90 shadow-sm border border-white border-opacity-30`}>
          <div className="text-xs text-gray-500 mb-1">Program</div>
          <div className="text-sm font-medium truncate">{programName}</div>
        </div>
      </div>
      
      {completionPercentage > 0 && (
        <div className={`p-3 rounded-lg bg-white bg-opacity-90 shadow-sm border border-white border-opacity-30 mb-3`}>
          <div className="flex justify-between text-xs mb-2">
            <span className="font-medium">Production Progress</span>
            <span className="font-semibold">{machine.totalCount}/{machine.targetCount}</span>
          </div>
          <Progress 
            percent={completionPercentage} 
            size="small" 
            status={machine.status === 'PRODUCTION' ? 'active' : machine.status === 'ERROR' ? 'exception' : 'normal'}
            strokeColor={{
              '0%': `var(--ant-${statusInfo.color}-4)`,
              '100%': `var(--ant-${statusInfo.color}-6)`,
            }}
            trailColor={`var(--ant-${statusInfo.color}-1)`}
            strokeWidth={8}
            className="custom-progress"
          />
          <div className="text-xs text-right mt-1 text-gray-500">
            {completionPercentage}% Complete
          </div>
        </div>
      )}
      
      <div className={`flex justify-end items-center mt-2 text-xs text-white px-3`}>
        
      <div className="flex items-center">
          <ClockCircleOutlined className="mr-1.5" />
          {new Date(machine.lastUpdated || machine.last_updated).toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};



// Function to get status color for 2D layout
const getStatusColor = (status) => {
  switch(status) {
    case 'PRODUCTION': return 'green';
    case 'ON': return 'orange';
    case 'IDLE': return 'blue';
    case 'SETUP': return 'purple';
    case 'ERROR': return 'red';
    case 'MAINTENANCE': return 'indigo';
    case 'OFF': default: return 'gray';
  }
};



// Main Dashboard Component
const SupervisorDashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const { Title } = Typography;
  const { initializeWebSocket, cleanup, getMappedMachineData, isConnected, error, fetchOEEData } = useDashboardStore();

  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket();
    return () => cleanup();
  }, []);

  // Fetch OEE data when a machine is selected
  useEffect(() => {
    if (selectedMachine?.id) {
      fetchOEEData(selectedMachine.id);
    }
  }, [selectedMachine]);

  // Get the mapped machine data and categorize it
  const machines = getMappedMachineData().map((machine, index) => {
    // Assign machine types based on naming convention or other attributes
    let type = 'milling';
    
    if (machine.name?.toLowerCase().includes('turn') || 
        machine.partDescription?.toLowerCase().includes('lathe') ||
        index % 3 === 0) {
      type = 'turning';
    } else if (machine.name?.toLowerCase().includes('edm') || 
               machine.name?.toLowerCase().includes('wire') ||
               index % 7 === 6) {
      type = 'edm';
    }
    
    return {
      ...machine,
      type
    };
  });

  // Filter machines based on status and search text
  const filteredMachines = machines.filter(machine => {
    const matchesStatus = filterStatus === 'all' || machine.status === filterStatus;
    const matchesSearch = !searchText || 
      machine.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      machine.partNumber?.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group machines by status for statistics
  const machineStats = machines.reduce((stats, machine) => {
    stats[machine.status] = (stats[machine.status] || 0) + 1;
    return stats;
  }, {});

  // Handle machine selection
  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    setDrawerVisible(true);
  };

  // Calculate overall statistics
  const totalMachines = machines.length;
  const productionMachines = machineStats['PRODUCTION'] || 0;
  const idleMachines = machineStats['ON'] || 0;  // Changed from 'IDLE' to 'ON' to match the actual status in the data
  const errorMachines = machineStats['ERROR'] || 0;
  const offMachines = machineStats['OFF'] || 0;
  const maintenanceMachines = machineStats['MAINTENANCE'] || 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 bg-fixed">
      {/* Header with stats */}
      <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-indigo-100">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <div className="flex items-center">
            
                <Lottie 
                  animationData={shopAnimation}
                  style={{ width: 55, height: 55 }}
                  loop={true}
                  autoplay={true}
                />
              
              <div>
                <h1 className="text-2xl font-bold m-0 text-gray-800">Shopfloor-View</h1>
                <p className="text-sm text-indigo-600 m-0">Real-time machine monitoring system</p>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="flex items-center justify-end gap-3">
              <Input 
                placeholder="Search machines..." 
                prefix={<SearchOutlined className="text-indigo-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-xl shadow-inner shadow-indigo-100 border-indigo-200 hover:border-indigo-300 focus:border-indigo-400 focus:shadow-indigo-200"
                style={{ transition: 'all 0.3s ease' }}
              />
              <Dropdown
                overlay={
                  <Menu onClick={(e) => setFilterStatus(e.key)} className="rounded-xl shadow-lg p-1">
                    <Menu.Item key="all" icon={<AppstoreOutlined style={{ color: '#4f46e5' }} />} className="rounded-lg">
                      <span className="font-medium">All Machines</span>
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="PRODUCTION" icon={<CheckCircleOutlined style={{ color: '#10b981' }} />} className="rounded-lg">
                      <span className="font-medium">Production</span>
                    </Menu.Item>
                    <Menu.Item key="ON" icon={<ClockCircleOutlined style={{ color: '#d97706' }} />} className="rounded-lg">
                      <span className="font-medium">Idle</span>
                    </Menu.Item>
                   
                    <Menu.Item key="OFF" icon={<PoweroffOutlined style={{ color: '#cc3929' }} />} className="rounded-lg">
                      <span className="font-medium">Offline</span>
                    </Menu.Item>
                  </Menu>
                }
                trigger={['click']}
              >
                <Button 
                  icon={<FilterOutlined />} 
                  className={`rounded-xl ${filterStatus !== 'all' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : ''} hover:shadow-md transition-all duration-300`}
                >
                  <span className="font-medium">{filterStatus === 'all' ? 'All Statuses' : filterStatus}</span>
                </Button>
              </Dropdown>
            </div>
          </Col>
        </Row>

        <Row gutter={[24, 24]} className="mt-6">
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card 
              className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              style={{ backgroundColor: '#f8fafc' }}
              bodyStyle={{ padding: '20px', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
                <DesktopOutlined className="text-7xl text-indigo-600" />
              </div>
              <Statistic 
                title={<span className="text-indigo-800 font-medium text-base flex items-center gap-2">
                  <DesktopOutlined className="text-indigo-600" /> Total Machines
                </span>} 
                value={totalMachines} 
                valueStyle={{ color: '#4338ca', fontWeight: 700, fontSize: '28px' }}
                suffix={<span className="text-xs text-indigo-400 ml-1">Machines</span>}
              />
             
              
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card 
              className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              style={{ backgroundColor: '#0c8844' }}
              bodyStyle={{ padding: '20px', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
                <CheckCircleOutlined className="text-7xl text-white" />
              </div>
              <Statistic 
                title={<span className="text-white font-medium text-base flex items-center gap-2">
                  <CheckCircleOutlined className="text-white" /> In Production
                </span>} 
                value={productionMachines} 
                valueStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '28px' }}
                suffix={<span className="text-xs text-white opacity-80 ml-1">Machines</span>}
              />
            
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card 
              className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              style={{ backgroundColor: '#ebb625' }}
              bodyStyle={{ padding: '20px', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
                <ClockCircleOutlined className="text-7xl text-white" />
              </div>
              <Statistic 
                title={<span className="text-white font-medium text-base flex items-center gap-2">
                  <ClockCircleOutlined className="text-white" /> Idle
                </span>} 
                value={idleMachines} 
                valueStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '28px' }}
                suffix={<span className="text-xs text-white opacity-80 ml-1">Machines</span>}
              />
              
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card 
              className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              style={{ backgroundColor: '#A9A9A9' }}
              bodyStyle={{ padding: '20px', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
                <PoweroffOutlined className="text-7xl text-white" />
              </div>
              <Statistic 
                title={<span className="text-white font-medium text-base flex items-center gap-2">
                  <PoweroffOutlined className="text-white" /> Offline
                </span>} 
                value={offMachines} 
                valueStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '28px' }}
                suffix={<span className="text-xs text-white opacity-80 ml-1">Machines</span>}
              />
             
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden px-6">
        {error && (
          <Alert 
            message="Connection Error" 
            description={error} 
            type="error" 
            showIcon 
            className="mb-6 shadow-md rounded-xl border-rose-200"
          />
        )}

        {!isConnected && !error && (
          <Alert 
            message="Connecting to production data..." 
            type="info" 
            showIcon 
            className="mb-6 shadow-md rounded-xl border-indigo-200 bg-indigo-50"
          />
        )}

        {/* Machine Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 overflow-y-auto pb-8 pt-2">
          {filteredMachines.length > 0 ? (
            filteredMachines.map(machine => (
              <div 
                key={machine.id} 
                onClick={() => handleMachineSelect(machine)}
                className="transform transition-all duration-300 hover:translate-y-[-4px] cursor-pointer"
              >
                <ModernMachineCard 
                  machine={machine} 
                  isSelected={selectedMachine?.id === machine.id}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full py-12">
              <Empty 
                description={
                  <span className="text-gray-500 text-lg">
                    {searchText ? 'No machines match your search criteria' : 'No machines available at the moment'}
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="opacity-80"
              />
              {searchText && (
                <div className="mt-4 flex justify-center">
                  <Button 
                    type="default" 
                    onClick={() => setSearchText('')} 
                    icon={<FilterOutlined />}
                    className="rounded-xl shadow-sm border-indigo-200 hover:border-indigo-400 hover:shadow-md"
                  >
                    Clear search filter
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Machine Details Drawer with enhanced styling */}
      <Drawer 
        title={
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedMachine ? getStatusInfo(selectedMachine.status).iconBg : 'bg-indigo-600'} shadow-md`}>
              {selectedMachine ? getStatusInfo(selectedMachine.status).icon : <DesktopOutlined />}
            </div>
            <div>
              <span className="text-lg font-bold">
                {selectedMachine?.name?.toUpperCase() || 'MACHINE DETAILS'}
              </span>
              {selectedMachine && (
                <div className="flex items-center mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${selectedMachine.status === 'PRODUCTION' ? 'bg-emerald-500 animate-pulse' : selectedMachine.status === 'ON' ? 'bg-amber-500' : 'bg-slate-500'} mr-1.5`}></div>
                  <span className="text-xs text-gray-500">
                    {selectedMachine.status} • Last updated: {new Date(selectedMachine.lastUpdated || selectedMachine.last_updated).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        }
        placement="right"
        closable={true}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={520}
        className="custom-drawer"
        bodyStyle={{ padding: '20px', backgroundColor: '#f8fafc' }}
        headerStyle={{ 
          borderBottom: '1px solid #e2e8f0', 
          padding: '20px 24px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        maskStyle={{ backdropFilter: 'blur(3px)', backgroundColor: 'rgba(15, 23, 42, 0.3)' }}
      >
        {selectedMachine && <MachineDetails selectedMachine={selectedMachine} />}
      </Drawer>
    </div>
  );
};

// Update the Machine Details section with improved UI
// Enhanced Machine Details component with improved UI and UX
const MachineDetails = ({ selectedMachine, onZoomToMachine, show3DControls = true }) => {
  const { fetchOEEData, oeeData } = useDashboardStore();

  useEffect(() => {
    if (selectedMachine?.id) {
      fetchOEEData(selectedMachine.id);
    }
  }, [selectedMachine?.id]);

  if (!selectedMachine) {
    return (
      <Card className="h-full">
        <Empty description="No machine selected" />
      </Card>
    );
  }

  // Format the last updated time
  const formatDateTime = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      
      return date.toLocaleString(undefined, options);
    } catch (error) {
      return 'Date error';
    }
  };

  // Calculate completion percentage
  const completionPercentage = 
    selectedMachine.targetCount > 0 
      ? Math.round((selectedMachine.totalCount / selectedMachine.targetCount) * 100) 
      : 0;

  const statusInfo = getStatusInfo(selectedMachine.status);

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <span className={`font-semibold ${statusInfo.textColor}`}>{selectedMachine.name}</span>
          {show3DControls && (
            <Tooltip title="Focus on this machine">
              <Button 
                type="primary" 
                size="small" 
                icon={<FullscreenOutlined />} 
                onClick={onZoomToMachine}
                className={`bg-${statusInfo.color}-600 hover:bg-${statusInfo.color}-700 border-none shadow-md`}
              />
            </Tooltip>
          )}
        </div>
      }
      className="h-full rounded-xl overflow-hidden shadow-md"
      bodyStyle={{ height: 'calc(100% - 57px)', padding: '20px', overflow: 'auto' }}
      headStyle={{ backgroundColor: `var(--ant-${statusInfo.color}-1)` }}
      extra={
        <Tag 
          className={`rounded-full px-3 py-0.5 border-${statusInfo.color}-400 text-${statusInfo.color}-700 bg-${statusInfo.color}-50 font-medium`}
        >
          {selectedMachine.status}
        </Tag>
      }
    >
      <div className="space-y-4">
        {/* OEE Components with enhanced visuals */}
        {oeeData && (
          <Card 
            size="small"
            title={
              <span className="text-sm font-semibold text-gray-700 flex items-center">
                <DashboardOutlined className="mr-2 text-indigo-600" />
                OEE Analysis
              </span>
            }
            className="shadow-md rounded-xl overflow-hidden border-0"
            style={{ backgroundColor: '#f8fafc' }}
            bodyStyle={{ padding: '16px' }}
            headStyle={{ borderBottom: '1px solid rgba(139, 92, 246, 0.2)', backgroundColor: '#f5f3ff' }}
          >
            <div className="grid grid-cols-3 gap-4 p-2">
              <div className="text-center bg-white p-3 rounded-xl shadow-sm">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_availability || 0}
                  width={90}
                  strokeColor={{
                    '0%': '#818cf8',
                    '100%': '#4f46e5'
                  }}
                  format={percent => (
                    <span style={{ fontSize: '1rem', color: '#4338ca', fontWeight: 600 }}>
                      {percent.toFixed(1)}%
                    </span>
                  )}
                />
                <div className="text-sm mt-2 font-medium text-indigo-700">Availability</div>
              </div>
              <div className="text-center bg-white p-3 rounded-xl shadow-sm">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_performance || 0}
                  width={90}
                  strokeColor={{
                    '0%': '#34d399',
                    '100%': '#10b981'
                  }}
                  format={percent => (
                    <span style={{ fontSize: '1rem', color: '#047857', fontWeight: 600 }}>
                      {percent.toFixed(1)}%
                    </span>
                  )}
                />
                <div className="text-sm mt-2 font-medium text-emerald-700">Performance</div>
              </div>
              <div className="text-center bg-white p-3 rounded-xl shadow-sm">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_quality || 0}
                  width={90}
                  strokeColor={{
                    '0%': '#c084fc',
                    '100%': '#8b5cf6'
                  }}
                  format={percent => (
                    <span style={{ fontSize: '1rem', color: '#7e22ce', fontWeight: 600 }}>
                      {percent.toFixed(1)}%
                    </span>
                  )}
                />
                <div className="text-sm mt-2 font-medium text-purple-700">Quality</div>
              </div>
            </div>
          </Card>
        )}

        {/* Program and Part Details with enhanced style */}
        <Collapse 
          defaultActiveKey={['1']} 
          ghost
          className="bg-white shadow-md rounded-xl overflow-hidden mt-4 border-0"
        >
          <Collapse.Panel 
            header={
              <span className="text-sm font-semibold text-gray-700 flex items-center">
                <CodeSandboxOutlined className="mr-2 text-sky-600" />
                Program & Part Details
              </span>
            } 
            key="1"
            className="border-b border-sky-100"
          >
            <div className="grid grid-cols-2 gap-4 text-sm p-2">
              <div className="p-3 bg-white rounded-lg shadow-sm border border-sky-200">
                <div className="text-sky-500 mb-1 flex items-center">
                  <RocketOutlined className="mr-1.5" /> Program Number
                </div>
                <div className="font-semibold text-sky-900">{selectedMachine.currentProgram || 'N/A'}</div>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border border-emerald-200">
                <div className="text-emerald-500 mb-1 flex items-center">
                  <BarcodeOutlined className="mr-1.5" /> Part Number
                </div>
                <div className="font-semibold text-emerald-900">{selectedMachine.partNumber || 'N/A'}</div>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border border-amber-200">
                <div className="text-amber-500 mb-1 flex items-center">
                  <AppstoreOutlined className="mr-1.5" /> Operation Number
                </div>
                <div className="font-semibold text-amber-900">{selectedMachine.operationNumber || 'N/A'}</div>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border border-purple-200">
                <div className="text-purple-500 mb-1 flex items-center">
                  <FileTextOutlined className="mr-1.5" /> Production Order
                </div>
                <div className="font-semibold text-purple-900">{selectedMachine.productionOrder || 'N/A'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">Part Description</div>
                <div className="font-medium">{selectedMachine.partDescription || 'N/A'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">Operation Description</div>
                <div className="font-medium">{selectedMachine.operationDescription || 'N/A'}</div>
              </div>
            </div>
          </Collapse.Panel>
        </Collapse>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 flex items-center justify-end mt-2">
          <ClockCircleOutlined className="mr-1" />
          Last updated: {formatDateTime(selectedMachine.lastUpdated || selectedMachine.last_updated)}
        </div>
      </div>
    </Card>
  );
};

export default SupervisorDashboard;