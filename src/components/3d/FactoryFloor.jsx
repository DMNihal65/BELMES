import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

// Factory floor with concrete texture and grid lines
const FactoryFloor = ({ size = 100 }) => {
  const floorRef = useRef();
  const { scene } = useThree();
  
  useEffect(() => {
    if (floorRef.current) {
      try {
        // Add subtle concrete texture to floor
        const textureLoader = new THREE.TextureLoader();
        
        // Load concrete texture (use a placeholder path - create a basic texture if not found)
        textureLoader.load('/textures/concrete_floor.jpg', 
          // Success callback - texture loaded successfully
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(size/10, size/10);
            
            // Apply textures to floor material
            if (floorRef.current.material) {
              floorRef.current.material.map = texture;
              floorRef.current.material.needsUpdate = true;
            }
          },
          // Progress callback
          undefined,
          // Error callback - create procedural concrete texture
          (error) => {
            console.warn('Could not load concrete texture, using procedural texture instead:', error);
            
            // Create a procedural concrete texture
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Fill base color
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add specks and variations to create concrete look
            for (let i = 0; i < 5000; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const radius = Math.random() * 2 + 0.5;
              const color = Math.random() > 0.5 ? '#d0d0d0' : '#c0c0c0';
              
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(size/10, size/10);
            
            // Apply texture
            if (floorRef.current.material) {
              floorRef.current.material.map = texture;
              floorRef.current.material.needsUpdate = true;
            }
          }
        );
      } catch (err) {
        console.error('Error creating floor texture:', err);
      }
    }
  }, [size]);

  return (
    <group>
      {/* Main floor */}
      <mesh 
        ref={floorRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]} 
        receiveShadow
      >
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial 
          color="#e0e0e0" 
          roughness={0.8} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Grid overlay */}
      <Grid
        position={[0, -0.01, 0]}
        args={[size, size]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#4b5563"
        fadeDistance={50}
        fadeStrength={1}
      />
      
      {/* Additional factory elements */}
      <FactoryWalls size={size} />
      <FloorMarkings />
    </group>
  );
};

// Factory walls
const FactoryWalls = ({ size = 100 }) => {
  const halfSize = size / 2;
  const wallHeight = 15;
  
  return (
    <>
      {/* Back wall */}
      <mesh position={[0, wallHeight/2, -halfSize]} receiveShadow castShadow>
        <boxGeometry args={[size, wallHeight, 0.5]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-halfSize, wallHeight/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow castShadow>
        <boxGeometry args={[size, wallHeight, 0.5]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.9} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[halfSize, wallHeight/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow castShadow>
        <boxGeometry args={[size, wallHeight, 0.5]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.9} />
      </mesh>
      
      {/* Windows on walls */}
      <WindowsRow position={[0, 8, -halfSize+0.3]} rotation={[0, 0, 0]} width={size-20} />
      <WindowsRow position={[-halfSize+0.3, 8, 0]} rotation={[0, Math.PI/2, 0]} width={size-20} />
      <WindowsRow position={[halfSize-0.3, 8, 0]} rotation={[0, Math.PI/2, 0]} width={size-20} />
      
      {/* Roof structure */}
      <mesh position={[0, wallHeight, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#9ca3af" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Support columns */}
      {Array.from({ length: 0 }).map((_, i) => (
        Array.from({ length: 0 }).map((_, j) => (
          <SupportColumn 
            key={`column-${i}-${j}`}
            position={[
              -halfSize + 20 + i * 20,
              wallHeight/2,
              -halfSize + 20 + j * 20
            ]}
          />
        ))
      ))}
    </>
  );
};

// Windows row
const WindowsRow = ({ position, rotation, width }) => {
  const windowCount = Math.floor(width / 15);
  const spacing = width / windowCount;
  
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: windowCount }).map((_, i) => {
        const xPos = -width/2 + spacing/2 + i * spacing;
        return (
          <mesh key={`window-${i}`} position={[xPos, 0, 0]}>
            <boxGeometry args={[5, 3, 0.2]} />
            <meshStandardMaterial 
              color="#93c5fd" 
              transparent 
              opacity={0.7} 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Support column
const SupportColumn = ({ position }) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 15, 1]} />
      <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.3} />
    </mesh>
  );
};

// Floor markings for walkways and machine areas
const FloorMarkings = () => {
  return (
    <group position={[0, 0.01, 0]}>
      {/* Main walkway */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 5]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.7} />
      </mesh>
      
      {/* Cross walkway */}
      <mesh rotation={[-Math.PI/2, Math.PI/2, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 5]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.7} />
      </mesh>
      
      {/* Machine area markings - left side */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[-20, 0, -20]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.3} />
      </mesh>
      
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[20, 0, -20]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.3} />
      </mesh>
      
      {/* Machine area markings - right side */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[-20, 0, 20]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.3} />
      </mesh>
      
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[20, 0, 20]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default FactoryFloor; 