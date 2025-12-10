import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AppState, PARTICLE_COUNT, ShapeType } from '../types';
import { generateShapePositions, generateTextPositions } from '../services/shapes';

// Fix for TypeScript not recognizing R3F elements in IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
    }
  }
}

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  handOpenness: number;
  isHandDetected: boolean;
}

const Particles = ({ 
  shape, 
  color, 
  handOpenness, 
  isHandDetected 
}: ParticlesProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const targetPositions = useMemo(() => generateShapePositions(shape), [shape]);
  
  // Secondary target for morphing (used for Ligugu -> miss u)
  const morphTargetPositions = useMemo(() => {
    if (shape === ShapeType.LIGUGU) {
      return generateTextPositions("miss u");
    }
    return null;
  }, [shape]);
  
  // Current positions buffer
  const currentPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  
  // Initialize current positions to target to start
  useEffect(() => {
    currentPositions.set(targetPositions);
  }, []); // Only on mount

  // Animation Loop
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    
    // Smooth factor (Lerp speed)
    // Was 0.05, increased to 0.15 for snappier, silkier response
    const lerpFactor = 0.15;
    
    // Hand Control Factors
    // If hand is detected:
    // openness 0 -> compact
    // openness 1 -> exploded/scaled up
    
    // Base scale breathing effect if no hand
    const time = state.clock.getElapsedTime();
    const breathe = Math.sin(time) * 0.1 + 1; 

    // Target Modifier based on hand
    let expansion = 1; 
    let noiseAmp = 0;
    
    if (isHandDetected) {
      // Adjusted expansion for better feel
      expansion = 1 + handOpenness * 2.0; 
      noiseAmp = handOpenness * 0.3; 
    } else {
      expansion = breathe; // Idle animation
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      
      let tx, ty, tz;

      // Special Morph Logic for Ligugu
      if (shape === ShapeType.LIGUGU && morphTargetPositions && isHandDetected) {
         // Lerp between "Ligugu" (targetPositions) and "miss u" (morphTargetPositions)
         // based on handOpenness
         
         const t1x = targetPositions[idx];
         const t1y = targetPositions[idx + 1];
         const t1z = targetPositions[idx + 2];

         const t2x = morphTargetPositions[idx];
         const t2y = morphTargetPositions[idx + 1];
         const t2z = morphTargetPositions[idx + 2];

         // Interpolate targets
         tx = t1x + (t2x - t1x) * handOpenness;
         ty = t1y + (t2y - t1y) * handOpenness;
         tz = t1z + (t2z - t1z) * handOpenness;

         // Ligugu doesn't explode, it morphs, so we reset expansion
         expansion = 1.0; 
         // Add a little shimmer when open
         noiseAmp = handOpenness * 0.1;
      } else {
         // Standard Behavior
         tx = targetPositions[idx];
         ty = targetPositions[idx + 1];
         tz = targetPositions[idx + 2];
      }
      
      // Apply Expansion (Center outward)
      const targetVecX = tx * expansion;
      const targetVecY = ty * expansion;
      const targetVecZ = tz * expansion;
      
      // Apply Noise/Jitter if spread
      const noiseX = (Math.random() - 0.5) * noiseAmp;
      const noiseY = (Math.random() - 0.5) * noiseAmp;
      const noiseZ = (Math.random() - 0.5) * noiseAmp;

      // Lerp Current to Target
      positions[idx] += (targetVecX + noiseX - positions[idx]) * lerpFactor;
      positions[idx + 1] += (targetVecY + noiseY - positions[idx + 1]) * lerpFactor;
      positions[idx + 2] += (targetVecZ + noiseZ - positions[idx + 2]) * lerpFactor;
    }

    geometry.attributes.position.needsUpdate = true;
    
    // Rotate entire system slowly
    pointsRef.current.rotation.y += 0.001;
    if (isHandDetected) {
        // Rotate faster if interacting
        pointsRef.current.rotation.y += handOpenness * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06} // Slightly larger particles for better text visibility
        color={color}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
};

interface SceneProps {
  appState: AppState;
}

const Scene: React.FC<SceneProps> = ({ appState }) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3}/>
        <ambientLight intensity={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Particles 
          shape={appState.currentShape} 
          color={appState.particleColor}
          handOpenness={appState.handOpenness}
          isHandDetected={appState.isHandDetected}
        />
      </Canvas>
    </div>
  );
};

export default Scene;