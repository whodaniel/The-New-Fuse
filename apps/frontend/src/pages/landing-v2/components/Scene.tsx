import { Float, PointMaterial, Points } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as random from 'maath/random/dist/maath-random.esm';
import { useRef } from 'react';
import * as THREE from 'three';

function Stars(props: any) {
  const ref = useRef<THREE.Points>(null!);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#8b5cf6"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function FloatingGrid() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <gridHelper
        args={[20, 20, 0xffffff, 0x444444]}
        position={[0, -1, 0]}
        rotation={[0.2, 0, 0]}
      />
    </Float>
  );
}

export default function Scene() {
  return (
    <div className="absolute inset-0 z-0 bg-[#0A0A0F]">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <fog attach="fog" args={['#0A0A0F', 0.5, 2.5]} />
        <Stars />
        {/* <FloatingGrid /> - Optional style choice */}
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

import { useState } from 'react';
