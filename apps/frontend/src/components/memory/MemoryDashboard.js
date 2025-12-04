"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryDashboard = void 0;
import react_1 from 'react';
import react_chartjs_2_1 from 'react-chartjs-2';
import chart_js_1 from 'chart';
chart_js_1.Chart.register(chart_js_1.CategoryScale, chart_js_1.LinearScale, chart_js_1.PointElement, chart_js_1.LineElement, chart_js_1.Title, chart_js_1.Tooltip, chart_js_1.Legend, chart_js_1.ArcElement);
var MemoryDashboard = function (_a) {
    var memoryManager = _a.memoryManager;
    var _b = (0, react_1.useState)(null), metrics = _b[0], setMetrics = _b[1];
    var _c = (0, react_1.useState)(null), health = _c[0], setHealth = _c[1];
    var _d = (0, react_1.useState)([]), clusters = _d[0], setClusters = _d[1];
    (0, react_1.useEffect)(function () {
        var updateMetrics = function () {
            setMetrics(memoryManager.getMetrics());
            setHealth(memoryManager.getHealth());
            setClusters(memoryManager.getClusterInfo());
        };
        updateMetrics();
        var interval = setInterval(updateMetrics, 5000);
        return function () { return clearInterval(interval); };
    }, [memoryManager]);
    if (!metrics || !health)
        return _jsx("div", { children: "Loading metrics..." });
    var memoryUsageData = {
        labels: ['Used', 'Available'],
        datasets: [
            {
                data: [metrics.totalItems, metrics.maxItems - metrics.totalItems],
                backgroundColor: ['#FF6384', '#36A2EB'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB']
            }
        ]
    };
    var performanceData = {
        labels: ['Cache Hit Rate', 'Retrieval Latency'],
        datasets: [
            {
                label: 'Performance Metrics',
                data: [metrics.cacheHitRate * 100, metrics.retrievalLatency],
                borderColor: '#4BC0C0',
                tension: 0.1
            }
        ]
    };
    return (_jsxs("div", { className: "memory-dashboard", children: [_jsx("h2", { children: "Memory System Dashboard" }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Memory Usage" }), _jsx(react_chartjs_2_1.Doughnut, { data: memoryUsageData }), _jsxs("div", { className: "metric-details", children: [_jsxs("p", { children: ["Total Items: ", metrics.totalItems] }), _jsxs("p", { children: ["Max Capacity: ", metrics.maxItems] })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "Performance" }), _jsx(react_chartjs_2_1.Line, { data: performanceData }), _jsxs("div", { className: "metric-details", children: [_jsxs("p", { children: ["Cache Hit Rate: ", (metrics.cacheHitRate * 100).toFixed(1), "%"] }), _jsxs("p", { children: ["Avg Retrieval Time: ", metrics.retrievalLatency.toFixed(2), "ms"] })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h3", { children: "System Health" }), _jsx("div", { className: "health-status ".concat(health.status.toLowerCase()), children: health.status }), _jsxs("div", { className: "metric-details", children: [_jsxs("p", { children: ["Memory Load: ", health.memoryLoad.toFixed(1), "%"] }), _jsxs("p", { children: ["Cache Efficiency: ", health.cacheEfficiency.toFixed(1), "%"] })] })] }), _jsxs("div", { className: "metric-card clusters", children: [_jsx("h3", { children: "Memory Clusters" }), _jsx("div", { className: "clusters-list", children: clusters.map(function (cluster) { return (_jsxs("div", { className: "cluster-item", children: [_jsxs("div", { className: "cluster-header", children: [_jsx("h4", { children: cluster.label }), _jsxs("span", { className: "cluster-size", children: [cluster.size, " items"] })] }), _jsxs("div", { className: "cluster-confidence", children: [_jsx("div", { className: "confidence-bar", style: { width: "".concat(cluster.confidence * 100, "%") } }), _jsxs("span", { children: [(cluster.confidence * 100).toFixed(1), "% confidence"] })] })] }, cluster.id)); }) })] })] }), _jsx("style", { jsx: true, children: "\n                .memory-dashboard {\n                    padding: 20px;\n                    background: #f5f5f5;\n                }\n\n                .metrics-grid {\n                    display: grid;\n                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n                    gap: 20px;\n                    margin-top: 20px;\n                }\n\n                .metric-card {\n                    background: white;\n                    padding: 20px;\n                    border-radius: 8px;\n                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n                }\n\n                .metric-card h3 {\n                    margin-top: 0;\n                    color: #333;\n                }\n\n                .metric-details {\n                    margin-top: 15px;\n                }\n\n                .health-status {\n                    padding: 10px;\n                    border-radius: 4px;\n                    text-align: center;\n                    font-weight: bold;\n                    margin: 10px 0;\n                }\n\n                .health-status.healthy {\n                    background: #d4edda;\n                    color: #155724;\n                }\n\n                .health-status.warning {\n                    background: #fff3cd;\n                    color: #856404;\n                }\n\n                .health-status.critical {\n                    background: #f8d7da;\n                    color: #721c24;\n                }\n\n                .clusters-list {\n                    max-height: 300px;\n                    overflow-y: auto;\n                }\n\n                .cluster-item {\n                    padding: 10px;\n                    border-bottom: 1px solid #eee;\n                }\n\n                .cluster-header {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: center;\n                }\n\n                .cluster-header h4 {\n                    margin: 0;\n                    color: #333;\n                }\n\n                .cluster-size {\n                    color: #666;\n                    font-size: 0.9em;\n                }\n\n                .cluster-confidence {\n                    margin-top: 5px;\n                    position: relative;\n                    height: 20px;\n                    background: #f0f0f0;\n                    border-radius: 10px;\n                    overflow: hidden;\n                }\n\n                .confidence-bar {\n                    position: absolute;\n                    top: 0;\n                    left: 0;\n                    height: 100%;\n                    background: linear-gradient(90deg, #4BC0C0 0%, #36A2EB 100%);\n                    transition: width 0.3s ease;\n                }\n\n                .cluster-confidence span {\n                    position: absolute;\n                    right: 10px;\n                    top: 50%;\n                    transform: translateY(-50%);\n                    font-size: 0.8em;\n                    color: #333;\n                    z-index: 1;\n                }\n            " })] }));
};
exports.MemoryDashboard = MemoryDashboard;
