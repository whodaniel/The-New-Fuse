import React from 'react';
import { useRef, useEffect } from 'react';
import ForceGraph2D from 'd3-force-graph';
export const AgentNetwork = ({ agents, tasks, onNodeClick }) => {
    const fgRef = useRef(null);
    useEffect(() => {
        if (!fgRef.current)
            return;
        const fg = fgRef.current;
        fg.d3Force('charge').strength(-120);
    }, []);
    const handleZoom = (event) => {
        const fg = fgRef.current;
        if (!fg)
            return;
        event.preventDefault();
        const delta = event.deltaY;
        const newZoom = fg.zoom() * (1 + delta * 0.001);
        fg.zoom(newZoom);
    };
    const handleNodeClick = (node) => {
        if (!fgRef.current || !onNodeClick)
            return;
        const fg = fgRef.current;
        const { x, y } = fg.screen2GraphCoords(window.innerWidth / 2, window.innerHeight / 2);
        fg.centerAt(x, y, 1000);
        fg.zoom(2, 2000);
        onNodeClick(node);
    };
    const nodeCanvasObject = (node, ctx) => {
        const label = node.name;
        const fontSize = 12;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth + 8, fontSize + 8];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        if (typeof node.x === 'number' && typeof node.y === 'number') {
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.fillText(label, node.x, node.y);
            node.__bckgDimensions = bckgDimensions;
        }
    };
    const nodePointerAreaPaint = (node, color, ctx) => {
        const bckgDimensions = node.__bckgDimensions;
        if (bckgDimensions && typeof node.x === 'number' && typeof node.y === 'number') {
            ctx.fillStyle = color;
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
        }
    };
    return (<div className="w-full h-[600px]">
      <ForceGraph2D ref={fgRef} graphData={{ nodes: agents, links: [] }} nodeLabel="name" nodeCanvasObject={nodeCanvasObject} nodePointerAreaPaint={nodePointerAreaPaint} onNodeClick={handleNodeClick} onWheel={handleZoom}/>
    </div>);
};
//# sourceMappingURL=agent-network.js.map