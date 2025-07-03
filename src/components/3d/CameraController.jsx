import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

// Advanced camera controller with different viewpoints and transitions
const CameraController = ({ 
  selectedMachine = null,
  view = 'overview', // 'overview', 'firstPerson', 'topDown', 'focusMachine'
  enableTransitions = true,
  setView
}) => {
  const controlsRef = useRef();
  const cameraRef = useRef();
  const { camera, scene, gl } = useThree();
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  
  // Detect low performance on first render
  useEffect(() => {
    try {
      // Check if using hardware acceleration
      const canvas = gl.domElement;
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (context) {
        const debugInfo = context.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          // Check if using software renderer
          if (renderer && (
              renderer.includes('SwiftShader') || 
              renderer.includes('ANGLE') || 
              renderer.includes('llvmpipe') ||
              renderer.includes('Software') ||
              renderer.includes('Microsoft Basic Render')
          )) {
            setIsLowPerformance(true);
          }
        }
      }

      // Also check for mobile devices which typically have lower performance
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        setIsLowPerformance(true);
      }
    } catch (e) {
      console.warn("Could not check performance capabilities:", e);
      // Assume low performance on error to be safe
      setIsLowPerformance(true);
    }
  }, [gl]);
  
  // Define better camera positions for the new shop floor layout
  const viewPositions = {
    overview: { position: [-40, 40, 50], target: [0, 0, 0] },
    topDown: { position: [0, 70, 0], target: [0, 0, 0] },
    firstPerson: { position: [0, 5, 30], target: [0, 2, -10] },
    turningSection: { position: [-30, 15, 0], target: [-20, 3, 0] },
    millingSection: { position: [30, 15, 0], target: [20, 3, 0] },
    edmRoom: { position: [0, 8, -20], target: [0, 3, -30] },
    centerAisle: { position: [0, 8, 15], target: [0, 0, 0] },
    focusMachine: { position: [0, 8, 12], target: [0, 0, 0] }, // This will be adjusted based on selectedMachine
  };
  
  // Camera transition state
  const transitionRef = useRef({
    inProgress: false,
    startPosition: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    progress: 0,
    duration: 1.5 // seconds
  });
  
  // Get machine position based on machine type and id
  const getMachinePosition = (machine) => {
    if (!machine) return [0, 0, 0];
    
    // If machine has direct position property
    if (machine.position && Array.isArray(machine.position)) {
      return machine.position;
    }
    
    // Determine position based on type and id
    const type = machine.type || 'milling';
    const id = machine.id || 0;
    
    switch(type) {
      case 'turning':
        // Left side row
        const turningIndex = id % 7;
        return [-20, 2.3, -15 + turningIndex * 6];
      case 'milling':
        // Right side row
        const millingIndex = id % 5;
        return [20, 4, -12 + millingIndex * 7];
      case 'edm':
        // EDM room at back
        const edmIndex = id % 2;
        return [-5 + edmIndex * 10, 4, -30];
      default:
        return [0, 0, 0];
    }
  };
  
  // Easing function for smooth camera transitions
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Enhanced camera transition with easing
  useEffect(() => {
    if (!controlsRef.current || !camera) return;
    
    const transition = transitionRef.current;
    let targetPosition, targetLookAt;
    
    if (view === 'focusMachine' && selectedMachine) {
      const machinePos = selectedMachine.scenePosition || getMachinePosition(selectedMachine);
      const offsetMultiplier = selectedMachine.type === 'turning' ? 1.2 : selectedMachine.type === 'edm' ? 1.1 : 1.3;
      targetPosition = [
        machinePos[0] + 6 * offsetMultiplier,
        machinePos[1] + 5 * offsetMultiplier,
        machinePos[2] + 7 * offsetMultiplier
      ];
      targetLookAt = machinePos;
    } else {
      // Default overview
      targetPosition = [-30, 20, 42];
      targetLookAt = [0, 0, 0];
    }

    // Animate camera with cubic easing
    let start = null;
    const duration = 1100; // ms
    const initialPos = camera.position.clone();
    const initialTarget = controlsRef.current.target.clone();
    function animateCamera(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(t);
      camera.position.lerpVectors(initialPos, new THREE.Vector3(...targetPosition), eased);
      controlsRef.current.target.lerpVectors(initialTarget, new THREE.Vector3(...targetLookAt), eased);
      controlsRef.current.update();
      if (t < 1) {
        requestAnimationFrame(animateCamera);
      }
    }
    requestAnimationFrame(animateCamera);
  }, [view, selectedMachine, camera]);
  
  // Reset view handler
  const handleResetView = () => {
    setView('overview');
    setResetRequested(true);
    setTimeout(() => setResetRequested(false), 500);
  };
  
  // Optimize controls based on performance level
  const getControlsConfig = () => {
    // Always enable damping for smooth panning
    return {
      enablePan: true,
      enableZoom: true,
      enableRotate: true,
      minDistance: 5,
      maxDistance: 100,
      maxPolarAngle: Math.PI / 2 - 0.1,
      minPolarAngle: Math.PI / 12,
      dampingFactor: 0.2,
      enableDamping: true,
      rotateSpeed: 0.5,
      zoomSpeed: 0.8,
    };
  };
  
  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={viewPositions.overview.position}
        fov={45}
        near={0.1}
        far={1000}
      />
      
      <OrbitControls
        ref={controlsRef}
        {...getControlsConfig()}
      />
      
      {/* Floating Reset View Button */}
      <Html position={[0, 0, 0]} zIndexRange={[1000, 0]} style={{ pointerEvents: 'auto' }}>
        <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 1000 }}>
          {/* <button
            onClick={handleResetView}
            style={{
              background: '#1e293b',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              opacity: resetRequested ? 0.6 : 1,
              transition: 'opacity 0.2s',
              outline: 'none',
              letterSpacing: 0.2
            }}
            title="Reset to overview"
            disabled={resetRequested}
          >
            ⟳ Reset View
          </button> */}
        </div>
      </Html>
    </>
  );
};

export default CameraController; 