import React, { useState, Suspense,useEffect  } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid, Box, Environment, PerspectiveCamera,useGLTF  } from '@react-three/drei';
import * as THREE from 'three';

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
    position: [-7, 2, 1],
    rotation: [0, Math.PI / 6, 0],
    scale: 4,
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
    position: [2, 2, -2],
    rotation: [0, -Math.PI / 6, 0],
    scale: 4,
  },
  // ... other machines with similar enhanced data
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
  const [selectedMachine, setSelectedMachine] = useState(null);

  return (
    <div style={{ padding: '24px', height: '100vh', background: '#f0f2f5' }}>
      {/* Stats Cards */}
      <Row gutter={16} className="mb-4">
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
      </Row>

      {/* Main Content Area */}
      <Row gutter={16} style={{ height: 'calc(100vh - 220px)' }}>
       {/* Machine Overview */}
       <Col span={16}>
          <Card 
            title="Machine Overview" 
            bodyStyle={{ 
              padding: 0, 
              height: 'calc(100vh - 220px)',
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
                  files="/machine_shop_02_4k.hdr"
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
          <Card 
            title="Machine Details" 
            style={{ height: 'calc(100vh - 220px)', overflowY: 'auto' }}
          >
            {selectedMachine ? (
              <Tabs defaultActiveKey="overview">
                <Tabs.TabPane tab="Overview" key="overview">
                  <p>
                    <strong>Status: </strong>
                    <Badge
                      status={selectedMachine.status === 'running' ? 'success' : selectedMachine.status === 'idle' ? 'warning' : 'error'}
                      text={selectedMachine.status}
                    />
                  </p>
                  <p><strong>OEE:</strong> {selectedMachine.oee}%</p>
                  <p><strong>Current Program:</strong> {selectedMachine.currentProgram}</p>
                  <p><strong>Part Number:</strong> {selectedMachine.partNumber}</p>
                  <Progress 
                    percent={selectedMachine.oee} 
                    status={selectedMachine.oee >= 80 ? 'success' : selectedMachine.oee >= 60 ? 'normal' : 'exception'} 
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Production Data" key="production">
                  <p><strong>Total Count:</strong> {selectedMachine.totalCount}</p>
                  <p><strong>Target Count:</strong> {selectedMachine.targetCount}</p>
                  <p><strong>Cycle Time:</strong> {selectedMachine.cycleTime}</p>
                  <Progress 
                    percent={(selectedMachine.totalCount / selectedMachine.targetCount) * 100} 
                    format={percent => `${selectedMachine.totalCount}/${selectedMachine.targetCount}`}
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Maintenance" key="maintenance">
                  <p><strong>Downtime:</strong> {selectedMachine.downtime}</p>
                  <p><strong>Start Time:</strong> {selectedMachine.startTime}</p>
                  <p><strong>Est. Completion:</strong> {selectedMachine.estimatedCompletion}</p>
                </Tabs.TabPane>
              </Tabs>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Select a machine to view details
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupervisorDashboard;