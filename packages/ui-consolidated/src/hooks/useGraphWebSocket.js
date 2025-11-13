import { useState, useEffect, useRef, useCallback } from 'react';
export function useGraphWebSocket({ url, autoConnect = true, reconnectInterval = 3000, maxReconnectAttempts = 5, }) {
    const [state, setState] = useState({
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
    const wsRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const messageHandlersRef = useRef(new Map());
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
                }
                catch (error) {
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
                }
                else {
                    setState(prev => ({
                        ...prev,
                        error: new Error('Max reconnection attempts reached')
                    }));
                }
            };
        }
        catch (error) {
            console.error('Connection error:', error);
            setState(prev => ({ ...prev, error: error }));
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
    const sendMessage = useCallback((type, payload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
        else {
            console.warn('WebSocket is not connected');
        }
    }, []);
    const updateLayout = useCallback((type, options) => {
        sendMessage('layout', { type, options });
    }, [sendMessage]);
    const updateNode = useCallback((nodeId, data) => {
        sendMessage('update', {
            nodes: [{ id: nodeId, ...data }],
        });
    }, [sendMessage]);
    const selectNodes = useCallback((nodeIds) => {
        sendMessage('select', { nodeIds });
    }, [sendMessage]);
    const expandNode = useCallback((nodeId, expanded) => {
        sendMessage('expand', { nodeId, expanded });
    }, [sendMessage]);
    const filterGraph = useCallback((filters) => {
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
//# sourceMappingURL=useGraphWebSocket.js.map