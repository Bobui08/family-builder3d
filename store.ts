import { create } from 'zustand';
import { GestureState } from './types';

interface AppState {
  // Gesture State
  gesture: GestureState;
  setGesture: (gesture: Partial<GestureState>) => void;
  
  // UI State overrides
  videoReady: boolean;
  setVideoReady: (ready: boolean) => void;
  
  fullscreen: boolean;
  toggleFullscreen: () => void;
}

export const useStore = create<AppState>((set) => ({
  gesture: {
    hasHands: false,
    distance: 0.5,
    isPinching: false,
  },
  setGesture: (update) => 
    set((state) => ({ gesture: { ...state.gesture, ...update } })),
    
  videoReady: false,
  setVideoReady: (ready) => set({ videoReady: ready }),
  
  fullscreen: false,
  toggleFullscreen: () => set((state) => ({ fullscreen: !state.fullscreen })),
}));
