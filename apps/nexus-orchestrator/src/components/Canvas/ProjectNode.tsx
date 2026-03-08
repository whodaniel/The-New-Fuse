import { Edges } from '@react-three/drei';
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Project, useStore } from '../../store/useStore';

interface ProjectNodeProps {
  project: Project;
}

export const ProjectNode: React.FC<ProjectNodeProps> = ({ project }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const setSelectedEntity = useStore((state) => state.setSelectedEntity);
  const selectedEntity = useStore((state) => state.selectedEntity);
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedEntity?.id === project.id;

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedEntity({ id: project.id, type: 'project' });
    setCameraTarget({ x: project.x + 20, y: 25, z: project.z + 25 });
  };

  return (
    <group position={[project.x, 0, project.z]}>
      {/* Rectangular Building Block */}
      <mesh
        ref={meshRef}
        position={[0, 4, 0]}
        castShadow
        receiveShadow
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
        <boxGeometry args={[5, 8, 5]} />
        <meshStandardMaterial
          color={project.color}
          transparent
          opacity={0.8}
          roughness={0.2}
          metalness={0.6}
          emissive={isSelected || hovered ? project.color : 0x000000}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.2 : 0}
        />
        <Edges linewidth={2} threshold={15} color={project.color} />
      </mesh>

      {/* Circular Base Plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[4.5, 32]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.2} />
      </mesh>

      {/* Invisible Hitbox */}
      <mesh position={[0, 4.5, 0]} visible={false} onClick={handleClick}>
        <boxGeometry args={[7, 9, 7]} />
      </mesh>
    </group>
  );
};
