import { jsx as _jsx } from "react/jsx-runtime";
exports.WizardWebSocketProvider = WizardWebSocketProvider;
exports.useWizardWebSocket = useWizardWebSocket;
exports.useAgentUpdates = useAgentUpdates;
exports.useSystemMetrics = useSystemMetrics;
exports.useKnowledgeUpdates = useKnowledgeUpdates;
import react_1 from 'react';
import socket_io_client_1 from 'socket.io-client';
import WizardProvider_1 from './WizardProvider';
var WizardWebSocketContext = (0, react_1.createContext)(null);
function WizardWebSocketProvider(_b) {
    var children = _b.children, _c = _b.url, url = _c === void 0 ? process.env.WEBSOCKET_URL || 'ws://localhost:5000' : _c;
    var _d = (0, WizardProvider_1.useWizard)(), state = _d.state, updateAgents = _d.updateAgents, addConversation = _d.addConversation;
    var _e = (0, react_1.useState)(false), connected = _e[0], setConnected = _e[1];
    var _f = (0, react_1.useState)(null), lastMessage = _f[0], setLastMessage = _f[1];
    var socketRef = (0, react_1.useRef)(null);
    var eventHandlersRef = (0, react_1.useRef)(new Map());
    (0, react_1.useEffect)(function () {
        socketRef.current = (0, socket_io_client_1.io)(url, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        setupSocketHandlers();
        return function () {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [url]);
    var setupSocketHandlers = function () {
        if (!socketRef.current)
            return;
        socketRef.current.on('connect', function () {
            var _a;
            setConnected(true);
            if (state.session) {
                (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.emit('init_session', {
                    sessionId: state.session.project_path
                });
            }
        });
        socketRef.current.on('disconnect', function () {
            setConnected(false);
        });
        socketRef.current.on('agent_update', function (data) {
            updateAgents(data.agents);
        });
        socketRef.current.on('knowledge_update', function (data) {
            setLastMessage(data);
            notifyEventHandlers('knowledge_update', data);
        });
        socketRef.current.on('system_metrics', function (data) {
            setLastMessage(data);
            notifyEventHandlers('system_metrics', data);
        });
        socketRef.current.on('error', function (error) {
            console.error('WebSocket error:', error);
            notifyEventHandlers('error', error);
        });
        socketRef.current.on('conversation_update', function (data) {
            addConversation(data);
            notifyEventHandlers('conversation_update', data);
        });
    };
    var sendMessage = function (event, data) {
        var _a;
        if ((_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.connected) {
            socketRef.current.emit(event, data);
        }
        else {
            console.warn('WebSocket not connected. Message not sent:', { event: event, data: data });
        }
    };
    var subscribeToEvent = function (event, callback) {
        var _a;
        if (!eventHandlersRef.current.has(event)) {
            eventHandlersRef.current.set(event, new Set());
        }
        (_a = eventHandlersRef.current.get(event)) === null || _a === void 0 ? void 0 : _a.add(callback);
    };
    var unsubscribeFromEvent = function (event, callback) {
        var _a;
        if (callback) {
            (_a = eventHandlersRef.current.get(event)) === null || _a === void 0 ? void 0 : _a.delete(callback);
        }
        else {
            eventHandlersRef.current.delete(event);
        }
    };
    var notifyEventHandlers = function (event, data) {
        var _a;
        (_a = eventHandlersRef.current.get(event)) === null || _a === void 0 ? void 0 : _a.forEach(function (handler) { return handler(data); });
    };
    return (_jsx(WizardWebSocketContext.Provider, { value: {
            connected: connected,
            lastMessage: lastMessage,
            sendMessage: sendMessage,
            subscribeToEvent: subscribeToEvent,
            unsubscribeFromEvent: unsubscribeFromEvent
        }, children: children }));
}
function useWizardWebSocket() {
    var context = (0, react_1.useContext)(WizardWebSocketContext);
    if (!context) {
        throw new Error('useWizardWebSocket must be used within a WizardWebSocketProvider');
    }
    return context;
}
function useAgentUpdates() {
    var _b = useWizardWebSocket(), subscribeToEvent = _b.subscribeToEvent, unsubscribeFromEvent = _b.unsubscribeFromEvent;
    var _c = (0, react_1.useState)(new Map()), agents = _c[0], setAgents = _c[1];
    (0, react_1.useEffect)(function () {
        var handleAgentUpdate = function (data) {
            setAgents(data.agents);
        };
        subscribeToEvent('agent_update', handleAgentUpdate);
        return function () { return unsubscribeFromEvent('agent_update', handleAgentUpdate); };
    }, [subscribeToEvent, unsubscribeFromEvent]);
    return agents;
}
function useSystemMetrics() {
    var _b = useWizardWebSocket(), subscribeToEvent = _b.subscribeToEvent, unsubscribeFromEvent = _b.unsubscribeFromEvent;
    var _c = (0, react_1.useState)(null), metrics = _c[0], setMetrics = _c[1];
    (0, react_1.useEffect)(function () {
        var handleMetricsUpdate = function (data) {
            setMetrics(data);
        };
        subscribeToEvent('system_metrics', handleMetricsUpdate);
        return function () { return unsubscribeFromEvent('system_metrics', handleMetricsUpdate); };
    }, [subscribeToEvent, unsubscribeFromEvent]);
    return metrics;
}
function useKnowledgeUpdates() {
    var _b = useWizardWebSocket(), subscribeToEvent = _b.subscribeToEvent, unsubscribeFromEvent = _b.unsubscribeFromEvent;
    var _c = (0, react_1.useState)(null), knowledge = _c[0], setKnowledge = _c[1];
    (0, react_1.useEffect)(function () {
        var handleKnowledgeUpdate = function (data) {
            setKnowledge(data);
        };
        subscribeToEvent('knowledge_update', handleKnowledgeUpdate);
        return function () { return unsubscribeFromEvent('knowledge_update', handleKnowledgeUpdate); };
    }, [subscribeToEvent, unsubscribeFromEvent]);
    return knowledge;
}
