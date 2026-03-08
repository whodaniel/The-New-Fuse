import { Html } from '@react-three/drei';
import React from 'react';
import { useStore } from '../../store/useStore';

export const HtmlLabels: React.FC = () => {
  const projects = useStore((state) => state.projects);
  const agents = useStore((state) => state.agents);

  return (
    <>
      {projects.map((p) => {
        const hexStr = '#' + p.color.toString(16).padStart(6, '0');
        return (
          <Html
            key={`label-${p.id}`}
            position={[p.x, 8.5, p.z]}
            center
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textShadow: `0 1px 3px rgba(0,0,0,0.9), 0 0 5px ${hexStr}, 0 0 10px ${hexStr}`,
              pointerEvents: 'none',
            }}
            distanceFactor={50} // Scales the label based on distance
          >
            {p.name}
          </Html>
        );
      })}

      {agents.map((a) => {
        const hexStr = '#' + a.color.toString(16).padStart(6, '0');
        // We don't have the exact moving position here, but we can just let the AgentBot render its own label.
        // Actually, it's better to render the Agent label inside AgentBot.tsx so it follows the mesh.
        return null;
      })}
    </>
  );
};
