
import React, { useState, useCallback } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import VisionController from './components/VisionController';
import { ShapeType, AppState } from './types';

function App() {
  const [currentShape, setShapeState] = useState<ShapeType>(ShapeType.HEART);
  const [particleColor, setParticleColor] = useState<string>('#4da6ff');
  const [handOpenness, setHandOpenness] = useState<number>(0);
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false);

  const setShape = useCallback((shape: ShapeType) => {
    setShapeState(shape);
  }, []);

  const setColor = useCallback((color: string) => {
    setParticleColor(color);
  }, []);

  const setHandStatus = useCallback((openness: number, detected: boolean) => {
    setHandOpenness(openness);
    setIsHandDetected(detected);
  }, []);

  const appState: AppState = {
    currentShape,
    particleColor,
    handOpenness,
    isHandDetected,
    setShape,
    setColor,
    setHandStatus
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Scene Background */}
      <Scene appState={appState} />

      {/* Main UI */}
      <UIOverlay 
        currentShape={currentShape} 
        setShape={setShape}
        currentColor={particleColor}
        setColor={setColor}
        isHandDetected={isHandDetected}
        handOpenness={handOpenness}
      />

      {/* Invisible Logic Controller for Camera */}
      <VisionController onHandUpdate={setHandStatus} />
    </div>
  );
}

export default App;
