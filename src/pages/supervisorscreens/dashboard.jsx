import React, { useState, Suspense,useEffect  } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag, Empty, Input, Radio, Modal } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, DashboardOutlined, CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, MonitorOutlined, UserOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid, Box, Environment, PerspectiveCamera,useGLTF  } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced machine data with more detailed positioning
const machineData = [
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo linear',
    type: 'CNC Mill',
    status: 'running',
    oee: 87,
    efficiency: 89,
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
    type: 'Vertical Mill',
    status: 'idle',
    oee: 65,
    efficiency: 72,
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
  {
    id: 'LT-001',
    name: 'CNC Lathe ST-20',
    type: 'CNC Lathe',
    status: 'running',
    oee: 91,
    efficiency: 93,
    currentProgram: 'OP-789',
    partNumber: 'PART-456',
    operator: 'Mike Chen',
    currentJob: 'Shaft Production',
  },
  {
    id: 'GR-001',
    name: 'Surface Grinder SG-1',
    type: 'Precision Grinder',
    status: 'running',
    oee: 83,
    efficiency: 85,
    currentProgram: 'OP-321',
    partNumber: 'PART-789',
    operator: 'Lisa Wong',
    currentJob: 'Precision Plates',
  },
  {
    id: 'DR-001',
    name: 'Drill Press DP-5',
    type: 'Drilling Machine',
    status: 'maintenance',
    oee: 65,
    efficiency: 70,
    currentProgram: 'Maintenance',
    operator: 'Robert Brown',
    currentJob: 'Scheduled Maintenance',
  },
  {
    id: 'VMC-002',
    name: 'VMC 1000',
    type: 'Vertical Mill',
    status: 'running',
    oee: 88,
    efficiency: 90,
    currentProgram: 'OP-456',
    operator: 'James Wilson',
    currentJob: 'Mold Components',
  },
  {
    id: 'HMC-001',
    name: 'HMC 500',
    type: 'Horizontal Mill',
    status: 'running',
    oee: 92,
    efficiency: 94,
    currentProgram: 'OP-789',
    operator: 'Sarah Lee',
    currentJob: 'Engine Block',
  },
  {
    id: 'EDM-001',
    name: 'Wire EDM',
    type: 'EDM Machine',
    status: 'idle',
    oee: 78,
    efficiency: 82,
    currentProgram: 'OP-123',
    operator: 'Tom Johnson',
    currentJob: 'Tool Making',
  },
  {
    id: 'CMM-001',
    name: 'CMM Machine',
    type: 'Measuring Machine',
    status: 'running',
    oee: 95,
    efficiency: 96,
    currentProgram: 'QC-789',
    operator: 'Emily Davis',
    currentJob: 'Quality Check',
  },
  {
    id: 'ROB-001',
    name: 'Robotic Cell 1',
    type: 'Robot',
    status: 'running',
    oee: 94,
    efficiency: 95,
    currentProgram: 'ROB-456',
    operator: 'AI System',
    currentJob: 'Assembly',
  },
  {
    id: 'VMC-003',
    name: 'VMC 1200',
    type: 'Vertical Mill',
    status: 'down',
    oee: 45,
    efficiency: 50,
    currentProgram: 'OP-789',
    operator: 'Carlos Rodriguez',
    currentJob: 'Emergency Stop',
  },
  {
    id: 'HMC-002',
    name: 'HMC 800',
    type: 'Horizontal Mill',
    status: 'running',
    oee: 86,
    efficiency: 88,
    currentProgram: 'OP-456',
    operator: 'Alex Thompson',
    currentJob: 'Engine Parts',
  },
  {
    id: 'MIL-001',
    name: 'Universal Mill',
    type: 'Manual Mill',
    status: 'running',
    oee: 81,
    efficiency: 83,
    currentProgram: 'OP-123',
    operator: 'George White',
    currentJob: 'Custom Parts',
  },
  {
    id: 'ROB-002',
    name: 'Robotic Cell 2',
    type: 'Robot',
    status: 'running',
    oee: 93,
    efficiency: 94,
    currentProgram: 'ROB-789',
    operator: 'AI System',
    currentJob: 'Welding',
  },
  {
    id: 'GR-002',
    name: 'CNC Grinder',
    type: 'Precision Grinder',
    status: 'idle',
    oee: 78,
    efficiency: 80,
    currentProgram: 'OP-456',
    operator: 'Patricia Martinez',
    currentJob: 'Waiting',
  },
  {
    id: 'EDM-002',
    name: 'Sinker EDM',
    type: 'EDM Machine',
    status: 'running',
    oee: 84,
    efficiency: 86,
    currentProgram: 'OP-789',
    operator: 'Kevin Zhang',
    currentJob: 'Mold Cavity',
  },
  {
    id: 'LT-002',
    name: 'Multi-Axis Lathe',
    type: 'CNC Lathe',
    status: 'running',
    oee: 89,
    efficiency: 91,
    currentProgram: 'OP-123',
    operator: 'Ryan Jackson',
    currentJob: 'Complex Parts',
  }
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
  const [activeTab, setActiveTab] = useState('machine');

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

      {/* Modified Main Content Area */}
      <Row gutter={16} style={{ height: 'calc(100vh - 220px)' }}>
        <Col span={24}>
          <Card 
            title={
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="dashboard-tabs"
              >
                <TabPane tab="Machine Overview & Details" key="machine" />
                <TabPane tab="Factory Overview" key="factory" />
              </Tabs>
            }
            bodyStyle={{ 
              padding: 16,
              height: 'calc(100vh - 220px)',
              position: 'relative'
            }}
          >
            {activeTab === 'machine' ? (
              <Row gutter={16} style={{ height: '100%' }}>
                {/* Left side - Machine Overview */}
                <Col span={14} style={{ height: '100%' }}>
                  <div style={{ 
                    height: '100%',
                    position: 'relative',
                    borderRight: '1px solid #f0f0f0'
                  }}>
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
                  </div>
                </Col>

                {/* Right side - Machine Details */}
                <Col span={10} style={{ height: '100%', overflowY: 'auto' }}>
                  {selectedMachine ? (
                    <div className="space-y-4">
                      {/* Machine Status Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{selectedMachine.name}</h3>
                        <Badge 
                          status={selectedMachine.status === 'running' ? 'success' : selectedMachine.status === 'idle' ? 'warning' : 'error'}
                          text={selectedMachine.status.toUpperCase()}
                        />
                      </div>
                      
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
                </Col>
              </Row>
            ) : (
              <FactoryOverview />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Replace the existing FactoryOverview component with this enhanced version
const FactoryOverview = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(null);

  const filteredMachines = machineData.filter(machine => {
    const matchesStatus = filterStatus === 'all' || machine.status === filterStatus;
    const matchesSearch = machine.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         machine.operator.toLowerCase().includes(searchText.toLowerCase()) ||
                         machine.type.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#52c41a';
      case 'idle': return '#faad14';
      case 'maintenance': return '#1890ff';
      case 'down': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className="factory-layout">
      {/* Filters */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col flex="auto">
          <Input.Search
            placeholder="Search by machine name, operator, or type..."
            onChange={e => setSearchText(e.target.value)}
            style={{ width: '100%' }}
            size="small"
          />
        </Col>
        <Col>
          <Radio.Group value={filterStatus} onChange={e => setFilterStatus(e.target.value)} size="small">
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="running">Running</Radio.Button>
            <Radio.Button value="idle">Idle</Radio.Button>
            <Radio.Button value="maintenance">Maintenance</Radio.Button>
            <Radio.Button value="down">Down</Radio.Button>
          </Radio.Group>
        </Col>
      </Row>

      {/* Machine Grid */}
      <div className="machine-grid-container">
        <Row gutter={[24, 24]} style={{ margin: 0 }}>
          {filteredMachines.map((machine) => (
            <Col 
              key={machine.id}
              xs={24}
              sm={12}
              md={8}
              lg={24/5}
              className="machine-col"
            >
              <Card
                className="machine-card"
                bordered={false}
                onClick={() => setSelectedMachine(machine)}
                style={{
                  borderLeft: `4px solid ${getStatusColor(machine.status)}`,
                  height: '100%',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <Badge
                  className="status-badge"
                  status={machine.status === 'running' ? 'success' :
                         machine.status === 'idle' ? 'warning' :
                         machine.status === 'maintenance' ? 'processing' : 'error'}
                  text={machine.status.toUpperCase()}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px'
                  }}
                />
                <div className="machine-card-content">
                  <div className="machine-header">
                    <div className="machine-name">{machine.name}</div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Machine Details Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '20px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div className="modal-title">
              <span className="machine-title">{selectedMachine?.name}</span>
              <span className="machine-type">{selectedMachine?.type}</span>
            </div>
            {selectedMachine && (
              <Badge 
                status={selectedMachine.status === 'running' ? 'success' :
                        selectedMachine.status === 'idle' ? 'warning' :
                        selectedMachine.status === 'maintenance' ? 'processing' : 'error'}
                text={selectedMachine.status.toUpperCase()}
                className="status-badge-large"
              />
            )}
          </div>
        }
        open={!!selectedMachine}
        onCancel={() => setSelectedMachine(null)}
        width={1000}
        centered
        footer={null}
        className="machine-details-modal"
      >
        {selectedMachine && (
          <div className="machine-details">
            {/* Performance Metrics */}
            <div className="metrics-overview">
              <Row gutter={[32, 32]}>
                <Col span={8}>
                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-icon">📊</span>
                      OEE
                    </div>
                    <div className="metric-value" style={{ 
                      color: selectedMachine.oee >= 80 ? '#3f8600' : 
                             selectedMachine.oee >= 60 ? '#faad14' : '#cf1322' 
                    }}>
                      {selectedMachine.oee}%
                    </div>
                    <Progress 
                      percent={selectedMachine.oee} 
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      showInfo={false}
                      strokeWidth={8}
                      className="metric-progress"
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-icon">⚡</span>
                      Efficiency
                    </div>
                    <div className="metric-value" style={{ color: '#1890ff' }}>
                      {selectedMachine.efficiency}%
                    </div>
                    <Progress 
                      percent={selectedMachine.efficiency} 
                      strokeColor="#1890ff"
                      showInfo={false}
                      strokeWidth={8}
                      className="metric-progress"
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-icon">🎯</span>
                      Availability
                    </div>
                    <div className="metric-value" style={{ color: '#52c41a' }}>
                      {selectedMachine.availability || 92}%
                    </div>
                    <Progress 
                      percent={selectedMachine.availability || 92} 
                      strokeColor="#52c41a"
                      showInfo={false}
                      strokeWidth={8}
                      className="metric-progress"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            <div className="details-grid">
              {/* Current Operation */}
              <div className="detail-section">
                <div className="section-title">
                  <CodeSandboxOutlined className="section-icon" />
                  Current Operation
                </div>
                <Row gutter={[32, 24]} className="detail-content">
                  <Col span={12}>
                    <div className="detail-item">
                      <div className="detail-icon">📝</div>
                      <div className="detail-info">
                        <div className="detail-label">Program</div>
                        <div className="detail-value">{selectedMachine.currentProgram || 'N/A'}</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="detail-item">
                      <div className="detail-icon">🔢</div>
                      <div className="detail-info">
                        <div className="detail-label">Part Number</div>
                        <div className="detail-value">{selectedMachine.partNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="detail-item">
                      <div className="detail-icon">📊</div>
                      <div className="detail-info">
                        <div className="detail-label">Total Count</div>
                        <div className="detail-value highlight">
                          <span className="current-count">{selectedMachine.totalCount || 0}</span>
                          <span className="count-separator">/</span>
                          <span className="target-count">{selectedMachine.targetCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="detail-item">
                      <div className="detail-icon">⏱️</div>
                      <div className="detail-info">
                        <div className="detail-label">Cycle Time</div>
                        <div className="detail-value">{selectedMachine.cycleTime || 'N/A'}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Time Information */}
              <div className="detail-section">
                <div className="section-title">
                  <ClockCircleOutlined className="section-icon" />
                  Time Information
                </div>
                <Row gutter={[32, 24]} className="detail-content">
                  <Col span={8}>
                    <div className="time-block">
                      <div className="time-icon">🌅</div>
                      <div className="time-info">
                        <div className="time-label">Start Time</div>
                        <div className="time-value">{selectedMachine.startTime || 'N/A'}</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="time-block">
                      <div className="time-icon">🏁</div>
                      <div className="time-info">
                        <div className="time-label">Est. Completion</div>
                        <div className="time-value">{selectedMachine.estimatedCompletion || 'N/A'}</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="time-block">
                      <div className="time-icon">🔧</div>
                      <div className="time-info">
                        <div className="time-label">Next Service</div>
                        <div className="time-value highlight">2d 5h</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Additional Details */}
              <div className="detail-section">
                <div className="section-title">
                  <UserOutlined className="section-icon" />
                  Additional Details
                </div>
                <Row gutter={[32, 24]} className="detail-content">
                  <Col span={12}>
                    <div className="detail-item">
                      <div className="detail-icon">👨‍💼</div>
                      <div className="detail-info">
                        <div className="detail-label">Operator</div>
                        <div className="detail-value">{selectedMachine.operator}</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="detail-item">
                      <div className="detail-icon">🏭</div>
                      <div className="detail-info">
                        <div className="detail-label">Department</div>
                        <div className="detail-value">Machining</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .factory-layout {
          padding: 24px;
          height: 100%;
          overflow: hidden;
        }

        .machine-grid-container {
          overflow-y: auto;
          height: calc(100% - 40px);
          padding: 8px;
        }

        :global(.machine-col) {
          display: flex;
          margin-bottom: 16px !important;
        }

        :global(.machine-card) {
          width: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        :global(.machine-card:hover) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        :global(.machine-card-content) {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding-top: 16px;
        }

        :global(.machine-header) {
          display: flex;
          align-items: center;
          width: 100%;
        }

        :global(.machine-name) {
          font-weight: 600;
          font-size: 14px;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        :global(.detail-section) {
          margin-bottom: 16px;
        }

        :global(.info-item) {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        :global(.info-icon) {
          font-size: 20px;
          color: #1890ff;
        }

        :global(.info-label) {
          color: #666;
          font-size: 12px;
        }

        :global(.info-value) {
          font-size: 14px;
          font-weight: 500;
        }

        :global(.time-card) {
          text-align: center;
        }

        :global(.time-icon) {
          font-size: 24px;
          color: #1890ff;
          margin-bottom: 8px;
        }

        :global(.time-label) {
          color: #666;
          font-size: 12px;
        }

        :global(.time-value) {
          font-size: 14px;
          font-weight: 500;
        }

        :global(.ant-card-body) {
          height: 100%;
          padding: 8px 12px !important;
        }

        :global(.ant-badge-status-text) {
          font-size: 12px;
        }

        :global(.machine-details-modal .ant-modal-content) {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: #ffffff;
        }

        :global(.machine-details-modal .ant-modal-header) {
          background: #ffffff;
          border-bottom: none;
          padding: 0;
        }

        :global(.machine-details-modal .ant-modal-body) {
          padding: 0 32px 32px 32px;
          background: #ffffff;
        }

        :global(.machine-details-modal .ant-modal-close) {
          top: 24px;
          right: 24px;
        }

        :global(.machine-details-modal .ant-modal-close-x) {
          width: 40px;
          height: 40px;
          line-height: 40px;
          border-radius: 20px;
          background: #f5f5f5;
          color: #666;
          transition: all 0.3s ease;
        }

        :global(.machine-details-modal .ant-modal-close-x:hover) {
          background: #e6e6e6;
          transform: rotate(90deg);
        }

        :global(.modal-title) {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        :global(.machine-title) {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        :global(.machine-type) {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
        }

        :global(.status-badge-large .ant-badge-status-dot) {
          width: 12px;
          height: 12px;
        }

        :global(.status-badge-large .ant-badge-status-text) {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        :global(.metrics-overview) {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          padding: 32px;
          border-radius: 20px;
          margin: 24px 0 32px 0;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        :global(.metric-card) {
          background: white;
          padding: 28px;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        :global(.metric-card:hover) {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        :global(.metric-header) {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          color: #4b5563;
          margin-bottom: 16px;
          font-weight: 600;
        }

        :global(.metric-icon) {
          font-size: 24px;
        }

        :global(.metric-value) {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 16px;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        :global(.metric-progress) {
          margin-bottom: 0;
        }

        :global(.details-grid) {
          display: grid;
          gap: 32px;
        }

        :global(.detail-section) {
          background: white;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        :global(.detail-section:hover) {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        :global(.section-title) {
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          padding: 28px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
        }

        :global(.section-icon) {
          font-size: 24px;
          margin-right: 12px;
          color: #3b82f6;
        }

        :global(.detail-content) {
          padding: 28px;
        }

        :global(.detail-item) {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 24px;
          background: #f8fafc;
          border-radius: 16px;
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        :global(.detail-item:hover) {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          background: white;
        }

        :global(.detail-icon) {
          font-size: 24px;
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        :global(.detail-info) {
          flex: 1;
        }

        :global(.detail-label) {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        :global(.detail-value) {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
        }

        :global(.detail-value.highlight) {
          color: #3b82f6;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        :global(.current-count) {
          font-size: 24px;
          color: #3b82f6;
        }

        :global(.count-separator) {
          color: #9ca3af;
          margin: 0 4px;
        }

        :global(.target-count) {
          color: #6b7280;
        }

        :global(.time-block) {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 24px;
          background: #f8fafc;
          border-radius: 16px;
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        :global(.time-block:hover) {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          background: white;
        }

        :global(.time-icon) {
          font-size: 24px;
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        :global(.time-info) {
          flex: 1;
        }

        :global(.time-label) {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        :global(.time-value) {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
        }

        :global(.time-value.highlight) {
          color: #f59e0b;
        }
      `}</style>
    </div>
  );
};

export default SupervisorDashboard;