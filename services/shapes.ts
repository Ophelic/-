
import * as THREE from 'three';
import { PARTICLE_COUNT, ShapeType } from '../types';

// Helper: Random point in sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Helper: Generate positions from text using a temporary canvas
export const generateTextPositions = (text: string): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 200;
  const height = 100;
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial'; // Thicker font for better volume
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const validPixels: number[] = [];

    // Collect all valid pixel coordinates
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        // If pixel is bright enough
        if (data[index] > 128) { 
          validPixels.push(x, y);
        }
      }
    }

    // Assign particles to pixels
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x, y, z;
      const idx = i * 3;

      if (validPixels.length > 0) {
        // Randomly sample from valid pixels to fill volume
        const pixelIndex = Math.floor(Math.random() * (validPixels.length / 2)) * 2;
        const px = validPixels[pixelIndex];
        const py = validPixels[pixelIndex + 1];

        // Map 2D pixel to 3D space centered
        x = (px - width / 2) * 0.1; 
        y = -(py - height / 2) * 0.1; // Flip Y
        z = (Math.random() - 0.5) * 0.5; // Slight depth for 3D effect
      } else {
        // Fallback if no text pixels found (shouldn't happen)
        const p = randomInSphere(1);
        x = p.x; y = p.y; z = p.z;
      }
      
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
    }
  }

  return positions;
};

export const generateShapePositions = (shape: ShapeType): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const tempVec = new THREE.Vector3();

  // Special handling for Text shapes
  if (shape === ShapeType.LIGUGU) {
    return generateTextPositions("Ligugu");
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (shape) {
      case ShapeType.HEART: {
        // Parametric Heart
        const t = Math.random() * Math.PI * 2;
        // Variation to make it 3D
        const zVar = (Math.random() - 0.5) * 5; 
        
        // 2D heart base
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        
        // Scale down
        x = hx * 0.25;
        y = hy * 0.25;
        z = zVar * (1 - Math.abs(hy)/20); // Taper z towards bottom
        break;
      }

      case ShapeType.SATURN: {
        const isRing = Math.random() > 0.6; // 40% planet, 60% ring
        if (isRing) {
          const innerR = 4;
          const outerR = 8;
          const theta = Math.random() * Math.PI * 2;
          const radius = innerR + Math.random() * (outerR - innerR);
          x = radius * Math.cos(theta);
          z = radius * Math.sin(theta);
          y = (Math.random() - 0.5) * 0.2; // Thin ring
        } else {
          // Planet body
          const p = randomInSphere(2.5);
          x = p.x; y = p.y; z = p.z;
        }
        // Tilt Saturn
        const tilt = Math.PI / 6;
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);
        const newX = x * cosT - y * sinT;
        const newY = x * sinT + y * cosT;
        x = newX;
        y = newY;
        break;
      }

      case ShapeType.FLOWER: {
        // Rose curve / Flower shape
        const k = 4; // Petals
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI; // 3D depth
        const rBase = Math.cos(k * theta);
        const r = 3 * Math.abs(rBase) + 1;
        
        x = r * Math.cos(theta) * Math.cos(phi) * 0.8;
        y = r * Math.sin(theta) * Math.cos(phi) * 0.8;
        z = 2 * Math.sin(phi);
        break;
      }

      case ShapeType.ZEN: {
        // Simplified Meditating Figure (Stacked Spheres/Ovals)
        const part = Math.random();
        
        if (part < 0.2) { 
          // Head
          const p = randomInSphere(0.8);
          x = p.x; y = p.y + 2.5; z = p.z;
        } else if (part < 0.6) {
          // Body
          const p = randomInSphere(1.8);
          // Scale to oval
          x = p.x * 1.2; y = p.y * 1.4; z = p.z * 0.8;
        } else {
          // Legs/Base
          const theta = Math.random() * Math.PI * 2; // Circle
          const rad = 2 + Math.random();
          x = rad * Math.cos(theta);
          y = -2 + (Math.random() * 0.5);
          z = rad * Math.sin(theta);
          // Flatten front/back slightly for crossed legs illusion
          z *= 0.6;
        }
        break;
      }

      case ShapeType.FIREWORKS: {
        // Explosion from center
        const p = randomInSphere(1);
        const distance = 0.2 + Math.random() * 6; // Spread out
        tempVec.set(p.x, p.y, p.z).normalize().multiplyScalar(distance);
        x = tempVec.x; y = tempVec.y; z = tempVec.z;
        break;
      }

      case ShapeType.SPHERE:
      default: {
        const p = randomInSphere(4);
        x = p.x; y = p.y; z = p.z;
        break;
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};
