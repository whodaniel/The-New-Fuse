import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
/**
 * Hook for real-time agent updates via WebSockets
 */
export function useAgentRealtime(options) {
    if (options === void 0) { options = {}; }
    var _a = options.enabled, enabled = _a === void 0 ? true : _a, _b = options.url, url = _b === void 0 ? process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001' : _b;
    var _c = useState(false), isConnected = _c[0], setIsConnected = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var socketRef = useRef(null);
    // Initialize WebSocket connection
    useEffect(function () {
        if (!enabled)
            return;
        var socket = io(url, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;
        // Handle connection events
        socket.on('connect', function () {
            setIsConnected(true);
            setError(null);
            console.log('Connected to agent real-time updates');
        });
        socket.on('disconnect', function () {
            setIsConnected(false);
            console.log('Disconnected from agent real-time updates');
        });
        socket.on('connect_error', function (err) {
            setError(err);
            console.error('WebSocket connection error:', err);
        });
        // Clean up on unmount
        return function () {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [enabled, url]);
    // Subscribe to agent events
    var subscribeToAgentEvents = useCallback(function (onCreated, onUpdated, onDeleted) {
        if (!socketRef.current)
            return function () { };
        var handleCreated = function (data) { return onCreated === null || onCreated === void 0 ? void 0 : onCreated(data.agent); };
        var handleUpdated = function (data) { return onUpdated === null || onUpdated === void 0 ? void 0 : onUpdated(data.agent); };
        var handleDeleted = function (data) { return onDeleted === null || onDeleted === void 0 ? void 0 : onDeleted(data.agent); };
        var eventHandlers = {
            'agent:created': handleCreated,
            'agent:updated': handleUpdated,
            'agent:deleted': handleDeleted
        };
        // Register event handlers
        Object.entries(eventHandlers).forEach(function (_a) {
            var _b;
            var event = _a[0], handler = _a[1];
            (_b = socketRef.current) === null || _b === void 0 ? void 0 : _b.on(event, handler);
        });
        // Return cleanup function
        return function () {
            if (!socketRef.current)
                return;
            Object.entries(eventHandlers).forEach(function (_a) {
                var _b;
                var event = _a[0], handler = _a[1];
                (_b = socketRef.current) === null || _b === void 0 ? void 0 : _b.off(event, handler);
            });
        };
    }, []);
    return {
        isConnected: isConnected,
        error: error,
        subscribeToAgentEvents: subscribeToAgentEvents,
        socket: socketRef.current,
    };
}
