// @ts-nocheck
import ForceGraph2D from 'd3-force-graph';
import { useEffect, useRef } from 'react';
export const AgentNetwork = ({ agents, tasks, onNodeClick }) => {
  const fgRef = useRef(null);
  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;
    fg.d3Force('charge').strength(-120);
  }, []);
  const handleZoom = (event) => {
    const fg = fgRef.current;
    if (!fg) return;
    event.preventDefault();
    const delta = event.deltaY;
    const newZoom = fg.zoom() * (1 + delta * 0.001);
    fg.zoom(newZoom);
  };
  const handleNodeClick = (node) => {
    if (!fgRef.current || !onNodeClick) return;
    const fg = fgRef.current;
    const { x, y } = fg.screen2GraphCoords(window.innerWidth / 2, window.innerHeight / 2);
    fg.centerAt(x, y, 1000);
    fg.zoom(2, 2000);
    onNodeClick(node);
  };
  const nodeCanvasObject = (node, ctx) => {
    const role = node.daccRole || node.role || '';
    const platform = node.platform || '';
    const baton = node.batonHolder ? ' · BATON' : '';
    const label = [node.name || node.id, role && `role=${role}`, platform && `plat=${platform}`]
      .filter(Boolean)
      .join(' · ');
    const sub = baton ? `${label}${baton}` : label;
    const fontSize = 11;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(sub).width;
    const bckgDimensions = [textWidth + 10, fontSize + 10];
    // Color by platform when present; otherwise by daccRole seat.
    const seatColors = {
      director: '#f43f5e',
      orchestrator: '#3b82f6',
      broker: '#8b5cf6',
      worker: '#10b981',
      participant: '#64748b',
    };
    ctx.fillStyle = node.batonHolder ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255, 255, 255, 0.85)';
    if (typeof node.x === 'number' && typeof node.y === 'number') {
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y - bckgDimensions[1] / 2,
        bckgDimensions[0],
        bckgDimensions[1]
      );
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = seatColors[String(role).toLowerCase()] || '#000';
      ctx.fillText(sub, node.x, node.y);
      node.__bckgDimensions = bckgDimensions;
    }
  };
  const nodePointerAreaPaint = (node, color, ctx) => {
    const bckgDimensions = node.__bckgDimensions;
    if (bckgDimensions && typeof node.x === 'number' && typeof node.y === 'number') {
      ctx.fillStyle = color;
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y - bckgDimensions[1] / 2,
        bckgDimensions[0],
        bckgDimensions[1]
      );
    }
  };
  return (
    <div className="w-full h-[600px]">
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes: agents, links: [] }}
        nodeLabel={(node) => {
          const parts = [
            node.name || node.id,
            node.daccRole && `daccRole=${node.daccRole}`,
            node.platform && `platform=${node.platform}`,
            node.batonHolder && 'BATON',
            node.canonicalEntityId,
          ].filter(Boolean);
          return parts.join(' · ');
        }}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        onNodeClick={handleNodeClick}
        onWheel={handleZoom}
      />
    </div>
  );
};
