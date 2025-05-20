import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  Node,
  Edge,
  NodeProps,
  NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { useGraphWebSocket } from '../../hooks/useGraphWebSocket.js';
import { MemoryGraphAdapter } from '../../memory/memory-graph-adapter.js';
import styles from './graph-visualization.module.css.js';

interface NodeData {
  label: string;
  status?: "running" | "error" | "idle";
  priority?: "high" | "medium" | "low";
  metadata?: Record<string, string | number>;
  expanded?: boolean;
}

interface GraphNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data: NodeData;
}

interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  label?: string;
}

interface GraphVisualizationProps {
  websocketUrl?: string;
  className?: string;
  showMiniMap?: boolean;
  showControls?: boolean;
  darkMode?: boolean;
}

const DefaultNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const nodeClass = `${styles.defaultNode} ${data.status === "running" ? "animate-pulse" : ""} ${
    data.status === "error" ? "border-red-500" : ""
  } ${data.priority === "high" ? "ring-2 ring-yellow-400" : ""}`;

  return (
    <div className={nodeClass}>
      <div className="font-medium">{data.label}</div>
      {data.metadata && (
        <div className={styles.metadataList}>
          {Object.entries(data.metadata).map(([key, value]) => (
            <div key={key}>
              {key}: {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TaskNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const nodeClass = `${styles.taskNode} ${data.status === "running" ? "animate-pulse" : ""} ${
    data.status === "error" ? "border-red-500" : ""
  }`;

  return (
    <div className={nodeClass}>
      <div className="font-medium">{data.label}</div>
      {data.metadata && (
        <div className={styles.metadataList}>
          {Object.entries(data.metadata).map(([key, value]) => (
            <div key={key}>
              {key}: {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AgentNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  return (
    <div className={styles.agentNode}>
      <div className="font-medium">{data.label}</div>
      {data.status && (
        <div className="text-xs mt-1 flex items-center gap-2">
          <div 
            className={`${styles.statusIndicator} ${
              data.status === "running" ? styles.statusRunning : styles.statusIdle
            }`}
          />
          {data.status}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  default: DefaultNode,
  task: TaskNode,
  agent: AgentNode,
};

function toReactFlowNode(node: GraphNode): Node<NodeData> {
  return {
    id: node.id,
    type: node.type || "default",
    position: node.position || { x: 0, y: 0 },
    data: node.data,
  };
}

function toReactFlowEdge(edge: GraphEdge): Edge {
  return {
    id: edge.id || `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: edge.type || "default",
    animated: edge.animated,
    style: edge.style,
    label: edge.label,
  };
}

export function GraphVisualization({
  websocketUrl = "ws://localhost:3000/graph",
  className = "",
  showMiniMap = true,
  showControls = true,
  darkMode = false,
}: GraphVisualizationProps) {
  const {
    data,
    config,
    loading,
    error,
    updateLayout,
    selectNodes,
    expandNode,
    filterGraph,
  } = useGraphWebSocket({
    url: websocketUrl,
    autoConnect: true,
  });

  const { fitView } = useReactFlow();
  const [memoryAdapter] = useState(() => new MemoryGraphAdapter({ dimensions: 128 }));
  const [suggestedConnections, setSuggestedConnections] = useState<Edge[]>([]);

  useEffect(() => {
    const initializeMemory = async () => {
      await memoryAdapter.addNodes(data.nodes);
    };
    initializeMemory();
  }, [data.nodes, memoryAdapter]);

  useEffect(() => {
    const updateSuggestions = async () => {
      if (data.nodes.length === 0) return;
      const latestNode = data.nodes[data.nodes.length - 1];
      const suggestions = await memoryAdapter.getSuggestedConnections(latestNode);
      setSuggestedConnections(suggestions);
    };
    updateSuggestions();
  }, [data.nodes, memoryAdapter]);

  const allEdges = useMemo(() => {
    return [...data.edges.map(toReactFlowEdge), ...suggestedConnections];
  }, [data.edges, suggestedConnections]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === "select") {
        selectNodes(
          changes
            .filter((c) => c.type === "select" && c.selected)
            .map((c) => c.id)
        );
      }
    });
  }, [selectNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NodeData>) => {
      expandNode(node.id, !node.data.expanded);
    },
    [expandNode]
  );

  const onLayout = useCallback(
    (type: string) => {
      updateLayout(type);
      setTimeout(() => fitView(), 200);
    },
    [updateLayout, fitView]
  );

  const graphStyles = useMemo(
    () => ({
      background: darkMode ? "#1a1a1a" : "#ffffff",
      width: "100%",
      height: "100%",
    }),
    [darkMode]
  );

  const nodes = useMemo(() => {
    return data.nodes.map(toReactFlowNode);
  }, [data.nodes]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error: {error.message}
      </div>
    );
  }

  const containerClass = `${styles.graphContainer} ${className} ${darkMode ? styles.darkMode : ""}`;

  return (
    <div className={containerClass}>
      <ReactFlow
        nodes={nodes}
        edges={allEdges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        style={graphStyles}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        snapToGrid={config.snapToGrid}
        snapGrid={config.snapGrid}
        nodesDraggable={config.nodesDraggable}
        nodesConnectable={config.nodesConnectable}
        elementsSelectable={config.elementsSelectable}
      >
        <Background color={darkMode ? "#333333" : "#aaaaaa"} gap={16} />
        {showControls && <Controls />}
        {showMiniMap && (
          <MiniMap
            nodeColor={(n) => {
              const data = n.data as NodeData;
              return data.status === "running" ? "#34d399" : "#3b82f6";
            }}
            maskColor={darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"}
          />
        )}
        <Panel position="top-right" className="space-y-2">
          <select
            className={styles.layoutSelect}
            onChange={(e) => onLayout(e.target.value)}
            value={config.layout?.type}
            aria-label="Select layout type"
          >
            <option value="dagre">Hierarchical</option>
            <option value="force">Force-Directed</option>
            <option value="layered">Layered</option>
          </select>
          <select
            className={styles.layoutSelect}
            onChange={(e) => filterGraph({ types: e.target.value ? [e.target.value] : undefined })}
            defaultValue=""
            aria-label="Filter by node type"
          >
            <option value="">All Types</option>
            <option value="task">Tasks</option>
            <option value="agent">Agents</option>
            <option value="tool">Tools</option>
            <option value="message">Messages</option>
            <option value="data">Data</option>
            <option value="service">Services</option>
            <option value="event">Events</option>
            <option value="state">States</option>
          </select>
        </Panel>
      </ReactFlow>
    </div>
  );
}