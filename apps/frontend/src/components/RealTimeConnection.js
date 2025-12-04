import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
export function RealTimeConnection(_a) {
    var children = _a.children, onConnectionChange = _a.onConnectionChange;
    var _b = useState(false), isConnected = _b[0], setIsConnected = _b[1];
    var _c = useState(false), hasError = _c[0], setHasError = _c[1];
    var _d = useState(0), reconnectAttempt = _d[0], setReconnectAttempt = _d[1];
    var _e = useState('unknown'), connectionQuality = _e[0], setConnectionQuality = _e[1];
    var toast = useToast().toast;
    var _f = useWebSocket({
        onConnected: function () {
            setIsConnected(true);
            setHasError(false);
            setReconnectAttempt(0);
            setConnectionQuality('good');
            onConnectionChange === null || onConnectionChange === void 0 ? void 0 : onConnectionChange(true);
            toast({
                title: 'Connected',
                description: 'Real-time connection established',
                variant: 'success'
            });
        },
        onDisconnected: function () {
            setIsConnected(false);
            setConnectionQuality('unknown');
            onConnectionChange === null || onConnectionChange === void 0 ? void 0 : onConnectionChange(false);
            toast({
                title: 'Disconnected',
                description: 'Real-time connection lost',
                variant: 'warning'
            });
        },
        onError: function (error) {
            setHasError(true);
            setConnectionQuality('poor');
            toast({
                title: 'Connection Error',
                description: error.message,
                variant: 'destructive'
            });
        },
        onReconnectAttempt: function (attempt) {
            setReconnectAttempt(attempt);
            toast({
                title: 'Reconnecting',
                description: "Attempting to reconnect (".concat(attempt, "/5)"),
                variant: 'warning'
            });
        },
        onMaxReconnectAttempts: function () {
            setHasError(true);
            toast({
                title: 'Connection Failed',
                description: 'Maximum reconnection attempts reached',
                variant: 'destructive'
            });
        },
        autoReconnect: true
    }), subscribe = _f.subscribe, send = _f.send;
    useEffect(function () {
        var unsubscribe = subscribe('session_error', function () {
            toast({
                title: 'Session Expired',
                description: 'Please log in again to continue',
                variant: 'destructive'
            });
        });
        return function () {
            unsubscribe();
        };
    }, [subscribe, toast]);
    // Monitor connection quality
    useEffect(function () {
        if (!isConnected)
            return;
        var pingInterval = setInterval(function () {
            var start = Date.now();
            send('ping').then(function () {
                var latency = Date.now() - start;
                setConnectionQuality(latency < 200 ? 'good' : 'poor');
            }).catch(function () {
                setConnectionQuality('poor');
            });
        }, 30000);
        return function () { return clearInterval(pingInterval); };
    }, [isConnected, send]);
    return (_jsxs(_Fragment, { children: [hasError && (_jsxs(Alert, { variant: "destructive", className: "mb-4", children: [_jsx("p", { children: "Connection error occurred. Please check your internet connection." }), _jsx(Button, { variant: "outline", size: "sm", onClick: function () { return window.location.reload(); }, className: "mt-2", children: "Reload Page" })] })), !isConnected && !hasError && reconnectAttempt > 0 && (_jsx(Alert, { variant: "warning", className: "mb-4", children: _jsxs("p", { children: ["Reconnecting to services... Attempt ", reconnectAttempt, "/5"] }) })), !isConnected && !hasError && reconnectAttempt === 0 && (_jsx(Alert, { variant: "warning", className: "mb-4", children: _jsx("p", { children: "Connecting to real-time services..." }) })), isConnected && connectionQuality === 'poor' && (_jsx(Alert, { variant: "warning", className: "mb-4", children: _jsx("p", { children: "Poor connection quality detected. Some features may be delayed." }) })), children] }));
}
