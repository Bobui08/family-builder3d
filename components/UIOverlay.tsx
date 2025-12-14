import React from 'react';
import { useStore } from '../store';

export const UIOverlay: React.FC = () => {
  const gesture = useStore((state) => state.gesture);
  const toggleFullscreen = useStore((state) => state.toggleFullscreen);

  return (
    <>
      {/* Header */}
      <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-40">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
            VIETNAM
            <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]"> STAR</span>
          </h1>
          <p className="text-white/60 text-sm mt-1 max-w-md">
            Interactive Particle Simulation
          </p>
        </div>
        
        <button 
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
            toggleFullscreen();
          }}
          className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full border border-white/10 transition-colors"
        >
          Toggle Fullscreen
        </button>
      </div>

      {/* Instructions / Gesture Feedback */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none text-center z-40">
        <div className={`transition-all duration-300 transform ${gesture.hasHands ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-black/50 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl">
            <p className="text-white/90 font-medium text-sm">
              Hands Detected
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex flex-col items-center">
                 <span className="text-[10px] uppercase tracking-widest text-white/50">Action</span>
                 <span className="text-yellow-400 text-xs font-bold">
                   {gesture.distance < 0.3 ? "COMPRESSING" : gesture.distance > 0.7 ? "EXPANDING" : "HOVERING"}
                 </span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex flex-col items-center">
                 <span className="text-[10px] uppercase tracking-widest text-white/50">Intensity</span>
                 <div className="w-16 h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                   <div 
                      className="h-full bg-red-500 transition-all duration-100" 
                      style={{ width: `${gesture.distance * 100}%` }}
                   />
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`transition-all duration-500 delay-500 ${!gesture.hasHands ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/40 text-sm animate-pulse">
            Show your hands to control the flag
          </p>
        </div>
      </div>
    </>
  );
};
