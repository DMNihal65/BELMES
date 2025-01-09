import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Grid,
  Stats,
  Html,
  Text,
  useGLTF,
  SpotLight,
  Box,
  Stage,
  Center
} from '@react-three/drei';
import { Activity, AlertTriangle, ArrowDown, BarChart2 } from 'lucide-react';
import * as THREE from 'three';
import { Selection, EffectComposer, Bloom, SelectiveBloom } from '@react-three/postprocessing';

// CNC Machine Component with more realistic model
const CNCMachine = ({ position, rotation, status, onClick, isSelected, name }) => {
  const [isHovered, setIsHovered] = useState(false);
  const machineRef = useRef();
  
  // Add rotation animation
  useFrame((state, delta) => {
    if (machineRef.current) {
      machineRef.current.rotation.y += delta * 0.1; // Slow rotation speed
    }
  });

  return (
    <group 
      ref={machineRef}
      position={position} 
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      {/* Enhanced Base with chamfered edges */}
      <group position={[0, 0.2, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[4.5, 0.4, 3.5]} />
          <meshStandardMaterial 
            color={isSelected ? "#60a5fa" : "#ffffff"}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        {/* Base trim */}
        <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.7, 0.1, 3.7]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Main Machine Body */}
      <group position={[0, 1.7, 0]}>
        {/* Main Column with rounded corners */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[4, 3, 3]} />
          <meshStandardMaterial 
            color={isSelected ? "#60a5fa" : "#f0f9ff"}
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>

        {/* Detailed front panel with controls */}
        <group position={[2, 0, 0]}>
          {/* Main panel frame */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[0.2, 3, 3]} />
            <meshStandardMaterial 
              color={isSelected ? "#3b82f6" : "#e0f2fe"}
              metalness={0.5}
              roughness={0.5}
            />
          </mesh>

          {/* Large viewing window */}
          <mesh position={[0.1, 0, 0]} receiveShadow>
            <boxGeometry args={[0.05, 2.5, 2.5]} />
            <meshStandardMaterial 
              color="#bfdbfe"
              transparent
              opacity={0.3}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Control panel with angled display */}
          <group position={[0.2, -0.8, 0.8]} rotation={[0.3, 0, 0]}>
            <mesh receiveShadow castShadow>
              <boxGeometry args={[0.3, 1, 1.2]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>
            
            {/* Main screen */}
            <mesh position={[0.16, 0, 0]} receiveShadow>
              <planeGeometry args={[0.8, 0.6]} />
              <meshStandardMaterial 
                color={status === 'running' ? "#22c55e" : status === 'idle' ? "#eab308" : "#ef4444"}
                emissive={status === 'running' ? "#22c55e" : status === 'idle' ? "#eab308" : "#ef4444"}
                emissiveIntensity={0.5}
              />
            </mesh>

            {/* Control buttons */}
            <group position={[0.16, -0.4, 0]}>
              {[0, 1, 2].map((i) => (
                <mesh key={i} position={[0, i * 0.15, 0]} receiveShadow>
                  <circleGeometry args={[0.04, 32]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        {/* Tool carousel with visible tools */}
        <group position={[0, 1.6, -1.4]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.4, 16]} />
            <meshStandardMaterial 
              color={isSelected ? "#3b82f6" : "#e0f2fe"}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          {/* Tool holders */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh 
              key={i}
              position={[
                0.6 * Math.cos(i * Math.PI / 4),
                0,
                -0.6 * Math.sin(i * Math.PI / 4)
              ]}
              rotation={[0, i * Math.PI / 4, 0]}
              receiveShadow
              castShadow
            >
              <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Enhanced spindle head assembly */}
        <group position={[0, 0, 0.5]}>
          {/* Main spindle housing */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[1.2, 1.8, 1.2]} />
            <meshStandardMaterial 
              color={isSelected ? "#3b82f6" : "#f0f9ff"}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          
          {/* Spindle mechanism */}
          <group position={[0, -1, 0]}>
            {/* Main spindle */}
            <mesh receiveShadow castShadow>
              <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Spindle collar */}
            <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Machine branding and details */}
        <group position={[-2, 0, 1.51]}>
          {/* Logo plate */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[0.5, 0.3, 0.01]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Status indicator light */}
      <pointLight
        position={[2.2, 3, 1.5]}
        color={status === 'running' ? "#22c55e" : status === 'idle' ? "#eab308" : "#ef4444"}
        intensity={2}
        distance={3}
      />

      {/* Hover label */}
      {isHovered && (
        <Html
          position={[0, 4, 0]}
          center
          style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {name}
        </Html>
      )}
    </group>
  );
};

const FactoryStats = ({ machines }) => {
  const running = machines.filter(m => m.status === 'running').length;
  const idle = machines.filter(m => m.status === 'idle').length;
  const stopped = machines.filter(m => m.status === 'stopped').length;
  const total = machines.length;
  
  return (
    <div style={{ top: '10px' }} className="absolute right-4 bg-white/95 p-4 rounded-lg shadow-lg border border-blue-100 w-64">
      <h3 className="text-sm font-bold mb-2 text-gray-800 flex items-center gap-1">
        <BarChart2 className="w-4 h-4 text-blue-500" />
        Factory Status
      </h3>
      
      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div 
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${(running/total) * 100}%` }}
            />
            <div 
              className="bg-yellow-500 transition-all duration-500"
              style={{ width: `${(idle/total) * 100}%` }}
            />
            <div 
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${(stopped/total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600 ml-1">Running</span>
          </div>
          <span className="font-semibold text-gray-800">{running}</span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600 ml-1">Idle</span>
          </div>
          <span className="font-semibold text-gray-800">{idle}</span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600 ml-1">Stopped</span>
          </div>
          <span className="font-semibold text-gray-800">{stopped}</span>
        </div>
      </div>

      {/* Efficiency */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Efficiency</span>
          <span className="font-medium text-blue-600">{Math.round((running/total) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

const FactoryOverview = ({ onMachineSelect, machineData }) => {
  const [selectedMachine, setSelectedMachine] = useState(null);

  const machines = machineData || [
    {
      id: 'DMG-001',
      name: 'DMG DMU 60 eVo linear',
      position: [-8, 0, 0], 
      status: 'running',
    },
    {
      id: 'DMG-002',
      name: 'DMG DMU 60T mB',
      position: [8, 0, 0],
      status: 'idle',
    },
    {
      id: 'HMC-001',
      name: 'Horizontal Machining Center 01',
      position: [0, 0, 0],
      status: 'stopped',
    },
  ];

  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    if (onMachineSelect) {
      onMachineSelect(machine);
    }
  };

  return (
    <div className="w-full h-[600px] relative">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#f8fafc']} />
        
        <PerspectiveCamera makeDefault position={[0, 15, 25]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={10}
          maxDistance={40}
          autoRotate={false} 
          autoRotateSpeed={0.5}
        />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          <Selection>
            {machines.map((machine) => (
              <CNCMachine
                key={machine.id}
                position={machine.position}
                rotation={[0, Math.PI / 6, 0]}
                status={machine.status}
                isSelected={selectedMachine?.id === machine.id}
                onClick={() => handleMachineSelect(machine)}
                name={machine.name}
              />
            ))}
          </Selection>

          {/* Factory floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>

          {/* Factory name */}
          <Text
            position={[0, 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={3}
            color="#94a3b8"
          >
            FACTORY OVERVIEW
          </Text>

          <Grid
            args={[100, 100]}
            position={[0, 0.01, 0]}
            cellSize={5}
            cellThickness={1}
            cellColor="#94a3b8"
            sectionSize={5}
          />
        </Suspense>

        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>

      <FactoryStats machines={machines} />
    </div>
  );
};

export default FactoryOverview;