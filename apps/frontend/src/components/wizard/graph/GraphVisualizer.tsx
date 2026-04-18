// @ts-nocheck
import * as d3 from 'd3';
import dagre from 'dagre';
import {
  Brain,
  Cpu,
  GitBranch,
  Maximize,
  Network,
  Search,
  Settings,
  Waypoints,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  Edge,
  Node,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DataCard } from '../../shared/DataCard';

const layoutAlgorithms = {
  force: (nodes: Node[], edges: Edge[]) => {
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3.forceLink(edges as any).id((d: any) => d.id)
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(0, 0));

    // Run simulation for a fixed number of ticks
    for (let i = 0; i < 300; ++i) simulation.tick();

    return { nodes, edges };
  },
  dagre: (nodes: Node[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 70 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      g.setNode(node.id, { width: 150, height: 40 });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    return {
      nodes: nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x,
            y: nodeWithPosition.y,
          },
        };
      }),
      edges,
    };
  },
  circular: (nodes: Node[], edges: Edge[]) => {
    const radius = Math.max(nodes.length * 30, 200);
    const angleStep = (2 * Math.PI) / nodes.length;

    return {
      nodes: nodes.map((node, i) => ({
        ...node,
        position: {
          x: radius * Math.cos(angleStep * i),
          y: radius * Math.sin(angleStep * i),
        },
      })),
      edges,
    };
  },
};

// Premium Node Types
const PremiumNode = ({ data }) => {
  const isAgent = data.kind === 'agent';
  const isDoc = data.kind === 'doc';
  const isTool = data.kind === 'tool';
  
  let icon = <Cpu className="w-4 h-4" />;
  let colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
  
  if (isAgent) { icon = <Brain className="w-4 h-4" />; colorClass = "text-purple-400 bg-purple-500/10 border-purple-500/20"; }
  if (isDoc) { icon = <Waypoints className="w-4 h-4" />; colorClass = "text-slate-400 bg-slate-500/10 border-slate-500/20"; }
  if (isTool) { icon = <Settings className="w-4 h-4" />; colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20"; }

  return (
    <div className={`px-4 py-3 rounded-xl bg-gray-900/80 backdrop-blur-md border border-white/10 shadow-2xl min-w-[160px] transition-all hover:border-indigo-500/50 hover:-translate-y-1`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg border ${colorClass}`}>
          {icon}
        </div>
        <div className="font-bold text-sm text-white truncate max-w-[120px]" title={data.label}>
          {data.label}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{data.kind || 'node'}</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  premium: PremiumNode,
  agent: PremiumNode,
  doc: PremiumNode,
  tool: PremiumNode,
};

// Interface for props
interface GraphVisualizerProps {
  nodes?: Node[];
  edges?: Edge[];
  config?: any;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  onLayoutChange?: (layoutType: string) => void;
  onConfigChange?: (config: any) => void;
}

export function GraphVisualizer({
  nodes: initialNodes,
  edges: initialEdges,
  config: initialConfig,
  onNodeClick,
  onEdgeClick,
  onLayoutChange,
  onConfigChange,
}: GraphVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [config, setConfig] = useState(
    initialConfig || {
      layout: { type: 'force' },
      physics: {
        enabled: true,
        stabilization: true,
        repulsion: 100,
        springLength: 100,
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        selectable: true,
        multiselect: true,
      },
      styles: {
        node: {},
        edge: {},
        selected: {},
      },
    }
  );

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  const [clusteringEnabled, setClusteringEnabled] = useState(false);
  const [clusterAlgorithm, setClusterAlgorithm] = useState('louvain');

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  useEffect(() => {
    if (initialNodes && initialEdges) {
      applyLayout(config.layout.type, initialNodes, initialEdges);
    }
  }, [initialNodes, initialEdges]);

  const applyLayout = useCallback(
    (layoutType: string, nodes: Node[], edges: Edge[]) => {
      const layout = (layoutAlgorithms as any)[layoutType];
      if (layout) {
        // Map nodes to use premium type
        const updatedNodes = nodes.map(n => ({
          ...n,
          type: n.type || 'premium',
          dragHandle: '.drag-handle'
        }));
        
        // Enhance edges with animation
        const updatedEdges = edges.map(e => ({
          ...e,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = layout(updatedNodes, updatedEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        onLayoutChange?.(layoutType);

        // Delay fitView slightly to allow render
        setTimeout(() => fitView(), 10);
      }
    },
    [setNodes, setEdges, fitView, onLayoutChange]
  );

  const applyClustering = useCallback(() => {
    const { clusters, clusterMap } = (clusterAlgorithms as any)[clusterAlgorithm](nodes, edges);
    setNodes(
      nodes.map((node: any) => ({
        ...node,
        data: { ...node.data, cluster: clusterMap.get(node.id) },
        style: {
          ...node.style,
          backgroundColor: `hsl(${(clusterMap.get(node.id) || 0) * 137.5}, 50%, 50%)`,
        },
      }))
    );
  }, [nodes, edges, clusterAlgorithm, setNodes]);

  const findPath = useCallback(() => {
    if (!startNode || !endNode) return;
    const path = pathAlgorithms.aStar(nodes, edges, startNode, endNode);
    setEdges(
      edges.map((edge: any) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: path.includes(edge.id) ? '#ff0000' : '#000000',
          strokeWidth: path.includes(edge.id) ? 3 : 1,
        },
      }))
    );
  }, [nodes, edges, startNode, endNode, setEdges]);

  const handleSearch = useCallback(() => {
    if (!searchTerm) {
      setNodes((nodes) => nodes.map((node: any) => ({ ...node, style: undefined })));
      return;
    }
    setNodes((nodes) =>
      nodes.map((node: any) => ({
        ...node,
        style: {
          ...node.style,
          opacity: node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.2,
        },
      }))
    );
  }, [searchTerm, setNodes]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (pathfindingMode) {
        if (!startNode) {
          setStartNode(node.id);
        } else if (!endNode) {
          setEndNode(node.id);
          findPath();
        }
      } else {
        onNodeClick?.(event, node);
      }
    },
    [pathfindingMode, startNode, endNode, findPath, onNodeClick]
  );

  return (
    <div className="h-full relative">
      <DataCard
        title="Knowledge Graph"
        tooltip="Interactive visualization of the knowledge graph"
        data={{ nodes, edges }}
        isLoading={false}
        renderContent={() => (
          <div className="h-[600px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.LOOSE}
              fitView
            >
              <Background color="#1e293b" gap={20} />
              <Controls className="bg-gray-900 border-gray-700 fill-white" />

              {/* Top Left Toolbar */}
              <Panel
                position="top-left"
                className="bg-transparent dark:bg-transparent p-1.5 rounded-md shadow-md border border-gray-200 dark:border-gray-600 flex gap-1"
              >
                <button
                  className="p-1.5 hover:bg-muted/30 dark:hover:bg-gray-700 rounded text-foreground dark:text-gray-200"
                  onClick={() => zoomIn()}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 hover:bg-muted/30 dark:hover:bg-gray-700 rounded text-foreground dark:text-gray-200"
                  onClick={() => zoomOut()}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 hover:bg-muted/30 dark:hover:bg-gray-700 rounded text-foreground dark:text-gray-200"
                  onClick={() => fitView()}
                  title="Fit View"
                >
                  <Maximize className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    className="p-1.5 hover:bg-muted/30 dark:hover:bg-gray-700 rounded text-foreground dark:text-gray-200"
                    onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                    title="Layout Options"
                  >
                    <Network className="w-4 h-4" />
                  </button>

                  {showLayoutMenu && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-transparent dark:bg-transparent rounded-md shadow-none border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {[
                        { id: 'force', label: 'Force Layout' },
                        { id: 'dagre', label: 'Hierarchical Layout' },
                        { id: 'circular', label: 'Circular Layout' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          className="w-full text-left px-4 py-2 text-sm text-foreground dark:text-gray-200 hover:bg-muted/30 dark:hover:bg-gray-700"
                          onClick={() => {
                            applyLayout(opt.id, nodes, edges);
                            setShowLayoutMenu(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="p-1.5 hover:bg-muted/30 dark:hover:bg-gray-700 rounded text-foreground dark:text-gray-200"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </Panel>

              {/* Top Right Search */}
              <Panel
                position="top-right"
                className="bg-transparent dark:bg-transparent p-1 rounded-md shadow-md border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center">
                  <input
                    type="text"
                    className="px-2 py-1 text-sm bg-transparent border-none focus:outline-none w-40 dark:text-white"
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground dark:text-muted-foreground"
                    onClick={handleSearch}
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </Panel>

              {/* Bottom Left Controls */}
              <Panel position="bottom-left" className="flex gap-2">
                <button
                  className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-none border transaction-colors flex items-center gap-1.5
                        ${
                          pathfindingMode
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                            : 'bg-transparent dark:bg-transparent text-foreground dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-muted/20 dark:hover:bg-gray-700'
                        }`}
                  onClick={() => setPathfindingMode(!pathfindingMode)}
                >
                  <GitBranch className="w-4 h-4" />
                  Path Finding
                </button>
                <button
                  className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-none border transaction-colors flex items-center gap-1.5
                        ${
                          clusteringEnabled
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                            : 'bg-transparent dark:bg-transparent text-foreground dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-muted/20 dark:hover:bg-gray-700'
                        }`}
                  onClick={() => {
                    setClusteringEnabled(!clusteringEnabled);
                    if (!clusteringEnabled) {
                      applyClustering();
                    }
                  }}
                >
                  <Waypoints className="w-4 h-4" />
                  Clustering
                </button>
              </Panel>
            </ReactFlow>
          </div>
        )}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-transparent dark:bg-transparent rounded-md shadow-none w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Graph Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-muted-foreground dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Physics */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Physics
                </h4>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enablePhysics"
                    checked={config.physics.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        physics: { ...prev.physics, enabled: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enablePhysics"
                    className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                  >
                    Enable Physics
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1">
                    Repulsion Force: {config.physics.repulsion}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={config.physics.repulsion}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        physics: { ...prev.physics, repulsion: Number(e.target.value) },
                      }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-md appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1">
                    Spring Length: {config.physics.springLength}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={config.physics.springLength}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        physics: { ...prev.physics, springLength: Number(e.target.value) },
                      }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-md appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Clustering
                </h4>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1">
                    Algorithm
                  </label>
                  <select
                    value={clusterAlgorithm}
                    onChange={(e) => setClusterAlgorithm(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  >
                    <option value="louvain">Louvain</option>
                    <option value="kMeans">K-Means</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-transparent dark:bg-gray-900 px-4 py-2 sm:px-3 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-none px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => {
                  onConfigChange?.(config);
                  setShowSettings(false);
                }}
              >
                Apply
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-none px-4 py-2 bg-transparent text-base font-medium text-foreground hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with provider to ensure useReactFlow works
export const GraphVisualizerWrapper = (props: GraphVisualizerProps) => (
  <ReactFlowProvider>
    <GraphVisualizer {...props} />
  </ReactFlowProvider>
);

export default GraphVisualizerWrapper;
