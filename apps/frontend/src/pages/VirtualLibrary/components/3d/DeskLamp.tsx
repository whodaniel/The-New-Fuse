// @ts-nocheck
import { useRef } from 'react';
import * as THREE from 'three';

interface DeskLampProps {
  position: [number, number, number];
}

const matBase = new THREE.MeshStandardMaterial({
  color: 0x1a1410,
  roughness: 0.5,
  metalness: 0.3,
});

const matShade = new THREE.MeshStandardMaterial({
  color: 0xc4a35a,
  roughness: 0.6,
  metalness: 0.1,
  emissive: 0xc4a35a,
  emissiveIntensity: 0.3,
});

export default function DeskLamp({ position }: DeskLampProps) {
  return (
    <group position={position}>
      <mesh position-y={0.02} castShadow material={matBase}>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 16]} />
      </mesh>

      <mesh position-y={0.22} castShadow material={matBase}>
        <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
      </mesh>

      <mesh
        position={[0, 0.42, 0]}
        rotation-x={Math.PI}
        material={matShade}
      >
        <coneGeometry args={[0.12, 0.1, 12, 1, true]} />
      </mesh>

      <pointLight
        position={[0, 0.38, 0]}
        intensity={0.8}
        color="#ffd99a"
        distance={4}
        decay={2}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.002}
      />
    </group>
  );
}
