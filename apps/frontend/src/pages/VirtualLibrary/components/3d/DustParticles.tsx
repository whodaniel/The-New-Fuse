import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 200;
const ROOM_W = 30;
const ROOM_D = 20;
const ROOM_H = 5;
const HALF_W = ROOM_W / 2;
const HALF_D = ROOM_D / 2;

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
}

function createParticleData(): ParticleData {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * ROOM_W;
    positions[i * 3 + 1] = Math.random() * ROOM_H;
    positions[i * 3 + 2] = (Math.random() - 0.5) * ROOM_D;
    velocities[i * 3] = (Math.random() - 0.5) * 0.015;
    velocities[i * 3 + 1] = 0.003 + Math.random() * 0.008;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
  }
  return { positions, velocities };
}

export default function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const data = useMemo(() => createParticleData(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    return geo;
  }, [data]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const vel = data.velocities;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] += vel[i3];
      pos[i3 + 1] += vel[i3 + 1];
      pos[i3 + 2] += vel[i3 + 2];

      if (pos[i3] > HALF_W) pos[i3] = -HALF_W;
      if (pos[i3] < -HALF_W) pos[i3] = HALF_W;
      if (pos[i3 + 1] > ROOM_H) pos[i3 + 1] = 0;
      if (pos[i3 + 1] < 0) pos[i3 + 1] = ROOM_H;
      if (pos[i3 + 2] > HALF_D) pos[i3 + 2] = -HALF_D;
      if (pos[i3 + 2] < -HALF_D) pos[i3 + 2] = HALF_D;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={0xffd99a}
        size={0.025}
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
