import React, { useState, Suspense, useEffect, lazy } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag, Empty, Alert, Button, Tooltip, Radio, Spin } from 'antd';
import { 
  ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, 
  CheckCircleOutlined, ToolOutlined, DashboardOutlined, 
  CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, 
  MonitorOutlined, FileTextOutlined, ProjectOutlined, 
  FullscreenOutlined, CompassOutlined, DesktopOutlined,
  AppstoreOutlined, BorderHorizontalOutlined,
  WarningOutlined, ReloadOutlined
} from '@ant-design/icons';
import useDashboardStore from '../../store/dashboard';
import BrowserCompatCheck from '../../components/3d/BrowserCompatCheck';

// Preload fonts to ensure they are available for 3D rendering
const preloadLocalFonts = () => {
  // Create a style element to preload fonts
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/Rubik-VariableFont_wght.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Inter-Italic';
      src: url('/fonts/Rubik-Italic-VariableFont_wght.ttf') format('truetype');
      font-weight: normal;
      font-style: italic;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
  
  // Preload font files
  const fontFiles = [
    '/fonts/Rubik-VariableFont_wght.ttf',
    '/fonts/Rubik-Italic-VariableFont_wght.ttf'
  ];
  
  fontFiles.forEach(fontUrl => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontUrl;
    link.as = 'font';
    link.type = 'font/ttf';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Preload HDR environment maps for offline use
const preloadEnvironmentMaps = () => {
  const hdrFiles = [
    '/machine_shop_02_4k.hdr',
    '/warehouse.hdr'
  ];
  
  hdrFiles.forEach(hdrUrl => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = hdrUrl;
    link.as = 'image';
    document.head.appendChild(link);
  });
};

// Call preload functions
preloadLocalFonts();
preloadEnvironmentMaps();

// Import 3D components with error handling using lazy loading
const FactoryScene = lazy(() => 
  import('../../components/3d/FactoryScene')
    .catch(err => {
      console.error("Error loading 3D scene:", err);
      // Return a module with a default component that shows an error
      return { 
        default: ({ machines, onMachineSelect }) => (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 p-4 rounded-md mb-4 max-w-lg text-center">
              <h3 className="font-bold text-lg mb-2"><WarningOutlined /> 3D View Not Available</h3>
              <p>Failed to load 3D factory visualization. Using simplified view instead.</p>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
            <SimpleMachineList machines={machines} onMachineSelect={onMachineSelect} />
          </div>
        )
      };
    })
);

// Simplified machine list component as fallback when 3D view fails
const SimpleMachineList = ({ machines, onMachineSelect, selectedMachine }) => {
  // Group machines by type for better organization
  const machinesByType = {
    turning: machines.filter(m => m.type === 'turning'),
    milling: machines.filter(m => m.type === 'milling'),
    edm: machines.filter(m => m.type === 'edm')
  };

  // Status count for statistics
  const statusCounts = machines.reduce((counts, machine) => {
    counts[machine.status] = (counts[machine.status] || 0) + 1;
    return counts;
  }, {});

  // Calculate overall statistics
  const totalMachines = machines.length;
  const activeMachines = statusCounts['PRODUCTION'] || 0;
  const idleMachines = statusCounts['IDLE'] || 0;
  const errorMachines = statusCounts['ERROR'] || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Stats Panel - Top */}
      <div className="bg-white rounded-lg shadow p-3 mb-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 flex items-center justify-between">
            <div className="text-blue-800 text-sm font-medium">Total Machines</div>
            <div className="text-blue-600 text-xl font-bold">{totalMachines}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-2 border border-green-100 flex items-center justify-between">
            <div className="text-green-800 text-sm font-medium">In Production</div>
            <div className="text-green-600 text-xl font-bold">{activeMachines}</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-100 flex items-center justify-between">
            <div className="text-yellow-800 text-sm font-medium">Idle/Setup</div>
            <div className="text-yellow-600 text-xl font-bold">{idleMachines}</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-2 border border-red-100 flex items-center justify-between">
            <div className="text-red-800 text-sm font-medium">Errors/Off</div>
            <div className="text-red-600 text-xl font-bold">{errorMachines}</div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - fills remaining height */}
      <div className="flex-1 grid grid-cols-4 gap-3 overflow-hidden">
        {/* Left Column - Shop Floor Visualization */}
        <div className="col-span-2 bg-white rounded-lg shadow p-3 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-2 text-sm">Factory Layout</h3>
          <div className="flex-1 relative bg-blue-50 rounded-lg border border-blue-100 overflow-hidden">
            {/* EDM Room */}
            <div className="absolute top-0 left-0 right-0 h-1/4 bg-purple-50 border-b border-purple-200 flex flex-col">
              <div className="text-xs font-medium text-purple-800 p-1">EDM Area</div>
              <div className="flex-1 flex items-center justify-center gap-x-4">
                {machinesByType.edm.slice(0, 2).map((machine) => {
                  const color = getStatusColor(machine.status);
                  return (
                    <Tooltip key={machine.id} title={`${machine.name} - ${machine.status}`}>
                      <div 
                        onClick={() => onMachineSelect(machine)}
                        className={`w-12 h-8 ${selectedMachine?.id === machine.id ? 'ring-2 ring-blue-500' : ''} cursor-pointer bg-white rounded shadow-sm flex items-center justify-center border-${color}-300 border`}
                      >
                        <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
            
            {/* Center Aisle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-1/4 bottom-0 w-3 bg-gray-200"></div>
            
            {/* Turning Machines - Left Side */}
            <div className="absolute top-1/4 left-2 bottom-2 w-[45%] flex flex-col">
              <div className="text-xs font-medium text-blue-800 mb-1 text-center">Turning</div>
              <div className="flex-1 flex flex-col justify-around">
                {machinesByType.turning.slice(0, 5).map((machine) => {
                  const color = getStatusColor(machine.status);
                  return (
                    <Tooltip key={machine.id} title={`${machine.name} - ${machine.partNumber || 'No Part'}`}>
                      <div 
                        onClick={() => onMachineSelect(machine)}
                        className={`h-8 ${selectedMachine?.id === machine.id ? 'ring-2 ring-blue-500' : ''} cursor-pointer bg-white rounded shadow-sm flex items-center justify-between px-2 border-${color}-300 border`}
                      >
                        <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
                        <span className="text-xs truncate max-w-[70%]">{machine.name}</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
            
            {/* Milling Machines - Right Side */}
            <div className="absolute top-1/4 right-2 bottom-2 w-[45%] flex flex-col">
              <div className="text-xs font-medium text-green-800 mb-1 text-center">Milling</div>
              <div className="flex-1 flex flex-col justify-around">
                {machinesByType.milling.slice(0, 5).map((machine) => {
                  const color = getStatusColor(machine.status);
                  return (
                    <Tooltip key={machine.id} title={`${machine.name} - ${machine.partNumber || 'No Part'}`}>
                      <div 
                        onClick={() => onMachineSelect(machine)}
                        className={`h-8 ${selectedMachine?.id === machine.id ? 'ring-2 ring-blue-500' : ''} cursor-pointer bg-white rounded shadow-sm flex items-center justify-between px-2 border-${color}-300 border`}
                      >
                        <span className="text-xs truncate max-w-[70%]">{machine.name}</span>
                        <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
            
            {/* Floor Label */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              Main Shop Floor
            </div>
          </div>
        </div>
        
        {/* Right Columns - Machine Summary by Type */}
        <div className="col-span-2 grid grid-rows-3 gap-3">
          {/* Turning Machines */}
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="p-2 bg-blue-50 border-b border-blue-100 flex items-center">
              <ToolOutlined className="text-blue-700 mr-2" />
              <h3 className="font-medium text-blue-800 text-sm">Turning Machines</h3>
            </div>
            <div className="flex-1 p-2 grid grid-cols-2 gap-2 auto-rows-max overflow-hidden">
              {machinesByType.turning.slice(0, 4).map((machine) => (
                <CompactMachineCard 
                  key={machine.id} 
                  machine={machine} 
                  isSelected={selectedMachine?.id === machine.id}
                  onSelect={() => onMachineSelect(machine)}
                />
              ))}
            </div>
          </div>
          
          {/* Milling Machines */}
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="p-2 bg-green-50 border-b border-green-100 flex items-center">
              <AppstoreOutlined className="text-green-700 mr-2" />
              <h3 className="font-medium text-green-800 text-sm">Milling Machines</h3>
            </div>
            <div className="flex-1 p-2 grid grid-cols-2 gap-2 auto-rows-max overflow-hidden">
              {machinesByType.milling.slice(0, 4).map((machine) => (
                <CompactMachineCard 
                  key={machine.id} 
                  machine={machine} 
                  isSelected={selectedMachine?.id === machine.id}
                  onSelect={() => onMachineSelect(machine)}
                />
              ))}
            </div>
          </div>
          
          {/* EDM Machines */}
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="p-2 bg-purple-50 border-b border-purple-100 flex items-center">
              <ProjectOutlined className="text-purple-700 mr-2" />
              <h3 className="font-medium text-purple-800 text-sm">EDM Machines</h3>
            </div>
            <div className="flex-1 p-2 grid grid-cols-2 gap-2 auto-rows-max overflow-hidden">
              {machinesByType.edm.slice(0, 4).map((machine) => (
                <CompactMachineCard 
                  key={machine.id} 
                  machine={machine} 
                  isSelected={selectedMachine?.id === machine.id}
                  onSelect={() => onMachineSelect(machine)}
                />
              ))}
              {machinesByType.edm.length === 0 && (
                <div className="col-span-2 flex items-center justify-center p-2 text-gray-500 text-sm">
                  No EDM machines available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version of MachineCard for the 2D view
const CompactMachineCard = ({ machine, isSelected, onSelect }) => {
  // Calculate completion percentage
  const completionPercentage = 
    machine.targetCount > 0 
      ? Math.round((machine.totalCount / machine.targetCount) * 100) 
      : 0;
      
  // Status color mapping
  const statusColor = getStatusColor(machine.status);
  
  return (
    <div 
      className={`border rounded overflow-hidden shadow-sm transition-all cursor-pointer text-xs
        ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
      onClick={onSelect}
    >
      <div className={`flex justify-between items-center p-1 bg-${statusColor}-50 border-b border-${statusColor}-100`}>
        <div className="font-medium truncate max-w-[70%]">{machine.name}</div>
        <Tag color={statusColor} className="text-[10px] py-0 h-5 leading-5">
          {machine.status}
        </Tag>
      </div>
      
      <div className="p-1">
        <div className="flex justify-between items-center">
          <div className="truncate max-w-[70%]" title={machine.partNumber || 'No part'}>
            {machine.partNumber || 'No part'}
          </div>
          <div className="text-right">{machine.totalCount || 0}/{machine.targetCount || 0}</div>
        </div>
        
        <Progress 
          percent={completionPercentage}
          size="small"
          status={
            machine.status === 'PRODUCTION' ? 'active' :
            machine.status === 'ERROR' ? 'exception' :
            completionPercentage >= 100 ? 'success' : 'normal'
          }
          showInfo={false}
          className="mt-1"
        />
      </div>
    </div>
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

// Function to get border color class for machine cards
const getBorderColorClass = (color) => {
  switch(color) {
    case 'green': return 'border border-green-300';
    case 'orange': return 'border border-orange-300';
    case 'blue': return 'border border-blue-300';
    case 'purple': return 'border border-purple-300';
    case 'red': return 'border border-red-300';
    case 'indigo': return 'border border-indigo-300';
    default: return 'border border-gray-300';
  }
};

// Function to get status dot class for machine cards
const getStatusDotClass = (color) => {
  switch(color) {
    case 'green': return 'w-2 h-2 rounded-full bg-green-500';
    case 'orange': return 'w-2 h-2 rounded-full bg-orange-500';
    case 'blue': return 'w-2 h-2 rounded-full bg-blue-500';
    case 'purple': return 'w-2 h-2 rounded-full bg-purple-500';
    case 'red': return 'w-2 h-2 rounded-full bg-red-500';
    case 'indigo': return 'w-2 h-2 rounded-full bg-indigo-500';
    default: return 'w-2 h-2 rounded-full bg-gray-500';
  }
};

// Individual machine card component
const MachineCard = ({ machine, isSelected, onSelect }) => {
  // Calculate completion percentage
  const completionPercentage = 
    machine.targetCount > 0 
      ? Math.round((machine.totalCount / machine.targetCount) * 100) 
      : 0;
      
  // Status color mapping
  const statusColor = getStatusColor(machine.status);
  
  // Get background class based on status
  const getBgClass = () => {
    switch(statusColor) {
      case 'green': return 'bg-green-50 border-b border-green-100';
      case 'orange': return 'bg-orange-50 border-b border-orange-100';
      case 'blue': return 'bg-blue-50 border-b border-blue-100';
      case 'purple': return 'bg-purple-50 border-b border-purple-100';
      case 'red': return 'bg-red-50 border-b border-red-100';
      case 'indigo': return 'bg-indigo-50 border-b border-indigo-100';
      default: return 'bg-gray-50 border-b border-gray-100';
    }
  };
  
  return (
    <div 
      className={`border rounded-lg overflow-hidden shadow-sm transition-all cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
      onClick={onSelect}
    >
      <div className={`p-3 ${getBgClass()} flex justify-between items-center`}>
        <div className="font-medium text-gray-800 truncate">{machine.name}</div>
        <Tag color={statusColor}>{machine.status}</Tag>
      </div>
      
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-xs text-gray-500">Program</div>
            <div className="font-medium truncate">{machine.currentProgram || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Part</div>
            <div className="font-medium truncate">{machine.partNumber || 'N/A'}</div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress 
            percent={completionPercentage}
            size="small"
            status={
              machine.status === 'PRODUCTION' ? 'active' :
              machine.status === 'ERROR' ? 'exception' :
              completionPercentage >= 100 ? 'success' : 'normal'
            }
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <div>Parts: {machine.totalCount || 0}/{machine.targetCount || 0}</div>
          <div>
            <ClockCircleOutlined className="mr-1" />
            {new Date(machine.lastUpdated || machine.last_updated).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const SupervisorDashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [cameraView, setCameraView] = useState('overview');
  const [renderError, setRenderError] = useState(false);
  const [compatibility, setCompatibility] = useState(null);
  const [use3DView, setUse3DView] = useState(true);
  const { initializeWebSocket, cleanup, getMappedMachineData, isConnected, error } = useDashboardStore();

  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket();
    return () => cleanup();
  }, []);

  // Handle compatibility check results
  const handleCompatibilityChange = (compatResult) => {
    console.log('Browser compatibility check result:', compatResult);
    setCompatibility(compatResult);
    
    // If WebGL is not supported, disable 3D view
    if (compatResult.error && !compatResult.webGLSupported) {
      setUse3DView(false);
    }
    
    // Disable 3D view on Firefox with ANGLE renderer until properly fixed
    if (compatResult.isFirefox && compatResult.renderer && compatResult.renderer.includes('ANGLE')) {
      console.warn('Firefox with ANGLE renderer detected, using 2D fallback');
      setUse3DView(false);
    }
  };

  // Load previous view preference
  useEffect(() => {
    const storedViewPref = localStorage.getItem('use3DView');
    if (storedViewPref !== null) {
      setUse3DView(storedViewPref === 'true');
    }
  }, []);

  // Get the mapped machine data and categorize it
  const machines = getMappedMachineData().map((machine, index) => {
    // Assign machine types based on naming convention or other attributes
    // This is just a placeholder logic - adjust according to your actual data
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

  // Handle machine selection
  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    setCameraView('focusMachine');
  };

  // Camera view options
  const cameraViewOptions = [
    { label: <Tooltip title="Overview"><DesktopOutlined /></Tooltip>, value: 'overview' },
    { label: <Tooltip title="Top Down"><BorderHorizontalOutlined /></Tooltip>, value: 'topDown' },
    { label: <Tooltip title="First Person"><CompassOutlined /></Tooltip>, value: 'firstPerson' },
    { label: <Tooltip title="Turning Section"><ToolOutlined /></Tooltip>, value: 'turningSection' },
    { label: <Tooltip title="Milling Section"><AppstoreOutlined /></Tooltip>, value: 'millingSection' },
    { label: <Tooltip title="EDM Room"><ProjectOutlined /></Tooltip>, value: 'edmRoom' },
  ];

  // Handle 3D rendering errors
  const handleRenderError = (err) => {
    console.error("3D Rendering error:", err);
    setRenderError(true);
    setUse3DView(false);
  };

  // Handle view toggle
  const toggleView = (use3D) => {
    setUse3DView(use3D);
    localStorage.setItem('use3DView', use3D.toString());
  };

  return (
    <div className="p-6 h-screen bg-gray-100">
      {/* Browser Compatibility Check */}
      <BrowserCompatCheck onCompatibilityChange={handleCompatibilityChange} />
      
      {/* Connection Status */}
      {error && (
        <Alert
          message="Connection Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      {!isConnected && !error && (
        <Alert
          message="Connecting..."
          description="Attempting to connect to machine monitoring system..."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* Main Content Area */}
      <Row gutter={16} className="h-[calc(100vh-160px)]">
        {/* Factory Overview */}
        <Col span={16}>
          <Card 
            title={
              <div className="flex justify-between items-center">
                <span>Factory Shop Floor</span>
                <div className="flex items-center space-x-2">
                  {compatibility && compatibility.webGLSupported && (
                    <Button.Group>
                      <Button 
                        type={use3DView ? "primary" : "default"} 
                        onClick={() => toggleView(true)}
                        icon={<DesktopOutlined />}
                      >
                        3D View
                      </Button>
                      <Button 
                        type={!use3DView ? "primary" : "default"} 
                        onClick={() => toggleView(false)}
                        icon={<AppstoreOutlined />}
                      >
                        2D View
                      </Button>
                    </Button.Group>
                  )}
                  {use3DView && (
                    <Radio.Group 
                      options={cameraViewOptions} 
                      onChange={(e) => setCameraView(e.target.value)}
                      value={cameraView}
                      optionType="button"
                      buttonStyle="solid"
                      size="small"
                      disabled={renderError || !use3DView}
                    />
                  )}
                </div>
              </div>
            }
            className="h-full"
            bodyStyle={{ 
              padding: 0, 
              height: 'calc(100% - 57px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {!use3DView ? (
              <div className="h-full p-4">
                <SimpleMachineList 
                  machines={machines} 
                  onMachineSelect={handleMachineSelect} 
                  selectedMachine={selectedMachine}
                />
              </div>
            ) : (
              <Suspense fallback={
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <Spin tip="Loading 3D Factory..." />
                </div>
              }>
                <FactoryScene 
                  machines={machines}
                  onMachineSelect={handleMachineSelect}
                  selectedMachine={selectedMachine}
                  cameraView={cameraView}
                  onError={handleRenderError}
                />
              </Suspense>
            )}
          </Card>
        </Col>

        {/* Machine Details */}
        <Col span={8}>
          <MachineDetails 
            selectedMachine={selectedMachine || (machines.length > 0 ? machines[0] : null)} 
            onZoomToMachine={() => {
              if (selectedMachine && !renderError && use3DView) {
                setCameraView('focusMachine');
              }
            }}
            show3DControls={use3DView && !renderError}
          />
        </Col>
      </Row>
    </div>
  );
};

// Update the Machine Details section with improved UI
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

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <span>{selectedMachine.name}</span>
          {show3DControls && (
            <Tooltip title="Focus on this machine">
              <Button 
                type="primary" 
                size="small" 
                icon={<FullscreenOutlined />} 
                onClick={onZoomToMachine}
              />
            </Tooltip>
          )}
        </div>
      }
      className="h-full"
      bodyStyle={{ height: 'calc(100% - 57px)', padding: '16px', overflow: 'auto' }}
      extra={
        <Tag color={
          selectedMachine.status === 'PRODUCTION' ? 'success' : 
          selectedMachine.status === 'ON' ? 'warning' : 
          'default'
        }>
          {selectedMachine.status}
        </Tag>
      }
    >
      <div className="space-y-4">
        {/* OEE Components */}
        {oeeData && (
          <Card 
            size="small"
            title={
              <span className="text-sm font-semibold text-gray-700 flex items-center">
                <DashboardOutlined className="mr-1" />
                OEE Analysis
              </span>
            }
            className="shadow-sm"
            bodyStyle={{ padding: '12px' }}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_availability || 0}
                  width={80}
                  strokeColor="#1890ff"
                />
                <div className="text-xs mt-1">Availability</div>
              </div>
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_performance || 0}
                  width={80}
                  strokeColor="#52c41a"
                />
                <div className="text-xs mt-1">Performance</div>
              </div>
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_quality || 0}
                  width={80}
                  strokeColor="#722ed1"
                />
                <div className="text-xs mt-1">Quality</div>
              </div>
            </div>
          </Card>
        )}

        {/* Program and Part Details */}
        <Collapse 
          defaultActiveKey={['1']} 
          ghost
          className="bg-white shadow-sm rounded-md"
        >
          <Collapse.Panel 
            header={
              <span className="text-sm font-semibold text-gray-700 flex items-center">
                <CodeSandboxOutlined className="mr-2" />
                Program & Part Details
              </span>
            } 
            key="1"
          >
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <div className="text-gray-500">Program Number</div>
                <div className="font-medium">{selectedMachine.currentProgram || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Part Number</div>
                <div className="font-medium">{selectedMachine.partNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Operation Number</div>
                <div className="font-medium">{selectedMachine.operationNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Production Order</div>
                <div className="font-medium">{selectedMachine.productionOrder || 'N/A'}</div>
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