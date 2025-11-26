import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Loader, SpotLight, useHelper } from '@react-three/drei';
import * as THREE from 'three';

// Import custom components
import FactoryFloor from './FactoryFloor';
import AdvancedMachine from './AdvancedMachine';
import CameraController from './CameraController';

// Factory scene component that orchestrates all 3D elements
const FactoryScene = ({ 
  machines = [], 
  onMachineSelect, 
  selectedMachine,
  className,
  cameraView = 'overview'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [viewDetails, setViewDetails] = useState(false); // Start with simplified view for performance
  const [quality, setQuality] = useState('medium'); // 'low', 'medium', 'high'

  // Define machine positions in a grid layout
  const getMachinePosition = (index, total) => {
    // Create a grid layout based on machine count
    const gridSize = Math.ceil(Math.sqrt(total));
    const spacing = 15; // space between machines
    
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    // Calculate center offset to keep grid centered
    const offset = ((gridSize - 1) * spacing) / 2;
    
    return [
      col * spacing - offset,
      0,
      row * spacing - offset
    ];
  };
  
  // Calculate rotations to make machines face the center
  const getMachineRotation = (position) => {
    if (position[0] === 0 && position[2] === 0) {
      return [0, 0, 0]; // Center machine doesn't rotate
    }
    
    // Calculate angle to face center
    const angle = Math.atan2(position[0], position[2]);
    return [0, angle + Math.PI, 0];
  };

  useEffect(() => {
    // Simulate loading assets with a shorter timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Get pixel ratio based on quality setting
  const getPixelRatio = () => {
    switch(quality) {
      case 'high': return [1, 2];
      case 'medium': return [1, 1.5];
      case 'low': default: return [0.8, 1];
    }
  };

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Quality controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center">
        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-l">Quality:</span>
        {["low", "medium", "high"].map((q) => (
          <button 
            key={q}
            className={`px-2 py-1 text-xs ${quality === q ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} ${q === "low" ? "" : ""} ${q === "high" ? "rounded-r" : ""}`}
            onClick={() => setQuality(q)}
          >
            {q.charAt(0).toUpperCase() + q.slice(1)}
          </button>
        ))}
      </div>

      <Canvas
        shadows={quality !== 'low'}
        dpr={getPixelRatio()}
        gl={{ 
          antialias: quality !== 'low',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputEncoding: THREE.sRGBEncoding
        }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          {/* Scene lighting */}
          <ambientLight intensity={0.5} />
          
          {/* Main factory lighting - simplified for performance */}
          <Factory3DLighting quality={quality} />
          
          {/* Factory environment */}
          <FactoryFloor size={100} />
          
          {/* Machine display */}
          {machines.map((machine, index) => {
            // Calculate position in the grid
            const position = getMachinePosition(index, machines.length);
            const rotation = getMachineRotation(position);
            
            return (
              <AdvancedMachine
                key={machine.id || index}
                machine={machine}
                position={position}
                rotation={rotation}
                onClick={() => onMachineSelect(machine)}
                isSelected={selectedMachine?.id === machine.id}
              />
            );
          })}
          
          {/* Add factory workers at various positions - only in high quality mode */}
          {viewDetails && quality === 'high' && <FactoryWorkers machinePositions={machines.map((_, i) => getMachinePosition(i, machines.length))} />}
          
          {/* Add factory equipment - only in medium+ quality mode */}
          {viewDetails && quality !== 'low' && <FactoryEquipment />}
          
          {/* Simple environment and atmosphere - no HDR loading */}
          <fog attach="fog" args={['#f0f0f0', 30, 100]} />
          <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0.5} azimuth={0.25} />
          {viewDetails && quality === 'high' && <Stars radius={100} depth={50} count={500} factor={4} fade />}
          
          {/* Camera controller */}
          <CameraController 
            view={cameraView}
            selectedMachine={selectedMachine}
          />
        </Suspense>
      </Canvas>
      
      {/* UI Controls */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button 
          className={`p-2 rounded-full ${viewDetails ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setViewDetails(!viewDetails)}
          title={viewDetails ? "Hide details" : "Show details"}
        >
          {viewDetails ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
      
      {/* Loading indicator */}
      <Loader 
        active={isLoading}
        dataInterpolation={(p) => `Loading factory ${p.toFixed(0)}%`}
        containerStyles={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)'
        }}
        innerStyles={{
          backgroundColor: '#1e293b',
          color: '#fff'
        }}
        barStyles={{
          backgroundColor: '#38bdf8'
        }}
      />
    </div>
  );
};

// Factory lighting setup
const Factory3DLighting = ({ quality = 'medium' }) => {
  // References for the lights to apply helpers if needed
  const spotLightRef1 = React.useRef();
  const mainLightRef = React.useRef();
  
  // Determine number of lights based on quality
  const lightCount = quality === 'high' ? 4 : quality === 'medium' ? 2 : 1;
  
  return (
    <>
      {/* Directional light (main light) */}
      <directionalLight
        ref={mainLightRef}
        position={[20, 30, 20]}
        intensity={0.8}
        castShadow={quality !== 'low'}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />
      
      {/* Additional lights only added for medium and high quality */}
      {lightCount >= 2 && (
        <SpotLight
          ref={spotLightRef1}
          position={[25, 15, 25]}
          angle={Math.PI / 6}
          penumbra={0.5}
          intensity={0.4}
          distance={60}
          castShadow={quality === 'high'}
          shadow-bias={-0.0001}
          attenuation={5}
          anglePower={5}
          color="#ffffff"
        />
      )}
      
      {lightCount >= 3 && (
        <SpotLight
          position={[-25, 15, 25]}
          angle={Math.PI / 6}
          penumbra={0.5}
          intensity={0.4}
          distance={60}
          castShadow={quality === 'high'}
          shadow-bias={-0.0001}
          attenuation={5}
          anglePower={5}
          color="#ffffff"
        />
      )}
      
      {lightCount >= 4 && (
        <SpotLight
          position={[0, 15, -25]}
          angle={Math.PI / 6}
          penumbra={0.5}
          intensity={0.4}
          distance={60}
          castShadow={quality === 'high'}
          shadow-bias={-0.0001}
          attenuation={5}
          anglePower={5}
          color="#ffffff"
        />
      )}
    </>
  );
};

// Factory workers component
const FactoryWorkers = ({ machinePositions = [] }) => {
  // Create simple worker models at some machine positions
  return (
    <>
      {machinePositions.map((position, index) => {
        // Only place workers at some machines (every third one for performance)
        if (index % 3 !== 0) return null;
        
        // Calculate position in front of the machine
        const workerPosition = [
          position[0] + (Math.random() - 0.5) * 3,
          1,
          position[2] + (Math.random() - 0.5) * 3
        ];
        
        return (
          <SimpleWorker 
            key={`worker-${index}`}
            position={workerPosition}
            color={index % 3 === 0 ? "#3b82f6" : index % 3 === 1 ? "#10b981" : "#f59e0b"}
          />
        );
      })}
    </>
  );
};

// Simple worker model
const SimpleWorker = ({ position, color = "#3b82f6" }) => {
  // Create a simple worker model with primitives
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.8, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      
      {/* Safety helmet */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.33, 0.4, 0.3, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// Factory equipment (toolboxes, carts, etc.)
const FactoryEquipment = () => {
  return (
    <group>
      {/* Toolboxes */}
      <Toolbox position={[30, 0, -20]} />
      <Toolbox position={[-25, 0, 25]} />
      
      {/* Workbench with tools */}
      <Workbench position={[35, 0, 0]} rotation={[0, Math.PI/4, 0]} />
      <Workbench position={[-35, 0, -10]} rotation={[0, -Math.PI/3, 0]} />
      
      {/* Material racks - reduced for better performance */}
      <MaterialRack position={[40, 0, -30]} rotation={[0, Math.PI/2, 0]} />
      
      {/* Forklift */}
      <Forklift position={[0, 0, 35]} rotation={[0, Math.PI, 0]} />
    </group>
  );
};

// Toolbox component
const Toolbox = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Main body */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 1]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Drawers - simplified to one drawer for performance */}
      <mesh position={[0, 0.5, 0.05]} castShadow>
        <boxGeometry args={[1.9, 0.4, 0.1]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Handle */}
      <mesh position={[0, 0.5, 0.15]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// Workbench component
const Workbench = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Table top */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.3, 2.5]} />
        <meshStandardMaterial color="#78716c" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Legs - simplified to two legs for performance */}
      {[
        [-2.2, 1.5, 0], 
        [2.2, 1.5, 0]
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.2, 3, 2]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      
      {/* Tools on bench */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[1, 0.2, 1.5]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Material rack component
const MaterialRack = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 6, 0.2]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Shelves - simplified to one shelf for performance */}
      <mesh position={[0, 3, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.1, 1.2]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Materials on shelves */}
      <mesh position={[0, 3, 0.7]} castShadow>
        <boxGeometry args={[2.5, 0.8, 0.6]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// Forklift component
const Forklift = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Base and cabin combined for performance */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 2.5, 4]} />
        <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Lift mechanism */}
      <mesh position={[0, 2, 2]} castShadow>
        <boxGeometry args={[1.5, 3, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Forks combined for performance */}
      <mesh position={[0, 1, 2.5]} castShadow>
        <boxGeometry args={[1.2, 0.1, 1.5]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

export default FactoryScene; 