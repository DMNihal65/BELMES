import React, { useState, Suspense,useEffect  } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag, Avatar, Tooltip, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, DashboardOutlined, CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, MonitorOutlined, WarningOutlined, StopOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid, Box, Environment, PerspectiveCamera,useGLTF  } from '@react-three/drei';
import * as THREE from 'three';

// Machine data with more realistic manufacturing scenarios
const machineData = [
  {
    id: 'VMC-001',
    name: 'VMC 850',
    type: 'Vertical Machining Center',
    image: '/machine-images/vmc.png',
    status: 'running',
    oee: 87,
    availability: 92,
    performance: 89,
    quality: 95,
    currentJob: 'Housing Block A-123',
    operator: 'John Smith',
    nextMaintenance: '48h',
    alerts: [],
  },
  {
    id: 'HMC-001',
    name: 'HMC 500',
    type: 'Horizontal Machining Center',
    image: '/machine-images/hmc.png',
    status: 'idle',
    oee: 72,
    availability: 85,
    performance: 78,
    quality: 92,
    currentJob: 'Waiting',
    operator: 'Sarah Johnson',
    nextMaintenance: '24h',
    alerts: ['Tool wear detected'],
  },
  {
    id: 'LT-001',
    name: 'Swiss Turn ST-20',
    type: 'CNC Lathe',
    image: '/machine-images/lathe.png',
    status: 'running',
    oee: 91,
    availability: 95,
    performance: 92,
    quality: 97,
    currentJob: 'Shaft Production',
    operator: 'Mike Chen',
    nextMaintenance: '72h',
    alerts: [],
  },
  {
    id: 'GR-001',
    name: 'Surface Grinder SG-1',
    type: 'Precision Grinder',
    image: '/machine-images/grinder.png',
    status: 'running',
    oee: 83,
    availability: 88,
    performance: 85,
    quality: 96,
    currentJob: 'Precision Plates',
    operator: 'Lisa Wong',
    nextMaintenance: '36h',
    alerts: [],
  },
  {
    id: 'DR-001',
    name: 'Drill Press DP-5',
    type: 'Drilling Machine',
    image: '/machine-images/drill.png',
    status: 'maintenance',
    oee: 65,
    availability: 70,
    performance: 82,
    quality: 90,
    currentJob: 'Maintenance',
    operator: 'Robert Brown',
    nextMaintenance: '0h',
    alerts: ['Scheduled maintenance'],
  },
  {
    id: 'VMC-002',
    name: 'VMC 1000',
    type: 'Vertical Machining Center',
    image: '/machine-images/vmc.png',
    status: 'running',
    oee: 88,
    availability: 90,
    performance: 87,
    quality: 94,
    currentJob: 'Mold Components',
    operator: 'James Wilson',
    nextMaintenance: '96h',
    alerts: [],
  },
  {
    id: 'EDM-001',
    name: 'Wire EDM',
    type: 'Electrical Discharge Machine',
    image: '/machine-images/edm.png',
    status: 'running',
    oee: 79,
    availability: 85,
    performance: 80,
    quality: 98,
    currentJob: 'Die Cutting',
    operator: 'Emma Davis',
    nextMaintenance: '60h',
    alerts: [],
  },
  {
    id: 'ROB-001',
    name: 'Robotic Cell 1',
    type: 'Automated Assembly',
    image: '/machine-images/robot.png',
    status: 'running',
    oee: 95,
    availability: 98,
    performance: 96,
    quality: 99,
    currentJob: 'Auto Assembly',
    operator: 'AI System',
    nextMaintenance: '120h',
    alerts: [],
  },
  {
    id: 'CMM-001',
    name: 'CMM Inspector',
    type: 'Coordinate Measuring Machine',
    image: '/machine-images/cmm.png',
    status: 'running',
    oee: 92,
    availability: 94,
    performance: 91,
    quality: 99,
    currentJob: 'Quality Inspection',
    operator: 'David Lee',
    nextMaintenance: '84h',
    alerts: [],
  },
  {
    id: 'LT-002',
    name: 'CNC Lathe L2',
    type: 'CNC Turning Center',
    image: '/machine-images/lathe.png',
    status: 'idle',
    oee: 76,
    availability: 82,
    performance: 79,
    quality: 93,
    currentJob: 'Setup',
    operator: 'Tom Miller',
    nextMaintenance: '12h',
    alerts: ['Setup in progress'],
  },
  {
    id: 'VMC-003',
    name: 'VMC 1200',
    type: 'Vertical Machining Center',
    image: '/machine-images/vmc.png',
    status: 'down',
    oee: 45,
    availability: 50,
    performance: 85,
    quality: 92,
    currentJob: 'Stopped',
    operator: 'Carlos Rodriguez',
    nextMaintenance: '2h',
    alerts: ['Emergency stop activated'],
  },
  {
    id: 'HMC-002',
    name: 'HMC 800',
    type: 'Horizontal Machining Center',
    image: '/machine-images/hmc.png',
    status: 'running',
    oee: 86,
    availability: 89,
    performance: 88,
    quality: 94,
    currentJob: 'Engine Blocks',
    operator: 'Alex Thompson',
    nextMaintenance: '36h',
    alerts: [],
  },
  {
    id: 'MIL-001',
    name: 'Universal Mill',
    type: 'Milling Machine',
    image: '/machine-images/mill.png',
    status: 'running',
    oee: 81,
    availability: 86,
    performance: 83,
    quality: 91,
    currentJob: 'Custom Parts',
    operator: 'George White',
    nextMaintenance: '48h',
    alerts: [],
  },
  {
    id: 'ROB-002',
    name: 'Robotic Cell 2',
    type: 'Automated Welding',
    image: '/machine-images/robot.png',
    status: 'running',
    oee: 93,
    availability: 96,
    performance: 94,
    quality: 98,
    currentJob: 'Welding Assembly',
    operator: 'AI System',
    nextMaintenance: '108h',
    alerts: [],
  },
  {
    id: 'GR-002',
    name: 'CNC Grinder',
    type: 'Precision Grinder',
    image: '/machine-images/grinder.png',
    status: 'idle',
    oee: 78,
    availability: 83,
    performance: 80,
    quality: 95,
    currentJob: 'Waiting',
    operator: 'Patricia Martinez',
    nextMaintenance: '24h',
    alerts: ['Material needed'],
  },
  {
    id: 'EDM-002',
    name: 'Sinker EDM',
    type: 'Electrical Discharge Machine',
    image: '/machine-images/edm.png',
    status: 'running',
    oee: 84,
    availability: 87,
    performance: 86,
    quality: 97,
    currentJob: 'Mold Cavity',
    operator: 'Kevin Zhang',
    nextMaintenance: '72h',
    alerts: [],
  },
  {
    id: 'LT-003',
    name: 'Multi-Axis Lathe',
    type: 'CNC Turning Center',
    image: '/machine-images/lathe.png',
    status: 'running',
    oee: 89,
    availability: 91,
    performance: 90,
    quality: 96,
    currentJob: 'Complex Parts',
    operator: 'Ryan Jackson',
    nextMaintenance: '60h',
    alerts: [],
  },
];

// Add machine icons mapping
const machineIcons = {
  'VMC': '/icons/vmc.svg',
  'HMC': '/icons/hmc.svg',
  'LT': '/icons/lathe.svg',
  'GR': '/icons/grinder.svg',
  'DR': '/icons/drill.svg',
  'EDM': '/icons/edm.svg',
  'ROB': '/icons/robot.svg',
  'CMM': '/icons/cmm.svg',
  'MIL': '/icons/mill.svg'
};

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

// Status color mapping
const getStatusColor = (status) => {
  const colors = {
    running: '#52c41a',
    idle: '#faad14',
    down: '#f5222d',
    maintenance: '#1890ff'
  };
  return colors[status] || '#d9d9d9';
};

// Modify the MachineCard component to be more compact
const MachineCard = ({ machine, onClick, isSelected }) => {
  return (
    <Card
      hoverable
      size="small"
      className={`machine-card ${isSelected ? 'selected' : ''}`}
      style={{ 
        borderLeft: `4px solid ${getStatusColor(machine.status)}`,
        marginBottom: '8px',
        transition: 'all 0.3s ease',
      }}
      onClick={() => onClick(machine)}
      bodyStyle={{ padding: '12px' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar 
            size={36} 
            src={machineIcons[machine.id.split('-')[0]]}
            style={{ backgroundColor: '#f0f2f5' }}
          />
          <div>
            <div className="font-bold">{machine.name}</div>
            <div className="text-xs text-gray-500">{machine.currentJob}</div>
          </div>
        </div>
        <div className="text-right">
          <Badge
            status={machine.status === 'running' ? 'success' : machine.status === 'idle' ? 'warning' : 'error'}
            text={machine.status.toUpperCase()}
          />
          <div className="text-sm mt-1">
            OEE: <span className="font-bold">{machine.oee}%</span>
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <Progress 
          percent={machine.oee} 
          size="small" 
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          showInfo={false}
        />
      </div>

      {machine.alerts.length > 0 && (
        <div className="mt-1">
          {machine.alerts.map((alert, index) => (
            <Tag key={index} color="warning" className="text-xs" icon={<WarningOutlined />}>
              {alert}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  );
};

// Modify the SupervisorDashboard component
const SupervisorDashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Calculate statistics
  const stats = {
    running: machineData.filter(m => m.status === 'running').length,
    idle: machineData.filter(m => m.status === 'idle').length,
    down: machineData.filter(m => m.status === 'down').length,
    maintenance: machineData.filter(m => m.status === 'maintenance').length,
    averageOEE: Math.round(machineData.reduce((acc, m) => acc + m.oee, 0) / machineData.length),
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Compact Stats Row */}
      <Row gutter={[8, 8]} className="mb-4">
        <Col span={4}>
          <Card size="small" bordered={false}>
            <Statistic
              title="OEE"
              value={stats.averageOEE}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" bordered={false}>
            <Statistic
              title="Running"
              value={stats.running}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${machineData.length}`}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" bordered={false}>
            <Statistic
              title="Idle"
              value={stats.idle}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" bordered={false}>
            <Statistic
              title="Down"
              value={stats.down}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" bordered={false}>
            <Statistic
              title="Maintenance"
              value={stats.maintenance}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Machine Grid */}
      <Row gutter={[8, 8]}>
        {machineData.map((machine) => (
          <Col key={machine.id} xs={24} sm={12} md={8} lg={6} xl={4}>
            <MachineCard
              machine={machine}
              onClick={setSelectedMachine}
              isSelected={selectedMachine?.id === machine.id}
            />
          </Col>
        ))}
      </Row>

      <style jsx>{`
        .machine-card {
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .machine-card.selected {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .ant-card-body {
          padding: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorDashboard;