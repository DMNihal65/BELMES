import React, { useRef, useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Badge, Progress, Tooltip } from 'antd';

// Advanced machine model component with realistic appearance and animations
const AdvancedMachine = ({ 
  machine, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  onClick, 
  isSelected = false 
}) => {
  const machineRef = useRef();
  const spindleRef = useRef();
  const doorRef = useRef();
  const screenRef = useRef();
  const statusLightRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Animation state
  const animationRef = useRef({ 
    spindle: 0, 
    door: 0,
    doorOpen: false,
    doorDirection: 0, // -1: closing, 0: static, 1: opening
    doorPosition: 0, // 0: closed, 1: open
  });
  
  // Pulse animation for selected machines and machine parts
  useFrame((state) => {
    if (!machineRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Animate machine elements based on status
    if (machine.status === 'PRODUCTION') {
      // Rotate spindle in production mode
      if (spindleRef.current) {
        spindleRef.current.rotation.z += 0.1;
      }
      
      // Animate door occasionally
      const doorAnim = animationRef.current;
      if (doorRef.current) {
        // Trigger door animation randomly
        if (doorAnim.doorDirection === 0 && Math.random() < 0.001) {
          doorAnim.doorDirection = doorAnim.doorOpen ? -1 : 1;
        }
        
        // Apply door animation
        if (doorAnim.doorDirection !== 0) {
          doorAnim.doorPosition += doorAnim.doorDirection * 0.02;
          
          // Clamp door position
          if (doorAnim.doorPosition >= 1) {
            doorAnim.doorPosition = 1;
            doorAnim.doorDirection = 0;
            doorAnim.doorOpen = true;
          } else if (doorAnim.doorPosition <= 0) {
            doorAnim.doorPosition = 0;
            doorAnim.doorDirection = 0;
            doorAnim.doorOpen = false;
          }
          
          // Apply door position
          doorRef.current.position.x = doorAnim.doorPosition * -1.5;
        }
      }
      
      // Simulate machining vibration
      machineRef.current.position.y = position[1] + Math.sin(time * 30) * 0.01;
    }
    
    // Screen animation
    if (screenRef.current && screenRef.current.material) {
      // Animate screen brightness when machine is on
      if (machine.status !== 'OFF') {
        const screenPulse = 0.6 + Math.sin(time * 2) * 0.1;
        screenRef.current.material.emissiveIntensity = screenPulse;
      }
    }
    
    // Status light animation
    if (statusLightRef.current && statusLightRef.current.material) {
      if (machine.status === 'PRODUCTION') {
        // Pulse green light when in production
        statusLightRef.current.material.emissiveIntensity = 0.8 + Math.sin(time * 4) * 0.2;
      } else if (machine.status === 'ON') {
        // Pulse amber light when on but not producing
        statusLightRef.current.material.emissiveIntensity = 0.6 + Math.sin(time * 2) * 0.1;
      }
    }
    
    // Selection indicator animation
    if (isSelected) {
      const glowIntensity = 0.5 + Math.sin(time * 2) * 0.2;
      machineRef.current.scale.set(
        1.05 + Math.sin(time * 3) * 0.01,
        1.05 + Math.sin(time * 3) * 0.01,
        1.05 + Math.sin(time * 3) * 0.01
      );
    } else {
      machineRef.current.scale.set(1, 1, 1);
    }
  });
  
  // Get status-specific colors and effects
  const getStatusColor = (status) => {
    switch (status) {
      case 'PRODUCTION': return '#10b981'; // Green
      case 'ON': return '#f59e0b';         // Amber/yellow
      case 'OFF': default: return '#6b7280'; // Gray
    }
  };
  
  const getMachineOpacity = (status) => {
    return status === 'OFF' ? 0.8 : 1;
  };
  
  // Calculate completion percentage
  const completionPercentage = 
    machine.targetCount > 0 
      ? Math.round((machine.totalCount / machine.targetCount) * 100) 
      : 0;
  
  // Create a more realistic CNC machine model
  const baseDimensions = [5, 3, 5]; // Width, height, depth
  const statusColor = getStatusColor(machine.status);
  
  return (
    <group 
      position={position}
      rotation={rotation}
      onClick={(e) => { 
        e.stopPropagation();
        onClick && onClick(machine);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Machine body */}
      <group 
        ref={machineRef}
        position={[0, baseDimensions[1]/2, 0]}
      >
        {/* Main machine body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={baseDimensions} />
          <meshStandardMaterial 
            color="#f8fafc" 
            metalness={0.6}
            roughness={0.2}
            opacity={getMachineOpacity(machine.status)}
            transparent={machine.status === 'OFF'}
          />
        </mesh>
        
        {/* Machine base */}
        <mesh position={[0, -baseDimensions[1]/2-0.25, 0]} receiveShadow>
          <boxGeometry args={[baseDimensions[0]+1, 0.5, baseDimensions[2]+1]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* Control panel */}
        <mesh position={[baseDimensions[0]/2+0.1, 0, -baseDimensions[2]/3]} castShadow>
          <boxGeometry args={[0.8, 2, 1.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>
        
        {/* Display screen */}
        <mesh 
          ref={screenRef}
          position={[baseDimensions[0]/2+0.15, 0.3, -baseDimensions[2]/3]} 
          castShadow
        >
          <boxGeometry args={[0.1, 1, 1]} />
          <meshStandardMaterial 
            color={machine.status === 'OFF' ? '#1e293b' : '#38bdf8'} 
            emissive={machine.status === 'OFF' ? '#1e293b' : '#38bdf8'}
            emissiveIntensity={machine.status === 'OFF' ? 0 : 0.5}
            metalness={0.1} 
            roughness={0.3} 
          />
        </mesh>
        
        {/* Machine door - front */}
        <mesh 
          ref={doorRef}
          position={[0, 0, baseDimensions[2]/2+0.05]} 
          castShadow
        >
          <boxGeometry args={[baseDimensions[0]-1, baseDimensions[1]-0.5, 0.2]} />
          <meshStandardMaterial 
            color="#94a3b8" 
            metalness={0.2}
            roughness={0.3}
            transparent
            opacity={0.7}
          />
        </mesh>
        
        {/* Viewing window */}
        <mesh position={[0, 0.5, baseDimensions[2]/2+0.1]} castShadow>
          <boxGeometry args={[baseDimensions[0]-1.5, baseDimensions[1]-1.5, 0.05]} />
          <meshStandardMaterial 
            color="#cbd5e1" 
            metalness={0.1}
            roughness={0.1}
            transparent
            opacity={0.6}
          />
        </mesh>
        
        {/* Spindle system - visible when door opens */}
        <group position={[0, 0, 0]}>
          {/* Main spindle body */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 1.5, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Spindle rotating part */}
          <mesh ref={spindleRef} position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.3, 0.2, 0.8, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Cutting tool */}
          <mesh position={[0, -1, 0]}>
            <cylinderGeometry args={[0.1, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
        
        {/* Status indicator light */}
        <mesh 
          ref={statusLightRef}
          position={[baseDimensions[0]/2-0.5, baseDimensions[1]/2+0.2, 0]} 
          castShadow
        >
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial 
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={machine.status === 'OFF' ? 0.1 : 0.8}
            metalness={0.1}
            roughness={0.3}
          />
        </mesh>
        
        {/* Machine details - coolant system, etc */}
        <mesh position={[-baseDimensions[0]/2+0.5, 0, baseDimensions[2]/3]}>
          <boxGeometry args={[0.8, 1.5, 0.8]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
        </mesh>
        
        {/* Pipes and cables */}
        <mesh position={[-baseDimensions[0]/2+0.1, baseDimensions[1]/3, 0]}>
          <cylinderGeometry args={[0.15, 0.15, baseDimensions[2]-1, 8]} rotation={[Math.PI/2, 0, 0]} />
          <meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Information panel */}
      <Html
        position={[0, baseDimensions[1] + 1.5, 0]}
        center
        distanceFactor={15}
        className={`transition-all duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}
      >
        <div className={`${hovered || isSelected ? 'bg-white/95' : 'bg-white/80'} backdrop-blur-sm p-2 rounded-lg shadow-lg border ${isSelected ? 'border-blue-400' : 'border-gray-200'} w-48 transform transition-all duration-300`}>
          <div className="text-sm font-bold mb-1 truncate">
            {machine.name}
          </div>
          
          <div className="flex justify-between items-center">
            <Badge 
              status={
                machine.status === 'PRODUCTION' ? 'success' : 
                machine.status === 'ON' ? 'warning' : 
                'default'
              }
              text={machine.status}
            />
            
            <div className="text-xs font-medium">
              OEE: {machine.oee}%
            </div>
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Progress</span>
              <span className="font-medium">{machine.totalCount}/{machine.targetCount}</span>
            </div>
            <Progress 
              percent={completionPercentage} 
              size="small" 
              status={
                machine.status === 'OFF' ? 'normal' :
                completionPercentage >= 100 ? 'success' :
                machine.status === 'PRODUCTION' ? 'active' : 'normal'
              }
              strokeColor={
                machine.status === 'PRODUCTION' ? 
                  {from: '#10b981', to: '#059669'} : 
                  undefined
              }
            />
          </div>
          
          <div className="mt-1 text-xs">
            <div className="flex justify-between">
              <span>Program:</span>
              <span className="font-medium">{machine.currentProgram || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Part:</span>
              <span className="font-medium truncate">{machine.partNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export default AdvancedMachine; 