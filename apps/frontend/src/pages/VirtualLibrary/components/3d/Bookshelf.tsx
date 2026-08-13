// @ts-nocheck
import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { ClassificationNode } from '../../types';
import { useLibraryStore } from '../../store';

interface BookshelfProps {
  position: [number, number, number];
  rotation: [number, number, number];
  ddc: ClassificationNode;
}

const SHELF_W = 2.4;
const SHELF_H = 3.2;
const SHELF_D = 0.45;
const NUM_SHELVES = 5;
const PROXIMITY_THRESHOLD = 3.0;

const BOOK_PALETTE = [
  0x8b2020, 0x1a3a5c, 0x2a4a2a, 0x4a3a2a, 0x1a1a1a,
  0x5c1a3a, 0x3a2a5c, 0x5c4a1a, 0x2a4a4a, 0x4a2a3a,
  0x6b3030, 0x1a4a6b, 0x3a5c1a, 0x5c3a1a, 0x2a2a2a,
];

const matShelf = new THREE.MeshStandardMaterial({
  color: 0x2c1e12,
  roughness: 0.78,
  metalness: 0.05,
});

interface ShelfBook {
  offsetX: number;
  width: number;
  height: number;
  depth: number;
  color: number;
}

interface ShelfRow {
  shelfY: number;
  books: ShelfBook[];
}

function generateShelfBooks(shelfIndex: number): ShelfRow {
  const shelfY = (shelfIndex / NUM_SHELVES) * SHELF_H + 0.03;
  const count = 8 + Math.floor(Math.random() * 8);
  const books: ShelfBook[] = [];
  let bx = -SHELF_W / 2 + 0.1;

  for (let b = 0; b < count; b++) {
    const bw = 0.015 + Math.random() * 0.025;
    const bh = 0.18 + Math.random() * 0.12;
    const bd = SHELF_D * 0.7;
    if (bx + bw > SHELF_W / 2 - 0.1) break;
    books.push({
      offsetX: bx + bw / 2,
      width: bw,
      height: bh,
      depth: bd,
      color: BOOK_PALETTE[Math.floor(Math.random() * BOOK_PALETTE.length)],
    });
    bx += bw + 0.005 + Math.random() * 0.01;
  }

  return { shelfY, books };
}

export default function Bookshelf({ position, rotation, ddc }: BookshelfProps) {
  const groupRef = useRef<THREE.Group>(null);
  const setNearestShelf = useLibraryStore((s) => s.setNearestShelf);
  const [highlighted, setHighlighted] = useState(false);

  const rows = useMemo(() => {
    const result: ShelfRow[] = [];
    for (let i = 0; i < NUM_SHELVES; i++) {
      result.push(generateShelfBooks(i));
    }
    return result;
  }, []);

  const worldPos = useMemo(() => {
    const v = new THREE.Vector3(position[0], SHELF_H / 2, position[2]);
    return v;
  }, [position]);

  useFrame(({ camera }) => {
    const dist = camera.position.distanceTo(
      new THREE.Vector3(worldPos.x, camera.position.y, worldPos.z),
    );
    const isNear = dist < PROXIMITY_THRESHOLD;
    if (isNear !== highlighted) {
      setHighlighted(isNear);
      if (isNear) {
        setNearestShelf(ddc.code, ddc.label);
      }
    }
  });

  const emissiveIntensity = highlighted ? 0.08 : 0;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh position-y={SHELF_H / 2} castShadow receiveShadow material={matShelf}>
        <boxGeometry args={[SHELF_W, SHELF_H, SHELF_D]} />
      </mesh>

      {Array.from({ length: NUM_SHELVES + 1 }, (_, i) => {
        const shelfY = (i / NUM_SHELVES) * SHELF_H;
        return (
          <mesh
            key={`shelf-plank-${i}`}
            position-y={shelfY}
            castShadow
            material={matShelf}
          >
            <boxGeometry args={[SHELF_W, 0.03, SHELF_D + 0.02]} />
          </mesh>
        );
      })}

      {[-1, 1].map((side) => (
        <mesh
          key={`side-${side}`}
          position={[side * (SHELF_W / 2 - 0.02), SHELF_H / 2, 0]}
          castShadow
          material={matShelf}
        >
          <boxGeometry args={[0.04, SHELF_H, SHELF_D + 0.02]} />
        </mesh>
      ))}

      {rows.map((row, ri) =>
        row.books.map((book, bi) => (
          <mesh
            key={`book-${ri}-${bi}`}
            position={[book.offsetX, row.shelfY + book.height / 2, 0]}
            castShadow
          >
            <boxGeometry args={[book.width, book.height, book.depth]} />
            <meshStandardMaterial
              color={book.color}
              roughness={0.7}
              metalness={0.05}
              emissive={ddc.color}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        )),
      )}

      <Text
        position={[0, SHELF_H + 0.15, SHELF_D / 2 + 0.01]}
        fontSize={0.12}
        color="#f0d9b5"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {ddc.code}
      </Text>
      <Text
        position={[0, SHELF_H + 0.02, SHELF_D / 2 + 0.01]}
        fontSize={0.05}
        color="#a89279"
        anchorX="center"
        anchorY="middle"
        maxWidth={SHELF_W * 0.9}
        font={undefined}
      >
        {ddc.label}
      </Text>

      <Text
        position={[0, SHELF_H + 0.15, -(SHELF_D / 2 + 0.01)]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.12}
        color="#f0d9b5"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {ddc.code}
      </Text>
      <Text
        position={[0, SHELF_H + 0.02, -(SHELF_D / 2 + 0.01)]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.05}
        color="#a89279"
        anchorX="center"
        anchorY="middle"
        maxWidth={SHELF_W * 0.9}
        font={undefined}
      >
        {ddc.label}
      </Text>
    </group>
  );
}
