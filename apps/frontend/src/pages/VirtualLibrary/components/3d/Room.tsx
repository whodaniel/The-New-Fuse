// @ts-nocheck
import { useMemo } from 'react';
import * as THREE from 'three';

interface RoomProps {
  width: number;
  depth: number;
  height: number;
}

const matFloor = new THREE.MeshStandardMaterial({
  color: 0x3b2a1a,
  roughness: 0.85,
  metalness: 0.05,
});

const matCeiling = new THREE.MeshStandardMaterial({
  color: 0x4a3f32,
  roughness: 0.9,
  metalness: 0.0,
});

const matWall = new THREE.MeshStandardMaterial({
  color: 0x6b5d4e,
  roughness: 0.92,
  metalness: 0.0,
});

export default function Room({ width, depth, height }: RoomProps) {
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group>
      <mesh
        rotation-x={-Math.PI / 2}
        receiveShadow
        material={matFloor}
      >
        <planeGeometry args={[width, depth]} />
      </mesh>

      <mesh
        rotation-x={Math.PI / 2}
        position-y={height}
        material={matCeiling}
      >
        <planeGeometry args={[width, depth]} />
      </mesh>

      <mesh
        position={[0, height / 2, -halfD]}
        rotation-y={0}
        receiveShadow
        material={matWall}
      >
        <planeGeometry args={[width, height]} />
      </mesh>

      <mesh
        position={[0, height / 2, halfD]}
        rotation-y={Math.PI}
        receiveShadow
        material={matWall}
      >
        <planeGeometry args={[width, height]} />
      </mesh>

      <mesh
        position={[-halfW, height / 2, 0]}
        rotation-y={Math.PI / 2}
        receiveShadow
        material={matWall}
      >
        <planeGeometry args={[depth, height]} />
      </mesh>

      <mesh
        position={[halfW, height / 2, 0]}
        rotation-y={-Math.PI / 2}
        receiveShadow
        material={matWall}
      >
        <planeGeometry args={[depth, height]} />
      </mesh>

      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.005, 0]}
        receiveShadow
      >
        <planeGeometry args={[4.5, 3]} />
        <meshStandardMaterial color={0x5c2020} roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}
