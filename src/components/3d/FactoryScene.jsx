import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { 
  Environment, 
  Sky, 
  Stars, 
  Loader, 
  SpotLight, 
  useHelper, 
  Text,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Import custom components
import FactoryFloor from './FactoryFloor';
import AdvancedMachine from './AdvancedMachine';
import CameraController from './CameraController';

// Model loader components
const TurningMachineModel = ({ position, rotation, scale = 0.5, onClick, isSelected, machineData }) => {
  const gltf = useLoader(GLTFLoader, '/turning.glb');
  const model = useRef();
  const statusLightRef = useRef();
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PRODUCTION': return '#10b981'; // Green
      case 'ON': return '#f59e0b';         // Amber/yellow
      case 'IDLE': return '#3b82f6';       // Blue
      case 'SETUP': return '#8b5cf6';      // Purple
      case 'ERROR': return '#ef4444';      // Red
      case 'MAINTENANCE': return '#6366f1'; // Indigo
      case 'OFF': default: return '#6b7280'; // Gray
    }
  };
  
  // Status animation
  useFrame((state) => {
    if (statusLightRef.current && statusLightRef.current.material) {
      const time = state.clock.getElapsedTime();
      
      // Different pulse rates for different statuses
      let pulseRate = 0;
      if (machineData?.status === 'PRODUCTION') pulseRate = 1;
      else if (machineData?.status === 'ERROR') pulseRate = 3;
      else if (machineData?.status === 'ON') pulseRate = 0.5;
      
      if (pulseRate > 0) {
        statusLightRef.current.material.emissiveIntensity = 
          0.5 + Math.sin(time * pulseRate * Math.PI) * 0.5;
      }
    }
  });
  
  useEffect(() => {
    if (model.current) {
      // Apply any model-specific adjustments if needed
      model.current.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // If machine is OFF or has error, adjust appearance
          if (machineData?.status === 'OFF' && node.material) {
            const material = node.material.clone();
            material.transparent = true;
            material.opacity = 0.8;
            node.material = material;
          } else if (machineData?.status === 'ERROR' && node.material) {
            const material = node.material.clone();
            material.emissive = new THREE.Color('#ef4444');
            material.emissiveIntensity = 0.1;
            node.material = material;
          }
        }
      });
    }
  }, [machineData?.status]);
  
  const statusColor = getStatusColor(machineData?.status);
  
  // Calculate appropriate status indicator height for the larger scale
  const statusHeight = 0.5; // Adjust based on actual model height
  
  return (
    <group 
      ref={model} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
      onClick={onClick}
    >
      <primitive object={gltf.scene.clone()} />
      
      {/* Status light */}
      <group position={[0, statusHeight, 0]}>
        <mesh 
          ref={statusLightRef}
          position={[0, 0, 0]}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.6}
          />
        </mesh>
        
        {/* Status ring */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.12, 0.02, 16, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      
      {isSelected && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      )}
      
      {machineData && (
        <Html
          position={[0, statusHeight + 0.2, 0]}
          center
          distanceFactor={15}
        >
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200 w-40">
            <div className="text-sm font-bold mb-1 truncate">{machineData.name}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs font-medium">Status:</div>
              <div 
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  machineData.status === 'PRODUCTION' ? 'bg-green-100 text-green-800' :
                  machineData.status === 'ON' ? 'bg-yellow-100 text-yellow-800' :
                  machineData.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                  machineData.status === 'MAINTENANCE' ? 'bg-indigo-100 text-indigo-800' :
                  machineData.status === 'IDLE' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {machineData.status}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const MillingMachineModel = ({ position, rotation, scale = 0.5, onClick, isSelected, machineData }) => {
  const gltf = useLoader(GLTFLoader, '/machine.glb');
  const model = useRef();
  const statusLightRef = useRef();
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PRODUCTION': return '#10b981'; // Green
      case 'ON': return '#f59e0b';         // Amber/yellow
      case 'IDLE': return '#3b82f6';       // Blue
      case 'SETUP': return '#8b5cf6';      // Purple
      case 'ERROR': return '#ef4444';      // Red
      case 'MAINTENANCE': return '#6366f1'; // Indigo
      case 'OFF': default: return '#6b7280'; // Gray
    }
  };
  
  // Status animation
  useFrame((state) => {
    if (statusLightRef.current && statusLightRef.current.material) {
      const time = state.clock.getElapsedTime();
      
      // Different pulse rates for different statuses
      let pulseRate = 0;
      if (machineData?.status === 'PRODUCTION') pulseRate = 1;
      else if (machineData?.status === 'ERROR') pulseRate = 3;
      else if (machineData?.status === 'ON') pulseRate = 0.5;
      
      if (pulseRate > 0) {
        statusLightRef.current.material.emissiveIntensity = 
          0.5 + Math.sin(time * pulseRate * Math.PI) * 0.5;
      }
    }
  });
  
  useEffect(() => {
    if (model.current) {
      // Apply any model-specific adjustments if needed
      model.current.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // If machine is OFF or has error, adjust appearance
          if (machineData?.status === 'OFF' && node.material) {
            const material = node.material.clone();
            material.transparent = true;
            material.opacity = 0.8;
            node.material = material;
          } else if (machineData?.status === 'ERROR' && node.material) {
            const material = node.material.clone();
            material.emissive = new THREE.Color('#ef4444');
            material.emissiveIntensity = 0.1;
            node.material = material;
          }
        }
      });
    }
  }, [machineData?.status]);
  
  const statusColor = getStatusColor(machineData?.status);
  
  // Calculate appropriate status indicator height for the larger scale
  const statusHeight = 0.5; // Adjust based on actual model height
  
  return (
    <group 
      ref={model} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
      onClick={onClick}
    >
      <primitive object={gltf.scene.clone()} />
      
      {/* Status light */}
      <group position={[0, statusHeight , 0]}>
        <mesh 
          ref={statusLightRef}
          position={[0, 0, 0]}
        >
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial 
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.6}
          />
        </mesh>
        
        {/* Status ring */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.1, 0.02, 16, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      
      {isSelected && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      )}
      
      {machineData && (
        <Html
          position={[0, statusHeight + 0.2, 0]}
          center
          distanceFactor={15}
        >
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200 w-40">
            <div className="text-sm font-bold mb-1 truncate">{machineData.name}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs font-medium">Status:</div>
              <div 
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  machineData.status === 'PRODUCTION' ? 'bg-green-100 text-green-800' :
                  machineData.status === 'ON' ? 'bg-yellow-100 text-yellow-800' :
                  machineData.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                  machineData.status === 'MAINTENANCE' ? 'bg-indigo-100 text-indigo-800' :
                  machineData.status === 'IDLE' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {machineData.status}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const EDMMachineModel = ({ position, rotation, scale = 0.5, onClick, isSelected, machineData }) => {
  const gltf = useLoader(GLTFLoader, '/wireedm.glb');
  const model = useRef();
  const statusLightRef = useRef();
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PRODUCTION': return '#10b981'; // Green
      case 'ON': return '#f59e0b';         // Amber/yellow
      case 'IDLE': return '#3b82f6';       // Blue
      case 'SETUP': return '#8b5cf6';      // Purple
      case 'ERROR': return '#ef4444';      // Red
      case 'MAINTENANCE': return '#6366f1'; // Indigo
      case 'OFF': default: return '#6b7280'; // Gray
    }
  };
  
  // Status animation
  useFrame((state) => {
    if (statusLightRef.current && statusLightRef.current.material) {
      const time = state.clock.getElapsedTime();
      
      // Different pulse rates for different statuses
      let pulseRate = 0;
      if (machineData?.status === 'PRODUCTION') pulseRate = 1;
      else if (machineData?.status === 'ERROR') pulseRate = 3;
      else if (machineData?.status === 'ON') pulseRate = 0.5;
      
      if (pulseRate > 0) {
        statusLightRef.current.material.emissiveIntensity = 
          0.5 + Math.sin(time * pulseRate * Math.PI) * 0.5;
      }
    }
  });
  
  useEffect(() => {
    if (model.current) {
      // Apply any model-specific adjustments if needed
      model.current.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // If machine is OFF or has error, adjust appearance
          if (machineData?.status === 'OFF' && node.material) {
            const material = node.material.clone();
            material.transparent = true;
            material.opacity = 0.8;
            node.material = material;
          } else if (machineData?.status === 'ERROR' && node.material) {
            const material = node.material.clone();
            material.emissive = new THREE.Color('#ef4444');
            material.emissiveIntensity = 0.1;
            node.material = material;
          }
        }
      });
    }
  }, [machineData?.status]);
  
  const statusColor = getStatusColor(machineData?.status);
  
  // Calculate appropriate status indicator height for the larger scale
  const statusHeight = 0.5; // Adjust based on actual model height
  
  return (
    <group 
      ref={model} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
      onClick={onClick}
    >
      <primitive object={gltf.scene.clone()} />
      
      {/* Status light */}
      <group position={[0, statusHeight, 0]}>
        <mesh 
          ref={statusLightRef}
          position={[0, 0, 0]}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.6}
          />
        </mesh>
        
        {/* Status ring */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.12, 0.02, 16, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      
      {isSelected && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      )}
      
      {machineData && (
        <Html
          position={[0, statusHeight + 0.15, 0]}
          center
          distanceFactor={15}
        >
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200 w-40">
            <div className="text-sm font-bold mb-1 truncate">{machineData.name}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs font-medium">Status:</div>
              <div 
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  machineData.status === 'PRODUCTION' ? 'bg-green-100 text-green-800' :
                  machineData.status === 'ON' ? 'bg-yellow-100 text-yellow-800' :
                  machineData.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                  machineData.status === 'MAINTENANCE' ? 'bg-indigo-100 text-indigo-800' :
                  machineData.status === 'IDLE' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {machineData.status}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Factory scene component that orchestrates all 3D elements
const FactoryScene = ({ 
  machines = [], 
  onMachineSelect, 
  selectedMachine,
  className,
  cameraView = 'overview'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [viewDetails, setViewDetails] = useState(true); // Start with detailed view
  const [quality, setQuality] = useState('medium'); // 'low', 'medium', 'high'

  // Divide machines into types
  const categorizeMachines = () => {
    // Create categories for milling, turning, and EDM machines
    const millingMachines = machines.filter(m => m.type === 'milling' || m.id % 3 === 0);
    const turningMachines = machines.filter(m => m.type === 'turning' || m.id % 3 === 1);
    const edmMachines = machines.filter(m => m.type === 'edm' || m.id % 3 === 2);
    
    return {
      milling: millingMachines.slice(0, 5), // Limit to 5
      turning: turningMachines.slice(0, 7), // Limit to 7
      edm: edmMachines.slice(0, 2)          // Limit to 2
    };
  };

  // Factory layout based on the provided image
  const getMachinePosition = (type, index) => {
    // Define machine positions based on type and index
    switch(type) {
      case 'turning':
        // Left side of the shop floor
        return [
          -20, // X position (negative = left side)
          2.3,   // Y position (floor level)
          -15 + index * 10 // Z position (spaced evenly in a row with more distance)
        ];
      case 'milling':
        // Right side of the shop floor
        return [
          20, // X position (positive = right side)
          4,  // Y position (floor level)
          -12 + index * 12 // Z position (spaced evenly in a row with more distance)
        ];
      case 'edm':
        // In the EDM room at the far end
        return [
          -10 + index * 20, // X position (centered, with more space between)
          4,               // Y position (floor level)
          -30              // Z position (far end of the room)
        ];
      default:
        return [0, 0, 0];
    }
  };
  
  // Define machine rotation based on position and type
  const getMachineRotation = (type, index) => {
    switch(type) {
      case 'turning':return [0, type === 'turning' ? Math.PI / 20 : -Math.PI / 2, 0];
      case 'milling':
        // Face the center aisle
        return [0, type === 'turning' ? Math.PI / 2 : -Math.PI / 2, 0];
      case 'edm':
        // Face forward
        return [0, type === 'turning' ? Math.PI / 20 : -Math.PI / 2, 0];
      default:
        return [0, 0, 0];
    }
  };

  useEffect(() => {
    // Load actual models
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
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

  // Get categorized machines
  const machinesByType = categorizeMachines();

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
          toneMappingExposure: 1.2
        }}
        camera={{ position: [0, 30, 30], fov: 45 }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          {/* Scene lighting */}
          <ambientLight intensity={0.3} color="#d4d4d8" />
          
          {/* Main factory lighting */}
          <Factory3DLighting quality={quality} />
          
          {/* Environment */}
          {quality !== 'low' && (
            <Environment
              preset="warehouse"
              background={false}
              blur={0.7}
            />
          )}
          
          {/* Factory environment */}
          <FactoryFloor size={80} />
          
          {/* EDM Room - Glass enclosure */}
          <EDMRoom position={[0, 0, -30]} />
          
          {/* Section Labels */}
          <SectionLabels />
          
          {/* Machine display - Turning Machines */}
          {machinesByType.turning.map((machine, index) => {
            const position = getMachinePosition('turning', index);
            const rotation = getMachineRotation('turning', index);
            
            return (
              <TurningMachineModel
                key={machine.id || `turning-${index}`}
                position={position}
                rotation={rotation}
                scale={12.0}
                onClick={() => onMachineSelect(machine)}
                isSelected={selectedMachine?.id === machine.id}
                machineData={machine}
              />
            );
          })}
          
          {/* Machine display - Milling Machines */}
          {machinesByType.milling.map((machine, index) => {
            const position = getMachinePosition('milling', index);
            const rotation = getMachineRotation('milling', index);
            
            return (
              <MillingMachineModel
                key={machine.id || `milling-${index}`}
                position={position}
                rotation={rotation}
                scale={8.0}
                onClick={() => onMachineSelect(machine)}
                isSelected={selectedMachine?.id === machine.id}
                machineData={machine}
              />
            );
          })}
          
          {/* Machine display - EDM Machines */}
          {machinesByType.edm.map((machine, index) => {
            const position = getMachinePosition('edm', index);
            const rotation = getMachineRotation('edm', index);
            
            return (
              <EDMMachineModel
                key={machine.id || `edm-${index}`}
                position={position}
                rotation={rotation}
                scale={12.0}
                onClick={() => onMachineSelect(machine)}
                isSelected={selectedMachine?.id === machine.id}
                machineData={machine}
              />
            );
          })}
          
          {/* Add workbenches and chairs */}
          <ShopFloorFurniture />
          
          {/* Add factory workers at various positions - only in high quality mode */}
          {viewDetails && quality === 'high' && <FactoryWorkers />}
          
          {/* Add factory equipment - toolboxes, carts, etc. */}
          {viewDetails && <FactoryEquipment quality={quality} />}
          
          {/* Simple environment and atmosphere */}
          <fog attach="fog" args={['#c8c8d0', 30, 100]} />
          <Sky 
            distance={450000} 
            sunPosition={[10, 5, 10]} 
            inclination={0.5} 
            azimuth={0.25} 
            turbidity={8}
            rayleigh={1.5}
            mieCoefficient={0.007}
            mieDirectionalG={0.8}
          />
          {quality === 'high' && <Stars radius={100} depth={50} count={1000} factor={4} fade speed={1} />}
          
          {/* Camera controller */}
          <CameraController 
            view={cameraView}
            selectedMachine={selectedMachine}
          />
        </Suspense>
      </Canvas>
      
      {/* Detail toggle */}
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
  const lightCount = quality === 'high' ? 6 : quality === 'medium' ? 4 : 2;
  
  return (
    <>
      {/* Directional light (main light) - softer and more realistic */}
      <directionalLight
        ref={mainLightRef}
        position={[20, 30, 20]}
        intensity={0.5}
        castShadow={quality !== 'low'}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0001}
        color="#e6e6cc"
      />
      
      {/* Ambient light - warmer and less white */}
      <ambientLight intensity={0.25} color="#d3d3c6" />
      
      {/* Factory ceiling lights */}
      <group>
        {[
          [-25,19.5, -20],
          [-25, 19.5, 0],
          [-25, 19.5, 20],
          [0, 19.5, -20],
          [0, 19.5, 0],
          [0, 19.5, 20],
          [25, 19.5, -20],
          [25, 19.5, 0],
          [25, 19.5, 20]
        ].slice(0, lightCount).map((position, index) => (
          <React.Fragment key={`ceiling-light-${index}`}>
            <SpotLight
              position={position}
              angle={Math.PI / 4}
              penumbra={0.5}
              intensity={0.45}
              distance={40}
              castShadow={quality !== 'low'}
              shadow-bias={-0.0001}
              attenuation={5}
              anglePower={5}
              color="#fff2e0"
            />
            {/* Ceiling light fixture */}
            <mesh position={[position[0], position[1] + 0.5, position[2]]}>
              <boxGeometry args={[2, 0.2, 2]} />
              <meshStandardMaterial color="#f8fafc" emissive="#fff2e0" emissiveIntensity={0.2} />
            </mesh>
          </React.Fragment>
        ))}
      </group>
      
      {/* EDM Room lights - more dramatic lighting */}
      {quality !== 'low' && (
        <>
          <SpotLight
            position={[-10, 12, -30]}
            angle={Math.PI / 3}
            penumbra={0.5}
            intensity={0.6}
            distance={35}
            castShadow={quality === 'high'}
            shadow-bias={-0.0001}
            attenuation={3}
            anglePower={3}
            color="#e8e8ff"
          />
          <SpotLight
            position={[10, 12, -30]}
            angle={Math.PI / 3}
            penumbra={0.5}
            intensity={0.6}
            distance={35}
            castShadow={quality === 'high'}
            shadow-bias={-0.0001}
            attenuation={3}
            anglePower={3}
            color="#e8e8ff"
          />
          
          {/* Additional fill light for better visibility in EDM area */}
          <pointLight
            position={[0, 5, -30]}
            intensity={0.4}
            distance={25}
            color="#b3cfff"
          />
        </>
      )}
      
      {/* Add some colored accent lights for visual interest */}
      {quality === 'high' && (
        <>
          {/* Blue accent light for EDM area */}
          <pointLight
            position={[0, 5, -30]}
            intensity={0.4}
            distance={20}
            color="#3b82f6"
          />
          
          {/* Warm accent light for turning area */}
          <pointLight
            position={[-20, 5, 0]}
            intensity={0.25}
            distance={15}
            color="#fb923c"
          />
          
          {/* Green accent for milling area */}
          <pointLight
            position={[20, 5, 0]}
            intensity={0.25}
            distance={15}
            color="#10b981"
          />
        </>
      )}
    </>
  );
};

// Factory workers component
const FactoryWorkers = () => {
  // Define fixed worker positions around the machines
  const workerPositions = [
    // Near turning machines
    [-18, 0, -10],
    [-20, 0, 5],
    // Near milling machines
    [18, 0, -5],
    [22, 0, 10],
    // Central area
    [0, 0, 15],
    [-5, 0, -15]
  ];

  return (
    <>
      {workerPositions.map((position, index) => {
        // Add randomness to position
        const workerPosition = [
          position[0] + (Math.random() - 0.5) * 2,
          position[1],
          position[2] + (Math.random() - 0.5) * 2
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

// Factory equipment (toolboxes, carts, etc.) - repositioned for new layout
const FactoryEquipment = ({ quality = 'medium' }) => {
  // Determine the number of items to show based on quality
  const detailLevel = quality === 'high' ? 1 : quality === 'medium' ? 0.7 : 0.4;
  
  return (
    <group>
      {/* Toolboxes */}
      <Toolbox position={[-15, 0, -20]} />
      <Toolbox position={[15, 0, 15]} />
      {detailLevel > 0.6 && <Toolbox position={[25, 0, -18]} />}
      
      {/* Workbenches with tools - in specific locations */}
      <Workbench position={[-25, 0, 15]} rotation={[0, Math.PI/4, 0]} />
      <Workbench position={[25, 0, -5]} rotation={[0, -Math.PI/3, 0]} />
      {detailLevel > 0.6 && <Workbench position={[-25, 0, -15]} rotation={[0, Math.PI/6, 0]} />}
      
      {/* Material racks - near the machines */}
      <MaterialRack position={[-30, 0, 0]} rotation={[0, Math.PI/2, 0]} />
      {detailLevel > 0.6 && <MaterialRack position={[30, 0, 0]} rotation={[0, -Math.PI/2, 0]} />}
      
      {/* Forklifts */}
      {detailLevel > 0.8 && <Forklift position={[15, 0, 25]} rotation={[0, -Math.PI/4, 0]} />}
      
      {/* Pallets with materials */}
      <Pallet position={[-25, 0, 0]} />
      <Pallet position={[25, 0, 10]} />
      {detailLevel > 0.6 && <Pallet position={[0, 0, 25]} />}
      
      {/* Trash bins */}
      <TrashBin position={[-10, 0, 20]} />
      <TrashBin position={[10, 0, -20]} />
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
      
      {/* Shelves */}
      {[1, 3, 5].map((height, i) => (
        <mesh key={i} position={[0, height, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.1, 1.2]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      
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

// Pallet component with material
const Pallet = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Pallet base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.2, 1.2]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
      </mesh>
      
      {/* Pallet slats */}
      {[-0.6, 0, 0.6].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.05, 1.2]} />
          <meshStandardMaterial color="#92400e" roughness={0.9} />
        </mesh>
      ))}
      
      {/* Material/box on pallet */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
};

// Trash bin component
const TrashBin = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 2, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
};

// Section labels for different areas
const SectionLabels = () => {
  return (
    <group position={[0, 15, 0]}>
      {/* TV instead of labels - left wall */}
      {/* <LargeScreenTV 
        position={[-20, 0, 0]}
        rotation={[0, Math.PI/2, 0]}
        size={[10, 6]}
        content="Production Dashboard"
      /> */}
      
      {/* Central TV - main board */}
      <LargeScreenTV 
        position={[0, 0, -25.5]}
        rotation={[0, 0, 0]}
        size={[12, 8]}
        content="BEL MES FAB-C"
      />
      
      {/* Right wall TV
      <LargeScreenTV 
        position={[20, 0, 0]}
        rotation={[0, -Math.PI/2, 0]}
        size={[10, 6]}
        content="Performance Metrics"
      /> */}
    </group>
  );
};

// TV component
const LargeScreenTV = ({ position, rotation = [0, 0, 0], size = [10, 6], content = "MES" }) => {
  const screenRef = useRef();
  
  useFrame((state) => {
    if (screenRef.current) {
      // Add subtle animation to the screen
      const time = state.clock.getElapsedTime();
      screenRef.current.material.emissiveIntensity = 0.6 + Math.sin(time * 0.5) * 0.1;
    }
  });
  
  return (
    <group position={position} rotation={rotation}>
      {/* TV Frame */}
      <mesh castShadow>
        <boxGeometry args={[size[0] + 0.5, size[1] + 0.5, 0.3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0, 0.2]}>
        <planeGeometry args={size} />
        <meshStandardMaterial 
          color="#0f172a" 
          emissive="#60a5fa" 
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      
      {/* TV Content */}
      <Text
        position={[0, 0, 0.3]}
        color="white"
        fontSize={0.8}
        maxWidth={size[0] * 0.8}
        textAlign="center"
      >
        {content}
      </Text>
    </group>
  );
};

// Shop floor furniture - workbenches and chairs
const ShopFloorFurniture = () => {
  return (
    <group>
      {/* Workbenches in front of turning machines (left side) */}
      {[-30, -20, -10, 0, 10, 20, 30].map((zPos, index) => (
        <group key={`turning-bench-${index}`} position={[-12, 0, zPos]}>
          {/* Workbench */}
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[4, 0.1, 2]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.3} roughness={0.7} />
          </mesh>
          
          {/* Table legs */}
          {[
            [-1.8, 0.75, -0.8],
            [-1.8, 0.75, 0.8],
            [1.8, 0.75, -0.8],
            [1.8, 0.75, 0.8]
          ].map((pos, i) => (
            <mesh key={i} position={pos} castShadow>
              <boxGeometry args={[0.1, 1.5, 0.1]} />
              <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
          
          {/* Chair */}
          <Chair position={[0, 0, -1.5]} rotation={[0, Math.PI/8, 0]} />
        </group>
      ))}

      {/* Workbenches in front of milling machines (right side) */}
      {[-25, -15, -5, 5, 15].map((zPos, index) => (
        <group key={`milling-bench-${index}`} position={[12, 0, zPos]}>
          {/* Workbench */}
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[4, 0.1, 2]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.3} roughness={0.7} />
          </mesh>
          
          {/* Table legs */}
          {[
            [-1.8, 0.75, -0.8],
            [-1.8, 0.75, 0.8],
            [1.8, 0.75, -0.8],
            [1.8, 0.75, 0.8]
          ].map((pos, i) => (
            <mesh key={i} position={pos} castShadow>
              <boxGeometry args={[0.1, 1.5, 0.1]} />
              <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
          
          {/* Chair */}
          <Chair position={[0, 0, -1.5]} rotation={[0, -Math.PI/8, 0]} />
        </group>
      ))}
      
      {/* EDM area workbenches */}
      {[-6, 6].map((xPos, index) => (
        <group key={`edm-bench-${index}`} position={[xPos, 0, -20]}>
          {/* Workbench */}
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[3, 0.1, 1.8]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.3} roughness={0.7} />
          </mesh>
          
          {/* Table legs */}
          {[
            [-1.4, 0.75, -0.8],
            [-1.4, 0.75, 0.8],
            [1.4, 0.75, -0.8],
            [1.4, 0.75, 0.8]
          ].map((pos, i) => (
            <mesh key={i} position={pos} castShadow>
              <boxGeometry args={[0.1, 1.5, 0.1]} />
              <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
          
          {/* Chair */}
          <Chair position={[0, 0, -1.2]} rotation={[0, 0, 0]} />
        </group>
      ))}
    </group>
  );
};

// Chair component
const Chair = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#475569" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Legs */}
      {[
        [-0.25, 0.4, -0.25],
        [-0.25, 0.4, 0.25],
        [0.25, 0.4, -0.25],
        [0.25, 0.4, 0.25]
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      
      {/* Back rest */}
      <mesh position={[0, 1.3, -0.3]} rotation={[Math.PI/8, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color="#475569" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
};

// EDM Room with glass walls
const EDMRoom = ({ position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      {/* Glass walls - full width of the factory floor */}
      <group>
        {/* Front wall with door */}
        <mesh position={[0, 5, 5]} receiveShadow>
          <boxGeometry args={[50, 10, 0.1]} />
          <meshPhysicalMaterial 
            color="#b0d0eb" 
            transparent 
            opacity={0.4} 
            metalness={0.2}
            roughness={0.05}
            transmission={0.8}
            ior={1.45}
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Doorframe */}
        <group position={[0, 0, 5.05]}>
          <mesh position={[-4, 5, 0]}>
            <boxGeometry args={[1, 10, 0.2]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[4, 5, 0]}>
            <boxGeometry args={[1, 10, 0.2]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 10, 0]}>
            <boxGeometry args={[8, 1, 0.2]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          
          {/* Door - open */}
          <mesh position={[4, 4, 2]}>
            <boxGeometry args={[0.1, 8, 4]} />
            <meshPhysicalMaterial 
              color="#b0d0eb" 
              transparent 
              opacity={0.5}
              transmission={0.9}
              ior={1.5}
              clearcoat={0.5}
              clearcoatRoughness={0.1}
            />
          </mesh>
          
          {/* "EDM" sign with better visibility */}
          <Text
            position={[0, 11, 0]}
            fontSize={1.5}
            color="#1e3a8a"
            anchorX="center"
            anchorY="middle"
          >
            EDM
          </Text>
        </group>
        
        {/* Side walls - extend to full width */}
        <mesh position={[25, 5, -5]} rotation={[0, Math.PI/2, 0]} receiveShadow>
          <boxGeometry args={[20, 10, 0.1]} />
          <meshPhysicalMaterial 
            color="#b0d0eb" 
            transparent 
            opacity={0.4}
            transmission={0.8}
            ior={1.45}
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        <mesh position={[-25, 5, -5]} rotation={[0, Math.PI/2, 0]} receiveShadow>
          <boxGeometry args={[20, 10, 0.1]} />
          <meshPhysicalMaterial 
            color="#b0d0eb" 
            transparent 
            opacity={0.4}
            transmission={0.8}
            ior={1.45}
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Add metal framing to create a more industrial look */}
        <EDMRoomFraming />
      </group>
      
      {/* Stairs to second floor on the right side */}
      <Staircase position={[19, 0, 5]} />
      
      {/* Second floor viewing area with windows */}
      <SecondFloorViewing />
    </group>
  );
};

// Metal framing for the EDM room walls
const EDMRoomFraming = () => {
  return (
    <group>
      {/* Vertical metal frames on front wall */}
      {[-20, -10, 0, 10, 20].map((x, index) => (
        <mesh key={`edm-frame-v-${index}`} position={[x, 5, 5.05]} castShadow>
          <boxGeometry args={[0.2, 10, 0.3]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      
      {/* Horizontal metal frames */}
      <mesh position={[0, 0, 5.05]} castShadow>
        <boxGeometry args={[50, 0.2, 0.3]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, 5, 5.05]} castShadow>
        <boxGeometry args={[50, 0.2, 0.3]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, 10, 5.05]} castShadow>
        <boxGeometry args={[50, 0.2, 0.3]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Side wall frames */}
      {[-5, 0, 5].map((z, index) => (
        <React.Fragment key={`edm-frame-side-${index}`}>
          <mesh position={[25.05, 5, z - 5]} rotation={[0, Math.PI/2, 0]} castShadow>
            <boxGeometry args={[0.2, 10, 0.3]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
          </mesh>
          
          <mesh position={[-25.05, 5, z - 5]} rotation={[0, Math.PI/2, 0]} castShadow>
            <boxGeometry args={[0.2, 10, 0.3]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};

// Staircase to second floor
const Staircase = ({ position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      {/* Stair steps */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh 
          key={`stair-${i}`} 
          position={[0, i * 0.5, -2 - i * 0.8]} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[3, 0.2, 0.8]} />
          <meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.8} />
        </mesh>
      ))}
      
      {/* Stair railings */}
      <mesh position={[1.6, 2.5, -6]} castShadow>
        <boxGeometry args={[0.1, 5, 9]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Steps to second floor */}
      <mesh position={[1.8, 5, -12]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.2, 4]} />
        <meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.8} />
      </mesh>
    </group>
  );
};

// Second floor viewing area
const SecondFloorViewing = () => {
  return (
    <group position={[0, 10, -15]}>
      {/* Second floor platform - full width */}
      <mesh position={[0, 0, 10]} receiveShadow>
        <boxGeometry args={[50, 0.3, 20]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.2} roughness={0.8} />
      </mesh>

      <mesh position={[0,10, 19.2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
  <boxGeometry args={[50, 0.3, 20]} />
  <meshStandardMaterial color="#d1d5db" metalness={0.2} roughness={0.8} />
</mesh>

      
      {/* Railings */}
      <mesh position={[0, 1, 5]} castShadow>
        <boxGeometry args={[50, 2, 0.1]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Viewing windows */}
      <mesh position={[-15, 1.5, 5.1]} castShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshPhysicalMaterial 
          color="#d1e5f6" 
          transparent 
          opacity={0.6}
          transmission={0.9}
          ior={1.5}
        />
      </mesh>
      
      <mesh position={[0, 1.5, 5.1]} castShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshPhysicalMaterial 
          color="#d1e5f6" 
          transparent 
          opacity={0.6}
          transmission={0.9}
          ior={1.5}
        />
      </mesh>
      
      <mesh position={[15, 1.5, 5.1]} castShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshPhysicalMaterial 
          color="#d1e5f6" 
          transparent 
          opacity={0.6}
          transmission={0.9}
          ior={1.5}
        />
      </mesh>
      
      {/* Information banners on the second floor */}
      <Banner 
        position={[-12, 3, 20]} 
        rotation={[0, 0, 0]} 
        text="SAFETY FIRST" 
        color="#ef4444"
      />
      
      {/* <Banner 
        position={[0, 3, 10]} 
        rotation={[0, 0, 0]} 
        text="QUALITY CONTROL" 
        color="#3b82f6"
      /> */}
      
      <Banner 
        position={[12, 3, 20]} 
        rotation={[0, 0, 0]} 
        text="EFFICIENCY" 
        color="#10b981"
      />
    </group>
  );
};

// Banner component for walls
const Banner = ({ position, rotation = [0, 0, 0], text = "BANNER", color = "#3b82f6" }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[8, 1.5, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      <Text
        position={[0, 0, 0.03]}
        color="white"
        fontSize={0.5}
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

export default FactoryScene; 