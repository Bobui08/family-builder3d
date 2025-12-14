import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateFlagParticles } from '../utils/geometry';
import { useStore } from '../store';
import { useControls, folder } from 'leva';

// Custom Shader Material for the particles
const ParticleShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uExpansion: { value: 1.0 }, // Gesture control: spread/pinch
    uWaveStrength: { value: 0.5 },
    uWaveSpeed: { value: 1.0 },
    uColorRed: { value: new THREE.Color('#DA251D') },
    uColorYellow: { value: new THREE.Color('#FFFF00') },
    uSize: { value: 0.25 }, // Increased default size for visibility
  },
  vertexShader: `
    uniform float uTime;
    uniform float uExpansion;
    uniform float uWaveStrength;
    uniform float uWaveSpeed;
    uniform float uSize;
    
    // 'position' is provided by Three.js default attributes
    attribute vec3 aColor; 
    
    varying vec3 vColor;
    varying float vDepth;

    // Simplex Noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vColor = aColor;
      
      vec3 pos = position;
      
      // Apply Expansion (Gesture)
      pos.x *= uExpansion;
      pos.y *= uExpansion;
      
      // Apply Wave (Noise)
      float noiseVal = snoise(vec2(pos.x * 0.1 - uTime * uWaveSpeed, pos.y * 0.1));
      
      // Z-displacement
      float zOffset = noiseVal * uWaveStrength * 2.0;
      float sineWave = sin(pos.x * 0.5 - uTime * uWaveSpeed * 2.0) * uWaveStrength;
      
      pos.z += zOffset + sineWave;
      
      vDepth = pos.z;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation for Points
      gl_PointSize = uSize * (300.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vDepth;
    uniform vec3 uColorRed;
    uniform vec3 uColorYellow;

    void main() {
      // Circular particle logic works now because we are using GL_POINTS
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) discard;
      
      float strength = 1.0 - length(coord) * 2.0;
      strength = pow(strength, 1.5);
      
      vec3 finalColor = vColor;
      
      // Add some depth darkening
      finalColor *= smoothstep(-10.0, 10.0, vDepth * 0.5 + 2.0);
      
      gl_FragColor = vec4(finalColor, 0.8 * strength);
    }
  `
};

export const FlagSystem: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const gesture = useStore((state) => state.gesture);
  
  // UI Controls
  const { 
    particleCount, 
    waveStrength, 
    waveSpeed, 
    pointSize,
    redColor,
    yellowColor,
    enableWave
  } = useControls('Flag Configuration', {
    particleCount: { value: 20000, min: 1000, max: 100000, step: 1000 },
    waveStrength: { value: 1.5, min: 0, max: 5 },
    waveSpeed: { value: 0.8, min: 0, max: 3 },
    pointSize: { value: 0.35, min: 0.05, max: 2.0 },
    enableWave: true,
    Colors: folder({
      redColor: '#DA251D',
      yellowColor: '#FFFF00',
    })
  });

  // Generate Geometry Data
  const { positions, colors } = useMemo(() => {
    return generateFlagParticles(particleCount);
  }, [particleCount]);

  // Animation Loop
  useFrame((state) => {
    if (!materialRef.current) return;
    
    const mat = materialRef.current;
    
    // Time
    mat.uniforms.uTime.value = enableWave ? state.clock.elapsedTime : 0;
    
    // Wave
    mat.uniforms.uWaveStrength.value = THREE.MathUtils.lerp(
      mat.uniforms.uWaveStrength.value, 
      enableWave ? waveStrength : 0, 
      0.1
    );
    mat.uniforms.uWaveSpeed.value = waveSpeed;
    mat.uniforms.uSize.value = pointSize;
    
    // Colors
    mat.uniforms.uColorRed.value.set(redColor);
    mat.uniforms.uColorYellow.value.set(yellowColor);

    // Gesture Integration
    let targetExpansion = 1.0;
    
    if (gesture.hasHands) {
        // Map 0..1 distance to 0.2..1.8 expansion
        targetExpansion = THREE.MathUtils.mapLinear(gesture.distance, 0, 1, 0.4, 2.0);
        
        // Boost wave strength if expanding
        const targetWaveBoost = THREE.MathUtils.mapLinear(gesture.distance, 0, 1, 0.5, 2.0);
         mat.uniforms.uWaveStrength.value *= targetWaveBoost;
    }

    // Smooth Lerp for Expansion
    mat.uniforms.uExpansion.value = THREE.MathUtils.lerp(
      mat.uniforms.uExpansion.value,
      targetExpansion,
      0.1
    );
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={positions.length / 3} 
          array={positions} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-aColor" 
          count={colors.length / 3} 
          array={colors} 
          itemSize={3} 
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        uniforms={ParticleShaderMaterial.uniforms}
        vertexShader={ParticleShaderMaterial.vertexShader}
        fragmentShader={ParticleShaderMaterial.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
