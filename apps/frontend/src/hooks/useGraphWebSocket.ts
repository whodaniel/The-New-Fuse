export {}
exports.useGraphWebSocket = useGraphWebSocket;
import react_1 from 'react';
function useGraphWebSocket({ url, autoConnect = true, reconnectInterval = 3000, maxReconnectAttempts = 5, }): any {
    var _a;
    const [state, setState] = (0, react_1.useState)({
        data: { nodes: [], edges: [] },
        config: {
            layout: { type: 'dagre' },
            fitView: true,
            nodesDraggable: true,
        },
        selectedNodes: [],
        loading: true,
        error: null,
    });
    const wsRef = (0, react_1.useRef)(null);
    const reconnectAttemptsRef = (0, react_1.useRef)(0);
    const messageHandlersRef = (0, react_1.useRef)(new Map());
    const connect = (0, react_1.useCallback)(() => {
        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;
            ws.onopen = () => {
                
                setState(prev => (Object.assign(Object.assign({}, prev), { loading: false, error: null })));
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
                setState(prev => (Object.assign(Object.assign({}, prev), { error: error })));
            };
            ws.onclose = () => {
                
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    setTimeout(() => {
                        reconnectAttemptsRef.current += 1;
                        connect();
                    }, reconnectInterval);
                }
                else {
                    setState(prev => (Object.assign(Object.assign({}, prev), { error: new Error('Max reconnection attempts reached') })));
                }
            };
        }
        catch (error) {
            console.error('Connection error:', error);
            setState(prev => (Object.assign(Object.assign({}, prev), { error: error })));
        }
    }, [url, reconnectInterval, maxReconnectAttempts]);
    (0, react_1.useEffect)(() => {
        messageHandlersRef.current.set('update', (payload) => {
            setState(prev => (Object.assign(Object.assign({}, prev), { data: payload })));
        });
        messageHandlersRef.current.set('select', (payload) => {
            setState(prev => (Object.assign(Object.assign({}, prev), { selectedNodes: payload.nodeIds })));
        });
        messageHandlersRef.current.set('error', (payload) => {
            setState(prev => (Object.assign(Object.assign({}, prev), { error: new Error(payload) })));
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
    const sendMessage = (0, react_1.useCallback)((type, payload) => {
        var _a;
        if (((_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
        else {
            console.warn('WebSocket is not connected');
        }
    }, []);
    const updateLayout = (0, react_1.useCallback)((type, options) => {
        sendMessage('layout', { type, options });
    }, [sendMessage]);
    const updateNode = (0, react_1.useCallback)((nodeId, data) => {
        sendMessage('update', {
            nodes: [Object.assign({ id: nodeId }, data)],
        });
    }, [sendMessage]);
    const selectNodes = (0, react_1.useCallback)((nodeIds) => {
        sendMessage('select', { nodeIds });
    }, [sendMessage]);
    const expandNode = (0, react_1.useCallback)((nodeId, expanded) => {
        sendMessage('expand', { nodeId, expanded });
    }, [sendMessage]);
    const filterGraph = (0, react_1.useCallback)((filters) => {
        sendMessage('filter', filters);
    }, [sendMessage]);
    return Object.assign(Object.assign({}, state), { connect,
        sendMessage,
        updateLayout,
        updateNode,
        selectNodes,
        expandNode,
        filterGraph, isConnected: ((_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN });
}
export {};
//# sourceMappingURL=useGraphWebSocket.js.map