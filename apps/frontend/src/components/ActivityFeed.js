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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
var ActivityItem = function (_a) {
    var type = _a.type, message = _a.message, timestamp = _a.timestamp, metadata = _a.metadata, category = _a.category, source = _a.source, read = _a.read, onToggleExpand = _a.onToggleExpand, expanded = _a.expanded;
    var variants = {
        info: 'bg-blue-100 text-blue-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        success: 'bg-green-100 text-green-800'
    };
    return (_jsxs("div", { className: "flex flex-col p-3 hover:bg-gray-50 rounded-md transition-colors ".concat(!read ? 'border-l-2 border-blue-500' : ''), children: [_jsxs("div", { className: "flex items-start space-x-4 w-full", children: [_jsx(Badge, { className: variants[type], children: type.charAt(0).toUpperCase() + type.slice(1) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: message }), onToggleExpand && (_jsx("button", { onClick: onToggleExpand, className: "text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100", children: expanded ? _jsx(ChevronUp, { size: 16 }) : _jsx(ChevronDown, { size: 16 }) }))] }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [category && (_jsx("span", { className: "text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600", children: category })), source && (_jsx("span", { className: "text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600", children: source })), _jsx("p", { className: "text-xs text-gray-500", children: formatDistanceToNow(new Date(timestamp), { addSuffix: true }) })] })] })] }), expanded && metadata && (_jsxs("div", { className: "mt-2 ml-10 p-3 bg-gray-50 rounded-md border border-gray-100", children: [_jsx("p", { className: "text-xs text-gray-500 mb-1", children: "Details:" }), _jsx("pre", { className: "text-xs text-gray-700 overflow-x-auto", children: JSON.stringify(metadata, null, 2) }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: format(new Date(timestamp), 'PPpp') })] }))] }));
};
export function ActivityFeed() {
    var _a = useState([]), activities = _a[0], setActivities = _a[1];
    var _b = useState('all'), filter = _b[0], setFilter = _b[1];
    var _c = useState('all'), timeRange = _c[0], setTimeRange = _c[1];
    var _d = useState(new Set()), expandedIds = _d[0], setExpandedIds = _d[1];
    var _e = useState(new Set()), readIds = _e[0], setReadIds = _e[1];
    var subscribe = useWebSocket().subscribe;
    useEffect(function () {
        var handlers = [
            subscribe('activity', function (activity) {
                setActivities(function (prev) { return __spreadArray([activity], prev, true).slice(0, 50); });
            }),
            subscribe('system_event', function (event) {
                var activity = {
                    id: crypto.randomUUID(),
                    type: event.severity || 'info',
                    message: event.message,
                    timestamp: new Date().toISOString(),
                    category: event.category || 'System',
                    source: event.source || 'System',
                    metadata: event.data
                };
                setActivities(function (prev) { return __spreadArray([activity], prev, true).slice(0, 50); });
            }),
            subscribe('error', function (error) {
                var activity = {
                    id: crypto.randomUUID(),
                    type: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                    category: 'Error',
                    source: 'Application'
                };
                setActivities(function (prev) { return __spreadArray([activity], prev, true).slice(0, 50); });
            })
        ];
        return function () {
            handlers.forEach(function (unsubscribe) { return unsubscribe(); });
        };
    }, [subscribe]);
    // Filter activities based on selected filters
    var filteredActivities = useMemo(function () {
        var filtered = __spreadArray([], activities, true);
        // Filter by type
        if (filter !== 'all') {
            filtered = filtered.filter(function (activity) { return activity.type === filter; });
        }
        // Filter by time range
        if (timeRange !== 'all') {
            var now = new Date();
            var cutoff_1 = new Date();
            switch (timeRange) {
                case 'today':
                    cutoff_1.setHours(0, 0, 0, 0);
                    break;
                case 'yesterday':
                    cutoff_1.setDate(now.getDate() - 1);
                    cutoff_1.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    cutoff_1.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoff_1.setMonth(now.getMonth() - 1);
                    break;
            }
            filtered = filtered.filter(function (activity) { return new Date(activity.timestamp) >= cutoff_1; });
        }
        return filtered;
    }, [activities, filter, timeRange]);
    // Group activities by date
    var groupedActivities = useMemo(function () {
        var groups = {};
        filteredActivities.forEach(function (activity) {
            var date = new Date(activity.timestamp).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
        });
        return groups;
    }, [filteredActivities]);
    var toggleExpand = function (id) {
        setExpandedIds(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            }
            else {
                newSet.add(id);
                // Mark as read when expanded
                setReadIds(function (readIds) { return new Set(__spreadArray(__spreadArray([], readIds, true), [id], false)); });
            }
            return newSet;
        });
    };
    var markAllAsRead = function () {
        setReadIds(new Set(activities.map(function (a) { return a.id; })));
    };
    var clearActivities = function () {
        if (window.confirm('Are you sure you want to clear all activities?')) {
            setActivities([]);
            setExpandedIds(new Set());
            setReadIds(new Set());
        }
    };
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Activity Feed" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Badge, { variant: "outline", className: "ml-2", children: [filteredActivities.length, " events"] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: markAllAsRead, className: "text-xs", children: "Mark all as read" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Select, { value: filter, onValueChange: setFilter, children: [_jsx(SelectTrigger, { className: "w-[120px] h-8 text-xs", children: _jsx(SelectValue, { placeholder: "Filter by type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "info", children: "Info" }), _jsx(SelectItem, { value: "warning", children: "Warning" }), _jsx(SelectItem, { value: "error", children: "Error" }), _jsx(SelectItem, { value: "success", children: "Success" })] })] }), _jsxs(Select, { value: timeRange, onValueChange: setTimeRange, children: [_jsx(SelectTrigger, { className: "w-[120px] h-8 text-xs", children: _jsx(SelectValue, { placeholder: "Time range" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Time" }), _jsx(SelectItem, { value: "today", children: "Today" }), _jsx(SelectItem, { value: "yesterday", children: "Yesterday" }), _jsx(SelectItem, { value: "week", children: "Last 7 Days" }), _jsx(SelectItem, { value: "month", children: "Last 30 Days" })] })] })] }), _jsx("div", { className: "flex-grow" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx(Button, { variant: "outline", size: "sm", className: "h-8 text-xs", onClick: clearActivities, children: "Clear" }) })] })] }), _jsx(CardContent, { children: _jsxs(Tabs, { defaultValue: "list", className: "w-full", children: [_jsxs(TabsList, { className: "mb-2", children: [_jsx(TabsTrigger, { value: "list", children: "List View" }), _jsx(TabsTrigger, { value: "grouped", children: "Grouped View" })] }), _jsx(TabsContent, { value: "list", children: _jsx(ScrollArea, { className: "h-[400px]", children: filteredActivities.length === 0 ? (_jsx("div", { className: "text-center text-gray-500 py-8", children: "No activity to display" })) : (_jsx("div", { className: "space-y-1", children: filteredActivities.map(function (activity) { return (_jsx(ActivityItem, __assign({}, activity, { expanded: expandedIds.has(activity.id), onToggleExpand: function () { return toggleExpand(activity.id); }, read: readIds.has(activity.id) }), activity.id)); }) })) }) }), _jsx(TabsContent, { value: "grouped", children: _jsx(ScrollArea, { className: "h-[400px]", children: Object.keys(groupedActivities).length === 0 ? (_jsx("div", { className: "text-center text-gray-500 py-8", children: "No activity to display" })) : (_jsx("div", { className: "space-y-4", children: Object.entries(groupedActivities).map(function (_a) {
                                        var date = _a[0], dateActivities = _a[1];
                                        return (_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "sticky top-0 bg-gray-100 p-2 rounded-md z-10", children: _jsx("h4", { className: "text-sm font-medium", children: date }) }), dateActivities.map(function (activity) { return (_jsx(ActivityItem, __assign({}, activity, { expanded: expandedIds.has(activity.id), onToggleExpand: function () { return toggleExpand(activity.id); }, read: readIds.has(activity.id) }), activity.id)); })] }, date));
                                    }) })) }) })] }) })] }));
}
export function ActivityFeedControls(_a) {
    var setActivities = _a.setActivities, clearActivities = _a.clearActivities;
    return (_jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "h-8 text-xs", onClick: function () { return setActivities(function (prev) { return __spreadArray([], prev, true); }); }, children: [_jsx(RefreshCw, { size: 14, className: "mr-1" }), "Refresh"] }), _jsx(Button, { variant: "outline", size: "sm", className: "h-8 text-xs", onClick: clearActivities, children: "Clear" })] }));
}
