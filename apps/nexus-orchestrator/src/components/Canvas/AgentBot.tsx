import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Agent, useStore } from '../../store/useStore';

interface AgentBotProps {
  agent: Agent;
}

export const AgentBot: React.FC<AgentBotProps> = ({ agent }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const setSelectedEntity = useStore((state) => state.setSelectedEntity);
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const projects = useStore((state) => state.projects);

  const [hovered, setHovered] = useState(false);
  const [linePoints, setLinePoints] = useState<[THREE.Vector3, THREE.Vector3] | null>(null);

  // Initial random properties
  const { baseY, phase, initialPos } = useMemo(() => {
    const targetProj = projects.find((p) => p.id === agent.currentProject);
    let x = Math.random() * 10 - 5;
    let z = Math.random() * 10 - 5;
    if (targetProj) {
      x = targetProj.x + (Math.random() - 0.5) * 8;
      z = targetProj.z + (Math.random() - 0.5) * 8;
    }
    return {
      baseY: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      initialPos: new THREE.Vector3(x, 1, z),
    };
  }, []);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedEntity({ id: agent.id, type: 'agent' });
    if (groupRef.current) {
      setCameraTarget({
        x: groupRef.current.position.x + 10,
        y: groupRef.current.position.y + 15,
        z: groupRef.current.position.z + 15,
      });
    }
  };

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Hover bob
    groupRef.current.position.y = baseY + Math.sin(time * 3 + phase) * 0.2;

    // Spin hover ring
    if (ringRef.current) {
      ringRef.current.rotation.z -= 0.05;
    }

    // Determine target position
    const targetProj = projects.find((p) => p.id === agent.currentProject);
    let targetX = initialPos.x;
    let targetZ = initialPos.z;

    if (targetProj) {
      // Move towards project
      targetX = targetProj.x + Math.cos(phase) * 6;
      targetZ = targetProj.z + Math.sin(phase) * 6;

      if (agent.currentTask) {
        setLinePoints([
          new THREE.Vector3(
            groupRef.current.position.x,
            groupRef.current.position.y + 0.5,
            groupRef.current.position.z
          ),
          new THREE.Vector3(targetProj.x, 3, targetProj.z),
        ]);
      } else {
        setLinePoints(null);
      }
    } else {
      setLinePoints(null);
    }

    const currentPos2D = new THREE.Vector2(
      groupRef.current.position.x,
      groupRef.current.position.z
    );
    const targetPos2D = new THREE.Vector2(targetX, targetZ);

    if (currentPos2D.distanceTo(targetPos2D) > 0.2) {
      // Move
      currentPos2D.lerp(targetPos2D, 0.03);
      groupRef.current.position.x = currentPos2D.x;
      groupRef.current.position.z = currentPos2D.y;

      // Look at target
      const lookAtVec = new THREE.Vector3(targetX, groupRef.current.position.y, targetZ);
      groupRef.current.lookAt(lookAtVec);

      // Lean head forward slightly while moving
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.2, 0.1);
      }
    } else {
      // Idle behavior - slowly rotate head
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1);
        headRef.current.rotation.y = Math.sin(time + phase) * 0.3;
      }
    }
  });

  return (
    <>
      {linePoints && (
        <Line points={linePoints} color={0x6366f1} lineWidth={2} transparent opacity={0.4} />
      )}
      <group
        ref={groupRef}
        position={[initialPos.x, initialPos.y, initialPos.z]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        {/* Body */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.4, 0.8, 16]} />
          <meshStandardMaterial color={0x94a3b8} metalness={0.8} roughness={0.2} />
          {/* Hover Ring */}
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.05, 8, 24]} />
            <meshBasicMaterial color={agent.color} transparent opacity={0.6} />
          </mesh>
        </mesh>

        {/* Head */}
        <mesh ref={headRef} position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[0.9, 0.7, 0.7]} />
          <meshStandardMaterial
            color={agent.color}
            emissive={agent.color}
            emissiveIntensity={hovered ? 0.6 : 0.3}
          />
          {/* Visor */}
          <mesh position={[0, 0, 0.36]}>
            <boxGeometry args={[0.7, 0.2, 0.1]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
          {/* Antenna */}
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4]} />
            <meshStandardMaterial color={0x475569} />
            {/* Antenna Tip */}
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.12]} />
              <meshBasicMaterial color={0xef4444} />
            </mesh>
          </mesh>
        </mesh>

        {/* Invisible Hitbox */}
        <mesh position={[0, 0.8, 0]} visible={false}>
          <sphereGeometry args={[1.5]} />
        </mesh>

        <Html
          position={[0, 2.5, 0]}
          center
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textShadow: `0 1px 3px rgba(0,0,0,0.9), 0 0 5px #${agent.color.toString(16).padStart(6, '0')}, 0 0 10px #${agent.color.toString(16).padStart(6, '0')}`,
            pointerEvents: 'none',
          }}
          distanceFactor={40}
        >
          {agent.name}
        </Html>
      </group>
    </>
  );
};
