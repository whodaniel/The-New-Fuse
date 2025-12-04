exports.useGraphWebSocket = useGraphWebSocket;
import react_1 from 'react';
function useGraphWebSocket(_b) {
    var url = _b.url, _c = _b.autoConnect, autoConnect = _c === void 0 ? true : _c, _d = _b.reconnectInterval, reconnectInterval = _d === void 0 ? 3000 : _d, _e = _b.maxReconnectAttempts, maxReconnectAttempts = _e === void 0 ? 5 : _e;
    var _a;
    var _f = (0, react_1.useState)({
        data: { nodes: [], edges: [] },
        config: {
            layout: { type: 'dagre' },
            fitView: true,
            nodesDraggable: true,
        },
        selectedNodes: [],
        loading: true,
        error: null,
    }), state = _f[0], setState = _f[1];
    var wsRef = (0, react_1.useRef)(null);
    var reconnectAttemptsRef = (0, react_1.useRef)(0);
    var messageHandlersRef = (0, react_1.useRef)(new Map());
    var connect = (0, react_1.useCallback)(function () {
        try {
            var ws = new WebSocket(url);
            wsRef.current = ws;
            ws.onopen = function () {
                setState(function (prev) { return (Object.assign(Object.assign({}, prev), { loading: false, error: null })); });
                reconnectAttemptsRef.current = 0;
            };
            ws.onmessage = function (event) {
                try {
                    var message = JSON.parse(event.data);
                    var handler = messageHandlersRef.current.get(message.type);
                    if (handler) {
                        handler(message.payload);
                    }
                }
                catch (error) {
                    console.error('Error processing message:', error);
                }
            };
            ws.onerror = function (error) {
                console.error('WebSocket error:', error);
                setState(function (prev) { return (Object.assign(Object.assign({}, prev), { error: error })); });
            };
            ws.onclose = function () {
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    setTimeout(function () {
                        reconnectAttemptsRef.current += 1;
                        connect();
                    }, reconnectInterval);
                }
                else {
                    setState(function (prev) { return (Object.assign(Object.assign({}, prev), { error: new Error('Max reconnection attempts reached') })); });
                }
            };
        }
        catch (error) {
            console.error('Connection error:', error);
            setState(function (prev) { return (Object.assign(Object.assign({}, prev), { error: error })); });
        }
    }, [url, reconnectInterval, maxReconnectAttempts]);
    (0, react_1.useEffect)(function () {
        messageHandlersRef.current.set('update', function (payload) {
            setState(function (prev) { return (Object.assign(Object.assign({}, prev), { data: payload })); });
        });
        messageHandlersRef.current.set('select', function (payload) {
            setState(function (prev) { return (Object.assign(Object.assign({}, prev), { selectedNodes: payload.nodeIds })); });
        });
        messageHandlersRef.current.set('error', function (payload) {
            setState(function (prev) { return (Object.assign(Object.assign({}, prev), { error: new Error(payload) })); });
        });
        if (autoConnect) {
            connect();
        }
        return function () {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect, autoConnect]);
    var sendMessage = (0, react_1.useCallback)(function (type, payload) {
        var _a;
        if (((_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: type, payload: payload }));
        }
        else {
            console.warn('WebSocket is not connected');
        }
    }, []);
    var updateLayout = (0, react_1.useCallback)(function (type, options) {
        sendMessage('layout', { type: type, options: options });
    }, [sendMessage]);
    var updateNode = (0, react_1.useCallback)(function (nodeId, data) {
        sendMessage('update', {
            nodes: [Object.assign({ id: nodeId }, data)],
        });
    }, [sendMessage]);
    var selectNodes = (0, react_1.useCallback)(function (nodeIds) {
        sendMessage('select', { nodeIds: nodeIds });
    }, [sendMessage]);
    var expandNode = (0, react_1.useCallback)(function (nodeId, expanded) {
        sendMessage('expand', { nodeId: nodeId, expanded: expanded });
    }, [sendMessage]);
    var filterGraph = (0, react_1.useCallback)(function (filters) {
        sendMessage('filter', filters);
    }, [sendMessage]);
    return Object.assign(Object.assign({}, state), { connect: connect, sendMessage: sendMessage, updateLayout: updateLayout, updateNode: updateNode, selectNodes: selectNodes, expandNode: expandNode, filterGraph: filterGraph, isConnected: ((_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN });
}
