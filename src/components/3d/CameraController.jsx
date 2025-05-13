import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Advanced camera controller with different viewpoints and transitions
const CameraController = ({ 
  selectedMachine = null,
  view = 'overview', // 'overview', 'firstPerson', 'topDown', 'focusMachine'
  enableTransitions = true 
}) => {
  const controlsRef = useRef();
  const cameraRef = useRef();
  const { camera, scene, gl } = useThree();
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  
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
    overview: { position: [0, 10, 43], target: [0, 0, 0] },
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
  
  // Update camera when view or selected machine changes
  useEffect(() => {
    if (!controlsRef.current || !camera) return;
    
    const transition = transitionRef.current;
    let targetPosition, targetLookAt;
    
    // Determine target position and look-at point based on view type
    if (view === 'focusMachine' && selectedMachine) {
      // For focused machine view, determine machine position
      const machinePos = getMachinePosition(selectedMachine);
      
      // Calculate offset based on machine type for better viewing angle
      const offsetMultiplier = selectedMachine.type === 'turning' ? 1.2 : 
                              selectedMachine.type === 'edm' ? 1.5 : 1;
      
      // Position camera at an offset from the machine for a good view
      // Place camera in front of the machine based on its implied rotation
      if (selectedMachine.type === 'turning') {
        // For turning machines (left side)
        targetPosition = [
          machinePos[0] + 10, 
          machinePos[1] + 5, 
          machinePos[2]
        ];
      } else if (selectedMachine.type === 'milling') {
        // For milling machines (right side)
        targetPosition = [
          machinePos[0] - 10, 
          machinePos[1] + 5, 
          machinePos[2]
        ];
      } else if (selectedMachine.type === 'edm') {
        // For EDM machines (back)
        targetPosition = [
          machinePos[0], 
          machinePos[1] + 5, 
          machinePos[2] + 10
        ];
      } else {
        // Default positioning
        targetPosition = [
          machinePos[0] + 8 * offsetMultiplier, 
          machinePos[1] + 5, 
          machinePos[2] + 8 * offsetMultiplier
        ];
      }
      
      // Look at the machine, slightly above ground level for better composition
      targetLookAt = [
        machinePos[0],
        machinePos[1] + 2,
        machinePos[2]
      ];
    } else {
      // Use predefined view position
      targetPosition = viewPositions[view]?.position || viewPositions.overview.position;
      targetLookAt = viewPositions[view]?.target || viewPositions.overview.target;
    }
    
    const shouldTransition = enableTransitions && !isLowPerformance;
    
    if (shouldTransition) {
      // Start transition
      transition.inProgress = true;
      transition.progress = 0;
      
      // Store current camera position and target
      transition.startPosition.copy(camera.position);
      transition.startTarget.copy(controlsRef.current.target);
      
      // Set end position and target
      transition.endPosition.set(...targetPosition);
      transition.endTarget.set(...targetLookAt);
    } else {
      // Immediately set camera position and target
      camera.position.set(...targetPosition);
      controlsRef.current.target.set(...targetLookAt);
      
      // Make sure to update controls
      controlsRef.current.update();
    }
  }, [view, selectedMachine, camera, enableTransitions, isLowPerformance]);
  
  // Handle smooth camera transitions
  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    const transition = transitionRef.current;
    
    // Skip transitions on low performance devices
    if (isLowPerformance && transition.inProgress) {
      transition.inProgress = false;
      camera.position.copy(transition.endPosition);
      controlsRef.current.target.copy(transition.endTarget);
      controlsRef.current.update();
      return;
    }
    
    if (transition.inProgress) {
      // Update progress
      transition.progress += delta / transition.duration;
      
      if (transition.progress >= 1) {
        // Finish transition
        transition.progress = 1;
        transition.inProgress = false;
      }
      
      // Apply easing function for smooth movement
      const easeProgress = easeOutCubic(transition.progress);
      
      // Update camera position
      camera.position.lerpVectors(
        transition.startPosition,
        transition.endPosition,
        easeProgress
      );
      
      // Update orbit controls target
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(
          transition.startTarget,
          transition.endTarget,
          easeProgress
        );
        
        // Ensure controls are updated
        controlsRef.current.update();
      }
    }
  });
  
  // Easing function for smoother transitions
  const easeOutCubic = (x) => {
    return 1 - Math.pow(1 - x, 3);
  };
  
  // Optimize controls based on performance level
  const getControlsConfig = () => {
    if (isLowPerformance) {
      return {
        enablePan: true,
        enableZoom: true,
        enableRotate: true,
        minDistance: 5,
        maxDistance: 100,
        maxPolarAngle: Math.PI / 2 - 0.1,
        minPolarAngle: Math.PI / 12,
        dampingFactor: 0, // No damping for better performance
        enableDamping: false,
        rotateSpeed: 0.5,
        zoomSpeed: 0.8,
      };
    }
    
    return {
      enablePan: true,
      enableZoom: true,
      enableRotate: true,
      minDistance: 5,
      maxDistance: 100,
      maxPolarAngle: Math.PI / 2 - 0.1,
      minPolarAngle: Math.PI / 12,
      dampingFactor: 0.1,
      enableDamping: true,
      rotateSpeed: 0.5,
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
    </>
  );
};

export default CameraController; 