export {}
exports.WizardWebSocketProvider = WizardWebSocketProvider;
exports.useWizardWebSocket = useWizardWebSocket;
exports.useAgentUpdates = useAgentUpdates;
exports.useSystemMetrics = useSystemMetrics;
exports.useKnowledgeUpdates = useKnowledgeUpdates;
import react_1 from 'react';
import socket_io_client_1 from 'socket.io-client';
import WizardProvider_1 from './WizardProvider.js';
const WizardWebSocketContext = (0, react_1.createContext)(null);
function WizardWebSocketProvider({ children, url = process.env.WEBSOCKET_URL || 'ws://localhost:5000' }): any {
    const { state, updateAgents, addConversation } = (0, WizardProvider_1.useWizard)();
    const [connected, setConnected] = (0, react_1.useState)(false);
    const [lastMessage, setLastMessage] = (0, react_1.useState)(null);
    const socketRef = (0, react_1.useRef)(null);
    const eventHandlersRef = (0, react_1.useRef)(new Map());
    (0, react_1.useEffect)(() => {
        socketRef.current = (0, socket_io_client_1.io)(url, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        setupSocketHandlers();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [url]);
    const setupSocketHandlers = (): any => {
        if (!socketRef.current)
            return;
        socketRef.current.on('connect', () => {
            var _a;
            
            setConnected(true);
            if (state.session) {
                (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.emit('init_session', {
                    sessionId: state.session.project_path
                });
            }
        });
        socketRef.current.on('disconnect', () => {
            
            setConnected(false);
        });
        socketRef.current.on('agent_update', (data) => {
            updateAgents(data.agents);
        });
        socketRef.current.on('knowledge_update', (data) => {
            setLastMessage(data);
            notifyEventHandlers('knowledge_update', data);
        });
        socketRef.current.on('system_metrics', (data) => {
            setLastMessage(data);
            notifyEventHandlers('system_metrics', data);
        });
        socketRef.current.on('error', (error) => {
            console.error('WebSocket error:', error);
            notifyEventHandlers('error', error);
        });
        socketRef.current.on('conversation_update', (data) => {
            addConversation(data);
            notifyEventHandlers('conversation_update', data);
        });
    };
    const sendMessage = (event, data): any => {
        var _a;
        if ((_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.connected) {
            socketRef.current.emit(event, data);
        }
        else {
            console.warn('WebSocket not connected. Message not sent:', { event, data });
        }
    };
    const subscribeToEvent = (event, callback): any => {
        var _a;
        if (!eventHandlersRef.current.has(event)) {
            eventHandlersRef.current.set(event, new Set());
        }
        (_a = eventHandlersRef.current.get(event)) === null || _a === void 0 ? void 0 : _a.add(callback);
    };
    const unsubscribeFromEvent = (event, callback): any => {
        var _a;
        if (callback) {
            (_a = eventHandlersRef.current.get(event)) === null || _a === void 0 ? void 0 : _a.delete(callback);
        }
        else {
            eventHandlersRef.current.delete(event);
        }
    };
    const notifyEventHandlers = (event, data): any => {
        var _a;
        (_a = eventHandlersRef.current.get(event)) === null || _a === void 0 ? void 0 : _a.forEach(handler => handler(data));
    };
    return (<WizardWebSocketContext.Provider value={{
            connected,
            lastMessage,
            sendMessage,
            subscribeToEvent,
            unsubscribeFromEvent
        }}>
            {children}
        </WizardWebSocketContext.Provider>);
}
function useWizardWebSocket(): any {
    const context = (0, react_1.useContext)(WizardWebSocketContext);
    if (!context) {
        throw new Error('useWizardWebSocket must be used within a WizardWebSocketProvider');
    }
    return context;
}
function useAgentUpdates(): any {
    const { subscribeToEvent, unsubscribeFromEvent } = useWizardWebSocket();
    const [agents, setAgents] = (0, react_1.useState)(new Map());
    (0, react_1.useEffect)(() => {
        const handleAgentUpdate = (data): any => {
            setAgents(data.agents);
        };
        subscribeToEvent('agent_update', handleAgentUpdate);
        return () => unsubscribeFromEvent('agent_update', handleAgentUpdate);
    }, [subscribeToEvent, unsubscribeFromEvent]);
    return agents;
}
function useSystemMetrics(): any {
    const { subscribeToEvent, unsubscribeFromEvent } = useWizardWebSocket();
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const handleMetricsUpdate = (data): any => {
            setMetrics(data);
        };
        subscribeToEvent('system_metrics', handleMetricsUpdate);
        return () => unsubscribeFromEvent('system_metrics', handleMetricsUpdate);
    }, [subscribeToEvent, unsubscribeFromEvent]);
    return metrics;
}
function useKnowledgeUpdates(): any {
    const { subscribeToEvent, unsubscribeFromEvent } = useWizardWebSocket();
    const [knowledge, setKnowledge] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const handleKnowledgeUpdate = (data): any => {
            setKnowledge(data);
        };
        subscribeToEvent('knowledge_update', handleKnowledgeUpdate);
        return () => unsubscribeFromEvent('knowledge_update', handleKnowledgeUpdate);
    }, [subscribeToEvent, unsubscribeFromEvent]);
    return knowledge;
}
export {};
//# sourceMappingURL=WizardWebSocket.js.map