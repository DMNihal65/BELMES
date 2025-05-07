import React, { useRef, useEffect } from 'react';
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
  const { camera, scene } = useThree();
  
  const viewPositions = {
    overview: { position: [-50, 10, 10], target: [0, 0, 0] },
    topDown: { position: [0, 60, 0], target: [0, 0, 0] },
    firstPerson: { position: [0, 5, 30], target: [0, 5, 0] },
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
  
  // Update camera when view or selected machine changes
  useEffect(() => {
    if (!controlsRef.current || !camera) return;
    
    const transition = transitionRef.current;
    let targetPosition, targetLookAt;
    
    // Determine target position and look-at point based on view type
    if (view === 'focusMachine' && selectedMachine) {
      // Set position relative to selected machine
      const machinePos = selectedMachine.position || [0, 0, 0];
      targetPosition = [
        machinePos[0] + 8, 
        machinePos[1] + 8, 
        machinePos[2] + 8
      ];
      targetLookAt = machinePos;
    } else {
      // Use predefined view position
      targetPosition = viewPositions[view].position;
      targetLookAt = viewPositions[view].target;
    }
    
    if (enableTransitions) {
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
    }
  }, [view, selectedMachine, camera, enableTransitions]);
  
  // Handle smooth camera transitions
  useFrame((state, delta) => {
    const transition = transitionRef.current;
    
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
      }
    }
  });
  
  // Easing function for smoother transitions
  const easeOutCubic = (x) => {
    return 1 - Math.pow(1 - x, 3);
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
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 12}
        dampingFactor={0.1}
        rotateSpeed={0.5}
      />
    </>
  );
};

export default CameraController; 