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
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add specks and variations to create concrete look
            for (let i = 0; i < 5000; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const radius = Math.random() * 2 + 0.5;
              const color = Math.random() > 0.5 ? '#d1d5db' : '#9ca3af';
              
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
          color="#e5e7eb" 
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
        cellColor="#9ca3af"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#6b7280"
        fadeDistance={80}
        fadeStrength={1}
      />
      
      {/* Additional factory elements */}
      <FactoryWalls size={size} />
      <FloorMarkings />
    </group>
  );
};

// Factory walls with windows like in the image
const FactoryWalls = ({ size = 100 }) => {
  const halfSize = size / 2;
  const wallHeight = 20;
  
  // Create wall texture
  const generateWallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base color - light gray
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle vertical stripes for industrial wall panels
    for (let i = 0; i < 8; i++) {
      const x = (i / 8) * canvas.width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(x, 0, 1, canvas.height);
      
      // Add horizontal stripe every 20%
      for (let j = 0; j < 5; j++) {
        const y = (j / 5) * canvas.height;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, y, canvas.width, 1);
      }
    }
    
    // Add subtle noise
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const opacity = Math.random() * 0.05;
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 2);
    
    return texture;
  };
  
  const wallTexture = generateWallTexture();
  
  return (
    <>
      {/* Back wall with EDM room */}
      <mesh position={[0, wallHeight/2, -halfSize]} receiveShadow castShadow>
        <boxGeometry args={[size, wallHeight, 0.5]} />
        <meshStandardMaterial 
          color="#f8fafc" 
          roughness={0.9}
          map={wallTexture}
        />
      </mesh>
      
      {/* Left wall with windows */}
      <mesh position={[-halfSize, wallHeight/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow castShadow>
        <boxGeometry args={[size, wallHeight, 0.5]} />
        <meshStandardMaterial 
          color="#f1f5f9" 
          roughness={0.9}
          map={wallTexture}
        />
      </mesh>
      
      {/* Right wall with windows */}
      <mesh position={[halfSize, wallHeight/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow castShadow>
        <boxGeometry args={[size, wallHeight, 0.5]} />
        <meshStandardMaterial 
          color="#f1f5f9" 
          roughness={0.9}
          map={wallTexture}
        />
      </mesh>
      
      {/* Windows on walls - based on image */}
      <WindowsRow position={[0, 12, -halfSize+0.3]} rotation={[0, 0, 0]} width={size-20} />
      <WindowsRow position={[-halfSize+0.3, 12, 0]} rotation={[0, Math.PI/2, 0]} width={size-20} />
      <WindowsRow position={[halfSize-0.3, 12, 0]} rotation={[0, Math.PI/2, 0]} width={size-20} />
      
      {/* Ceiling - improved with panels */}
      <CeilingWithPanels position={[0, wallHeight, 0]} size={size} />
      
      {/* Ceiling lights */}
      <CeilingLights size={size} />
    </>
  );
};

// Better ceiling with panels
const CeilingWithPanels = ({ position, size }) => {
  // Create ceiling panel texture
  const generateCeilingTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base color - white
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add grid pattern for ceiling tiles
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += canvas.height / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += canvas.width / 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Add subtle noise texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const opacity = Math.random() * 0.03;
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 8, size / 8);
    
    return texture;
  };
  
  const ceilingTexture = generateCeilingTexture();
  
  return (
    <mesh position={position} rotation={[-Math.PI/2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial 
        color="#f8fafc" 
        roughness={0.7} 
        metalness={0.1}
        map={ceilingTexture}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Ceiling lights like the ones in the image - improved
const CeilingLights = ({ size }) => {
  const halfSize = size / 2 - 10;
  
  // Ceiling light animation
  const lightRefs = useRef([]);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Subtle flickering effect for fluorescent lights
    lightRefs.current.forEach((ref, i) => {
      if (ref && ref.material) {
        // Create different flickering patterns for each light
        const flicker = 0.95 + Math.sin(time * 0.5 + i * 2.5) * 0.05;
        ref.material.emissiveIntensity = flicker;
      }
    });
  });
  
  // More realistic light pattern based on the image
  const lightPositions = [
    // Main rows of lights
    [-halfSize/2, 0, -halfSize/2],
    [-halfSize/2, 0, -halfSize/6],
    [-halfSize/2, 0, halfSize/6],
    [-halfSize/2, 0, halfSize/2],
    
    [0, 0, -halfSize/2],
    [0, 0, -halfSize/6],
    [0, 0, halfSize/6],
    [0, 0, halfSize/2],
    
    [halfSize/2, 0, -halfSize/2],
    [halfSize/2, 0, -halfSize/6],
    [halfSize/2, 0, halfSize/6], 
    [halfSize/2, 0, halfSize/2]
  ];
  
  // Create ceiling lights with fixture
  return (
    <group position={[0, 19.9, 0]}>
      {lightPositions.map((pos, i) => (
        <group key={`ceiling-light-${i}`} position={[pos[0], 0, pos[1]]}>
          {/* Light fixture */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <boxGeometry args={[6, 2, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.1} roughness={0.3} />
          </mesh>
          
          {/* Light diffuser */}
          <mesh 
            ref={(el) => lightRefs.current[i] = el}
            position={[0, -0.2, 0]} 
            rotation={[-Math.PI/2, 0, 0]}
          >
            <planeGeometry args={[5.5, 1.5]} />
            <meshStandardMaterial 
              color="#ffffff" 
              emissive="#ffffff" 
              emissiveIntensity={1}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Light fixture trim */}
          <mesh position={[0, -0.15, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[2.8, 3, 32]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Windows row - like the windows in the image
const WindowsRow = ({ position, rotation, width }) => {
  const windowCount = Math.floor(width / 15);
  const spacing = width / windowCount;
  
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: windowCount }).map((_, i) => {
        const xPos = -width/2 + spacing/2 + i * spacing;
        return (
          <mesh key={`window-${i}`} position={[xPos, 0, 0]}>
            <boxGeometry args={[5, 4, 0.2]} />
            <meshPhysicalMaterial 
              color="#bae6fd" 
              transparent 
              opacity={0.8} 
              metalness={0.1}
              roughness={0}
              transmission={0.6}
              ior={1.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Floor markings for walkways and machine areas - matching the yellow line in the image
const FloorMarkings = () => {
  return (
    <group position={[0, 0.01, 0]}>
      {/* Main walkway - central aisle like in the image */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[5, 80]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.7} />
      </mesh>
      
      {/* Cross walkway */}
      <mesh rotation={[-Math.PI/2, Math.PI/2, 0]} position={[0, 0, -15]}>
        <planeGeometry args={[5, 80]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.7} />
      </mesh>
      
      {/* Machine area markings - left side (turning) */}
      {[-30, -20, -10, 0, 10, 20, 30].map((zPos, index) => (
        <mesh key={`turning-area-${index}`} rotation={[-Math.PI/2, 0, 0]} position={[-20, 0, zPos]}>
          <planeGeometry args={[10, 5]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.2} />
        </mesh>
      ))}
      
      {/* Machine area markings - right side (milling) */}
      {[-25, -15, -5, 5, 15].map((zPos, index) => (
        <mesh key={`milling-area-${index}`} rotation={[-Math.PI/2, 0, 0]} position={[20, 0, zPos]}>
          <planeGeometry args={[10, 7]} />
          <meshStandardMaterial color="#10b981" transparent opacity={0.2} />
        </mesh>
      ))}
      
      {/* EDM area */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, -30]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export default FactoryFloor; 