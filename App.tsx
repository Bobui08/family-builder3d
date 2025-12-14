import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { FlagSystem } from './components/FlagSystem';
import { WebcamController } from './components/WebcamController';
import { UIOverlay } from './components/UIOverlay';
import { Leva } from 'leva';

const SceneContent: React.FC = () => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 35]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        maxPolarAngle={Math.PI / 1.5} 
        minPolarAngle={Math.PI / 3}
        maxDistance={60}
        minDistance={10}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffaa00" />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#ff0000" />
      
      {/* Environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Core Component */}
      <FlagSystem />
      
      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          intensity={1.2} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export default function App() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans">
      <UIOverlay />
      <WebcamController />
      
      {/* Leva UI styling */}
      <div className="fixed top-20 right-4 z-50">
        <Leva fill flat collapsed />
      </div>

      <Canvas dpr={[1, 2]} gl={{ antialias: false, alpha: false, stencil: false, depth: true }}>
        <color attach="background" args={['#050505']} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
