import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface VisionControllerProps {
  onHandUpdate: (openness: number, detected: boolean) => void;
}

const VisionController: React.FC<VisionControllerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const lastVideoTime = useRef(-1);
  const requestRef = useRef<number | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const isLoopRunning = useRef(false);

  // Initialize MediaPipe and Camera
  useEffect(() => {
    let active = true;

    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        if (!active) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        
        if (active) {
          handLandmarkerRef.current = landmarker;
          setLoading(false);
          // If the loop isn't running yet (e.g. video loaded first but waited for model), start it
          if (!isLoopRunning.current && videoRef.current && videoRef.current.readyState >= 2) {
             predictWebcam();
          }
        }
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    // Start Webcam immediately to trigger permissions
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          // Event listener will trigger when data is ready
          videoRef.current.addEventListener('loadeddata', () => {
             if (!isLoopRunning.current) predictWebcam();
          });
        }
      } catch (err) {
        console.error("Webcam denied:", err);
        if (active) setPermissionError(true);
      }
    };

    startWebcam();
    initMediaPipe();

    return () => {
       active = false;
       if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
       if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
       }
    };
  }, []);

  const predictWebcam = () => {
    isLoopRunning.current = true;
    
    if (videoRef.current && handLandmarkerRef.current && !videoRef.current.paused && !videoRef.current.ended) {
       const nowInMs = Date.now();
       if (videoRef.current.currentTime !== lastVideoTime.current) {
         lastVideoTime.current = videoRef.current.currentTime;
         
         const startTimeMs = performance.now();
         const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
   
         if (results.landmarks && results.landmarks.length > 0) {
           // Calculate openness
           let totalDist = 0;
           let count = 0;
           
           for (const landmarks of results.landmarks) {
             const wrist = landmarks[0];
             // Tips: 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
             const tips = [4, 8, 12, 16, 20];
             
             tips.forEach(tipIdx => {
                const tip = landmarks[tipIdx];
                const dist = Math.sqrt(
                  Math.pow(tip.x - wrist.x, 2) + 
                  Math.pow(tip.y - wrist.y, 2)
                );
                totalDist += dist;
                count++;
             });
           }
           
           const avgDist = totalDist / count;
           // Normalize: Fist ~0.15, Spread ~0.4+
           let openness = (avgDist - 0.15) / (0.4 - 0.15);
           openness = Math.max(0, Math.min(1, openness)); 
           
           onHandUpdate(openness, true);
         } else {
           onHandUpdate(0, false);
         }
       }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-80 overflow-hidden rounded-xl border border-white/20 shadow-2xl w-40 h-32 bg-black/50 backdrop-blur-md">
       <video 
         ref={videoRef} 
         autoPlay 
         playsInline
         className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
         muted
       />
       {loading && (
         <div className="absolute inset-0 flex items-center justify-center text-xs text-white bg-black/80">
           Loading AI...
         </div>
       )}
       {permissionError && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400 bg-black/80 p-2 text-center">
            Camera access required. Please allow in browser settings.
          </div>
       )}
       <div className="absolute bottom-1 left-0 right-0 text-[10px] text-center text-white/70">
         Gesture Input
       </div>
    </div>
  );
};

export default VisionController;