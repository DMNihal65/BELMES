import React, { useState, Suspense,useEffect  } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, DashboardOutlined, CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, MonitorOutlined } from '@ant-design/icons';
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

  const { TabPane } = Tabs;
  const { Panel } = Collapse;

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
            title={selectedMachine ? selectedMachine.name : "Machine Dashboard"}
            style={{ height: 'calc(100vh - 220px)', overflowY: 'auto' }}
            extra={selectedMachine && (
              <Badge 
                status={selectedMachine.status === 'running' ? 'success' : selectedMachine.status === 'idle' ? 'warning' : 'error'}
                text={selectedMachine.status.toUpperCase()}
              />
            )}
          >
            {selectedMachine ? (
              <div className="space-y-4">
                {/* Enhanced Overview Section */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-800">
                      <DashboardOutlined className="mr-2" />
                      Machine Overview
                    </h3>
                    <Tag color={selectedMachine.status === 'running' ? 'success' : 'warning'}>
                      {selectedMachine.status === 'running' ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                  
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card 
                        className="text-center hover:shadow-md transition-shadow"
                        bordered={false}
                        style={{ background: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        <Statistic
                          title={<span className="text-blue-600">OEE</span>}
                          value={selectedMachine.oee}
                          suffix="%"
                          valueStyle={{ 
                            color: selectedMachine.oee >= 80 ? '#3f8600' : selectedMachine.oee >= 60 ? '#faad14' : '#cf1322',
                            fontWeight: 'bold'
                          }}
                        />
                        <Progress 
                          percent={selectedMachine.oee} 
                          size="small" 
                          showInfo={false}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card 
                        className="text-center hover:shadow-md transition-shadow"
                        bordered={false}
                        style={{ background: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        <Statistic
                          title={<span className="text-blue-600">Efficiency</span>}
                          value={selectedMachine.efficiency || 85}
                          suffix="%"
                          valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                        />
                        <Progress 
                          percent={selectedMachine.efficiency || 85} 
                          size="small" 
                          showInfo={false}
                          strokeColor="#1890ff"
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card 
                        className="text-center hover:shadow-md transition-shadow"
                        bordered={false}
                        style={{ background: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        <Statistic
                          title={<span className="text-blue-600">Availability</span>}
                          value={selectedMachine.availability || 92}
                          suffix="%"
                          valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                        />
                        <Progress 
                          percent={selectedMachine.availability || 92} 
                          size="small" 
                          showInfo={false}
                          strokeColor="#52c41a"
                        />
                      </Card>
                    </Col>
                  </Row>

                  <div className="mt-4 bg-white p-3 rounded-lg">
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div className="flex items-center">
                          <CodeSandboxOutlined className="text-blue-500 text-xl mr-2" />
                          <div>
                            <div className="text-gray-500 text-sm">Current Program</div>
                            <div className="font-medium">{selectedMachine.currentProgram}</div>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="flex items-center">
                          <BarcodeOutlined className="text-blue-500 text-xl mr-2" />
                          <div>
                            <div className="text-gray-500 text-sm">Part Number</div>
                            <div className="font-medium">{selectedMachine.partNumber}</div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>

                {/* Production Data Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Production Data</h3>
                  <Card size="small" className="mb-3">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Total Count"
                          value={selectedMachine.totalCount}
                          suffix={`/ ${selectedMachine.targetCount}`}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Cycle Time"
                          value={selectedMachine.cycleTime}
                        />
                      </Col>
                    </Row>
                  </Card>
                  <Progress 
                    percent={(selectedMachine.totalCount / selectedMachine.targetCount) * 100}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>

                {/* Maintenance Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Maintenance</h3>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card size="small" className="text-center">
                        <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                        <div className="mt-2">Start Time</div>
                        <div className="font-semibold">{selectedMachine.startTime}</div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small" className="text-center">
                        <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                        <div className="mt-2">Est. Completion</div>
                        <div className="font-semibold">{selectedMachine.estimatedCompletion}</div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small" className="text-center">
                        <ToolOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                        <div className="mt-2">Next Service</div>
                        <div className="font-semibold">2d 5h</div>
                      </Card>
                    </Col>
                  </Row>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div className="text-sm">
                        <p><strong>Operator:</strong> {selectedMachine.operator}</p>
                        <p><strong>Shift:</strong> Morning</p>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="text-sm">
                        <p><strong>Department:</strong> Machining</p>
                        <p><strong>Last Maintenance:</strong> 2d ago</p>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              // Enhanced Empty State
              <div className="h-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
                <div className="text-center p-8 rounded-xl">
                  <div className="mb-6">
                    <MonitorOutlined className="text-6xl text-blue-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Welcome to Machine Dashboard
                  </h3>
                  <p className="text-gray-500 mb-4 max-w-sm">
                    Select a machine from the list to view detailed performance metrics, status updates, and maintenance information.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Tag icon={<CheckCircleOutlined />} color="success">Real-time Monitoring</Tag>
                    <Tag icon={<BarChartOutlined />} color="processing">Performance Metrics</Tag>
                    <Tag icon={<ToolOutlined />} color="warning">Maintenance Data</Tag>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupervisorDashboard;