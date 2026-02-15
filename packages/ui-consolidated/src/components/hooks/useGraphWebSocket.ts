import { useState, useEffect, useCallback } from 'react';

interface GraphNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data: {
    label: string;
    status?: "running" | "error" | "idle";
    priority?: "high" | "medium" | "low";
    metadata?: Record<string, string | number>;
    expanded?: boolean;
  };
}

interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphConfig {
  layout?: { type: string };
  snapToGrid: boolean;
  snapGrid: [number, number];
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  elementsSelectable: boolean;
}

interface UseGraphWebSocketReturn {
  data: GraphData;
  config: GraphConfig;
  loading: boolean;
  error: Error | null;
  updateLayout: (type: string) => void;
  selectNodes: (ids: string[]) => void;
  expandNode: (id: string, expanded: boolean) => void;
  filterGraph: (filters: { types?: string[] }) => void;
}

interface UseGraphWebSocketOptions {
  url: string;
  autoConnect?: boolean;
}

export function useGraphWebSocket(options: UseGraphWebSocketOptions): UseGraphWebSocketReturn {
  const { url, autoConnect = true } = options;

  const [data, setData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<GraphConfig>({
    layout: { type: 'dagre' },
    snapToGrid: true,
    snapGrid: [16, 16],
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
  });

  useEffect(() => {
    if (!autoConnect) return;

    // Simulate initial data load
    const timer = setTimeout(() => {
      setData({ nodes: [], edges: [] });
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [url, autoConnect]);

  const updateLayout = useCallback((type: string) => {
    setConfig(prev => ({ ...prev, layout: { type } }));
  }, []);

  const selectNodes = useCallback((_ids: string[]) => {
    // Handle node selection
  }, []);

  const expandNode = useCallback((_id: string, _expanded: boolean) => {
    // Handle node expansion
  }, []);

  const filterGraph = useCallback((_filters: { types?: string[] }) => {
    // Handle graph filtering
  }, []);

  return {
    data,
    config,
    loading,
    error,
    updateLayout,
    selectNodes,
    expandNode,
    filterGraph,
  };
}
