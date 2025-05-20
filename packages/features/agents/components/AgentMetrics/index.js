"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMetricsDisplay = void 0;
import react_1 from 'react';
import Progress_1 from '@/components/ui/Progress';
import react_toastify_1 from 'react-toastify';
const AgentMetricsDisplay = ({ agentId, refreshInterval = 30000, onMetricsUpdate, }) => {
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchMetrics = async () => ;
        () => ;
        () => {
            try {
                const response = await fetch(`/api/agents/${agentId}/metrics`);
                if (!response.ok)
                    throw new Error('Failed to fetch metrics');
                const data = await response.json();
                setMetrics(data);
                onMetricsUpdate === null || onMetricsUpdate === void 0 ? void 0 : onMetricsUpdate(data);
            }
            catch (error) {
                console.error('Error fetching metrics:', error);
                react_toastify_1.toast.error('Failed to fetch agent metrics');
            }
            finally {
                setLoading(false);
            }
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, refreshInterval);
        return () => clearInterval(interval);
    }, [agentId, refreshInterval, onMetricsUpdate]);
    if (loading) {
        return className = "p-6" >
            className;
        "animate-pulse space-y-4" >
            className;
        "h-4 bg-gray-200 rounded w-1/4" > /div>
            < div;
        className = "space-y-3" >
            className;
        "h-4 bg-gray-200 rounded" > /div>
            < div;
        className = "h-4 bg-gray-200 rounded w-5/6" > /div>
            < /div>
            < /div>
            < /Card>;
        ;
    }
    if (!metrics) {
        return className = "p-6" >
            className;
        "text-gray-500" > No;
        metrics;
        available < /p>
            < /Card>;
        ;
    }
    return className = "p-6 space-y-6" >
        className;
    "grid grid-cols-2 gap-4" >
        className;
    "text-sm font-medium text-gray-500" > Success;
    Rate < /h3>
        < div;
    className = "mt-2 flex items-baseline" >
        className;
    "text-2xl font-semibold text-gray-900" >
        { metrics, : .successRate } %
            /p>
        < /div>
        < Progress_1.Progress;
    value = { metrics, : .successRate };
    className = "mt-2" /  >
        /div>
        < div >
        className;
    "text-sm font-medium text-gray-500" > Response;
    Time < /h3>
        < div;
    className = "mt-2 flex items-baseline" >
        className;
    "text-2xl font-semibold text-gray-900" >
        { metrics, : .averageResponseTime };
    ms
        < /p>
        < /div>
        < /div>
        < /div>
        < div;
    className = "grid grid-cols-2 gap-4" >
        className;
    "text-sm font-medium text-gray-500" > Tasks < /h3>
        < div;
    className = "mt-2" >
        className;
    "flex justify-between" >
        className;
    "text-sm text-gray-500" > Completed < /span>
        < span;
    className = "text-sm font-medium text-gray-900" >
        { metrics, : .completedTasks } / { metrics, : .totalTasks }
        < /span>
        < /div>
        < div;
    className = "flex justify-between mt-1" >
        className;
    "text-sm text-gray-500" > Failed < /span>
        < span;
    className = "text-sm font-medium text-gray-900" >
        { metrics, : .failedTasks }
        < /span>
        < /div>
        < /div>
        < /div>
        < div >
        className;
    "text-sm font-medium text-gray-500" > Resource;
    Usage < /h3>
        < div;
    className = "mt-2" >
        className;
    "flex justify-between" >
        className;
    "text-sm text-gray-500" > CPU < /span>
        < span;
    className = "text-sm font-medium text-gray-900" >
        { metrics, : .resourceUsage.cpu } %
            /span>
        < /div>
        < Progress_1.Progress;
    value = { metrics, : .resourceUsage.cpu };
    className = "mt-1" /  >
        className;
    "flex justify-between mt-2" >
        className;
    "text-sm text-gray-500" > Memory < /span>
        < span;
    className = "text-sm font-medium text-gray-900" >
        { metrics, : .resourceUsage.memory } %
            /span>
        < /div>
        < Progress_1.Progress;
    value = { metrics, : .resourceUsage.memory };
    className = "mt-1" /  >
        /div>
        < /div>
        < /div>
        < div;
    className = "mt-4 text-sm text-gray-500" >
        Last;
    active: {
        new Date(metrics.lastActive).toLocaleString();
    }
    /div>
        < /Card>;
    ;
};
exports.AgentMetricsDisplay = AgentMetricsDisplay;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map