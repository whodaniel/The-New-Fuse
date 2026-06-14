"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useA2A = useA2A;
const react_1 = require("react");
function useA2A(config) {
    const [connectionState, setConnectionState] = (0, react_1.useState)({
        connected: false,
        connecting: false,
        authenticated: false,
        error: null,
        reconnectAttempts: 0
    });
    const [agents, setAgents] = (0, react_1.useState)([]);
    const [messages, setMessages] = (0, react_1.useState)([]);
    const wsRef = (0, react_1.useRef)(null);
    const connect = (0, react_1.useCallback)(async () => {
        if (connectionState.connecting || connectionState.connected) {
            return;
        }
        setConnectionState(prev => ({ ...prev, connecting: true, error: null }));
        try {
            const ws = new WebSocket(config.url);
            wsRef.current = ws;
            ws.onopen = () => {
                setConnectionState(prev => ({
                    ...prev,
                    connected: true,
                    connecting: false,
                    authenticated: true,
                    reconnectAttempts: 0
                }));
            };
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'message') {
                        setMessages(prev => [...prev, data.payload]);
                    }
                    else if (data.type === 'agents') {
                        setAgents(data.payload);
                    }
                }
                catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            ws.onclose = () => {
                setConnectionState(prev => ({
                    ...prev,
                    connected: false,
                    connecting: false,
                    authenticated: false
                }));
                wsRef.current = null;
            };
            ws.onerror = (error) => {
                setConnectionState(prev => ({
                    ...prev,
                    error: 'WebSocket connection failed',
                    connecting: false
                }));
            };
        }
        catch (error) {
            setConnectionState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Connection failed',
                connecting: false
            }));
        }
    }, [config.url, connectionState.connecting, connectionState.connected]);
    const disconnect = (0, react_1.useCallback)(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setConnectionState(prev => ({
            ...prev,
            connected: false,
            connecting: false,
            authenticated: false
        }));
    }, []);
    const registerAgent = (0, react_1.useCallback)(async (registration) => {
        if (!wsRef.current || !connectionState.connected) {
            throw new Error('Not connected to A2A service');
        }
        wsRef.current.send(JSON.stringify({
            type: 'register',
            payload: registration
        }));
    }, [connectionState.connected]);
    const sendMessage = (0, react_1.useCallback)(async (message) => {
        if (!wsRef.current || !connectionState.connected) {
            throw new Error('Not connected to A2A service');
        }
        wsRef.current.send(JSON.stringify({
            type: 'message',
            payload: message
        }));
    }, [connectionState.connected]);
    (0, react_1.useEffect)(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);
    return {
        connectionState,
        connect,
        disconnect,
        registerAgent,
        sendMessage,
        agents,
        messages
    };
}
//# sourceMappingURL=useA2A.js.map