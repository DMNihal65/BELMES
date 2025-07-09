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
import WebGLErrorBoundary from './WebGLErrorBoundary';
import { ToolOutlined, AppstoreOutlined, ProjectOutlined } from '@ant-design/icons';

// Import custom components
import FactoryFloor from './FactoryFloor';
import AdvancedMachine from './AdvancedMachine';
import CameraController from './CameraController';

// Model loader components
const TurningMachineModel = ({ position, rotation, scale = 0.5, onClick, isSelected, machineData }) => {
  const gltf = useLoader(GLTFLoader, '/turning.glb');
  const model = useRef();
  const statusLightRef = useRef();
  const [hovered, setHovered] = useState(false);
  
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
  
  // Animate scale on selection/hover
  const animatedScale = isSelected ? scale * 1.12 : hovered ? scale * 1.06 : scale;
  
  return (
    <group 
      ref={model} 
      position={position} 
      rotation={rotation} 
      scale={[animatedScale, animatedScale, animatedScale]}
      onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Outline on hover/selected */}
      { (hovered || isSelected) && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshBasicMaterial color={isSelected ? '#2563eb' : '#facc15'} transparent opacity={0.18} />
        </mesh>
      )}
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
      
      {/* Tooltip on hover */}
      {hovered && machineData && (
        <Html position={[0, 1.2, 0]} center distanceFactor={18} zIndexRange={[100, 0]}>
          <div style={{
            background: 'rgba(30,41,59,0.95)',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            minWidth: 90,
            textAlign: 'center',
            letterSpacing: 0.2
          }}>
            {machineData.name}<br/>
            <span style={{fontWeight:400, fontSize:12, color:'#a5f3fc'}}>{machineData.status}</span>
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
  const [hovered, setHovered] = useState(false);
  
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
  
  // Animate scale on selection/hover
  const animatedScale = isSelected ? scale * 1.12 : hovered ? scale * 1.06 : scale;
  
  return (
    <group 
      ref={model} 
      position={position} 
      rotation={rotation} 
      scale={[animatedScale, animatedScale, animatedScale]}
      onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      { (hovered || isSelected) && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshBasicMaterial color={isSelected ? '#2563eb' : '#facc15'} transparent opacity={0.18} />
        </mesh>
      )}
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
      
      {/* Tooltip on hover */}
      {hovered && machineData && (
        <Html position={[0, 1.2, 0]} center distanceFactor={18} zIndexRange={[100, 0]}>
          <div style={{
            background: 'rgba(30,41,59,0.95)',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            minWidth: 90,
            textAlign: 'center',
            letterSpacing: 0.2
          }}>
            {machineData.name}<br/>
            <span style={{fontWeight:400, fontSize:12, color:'#a5f3fc'}}>{machineData.status}</span>
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
  const [hovered, setHovered] = useState(false);
  
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
  
  // Animate scale on selection/hover
  const animatedScale = isSelected ? scale * 1.12 : hovered ? scale * 1.06 : scale;
  
  return (
    <group 
      ref={model} 
      position={position} 
      rotation={rotation} 
      scale={[animatedScale, animatedScale, animatedScale]}
      onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      { (hovered || isSelected) && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshBasicMaterial color={isSelected ? '#2563eb' : '#facc15'} transparent opacity={0.18} />
        </mesh>
      )}
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
      
      {/* Tooltip on hover */}
      {hovered && machineData && (
        <Html position={[0, 1.2, 0]} center distanceFactor={18} zIndexRange={[100, 0]}>
          <div style={{
            background: 'rgba(30,41,59,0.95)',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            minWidth: 90,
            textAlign: 'center',
            letterSpacing: 0.2
          }}>
            {machineData.name}<br/>
            <span style={{fontWeight:400, fontSize:12, color:'#a5f3fc'}}>{machineData.status}</span>
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
  const [viewDetails, setViewDetails] = useState(true);
  const [quality, setQuality] = useState('medium');
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check WebGL support on component mount
  useEffect(() => {
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas');
        
        // Try to get WebGL2 context first (modern browsers)
        let gl = canvas.getContext('webgl2');
        
        // If WebGL2 is not available, try WebGL
        if (!gl) {
          gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        }
        
        // Set support state based on context creation success
        if (!gl) {
          setWebGLSupported(false);
          setErrorMessage('WebGL not supported by your browser or graphics card. Displaying fallback view.');
          setFallbackMode(true);
        } else {
          // Check for any potential WebGL context limitation flags in the browser
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Check if using software renderer like SwiftShader (Chrome) or ANGLE (Firefox)
            if (renderer.includes('SwiftShader') || renderer.includes('ANGLE') || renderer.includes('llvmpipe')) {
              setQuality('low');
            }
          }
        }
      } catch (e) {
        console.error('Error checking WebGL support:', e);
        setWebGLSupported(false);
        setErrorMessage('Error initializing WebGL: ' + e.message);
        setFallbackMode(true);
      }
    };

    checkWebGLSupport();
  }, []);

  // Divide machines into types
  const categorizeMachines = () => {
    // Create categories for milling, turning, and EDM machines
    const millingMachines = [];
    const turningMachines = [];
    const edmMachines = [];

    let millingIdx = 0, turningIdx = 0, edmIdx = 0;
    machines.forEach((m) => {
      let type = m.type;
      if (!type) {
        // fallback to id-based
        if (m.id % 3 === 0) type = 'milling';
        else if (m.id % 3 === 1) type = 'turning';
        else type = 'edm';
      }
      let scenePosition, sceneRotation;
      if (type === 'milling') {
        scenePosition = getMachinePosition('milling', millingIdx);
        sceneRotation = getMachineRotation('milling', millingIdx);
        millingMachines.push({ ...m, scenePosition, sceneRotation });
        millingIdx++;
      } else if (type === 'turning') {
        scenePosition = getMachinePosition('turning', turningIdx);
        sceneRotation = getMachineRotation('turning', turningIdx);
        turningMachines.push({ ...m, scenePosition, sceneRotation });
        turningIdx++;
      } else {
        scenePosition = getMachinePosition('edm', edmIdx);
        sceneRotation = getMachineRotation('edm', edmIdx);
        edmMachines.push({ ...m, scenePosition, sceneRotation });
        edmIdx++;
      }
    });
    return {
      milling: millingMachines,
      turning: turningMachines,
      edm: edmMachines
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
      case 'low': default: return [0.5, 1]; // Reduced for better performance
    }
  };

  // Handle WebGL errors
  const handleCreationError = (e) => {
    console.error("Error creating WebGL context:", e);
    setFallbackMode(true);
    setErrorMessage(`Error creating WebGL context: ${e.message || 'Unknown error'}`);
  };

  // Get categorized machines
  const machinesByType = categorizeMachines();

  // Fallback view when WebGL is not supported
  if (fallbackMode) {
    return (
      <div className={`relative h-full w-full ${className} bg-gray-800 flex flex-col items-center justify-center p-4`}>
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 p-4 rounded-md mb-4 max-w-lg text-center">
          <h3 className="font-bold text-lg mb-2">3D View Not Available</h3>
          <p>{errorMessage || "Your browser or device doesn't support WebGL which is required for the 3D factory view."}</p>
          <p className="mt-2 text-sm">
            Try using the latest version of Chrome, Firefox, or Edge, and ensure your graphics drivers are updated.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4 w-full h-[calc(100%-130px)] flex flex-col">
          <h3 className="font-bold mb-4 text-center text-lg">Factory Shop Floor Status</h3>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Status counters */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 flex items-center justify-between">
              <span className="text-blue-800 text-sm font-medium">Total</span>
              <span className="text-blue-600 text-xl font-bold">{machines.length}</span>
            </div>
            <div className="bg-green-50 rounded-lg p-2 border border-green-100 flex items-center justify-between">
              <span className="text-green-800 text-sm font-medium">Running</span>
              <span className="text-green-600 text-xl font-bold">
                {machines.filter(m => m.status === 'PRODUCTION').length}
              </span>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-100 flex items-center justify-between">
              <span className="text-yellow-800 text-sm font-medium">Idle</span>
              <span className="text-yellow-600 text-xl font-bold">
                {machines.filter(m => m.status === 'IDLE' || m.status === 'SETUP').length}
              </span>
            </div>
            <div className="bg-red-50 rounded-lg p-2 border border-red-100 flex items-center justify-between">
              <span className="text-red-800 text-sm font-medium">Error/Off</span>
              <span className="text-red-600 text-xl font-bold">
                {machines.filter(m => m.status === 'ERROR' || m.status === 'OFF').length}
              </span>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            {/* Left: Factory layout visualization */}
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-3 relative overflow-hidden">
              <h4 className="text-blue-800 font-medium mb-2 text-sm">Factory Layout</h4>
              
              {/* EDM Area */}
              <div className="absolute top-8 left-2 right-2 h-1/4 bg-purple-50 rounded-lg border border-purple-200 flex flex-col">
                <div className="text-xs font-medium text-purple-800 p-1 text-center">EDM Area</div>
                <div className="flex justify-center items-center h-full space-x-4">
                  {machines.filter(m => m.type === 'edm').slice(0, 2).map(machine => (
                    <div 
                      key={machine.id}
                      onClick={() => onMachineSelect(machine)}
                      className={`w-12 h-8 bg-white rounded-md shadow-sm flex items-center justify-center cursor-pointer
                        ${selectedMachine?.id === machine.id ? 'ring-2 ring-blue-500' : ''}
                        border border-${getStatusColor(machine.status)}-300`}
                    >
                      <div className={`w-2 h-2 rounded-full bg-${getStatusColor(machine.status)}-500`}></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Center aisle */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-[calc(25%+40px)] bottom-2 w-3 bg-gray-200 rounded"></div>
              
              {/* Main shop floor */}
              <div className="absolute bottom-2 left-2 right-2 h-[60%] flex">
                {/* Turning side */}
                <div className="w-[45%] flex flex-col">
                  <div className="text-xs font-medium text-blue-800 mb-1 text-center">Turning</div>
                  <div className="flex-1 flex flex-col justify-around">
                    {machines.filter(m => m.type === 'turning').slice(0, 5).map(machine => (
                      <div 
                        key={machine.id}
                        onClick={() => onMachineSelect(machine)}
                        className={`h-8 bg-white rounded-md shadow-sm flex items-center justify-between px-2 cursor-pointer
                          ${selectedMachine?.id === machine.id ? 'ring-2 ring-blue-500' : ''}
                          border border-${getStatusColor(machine.status)}-300`}
                      >
                        <div className={`w-2 h-2 rounded-full bg-${getStatusColor(machine.status)}-500`}></div>
                        <span className="text-xs truncate max-w-[70%]">{machine.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Center space */}
                <div className="w-[10%]"></div>
                
                {/* Milling side */}
                <div className="w-[45%] flex flex-col">
                  <div className="text-xs font-medium text-green-800 mb-1 text-center">Milling</div>
                  <div className="flex-1 flex flex-col justify-around">
                    {machines.filter(m => m.type === 'milling').slice(0, 5).map(machine => (
                      <div 
                        key={machine.id}
                        onClick={() => onMachineSelect(machine)}
                        className={`h-8 bg-white rounded-md shadow-sm flex items-center justify-between px-2 cursor-pointer
                          ${selectedMachine?.id === machine.id ? 'ring-2 ring-blue-500' : ''}
                          border border-${getStatusColor(machine.status)}-300`}
                      >
                        <span className="text-xs truncate max-w-[70%]">{machine.name}</span>
                        <div className={`w-2 h-2 rounded-full bg-${getStatusColor(machine.status)}-500`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Label */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                Main Shop Floor
              </div>
            </div>
            
            {/* Right: Machine cards */}
            <div className="grid grid-rows-3 gap-4 overflow-hidden">
              {/* Machine categories */}
              <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="bg-blue-50 p-2 border-b border-blue-100">
                  <h4 className="text-blue-800 font-medium text-sm flex items-center">
                    <ToolOutlined className="mr-1" /> Turning Machines
                  </h4>
                </div>
                <div className="p-2 grid grid-cols-2 gap-2 overflow-hidden">
                  {machines.filter(m => m.type === 'turning').slice(0, 4).map(machine => (
                    <MachineSummaryCard 
                      key={machine.id} 
                      machine={machine} 
                      isSelected={selectedMachine?.id === machine.id}
                      onSelect={() => onMachineSelect(machine)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="bg-green-50 p-2 border-b border-green-100">
                  <h4 className="text-green-800 font-medium text-sm flex items-center">
                    <AppstoreOutlined className="mr-1" /> Milling Machines
                  </h4>
                </div>
                <div className="p-2 grid grid-cols-2 gap-2 overflow-hidden">
                  {machines.filter(m => m.type === 'milling').slice(0, 4).map(machine => (
                    <MachineSummaryCard 
                      key={machine.id} 
                      machine={machine} 
                      isSelected={selectedMachine?.id === machine.id}
                      onSelect={() => onMachineSelect(machine)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="bg-purple-50 p-2 border-b border-purple-100">
                  <h4 className="text-purple-800 font-medium text-sm flex items-center">
                    <ProjectOutlined className="mr-1" /> EDM Machines
                  </h4>
                </div>
                <div className="p-2 grid grid-cols-2 gap-2 overflow-hidden">
                  {machines.filter(m => m.type === 'edm').slice(0, 4).map(machine => (
                    <MachineSummaryCard 
                      key={machine.id} 
                      machine={machine} 
                      isSelected={selectedMachine?.id === machine.id}
                      onSelect={() => onMachineSelect(machine)}
                    />
                  ))}
                  {machines.filter(m => m.type === 'edm').length === 0 && (
                    <div className="col-span-2 flex items-center justify-center p-2 text-gray-500 text-sm">
                      No EDM machines available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Quality controls */}
      

      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-800">
          <div className="text-white">Loading factory scene...</div>
        </div>
      ) : (
        <WebGLErrorBoundary onError={handleCreationError}>
          <Canvas
            shadows={quality !== 'high'}
            dpr={getPixelRatio()}
            gl={{ 
              antialias: quality !== 'high',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0,
              alpha: true,
              stencil: false,
              depth: true,
              precision: quality === 'high' ? 'lowp' : 'mediump',
              powerPreference: 'low-power',
              failIfMajorPerformanceCaveat: false
            }}
            camera={{ position: [0, 30, 30], fov: 45 }}
            performance={{ min: 0.5 }}
            onCreated={({ gl }) => {
              // Optional: Apply additional WebGL context optimizations
              gl.getContext().getExtension('WEBGL_lose_context');
            }}
          >
            <CameraController 
              selectedMachine={selectedMachine} 
              view={cameraView}
              enableTransitions={quality !== 'high'} 
            />
            
            <Suspense fallback={null}>
              {/* Scene lighting */}
              <ambientLight intensity={0.4} color="#d4d4d8" />
              
              {/* Main factory lighting */}
              <Factory3DLighting quality={quality} />
              
              {/* Environment */}
              {quality !== 'high' && (
                <Environment
                  files="/warehouse.hdr"
                  background={false}
                  blur={0.7}
                />
              )}
              
              {/* Simple environment and atmosphere */}
              {quality !== 'low' && (
                <>
                  <fog attach="fog" args={['#c8c8d0', 30, 100]} />
                  {quality === 'high' && (
                    <>
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
                      <Stars radius={100} depth={50} count={1000} factor={4} fade speed={1} />
                    </>
                  )}
                </>
              )}
              
              {/* Factory environment */}
              <FactoryFloor size={80} />
              
              {/* EDM Room - Glass enclosure */}
              <EDMRoom position={[0, 0, -30]} />
              
              {/* Section Labels */}
              {quality !== 'low' && <SectionLabels />}
              
              {/* Machine display - Turning Machines */}
              {machinesByType.turning.map((machine) => (
                <TurningMachineModel
                  key={machine.id}
                  position={machine.scenePosition}
                  rotation={machine.sceneRotation}
                  scale={12.0}
                  onClick={() => onMachineSelect(machine)}
                  isSelected={selectedMachine?.id === machine.id}
                  machineData={machine}
                />
              ))}
              
              {/* Machine display - Milling Machines */}
              {machinesByType.milling.map((machine) => (
                <MillingMachineModel
                  key={machine.id}
                  position={machine.scenePosition}
                  rotation={machine.sceneRotation}
                  scale={8.0}
                  onClick={() => onMachineSelect(machine)}
                  isSelected={selectedMachine?.id === machine.id}
                  machineData={machine}
                />
              ))}
              
              {/* Machine display - EDM Machines */}
              {machinesByType.edm.map((machine) => (
                <EDMMachineModel
                  key={machine.id}
                  position={machine.scenePosition}
                  rotation={machine.sceneRotation}
                  scale={12.0}
                  onClick={() => onMachineSelect(machine)}
                  isSelected={selectedMachine?.id === machine.id}
                  machineData={machine}
                />
              ))}
              
              {/* Add workbenches and chairs */}
              {quality !== 'low' && <ShopFloorFurniture />}
              
              {/* Add equipment (only for medium/high quality) */}
              {quality !== 'low' && (
                <FactoryEquipment quality={quality} />
              )}
            </Suspense>
          </Canvas>
        </WebGLErrorBoundary>
      )}
    </div>
  );
};

// Factory lighting setup
const Factory3DLighting = ({ quality = 'medium' }) => {
  // References for the lights to apply helpers if needed
  const mainLightRef = React.useRef();
  
  // Determine number of lights based on quality
  const lightCount = quality === 'high' ? 4 : quality === 'medium' ? 3 : 1;
  
  return (
    <>
      {/* Directional light (main light) - softer and more realistic */}
      <directionalLight
        ref={mainLightRef}
        position={[20, 30, 20]}
        intensity={0.6}
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
      <ambientLight intensity={0.3} color="#d3d3c6" />
      
      {/* Factory ceiling lights - reduced number for performance */}
      <group>
        {[
          [-25, 19.5, 0],
          [0, 19.5, 0],
          [25, 19.5, 0],
          [0, 19.5, -20]
        ].slice(0, lightCount).map((position, index) => (
          <SpotLight
            key={`ceiling-light-${index}`}
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
        ))}
      </group>
    </>
  );
};

// Factory equipment (toolboxes, carts, etc.) - repositioned for new layout
const FactoryEquipment = ({ quality = 'medium' }) => {
  // Determine the number of items to show based on quality
  const detailLevel = quality === 'high' ? 1 : quality === 'medium' ? 0.5 : 0.3;
  
  return (
    <group>
      {/* Only the most important equipment for visual context */}
      <Toolbox position={[-15, 0, -20]} />
      {detailLevel > 0.4 && <Toolbox position={[15, 0, 15]} />}
      
      {/* Workbenches with tools - only the most visible ones */}
      <Workbench position={[-25, 0, 15]} rotation={[0, Math.PI/4, 0]} />
      {detailLevel > 0.5 && <Workbench position={[25, 0, -5]} rotation={[0, -Math.PI/3, 0]} />}
      
      {/* Material racks - reduced number */}
      {detailLevel > 0.5 && <MaterialRack position={[-30, 0, 0]} rotation={[0, Math.PI/2, 0]} />}
      
      {/* Pallets with materials - reduced */}
      <Pallet position={[-25, 0, 0]} />
      {detailLevel > 0.7 && <Pallet position={[25, 0, 10]} />}
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
        [-2.2, 1.5, -0.8],
        [-2.2, 1.5, 0.8],
        [2.2, 1.5, -0.8],
        [2.2, 1.5, 0.8]
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
            font="/fonts/Rubik-VariableFont_wght.ttf"
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
        font='/fonts/Rubik-VariableFont_wght.ttf'
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

// Machine summary card component for 2D fallback view
const MachineSummaryCard = ({ machine, isSelected, onSelect }) => {
  // Calculate completion percentage
  const completionPercentage = 
    machine.targetCount > 0 ? Math.round((machine.totalCount / machine.targetCount) * 100) : 0;
  
  // Status colors match the main app  
  const getStatusBg = (status) => {
    switch(status) {
      case 'PRODUCTION': return 'bg-green-50 border-green-100';
      case 'ON': return 'bg-yellow-50 border-yellow-100';
      case 'IDLE': return 'bg-blue-50 border-blue-100';
      case 'ERROR': return 'bg-red-50 border-red-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };
  
  const getStatusText = (status) => {
    switch(status) {
      case 'PRODUCTION': return 'text-green-800';
      case 'ON': return 'text-yellow-800';
      case 'IDLE': return 'text-blue-800';
      case 'ERROR': return 'text-red-800';
      default: return 'text-gray-800';
    }
  };
  
  return (
    <div 
      className={`border rounded-md overflow-hidden shadow-sm cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
      onClick={onSelect}
    >
      <div className={`flex justify-between items-center p-1 ${getStatusBg(machine.status)} border-b`}>
        <div className="font-medium text-xs truncate max-w-[70%]">{machine.name}</div>
        <div className={`text-xs font-semibold px-1 py-0.5 rounded ${getStatusText(machine.status)}`}>
          {machine.status}
        </div>
      </div>
      
      <div className="p-1">
        <div className="flex justify-between items-center text-xs">
          <div className="truncate max-w-[70%]">{machine.partNumber || 'No part'}</div>
          <div>{machine.totalCount || 0}/{machine.targetCount || 0}</div>
        </div>
        
        <div className="w-full h-1 mt-1 bg-gray-200 rounded overflow-hidden">
          <div 
            className={`h-full ${machine.status === 'PRODUCTION' ? 'bg-green-500' : 
              machine.status === 'ERROR' ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default FactoryScene; 