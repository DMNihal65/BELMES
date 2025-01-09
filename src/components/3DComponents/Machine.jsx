import React, { useRef, useState } from 'react';
import { Html, Outlines } from '@react-three/drei';
import { useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';

export const Machine = ({ position, status, data }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const statusColors = {
    running: '#22c55e',
    idle: '#eab308',
    stopped: '#ef4444',
  };

  const glowIntensity = status === 'running' ? 1.5 : 1;
  
  const obj = useLoader(OBJLoader, '');
  const adjustedPosition = [position[0], position[1] + 2, position[2]];

  useFrame(() => {
    if (status === 'running' && meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  const model = obj.clone();
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshPhysicalMaterial({
        color: statusColors[status],
        metalness: 0.8,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        emissive: statusColors[status],
        emissiveIntensity: glowIntensity,
        transparent: true,
        opacity: 0.95,
      });
      // Add edge geometry for better visibility
      const edges = new THREE.EdgesGeometry(child.geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ 
          color: statusColors[status],
          linewidth: 1.5,
          opacity: 1.5,
          transparent: true 
        })
      );
      child.add(line);
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <group position={adjustedPosition}>
      <primitive 
        ref={meshRef}
        object={model}
        scale={[0.02, 0.02, 0.02]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <Outlines 
          thickness={0.05}
          color={hovered ? "#ffffff" : statusColors[status]}
          transparent
          opacity={0.7}
        />
      </primitive>

      {/* Base platform for each machine */}
      <mesh position={[0, -1.8, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial 
          color={statusColors[status]} 
          opacity={0.1} 
          transparent 
          roughness={0.9}
        />
      </mesh>

      {/* Status indicator light */}
      {status === 'running' && (
        <pointLight
          position={[0, 0, 0]}
          distance={3}
          intensity={0.5}
          color={statusColors[status]}
        />
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={20} position={[0, 3, 0]}>
          <div className="bg-white/95 p-4 rounded-xl shadow-lg min-w-[250px] border border-gray-200">
            <h3 className="font-bold text-lg mb-2">{data.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Power:</span>
                <span className="font-medium">{data.Power} kW</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Energy:</span>
                <span className="font-medium">{data.energy}kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold px-2 py-1 rounded-full text-sm ${
                  status === 'running' ? 'bg-green-100 text-green-700' : 
                  status === 'idle' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};
