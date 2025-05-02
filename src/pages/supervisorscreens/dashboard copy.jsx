import React, { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag, Empty, Alert, Button, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, DashboardOutlined, CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, MonitorOutlined, FileTextOutlined, ProjectOutlined, EyeOutlined, EyeInvisibleOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Grid, Box, Environment, PerspectiveCamera, useGLTF, Text, Plane, GizmoHelper, GizmoViewport, useHelper, SpotLight, BakeShadows, Sky, Stars, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Steps } from 'antd';
import useDashboardStore from '../../store/dashboard';
import { Vector3, BoxHelper, SpotLightHelper, DirectionalLightHelper } from 'three';
import * as TWEEN from '@tweenjs/tween.js';

const { TabPane } = Tabs;
const { Panel } = Collapse;

// Enhanced machine data with improved positioning
const machineData = [
  // Production Line A (South facing machines)
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo linear',
    status: 'running',
    oee: 87,
    currentProgram: 'OP-1234',
    partNumber: 'PART-789',
    totalCount: 145,
    targetCount: 200,
    operator: 'John Doe',
    startTime: '08:00 AM',
    estimatedCompletion: '04:30 PM',
    cycleTime: '45 min',
    downtime: '2%',
    position: [-30, 1, -15],  // Positioned on Line A
    rotation: [0, Math.PI, 0], // Facing south
    scale: 2.5,
    dimensions: [4, 3, 3], // Width, height, depth
  },
  {
    id: 'DMG-002',
    name: 'VMC-001',
    status: 'idle',
    oee: 65,
    currentProgram: 'OP-5678',
    partNumber: 'PART-123',
    totalCount: 90,
    targetCount: 150,
    operator: 'Jane Smith',
    startTime: '09:00 AM',
    estimatedCompletion: '05:00 PM',
    cycleTime: '30 min',
    downtime: '5%',
    position: [-15, 1, -15],  // Positioned on Line A
    rotation: [0, Math.PI, 0], // Facing south
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  {
    id: 'DMG-003',
    name: 'Haas VF-2',
    status: 'running',
    oee: 92,
    currentProgram: 'OP-9012',
    partNumber: 'PART-456',
    totalCount: 180,
    targetCount: 200,
    operator: 'Mike Johnson',
    startTime: '07:30 AM',
    estimatedCompletion: '03:45 PM',
    cycleTime: '40 min',
    downtime: '1%',
    position: [0, 1, -15],  // Positioned on Line A
    rotation: [0, Math.PI, 0], // Facing south
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  {
    id: 'DMG-004',
    name: 'Mazak Variaxis',
    status: 'idle',
    oee: 70,
    currentProgram: 'OP-3456',
    partNumber: 'PART-987',
    totalCount: 110,
    targetCount: 150,
    operator: 'Sarah Lee',
    startTime: '10:00 AM',
    estimatedCompletion: '06:00 PM',
    cycleTime: '35 min',
    downtime: '4%',
    position: [15, 1, -15],  // Positioned on Line A
    rotation: [0, Math.PI, 0], // Facing south
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  {
    id: 'DMG-005',
    name: 'Doosan Puma',
    status: 'running',
    oee: 85,
    currentProgram: 'OP-2345',
    partNumber: 'PART-567',
    totalCount: 135,
    targetCount: 180,
    operator: 'Alex Rodriguez',
    startTime: '08:15 AM',
    estimatedCompletion: '04:45 PM',
    cycleTime: '38 min',
    downtime: '3%',
    position: [30, 1, -15],  // Positioned on Line A
    rotation: [0, Math.PI, 0], // Facing south
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  
  // Production Line B (North facing machines)
  {
    id: 'DMG-006',
    name: 'Haas VF-3',
    status: 'running',
    oee: 92,
    currentProgram: 'OP-9012',
    partNumber: 'PART-456',
    totalCount: 180,
    targetCount: 200,
    operator: 'Mike Johnson',
    startTime: '07:30 AM',
    estimatedCompletion: '03:45 PM',
    cycleTime: '40 min',
    downtime: '1%',
    position: [-30, 1, 15],  // Positioned on Line B
    rotation: [0, 0, 0], // Facing north
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  {
    id: 'DMG-07',
    name: 'Mazak Variaxis Pro',
    status: 'idle',
    oee: 70,
    currentProgram: 'OP-3456',
    partNumber: 'PART-987',
    totalCount: 110,
    targetCount: 150,
    operator: 'Sarah Lee',
    startTime: '10:00 AM',
    estimatedCompletion: '06:00 PM',
    cycleTime: '35 min',
    downtime: '4%',
    position: [-15, 1, 15],  // Positioned on Line B
    rotation: [0, 0, 0], // Facing north
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  {
    id: 'DMG-08',
    name: 'Okuma MB-4000H',
    status: 'running',
    oee: 88,
    currentProgram: 'OP-7890',
    partNumber: 'PART-234',
    totalCount: 165,
    targetCount: 200,
    operator: 'David Kim',
    startTime: '08:15 AM',
    estimatedCompletion: '04:45 PM',
    cycleTime: '42 min',
    downtime: '3%',
    position: [0, 1, 15],  // Positioned on Line B
    rotation: [0, 0, 0], // Facing north
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  {
    id: 'DMG-09',
    name: 'DMG CTX 310 ecoline',
    status: 'idle',
    oee: 62,
    currentProgram: 'OP-5432',
    partNumber: 'PART-678',
    totalCount: 85,
    targetCount: 140,
    operator: 'Emily Wong',
    startTime: '09:30 AM',
    estimatedCompletion: '05:30 PM',
    cycleTime: '38 min',
    downtime: '6%',
    position: [15, 1, 15],  // Positioned on Line B
    rotation: [0, 0, 0], // Facing north
    scale: 2.5,
    dimensions: [4, 3, 3],
  },
  {
    id: 'DMG-010',
    name: 'Doosan Puma CNC',
    status: 'running',
    oee: 85,
    currentProgram: 'OP-2345',
    partNumber: 'PART-567',
    totalCount: 135,
    targetCount: 180,
    operator: 'Alex Rodriguez',
    startTime: '08:15 AM',
    estimatedCompletion: '04:45 PM',
    cycleTime: '38 min',
    downtime: '3%',
    position: [30, 1, 15],  // Positioned on Line B
    rotation: [0, 0, 0],  // Facing north
    scale: 2.5,
    dimensions: [4, 3, 3],
  }
];

// Enhanced Machine Model Component
const MachineModel = ({ position, rotation, status, onClick, isSelected, scale = 1, ...props }) => {
  const { scene } = useGLTF('/machine.glb');
  const groupRef = useRef();
  const glowMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    emissive: status === 'PRODUCTION' ? '#00ff00' : status === 'ON' ? '#ffa500' : '#555',
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.9
  }), [status]);
  
  // Selection indicator
  const [hovered, setHovered] = useState(false);
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Create a custom copy of the material to avoid shared materials
        child.material = child.material.clone();
      }
    });
    return clone;
  }, [scene]);

  // Animate machine parts when in production
  useFrame((state) => {
    if (status === 'PRODUCTION' && clonedScene) {
      clonedScene.traverse((child) => {
        if (child.name.includes('rotor') || child.name.includes('spindle')) {
          child.rotation.y += 0.015;
        }
      });
    }
    
    // Make the selected machine "breathe" slightly
    if (groupRef.current && isSelected) {
      const breathingValue = (Math.sin(state.clock.getElapsedTime() * 2) + 1) * 0.05;
      groupRef.current.position.y = position[1] + breathingValue;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON':
        return new THREE.Color(0xffa500); // Orange for ON
      case 'PRODUCTION':
        return new THREE.Color(0x00ff00); // Green for PRODUCTION
      case 'OFF':
        return new THREE.Color(0x808080); // Grey for OFF
      default:
        return new THREE.Color(0x808080); // Grey for unknown status
    }
  };

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        // Set the machine body color based on status
        if (!child.name.includes('status_light')) {
          const statusColor = getStatusColor(status);
          child.material.color = statusColor;
          
          // Add metallic and glossy effect
          child.material.metalness = 0.7;
          child.material.roughness = 0.3;
          
          // Add outline effect when selected or hovered
          if (isSelected || hovered) {
            child.material.emissive = new THREE.Color(0x3333ff);
            child.material.emissiveIntensity = 0.2;
          } else {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
        
        // Handle status light separately
        if (child.name.includes('status_light')) {
          switch (status) {
            case 'ON':
              child.material.emissive.setHex(0xffa500); // Orange for ON
              child.material.emissiveIntensity = 1.5;
              break;
            case 'PRODUCTION':
              child.material.emissive.setHex(0x00ff00); // Green for PRODUCTION
              child.material.emissiveIntensity = 1.5;
              break;
            case 'OFF':
              child.material.emissive.setHex(0x808080); // Grey for OFF
              child.material.emissiveIntensity = 0.5;
              break;
          }
        }
      }
    });
  }, [status, clonedScene, isSelected, hovered]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ON':
        return 'warning'; // Yellow/Orange for ON
      case 'PRODUCTION':
        return 'success'; // Green for PRODUCTION
      case 'OFF':
        return 'default'; // Grey for OFF
      default:
        return 'default';
    }
  };

  // Calculate completion percentage
  const completionPercentage = props.totalCount && props.targetCount 
    ? Math.min(Math.round((props.totalCount / props.targetCount) * 100), 100)
    : 0;

  return (
    <group 
      ref={groupRef}
      position={position} 
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive 
        object={clonedScene} 
        scale={[scale, scale, scale]} 
        castShadow 
        receiveShadow
      />
      
      {/* Floor highlight circle when selected */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[scale * 1.2, scale * 1.5, 32]} />
          <meshBasicMaterial color="#3366ff" transparent opacity={0.4} />
        </mesh>
      )}
      
      {/* Hover highlight circle */}
      {hovered && !isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[scale * 1.2, scale * 1.5, 32]} />
          <meshBasicMaterial color="#aaaaff" transparent opacity={0.2} />
        </mesh>
      )}
      
      {/* Always show machine name and status */}
      <Html position={[0, 5, 0]} distanceFactor={15} zIndexRange={[100, 0]}>
        <div className={`bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border ${isSelected ? 'border-blue-500' : 'border-gray-200'} w-48 text-center transform -translate-x-1/2`}>
          <div className="text-sm font-bold mb-1">{props.name}</div>
          <Badge 
            status={getStatusBadgeColor(status)}
            text={status}
          />
          <div className="mt-1 text-xs">
            Program: {props.currentProgram || 'N/A'}
          </div>
          
          {/* Show completion progress bar */}
          <div className="mt-1">
            <div className="flex justify-between text-xs">
              <span>Parts: {props.totalCount}/{props.targetCount}</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress 
              percent={completionPercentage} 
              size="small" 
              showInfo={false}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        </div>
      </Html>
      
      {/* Status indicator beam */}
      {status !== 'OFF' && (
        <spotLight
          position={[0, 6, 0]}
          angle={0.5}
          penumbra={0.5}
          intensity={0.6}
          color={status === 'PRODUCTION' ? '#00ff00' : '#ffa500'}
          distance={10}
          castShadow={false}
        />
      )}
    </group>
  );
};


// Enhanced factory floor environment
const ShopFloor = ({ data, onSelectMachine, selectedMachineId, ...props }) => {
  const groupRef = useRef();
  const [floorDimensions, setFloorDimensions] = useState({ width: 100, height: 50, depth: 100 });
  
  useEffect(() => {
    // Calculate floor dimensions based on machine positions
    if (data && data.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      data.forEach(machine => {
        const x = machine.position ? machine.position[0] : 0;
        const z = machine.position ? machine.position[2] : 0;
        
        minX = Math.min(minX, x - 10);
        maxX = Math.max(maxX, x + 10);
        minZ = Math.min(minZ, z - 10);
        maxZ = Math.max(maxZ, z + 10);
      });
      
      const width = Math.max(100, maxX - minX + 50);
      const depth = Math.max(100, maxZ - minZ + 50);
      
      setFloorDimensions({ width, height: 50, depth });
    }
  }, [data]);

  return (
    <group ref={groupRef}>
      {/* Reflective floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[floorDimensions.width, floorDimensions.depth]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={15}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#050505"
          metalness={0.6}
          roughness={1}
        />
      </mesh>
      
      {/* Grid for reference */}
      <Grid
        position={[0, 0.01, 0]}
        args={[floorDimensions.width, floorDimensions.depth]}
        cellSize={5}
        cellThickness={0.6}
        cellColor="#6f6f6f"
        sectionSize={20}
        sectionThickness={1.2}
        sectionColor="#9d4b4b"
        fadeDistance={floorDimensions.width}
        fadeStrength={1}
      />
      
      {/* Directional light for shadows */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={0.1}
        shadow-camera-far={500}
      />
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      
      {/* Spot lights at corners */}
      <spotLight position={[floorDimensions.width/4, 50, floorDimensions.depth/4]} intensity={0.3} color="#fff" castShadow />
      <spotLight position={[-floorDimensions.width/4, 50, floorDimensions.depth/4]} intensity={0.3} color="#fff" castShadow />
      <spotLight position={[floorDimensions.width/4, 50, -floorDimensions.depth/4]} intensity={0.3} color="#fff" castShadow />
      <spotLight position={[-floorDimensions.width/4, 50, -floorDimensions.depth/4]} intensity={0.3} color="#fff" castShadow />
      
      {/* Machines */}
      {data && data.map((machine, index) => (
        <MachineModel
          key={machine.id}
          position={machine.position || [index * 25 - 50, 0, 0]}
          rotation={machine.rotation || [0, 0, 0]}
          status={machine.status || 'OFF'}
          onClick={() => onSelectMachine(machine.id)}
          isSelected={machine.id === selectedMachineId}
          name={machine.name}
          scale={1.5}
          currentProgram={machine.programNumber}
          totalCount={machine.totalCount}
          targetCount={machine.targetCount}
        />
      ))}
    </group>
  );
};


// Machine Component with improved visualization
const Machine = ({ data, onClick, isSelected }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#52c41a';
      case 'idle': return '#faad14';
      case 'down': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  return (
    <group
      position={data.position}
      rotation={data.rotation}
      onClick={onClick}
    >
      <Box args={data.dimensions}>
        <meshStandardMaterial 
          color={getStatusColor(data.status)}
          opacity={0.8}
          transparent
          metalness={0.6}
          roughness={0.2}
        />
      </Box>
      
      <Html position={[0, data.dimensions[1] + 0.5, 0]} center>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontWeight: 'bold' }}>{data.name}</div>
          <Badge 
            status={data.status === 'running' ? 'success' : data.status === 'idle' ? 'warning' : 'error'}
            text={`${data.status.toUpperCase()} - OEE: ${data.oee}%`}
          />
        </div>
      </Html>
    </group>
  );
};



// Sparkline Options (kept from original)
const getSparklineOption = (data, color, type = 'line') => ({
  animation: false,
  grid: { left: 2, right: 2, top: 2, bottom: 2 },
  xAxis: { type: 'category', show: false, boundaryGap: false },
  yAxis: { type: 'value', show: false, min: Math.min(...data) * 0.9, max: Math.max(...data) * 1.1 },
  series: [
    {
      data,
      type,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: type === 'line' ? { color, opacity: 0.2 } : undefined,
    },
  ],
  tooltip: { show: false },
});

// Machine Activity Simulation component
const MachineActivitySimulation = ({ machines }) => {
  // Simplified implementation that does nothing to avoid errors
  return null;
};

// Factory Camera Controls component
const FactoryCameraControls = ({ selectedMachine, viewMode = '3d' }) => {
  const { camera } = useThree();
  const controls = useRef();
  
  // Define camera presets
  const cameraPresets = {
    overhead: { position: [0, 40, 0], target: [0, 0, 0] },
    lineA: { position: [-10, 15, -30], target: [0, 0, -15] },
    lineB: { position: [-10, 15, 30], target: [0, 0, 15] },
    corner: { position: [-40, 25, -40], target: [0, 0, 0] },
    default: { position: [-20, 20, 20], target: [0, 0, 0] },
    topDown: { position: [0, 50, 0], target: [0, 0, 0] }
  };
  
  // Handle view mode change
  useEffect(() => {
    if (controls.current) {
      if (viewMode === 'top-down') {
        moveToPreset('topDown');
      } else {
        moveToPreset('default');
      }
    }
  }, [viewMode]);
  
  const moveToPreset = (preset) => {
    const { position, target } = cameraPresets[preset];
    
    // Directly set position and target without animation since TWEEN is causing issues
    camera.position.set(...position);
    if (controls.current) {
      controls.current.target.set(...target);
    }
  };
  
  // Focus on selected machine
  useEffect(() => {
    if (selectedMachine && controls.current) {
      const machineIndex = machineData.findIndex(m => m.id === selectedMachine.id);
      if (machineIndex >= 0) {
        const machinePos = machineData[machineIndex].position;
        
        // Calculate camera position offset from machine
        const offset = viewMode === 'top-down'
          ? new THREE.Vector3(machinePos[0], 50, machinePos[2])
          : new THREE.Vector3(machinePos[0] - 8, machinePos[1] + 10, machinePos[2] - 8);
        
        // Set camera position directly
        camera.position.copy(offset);
        
        // Set the controls target to the machine position
        controls.current.target.set(...machinePos);
      }
    }
  }, [selectedMachine, camera, viewMode]);
  
  return (
    <>
      <OrbitControls
        ref={controls}
        target={[0, 0, 0]}
        maxPolarAngle={viewMode === 'top-down' ? Math.PI / 2.5 : Math.PI / 2.1}
        minDistance={8}
        maxDistance={60}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      {/* Camera control UI */}
      <Html position={[-48, 1, -38]} zIndexRange={[100, 0]}>
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md">
          <div className="text-xs font-bold mb-1">Camera Views</div>
          <div className="flex flex-col gap-1">
            <Button size="small" onClick={() => moveToPreset('overhead')} icon={<EyeOutlined />}>Overhead</Button>
            <Button size="small" onClick={() => moveToPreset('lineA')} icon={<EyeOutlined />}>Line A</Button>
            <Button size="small" onClick={() => moveToPreset('lineB')} icon={<EyeOutlined />}>Line B</Button>
            <Button size="small" onClick={() => moveToPreset('corner')} icon={<EyeOutlined />}>Corner</Button>
            <Button size="small" onClick={() => moveToPreset('default')} icon={<ReloadOutlined />}>Reset</Button>
          </div>
        </div>
      </Html>
    </>
  );
};

// Main Dashboard Component
const SupervisorDashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const { initializeWebSocket, cleanup, getMappedMachineData, isConnected, error } = useDashboardStore();
  const [showEffects, setShowEffects] = useState(false);
  const [viewMode, setViewMode] = useState('3d'); // '3d' or 'top-down'
  const [localMachines, setLocalMachines] = useState(machineData);
  
  // Initialize WebSocket connection
  useEffect(() => {
    try {
      initializeWebSocket();
    } catch (err) {
      console.error("Error initializing WebSocket:", err);
    }
    
    return () => {
      try {
        cleanup();
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
    };
  }, []);

  // Get the mapped machine data with fallback
  useEffect(() => {
    try {
      const mappedData = getMappedMachineData();
      // If data is available from API, use it, otherwise fall back to static data
      if (mappedData && Array.isArray(mappedData) && mappedData.length > 0) {
        setLocalMachines(mappedData);
      } else {
        console.log("getMappedMachineData: Using fallback data");
        setLocalMachines(machineData);
      }
    } catch (err) {
      console.error("Error getting mapped machine data:", err);
      setLocalMachines(machineData);
    }
  }, [getMappedMachineData]);

  const { TabPane } = Tabs;
  const { Panel } = Collapse;

  return (
    <div className="p-6 h-screen bg-gray-100 flex flex-col">
      {/* Header with controls */}
      <Row gutter={16} className="mb-4">
        <Col span={16}>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold mb-0">Factory Dashboard</h1>
            <div className="flex gap-2">
              <Tooltip title="Toggle view mode">
                <Button 
                  icon={viewMode === '3d' ? <MonitorOutlined /> : <BarChartOutlined />} 
                  onClick={() => setViewMode(viewMode === '3d' ? 'top-down' : '3d')}
                >
                  {viewMode === '3d' ? "Top-Down View" : "3D View"}
                </Button>
              </Tooltip>
              
              <Tooltip title="Connection Status">
                <Button 
                  type={isConnected ? "default" : "primary"} 
                  danger={!!error}
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    cleanup();
                    initializeWebSocket();
                  }}
                >
                  {error ? "Reconnect" : isConnected ? "Connected" : "Connecting..."}
                </Button>
              </Tooltip>
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div className="text-right">
            <span className="text-lg font-medium mr-2">Machine Status:</span>
            <Tag color="success" className="text-md">{localMachines.filter(m => m.status === 'PRODUCTION').length} Running</Tag>
            <Tag color="warning" className="text-md">{localMachines.filter(m => m.status === 'ON').length} Idle</Tag>
            <Tag color="default" className="text-md">{localMachines.filter(m => m.status === 'OFF').length} Off</Tag>
          </div>
        </Col>
      </Row>
      
      {/* Connection Status Alerts */}
      {error && (
        <Alert
          message="Connection Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" danger onClick={() => {
              cleanup();
              initializeWebSocket();
            }}>
              Retry
            </Button>
          }
        />
      )}
      {!isConnected && !error && (
        <Alert
          message="Connecting..."
          description="Attempting to connect to machine monitoring system..."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Main Content Area */}
      <Row gutter={16} className="flex-1">
        {/* Machine Overview */}
        <Col span={16}>
          <Card 
            title={
              <div className="flex justify-between items-center">
                <span>Factory Overview</span>
                <span className="text-sm">
                  {selectedMachine ? (
                    <span>
                      Selected: <Tag color="blue">{selectedMachine.name}</Tag>
                    </span>
                  ) : (
                    <span className="text-gray-400">No machine selected</span>
                  )}
                </span>
              </div>
            }
            style={{ height: 'calc(100vh - 220px)' }}
            bodyStyle={{ 
              padding: 0, 
              height: 'calc(100vh - 275px)',
              position: 'relative'
            }}
            extra={
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {isConnected ? (
                    <>
                      <Badge status="processing" color="green" /> Live Data
                    </>
                  ) : (
                    <>
                      <Badge status="processing" color="red" /> Disconnected
                    </>
                  )}
                </span>
              </div>
            }
          >
            <Canvas
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
              shadows
              camera={{ 
                position: viewMode === '3d' ? [-20, 20, 20] : [0, 50, 0],
                fov: viewMode === '3d' ? 45 : 30,
                near: 0.1,
                far: 1000
              }}
              gl={{ 
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2
              }}
              onClick={() => setSelectedMachine(null)}
            >
              <color attach="background" args={['#f0f5ff']} />
              
              <Suspense fallback={null}>
                <ShopFloor
                  data={localMachines}
                  onSelectMachine={(id) => setSelectedMachine(localMachines.find(m => m.id === id))}
                  selectedMachineId={selectedMachine?.id}
                />
                
                {/* Comment out problematic components */}
                {/* <MachineActivitySimulation machines={localMachines} /> */}
                
                {/* Remove visual effects */}
                {/* {showEffects && <FactoryVisualEffects />} */}
                
                {/* Add basic lighting for scene visibility */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={0.5} />
                
                <BakeShadows />
              </Suspense>
              
              <FactoryCameraControls 
                selectedMachine={selectedMachine}
                viewMode={viewMode}
              />
              
              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport labelColor="white" axisHeadScale={1} />
              </GizmoHelper>
            </Canvas>
          </Card>
        </Col>

        {/* Machine Details */}
        <Col span={8}>
          <MachineDetails selectedMachine={selectedMachine || (localMachines.length > 0 ? localMachines[0] : null)} />
        </Col>
      </Row>
    </div>
  );
};

// Update the Machine Details section
const MachineDetails = ({ selectedMachine }) => {
  const { fetchOEEData, oeeData } = useDashboardStore();

  useEffect(() => {
    if (selectedMachine?.id) {
      fetchOEEData(selectedMachine.id);
    }
  }, [selectedMachine?.id]);

  if (!selectedMachine) {
    return (
      <Card className="h-full flex items-center justify-center" bodyStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 220px)' }}>
        <Empty 
          description={
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600 mb-2">No machine selected</div>
              <p className="text-gray-400">Click on any machine in the factory view to see its details</p>
            </div>
          } 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      </Card>
    );
  }

  // Format the last updated time
  const formatDateTime = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      // Parse the ISO date string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format the date and time in a user-friendly way
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
      console.error('Error formatting date:', error, dateString);
      return 'Date error';
    }
  };

  // Get the appropriate color for the status badge
  const getStatusColor = (status) => {
    switch (status) {
      case 'PRODUCTION':
        return 'success';
      case 'ON':
        return 'warning';
      case 'OFF':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg font-medium">{selectedMachine.machine_name || selectedMachine.name}</span>
            <Tag color={getStatusColor(selectedMachine.status)} className="ml-2">
              {selectedMachine.status}
            </Tag>
          </div>
          <Tag color="blue">ID: {selectedMachine.id}</Tag>
        </div>
      }
      className="h-full"
      bodyStyle={{ 
        height: 'calc(100vh - 220px)', 
        padding: '12px', 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* OEE Metrics Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-blue-900 flex items-center">
            <DashboardOutlined className="mr-2 text-blue-600" />
            OEE Performance
          </span>
          <span className="text-xs text-gray-600 bg-white/50 px-2 py-0.5 rounded">
            {oeeData ? 'Last 7 days' : 'Loading...'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Main OEE */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <Progress
              type="dashboard"
              percent={oeeData?.average_oee || 0}
              width={80}
              strokeWidth={10}
              strokeColor={{
                '0%': '#ff4d4f',
                '40%': '#faad14',
                '70%': '#52c41a',
                '100%': '#1890ff',
              }}
            />
            <div className="text-center mt-1">
              <div className="text-lg font-bold">{oeeData?.average_oee || 0}%</div>
              <div className="text-xs text-gray-600">Overall OEE</div>
            </div>
          </div>

          {/* OEE Components */}
          <div className="col-span-3 grid grid-cols-3 gap-2">
            <div className="bg-white p-2 rounded-lg shadow-sm text-center">
              <Progress
                type="dashboard"
                percent={oeeData?.average_availability || 0}
                width={60}
                strokeWidth={8}
                strokeColor="#1890ff"
              />
              <div className="mt-1">
                <div className="font-semibold">{oeeData?.average_availability || 0}%</div>
                <div className="text-xs text-gray-600">Availability</div>
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm text-center">
              <Progress
                type="dashboard"
                percent={oeeData?.average_performance || 0}
                width={60}
                strokeWidth={8}
                strokeColor="#52c41a"
              />
              <div className="mt-1">
                <div className="font-semibold">{oeeData?.average_performance || 0}%</div>
                <div className="text-xs text-gray-600">Performance</div>
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm text-center">
              <Progress
                type="dashboard"
                percent={oeeData?.average_quality || 0}
                width={60}
                strokeWidth={8}
                strokeColor="#722ed1"
              />
              <div className="mt-1">
                <div className="font-semibold">{oeeData?.average_quality || 0}%</div>
                <div className="text-xs text-gray-600">Quality</div>
              </div>
            </div>
          </div>
        </div>

        {/* Losses Analysis */}
        <div className="bg-white p-2 rounded-lg shadow-sm mt-3">
          <div className="text-sm font-semibold mb-2">Loss Analysis</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Availability Loss</span>
                <span className="font-medium text-blue-600">
                  {oeeData?.losses?.availability_loss || 0}%
                </span>
              </div>
              <Progress
                percent={oeeData?.losses?.availability_loss || 0}
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#69c0ff',
                }}
                showInfo={false}
                size="small"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Performance Loss</span>
                <span className="font-medium text-green-600">
                  {oeeData?.losses?.performance_loss || 0}%
                </span>
              </div>
              <Progress
                percent={oeeData?.losses?.performance_loss || 0}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#95de64',
                }}
                showInfo={false}
                size="small"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Quality Loss</span>
                <span className="font-medium text-purple-600">
                  {oeeData?.losses?.quality_loss || 0}%
                </span>
              </div>
              <Progress
                percent={oeeData?.losses?.quality_loss || 0}
                strokeColor={{
                  '0%': '#722ed1',
                  '100%': '#b37feb',
                }}
                showInfo={false}
                size="small"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Machine Info Tabs */}
      <Tabs defaultActiveKey="1" className="flex-1" size="small">
        <TabPane 
          tab={
            <span className="flex items-center">
              <CodeSandboxOutlined className="mr-1" />
              Program
            </span>
          } 
          key="1"
        >
          <Card size="small" className="w-full">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="text-xs text-gray-500">Program Number</div>
                <div className="font-medium">{selectedMachine.program_number || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Active Program</div>
                <div className="font-medium">{selectedMachine.active_program || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Selected Program</div>
                <div className="font-medium">{selectedMachine.selected_program || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Production Order</div>
                <div className="font-medium">{selectedMachine.productionOrder || 'N/A'}</div>
              </div>
            </div>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span className="flex items-center">
              <BarcodeOutlined className="mr-1" />
              Part
            </span>
          } 
          key="2"
        >
          <Card size="small" className="w-full">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="text-xs text-gray-500">Part Number</div>
                <div className="font-medium">{selectedMachine.part_number || selectedMachine.partNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Part Description</div>
                <div className="font-medium truncate">{selectedMachine.part_description || selectedMachine.partDescription || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Required Quantity</div>
                <div className="font-medium">{selectedMachine.required_quantity || selectedMachine.targetCount || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Launched Quantity</div>
                <div className="font-medium">{selectedMachine.launched_quantity || selectedMachine.totalCount || 'N/A'}</div>
              </div>
            </div>
            
            {/* Progress visualization */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Production Progress</span>
                <span>
                  {selectedMachine.totalCount || 0}/{selectedMachine.targetCount || 0}
                </span>
              </div>
              <Progress 
                percent={selectedMachine.targetCount ? Math.min(Math.round((selectedMachine.totalCount / selectedMachine.targetCount) * 100), 100) : 0}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                size="small"
              />
            </div>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span className="flex items-center">
              <ToolOutlined className="mr-1" />
              Operation
            </span>
          } 
          key="3"
        >
          <Card size="small" className="w-full">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="text-xs text-gray-500">Operation Number</div>
                <div className="font-medium">{selectedMachine.operation_number || selectedMachine.operationNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Operation Description</div>
                <div className="font-medium truncate">{selectedMachine.operation_description || selectedMachine.operationDescription || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Machine Status</div>
                <div className="font-medium flex items-center">
                  <Badge status={getStatusColor(selectedMachine.status)} />
                  {selectedMachine.status || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Last Updated</div>
                <div className="font-medium text-xs">
                  {formatDateTime(selectedMachine.lastUpdated || selectedMachine.last_updated)}
                  <Badge color="blue" className="ml-1">Live</Badge>
                </div>
              </div>
            </div>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span className="flex items-center">
              <BarChartOutlined className="mr-1" />
              Analytics
            </span>
          } 
          key="4"
        >
          <Card size="small" className="w-full">
            <div className="text-center text-gray-500 py-2">
              {oeeData ? (
                <div>
                  <h4 className="font-medium mb-3">Performance Trends</h4>
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                          type: 'shadow'
                        }
                      },
                      grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                      },
                      xAxis: {
                        type: 'category',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      },
                      yAxis: {
                        type: 'value',
                        max: 100
                      },
                      series: [
                        {
                          name: 'OEE',
                          type: 'line',
                          data: [
                            Math.round(Math.random() * 20 + 70),
                            Math.round(Math.random() * 20 + 70),
                            Math.round(Math.random() * 20 + 70),
                            Math.round(Math.random() * 20 + 70),
                            Math.round(Math.random() * 20 + 70),
                            Math.round(Math.random() * 20 + 70),
                            oeeData.average_oee
                          ],
                          itemStyle: {
                            color: '#1890ff'
                          }
                        }
                      ]
                    }}
                    style={{ height: 200 }}
                  />
                </div>
              ) : (
                <Empty description="No analytics data available" />
              )}
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </Card>
  );
};

// Helper function for priority colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 1:
      return 'red';
    case 2:
      return 'orange';
    case 3:
      return 'yellow';
    case 4:
      return 'blue';
    case 5:
      return 'green';
    default:
      return 'default';
  }
};

export default SupervisorDashboard;