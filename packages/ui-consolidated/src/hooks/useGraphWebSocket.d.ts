interface Node {
    id: string;
    label: string;
    type?: string;
    position?: {
        x: number;
        y: number;
    };
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
    layout: {
        type: string;
    };
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
export declare function useGraphWebSocket({ url, autoConnect, reconnectInterval, maxReconnectAttempts, }: UseGraphWebSocketProps): UseGraphWebSocketReturn;
export {};
//# sourceMappingURL=useGraphWebSocket.d.ts.map