import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Node,
  Edge,
  NodeProps,
  EdgeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphWebSocket } from '../../hooks/useGraphWebSocket.js';
import { MemoryGraphAdapter } from '../../memory/memory-graph-adapter.js';
import styles from './graph-visualization.module.css.js';

interface NodeData {
  label: string;
  type?: string;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
  };
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  [key: string]: unknown;
}

const DefaultNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  useEffect(() => {
    const node = document.documentElement;
    if (data.style?.backgroundColor) {
      node.style.setProperty('--node-bg', data.style.backgroundColor);
    }
    if (data.style?.borderColor) {
      node.style.setProperty('--node-border', data.style.borderColor);
    }
    if (data.style?.color) {
      node.style.setProperty('--node-text', data.style.color);
    }
  }, [data.style]);

  return (
    <div className={styles.node}>
      <div className={styles.nodeLabel}>{data.label}</div>
    </div>
  );
};

const nodeTypes = {
  default: DefaultNode,
};

interface GraphVisualizationProps {
  nodes?: Node[];
  edges?: Edge[];
  websocketUrl?: string;
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
  layoutAlgorithm?: 'dagre' | 'force' | 'circular';
  height?: string;
  width?: string;
  zoomable?: boolean;
  pannable?: boolean;
  minimap?: boolean;
  controls?: boolean;
  nodeTypes?: Record<string, React.ComponentType<NodeProps>>;
  edgeTypes?: Record<string, React.ComponentType<EdgeProps>>;
}

export function GraphVisualization({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  websocketUrl,
  onNodeClick,
  onEdgeClick,
  layoutAlgorithm = 'dagre',
  height = '600px',
  width = '100%',
  zoomable = true,
  pannable = true,
  minimap = true,
  controls = true,
  nodeTypes: customNodeTypes,
  edgeTypes,
}: GraphVisualizationProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const { fitView } = useReactFlow();

  const handleGraphUpdate = useCallback((graphData: GraphData) => {
    const adapter = new MemoryGraphAdapter();
    const { nodes: newNodes, edges: newEdges } = adapter.convertToReactFlow(graphData);
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  useEffect(() => {
    if (!websocketUrl) return;

    const ws = useGraphWebSocket(websocketUrl, {
      onGraphUpdate: handleGraphUpdate,
    });

    ws.connect();
    return () => ws.disconnect();
  }, [websocketUrl, handleGraphUpdate]);

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
    }
  }, [nodes, edges, layoutAlgorithm, fitView]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick?.(node);
  }, [onNodeClick]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    onEdgeClick?.(edge);
  }, [onEdgeClick]);

  const mergedNodeTypes = {
    ...nodeTypes,
    ...customNodeTypes,
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--graph-height', height);
    document.documentElement.style.setProperty('--graph-width', width);
  }, [height, width]);

  return (
    <div className={styles.graphContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={mergedNodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
        zoomOnScroll={zoomable}
        panOnScroll={pannable}
      >
        {controls && <Controls />}
        {minimap && <MiniMap />}
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}
