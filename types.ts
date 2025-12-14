export interface ParticleConfig {
  count: number;
  size: number;
  waveStrength: number;
  waveSpeed: number;
  expansion: number; // Controlled by gesture
  redColor: string;
  yellowColor: string;
  isWaveEnabled: boolean;
  debugMode: boolean;
}

export interface GestureState {
  hasHands: boolean;
  distance: number; // 0 to 1 normalized
  isPinching: boolean;
}

// MediaPipe Global Types (since we are loading via CDN for stability)
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}
