import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function Orb() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Smoothly rotate the orb
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color="#ff6b00"
          attach="material"
          distort={0.4} // Level of distortion
          speed={1.5}   // Speed of distortion
          roughness={0.1}
          metalness={0.8}
          transmission={0.9} // Glass effect
          thickness={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
    </Float>
  );
}

export function AnimatedOrb() {
  return (
    <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] pointer-events-none absolute right-[-50px] top-[-50px] opacity-60 mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#0066ff" />
        <Orb />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
