"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = void 0;
exports.GraphDemo = GraphDemo;
import react_1 from 'react';
import graph_visualization_1 from '../components/ui/graph-visualization.js';
import useGraphWebSocket_1 from '../hooks/useGraphWebSocket.js';
class CognitiveCore {
    constructor() { }
}
class MetaLearner {
    constructor() { }
}
class SocialCore {
    constructor() { }
}
class EmergenceCore {
    constructor() { }
}
class AgentOrchestrator {
    constructor() {
        this.cognitive = new CognitiveCore();
        this.learning = new MetaLearner();
        this.social = new SocialCore();
        this.emergence = new EmergenceCore();
        this.agentStates = new Map();
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
function GraphDemo({}) {
    const [nodeId, setNodeId] = (0, react_1.useState)('');
    const [nodeData, setNodeData] = (0, react_1.useState)('');
    const [edgeSource, setEdgeSource] = (0, react_1.useState)('');
    const [edgeTarget, setEdgeTarget] = (0, react_1.useState)('');
    const [edgeWeight, setEdgeWeight] = (0, react_1.useState)('1');
    const { sendMessage } = (0, useGraphWebSocket_1.useGraphWebSocket)({
        url: 'ws://localhost:3000/graph',
        autoConnect: true
    });
    const handleAddNode = (e) => {
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
    const handleAddEdge = (e) => {
        e.preventDefault();
        if (edgeSource && edgeTarget) {
            sendMessage('updateGraph', {
                nodes: [],
                edges: [{ source: edgeSource, target: edgeTarget, weight: Number(edgeWeight) }]
            });
            setEdgeSource('');
            setEdgeTarget('');
            setEdgeWeight('1');
        }
    };
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Graph Visualization Demo</h1>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Node</h2>
          <form onSubmit={handleAddNode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Node ID
                <input type="text" value={nodeId} onChange={(e) => setNodeId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Node Data
                <input type="text" value={nodeData} onChange={(e) => setNodeData(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
              </label>
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
              Add Node
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Edge</h2>
          <form onSubmit={handleAddEdge} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Source Node
                <input type="text" value={edgeSource} onChange={(e) => setEdgeSource(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Node
                <input type="text" value={edgeTarget} onChange={(e) => setEdgeTarget(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Weight
                <input type="number" value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
              </label>
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
              Add Edge
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6" style={{ height: '600px' }}>
        <graph_visualization_1.GraphVisualization websocketUrl="ws://localhost:3000/graph" showMiniMap showControls/>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Add nodes by filling out the Node ID and Node Data fields</li>
          <li>Connect nodes by adding edges with Source and Target node IDs</li>
          <li>Use the controls in the visualization to zoom, pan, and reorganize the graph</li>
          <li>Click nodes to expand/collapse their details</li>
          <li>Use the layout options to change how the graph is organized</li>
          <li>Filter nodes by type using the dropdown menu</li>
        </ul>
      </div>
    </div>);
}
export {};
//# sourceMappingURL=graph-demo.js.map