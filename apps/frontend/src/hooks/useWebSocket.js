import { useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/websocket.service';
import { useSession } from '@your-org/security/react';
export function useWebSocket(options) {
    if (options === void 0) { options = {}; }
    var session = useSession().session;
    var optionsRef = useRef(options);
    optionsRef.current = options;
    var subscribe = useCallback(function (event, handler) {
        webSocketService.on(event, handler);
        return function () {
            webSocketService.off(event, handler);
        };
    }, []);
    var send = useCallback(function (type, payload) {
        var _a, _b;
        try {
            webSocketService.send(type, payload);
            return Promise.resolve();
        }
        catch (error) {
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
            return Promise.reject(error);
        }
    }, []);
    useEffect(function () {
        if (!session)
            return;
        var handleConnect = function () {
            var _a, _b;
            (_b = (_a = optionsRef.current).onConnected) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        var handleDisconnect = function () {
            var _a, _b;
            (_b = (_a = optionsRef.current).onDisconnected) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        var handleError = function (error) {
            var _a, _b;
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
        };
        var handleReconnectAttempt = function (attempt) {
            var _a, _b;
            (_b = (_a = optionsRef.current).onReconnectAttempt) === null || _b === void 0 ? void 0 : _b.call(_a, attempt);
        };
        var handleMaxReconnectAttempts = function () {
            var _a, _b;
            (_b = (_a = optionsRef.current).onMaxReconnectAttempts) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        webSocketService.on('connected', handleConnect);
        webSocketService.on('disconnected', handleDisconnect);
        webSocketService.on('error', handleError);
        webSocketService.on('reconnect_attempt', handleReconnectAttempt);
        webSocketService.on('max_reconnect_attempts', handleMaxReconnectAttempts);
        webSocketService.connect().catch(handleError);
        return function () {
            webSocketService.off('connected', handleConnect);
            webSocketService.off('disconnected', handleDisconnect);
            webSocketService.off('error', handleError);
            webSocketService.off('reconnect_attempt', handleReconnectAttempt);
            webSocketService.off('max_reconnect_attempts', handleMaxReconnectAttempts);
            if (!optionsRef.current.autoReconnect) {
                webSocketService.disconnect();
            }
        };
    }, [session]);
    return {
        subscribe: subscribe,
        send: send,
        disconnect: webSocketService.disconnect.bind(webSocketService)
    };
}
