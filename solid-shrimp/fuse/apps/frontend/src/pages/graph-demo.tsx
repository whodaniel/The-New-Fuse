import { FormEvent, useState } from 'react';
import { GraphVisualization } from '../components/ui/graph-visualization';

// Mock useGraphWebSocket hook for demo purposes
const useGraphWebSocket = (config: { url: string; autoConnect: boolean }) => {
  console.log('Simulating connection with config:', config);
  return {
    sendMessage: (type: string, data: any) => {
      console.log('Sending message:', type, data);
    },
  };
};

class CognitiveCore {
  constructor() {}
}

class MetaLearner {
  constructor() {}
}

class SocialCore {
  constructor() {}
}

class EmergenceCore {
  constructor() {}
}

export class AgentOrchestrator {
  public cognitive: CognitiveCore;
  public learning: MetaLearner;
  public social: SocialCore;
  public emergence: EmergenceCore;
  public agentStates: Map<string, any>;

  constructor() {
    this.cognitive = new CognitiveCore();
    this.learning = new MetaLearner();
    this.social = new SocialCore();
    this.emergence = new EmergenceCore();
    this.agentStates = new Map();
  }
}

export function GraphDemo() {
  const [nodeId, setNodeId] = useState('');
  const [nodeData, setNodeData] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');

  const { sendMessage } = useGraphWebSocket({
    url: import.meta.env.VITE_WS_URL || '/ws',
    autoConnect: true,
  });

  const handleAddNode = (e: FormEvent) => {
    e.preventDefault();
    if (nodeId && nodeData) {
      sendMessage('updateGraph', {
        nodes: [{ id: nodeId, data: { label: nodeData } }],
        edges: [],
      });
      setNodeId('');
      setNodeData('');
    }
  };

  const handleAddEdge = (e: FormEvent) => {
    e.preventDefault();
    if (edgeSource && edgeTarget) {
      sendMessage('updateGraph', {
        nodes: [],
        edges: [
          {
            source: edgeSource,
            target: edgeTarget,
            weight: parseFloat(edgeWeight),
          },
        ],
      });
      setEdgeSource('');
      setEdgeTarget('');
      setEdgeWeight('1');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interactive Graph Visualization Demo
        </h1>
        <p className="text-lg text-gray-600">
          Add nodes and edges to create a dynamic graph visualization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Node</h2>
          <form onSubmit={handleAddNode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Node ID
                <input
                  type="text"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter unique node ID"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Node Data
                <input
                  type="text"
                  value={nodeData}
                  onChange={(e) => setNodeData(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter node label/data"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Add Node
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Edge</h2>
          <form onSubmit={handleAddEdge} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Source Node ID
                <input
                  type="text"
                  value={edgeSource}
                  onChange={(e) => setEdgeSource(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Source node ID"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Node ID
                <input
                  type="text"
                  value={edgeTarget}
                  onChange={(e) => setEdgeTarget(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Target node ID"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Edge Weight
                <input
                  type="number"
                  value={edgeWeight}
                  onChange={(e) => setEdgeWeight(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Add Edge
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6" style={{ height: '600px' }}>
        <GraphVisualization
          websocketUrl={import.meta.env.VITE_WS_URL || '/ws'}
          showMiniMap
          showControls
        />
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
    </div>
  );
}

export default GraphDemo;
