import { A2AError, A2AMessageType, A2APriority, } from '@the-new-fuse/a2a-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
export function useA2A(config) {
    const [connectionState, setConnectionState] = useState({
        connected: false,
        authenticated: false,
        connecting: false,
        error: null,
        lastHeartbeat: null,
    });
    const [messages, setMessages] = useState([]);
    const [connectedAgents, setConnectedAgents] = useState([]);
    const socketRef = useRef(null);
    const eventListenersRef = useRef(new Map());
    const pendingRequestsRef = useRef(new Map());
    // Connection management
    const connect = useCallback(async () => {
        if (socketRef.current?.connected) {
            return;
        }
        setConnectionState((prev) => ({ ...prev, connecting: true, error: null }));
        try {
            const socket = io(`${config.url}/a2a`, {
                transports: ['websocket', 'polling'],
                autoConnect: false,
            });
            socketRef.current = socket;
            // Set up socket event listeners
            socket.on('connect', () => {
                setConnectionState((prev) => ({ ...prev, connected: true, connecting: false }));
                // Authenticate immediately after connection
                socket.emit('authenticate', {
                    agentId: config.agentId,
                    token: config.token,
                    signature: config.signature,
                });
            });
            socket.on('disconnect', () => {
                setConnectionState((prev) => ({
                    ...prev,
                    connected: false,
                    authenticated: false,
                    connecting: false,
                }));
                setConnectedAgents([]);
            });
            socket.on('authentication:success', () => {
                setConnectionState((prev) => ({ ...prev, authenticated: true }));
            });
            socket.on('authentication:failed', (data) => {
                setConnectionState((prev) => ({
                    ...prev,
                    error: data.message || 'Authentication failed',
                    connecting: false,
                }));
                socket.disconnect();
            });
            socket.on('message:received', (message) => {
                setMessages((prev) => [...prev, message]);
                // Handle responses to pending requests
                if (message.type === A2AMessageType.DATA_RESPONSE && message.metadata?.requestId) {
                    const pending = pendingRequestsRef.current.get(message.metadata.requestId);
                    if (pending) {
                        clearTimeout(pending.timeout);
                        pendingRequestsRef.current.delete(message.metadata.requestId);
                        pending.resolve(message);
                    }
                }
                // Emit to listeners
                const listeners = eventListenersRef.current.get('message') || new Set();
                listeners.forEach((callback) => callback(message));
            });
            socket.on('agent:registered', (agent) => {
                const listeners = eventListenersRef.current.get('agentRegistered') || new Set();
                listeners.forEach((callback) => callback(agent));
            });
            socket.on('agent:disconnected', (data) => {
                setConnectedAgents((prev) => prev.filter((id) => id !== data.agentId));
                const listeners = eventListenersRef.current.get('agentDisconnected') || new Set();
                listeners.forEach((callback) => callback(data.agentId));
            });
            socket.on('heartbeat:received', (heartbeat) => {
                setConnectionState((prev) => ({ ...prev, lastHeartbeat: new Date() }));
            });
            socket.on('error', (error) => {
                const a2aError = new A2AError(error.message || 'Unknown error', error.code || 'UNKNOWN');
                setConnectionState((prev) => ({ ...prev, error: a2aError.message }));
                const listeners = eventListenersRef.current.get('error') || new Set();
                listeners.forEach((callback) => callback(a2aError));
            });
            // Connect the socket
            socket.connect();
        }
        catch (error) {
            setConnectionState((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Connection failed',
                connecting: false,
            }));
        }
    }, [config]);
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        // Clear pending requests
        pendingRequestsRef.current.forEach(({ reject, timeout }) => {
            clearTimeout(timeout);
            reject(new Error('Connection closed'));
        });
        pendingRequestsRef.current.clear();
        setConnectionState({
            connected: false,
            authenticated: false,
            connecting: false,
            error: null,
            lastHeartbeat: null,
        });
        setMessages([]);
        setConnectedAgents([]);
    }, []);
    // Messaging functions
    const sendMessage = useCallback(async (messageData) => {
        if (!socketRef.current?.connected || !connectionState.authenticated) {
            throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
        }
        const message = {
            ...messageData,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            fromAgent: config.agentId,
        };
        socketRef.current.emit('send:message', message);
    }, [config.agentId, connectionState.authenticated]);
    const sendRequest = useCallback(async (toAgent, payload, options = {}) => {
        if (!socketRef.current?.connected || !connectionState.authenticated) {
            throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
        }
        const requestId = crypto.randomUUID();
        const timeout = options.timeout || 30000;
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                pendingRequestsRef.current.delete(requestId);
                reject(new A2AError(`Request timeout after ${timeout}ms`, 'TIMEOUT'));
            }, timeout);
            pendingRequestsRef.current.set(requestId, {
                resolve,
                reject,
                timeout: timeoutHandle,
            });
            const message = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                fromAgent: config.agentId,
                toAgent,
                type: A2AMessageType.DATA_REQUEST,
                priority: A2APriority.MEDIUM,
                conversationId: options.conversationId,
                payload,
                metadata: { requestId },
            };
            socketRef.current.emit('send:message', message);
        });
    }, [config.agentId, connectionState.authenticated]);
    const broadcast = useCallback(async (payload, options = {}) => {
        if (!socketRef.current?.connected || !connectionState.authenticated) {
            throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
        }
        socketRef.current.emit('send:broadcast', {
            payload,
            channel: options.channel,
            topic: options.topic,
        });
    }, [connectionState.authenticated]);
    // Conversation management
    const joinConversation = useCallback(async (conversationId) => {
        if (!socketRef.current?.connected || !connectionState.authenticated) {
            throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
        }
        socketRef.current.emit('join:conversation', { conversationId });
    }, [connectionState.authenticated]);
    const leaveConversation = useCallback(async (conversationId) => {
        if (!socketRef.current?.connected || !connectionState.authenticated) {
            throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
        }
        socketRef.current.emit('leave:conversation', { conversationId });
    }, [connectionState.authenticated]);
    // Agent discovery
    const discoverAgents = useCallback(async (criteria) => {
        if (!socketRef.current?.connected || !connectionState.authenticated) {
            throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
        }
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new A2AError('Discovery timeout', 'TIMEOUT'));
            }, 10000);
            socketRef.current.once('agents:discovered', (agents) => {
                clearTimeout(timeout);
                resolve(agents);
            });
            socketRef.current.once('discovery:error', (error) => {
                clearTimeout(timeout);
                reject(new A2AError(error.message, error.code));
            });
            socketRef.current.emit('discover:agents', criteria || {});
        });
    }, [connectionState.authenticated]);
    // Health management
    const sendHeartbeat = useCallback(async (data) => {
        if (!socketRef.current?.connected || !connectionState.authenticated) {
            throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
        }
        socketRef.current.emit('send:heartbeat', data);
    }, [connectionState.authenticated]);
    // Event listener management
    const addEventListener = useCallback((event, callback) => {
        if (!eventListenersRef.current.has(event)) {
            eventListenersRef.current.set(event, new Set());
        }
        eventListenersRef.current.get(event).add(callback);
        return () => {
            eventListenersRef.current.get(event)?.delete(callback);
        };
    }, []);
    const onMessage = useCallback((callback) => {
        return addEventListener('message', callback);
    }, [addEventListener]);
    const onAgentRegistered = useCallback((callback) => {
        return addEventListener('agentRegistered', callback);
    }, [addEventListener]);
    const onAgentDisconnected = useCallback((callback) => {
        return addEventListener('agentDisconnected', callback);
    }, [addEventListener]);
    const onError = useCallback((callback) => {
        return addEventListener('error', callback);
    }, [addEventListener]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);
    return {
        connectionState,
        connect,
        disconnect,
        sendMessage,
        sendRequest,
        broadcast,
        joinConversation,
        leaveConversation,
        discoverAgents,
        sendHeartbeat,
        onMessage,
        onAgentRegistered,
        onAgentDisconnected,
        onError,
        messages,
        connectedAgents,
    };
}
