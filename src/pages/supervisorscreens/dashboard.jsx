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

// Import machine images
import dmu60Image from '/images/CNCM-DMU-60.png';
import dmu50Image from '/images/CNCM-DMU-50new.png';
import dmu60MBImage from '/images/CNCM-DMU-60MB 5 AXIS.png';
import vmc800Image from '/images/VMC_800.png';
import robofilImage from '/images/MMC1-ROBOFIL 240.png';
import robofillImage2 from '/images/MMC1U32J.png'
import dmu60EvoImage from '/images/dmu-60-evo-linear-product-picture.png';

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

// Add custom CSS for enhanced animations
const customStyles = `
  .scale-102 {
    transform: scale(1.02);
  }
  
  .hover\\:scale-102:hover {
    transform: scale(1.02);
  }
  
  .hover\\:rotate-1:hover {
    transform: rotate(1deg);
  }
  
  .animate-ping {
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  
  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
  
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }
  
  .drop-shadow-lg {
    filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));
  }
  
  .drop-shadow-sm {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.05)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.1));
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

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
  const idleMachines = statusCounts['ON'] || 0;
  const errorMachines = statusCounts['OFF'] || 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Enhanced Stats Panel - Top */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-4 border border-gray-200/50">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-sm font-medium">Total Machines</div>
                <div className="text-3xl font-bold">{totalMachines}</div>
              </div>
              <DesktopOutlined className="text-2xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-sm font-medium">In Production</div>
                <div className="text-3xl font-bold">{activeMachines}</div>
              </div>
              <CheckCircleOutlined className="text-2xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-100 text-sm font-medium">Idle/Setup</div>
                <div className="text-3xl font-bold">{idleMachines}</div>
              </div>
              <ClockCircleOutlined className="text-2xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-sm font-medium">Off</div>
                <div className="text-3xl font-bold">{errorMachines}</div>
              </div>
              <WarningOutlined className="text-2xl opacity-80" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - fills remaining height */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Factory Layout - Full Width */}
        <div className="col-span-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 flex flex-col border border-gray-200/50">
          <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
            <CompassOutlined className="mr-2 text-blue-600" />
            Factory Layout Overview
          </h3>
          <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {/* EDM Room - Top (Larger) */}
            {/* <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-r from-purple-100 to-purple-200 border-b-2 border-purple-300 flex flex-col">
              <div className="text-sm font-bold text-purple-800 p-3 bg-purple-50/50 backdrop-blur-sm border-b border-purple-200">
                <ProjectOutlined className="mr-2" />
                EDM Area
              </div>
              <div className="flex-1 flex items-center justify-center gap-x-2 ">
                {machinesByType.edm.slice(0, 4).map((machine) => (
                  <EnhancedMachineCard 
                    key={machine.id} 
                    machine={machine} 
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => onMachineSelect(machine)}
                    compact={true}
                    mini={true}
                  />
                ))}
              </div>
            </div> */}
            
            {/* Center Aisle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-3 bg-gradient-to-b from-gray-300 to-gray-400 shadow-lg"></div>
            
            {/* Turning Machines - Left Side */}
            <div className="absolute top-0 left-2 bottom-2 w-[48%] flex flex-col">
              <div className="text-xl font-bold text-blue-800 mb-1 text-center bg-blue-50/80 backdrop-blur-sm rounded-lg p-1 border border-blue-200">
                <ToolOutlined className="mr-1" />
                Turning Section
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 p-1 auto-rows-max">
                {machinesByType.turning.slice(0, 8).map((machine) => (
                  <EnhancedMachineCard 
                    key={machine.id} 
                    machine={machine} 
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => onMachineSelect(machine)}
                    compact={true}
                    mini={true}
                  />
                ))}
              </div>
            </div>
            
            {/* Milling Machines - Right Side */}
            <div className="absolute top-0 right-2 bottom-2 w-[48%] flex flex-col">
              <div className="text-xl font-bold text-green-800 mb-1 text-center bg-green-50/80 backdrop-blur-sm rounded-lg p-1 border border-green-200">
                <AppstoreOutlined className="mr-1" />
                Milling Section
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 p-1 auto-rows-max">
                {machinesByType.milling.slice(0, 8).map((machine) => (
                  <EnhancedMachineCard 
                    key={machine.id} 
                    machine={machine} 
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => onMachineSelect(machine)}
                    compact={true}
                    mini={true}
                  />
                ))}
              </div>
            </div>

            <div className="absolute top-[600px] left-0 right-0 h-1/3 bg-gradient-to-r from-purple-100 to-purple-200 border-b-2 border-purple-300 flex flex-col">
              <div className="text-xl text-center font-bold text-purple-800 p-3 bg-purple-50/50 backdrop-blur-sm border-b border-purple-200">
                <ProjectOutlined className="mr-2" />
                EDM Area
              </div>
              <div className="flex-1 flex items-center justify-center gap-x-2 ">
                {machinesByType.edm.slice(0, 4).map((machine) => (
                  <EnhancedMachineCard 
                    key={machine.id} 
                    machine={machine} 
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => onMachineSelect(machine)}
                    compact={true}
                    mini={true}
                  />
                ))}
              </div>
            </div>
            
            {/* Floor Label */}
            {/* <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-200">
              Main Shop Floor
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced machine card component with images and better design
const EnhancedMachineCard = ({ machine, isSelected, onSelect, compact = false, mini = false }) => {
  // Get machine image based on mapping or fallback
  const getMachineImage = (machine) => {
    if (machine.imageOverride) return machine.imageOverride;
    const name = machine.name?.toLowerCase() || '';
    if (name.includes('dmu') || name.includes('cnc')) {
      if (name.includes('60')) return dmu60Image;
      if (name.includes('50')) return dmu50Image;
      return dmu60MBImage;
    } else if (name.includes('vmc') || name.includes('milling')) {
      return vmc800Image;
    } else if (name.includes('edm') || name.includes('robo') || name.includes('wire')) {
      return robofillImage2;
    } else if (name.includes('turn') || name.includes('lathe')) {
      return dmu60EvoImage;
    } else {
      switch(machine.type) {
        case 'turning': return dmu60EvoImage;
        case 'milling': return vmc800Image;
        case 'edm': return robofillImage2;
        default: return vmc800Image;
      }
    }
  };

  // Get status styling and background color
  const getStatusStyling = (status) => {
    switch(status) {
      case 'PRODUCTION':
        return {
          bg: 'bg-gradient-to-br from-green-400 to-green-600',
          border: 'border-green-400',
          text: 'text-green-900',
          badge: 'bg-green-500',
        };
      case 'ON':
        return {
          bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
          border: 'border-yellow-400',
          text: 'text-yellow-900',
          badge: 'bg-yellow-500',
        };
      case 'IDLE':
        return {
          bg: 'bg-gradient-to-br from-blue-300 to-blue-500',
          border: 'border-blue-400',
          text: 'text-blue-900',
          badge: 'bg-blue-500',
        };
      case 'SETUP':
        return {
          bg: 'bg-gradient-to-br from-purple-300 to-purple-500',
          border: 'border-purple-400',
          text: 'text-purple-900',
          badge: 'bg-purple-500',
        };
      case 'ERROR':
        return {
          bg: 'bg-gradient-to-br from-red-400 to-red-600',
          border: 'border-red-400',
          text: 'text-red-900',
          badge: 'bg-red-500',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-gradient-to-br from-indigo-300 to-indigo-500',
          border: 'border-indigo-400',
          text: 'text-indigo-900',
          badge: 'bg-indigo-500',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-200 to-gray-400',
          border: 'border-gray-300',
          text: 'text-gray-800',
          badge: 'bg-gray-400',
        };
    }
  };

  // Helper to trim workcenter prefixes from machine name
  const getDisplayName = (name) => {
    if (!name) return '';
    return name.replace(/^(CNCM|CNCT|MMC1)[-_\s]*/i, '');
  };

  const statusStyle = getStatusStyling(machine.status);
  const machineImage = getMachineImage(machine);

  // --- Modern Responsive Card UI ---
  if (mini) {
    return (
      <div 
        className={`relative rounded-2xl overflow-hidden shadow-lg transform transition-all duration-300 cursor-pointer group border-2 ${statusStyle.border} ${statusStyle.bg} ${isSelected ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105 hover:shadow-2xl'}`}
        onClick={onSelect}
        style={{ minWidth: 90, minHeight: 110, maxWidth: 150, width: '100%' }}
      >
        {/* Image with overlay */}
        <div className="relative w-full h-14 flex items-center justify-center bg-white/30">
          <img src={machineImage} alt={machine.name} className="object-contain h-10 w-auto mx-auto drop-shadow-lg" style={{ filter: 'contrast(1.1) saturate(1.2)' }} />
          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow ${statusStyle.badge}`}>{machine.status}</div>
        </div>
        {/* Content */}
        <div className="p-1 flex flex-col gap-0.5">
          <div className={`font-bold text-xs truncate flex items-center gap-1 ${statusStyle.text}`}> 
            {getDisplayName(machine.name)}
            <span className="ml-1 px-1 py-0.5 rounded bg-white/60 text-gray-700 text-[8px] font-semibold uppercase border border-gray-200">{machine.workcenter}</span>
          </div>
          <div className="flex justify-between text-[9px] font-medium">
            <span className="capitalize">{machine.type}</span>
            <span className="text-gray-700">{machine.currentProgram || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-[8px] text-gray-700">
            <span>Part:</span>
            <span className="font-semibold text-gray-900">{machine.partNumber || 'N/A'}</span>
          </div>
        </div>
        {/* Selection Indicator */}
        {isSelected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className={`relative rounded-xl overflow-hidden shadow-lg transform transition-all duration-500 cursor-pointer group
          ${isSelected ? 'ring-4 ring-blue-500 scale-105 shadow-2xl' : 'hover:scale-105 hover:shadow-2xl hover:rotate-1'}
          ${statusStyle.bg} ${statusStyle.border} border-2 backdrop-blur-sm`}
        onClick={onSelect}
      >
        {/* Machine Image Background */}
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
          <img 
            src={machineImage} 
            alt={machine.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Content */}
        <div className="relative p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm truncate max-w-[70%] text-white drop-shadow-lg">
              {getDisplayName(machine.name)}
            </div>
            <div className={`w-3 h-3 rounded-full ${statusStyle.shadow} shadow-lg animate-pulse`}></div>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="opacity-90 text-white/90">Program:</span>
              <span className="font-medium truncate max-w-[60%] text-white drop-shadow-sm">{machine.currentProgram || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-90 text-white/90">Part:</span>
              <span className="font-medium truncate max-w-[60%] text-white drop-shadow-sm">{machine.partNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-90 text-white/90">Order:</span>
              <span className="font-medium truncate max-w-[60%] text-white drop-shadow-sm">{machine.productionOrder || 'N/A'}</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="mt-3 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusStyle.text} bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
              {machine.status}
            </span>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className={`absolute inset-0 rounded-xl ${statusStyle.glow} opacity-0 transition-opacity duration-300 ${isSelected ? 'opacity-40' : 'group-hover:opacity-20'}`}></div>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
        )}
      </div>
    );
  }

  // Full size card
  return (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-xl transform transition-all duration-500 cursor-pointer group
        ${isSelected ? 'ring-4 ring-blue-500 scale-105 shadow-2xl' : 'hover:scale-105 hover:shadow-2xl'}
        bg-white border-2 ${statusStyle.border} backdrop-blur-sm`}
      onClick={onSelect}
    >
      {/* Machine Image */}
      <div className="h-32 relative overflow-hidden">
        <img 
          src={machineImage} 
          alt={machine.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.className = 'h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center';
            e.target.parentElement.innerHTML = '<DesktopOutlined className="text-4xl text-gray-400" />';
          }}
        />
        <div className={`absolute top-2 right-2 ${statusStyle.bg} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          {machine.status}
        </div>
        
        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="font-bold text-lg mb-3 text-gray-800 truncate group-hover:text-blue-600 transition-colors duration-300">
          {machine.name}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center group/item">
            <span className="text-gray-600 group-hover/item:text-gray-800 transition-colors duration-300">Program Number:</span>
            <span className="font-medium text-gray-800 truncate max-w-[60%] group-hover/item:text-blue-600 transition-colors duration-300">{machine.currentProgram || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center group/item">
            <span className="text-gray-600 group-hover/item:text-gray-800 transition-colors duration-300">Part Number:</span>
            <span className="font-medium text-gray-800 truncate max-w-[60%] group-hover/item:text-blue-600 transition-colors duration-300">{machine.partNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center group/item">
            <span className="text-gray-600 group-hover/item:text-gray-800 transition-colors duration-300">Order Number:</span>
            <span className="font-medium text-gray-800 truncate max-w-[60%] group-hover/item:text-blue-600 transition-colors duration-300">{machine.productionOrder || 'N/A'}</span>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-center">
          <div className={`w-4 h-4 rounded-full ${statusStyle.shadow} shadow-lg mr-2 animate-pulse`}></div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-300">{machine.status}</span>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-xl ${statusStyle.glow} opacity-0 transition-opacity duration-300 ${isSelected ? 'opacity-20' : 'group-hover:opacity-10'}`}></div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
      )}
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
    // Assign machine types based on naming convention
    let type = 'milling'; // default type
    
    const machineName = machine.name || '';
    
    // EDM machines - check for Robofil or U32J
    if (
      machineName.includes('Robofil') ||
      machineName.includes('U32J') ||
      machineName.startsWith('NEWC-') ||
      (machine.workcenter && machine.workcenter.toUpperCase() === 'NEWC')
    ) {
      type = 'edm';
    }
    // Turning machines - check for SCH, CNCT-TUR26, CNCT-Pilatus, CNCT-NU7B
    else if (machineName.includes('SCH') || 
             machineName.includes('CNCT-TUR26') ||
             machineName.includes('CNCT-Pilatus') ||
             machineName.includes('CNCT-NU7B') ||
             machineName.toLowerCase().includes('turn') || 
             machine.partDescription?.toLowerCase().includes('lathe')) {
      type = 'turning';
    }
    // Milling machines - check for DMU
    else if (machineName.includes('DMU')) {
      type = 'milling';
    }
    // Additional checks for other patterns
    else if (machineName.toLowerCase().includes('edm') || 
             machineName.toLowerCase().includes('wire')) {
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
    // { label: <Tooltip title="Top Down"><BorderHorizontalOutlined /></Tooltip>, value: 'topDown' },
    // { label: <Tooltip title="First Person"><CompassOutlined /></Tooltip>, value: 'firstPerson' },
    // { label: <Tooltip title="Turning Section"><ToolOutlined /></Tooltip>, value: 'turningSection' },
    // { label: <Tooltip title="Milling Section"><AppstoreOutlined /></Tooltip>, value: 'millingSection' },
    // { label: <Tooltip title="EDM Room"><ProjectOutlined /></Tooltip>, value: 'edmRoom' },
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
      <div className="flex flex-row gap-4 h-[calc(100vh-160px)]">
        {/* Factory Layout Section */}
        <div className="flex-[2_1_0%] min-w-0 flex flex-col">
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
              overflow: 'auto',
              minHeight: 400
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
        </div>
        {/* Machine Details Section */}
        <div className="flex-[1_1_0%] min-w-[320px] max-w-[400px]">
          <MachineDetails 
            selectedMachine={selectedMachine || (machines.length > 0 ? machines[0] : null)} 
            onZoomToMachine={() => {
              if (selectedMachine && !renderError && use3DView) {
                setCameraView('focusMachine');
              }
            }}
            show3DControls={use3DView && !renderError}
          />
        </div>
      </div>
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
          {/* {show3DControls && (
            <Tooltip title="Focus on this machine">
              <Button 
                type="primary" 
                size="small" 
                icon={<FullscreenOutlined />} 
                onClick={onZoomToMachine}
              />
            </Tooltip>
          )} */}
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
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {oeeData.average_availability ? Number(oeeData.average_availability.toFixed(2)) : 0}%
                </div>
                <div className="text-xs text-gray-600">Availability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {oeeData.average_performance ? Number(oeeData.average_performance.toFixed(2)) : 0}%
                </div>
                <div className="text-xs text-gray-600">Performance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {oeeData.average_quality ? Number(oeeData.average_quality.toFixed(2)) : 0}%
                </div>
                <div className="text-xs text-gray-600">Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {oeeData.average_oee ? Number(oeeData.average_oee.toFixed(2)) : 0}%
                </div>
                <div className="text-xs text-gray-600">Overall OEE</div>
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
                <Tooltip title={selectedMachine.currentProgram || 'N/A'}>
                  <div className="font-medium truncate max-w-[120px] cursor-pointer">
                    {selectedMachine.currentProgram && selectedMachine.currentProgram.length > 12
                      ? selectedMachine.currentProgram.slice(0, 12) + '...'
                      : selectedMachine.currentProgram || 'N/A'}
                  </div>
                </Tooltip>
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

function getMachineWorkcenterType(machine) {
  const machineNameLower = machine.name?.toLowerCase();
  const machineModelLower = machine.model?.toLowerCase();

  // 1. Prioritize mapping based on machine.name prefixes (most explicit user request)
  if (machineNameLower) {
    if (machineNameLower.startsWith('mmc1-')) {
      return { workcenter: 'MMC1', type: 'edm', image: robofillImage2 }; // Assuming robofilImage for MMC1 by default
    }
    if (machineNameLower.startsWith('cncm-')) {
      // Find a specific model match for CNCM if possible, otherwise default to milling
      const foundInMap = MACHINE_WORKCENTER_MAP.find(m =>
        m.workcenter === 'CNCM' && machineNameLower.includes(m.model?.toLowerCase())
      );
      if (foundInMap) return { workcenter: foundInMap.workcenter, type: foundInMap.type, image: foundInMap.image };
      return { workcenter: 'CNCM', type: 'milling', image: dmu60Image }; // Default CNCM image
    }
    if (machineNameLower.startsWith('cnct-')) {
      // Find a specific model match for CNCT if possible, otherwise default to turning
      const foundInMap = MACHINE_WORKCENTER_MAP.find(m =>
        m.workcenter === 'CNCT' && machineNameLower.includes(m.model?.toLowerCase())
      );
      if (foundInMap) return { workcenter: foundInMap.workcenter, type: foundInMap.type, image: foundInMap.image };
      return { workcenter: 'CNCT', type: 'turning', image: dmu60EvoImage }; // Default CNCT image
    }
  }

  // 2. Fallback to general MACHINE_WORKCENTER_MAP lookup using model or name
  let foundFromMap = MACHINE_WORKCENTER_MAP.find(m =>
    (machineModelLower && m.model && machineModelLower.includes(m.model.toLowerCase())) ||
    (machineNameLower && m.model && machineNameLower.includes(m.model.toLowerCase()))
  );
  if (foundFromMap) {
    return {
      workcenter: foundFromMap.workcenter,
      type: foundFromMap.type,
      image: foundFromMap.image
    };
  }

  // 3. Fallback to generic keyword matching if no specific map entry found
  if (machineNameLower) {
    if (machineNameLower.includes('edm') || machineNameLower.includes('robo') || machineNameLower.includes('wire')) return { workcenter: 'MMC1', type: 'edm' };
    if (machineNameLower.includes('turn') || machineNameLower.includes('lathe')) return { workcenter: 'CNCT', type: 'turning' };
    if (machineNameLower.includes('mill') || machineNameLower.includes('dmu') || machineNameLower.includes('vmc')) return { workcenter: 'CNCM', type: 'milling' };
  }

  // 4. Fallback to workcenter property if it exists and no other match
  if (machine.workcenter) {
    const wc = machine.workcenter.toUpperCase();
    if (wc.includes('MMC1')) return { workcenter: 'MMC1', type: 'edm' };
    if (wc.includes('CNCM')) return { workcenter: 'CNCM', type: 'milling' };
    if (wc.includes('CNCT')) return { workcenter: 'CNCT', type: 'turning' };
  }

  return { workcenter: 'UNKNOWN', type: 'other' };
}

export default SupervisorDashboard;