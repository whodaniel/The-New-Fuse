import { Billboard, Line, OrbitControls, Stars, Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as d3 from 'd3';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface GalaxyVisualizerProps {
  nodes: Array<{ id: string; data: { label: string }; type?: string }>;
  edges: Array<{ id: string; source: string; target: string; animated?: boolean }>;
}

const NodeMesh = ({
  position,
  label,
  isSource,
  isTarget,
}: {
  position: [number, number, number];
  label: string;
  isSource: boolean;
  isTarget: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
  });

  const color = isSource ? '#60A5FA' : isTarget ? '#F472B6' : '#A78BFA'; // Blue, Pink, Purple
  const size = hovered ? 1.5 : 1;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={size}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
          wireframe={true}
        />
      </mesh>

      {/* Inner Core */}
      <mesh scale={size * 0.5}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial color="white" />
      </mesh>

      <Billboard>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
};

const ConnectionLine = ({
  start,
  end,
  animated,
}: {
  start: [number, number, number];
  end: [number, number, number];
  animated?: boolean;
}) => {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (animated && ref.current) {
      ref.current.material.dashOffset -= 0.05;
    }
  });

  return (
    <Line
      ref={ref}
      points={[start, end]}
      color={animated ? '#60A5FA' : '#4B5563'}
      lineWidth={animated ? 2 : 1}
      dashed={animated}
      dashScale={animated ? 2 : 0}
      dashSize={1}
      gapSize={0.5}
      transparent
      opacity={0.6}
    />
  );
};

const Scene = ({ nodes, edges }: GalaxyVisualizerProps) => {
  // Use d3-force to calculate positions
  const simulation = useMemo(() => {
    const simNodes = nodes.map((n) => ({ ...n, x: 0, y: 0, z: 0 }));
    const simEdges = edges.map((e) => ({ ...e, source: e.source, target: e.target }));

    // Simple 3D shim: we'll simulate until stable then assume 2D plane with some Z variation
    const sim = d3
      .forceSimulation(simNodes as any)
      .force(
        'link',
        d3
          .forceLink(simEdges)
          .id((d: any) => d.id)
          .distance(10)
      )
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(0, 0))
      .stop();

    for (let i = 0; i < 300; ++i) sim.tick();

    return { nodes: simNodes, edges: simEdges };
  }, [nodes, edges]);

  // Add a slight Z oscillation or random z for checks
  const nodePositions = useMemo(() => {
    const pos: Record<string, [number, number, number]> = {};
    simulation.nodes.forEach((n: any) => {
      // Scale up d3 coords to world space 3D
      pos[n.id] = [n.x * 0.5, n.y * 0.5, (Math.random() - 0.5) * 5];
    });
    return pos;
  }, [simulation]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#4c1d95" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#2563eb" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {simulation.nodes.map((node: any) => (
        <NodeMesh
          key={node.id}
          position={nodePositions[node.id]}
          label={node.data.label}
          isSource={node.type === 'input'}
          isTarget={node.type === 'output'}
        />
      ))}

      {simulation.edges.map((edge: any) => {
        const start = nodePositions[edge.source.id];
        const end = nodePositions[edge.target.id];
        return <ConnectionLine key={edge.id} start={start} end={end} animated={edge.animated} />;
      })}
    </>
  );
};

export const GalaxyVisualizer: React.FC<GalaxyVisualizerProps> = (props) => {
  return (
    <div className="w-full h-full bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-black/50 p-2 rounded backdrop-blur-md">
          Galactic Topology View
        </h3>
      </div>
      <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
        <Scene {...props} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxDistance={50}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
};

export default GalaxyVisualizer;
