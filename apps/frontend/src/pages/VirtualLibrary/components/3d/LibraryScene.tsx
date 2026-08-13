// @ts-nocheck
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import Room from './Room';
import Bookshelf from './Bookshelf';
import ReadingTable from './ReadingTable';
import DeskLamp from './DeskLamp';
import DustParticles from './DustParticles';
import PlayerController from './PlayerController';
import { getDDCMainClasses } from '../../data/ddc';

const DDC = getDDCMainClasses();
const ROOM_W = 30;
const ROOM_D = 20;

export default function LibraryScene() {
  const leftShelves = useMemo(() => DDC.filter((_, i) => i % 2 === 0), []);
  const rightShelves = useMemo(() => DDC.filter((_, i) => i % 2 === 1), []);

  return (
    <>
      <color attach="background" args={['#1a1410']} />
      <fog attach="fog" args={['#1a1410', 0, 0.018]} />

      <ambientLight intensity={0.15} color="#f0d9b5" />
      <directionalLight
        position={[0, 4.5, 0]}
        intensity={0.3}
        color="#f0d9b5"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        position={[-2, 2.2, 0]}
        intensity={1.5}
        color="#f0d9b5"
        distance={8}
        decay={2}
        castShadow
      />
      <pointLight
        position={[2, 2.2, 0]}
        intensity={1.5}
        color="#f0d9b5"
        distance={8}
        decay={2}
        castShadow
      />

      <Room width={ROOM_W} depth={ROOM_D} height={5} />

      {leftShelves.map((ddc, i) => (
        <Bookshelf
          key={ddc.code}
          position={[-14.5, 0, -8 + i * 4]}
          rotation={[0, Math.PI / 2, 0]}
          ddc={ddc}
        />
      ))}
      {rightShelves.map((ddc, i) => (
        <Bookshelf
          key={ddc.code}
          position={[14.5, 0, -8 + i * 4]}
          rotation={[0, -Math.PI / 2, 0]}
          ddc={ddc}
        />
      ))}

      <ReadingTable />
      <DeskLamp position={[-2, 0.76, 0]} />
      <DeskLamp position={[2, 0.76, 0]} />

      <DustParticles />
      <PlayerController />
    </>
  );
}
