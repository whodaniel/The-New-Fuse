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
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAgents } from '@/hooks/useAgents';
export var AgentSelector = function (_a) {
    var onSelect = _a.onSelect, selectedAgent = _a.selectedAgent;
    var _b = useAgents(), agents = _b.agents, loading = _b.loading, error = _b.error, fetchAgents = _b.fetchAgents;
    // Retry loading if there was an error
    useEffect(function () {
        if (error) {
            var timer_1 = setTimeout(function () {
                fetchAgents();
            }, 5000); // Retry after 5 seconds
            return function () { return clearTimeout(timer_1); };
        }
    }, [error, fetchAgents]);
    var getStatusVariant = function (status) {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'secondary';
            case 'error':
                return 'destructive';
            default:
                return 'default';
        }
    };
    if (loading) {
        return (_jsxs(ScrollArea.Root, { className: "h-[400px]", children: [_jsx(ScrollArea.Viewport, { className: "h-full w-full", children: _jsx("div", { className: "space-y-2 p-2", children: __spreadArray([], Array(5), true).map(function (_, i) { return (_jsxs(Card, { className: "cursor-pointer", children: [_jsx(CardHeader, { className: "p-4", children: _jsx(Skeleton, { className: "h-4 w-24" }) }), _jsxs(CardContent, { className: "p-4 pt-0", children: [_jsx(Skeleton, { className: "h-4 w-full mb-2" }), _jsx(Skeleton, { className: "h-4 w-3/4" })] })] }, i)); }) }) }), _jsx(ScrollArea.Scrollbar, { orientation: "vertical", children: _jsx(ScrollArea.Thumb, {}) })] }));
    }
    if (error) {
        return (_jsx(Alert, { variant: "destructive", children: _jsx(AlertDescription, { children: "Failed to load agents. Retrying..." }) }));
    }
    return (_jsxs(ScrollArea.Root, { className: "h-[400px]", children: [_jsx(ScrollArea.Viewport, { className: "h-full w-full", children: _jsx("div", { className: "space-y-2 p-2", children: agents.map(function (agent) { return (_jsxs(Card, { className: "cursor-pointer transition-colors ".concat((selectedAgent === null || selectedAgent === void 0 ? void 0 : selectedAgent.id) === agent.id
                            ? 'bg-primary/10'
                            : 'hover:bg-accent'), onClick: function () { return onSelect(agent); }, children: [_jsx(CardHeader, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Badge, { variant: getStatusVariant(agent.status), children: agent.status || 'unknown' }), _jsx(CardTitle, { className: "text-sm font-medium", children: agent.name })] }) }), _jsxs(CardContent, { className: "p-4 pt-0", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: agent.description || "".concat(agent.type, " agent") }), _jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: agent.capabilities ?
                                            agent.capabilities.map(function (capability) { return (_jsx(Badge, { variant: "outline", children: capability }, capability)); }) :
                                            _jsx(Badge, { variant: "outline", children: agent.type }) })] })] }, agent.id)); }) }) }), _jsx(ScrollArea.Scrollbar, { orientation: "vertical", children: _jsx(ScrollArea.Thumb, {}) })] }));
};
