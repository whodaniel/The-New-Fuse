// @ts-nocheck
import { Plus, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  Node,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWizard } from './WizardProvider';

const nodeTypes = {
  concept: ConceptNode,
  relation: RelationNode,
  entity: EntityNode,
};

export function KnowledgeGraphViewer() {
  const { state } = useWizard();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [autoLayout, setAutoLayout] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (state.session?.knowledge_graph) {
      loadGraphData(state.session.knowledge_graph);
    }
  }, [state.session]);

  const loadGraphData = async (graph: any) => {
    setLoading(true);
    try {
      const graphData = await graph.exportGraph();
      const formattedNodes = formatNodes(graphData.nodes);
      const formattedEdges = formatEdges(graphData.edges);

      if (autoLayout) {
        const layoutedElements = applyForceLayout(formattedNodes, formattedEdges);
        setNodes(layoutedElements.nodes);
        setEdges(layoutedElements.edges);
      } else {
        setNodes(formattedNodes);
        setEdges(formattedEdges);
      }
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNodes = (knowledgeNodes: any[]) => {
    return knowledgeNodes.map((node: any) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: { label: node.label, ...node.data },
    }));
  };

  const formatEdges = (knowledgeEdges: any[]) => {
    return knowledgeEdges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: edge.type,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: { stroke: '#555' },
    }));
  };

  const applyForceLayout = (nodes: any[], edges: any[]) => {
    const nodeSpacing = 150;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      node.position = {
        x: centerX + Math.cos(angle) * nodeSpacing,
        y: centerY + Math.sin(angle) * nodeSpacing,
      };
    });

    return { nodes, edges };
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleAddNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'concept',
      position: { x: 100, y: 100 },
      data: { label: 'New Concept' },
    };
    setNodes([...nodes, newNode]);
  };

  const handleSearch = useCallback(() => {
    if (!searchTerm) {
      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          style: undefined,
        }))
      );
      return;
    }

    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        style: node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
          ? { background: '#ff8', border: '2px solid #aa5' }
          : { opacity: 0.3 },
      }))
    );
  }, [searchTerm, setNodes, nodes]); // Added nodes to deps to match original logic approx, though this might re-trigger too much. original didn't have deps array issue shown fully.

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[600px] relative border border-gray-200 dark:border-gray-700 rounded-md shadow-none bg-transparent dark:bg-gray-900 overflow-hidden">
      <div className="absolute top-4 left-4 z-[5] flex gap-2 items-center">
        <div className="relative">
          <input
            type="text"
            className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1.5 text-gray-400 hover:text-muted-foreground dark:hover:text-gray-300"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleAddNode}
          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Node
        </button>
        <div className="flex items-center bg-transparent dark:bg-transparent px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600">
          <label className="flex items-center text-sm text-foreground dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoLayout}
              onChange={(e) => setAutoLayout(e.target.checked)}
              className="mr-2 rounded text-blue-600 focus:ring-blue-500"
            />
            Auto Layout
          </label>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.LOOSE}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(updatedData: any) => {
            setNodes((nodes) =>
              nodes.map((n) =>
                n.id === selectedNode.id ? { ...n, data: { ...n.data, ...updatedData } } : n
              )
            );
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}

function ConceptNode({ data }: { data: any }) {
  return (
    <div className="bg-transparent dark:bg-transparent border-2 border-blue-500 rounded-md p-2 min-w-[150px] shadow-none">
      <div className="font-bold text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1 mb-1">
        {data.label}
      </div>
      <div className="text-xs text-muted-foreground dark:text-muted-foreground">
        {data.description || 'Concept'}
      </div>
    </div>
  );
}

function RelationNode({ data }: { data: any }) {
  return (
    <div className="bg-transparent dark:bg-transparent border-2 border-green-500 rounded-full px-4 py-2 min-w-[100px] shadow-none">
      <div className="font-bold text-sm text-center text-gray-900 dark:text-white">
        {data.label}
      </div>
      <div className="text-xs text-center text-muted-foreground dark:text-muted-foreground">
        {data.relationType}
      </div>
    </div>
  );
}

function EntityNode({ data }: { data: any }) {
  return (
    <div className="bg-transparent dark:bg-transparent border-2 border-purple-500 rounded-md p-2 min-w-[150px] shadow-none">
      <div className="font-bold text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1 mb-1">
        {data.label}
      </div>
      <div className="text-xs space-y-1">
        {Object.entries(data.properties || {}).map(([key, value]) => (
          <div
            key={key}
            className="text-muted-foreground dark:text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap"
          >
            <span className="font-semibold">{key}:</span> {String(value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeDetailsPanel({
  node,
  onClose,
  onUpdate,
}: {
  node: Node;
  onClose: () => void;
  onUpdate: (data: any) => void;
}) {
  const [editData, setEditData] = useState(node.data);

  return (
    <div className="absolute right-4 top-4 w-80 bg-transparent dark:bg-transparent rounded-md shadow-none border border-gray-200 dark:border-gray-700 p-4 z-10">
      <div className="flex justify-between items-center mb-4">
        <h6 className="text-lg font-semibold text-gray-900 dark:text-white">Node Details</h6>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-muted-foreground dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1">
            Label
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={editData.label}
            onChange={(e) => setEditData({ ...editData, label: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
            value={editData.description || ''}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-foreground dark:text-gray-300 hover:bg-muted/30 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(editData)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
