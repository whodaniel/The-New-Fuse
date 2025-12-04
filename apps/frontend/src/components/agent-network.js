import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import ForceGraph2D from 'd3-force-graph';
export var AgentNetwork = function (_a) {
    var agents = _a.agents, tasks = _a.tasks, onNodeClick = _a.onNodeClick;
    var fgRef = useRef(null);
    useEffect(function () {
        if (!fgRef.current)
            return;
        var fg = fgRef.current;
        fg.d3Force('charge').strength(-120);
    }, []);
    var handleZoom = function (event) {
        var fg = fgRef.current;
        if (!fg)
            return;
        event.preventDefault();
        var delta = event.deltaY;
        var newZoom = fg.zoom() * (1 + delta * 0.001);
        fg.zoom(newZoom);
    };
    var handleNodeClick = function (node) {
        if (!fgRef.current || !onNodeClick)
            return;
        var fg = fgRef.current;
        var _a = fg.screen2GraphCoords(window.innerWidth / 2, window.innerHeight / 2), x = _a.x, y = _a.y;
        fg.centerAt(x, y, 1000);
        fg.zoom(2, 2000);
        onNodeClick(node);
    };
    var nodeCanvasObject = function (node, ctx) {
        var label = node.name;
        var fontSize = 12;
        ctx.font = "".concat(fontSize, "px Sans-Serif");
        var textWidth = ctx.measureText(label).width;
        var bckgDimensions = [textWidth + 8, fontSize + 8];
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
    var nodePointerAreaPaint = function (node, color, ctx) {
        var bckgDimensions = node.__bckgDimensions;
        if (bckgDimensions && typeof node.x === 'number' && typeof node.y === 'number') {
            ctx.fillStyle = color;
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
        }
    };
    return (_jsx("div", { className: "w-full h-[600px]", children: _jsx(ForceGraph2D, { ref: fgRef, graphData: { nodes: agents, links: [] }, nodeLabel: "name", nodeCanvasObject: nodeCanvasObject, nodePointerAreaPaint: nodePointerAreaPaint, onNodeClick: handleNodeClick, onWheel: handleZoom }) }));
};
