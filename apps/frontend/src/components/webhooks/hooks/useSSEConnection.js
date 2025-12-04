var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useEffect, useRef, useState, useCallback } from 'react';
export function useSSEConnection(options) {
    if (options === void 0) { options = {}; }
    var _a = options.eventTypes, eventTypes = _a === void 0 ? [] : _a, _b = options.filters, filters = _b === void 0 ? {} : _b, _c = options.autoReconnect, autoReconnect = _c === void 0 ? true : _c, _d = options.reconnectInterval, reconnectInterval = _d === void 0 ? 5000 : _d, _e = options.maxReconnectAttempts, maxReconnectAttempts = _e === void 0 ? 10 : _e;
    var _f = useState({
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        lastEventTime: null,
        error: null,
    }), connectionState = _f[0], setConnectionState = _f[1];
    var _g = useState([]), events = _g[0], setEvents = _g[1];
    var _h = useState(null), latestEvent = _h[0], setLatestEvent = _h[1];
    var eventSourceRef = useRef(null);
    var reconnectTimeoutRef = useRef(null);
    var eventListenersRef = useRef(new Map());
    var buildSSEUrl = useCallback(function () {
        var baseUrl = "".concat(process.env.REACT_APP_API_URL || 'http://localhost:3001', "/webhooks/events/stream");
        var params = new URLSearchParams();
        if (eventTypes.length > 0) {
            params.append('event_types', eventTypes.join(','));
        }
        if (Object.keys(filters).length > 0) {
            params.append('filters', JSON.stringify(filters));
        }
        return "".concat(baseUrl, "?").concat(params.toString());
    }, [eventTypes, filters]);
    var connect = useCallback(function () {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        var token = localStorage.getItem('authToken');
        if (!token) {
            setConnectionState(function (prev) { return (__assign(__assign({}, prev), { error: 'No authentication token available', isConnected: false })); });
            return;
        }
        try {
            var url = buildSSEUrl();
            var eventSource = new EventSource(url, {
                withCredentials: true,
            });
            // Set authorization header (note: EventSource doesn't support custom headers directly)
            // You may need to pass the token as a query parameter instead
            eventSource.onopen = function () {
                setConnectionState(function (prev) { return (__assign(__assign({}, prev), { isConnected: true, isReconnecting: false, reconnectAttempts: 0, error: null })); });
            };
            eventSource.onmessage = function (event) {
                try {
                    var data = JSON.parse(event.data);
                    var sseEvent_1 = {
                        type: data.type || 'message',
                        data: data,
                        timestamp: new Date(),
                    };
                    setEvents(function (prev) { return __spreadArray(__spreadArray([], prev.slice(-99), true), [sseEvent_1], false); }); // Keep last 100 events
                    setLatestEvent(sseEvent_1);
                    setConnectionState(function (prev) { return (__assign(__assign({}, prev), { lastEventTime: new Date() })); });
                    // Call any registered event listeners
                    var listener = eventListenersRef.current.get(sseEvent_1.type);
                    if (listener) {
                        listener(sseEvent_1);
                    }
                }
                catch (error) {
                    console.error('Failed to parse SSE event:', error);
                }
            };
            eventSource.onerror = function (error) {
                console.error('SSE connection error:', error);
                setConnectionState(function (prev) { return (__assign(__assign({}, prev), { isConnected: false, error: 'Connection error occurred' })); });
                if (autoReconnect && prev.reconnectAttempts < maxReconnectAttempts) {
                    setConnectionState(function (prev) { return (__assign(__assign({}, prev), { isReconnecting: true, reconnectAttempts: prev.reconnectAttempts + 1 })); });
                    reconnectTimeoutRef.current = setTimeout(function () {
                        connect();
                    }, reconnectInterval);
                }
            };
            eventSourceRef.current = eventSource;
        }
        catch (error) {
            setConnectionState(function (prev) { return (__assign(__assign({}, prev), { error: "Failed to establish connection: ".concat(error), isConnected: false })); });
        }
    }, [buildSSEUrl, autoReconnect, maxReconnectAttempts, reconnectInterval]);
    var disconnect = useCallback(function () {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        setConnectionState(function (prev) { return (__assign(__assign({}, prev), { isConnected: false, isReconnecting: false })); });
    }, []);
    var addEventListener = useCallback(function (eventType, listener) {
        eventListenersRef.current.set(eventType, listener);
        return function () {
            eventListenersRef.current.delete(eventType);
        };
    }, []);
    var clearEvents = useCallback(function () {
        setEvents([]);
        setLatestEvent(null);
    }, []);
    // Auto-connect on mount and when dependencies change
    useEffect(function () {
        connect();
        return disconnect;
    }, [connect, disconnect]);
    // Cleanup on unmount
    useEffect(function () {
        return function () {
            disconnect();
        };
    }, [disconnect]);
    return {
        connectionState: connectionState,
        events: events,
        latestEvent: latestEvent,
        connect: connect,
        disconnect: disconnect,
        addEventListener: addEventListener,
        clearEvents: clearEvents,
    };
}
