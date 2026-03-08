import { Grid, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { AgentBot } from './AgentBot';
import { HtmlLabels } from './HtmlLabels';
import { ProjectNode } from './ProjectNode';

const CameraController = () => {
  const cameraTarget = useStore((state) => state.cameraTarget);
  const selectedEntity = useStore((state) => state.selectedEntity);
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (cameraTarget && controlsRef.current && selectedEntity) {
      const targetPos = new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      const lookAtPos = new THREE.Vector3(cameraTarget.x - 20, 4, cameraTarget.z - 25);

      camera.position.lerp(targetPos, 0.05);
      controlsRef.current.target.lerp(lookAtPos, 0.05);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.01}
      minDistance={5}
      maxDistance={150}
      screenSpacePanning={false}
    />
  );
};

export const Scene: React.FC = () => {
  const projects = useStore((state) => state.projects);
  const agents = useStore((state) => state.agents);
  const setSelectedEntity = useStore((state) => state.setSelectedEntity);

  return (
    <div className="absolute inset-0 z-0" onClick={() => setSelectedEntity(null)}>
      <Canvas
        camera={{ position: [0, 45, 60], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0f172a']} />
        <fogExp2 attach="fog" args={['#0f172a', 0.012]} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[30, 60, 20]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />

        <Grid
          position={[0, 0.01, 0]}
          args={[150, 150]}
          cellSize={5}
          cellThickness={1}
          cellColor="#334155"
          sectionSize={25}
          sectionThickness={1.5}
          sectionColor="#1e293b"
          fadeDistance={100}
          fadeStrength={1}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.1} />
        </mesh>

        {projects.map((project) => (
          <ProjectNode key={project.id} project={project} />
        ))}

        {agents.map((agent) => (
          <AgentBot key={agent.id} agent={agent} />
        ))}

        <HtmlLabels />
        <CameraController />
      </Canvas>
    </div>
  );
};
