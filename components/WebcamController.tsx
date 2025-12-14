import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

// Helper to calculate Euclidean distance
const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const WebcamController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setGesture = useStore((state) => state.setGesture);
  const setVideoReady = useStore((state) => state.setVideoReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hands: any;
    let camera: any;

    const onResults = (results: any) => {
      setVideoReady(true);
      
      // If we have landmarks
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks;
        
        // Scenario 1: Two hands detected -> Measure distance between wrists or centers
        if (landmarks.length >= 2) {
          const hand1 = landmarks[0][0]; // Wrist
          const hand2 = landmarks[1][0]; // Wrist
          
          // Raw distance in normalized coords (0..1)
          const rawDist = getDistance(hand1, hand2);
          
          // Clamp and normalize for our app usage (usually 0.1 to 0.8 is the usable range)
          const normalizedDist = Math.min(Math.max((rawDist - 0.1) / 0.6, 0), 1);
          
          setGesture({
            hasHands: true,
            distance: normalizedDist,
            isPinching: false
          });
        } 
        // Scenario 2: One hand detected -> Detect Pinch (Index tip to Thumb tip)
        else {
          const hand = landmarks[0];
          const thumbTip = hand[4];
          const indexTip = hand[8];
          
          const pinchDist = getDistance(thumbTip, indexTip);
          const isPinching = pinchDist < 0.05;
          
          // Map pinch to distance logic:
          // Pinching (close) -> distance 0
          // Open hand -> distance 0.5 (neutral)
          
          setGesture({
            hasHands: true,
            distance: isPinching ? 0.2 : 0.5,
            isPinching: isPinching
          });
        }
      } else {
        // No hands
        setGesture({ hasHands: false });
      }
    };

    const initMediaPipe = async () => {
      if (!window.Hands || !window.Camera) {
        console.warn("MediaPipe scripts not loaded yet. Retrying...");
        setTimeout(initMediaPipe, 500);
        return;
      }

      try {
        hands = new window.Hands({locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                await hands.send({image: videoRef.current});
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
        }
      } catch (e) {
        console.error("Failed to init MediaPipe", e);
        setError("Camera permission denied or MediaPipe failed.");
      }
    };

    initMediaPipe();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, [setGesture, setVideoReady]);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <video 
        ref={videoRef} 
        className={`w-32 h-24 object-cover rounded-lg border-2 border-white/20 transform scale-x-[-1] transition-opacity duration-500 ${error ? 'opacity-0' : 'opacity-80 hover:opacity-100'}`}
        playsInline 
        muted
      />
      {error && <div className="text-red-500 text-xs bg-black/80 p-2 rounded">{error}</div>}
      <div className="text-[10px] text-white/50 mt-1 text-center">
        {useStore.getState().videoReady ? "Tracking Active" : "Initializing Camera..."}
      </div>
    </div>
  );
};
