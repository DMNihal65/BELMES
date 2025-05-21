import React, { useRef, useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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
  const modelRef = useRef();
  const statusLightRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Determine which model to load based on machine type
  const modelPath = machine.type === 'turning' ? '/turning.glb' : 
                    machine.type === 'edm' ? '/wireedm.glb' : 
                    '/machine.glb';
  
  // Load the appropriate GLTF model
  let model = null;
  try {
    model = useLoader(GLTFLoader, modelPath);
  } catch (error) {
    console.warn(`Failed to load model ${modelPath}:`, error);
  }
  
  // Set up model and animations
  useEffect(() => {
    if (model && modelRef.current) {
      // Clone the model to avoid shared materials issues
      const clonedScene = model.scene.clone();
      
      // Apply materials and shadows
      clonedScene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // If machine is OFF, make materials slightly transparent
          if (machine.status === 'OFF' && node.material) {
            const material = node.material.clone();
            material.transparent = true;
            material.opacity = 0.8;
            node.material = material;
          }
        }
      });
      
      // Clear any existing children and add the cloned model
      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }
      
      modelRef.current.add(clonedScene);
      setModelLoaded(true);
    }
  }, [model, machine.status]);
  
  // Get status-specific colors
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
  
  // Get status-specific pulsing rate
  const getStatusPulseRate = (status) => {
    switch (status) {
      case 'PRODUCTION': return 1;  // Normal pulse
      case 'ON': return 0.5;        // Slow pulse
      case 'ERROR': return 3;       // Fast pulse
      case 'MAINTENANCE': return 2; // Medium-fast pulse
      default: return 0;            // No pulse
    }
  };
  
  // Enhanced animation and effects
  useFrame((state) => {
    if (!machineRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Status indicator animation - pulse based on machine status
    const pulseRate = getStatusPulseRate(machine.status);
    
    if (isSelected) {
      // Selection effect - scale up and down slightly
      const scale = 1.05 + Math.sin(time * 3) * 0.01;
      machineRef.current.scale.set(scale, scale, scale);
      
      // Add additional glow effect when selected
      if (modelRef.current) {
        modelRef.current.traverse((node) => {
          if (node.isMesh && node.material) {
            if (!node.userData.originalEmissive) {
              // Store original emissive color
              node.userData.originalEmissive = node.material.emissive.clone();
            }
            
            // Add slight glow to the machine
            const emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
            node.material.emissive.set(0.1, 0.1, 0.2);
            node.material.emissiveIntensity = emissiveIntensity;
          }
        });
      }
    } else {
      // Reset scale when not selected
      machineRef.current.scale.set(1, 1, 1);
      
      // Reset emissive effect when not selected
      if (modelRef.current) {
        modelRef.current.traverse((node) => {
          if (node.isMesh && node.material && node.userData.originalEmissive) {
            node.material.emissive.copy(node.userData.originalEmissive);
            node.material.emissiveIntensity = 0;
          }
        });
      }
    }
    
    // Simple animation for machines in production
    if (machine.status === 'PRODUCTION' && modelRef.current) {
      // Small vibration effect
      modelRef.current.position.y = Math.sin(time * 20) * 0.01;
    }
    
    // Add status light pulsing effect
    if (statusLightRef.current && statusLightRef.current.material) {
      if (pulseRate > 0) {
        // Only pulse if the machine has a pulsing status
        statusLightRef.current.material.emissiveIntensity = 
          0.5 + Math.sin(time * pulseRate * Math.PI) * 0.5;
      } else {
        // Static intensity for non-pulsing statuses
        statusLightRef.current.material.emissiveIntensity = 
          machine.status === 'OFF' ? 0.1 : 0.7;
      }
    }
  });
  
  // Calculate completion percentage
  const completionPercentage = 
    machine.targetCount > 0 
      ? Math.round((machine.totalCount / machine.targetCount) * 100) 
      : 0;
  
  const statusColor = getStatusColor(machine.status);
  
  // Default scale based on machine type
  const modelScale = machine.type === 'turning' ? 0.2 : 
                    machine.type === 'edm' ? 0.9 : 
                    1.0;
  
  // Adjust status indicator height based on machine type and scale
  const statusHeight = machine.type === 'turning' ? 0.2 : 
                      machine.type === 'edm' ? 0.2 : 
                      0.8;
  
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
      {/* Main machine with loaded model */}
      <group 
        ref={machineRef}
        position={[0, 0, 0]}
      >
        {/* 3D Model container - will be filled with the loaded model */}
        <group 
          ref={modelRef} 
          position={[0, 0, 0]}
          scale={[modelScale, modelScale, modelScale]}
        />
        
        {/* Fallback if model fails to load */}
        {!modelLoaded && (
          <>
            {/* Simple machine shape as fallback */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4, 3, 4]} />
              <meshStandardMaterial 
                color="#f8fafc" 
                metalness={0.6}
                roughness={0.2}
                opacity={machine.status === 'OFF' ? 0.8 : 1}
                transparent={machine.status === 'OFF'}
              />
            </mesh>
            
            {/* Simple base */}
            <mesh position={[0, -1.75, 0]} receiveShadow>
              <boxGeometry args={[5, 0.5, 5]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.2} />
            </mesh>
          </>
        )}
        
        {/* Status indicator light - always visible */}
        <mesh 
          ref={statusLightRef}
          position={[0, statusHeight, 0]} 
          castShadow
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial 
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={machine.status === 'OFF' ? 0.1 : (isSelected ? 0.8 : 0.5)}
            metalness={0.1}
            roughness={0.3}
          />
        </mesh>
        
        {/* Status ring around light */}
        <mesh 
          position={[0, statusHeight, 0]} 
          rotation={[Math.PI/2, 0, 0]}
        >
          <torusGeometry args={[0.8, 0.1, 16, 32]} />
          <meshStandardMaterial 
            color="#1e293b"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>
      
      {/* Information panel */}
      <Html
        position={[0, statusHeight + 0.2, 0]}
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
                machine.status === 'ERROR' ? 'error' :
                machine.status === 'MAINTENANCE' ? 'processing' :
                machine.status === 'IDLE' ? 'default' :
                'default'
              }
              text={machine.status}
            />
            
            <div className="text-xs font-medium">
              OEE: {machine.oee || 0}%
            </div>
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Progress</span>
              <span className="font-medium">{machine.totalCount || 0}/{machine.targetCount || 0}</span>
            </div>
            <Progress 
              percent={completionPercentage} 
              size="small" 
              status={
                machine.status === 'ERROR' ? 'exception' :
                machine.status === 'OFF' ? 'normal' :
                completionPercentage >= 100 ? 'success' :
                machine.status === 'PRODUCTION' ? 'active' : 'normal'
              }
              strokeColor={
                machine.status === 'PRODUCTION' ? 
                  {from: '#10b981', to: '#059669'} : 
                machine.status === 'ERROR' ?
                  {from: '#ef4444', to: '#b91c1c'} :
                machine.status === 'MAINTENANCE' ?
                  {from: '#6366f1', to: '#4f46e5'} :
                machine.status === 'ON' ?
                  {from: '#f59e0b', to: '#d97706'} :
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