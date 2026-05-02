import * as THREE from 'three';

const matTable = new THREE.MeshStandardMaterial({
  color: 0x3d2b1a,
  roughness: 0.7,
  metalness: 0.08,
});

const matBookRed = new THREE.MeshStandardMaterial({
  color: 0x8b2020,
  roughness: 0.65,
  metalness: 0.05,
});

const matBookGreen = new THREE.MeshStandardMaterial({
  color: 0x2a4a2a,
  roughness: 0.65,
  metalness: 0.0,
});

const matPages = new THREE.MeshStandardMaterial({
  color: 0xe8dcc8,
  roughness: 0.9,
  metalness: 0.0,
});

const LEG_POSITIONS = [
  [-1.3, -0.55],
  [-1.3, 0.55],
  [1.3, -0.55],
  [1.3, 0.55],
];

export default function ReadingTable() {
  return (
    <group>
      <mesh position-y={0.78} castShadow receiveShadow material={matTable}>
        <boxGeometry args={[3, 0.08, 1.5]} />
      </mesh>

      {LEG_POSITIONS.map(([lx, lz], i) => (
        <mesh
          key={`leg-${i}`}
          position={[lx, 0.39, lz]}
          castShadow
          material={matTable}
        >
          <boxGeometry args={[0.08, 0.78, 0.08]} />
        </mesh>
      ))}

      <mesh
        position={[0.2, 0.84, 0]}
        rotation-y={0.15}
        castShadow
        material={matBookRed}
      >
        <boxGeometry args={[0.25, 0.04, 0.18]} />
      </mesh>

      <mesh
        position={[-0.4, 0.83, 0.1]}
        rotation-y={-0.1}
        castShadow
        material={matBookGreen}
      >
        <boxGeometry args={[0.3, 0.02, 0.22]} />
      </mesh>

      <mesh
        position={[-0.4, 0.835, 0.1]}
        rotation-y={-0.1}
        material={matPages}
      >
        <boxGeometry args={[0.28, 0.015, 0.2]} />
      </mesh>
    </group>
  );
}
