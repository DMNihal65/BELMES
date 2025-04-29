import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Sky, Stars, Loader, SpotLight, useHelper, useGLTF } from '@react-three/drei';
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
  const [viewDetails, setViewDetails] = useState(true);

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
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputEncoding: THREE.sRGBEncoding
        }}
      >
        <Suspense fallback={null}>
          {/* Scene lighting */}
          <ambientLight intensity={0.4} />
          
          {/* Main factory lighting */}
          <Factory3DLighting />
          
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
          
          {/* Add factory workers at various positions */}
          {viewDetails && <FactoryWorkers machinePositions={machines.map((_, i) => getMachinePosition(i, machines.length))} />}
          
          {/* Add factory equipment */}
          {viewDetails && <FactoryEquipment />}
          
          {/* Environment and atmosphere */}
          <Environment preset="warehouse" />
          <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0.5} azimuth={0.25} />
          {viewDetails && <Stars radius={100} depth={50} count={1000} factor={4} fade />}
          
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
const Factory3DLighting = () => {
  // References for the lights to apply helpers if needed
  const spotLightRef1 = React.useRef();
  const spotLightRef2 = React.useRef();
  const spotLightRef3 = React.useRef();
  const spotLightRef4 = React.useRef();
  
  // Uncomment to show light helpers during development
  // useHelper(spotLightRef1, THREE.SpotLightHelper, 'white');
  // useHelper(spotLightRef2, THREE.SpotLightHelper, 'white');
  // useHelper(spotLightRef3, THREE.SpotLightHelper, 'white');
  // useHelper(spotLightRef4, THREE.SpotLightHelper, 'white');
  
  return (
    <>
      {/* Directional light (main light) */}
      <directionalLight
        position={[20, 30, 20]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />
      
      {/* Factory spotlights */}
      <SpotLight
        ref={spotLightRef1}
        position={[25, 15, 25]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.5}
        distance={60}
        castShadow
        shadow-bias={-0.0001}
        attenuation={5}
        anglePower={5}
        color="#ffffff"
      />
      
      <SpotLight
        ref={spotLightRef2}
        position={[-25, 15, 25]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.5}
        distance={60}
        castShadow
        shadow-bias={-0.0001}
        attenuation={5}
        anglePower={5}
        color="#ffffff"
      />
      
      <SpotLight
        ref={spotLightRef3}
        position={[25, 15, -25]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.5}
        distance={60}
        castShadow
        shadow-bias={-0.0001}
        attenuation={5}
        anglePower={5}
        color="#ffffff"
      />
      
      <SpotLight
        ref={spotLightRef4}
        position={[-25, 15, -25]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.5}
        distance={60}
        castShadow
        shadow-bias={-0.0001}
        attenuation={5}
        anglePower={5}
        color="#ffffff"
      />
    </>
  );
};

// Factory workers component
const FactoryWorkers = ({ machinePositions = [] }) => {
  // Create simple worker models at some machine positions
  return (
    <>
      {machinePositions.map((position, index) => {
        // Only place workers at some machines (every other one)
        if (index % 2 !== 0) return null;
        
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
      
      {/* Material racks */}
      <MaterialRack position={[40, 0, -30]} rotation={[0, Math.PI/2, 0]} />
      <MaterialRack position={[-40, 0, 30]} rotation={[0, -Math.PI/2, 0]} />
      
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
      
      {/* Drawers */}
      {[0, 0.5, 1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.05]} castShadow>
          <boxGeometry args={[1.9, 0.4, 0.1]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      
      {/* Handles */}
      {[0, 0.5, 1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.15]} castShadow>
          <boxGeometry args={[0.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
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
      
      {/* Legs */}
      {[
        [-2.2, 1.5, -1], 
        [2.2, 1.5, -1], 
        [-2.2, 1.5, 1], 
        [2.2, 1.5, 1]
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      
      {/* Tools on bench */}
      <mesh position={[-1.5, 3.2, 0]} castShadow>
        <boxGeometry args={[1, 0.2, 1.5]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>
      
      <mesh position={[1, 3.2, 0.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
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
      
      {/* Shelves */}
      {[1, 3, 5].map((y, i) => (
        <mesh key={i} position={[0, y, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.1, 1.2]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      
      {/* Materials on shelves */}
      <mesh position={[0, 1, 0.7]} castShadow>
        <boxGeometry args={[3, 0.5, 0.8]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, 3, 0.7]} castShadow>
        <boxGeometry args={[2.5, 0.8, 0.6]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, 5, 0.7]} castShadow>
        <boxGeometry args={[3, 0.3, 0.8]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// Forklift component
const Forklift = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1, 4]} />
        <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[0, 2, -1]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Lift mechanism */}
      <mesh position={[0, 2, 2]} castShadow>
        <boxGeometry args={[1.5, 3, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Forks */}
      <mesh position={[-0.5, 1, 2.5]} castShadow>
        <boxGeometry args={[0.2, 0.1, 1.5]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0.5, 1, 2.5]} castShadow>
        <boxGeometry args={[0.2, 0.1, 1.5]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Wheels */}
      {[
        [-1, 0.5, -1.5], 
        [1, 0.5, -1.5], 
        [-1, 0.5, 1.5], 
        [1, 0.5, 1.5]
      ].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI/2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

export default FactoryScene; 