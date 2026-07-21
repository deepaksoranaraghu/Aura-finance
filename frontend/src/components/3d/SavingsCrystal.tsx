import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshTransmissionMaterial, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

function Crystal() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <Icosahedron ref={meshRef} args={[1, 0]}>
        <MeshTransmissionMaterial
          color="#10b981"
          roughness={0.1}
          transmission={1}
          thickness={1.5}
          ior={1.5}
          chromaticAberration={0.06}
          anisotropy={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Icosahedron>
    </Float>
  );
}

export function SavingsCrystal() {
  return (
    <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={1} color="#10b981" />
        <Crystal />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
