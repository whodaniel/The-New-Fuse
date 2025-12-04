import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
export function GraphVisualization(_a) {
    var _b = _a.websocketUrl, websocketUrl = _b === void 0 ? "ws://localhost:3000/graph" : _b, _c = _a.showMiniMap, showMiniMap = _c === void 0 ? true : _c, _d = _a.showControls, showControls = _d === void 0 ? true : _d, _e = _a.className, className = _e === void 0 ? "" : _e;
    var _f = useState([]), nodes = _f[0], setNodes = _f[1];
    var _g = useState([]), edges = _g[0], setEdges = _g[1];
    var _h = useState(false), isConnected = _h[0], setIsConnected = _h[1];
    useEffect(function () {
        // Placeholder for WebSocket connection
        console.log('Graph visualization initialized with URL:', websocketUrl);
        // Simulate some initial data
        setNodes([
            { id: '1', label: 'Node 1', x: 100, y: 100 },
            { id: '2', label: 'Node 2', x: 300, y: 100 },
            { id: '3', label: 'Node 3', x: 200, y: 200 },
        ]);
        setEdges([
            { source: '1', target: '2', label: 'connects to' },
            { source: '2', target: '3', label: 'flows to' },
        ]);
    }, [websocketUrl]);
    var handleNodeClick = useCallback(function (nodeId) {
        console.log('Node clicked:', nodeId);
    }, []);
    return (_jsxs("div", { className: "graph-visualization ".concat(className), style: { width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', position: 'relative' }, children: [_jsxs("div", { style: { padding: '20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '18px', fontWeight: '600' }, children: "Graph Visualization" }), _jsx("p", { style: { margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }, children: "Interactive graph visualization component" })] }), _jsxs("div", { style: { padding: '20px', height: 'calc(100% - 100px)', overflow: 'hidden' }, children: [_jsxs("svg", { width: "100%", height: "100%", style: { border: '1px solid #e5e7eb', borderRadius: '4px', background: '#ffffff' }, children: [edges.map(function (edge, index) {
                                var sourceNode = nodes.find(function (n) { return n.id === edge.source; });
                                var targetNode = nodes.find(function (n) { return n.id === edge.target; });
                                if (!sourceNode || !targetNode)
                                    return null;
                                return (_jsxs("g", { children: [_jsx("line", { x1: sourceNode.x, y1: sourceNode.y, x2: targetNode.x, y2: targetNode.y, stroke: "#9ca3af", strokeWidth: "2", markerEnd: "url(#arrowhead)" }), _jsx("text", { x: (sourceNode.x + targetNode.x) / 2, y: (sourceNode.y + targetNode.y) / 2, textAnchor: "middle", fontSize: "12", fill: "#6b7280", children: edge.label })] }, index));
                            }), nodes.map(function (node) { return (_jsxs("g", { children: [_jsx("circle", { cx: node.x, cy: node.y, r: "20", fill: "#3b82f6", stroke: "#1e40af", strokeWidth: "2", style: { cursor: 'pointer' }, onClick: function () { return handleNodeClick(node.id); } }), _jsx("text", { x: node.x, y: node.y + 5, textAnchor: "middle", fontSize: "12", fill: "white", fontWeight: "600", children: node.id }), _jsx("text", { x: node.x, y: node.y + 35, textAnchor: "middle", fontSize: "10", fill: "#374151", children: node.label })] }, node.id)); }), _jsx("defs", { children: _jsx("marker", { id: "arrowhead", markerWidth: "10", markerHeight: "7", refX: "9", refY: "3.5", orient: "auto", children: _jsx("polygon", { points: "0 0, 10 3.5, 0 7", fill: "#9ca3af" }) }) })] }), showControls && (_jsxs("div", { style: { position: 'absolute', top: '100px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsx("button", { style: { padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }, children: "Zoom In" }), _jsx("button", { style: { padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }, children: "Zoom Out" }), _jsx("button", { style: { padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }, children: "Fit View" })] })), showMiniMap && (_jsx("div", { style: { position: 'absolute', bottom: '20px', right: '20px', width: '120px', height: '80px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f9fafb' }, children: _jsx("div", { style: { padding: '8px', fontSize: '10px', fontWeight: '600', color: '#6b7280' }, children: "Mini Map" }) }))] }), _jsxs("div", { style: { position: 'absolute', top: '20px', left: '20px', fontSize: '12px', color: isConnected ? '#10b981' : '#ef4444' }, children: ["\u25CF ", isConnected ? 'Connected' : 'Disconnected'] })] }));
}
export default GraphVisualization;
