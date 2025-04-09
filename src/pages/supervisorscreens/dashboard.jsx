import React, { useState, Suspense,useEffect  } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, DashboardOutlined, CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, MonitorOutlined, FileTextOutlined, ProjectOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid, Box, Environment, PerspectiveCamera,useGLTF  } from '@react-three/drei';
import * as THREE from 'three';
import { Steps } from 'antd';

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
  const [hovered, setHovered] = useState(false);
  
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
    if (status === 'running' && clonedScene) {
      clonedScene.traverse((child) => {
        if (child.name.includes('rotor') || child.name.includes('spindle')) {
          child.rotation.y += 0.01;
        }
      });
    }
  });

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        if (child.name.includes('status_light')) {
          switch (status) {
            case 'running':
              child.material.emissive.setHex(0x00ff00);
              break;
            case 'idle':
              child.material.emissive.setHex(0xffa500);
              break;
            case 'down':
              child.material.emissive.setHex(0xff0000);
              break;
          }
        }
      }
    });
  }, [status, clonedScene]);

  return (
    <group 
      position={position} 
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive 
        object={clonedScene} 
        scale={[scale, scale, scale]} 
        castShadow 
        receiveShadow
      />
      {(hovered || isSelected) && (
        <Html position={[0, 5, 0]}>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 w-48">
            <div className="text-lg font-bold mb-2">{props.name}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Status: 
                <Badge 
                  status={status === 'running' ? 'success' : status === 'idle' ? 'warning' : 'error'}
                  text={status.toUpperCase()}
                />
              </div>
              <div>OEE: <span className="font-semibold">{props.oee}%</span></div>
            </div>
          </div>
        </Html>
      )}
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
  const [selectedMachine, setSelectedMachine] = useState(machineData[0]);

  const { TabPane } = Tabs;
  const { Panel } = Collapse;

  return (
    <div style={{ padding: '24px', height: '100vh', background: '#f0f2f5' }}>
      {/* Stats Cards */}
      {/* <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Overall OEE"
              value={85.7}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
            <ReactECharts option={getSparklineOption([40, 45, 50, 55, 60, 45, 85], '#3f8600')} style={{ height: '40px' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Parts"
              value={2847}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
            <ReactECharts option={getSparklineOption([28, 35, 40, 45, 50, 55, 60], '#3f8600', 'bar')} style={{ height: '40px' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Active Machines"
              value={12}
              suffix="/ 15"
            />
            <Progress percent={80} size="small" showInfo={false} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Efficiency"
              value={92.3}
              precision={1}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix="%"
            />
            <ReactECharts option={getSparklineOption([90, 92, 91, 94, 90, 92, 92], '#cf1322')} style={{ height: '40px' }} />
          </Card>
        </Col>
      </Row> */}

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
                {machineData.map((machine) => (
                  <MachineModel
                    key={machine.id}
                    {...machine}
                    onClick={() => setSelectedMachine(machine)}
                    isSelected={selectedMachine?.id === machine.id}
                  />
                ))}
                <Environment 
                  files="/PANO_20250320_122016.hdr"
                  background={true}
                  blur={0.5}
                  // preset="forest"
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
          <MachineDetails selectedMachine={selectedMachine} />
        </Col>
      </Row>
    </div>
  );
};

// Update the Machine Details section
const MachineDetails = ({ selectedMachine }) => {
  // Use the first machine if none selected (though this shouldn't happen now)
  const machine = selectedMachine || machineData[0];
  
  return (
    <Card 
      title={machine.name}
      className="h-full overflow-auto"
      extra={
        <Tag color={machine.status === 'running' ? 'success' : 'warning'}>
          {machine.status.toUpperCase()}
        </Tag>
      }
    >
      <div className="space-y-6">
        {/* Production Order Details */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            <CodeSandboxOutlined className="mr-2" />
            Production Order Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Order ID</div>
              <div className="font-medium">1</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Priority</div>
              <Tag color={getPriorityColor(5)}>Priority 5</Tag>
            </div>
            <div>
              <div className="text-sm text-gray-500">Part Number</div>
              <div className="font-medium">213511100114</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Production Order</div>
              <div className="font-medium">10557513</div>
            </div>
          </div>
        </div>

        {/* Material Details */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            <BarcodeOutlined className="mr-2" />
            Material Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Material Description</div>
              <div className="font-medium">SK</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Required Quantity</div>
                <div className="font-medium">24</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Launched Quantity</div>
                <div className="font-medium">24</div>
              </div>
            </div>
            <Progress 
              percent={100} 
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">
            <FileTextOutlined className="mr-2" />
            Order Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Sales Order</div>
              <div className="font-medium">07/3111202373/0110</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Project Name</div>
              <div className="font-medium">BMPM C-Ku 100 W</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">WBS Element</div>
              <div className="font-medium text-sm">
                Sale order :07/3111202373/0110 Part Desc :SKTI CHASSIS
              </div>
              <div className="font-medium text-sm">
                Tot.No of Oprns :12
              </div>
            </div>
          </div>
        </div>

        {/* Project Details
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">
            <ProjectOutlined className="mr-2" />
            Project Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Project Name</div>
              <div className="font-medium">BMPM C-Ku 100 W</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Operations</div>
              <div className="font-medium">12</div>
            </div>
          </div>
          <div className="mt-4">
            <Steps 
              current={3} 
              size="small"
              className="custom-steps"
              items={[
                { title: 'Started' },
                { title: 'In Progress' },
                { title: 'Testing' },
                { title: 'Completed' }
              ]}
            />
          </div>
        </div> */}
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