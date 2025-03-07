import React, { useState, Suspense, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, DashboardOutlined, CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, MonitorOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid, Box, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Updated machine data based on the exact floor plan measurements
const machineData = [
  // Bottom row of machines (from left to right) - Exact positions based on floor plan
  {
    id: 'DMU-60MB-5AXIS',
    name: 'DMU 60MB 5-AXIS',
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
    position: [-15, 0, 11], // Left side bottom row
    rotation: [0, 0, 0],
    scale: 3.5,
  },
  {
    id: 'DMU-50',
    name: 'DMU 50',
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
    position: [-8, 0, 11], // Second from left bottom row
    rotation: [0, 0, 0],
    scale: 3,
  },
  {
    id: 'DMU-EVO-LINEAR',
    name: 'DMU 60 eVo LINEAR',
    status: 'running',
    oee: 92,
    currentProgram: 'OP-2345',
    partNumber: 'PART-456',
    totalCount: 175,
    targetCount: 200,
    operator: 'Mike Johnson',
    startTime: '07:30 AM',
    estimatedCompletion: '03:45 PM',
    cycleTime: '35 min',
    downtime: '1%',
    position: [0, 0, 11], // Middle bottom row
    rotation: [0, 0, 0],
    scale: 3.5,
  },
  {
    id: 'DMU-60T',
    name: 'DMU 60T',
    status: 'running',
    oee: 78,
    currentProgram: 'OP-6789',
    partNumber: 'PART-567',
    totalCount: 120,
    targetCount: 180,
    operator: 'Sarah Williams',
    startTime: '08:15 AM',
    estimatedCompletion: '04:15 PM',
    cycleTime: '40 min',
    downtime: '3%',
    position: [8, 0, 11], // Fourth from left bottom row
    rotation: [0, 0, 0],
    scale: 3.5,
  },
  {
    id: 'MIKRON',
    name: 'MIKRON',
    status: 'idle',
    oee: 72,
    currentProgram: 'OP-3456',
    partNumber: 'PART-234',
    totalCount: 85,
    targetCount: 150,
    operator: 'Robert Brown',
    startTime: '09:30 AM',
    estimatedCompletion: '05:30 PM',
    cycleTime: '42 min',
    downtime: '4%',
    position: [15, 0, 11], // Right side bottom row
    rotation: [0, 0, 0],
    scale: 3.5,
  },
  
  // Upper section machines - corrected positions based on floor plan
  {
    id: 'CTX-TURN-MILL',
    name: 'CTX Turn-Mill',
    status: 'running',
    oee: 83,
    currentProgram: 'OP-8901',
    partNumber: 'PART-345',
    totalCount: 110,
    targetCount: 160,
    operator: 'Alan Davis',
    startTime: '07:45 AM',
    estimatedCompletion: '03:30 PM',
    cycleTime: '38 min',
    downtime: '2.5%',
    position: [-19, 0, -6], // Top left area - precisely positioned
    rotation: [0, Math.PI / 6, 0],
    scale: 3,
  },
  {
    id: 'TSUGAMI',
    name: 'TSUGAMI',
    status: 'running',
    oee: 79,
    currentProgram: 'OP-9012',
    partNumber: 'PART-678',
    totalCount: 105,
    targetCount: 140,
    operator: 'Emma Clark',
    startTime: '08:30 AM',
    estimatedCompletion: '02:30 PM',
    cycleTime: '36 min',
    downtime: '3%',
    position: [-13, 0, -3], // Upper left area - precisely positioned
    rotation: [0, Math.PI / 6, 0],
    scale: 3,
  },
  {
    id: 'IKEGAI',
    name: 'IKEGAI',
    status: 'idle',
    oee: 68,
    currentProgram: 'OP-0123',
    partNumber: 'PART-901',
    totalCount: 95,
    targetCount: 180,
    operator: 'Tom Wilson',
    startTime: '09:15 AM',
    estimatedCompletion: '05:15 PM',
    cycleTime: '42 min',
    downtime: '5%',
    position: [-8, 0, -7], // Upper middle-left area - precisely positioned
    rotation: [0, 0, 0],
    scale: 2.8,
  },
  {
    id: 'SCH-180',
    name: 'SCH-180',
    status: 'running',
    oee: 91,
    currentProgram: 'OP-1234',
    partNumber: 'PART-012',
    totalCount: 155,
    targetCount: 180,
    operator: 'Jennifer Lee',
    startTime: '07:30 AM',
    estimatedCompletion: '04:00 PM',
    cycleTime: '30 min',
    downtime: '1.5%',
    position: [1, 0, -5], // Middle area - precisely positioned
    rotation: [0, -Math.PI / 6, 0],
    scale: 3,
  },
  {
    id: 'SCH-110',
    name: 'SCH-110',
    status: 'down',
    oee: 45,
    currentProgram: 'OP-2345',
    partNumber: 'PART-123',
    totalCount: 40,
    targetCount: 120,
    operator: 'George Miller',
    startTime: '10:00 AM',
    estimatedCompletion: '06:00 PM',
    cycleTime: '50 min',
    downtime: '15%',
    position: [5, 0, -8], // Upper middle area - precisely positioned
    rotation: [0, -Math.PI / 6, 0],
    scale: 2.8,
  },
  {
    id: 'SCH-125',
    name: 'SCH-125',
    status: 'idle',
    oee: 72,
    currentProgram: 'OP-3456',
    partNumber: 'PART-234',
    totalCount: 85,
    targetCount: 150,
    operator: 'Patricia White',
    startTime: '09:00 AM',
    estimatedCompletion: '05:30 PM',
    cycleTime: '45 min',
    downtime: '6%',
    position: [9, 0, -3], // Upper right area - precisely positioned
    rotation: [0, -Math.PI / 6, 0],
    scale: 2.8,
  },
  {
    id: 'LMW',
    name: 'LMW',
    status: 'running',
    oee: 88,
    currentProgram: 'OP-4567',
    partNumber: 'PART-345',
    totalCount: 130,
    targetCount: 170,
    operator: 'Kevin Jones',
    startTime: '08:00 AM',
    estimatedCompletion: '04:30 PM',
    cycleTime: '35 min',
    downtime: '2%',
    position: [12, 0, -8], // Upper right area - precisely positioned
    rotation: [0, -Math.PI / 6, 0],
    scale: 2.8,
  },
  {
    id: 'KARDEX',
    name: 'KARDEX',
    status: 'running',
    oee: 94,
    currentProgram: 'OP-5678',
    partNumber: 'PART-456',
    totalCount: 160,
    targetCount: 180,
    operator: 'Rachel Green',
    startTime: '07:30 AM',
    estimatedCompletion: '03:30 PM',
    cycleTime: '25 min',
    downtime: '1%',
    position: [16, 0, -10], // Top right corner - as per floor plan
    rotation: [0, 0, 0],
    scale: 3.5,
  },
  
  // Right side machines - exact positions as per floor plan
  {
    id: 'TOOL-GRINDING',
    name: 'Tool Grinding Machine',
    status: 'running',
    oee: 91,
    currentProgram: 'OP-6789',
    partNumber: 'TOOL-123',
    totalCount: 40,
    targetCount: 50,
    operator: 'David Miller',
    startTime: '08:00 AM',
    estimatedCompletion: '02:00 PM',
    cycleTime: '25 min',
    downtime: '1.2%',
    position: [24, 0, -8], // Far right, top area - as per floor plan
    rotation: [0, 0, 0],
    scale: 3,
  },
  {
    id: 'ROBOFIL-WEDM',
    name: 'Robofil WEDM',
    status: 'running',
    oee: 85,
    currentProgram: 'OP-7890',
    partNumber: 'WIRE-456',
    totalCount: 25,
    targetCount: 30,
    operator: 'Patricia White',
    startTime: '08:30 AM',
    estimatedCompletion: '03:30 PM',
    cycleTime: '55 min',
    downtime: '2.8%',
    position: [24, 0, 0], // Far right, middle area - as per floor plan
    rotation: [0, 0, 0],
    scale: 2.5,
  },
  {
    id: 'MAKINO-WEDM',
    name: 'Makino WEDM',
    status: 'idle',
    oee: 75,
    currentProgram: 'OP-8901',
    partNumber: 'WIRE-789',
    totalCount: 18,
    targetCount: 25,
    operator: 'Kevin Jones',
    startTime: '09:00 AM',
    estimatedCompletion: '04:00 PM',
    cycleTime: '60 min',
    downtime: '5.5%',
    position: [24, 0, 7], // Far right, bottom area - as per floor plan
    rotation: [0, 0, 0],
    scale: 2.5,
  },
];

// Create a WorkstationTable component
const WorkstationTable = ({ position, rotation = [0, 0, 0], scale = [2, 0.1, 1] }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={scale} />
        <meshStandardMaterial color="#d4d4d4" />
      </mesh>
      {/* Diagonal line on the table */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-scale[0]/2, scale[1]/2 + 0.01, -scale[2]/2),
          new THREE.Vector3(scale[0]/2, scale[1]/2 + 0.01, scale[2]/2)
        ])} />
        <lineBasicMaterial attach="material" color="black" linewidth={2} />
      </line>
    </group>
  );
};

// Create a ToolSettingTable component
const ToolSettingTable = ({ position, rotation = [0, 0, 0], scale = [1.5, 0.1, 0.8] }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={scale} />
        <meshStandardMaterial color="#b0c4de" />
      </mesh>
      {/* Horizontal lines on the table */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-scale[0]/2, scale[1]/2 + 0.01, 0),
          new THREE.Vector3(scale[0]/2, scale[1]/2 + 0.01, 0)
        ])} />
        <lineBasicMaterial attach="material" color="black" linewidth={2} />
      </line>
    </group>
  );
};

// Create a MachineAccessory component
const MachineAccessory = ({ position }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.8, 0.5, 0.8]} />
      <meshStandardMaterial color="#aaaaaa" />
    </mesh>
  );
};

// Path Arrow component
const PathArrow = ({ start, end, color = "#ffd700", arrowSize = 1 }) => {
  // Create direction vector
  const direction = new THREE.Vector3().subVectors(
    new THREE.Vector3(end[0], end[1], end[2]),
    new THREE.Vector3(start[0], start[1], start[2])
  ).normalize();
  
  // Calculate length
  const length = new THREE.Vector3().subVectors(
    new THREE.Vector3(end[0], end[1], end[2]),
    new THREE.Vector3(start[0], start[1], start[2])
  ).length();
  
  // Calculate position (midpoint)
  const position = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ];
  
  // Calculate rotation to point in the direction
  const quaternion = new THREE.Quaternion();
  const initialDirection = new THREE.Vector3(1, 0, 0); // Default direction
  const rotationAxis = new THREE.Vector3().crossVectors(initialDirection, direction);
  
  if (rotationAxis.length() > 0.001) {
    const angle = initialDirection.angleTo(direction);
    quaternion.setFromAxisAngle(rotationAxis.normalize(), angle);
  }
  
  return (
    <group position={position}>
      <mesh rotation={[0, 0, 0]} quaternion={quaternion}>
        {/* Path line */}
        <boxGeometry args={[length, 0.05, 0.8]} />
        <meshStandardMaterial color="#888888" />
        
        {/* Arrow head */}
        <mesh position={[length/2 - arrowSize/2, 0, 0]}>
          <coneGeometry args={[0.4, arrowSize, 32]} rotation={[0, 0, -Math.PI/2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </mesh>
    </group>
  );
};

// Blue Path Arrow component for simulator entrance
const BluePathArrow = ({ start, end, arrowSize = 1 }) => {
  // Create direction vector
  const direction = new THREE.Vector3().subVectors(
    new THREE.Vector3(end[0], end[1], end[2]),
    new THREE.Vector3(start[0], start[1], start[2])
  ).normalize();
  
  // Calculate length
  const length = new THREE.Vector3().subVectors(
    new THREE.Vector3(end[0], end[1], end[2]),
    new THREE.Vector3(start[0], start[1], start[2])
  ).length();
  
  // Calculate position (midpoint)
  const position = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ];
  
  // Calculate rotation to point in the direction
  const quaternion = new THREE.Quaternion();
  const initialDirection = new THREE.Vector3(1, 0, 0); // Default direction
  const rotationAxis = new THREE.Vector3().crossVectors(initialDirection, direction);
  
  if (rotationAxis.length() > 0.001) {
    const angle = initialDirection.angleTo(direction);
    quaternion.setFromAxisAngle(rotationAxis.normalize(), angle);
  }
  
  return (
    <group position={position}>
      <mesh rotation={[0, 0, 0]} quaternion={quaternion}>
        {/* Path line */}
        <boxGeometry args={[length, 0.05, 0.8]} />
        <meshStandardMaterial color="#4169e1" /> {/* Royal blue */}
        
        {/* Arrow head */}
        <mesh position={[length/2 - arrowSize/2, 0, 0]}>
          <coneGeometry args={[0.4, arrowSize, 32]} rotation={[0, 0, -Math.PI/2]} />
          <meshStandardMaterial color="#1e90ff" /> {/* Dodger blue */}
        </mesh>
      </mesh>
    </group>
  );
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

// Rack Component
const Rack = ({ position, rotation = [0, 0, 0], size = [2, 3, 1] }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#8b4513" /> {/* Brown color for racks */}
      </mesh>
      {/* Shelves */}
      {[1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, -size[1]/2 + (i * size[1]/5), 0]}>
          <boxGeometry args={[size[0], 0.1, size[2]]} />
          <meshStandardMaterial color="#a0522d" />
        </mesh>
      ))}
      <Html position={[0, size[1]/2 + 0.5, 0]}>
        <div className="bg-amber-100 px-2 py-1 rounded text-xs font-bold">RACK</div>
      </Html>
    </group>
  );
};

// Supervisor Desk Component - correctly positioned as per floor plan
const SupervisorDesk = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Desk */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2.5, 0.1, 1.2]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Chair */}
      <mesh position={[0, 0.5, 1]}>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0, 0.2, 1]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      <Html position={[0, 1.2, 0]}>
        <div className="bg-blue-100 px-2 py-1 rounded text-xs font-bold">SUPERVISOR</div>
      </Html>
    </group>
  );
};

// Machine Enclosure Component - For specific machine rooms
const MachineEnclosure = ({ position, size, label }) => {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[size[0], 2, size[1]]} />
        <meshStandardMaterial color="#e0e0e0" opacity={0.2} transparent />
      </mesh>
      
      {/* Walls */}
      <mesh position={[0, 1, size[1]/2]}>
        <boxGeometry args={[size[0], 2, 0.1]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>
      
      <mesh position={[0, 1, -size[1]/2]}>
        <boxGeometry args={[size[0], 2, 0.1]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>
      
      <mesh position={[size[0]/2, 1, 0]}>
        <boxGeometry args={[0.1, 2, size[1]]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>
      
      <mesh position={[-size[0]/2, 1, 0]}>
        <boxGeometry args={[0.1, 2, size[1]]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>
      
      <Html position={[0, 2.5, 0]}>
        <div className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">
          {label}
        </div>
      </Html>
    </group>
  );
};

// Floor Section Component - for colored floor areas
const FloorSection = ({ position, size, color }) => {
  return (
    <mesh position={[position[0], position[1], position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
};

// Shop floor environment - completely redesigned to match the floor plan precisely
const ShopFloor = () => {
  return (
    <>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      {/* Main grid */}
      <Grid
        args={[60, 60]}
        cellSize={5}
        cellThickness={0.3}
        cellColor="#dddddd"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#aaaaaa"
        fadeDistance={60}
        fadeStrength={1}
        followCamera={false}
        position={[0, -0.02, 0]}
      />
      
      {/* Colored floor sections */}
      {/* AC and ELECTRICAL MAINTENANCE ROOM - light red */}
      <FloorSection 
        position={[-20, -0.01, -10]}
        size={[15, 8]}
        color="#ffcccc" // Light red
      />
      
      {/* SIMULATOR SECTION - light blue */}
      <FloorSection 
        position={[0, -0.015, -8]}
        size={[50, 14]}
        color="#ccddff" // Light blue
      />
      
      {/* Simulator Section Entrance path - blue */}
      <FloorSection 
        position={[25, -0.008, -5]}
        size={[2, 20]}
        color="#4169e1" // Royal blue
      />
      
      {/* Main outer walls based on the floor plan */}
      {/* Horizontal walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <ringGeometry args={[28, 30, 32, 1, 0, Math.PI * 2]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
      
      {/* Tool Grinding Machine Enclosure */}
      <MachineEnclosure 
        position={[24, 0, -8]} 
        size={[6, 5]} 
        label="TOOL GRINDING MACHINE"
      />
      
      {/* Robofil WEDM Enclosure */}
      <MachineEnclosure 
        position={[24, 0, 0]} 
        size={[6, 5]} 
        label="Robofil WEDM"
      />
      
      {/* Makino WEDM Enclosure */}
      <MachineEnclosure 
        position={[24, 0, 7]} 
        size={[6, 5]} 
        label="Makino WEDM"
      />
      
      {/* Interior machine enclosure - bottom section */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 11]} receiveShadow>
        <planeGeometry args={[40, 6]} />
        <meshStandardMaterial color="#f8f8f8" />
      </mesh>
      
      {/* Interior machine enclosure - top section */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -7]} receiveShadow>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial color="#f8f8f8" />
      </mesh>
      
      {/* Main section labels */}
      {/* AC and Electrical Maintenance Room */}
      <Html position={[-20, 5, -10]}>
        <div className="bg-red-100 text-red-800 px-3 py-2 rounded shadow-sm text-sm font-bold whitespace-nowrap">
          AC and ELECTRICAL MAINTENANCE ROOM
        </div>
      </Html>
      
      {/* Simulator Section */}
      <Html position={[0, 5, -12]}>
        <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded shadow-sm text-lg font-bold">
          SIMULATOR SECTION
        </div>
      </Html>
      
      {/* Emergency Exit */}
      <Html position={[25, 5, 0]}>
        <div className="bg-red-500 text-white px-3 py-2 rounded shadow-sm text-sm font-bold">
          Emergency Exit
        </div>
      </Html>
      
      {/* Simulator Section Entrance */}
      <Html position={[25, 5, -10]}>
        <div className="bg-blue-300 text-blue-800 px-3 py-2 rounded shadow-sm text-sm font-bold">
          Simulator Section Entrance
        </div>
      </Html>
      
      {/* Path arrows - correctly placed based on floor plan */}
      <PathArrow start={[-20, 0.1, 4]} end={[-10, 0.1, 4]} color="#ffd700" arrowSize={1.5} />
      <PathArrow start={[0, 0.1, 4]} end={[10, 0.1, 4]} color="#ffd700" arrowSize={1.5} />
      
      {/* Blue arrows for simulator entrance */}
      <BluePathArrow start={[25, 0.1, -15]} end={[25, 0.1, -10]} arrowSize={1.5} />
      <BluePathArrow start={[25, 0.1, -5]} end={[25, 0.1, 0]} arrowSize={1.5} />
      
      {/* Workstation tables - precisely positioned as per floor plan */}
      {/* Upper Section - workstation tables matching the floor plan */}
      <WorkstationTable position={[-19, 0, -4]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[-14, 0, -6]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[-9, 0, -3]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[-3, 0, -7]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[3, 0, -4]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[8, 0, -7]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[14, 0, -5]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      
      {/* Bottom Section - workstation tables precisely positioned */}
      <WorkstationTable position={[-15, 0, 7]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[-8, 0, 7]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[0, 0, 7]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[8, 0, 7]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      <WorkstationTable position={[15, 0, 7]} rotation={[0, Math.PI/4, 0]} scale={[2, 0.1, 1]} />
      
      {/* Tool setting table */}
      <ToolSettingTable position={[0, 0, -4]} rotation={[0, 0, 0]} scale={[2, 0.1, 0.8]} />
      
      {/* Machine accessories - positioned exactly as per floor plan */}
      <MachineAccessory position={[-17, 0, -2]} />
      <MachineAccessory position={[-12, 0, -8]} />
      <MachineAccessory position={[-6, 0, -10]} />
      <MachineAccessory position={[0, 0, -10]} />
      <MachineAccessory position={[5, 0, -3]} />
      <MachineAccessory position={[11, 0, -2]} />
      <MachineAccessory position={[16, 0, -4]} />
      <MachineAccessory position={[-13, 0, 14]} />
      <MachineAccessory position={[-7, 0, 14]} />
      <MachineAccessory position={[0, 0, 14]} />
      <MachineAccessory position={[7, 0, 14]} />
      <MachineAccessory position={[13, 0, 14]} />
      
      {/* Rack section - positioned correctly as per floor plan */}
      <Rack position={[18, 0, 11]} rotation={[0, 0, 0]} size={[2, 3, 6]} />
      
      {/* Supervisor section - positioned correctly as per floor plan */}
      <SupervisorDesk position={[18, 0, 4]} rotation={[0, Math.PI/2, 0]} />
      
      {/* Main Paths (grey) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 4]}>
        <planeGeometry args={[50, 4]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
    </>
  );
};

// Sparkline Options
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
                position: [0, 50, 0.1], // Positioned to give a perfect top-down view
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
              <PerspectiveCamera makeDefault position={[0, 50, 0.1]} />
              
              <ambientLight intensity={0.5} />
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
              <hemisphereLight intensity={0.3} />

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
              </Suspense>

              <OrbitControls
                target={[0, 0, 0]}
                maxPolarAngle={Math.PI / 2.2}
                minDistance={10}
                maxDistance={60}
                enableDamping={true}
                dampingFactor={0.05}
              />

              <fog attach="fog" args={['#f0f0f0', 60, 100]} />
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