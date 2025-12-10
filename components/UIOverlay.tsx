
import React, { useState } from 'react';
import { ShapeType } from '../types';

interface UIOverlayProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  isHandDetected: boolean;
  handOpenness: number;
}

const colors = [
  '#ffffff', // White
  '#ff4d4d', // Red
  '#4da6ff', // Blue
  '#ffcc00', // Yellow
  '#cc33ff', // Purple
  '#33ff99', // Green
  '#ff9933', // Orange
];

const UIOverlay: React.FC<UIOverlayProps> = ({
  currentShape,
  setShape,
  currentColor,
  setColor,
  isHandDetected,
  handOpenness
}) => {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="absolute top-0 left-0 p-6 z-40 max-w-sm w-full">
      <div className={`transition-all duration-500 ease-in-out bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl ${minimized ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              ZenParticles
            </h1>
            <p className="text-xs text-gray-400 mt-1">AI Hand Gesture Control</p>
          </div>
          <button 
            onClick={() => setMinimized(!minimized)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {minimized ? '+' : '-'}
          </button>
        </div>

        {!minimized && (
          <div className="space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <div className={`w-3 h-3 rounded-full ${isHandDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {isHandDetected ? 'Hand Detected' : 'No Hand Detected'}
                </div>
                {isHandDetected && (
                   <div className="w-full bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
                     <div 
                       className="bg-blue-500 h-full transition-all duration-100" 
                       style={{ width: `${handOpenness * 100}%` }} 
                     />
                   </div>
                )}
              </div>
            </div>

            {/* Shape Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Model</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ShapeType).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setShape(shape)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      currentShape === shape
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Particle Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 ${
                      currentColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 border-t border-white/10 pt-4 mt-2">
              <p>1. Allow camera access.</p>
              <p>2. Show your hand to the camera.</p>
              <p>3. <span className="text-blue-300">Open Hand</span>: Expand (or Morph)</p>
              <p>4. <span className="text-blue-300">Fist</span>: Contract & Focus</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UIOverlay;
