import { useState, useEffect, useRef, useCallback } from 'react';

interface Node {
  id: string;
  label: string;
  type?: string;
  position?: { x: number; y: number };
  data?: any;
  timestamp?: Date;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface GraphConfig {
  layout: { type: string };
  fitView: boolean;
  nodesDraggable: boolean;
  nodesConnectable?: boolean;
  elementsSelectable?: boolean;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
}

interface GraphWebSocketState {
  data: GraphData;
  config: GraphConfig;
  selectedNodes: string[];
  loading: boolean;
  error: Error | null;
}

interface UseGraphWebSocketProps {
  url: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseGraphWebSocketReturn extends GraphWebSocketState {
  connect: () => void;
  sendMessage: (type: string, payload?: any) => void;
  updateLayout: (type: string, options?: any) => void;
  updateNode: (nodeId: string, data: any) => void;
  selectNodes: (nodeIds: string[]) => void;
  expandNode: (nodeId: string, expanded: boolean) => void;
  filterGraph: (filters: any) => void;
  isConnected: boolean;
}

export function useGraphWebSocket({
  url,
  autoConnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseGraphWebSocketProps): UseGraphWebSocketReturn {
  const [state, setState] = useState<GraphWebSocketState>({
    data: { nodes: [], edges: [] },
    config: {
      layout: { type: 'dagre' },
      fitView: true,
      nodesDraggable: true,
      nodesConnectable: true,
      elementsSelectable: true,
      snapToGrid: false,
      snapGrid: [15, 15],
    },
    selectedNodes: [],
    loading: true,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageHandlersRef = useRef<Map<string, (payload: any) => void>>(new Map());

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, loading: false, error: null }));
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handler = messageHandlersRef.current.get(message.type);
          if (handler) {
            handler(message.payload);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, error: new Error('WebSocket connection error') }));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        } else {
          setState(prev => ({ 
            ...prev, 
            error: new Error('Max reconnection attempts reached') 
          }));
        }
      };
    } catch (error) {
      console.error('Connection error:', error);
      setState(prev => ({ ...prev, error: error as Error }));
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    // Set up message handlers
    messageHandlersRef.current.set('update', (payload) => {
      setState(prev => ({ ...prev, data: payload }));
    });

    messageHandlersRef.current.set('select', (payload) => {
      setState(prev => ({ ...prev, selectedNodes: payload.nodeIds }));
    });

    messageHandlersRef.current.set('error', (payload) => {
      setState(prev => ({ ...prev, error: new Error(payload) }));
    });

    messageHandlersRef.current.set('config', (payload) => {
      setState(prev => ({ ...prev, config: { ...prev.config, ...payload } }));
    });

    if (autoConnect) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, autoConnect]);

  const sendMessage = useCallback((type: string, payload?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const updateLayout = useCallback((type: string, options?: any) => {
    sendMessage('layout', { type, options });
  }, [sendMessage]);

  const updateNode = useCallback((nodeId: string, data: any) => {
    sendMessage('update', {
      nodes: [{ id: nodeId, ...data }],
    });
  }, [sendMessage]);

  const selectNodes = useCallback((nodeIds: string[]) => {
    sendMessage('select', { nodeIds });
  }, [sendMessage]);

  const expandNode = useCallback((nodeId: string, expanded: boolean) => {
    sendMessage('expand', { nodeId, expanded });
  }, [sendMessage]);

  const filterGraph = useCallback((filters: any) => {
    sendMessage('filter', filters);
  }, [sendMessage]);

  return {
    ...state,
    connect,
    sendMessage,
    updateLayout,
    updateNode,
    selectNodes,
    expandNode,
    filterGraph,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}