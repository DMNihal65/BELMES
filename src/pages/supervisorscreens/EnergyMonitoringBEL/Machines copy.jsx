import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment, Grid } from '@react-three/drei';
import { Typography, Button, Spin, Space, Badge } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined } from '@ant-design/icons';
import useEnergyStore from '../../../store/energyMonitoring';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import styled from 'styled-components';
import MachineOverlay from './MachineOverlay';
import Productivity from './Productivity';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBEL';
import { MeshStandardMaterial } from 'three';

const { Title, Text } = Typography;

const MachinesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
  padding: 20px;
  perspective: 2000px;
`;

const MachineWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const Machine3D = styled.div`
  position: relative;
  width: 250px;
  height: 220px;
  transform-style: preserve-3d;
  transform: rotateX(-20deg) rotateY(45deg);
  transition: all 0.8s ease;
  cursor: pointer;

  &:hover {
    transform: rotateX(-20deg) rotateY(225deg);
  }
`;

// Machine base/stand
const MachineBase = styled.div`
  position: absolute;
  width: 250px;
  height: 30px;
  background: #1a1a1a;
  bottom: 0;
  transform: rotateX(90deg) translateZ(110px);
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
`;

// Main machine body
const MachineBody = styled.div`
  position: absolute;
  width: 250px;
  height: 220px;
  background: linear-gradient(145deg, #2c3e50, #34495e);
  transform-style: preserve-3d;

  &::before {
    content: '';
    position: absolute;
    width: 180px;
    height: 140px;
    background: #95a5a6;
    top: 30px;
    left: 35px;
    border: 8px solid #2c3e50;
    border-radius: 5px;
  }
`;

// Machine door
const MachineDoor = styled.div`
  position: absolute;
  width: 250px;
  height: 220px;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  transform: translateZ(2px);
  border-radius: 10px;
  border: 2px solid #1a1a1a;
`;

// Side panel with ventilation
const MachineSide = styled.div`
  position: absolute;
  width: 40px;
  height: 220px;
  background: #2c3e50;
  transform: rotateY(90deg) translateZ(210px);
  border-radius: 5px;
  
  &::after {
    content: '';
    position: absolute;
    width: 30px;
    height: 160px;
    background: repeating-linear-gradient(
      0deg,
      #1a1a1a,
      #1a1a1a 5px,
      #2c3e50 5px,
      #2c3e50 10px
    );
    top: 30px;
    left: 5px;
    border-radius: 3px;
  }
`;

// Control panel with display and buttons
const ControlPanel = styled.div`
  position: absolute;
  width: 80px;
  height: 140px;
  background: #ecf0f1;
  transform: rotateY(-90deg) translateZ(30px) translateY(40px);
  border-radius: 8px;
  border: 2px solid #1a1a1a;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 10px;
    right: 10px;
    height: 40px;
    background: #2c3e50;
    border-radius: 5px;
    border: 1px solid #1a1a1a;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 15px;
    left: 15px;
    right: 15px;
    height: 60px;
    background: repeating-linear-gradient(
      to bottom,
      #7f8c8d 0px,
      #7f8c8d 15px,
      #95a5a6 15px,
      #95a5a6 30px
    );
    border-radius: 5px;
    border: 1px solid #1a1a1a;
  }
`;

const StatusLight = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  background: #2ecc71;
  border-radius: 50%;
  top: 15px;
  right: 15px;
  box-shadow: 0 0 10px #2ecc71;
  border: 1px solid #27ae60;
`;

const MachineName = styled.div`
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  color: #2c3e50;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
`;

// Rotating Machines Component
function RotatingMachines({ children, speed = 0.0005 }) {
  const groupRef = useRef();
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += speed;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Status Legend Component
const StatusLegend = () => (
  <div style={{
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'white',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000
  }}>
    <Space direction="vertical">
      <Space>
        <Badge color="#22c55e" />
        <Text>Production (2)</Text>
      </Space>
      <Space>
        <Badge color="#eab308" />
        <Text>Idle/On (1)</Text>
      </Space>
      <Space>
        <Badge color="#94A3B8" />
        <Text>Off (0)</Text>
      </Space>
    </Space>
  </div>
);

// Status colors configuration with updated comments
const STATUS_COLORS = {
  0: "#94A3B8",      // Grey
  1: "#eab308",      // Yellow for IDLE/ON status (1)
  2: "#22c55e",      // Green for PRODUCTION status (2)
  default: "#94A3B8" // Grey for unknown status
};

// Central Hub Component
function CentralHub() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4, 4, 0.5, 32]} />
        <meshPhysicalMaterial 
          color="#1e40af"
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>
      <Html position={[0, 2, 0]} center>
        <div style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '20px',
          whiteSpace: 'nowrap',
          transform: 'scale(1.5)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '2px solid #3b82f6'
        }}>
          FAB-C
        </div>
      </Html>
    </group>
  );
}

// Enhanced CNC Machine Model Component
function MachineModel({ 
  position, 
  data, 
  onClick, 
  isHovered,
  onPointerOver, 
  onPointerOut,
  rotation 
}) {
  const hoverScale = isHovered ? 1.1 : 1;
  const yOffset = isHovered ? 0.5 : 0;
  const statusColor = STATUS_COLORS[data.status] || STATUS_COLORS.default;
  
  const { opacity, modelScale, modelY } = useSpring({
    opacity: isHovered ? 1 : 0.3,
    modelScale: isHovered ? hoverScale : 1,
    modelY: isHovered ? yOffset : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Updated material properties for lighter appearance
  const commonMaterialProps = {
    color: statusColor,
    metalness: 0.4,    // Reduced metalness
    roughness: 0.3,    // Reduced roughness for more shine
    clearcoat: 0.8,    // Increased clearcoat
    transparent: true,
    opacity: 1,
    envMapIntensity: 0.8, // Increased environment map intensity
    reflectivity: 0.7,    // Added reflectivity
  };

  return (
    <animated.group
      position-y={modelY}
      scale={modelScale}
      position={position}
      rotation={rotation}
      onClick={() => onClick(data)}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      opacity={opacity}
    >
      {/* Heavy Base Platform */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.6, 4]} />
        <meshPhysicalMaterial {...commonMaterialProps} />
      </mesh>

      {/* Main Machine Body */}
      <group position={[0, 2.5, 0]}>
        {/* Main Enclosure */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[4.5, 4, 3.5]} />
          <meshPhysicalMaterial {...commonMaterialProps} />
        </mesh>

        {/* Front Glass Panel */}
        <mesh position={[0, 0, 1.76]} castShadow>
          <boxGeometry args={[4.2, 3.8, 0.1]} />
          <meshPhysicalMaterial 
            {...commonMaterialProps}
            transparent={true}
            opacity={0.4}
            metalness={0.1}
            roughness={0.1}
            transmission={0.6}
            thickness={0.5}
          />
        </mesh>

        {/* Top Cover with Slope */}
        <mesh position={[0, 2.1, -0.3]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[4.5, 0.2, 4]} />
          <meshPhysicalMaterial {...commonMaterialProps} />
        </mesh>

        {/* Control Panel (Right Side) */}
        <group position={[2.26, 0, 0]}>
          {/* Main Panel Housing */}
          <mesh position={[0.2, 0, -0.5]} castShadow>
            <boxGeometry args={[0.4, 3.5, 2]} />
            <meshPhysicalMaterial 
              {...commonMaterialProps}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>

          {/* Screen */}
          <mesh position={[0.41, 0.5, -0.5]} castShadow>
            <boxGeometry args={[0.05, 1.5, 1.2]} />
            <meshPhysicalMaterial 
              {...commonMaterialProps}
              emissive={statusColor}
              emissiveIntensity={0.5}
              metalness={0.1}
              roughness={0.1}
            />
          </mesh>

          {/* Control Panel Buttons */}
          <group position={[0.41, -1, -0.5]}>
            {[[-0.3, 0], [0, 0], [0.3, 0], [-0.3, -0.3], [0, -0.3], [0.3, -0.3]].map(([x, y], i) => (
              <mesh key={i} position={[0, y, x]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
                <meshPhysicalMaterial 
                  color="#E2E8F0"
                  metalness={0.5}
                  roughness={0.5}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* Work Area */}
        <group position={[0, -0.5, 0]}>
          {/* X-Axis Rail */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[3.8, 0.2, 0.4]} />
            <meshPhysicalMaterial 
              color="#CBD5E1"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Y-Axis Rail */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.4, 0.2, 2.8]} />
            <meshPhysicalMaterial 
              color="#CBD5E1"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Spindle Head */}
          <group position={[0, 0.5, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 1, 0.8]} />
              <meshPhysicalMaterial {...commonMaterialProps} />
            </mesh>

            {/* Spindle */}
            <mesh position={[0, -0.7, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.12, 0.8, 16]} />
              <meshPhysicalMaterial 
                color="#94A3B8"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Tool Holder */}
            <mesh position={[0, -1.2, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
              <meshPhysicalMaterial 
                color="#64748B"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          </group>
        </group>

        {/* Chip Conveyor */}
        <mesh position={[0, -1.8, 1.5]} castShadow>
          <boxGeometry args={[4, 0.3, 0.5]} />
          <meshPhysicalMaterial 
            color="#64748B"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* Machine Label */}
      <Html position={[0, 5, 0]} center>
        <div style={{
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px', 
              color: '#1a202c' 
            }}>
              {data.name}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#4a5568' 
            }}>
              {/* WC: {data.workCenter} */}
            </div>
          </div>
        </div>
      </Html>

      {/* Status Glow Effect */}
      {isHovered && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </animated.group>
  );
}

// Enhanced Floor Component
function EnhancedFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          metalness={0.8}
          roughness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[100, 100]}
        cellSize={5}
        cellThickness={1}
        cellColor="#6366f1"
        sectionSize={20}
        sectionThickness={1.5}
        sectionColor="#3730a3"
        fadeDistance={80}
        fadeStrength={1}
        followCamera={false}
      />
    </group>
  );
}

// Enhanced Lighting Setup
function EnhancedLighting() {
  return (
    <>
      <ambientLight intensity={0.6} /> {/* Increased ambient light */}
      <directionalLight
        position={[10, 20, 15]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[20, 10, -20]} intensity={0.7} color="#ffffff" />
      <pointLight position={[-20, 10, 20]} intensity={0.7} color="#ffffff" />
      <spotLight
        position={[0, 20, 0]}
        angle={0.5}
        penumbra={1}
        intensity={1}
        color="#ffffff"
        castShadow
      />
      <hemisphereLight
        skyColor="#ffffff"
        groundColor="#bbbbff"
        intensity={0.5}
      />
    </>
  );
}

// Add a simple custom ErrorBoundary component
class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("3D Rendering Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Main Machines Component
const MachinesVisualization = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [hoveredMachine, setHoveredMachine] = useState(null);
  const [renderError, setRenderError] = useState(false);
  const [hasInitialized3D, setHasInitialized3D] = useState(false);
  const [showProductivity, setShowProductivity] = useState(false);

  // Get machine data from the store
  const { fetchMachineNames, startMachineStatusPolling, cleanup, machineNames, isLoading } = useEnergyMonitoringBelStore();
  
  // Set up SSE connection
  useEffect(() => {
    // Initial fetch and SSE setup
    fetchMachineNames();
    const cleanupFn = startMachineStatusPolling();
    
    // Cleanup on unmount
    return () => {
      cleanupFn();
      cleanup();
    };
  }, [fetchMachineNames, startMachineStatusPolling, cleanup]);

  // Reset renderError when data changes
  useEffect(() => {
    if (machineNames && machineNames.length > 0) {
      setRenderError(false);
    }
  }, [machineNames]);

  // Calculate positions in a hexagonal pattern with increased radius
  const getMachinePosition = (index, totalMachines) => {
    const angle = (index / totalMachines) * Math.PI * 2;
    const radius = 20; // Increased radius for more spacing
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return [x, 0, z];
  };

  // Process the machine data from API
  const processedMachines = React.useMemo(() => {
    if (!machineNames || machineNames.length === 0) {
      // Fallback data if API doesn't return anything
      return Array.from({ length: 14 }, (_, i) => ({
        id: i + 1,
        name: `Machine ${i + 1}`,
        status: i % 3, // alternate between 0, 1, 2
        type: 'Default',
        workCenter: i + 15
      }));
    }

    return machineNames.map(machine => {
      // Get the proper machine name - use make from machine_data as the machine name
      const machineName = machine.machine_data?.make || `Machine ${machine.machine_id}`;
      
      return {
        id: machine.machine_id,
        name: machineName, // Use the make field as machine name
        status: machine.status,
        type: machine.machine_data?.type || 'Default',
        // workCenter: machine.machine_data?.work_center || 'N/A',
        model: machine.machine_data?.model || 'Default'
      };
    });
  }, [machineNames]);

  const handleMachineClick = (machine) => {
    console.log("Selected machine:", machine);
    setSelectedMachine(machine);
  };

  if (showProductivity) {
    return <Productivity onBack={() => setShowProductivity(false)} />;
  }

  if (selectedMachine) {
    return (
      <MachineOverlay 
        machineId={selectedMachine.id}
        machineName={selectedMachine.name}
        onBack={() => setSelectedMachine(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingTop: '10px' }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        position: 'absolute',
        top: 10,
        left: 30,
        right: 20,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        maxWidth: 'calc(100% - 40px)',
        margin: '0 auto'
      }}>
        <Title 
          level={2} 
          style={{ 
            margin: 0,
            color: '#000000',
            fontWeight: 600
          }}
        >
          ShopFloor Energy Monitoring
        </Title>
        
        <Button 
          type="primary"
          icon={<BarChartOutlined />}
          onClick={() => setShowProductivity(true)}
          style={{
            backgroundColor: '#52c41a',
            borderRadius: '6px'
          }}
        >
          Productivity
        </Button>
      </div>

      <div style={{ 
        width: '100%', 
        height: 'calc(100vh - 150px)',
        position: 'relative',
        marginTop: '70px'
      }}>
        <StatusLegend />
        <SimpleErrorBoundary fallback={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Typography.Title level={4}>3D Visualization Unavailable</Typography.Title>
            <Typography.Text>There was a problem loading the 3D models.</Typography.Text>
            <div style={{ marginTop: '20px' }}>
              <Button 
                type="primary" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        }>
          <Canvas
            camera={{ position: [0, 35, 45], fov: 45 }}
            shadows
            gl={{ 
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.2
            }}
            onCreated={state => {
              try {
                if (state.gl) {
                  console.log("3D Canvas initialized successfully");
                  setHasInitialized3D(true);
                  
                  // Add event listener for WebGL context lost, but don't immediately set error
                  state.gl.domElement?.addEventListener('webglcontextlost', (event) => {
                    console.warn("WebGL context lost during rendering");
                    // Prevent default behavior which might completely stop rendering
                    event.preventDefault();
                    // Only set error if there's a real problem
                    if (!state.gl.getParameter) {
                      setRenderError(true);
                    }
                  }, false);
                }
              } catch (error) {
                // Only set error for serious errors
                console.error("Critical error during Canvas initialization:", error);
                setRenderError(true);
              }
            }}
          >
            <Suspense fallback={
              <Html center>
                <Spin size="large" />
                <div style={{ marginTop: '10px', color: 'white' }}>Loading 3D models...</div>
              </Html>
            }>
              <color attach="background" args={['#f8fafc']} />
              <EnhancedLighting />
              <EnhancedFloor />
              
              {/* Add Central Hub */}
              <CentralHub />

              <RotatingMachines speed={0.0005}>
                {processedMachines.map((machine, index) => {
                  const position = getMachinePosition(index, processedMachines.length);
                  const angle = (index / processedMachines.length) * Math.PI * 2;
                  
                  return (
                    <MachineModel
                      key={machine.id}
                      position={position}
                      rotation={[0, -angle + Math.PI, 0]}
                      data={machine}
                      onClick={() => handleMachineClick(machine)}
                      isHovered={hoveredMachine === machine.id}
                      onPointerOver={() => setHoveredMachine(machine.id)}
                      onPointerOut={() => setHoveredMachine(null)}
                    />
                  );
                })}
              </RotatingMachines>

              <OrbitControls 
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2.2}
                minDistance={30}
                maxDistance={70}
              />
            </Suspense>
          </Canvas>
        </SimpleErrorBoundary>
      </div>
    </div>
  );
};

export default MachinesVisualization; 