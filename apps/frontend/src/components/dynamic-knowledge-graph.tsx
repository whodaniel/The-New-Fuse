// @ts-nocheck
import { GlassCard } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { ForceGraph3D } from 'react-force-graph';
import { webSocketService } from '../services/websocket';
('use client');

export function DynamicKnowledgeGraph() {
  const fgRef = useRef<any>();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    webSocketService.on('knowledgeGraphUpdate', setGraphData);
    return () => {
      webSocketService.off('knowledgeGraphUpdate', setGraphData);
    };
  }, []);

  return (
    <GlassCard title="Dynamic Knowledge Graph" className="w-full h-[600px]">
      <div className="h-full">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="name"
          nodeAutoColorBy="group"
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={(d: any) => d.value * 0.001}
          nodeThreeObject={(node: any) => {
            const sprite = new (window as any).SpriteText(node.name);
            sprite.color = node.color;
            sprite.textHeight = 8;
            return sprite;
          }}
        />
      </div>
    </GlassCard>
  );
}
