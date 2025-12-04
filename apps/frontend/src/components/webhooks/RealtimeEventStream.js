var _a, _b;
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import { Button } from '@the-new-fuse/ui-consolidated';
import { Badge } from '@the-new-fuse/ui-consolidated';
import { Input } from '@the-new-fuse/ui-consolidated';
import { Select } from '@the-new-fuse/ui-consolidated';
import { Search, RefreshCw, Download, Pause, Play, AlertCircle, CheckCircle, Clock, DollarSign, Users, ShoppingCart, } from 'lucide-react';
import { BusinessEventType, IntegrationSource, EventPriority } from '@the-new-fuse/types';
import { useSSEConnection } from './hooks/useSSEConnection';
var EVENT_ICONS = (_a = {},
    _a[BusinessEventType.PAYMENT_COMPLETED] = _jsx(DollarSign, { className: "w-4 h-4 text-green-600" }),
    _a[BusinessEventType.PAYMENT_FAILED] = _jsx(AlertCircle, { className: "w-4 h-4 text-red-600" }),
    _a[BusinessEventType.SUBSCRIPTION_CREATED] = _jsx(CheckCircle, { className: "w-4 h-4 text-blue-600" }),
    _a[BusinessEventType.SUBSCRIPTION_CANCELLED] = _jsx(AlertCircle, { className: "w-4 h-4 text-orange-600" }),
    _a[BusinessEventType.CUSTOMER_CREATED] = _jsx(Users, { className: "w-4 h-4 text-purple-600" }),
    _a[BusinessEventType.CUSTOMER_UPDATED] = _jsx(Users, { className: "w-4 h-4 text-blue-600" }),
    _a[BusinessEventType.ORDER_PLACED] = _jsx(ShoppingCart, { className: "w-4 h-4 text-green-600" }),
    _a[BusinessEventType.ORDER_CANCELLED] = _jsx(ShoppingCart, { className: "w-4 h-4 text-red-600" }),
    _a[BusinessEventType.INVENTORY_LOW] = _jsx(AlertCircle, { className: "w-4 h-4 text-yellow-600" }),
    _a[BusinessEventType.LEAD_CREATED] = _jsx(Users, { className: "w-4 h-4 text-indigo-600" }),
    _a[BusinessEventType.DEAL_WON] = _jsx(DollarSign, { className: "w-4 h-4 text-green-600" }),
    _a[BusinessEventType.DEAL_LOST] = _jsx(AlertCircle, { className: "w-4 h-4 text-red-600" }),
    _a[BusinessEventType.CONTACT_CREATED] = _jsx(Users, { className: "w-4 h-4 text-blue-600" }),
    _a[BusinessEventType.INVOICE_PAID] = _jsx(DollarSign, { className: "w-4 h-4 text-green-600" }),
    _a[BusinessEventType.REFUND_PROCESSED] = _jsx(DollarSign, { className: "w-4 h-4 text-orange-600" }),
    _a);
var PRIORITY_COLORS = (_b = {},
    _b[EventPriority.LOW] = 'bg-gray-100 text-gray-800',
    _b[EventPriority.MEDIUM] = 'bg-blue-100 text-blue-800',
    _b[EventPriority.HIGH] = 'bg-orange-100 text-orange-800',
    _b[EventPriority.CRITICAL] = 'bg-red-100 text-red-800',
    _b);
export function RealtimeEventStream(_a) {
    var _b = _a.maxEvents, maxEvents = _b === void 0 ? 50 : _b, _c = _a.showFilters, showFilters = _c === void 0 ? false : _c, _d = _a.showMetrics, showMetrics = _d === void 0 ? false : _d, _e = _a.autoScroll, _autoScroll = _e === void 0 ? true : _e, className = _a.className;
    var _f = useState(''), searchTerm = _f[0], setSearchTerm = _f[1];
    var _g = useState('all'), selectedEventType = _g[0], setSelectedEventType = _g[1];
    var _h = useState('all'), selectedSource = _h[0], setSelectedSource = _h[1];
    var _j = useState('all'), selectedPriority = _j[0], setSelectedPriority = _j[1];
    var _k = useState(false), isPaused = _k[0], setIsPaused = _k[1];
    var _l = useSSEConnection({
        autoReconnect: !isPaused,
    }), events = _l.events, connectionState = _l.connectionState, clearEvents = _l.clearEvents, connect = _l.connect, disconnect = _l.disconnect;
    var filteredEvents = useMemo(function () {
        var filtered = events.slice(-maxEvents);
        if (searchTerm) {
            filtered = filtered.filter(function (event) {
                return JSON.stringify(event.data).toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        if (selectedEventType !== 'all') {
            filtered = filtered.filter(function (event) {
                return event.data.event_type === selectedEventType;
            });
        }
        if (selectedSource !== 'all') {
            filtered = filtered.filter(function (event) {
                return event.data.source === selectedSource;
            });
        }
        if (selectedPriority !== 'all') {
            filtered = filtered.filter(function (event) {
                return event.data.priority === selectedPriority;
            });
        }
        return filtered.reverse(); // Show newest first
    }, [events, maxEvents, searchTerm, selectedEventType, selectedSource, selectedPriority]);
    var eventMetrics = useMemo(function () {
        var recentEvents = events.slice(-100); // Last 100 events for metrics
        return {
            total: recentEvents.length,
            byType: recentEvents.reduce(function (acc, event) {
                var type = event.data.event_type || 'unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {}),
            byPriority: recentEvents.reduce(function (acc, event) {
                var priority = event.data.priority || EventPriority.LOW;
                acc[priority] = (acc[priority] || 0) + 1;
                return acc;
            }, {}),
            eventsPerMinute: Math.round(recentEvents.length / 5), // Rough estimate
        };
    }, [events]);
    var handleToggleConnection = function () {
        if (isPaused) {
            connect();
            setIsPaused(false);
        }
        else {
            disconnect();
            setIsPaused(true);
        }
    };
    var handleExportEvents = function () {
        var dataStr = JSON.stringify(filteredEvents, null, 2);
        var dataBlob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(dataBlob);
        var link = document.createElement('a');
        link.href = url;
        link.download = "webhook-events-".concat(new Date().toISOString().split('T')[0], ".json");
        link.click();
        URL.revokeObjectURL(url);
    };
    var formatEventData = function (data) {
        try {
            // Extract key information from the event
            var keys = ['amount', 'customer_id', 'order_id', 'status', 'email', 'name'];
            var extracted = keys.reduce(function (acc, key) {
                if (data[key] !== undefined) {
                    acc[key] = data[key];
                }
                return acc;
            }, {});
            return Object.keys(extracted).length > 0
                ? JSON.stringify(extracted, null, 1).replace(/[{}"\n]/g, '').trim()
                : 'Event received';
        }
        catch (_a) {
            return 'Event received';
        }
    };
    var getEventTypeLabel = function (type) {
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    return (_jsxs("div", { className: "space-y-4 ".concat(className), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Live Event Stream" }), _jsx(Badge, { className: connectionState.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800', children: connectionState.isConnected ? 'Connected' : 'Disconnected' })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: handleToggleConnection, children: isPaused ? (_jsxs(_Fragment, { children: [_jsx(Play, { className: "w-4 h-4 mr-1" }), "Resume"] })) : (_jsxs(_Fragment, { children: [_jsx(Pause, { className: "w-4 h-4 mr-1" }), "Pause"] })) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: clearEvents, children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-1" }), "Clear"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleExportEvents, disabled: filteredEvents.length === 0, children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Export"] })] })] }), showMetrics && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-2xl font-bold", children: eventMetrics.total }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Total Events" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-2xl font-bold", children: eventMetrics.eventsPerMinute }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Events/Min" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-2xl font-bold text-red-600", children: eventMetrics.byPriority[EventPriority.CRITICAL] || 0 }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Critical" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: eventMetrics.byPriority[EventPriority.HIGH] || 0 }), _jsx("div", { className: "text-xs text-muted-foreground", children: "High Priority" })] }) })] })), showFilters && (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Search events...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "pl-10" })] }), _jsxs(Select, { value: selectedEventType, onValueChange: function (value) { return setSelectedEventType(value); }, children: [_jsx("option", { value: "all", children: "All Event Types" }), Object.values(BusinessEventType).map(function (type) { return (_jsx("option", { value: type, children: getEventTypeLabel(type) }, type)); })] }), _jsxs(Select, { value: selectedSource, onValueChange: function (value) { return setSelectedSource(value); }, children: [_jsx("option", { value: "all", children: "All Sources" }), Object.values(IntegrationSource).map(function (source) { return (_jsx("option", { value: source, children: source }, source)); })] }), _jsxs(Select, { value: selectedPriority, onValueChange: function (value) { return setSelectedPriority(value); }, children: [_jsx("option", { value: "all", children: "All Priorities" }), Object.values(EventPriority).map(function (priority) { return (_jsx("option", { value: priority, children: priority }, priority)); })] })] }) }) })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("span", { children: ["Events (", filteredEvents.length, ")"] }), _jsx("div", { className: "flex items-center space-x-2 text-sm text-muted-foreground", children: connectionState.lastEventTime && (_jsxs("span", { children: ["Last event: ", connectionState.lastEventTime.toLocaleTimeString()] })) })] }) }), _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "max-h-96 overflow-y-auto", children: filteredEvents.length === 0 ? (_jsxs("div", { className: "p-8 text-center text-muted-foreground", children: [_jsx(Clock, { className: "w-8 h-8 mx-auto mb-2" }), _jsx("p", { children: "No events to display" }), _jsx("p", { className: "text-sm", children: "Events will appear here as they are received" })] })) : (_jsx("div", { className: "space-y-1", children: filteredEvents.map(function (event, index) { return (_jsxs("div", { className: "p-3 border-b hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [EVENT_ICONS[event.data.event_type] ||
                                                                    _jsx(AlertCircle, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "font-medium", children: getEventTypeLabel(event.data.event_type || 'Unknown') })] }), event.data.priority && (_jsx(Badge, { className: PRIORITY_COLORS[event.data.priority], children: event.data.priority })), event.data.source && (_jsx(Badge, { variant: "outline", children: event.data.source }))] }), _jsx("span", { className: "text-xs text-muted-foreground", children: event.timestamp.toLocaleTimeString() })] }), _jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: formatEventData(event.data) })] }, "".concat(event.timestamp, "-").concat(index))); }) })) }) })] })] }));
}
