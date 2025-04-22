import React, { useState, Suspense,useEffect  } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag, Empty, Alert } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, DashboardOutlined, CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, MonitorOutlined, FileTextOutlined, ProjectOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid, Box, Environment, PerspectiveCamera,useGLTF  } from '@react-three/drei';
import * as THREE from 'three';
import { Steps } from 'antd';
import useDashboardStore from '../../store/dashboard';

// Enhanced machine data with more detailed positioning
const machineData = [
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
    position: [20, 1, -4],  // Swapped X and Z, adjusted sign
    rotation: [0, 0, 0], // Rotated to face south
    scale: 2.5,
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
    position: [10, 1, -4],  // Swapped X and Z, adjusted sign
    rotation: [0, 0, 0],   // Rotated to face south
    scale: 2.5,
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
    position: [0, 1, -4],  // Swapped X and Z, adjusted sign
    rotation: [0, 0, 0],   // Rotated to face south
    scale: 2.5,
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
    position: [-10, 1, -4],  // Swapped X and Z, adjusted sign
    rotation: [0, 0, 0],   // Rotated to face south
    scale: 2.5,
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
    position: [-20, 1, -4],  // Swapped X and Z, adjusted sign
    rotation: [0, 0, 0],   // Rotated to face south
    scale: 2.5,
  },
  // {
  //   id: 'DMG-006',
  //   name: 'Mori Seiki',
  //   status: 'idle',
  //   oee: 60,
  //   currentProgram: 'OP-6789',
  //   partNumber: 'PART-234',
  //   totalCount: 80,
  //   targetCount: 140,
  //   operator: 'Emma Thompson',
  //   startTime: '09:15 AM',
  //   estimatedCompletion: '05:15 PM',
  //   cycleTime: '32 min',
  //   downtime: '6%',
  //   position: [-30, 1, -4],  // Swapped X and Z, adjusted sign
  //   rotation: [0, 0, 0],   // Rotated to face south
  //   scale: 2.5,
  // },
  // {
  //   id: 'DMG-007',
  //   name: 'Nakamura Tome',
  //   status: 'running',
  //   oee: 90,
  //   currentProgram: 'OP-4567',
  //   partNumber: 'PART-890',
  //   totalCount: 175,
  //   targetCount: 200,
  //   operator: 'Carlos Mendez',
  //   startTime: '07:45 AM',
  //   estimatedCompletion: '04:00 PM',
  //   cycleTime: '42 min',
  //   downtime: '2%',
  //   position: [30, 1, -4],  // Swapped X and Z, adjusted sign
  //   rotation: [0, 0, 0],   // Rotated to face south
  //   scale: 2.5,
  // },
  // {
  //   id: 'DMG-008',
  //   name: 'Citizen Miyano',
  //   status: 'idle',
  //   oee: 68,
  //   currentProgram: 'OP-7890',
  //   partNumber: 'PART-345',
  //   totalCount: 95,
  //   targetCount: 140,
  //   operator: 'Lisa Wong',
  //   startTime: '10:15 AM',
  //   estimatedCompletion: '06:15 PM',
  //   cycleTime: '36 min',
  //   downtime: '5%',
  //   position: [-40, 1, -4],  // Swapped X and Z, adjusted sign
  //   rotation: [0, 0, 0],  // Rotated to face south
  //   scale: 2.5,
  // },
  // Right Side Machines
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
    position: [20, 1, 4],  // Swapped X and Z
    rotation: [0, Math.PI, 0], // Facing north
    scale: 2.5,
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
    position: [10, 1, 4],  // Swapped X and Z
    rotation: [0, Math.PI, 0],// Facing north
    scale: 2.5,
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
    position: [0, 1, 4],  // Swapped X and Z
    rotation: [0, Math.PI, 0],// Facing north
    scale: 2.5,
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
    position: [-10, 1, 4],  // Swapped X and Z
    rotation: [0, Math.PI, 0],// Facing north
    scale: 2.5,
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
    position: [-20, 1, 4],  // Swapped X and Z
    rotation: [0, Math.PI, 0],  // Facing north
    scale: 2.5,
  },
  // {
  //   id: 'DMG-014',
  //   name: 'Mori Seiki Advanced',
  //   status: 'idle',
  //   oee: 60,
  //   currentProgram: 'OP-6789',
  //   partNumber: 'PART-234',
  //   totalCount: 80,
  //   targetCount: 140,
  //   operator: 'Emma Thompson',
  //   startTime: '09:15 AM',
  //   estimatedCompletion: '05:15 PM',
  //   cycleTime: '32 min',
  //   downtime: '6%',
  //   position: [-30, 1, 4],  // Swapped X and Z
  //   rotation: [0, Math.PI, 0], // Facing north
  //   scale: 2.5,
  // },
  // {
  //   id: 'DMG-015',
  //   name: 'Nakamura Tome Pro',
  //   status: 'running',
  //   oee: 90,
  //   currentProgram: 'OP-4567',
  //   partNumber: 'PART-890',
  //   totalCount: 175,
  //   targetCount: 200,
  //   operator: 'Carlos Mendez',
  //   startTime: '07:45 AM',
  //   estimatedCompletion: '04:00 PM',
  //   cycleTime: '42 min',
  //   downtime: '2%',
  //   position: [30, 1, 4],  // Swapped X and Z
  //   rotation: [0, Math.PI, 0],// Facing north
  //   scale: 2.5,
  // },
  // {
  //   id: 'DMG-016',
  //   name: 'Citizen Miyano Advanced',
  //   status: 'idle',
  //   oee: 68,
  //   currentProgram: 'OP-7890',
  //   partNumber: 'PART-345',
  //   totalCount: 95,
  //   targetCount: 140,
  //   operator: 'Lisa Wong',
  //   startTime: '10:15 AM',
  //   estimatedCompletion: '06:15 PM',
  //   cycleTime: '36 min',
  //   downtime: '5%',
  //   position: [-40, 1, 4],  // Swapped X and Z
  //   rotation: [0, Math.PI, 0],  // Facing north
  //   scale: 2.5,
  // }
];

// Machine Model Component
const MachineModel = ({ position, rotation, status, onClick, isSelected, scale = 1, ...props }) => {
  const { scene } = useGLTF('/machine.glb');
  
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useFrame(() => {
    if (status === 'PRODUCTION' && clonedScene) {
      clonedScene.traverse((child) => {
        if (child.name.includes('rotor') || child.name.includes('spindle')) {
          child.rotation.y += 0.01;
        }
      });
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
        child.material = child.material.clone();
        
        // Set the machine body color based on status
        if (!child.name.includes('status_light')) {
          const statusColor = getStatusColor(status);
          child.material.color = statusColor;
          // Add slight metallic and glossy effect
          child.material.metalness = 0.6;
          child.material.roughness = 0.4;
        }
        
        // Handle status light separately
        if (child.name.includes('status_light')) {
          switch (status) {
            case 'ON':
              child.material.emissive.setHex(0xffa500); // Orange for ON
              break;
            case 'PRODUCTION':
              child.material.emissive.setHex(0x00ff00); // Green for PRODUCTION
              break;
            case 'OFF':
              child.material.emissive.setHex(0x808080); // Grey for OFF
              break;
          }
        }
      }
    });
  }, [status, clonedScene]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ON':
        return 'warning'; // Yellow/Orange for ON
      case 'PRODUCTION':
        return 'success'; // Green for PRODUCTION
      case 'OFF':
        return 'default'; // Grey for OFF (changed from 'error' to 'default')
      default:
        return 'default';
    }
  };

  return (
    <group 
      position={position} 
      rotation={rotation}
      onClick={onClick}
    >
      <primitive 
        object={clonedScene} 
        scale={[scale, scale, scale]} 
        castShadow 
        receiveShadow
      />
      {/* Always show machine name and status */}
      <Html position={[0, 5, 0]}>
        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200 w-48 text-center transform -translate-x-1/2">
          <div className="text-sm font-bold mb-1">{props.name}</div>
          <Badge 
            status={getStatusBadgeColor(status)}
            text={status}
          />
          <div className="mt-1 text-xs">
            Program: {props.currentProgram || 'N/A'}
          </div>
          <div className="text-xs">
            Parts: {props.totalCount}/{props.targetCount}
          </div>
        </div>
      </Html>
    </group>
  );
};


// Shop floor environment
const ShopFloor = () => {
  return (
    <>
      <Grid
        args={[50, 50]}
        cellSize={0}
        cellThickness={0}
        // cellColor="#6e6e6e"
        sectionSize={10}
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        position={[0, -0.01, 0]}
      />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.4} />
      </mesh>

      {/* {[1, 2, 3, 4, 5].map((num, i) => (
        <Html key={num} position={[-20 + (i * 10), 0.1, -15]}>
          <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
            {num}
          </div>
        </Html>
      ))} */}
    </>
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

// Main Dashboard Component
const SupervisorDashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const { initializeWebSocket, cleanup, getMappedMachineData, isConnected, error } = useDashboardStore();

  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket();
    return () => cleanup();
  }, []);

  // Get the mapped machine data
  const machines = getMappedMachineData();

  const { TabPane } = Tabs;
  const { Panel } = Collapse;

  return (
    <div style={{ padding: '24px', height: '100vh', background: '#f0f2f5' }}>
      {/* Connection Status */}
      {error && (
        <Alert
          message="Connection Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
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
      <Row gutter={16} style={{ height: 'calc(100vh - 220px)' }}>
        {/* Machine Overview */}
        <Col span={16}>
          <Card 
            title="Machine Overview" 
            bodyStyle={{ 
              padding: 0, 
              height: 'calc(100vh - 200px)',
              position: 'relative'
            }}
          >
            <Canvas
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
              shadows="soft"
              camera={{ 
                position: [-10, 20, 20],
                fov: 45,
                near: 0.1,
                far: 1000
              }}
              gl={{ 
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1
              }}
            >
              <PerspectiveCamera makeDefault position={[-10, 20, 20]} />
              
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[10, 20, 15]} 
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
              />

              <Suspense fallback={null}>
                <ShopFloor />
                {machines.map((machine, index) => {
                  // Use the existing machine positions from machineData
                  const position = machineData[index % machineData.length].position;
                  const rotation = machineData[index % machineData.length].rotation;
                  const scale = machineData[index % machineData.length].scale;

                  return (
                    <MachineModel
                      key={machine.id}
                      {...machine}
                      position={position}
                      rotation={rotation}
                      scale={scale}
                      onClick={() => setSelectedMachine(machine)}
                      isSelected={selectedMachine?.id === machine.id}
                    />
                  );
                })}
                <Environment 
                  files="/PANO_20250320_122016.hdr"
                  background={true}
                  blur={0.5}
                  intensity={0.8}
                  ground={{
                    height: 15,
                    radius: 40,
                    scale: 20
                  }}
                />
              </Suspense>

              <OrbitControls
                target={[0, 0, 0]}
                maxPolarAngle={Math.PI / 2.5}
                minDistance={10}
                maxDistance={50}
                enableDamping={true}
                dampingFactor={0.05}
              />

              <fog attach="fog" args={['#f0f0f0', 30, 100]} />
            </Canvas>
          </Card>
        </Col>

        {/* Machine Details */}
        <Col span={8}>
          <MachineDetails selectedMachine={selectedMachine || (machines.length > 0 ? machines[0] : null)} />
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
      <Card className="h-full">
        <Empty description="No machine selected" />
      </Card>
    );
  }

  // Format the last updated time
  const formatDateTime = (dateString) => {
    console.log('formatDateTime called with:', dateString, 'type:', typeof dateString);
    
    if (!dateString) {
      console.warn('Last updated value is empty or null');
      return 'N/A';
    }
    
    try {
      // Parse the ISO date string
      const date = new Date(dateString);
      console.log('Parsed date object:', date);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date detected:', dateString);
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
      
      const formattedDate = date.toLocaleString(undefined, options);
      console.log('Formatted date:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Date error';
    }
  };
  
  // This is for debugging - remove in production
  console.log('Selected Machine Full Object:', selectedMachine);
  console.log('Last Updated value directly:', selectedMachine.last_updated);
  console.log('Last Updated value (camelCase):', selectedMachine.lastUpdated);
  console.log('Last Updated value type:', typeof selectedMachine.last_updated);
  
  // Check if we can find the property name containing "last" and "update"
  if (selectedMachine) {
    console.log('All property names in selectedMachine:', Object.keys(selectedMachine));
    
    // Look for property names containing both "last" and "update"
    const lastUpdatedKeys = Object.keys(selectedMachine).filter(key => 
      key.toLowerCase().includes('last') && key.toLowerCase().includes('update')
    );
    
    console.log('Property names related to last updated:', lastUpdatedKeys);
    
    if (lastUpdatedKeys.length > 0) {
      lastUpdatedKeys.forEach(key => {
        console.log(`Value of ${key}:`, selectedMachine[key]);
      });
    }
  }

  return (
    <Card 
      title={selectedMachine.machine_name || selectedMachine.name}
      className="h-full"
      bodyStyle={{ height: 'calc(100% - 57px)', padding: '12px', overflow: 'hidden' }}
      extra={
        <Tag color={selectedMachine.status === 'ON' ? 'warning' : selectedMachine.status === 'PRODUCTION' ? 'success' : 'default'}>
          {selectedMachine.status}
        </Tag>
      }
    >
      <div className="h-full grid grid-rows-[0.7fr_2.3fr] gap-1">
        {/* OEE Information - Ultra compact section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-1 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold text-blue-900 flex items-center">
              <DashboardOutlined className="mr-1 text-blue-600" />
              OEE Analysis
            </span>
            <span className="text-[10px] text-gray-600">
              ID: {oeeData?.machine_id}
            </span>
          </div>

          {/* OEE Components in an ultra compact layout */}
          <div className="grid grid-cols-6 gap-0.5">
            {/* Main OEE Display */}
            <div className="col-span-1">
              <Progress
                type="circle"
                percent={oeeData?.average_oee || 0}
                width={45}
                strokeWidth={8}
                strokeColor={{
                  '0%': '#ff4d4f',
                  '40%': '#faad14',
                  '70%': '#52c41a',
                  '100%': '#1890ff',
                }}
                format={(percent) => (
                  <div className="text-center">
                    <div className="text-[11px] font-bold">{percent}%</div>
                    <div className="text-[8px]">OEE</div>
                  </div>
                )}
              />
            </div>

            {/* Individual OEE Components */}
            <div className="col-span-5 grid grid-cols-3 gap-0.5">
              <div className="bg-white p-0.5 rounded-lg shadow-sm text-center">
                <Progress
                  type="circle"
                  percent={oeeData?.average_availability || 0}
                  width={40}
                  strokeWidth={8}
                  strokeColor="#1890ff"
                  format={(percent) => (
                    <div>
                      <div className="text-[10px] font-semibold">{percent}%</div>
                      <div className="text-[8px]">Avail</div>
                    </div>
                  )}
                />
              </div>
              <div className="bg-white p-0.5 rounded-lg shadow-sm text-center">
                <Progress
                  type="circle"
                  percent={oeeData?.average_performance || 0}
                  width={40}
                  strokeWidth={8}
                  strokeColor="#52c41a"
                  format={(percent) => (
                    <div>
                      <div className="text-[10px] font-semibold">{percent}%</div>
                      <div className="text-[8px]">Perf</div>
                    </div>
                  )}
                />
              </div>
              <div className="bg-white p-0.5 rounded-lg shadow-sm text-center">
                <Progress
                  type="circle"
                  percent={oeeData?.average_quality || 0}
                  width={40}
                  strokeWidth={8}
                  strokeColor="#722ed1"
                  format={(percent) => (
                    <div>
                      <div className="text-[10px] font-semibold">{percent}%</div>
                      <div className="text-[8px]">Qual</div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Losses Analysis - Ultra compact */}
          <div className="bg-white p-1 rounded-lg shadow-sm mt-0.5">
            <div className="grid grid-cols-3 gap-0.5">
              <div>
                <div className="flex justify-between text-[8px]">
                  <span className="text-gray-600">Avail Loss</span>
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
                  strokeWidth={4}
                />
              </div>
              <div>
                <div className="flex justify-between text-[8px]">
                  <span className="text-gray-600">Perf Loss</span>
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
                  strokeWidth={4}
                />
              </div>
              <div>
                <div className="flex justify-between text-[8px]">
                  <span className="text-gray-600">Qual Loss</span>
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
                  strokeWidth={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Three separate boxes for machine information */}
        <div className="grid grid-rows-3 gap-2">
          {/* Program Details Box */}
          <Card 
            size="small"
            title={
              <span className="text-xs font-semibold text-gray-700 flex items-center">
                <CodeSandboxOutlined className="mr-1" />
                Program Details
              </span>
            }
            className="shadow-sm"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-500">Program Number</div>
                <div className="font-medium">{selectedMachine.program_number || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Active Program</div>
                <div className="font-medium">{selectedMachine.active_program || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Selected Program</div>
                <div className="font-medium">{selectedMachine.selected_program || 'N/A'}</div>
              </div>
            </div>
          </Card>

          {/* Part Information Box */}
          <Card 
            size="small"
            title={
              <span className="text-xs font-semibold text-gray-700 flex items-center">
                <BarcodeOutlined className="mr-1" />
                Part Information
              </span>
            }
            className="shadow-sm"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-500">Part Number</div>
                <div className="font-medium">{selectedMachine.part_number || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Part Description</div>
                <div className="font-medium truncate">{selectedMachine.part_description || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Required Quantity</div>
                <div className="font-medium">{selectedMachine.required_quantity || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Launched Quantity</div>
                <div className="font-medium">{selectedMachine.launched_quantity || 'N/A'}</div>
              </div>
            </div>
          </Card>

          {/* Operation Details Box */}
          <Card 
            size="small"
            title={
              <span className="text-xs font-semibold text-gray-700 flex items-center">
                <ToolOutlined className="mr-1" />
                Operation Details
              </span>
            }
            className="shadow-sm"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-500">Operation Number</div>
                <div className="font-medium">{selectedMachine.operation_number || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Operation Description</div>
                <div className="font-medium truncate">{selectedMachine.operation_description || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Machine Status</div>
                <div className="font-medium">{selectedMachine.status || 'N/A'}</div>
              </div>
              <div className="relative">
                <div className="text-gray-500">Last Updated</div>
                <div className="font-medium">
                  {formatDateTime(selectedMachine.lastUpdated || selectedMachine.last_updated)}
                  <Tag 
                    color="blue" 
                    className="absolute right-0 top-0 text-[9px] py-0 px-1"
                  >
                    <ClockCircleOutlined className="mr-0.5" />Live
                  </Tag>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
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