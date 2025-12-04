import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { GraphVisualization } from '../components/ui/graph-visualization';
// Mock useGraphWebSocket hook for demo purposes
var useGraphWebSocket = function (config) { return ({
    sendMessage: function (type, data) {
        console.log('Sending message:', type, data);
    }
}); };
var CognitiveCore = /** @class */ (function () {
    function CognitiveCore() {
    }
    return CognitiveCore;
}());
var MetaLearner = /** @class */ (function () {
    function MetaLearner() {
    }
    return MetaLearner;
}());
var SocialCore = /** @class */ (function () {
    function SocialCore() {
    }
    return SocialCore;
}());
var EmergenceCore = /** @class */ (function () {
    function EmergenceCore() {
    }
    return EmergenceCore;
}());
var AgentOrchestrator = /** @class */ (function () {
    function AgentOrchestrator() {
        this.cognitive = new CognitiveCore();
        this.learning = new MetaLearner();
        this.social = new SocialCore();
        this.emergence = new EmergenceCore();
        this.agentStates = new Map();
    }
    return AgentOrchestrator;
}());
export { AgentOrchestrator };
export function GraphDemo() {
    var _a = useState(''), nodeId = _a[0], setNodeId = _a[1];
    var _b = useState(''), nodeData = _b[0], setNodeData = _b[1];
    var _c = useState(''), edgeSource = _c[0], setEdgeSource = _c[1];
    var _d = useState(''), edgeTarget = _d[0], setEdgeTarget = _d[1];
    var _e = useState('1'), edgeWeight = _e[0], setEdgeWeight = _e[1];
    var sendMessage = useGraphWebSocket({
        url: 'ws://localhost:3000/graph',
        autoConnect: true
    }).sendMessage;
    var handleAddNode = function (e) {
        e.preventDefault();
        if (nodeId && nodeData) {
            sendMessage('updateGraph', {
                nodes: [{ id: nodeId, data: { label: nodeData } }],
                edges: []
            });
            setNodeId('');
            setNodeData('');
        }
    };
    var handleAddEdge = function (e) {
        e.preventDefault();
        if (edgeSource && edgeTarget) {
            sendMessage('updateGraph', {
                nodes: [],
                edges: [{
                        source: edgeSource,
                        target: edgeTarget,
                        weight: parseFloat(edgeWeight)
                    }]
            });
            setEdgeSource('');
            setEdgeTarget('');
            setEdgeWeight('1');
        }
    };
    return (_jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Interactive Graph Visualization Demo" }), _jsx("p", { className: "text-lg text-gray-600", children: "Add nodes and edges to create a dynamic graph visualization" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Add Node" }), _jsxs("form", { onSubmit: handleAddNode, className: "space-y-4", children: [_jsx("div", { children: _jsxs("label", { className: "block text-sm font-medium text-gray-700", children: ["Node ID", _jsx("input", { type: "text", value: nodeId, onChange: function (e) { return setNodeId(e.target.value); }, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "Enter unique node ID" })] }) }), _jsx("div", { children: _jsxs("label", { className: "block text-sm font-medium text-gray-700", children: ["Node Data", _jsx("input", { type: "text", value: nodeData, onChange: function (e) { return setNodeData(e.target.value); }, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "Enter node label/data" })] }) }), _jsx("button", { type: "submit", className: "w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600", children: "Add Node" })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Add Edge" }), _jsxs("form", { onSubmit: handleAddEdge, className: "space-y-4", children: [_jsx("div", { children: _jsxs("label", { className: "block text-sm font-medium text-gray-700", children: ["Source Node ID", _jsx("input", { type: "text", value: edgeSource, onChange: function (e) { return setEdgeSource(e.target.value); }, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "Source node ID" })] }) }), _jsx("div", { children: _jsxs("label", { className: "block text-sm font-medium text-gray-700", children: ["Target Node ID", _jsx("input", { type: "text", value: edgeTarget, onChange: function (e) { return setEdgeTarget(e.target.value); }, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "Target node ID" })] }) }), _jsx("div", { children: _jsxs("label", { className: "block text-sm font-medium text-gray-700", children: ["Edge Weight", _jsx("input", { type: "number", value: edgeWeight, onChange: function (e) { return setEdgeWeight(e.target.value); }, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }) }), _jsx("button", { type: "submit", className: "w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600", children: "Add Edge" })] })] })] }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", style: { height: '600px' }, children: _jsx(GraphVisualization, { websocketUrl: "ws://localhost:3000/graph", showMiniMap: true, showControls: true }) }), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Instructions" }), _jsxs("ul", { className: "list-disc list-inside space-y-2", children: [_jsx("li", { children: "Add nodes by filling out the Node ID and Node Data fields" }), _jsx("li", { children: "Connect nodes by adding edges with Source and Target node IDs" }), _jsx("li", { children: "Use the controls in the visualization to zoom, pan, and reorganize the graph" }), _jsx("li", { children: "Click nodes to expand/collapse their details" }), _jsx("li", { children: "Use the layout options to change how the graph is organized" }), _jsx("li", { children: "Filter nodes by type using the dropdown menu" })] })] })] }));
}
export default GraphDemo;
