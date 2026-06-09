import dagre from 'dagre';
import {
  Activity,
  Box,
  ChevronRight,
  Code,
  ExternalLink,
  FileCode,
  Info,
  Layers,
  Lock,
  Map as MapIcon,
  Search,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
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
import codebaseMapUrl from '../../data/codebase_map.json?url';

type CodebaseMapData = {
  nodes: Node[];
  edges: Edge[];
};

// Dagre layouting engine
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 70, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 220, height: 80 });
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
          x: nodeWithPosition.x - 110,
          y: nodeWithPosition.y - 40,
        },
      };
    }),
    edges,
  };
};

const CustomNode = ({ data, selected }: any) => {
  const isExpandable = data.childCount > 0;

  const kindConfig: Record<string, { color: string; icon: any }> = {
    pkg: {
      color: 'border-blue-500 bg-blue-500/10 text-blue-400',
      icon: <Box className="w-4 h-4" />,
    },
    file: {
      color: 'border-cyan-500 bg-cyan-500/10 text-cyan-400',
      icon: <FileCode className="w-4 h-4" />,
    },
    cls: {
      color: 'border-purple-500 bg-purple-500/10 text-purple-400',
      icon: <Layers className="w-4 h-4" />,
    },
    mth: {
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
      icon: <Code className="w-4 h-4" />,
    },
    default: {
      color: 'border-gray-500 bg-gray-500/10 text-gray-400',
      icon: <Info className="w-4 h-4" />,
    },
  };

  const config = kindConfig[data.kind] || kindConfig.default;

  return (
    <div
      className={`px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[220px] transition-all hover:scale-105 duration-300 ${config.color} ${selected ? 'ring-2 ring-white/40 ring-offset-4 ring-offset-black' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="opacity-70">{config.icon}</div>
          <span className="font-black text-xs truncate uppercase tracking-tight">{data.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {data.authRequired && <Lock className="w-3 h-3 text-red-400" />}
          {isExpandable && <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[9px] uppercase font-black tracking-widest opacity-60">
          {data.kind}
        </span>
        {isExpandable && (
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-bold text-white/50">{data.childCount} units</span>
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  premium: CustomNode,
  class: CustomNode,
  method: CustomNode,
  file: CustomNode,
};

const CodebaseMapInner = () => {
  const [codebaseData, setCodebaseData] = useState<CodebaseMapData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [currentRoot, setCurrentRoot] = useState('TNF');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const { fitView } = useReactFlow();

  const refreshGraph = useCallback(
    (rootId: string) => {
      if (!codebaseData) return;

      const directChildren = codebaseData.nodes.filter((n) => n.data.parentId === rootId);
      const rootNode = codebaseData.nodes.find((n) => n.id === rootId);

      const relevantNodes = [rootNode, ...directChildren].filter(Boolean) as Node[];
      const relevantEdges = codebaseData.edges.filter(
        (e) =>
          e.source === rootId ||
          (directChildren.some((dc) => dc.id === e.source) &&
            directChildren.some((dc) => dc.id === e.target))
      );

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        relevantNodes,
        relevantEdges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Zoom to fit after layout
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 50);
    },
    [codebaseData, setNodes, setEdges, fitView]
  );

  useEffect(() => {
    let cancelled = false;

    fetch(codebaseMapUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Codebase map request failed with ${response.status}`);
        }
        return response.json() as Promise<CodebaseMapData>;
      })
      .then((data) => {
        if (cancelled) return;
        setCodebaseData(data);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!codebaseData) return;
    refreshGraph('TNF');
  }, [codebaseData, refreshGraph]);

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
    if (node.data.childCount > 0 && node.id !== currentRoot) {
      setCurrentRoot(node.id);
      refreshGraph(node.id);
    }
  };

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    if (!term || !codebaseData) return;

    // Search all 15k nodes for label match
    const match = codebaseData.nodes.find((n) =>
      n.data.label.toLowerCase().includes(term.toLowerCase())
    );

    if (match) {
      // If we find a match, jump to its parent and highlight it
      const parentId = match.data.parentId || 'TNF';
      setCurrentRoot(parentId);
      refreshGraph(parentId);
      setSelectedNode(match);
    }
  };

  const goBack = () => {
    if (!codebaseData) return;

    const currentNode = codebaseData.nodes.find((n) => n.id === currentRoot);
    if (currentNode?.data.parentId) {
      setCurrentRoot(currentNode.data.parentId);
      refreshGraph(currentNode.data.parentId);
    } else if (currentRoot !== 'TNF') {
      setCurrentRoot('TNF');
      refreshGraph('TNF');
    }
  };

  // Breadcrumb path calculation
  const path = useMemo(() => {
    if (!codebaseData) return [];

    const segments = [];
    let curr = codebaseData.nodes.find((n) => n.id === currentRoot);
    while (curr) {
      segments.unshift(curr);
      curr = codebaseData.nodes.find((n) => n.id === curr?.data?.parentId);
    }
    return segments;
  }, [codebaseData, currentRoot]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-[#050505] text-white flex items-center justify-center p-8">
        <div className="max-w-lg rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
          <h2 className="text-xl font-black uppercase tracking-tight mb-3">
            Codebase map unavailable
          </h2>
          <p className="text-sm text-red-100/80">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!codebaseData) {
    return (
      <div className="w-full h-full bg-[#050505] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60">
          <Activity className="w-4 h-4 animate-pulse text-blue-400" />
          <span className="text-xs font-black uppercase tracking-widest">
            Loading codebase map
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#050505] text-white flex overflow-hidden font-sans">
      {/* Main Graph Area */}
      <div className="flex-1 flex flex-col relative border-r border-white/10">
        {/* Superior Top Bar */}
        <div className="h-20 px-8 flex items-center justify-between bg-black/40 backdrop-blur-2xl border-b border-white/10 z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <MapIcon className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-xl font-black tracking-tighter uppercase italic italic-shadow">
                TNF Ecosystem Map
              </h2>
            </div>
            {/* Real-time Breadcrumbs */}
            <div className="flex items-center gap-1 overflow-hidden max-w-md">
              <span
                className="text-[10px] font-black text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  setCurrentRoot('TNF');
                  refreshGraph('TNF');
                }}
              >
                ROOT
              </span>
              {path.map((seg, i) => (
                <React.Fragment key={seg.id}>
                  <ChevronRight className="w-3 h-3 text-white/10 shrink-0" />
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest truncate cursor-pointer hover:text-white transition-colors ${i === path.length - 1 ? 'text-blue-400' : 'text-white/40'}`}
                    onClick={() => {
                      setCurrentRoot(seg.id);
                      refreshGraph(seg.id);
                    }}
                  >
                    {seg.data.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Lookup Specific Logic Node..."
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all w-80 font-mono tracking-tight"
                value={searchTerm}
                onChange={(e) => handleGlobalSearch(e.target.value)}
              />
            </div>
            <button
              onClick={goBack}
              className="h-11 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
            >
              Move Up Architecture
            </button>
          </div>
        </div>

        {/* The Real-Data Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.05}
            maxZoom={2}
          >
            <Background color="#111" gap={30} size={1} />
            <Controls className="!bg-black/60 !border-white/10 !fill-white" />

            {/* Dynamic Status HUD */}
            <Panel position="bottom-left" className="m-6">
              <div className="bg-black/60 p-5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    Core AST Live Sync
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-white/30 mb-1">
                      Total Intelligence
                    </span>
                    <span className="text-sm font-mono font-black">
                      {codebaseData.nodes.length.toLocaleString()} nodes
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-white/30 mb-1">
                      Active Context
                    </span>
                    <span className="text-sm font-mono font-black text-blue-400">
                      {nodes.length} units
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Logic Inspection Side-Panel */}
      <div
        className={`w-[400px] bg-[#080808] border-l border-white/10 flex flex-col transition-all duration-500 ${selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}
      >
        {selectedNode && (
          <>
            <div className="p-8 border-b border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white/30" />
                </button>
              </div>
              <h3 className="text-2xl font-black tracking-tighter uppercase italic">
                {selectedNode.data.label}
              </h3>
              <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mt-2">
                {selectedNode.data.kind} Unit
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Hierarchical Context
                </h4>
                <div className="space-y-3">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-[9px] font-black text-white/30 uppercase block mb-1">
                      Parent Identity
                    </span>
                    <code className="text-xs text-blue-400 font-mono">
                      {selectedNode.data.parentId || 'N/A (Root)'}
                    </code>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-[9px] font-black text-white/30 uppercase block mb-1">
                      Logic Complexity
                    </span>
                    <code className="text-xs text-emerald-400 font-mono">
                      {selectedNode.data.childCount} Downstream Connections
                    </code>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                  <Code className="w-3 h-3" /> Actions
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <button className="flex items-center justify-between p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl transition-all group">
                    <span className="text-xs font-bold text-blue-400">Open in IDE Workbench</span>
                    <ExternalLink className="w-4 h-4 text-blue-400 opacity-50 group-hover:opacity-100" />
                  </button>
                  <button className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                    <span className="text-xs font-bold text-white/60">Generate Documentation</span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:opacity-100" />
                  </button>
                </div>
              </section>

              <section className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
                    Attribution Note
                  </span>
                </div>
                <p className="text-[11px] text-amber-500/70 leading-relaxed font-medium">
                  This node represents a verified logical unit within the TNF Kernel. All downstream
                  modifications must adhere to the Attribution Overrule protocol.
                </p>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function InteractiveCodebaseMap() {
  return (
    <div className="w-screen h-screen bg-[#050505]">
      <ReactFlowProvider>
        <CodebaseMapInner />
      </ReactFlowProvider>
    </div>
  );
}
