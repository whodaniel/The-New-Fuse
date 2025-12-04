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
exports.GraphAnalytics = GraphAnalytics;
import react_1 from 'react';
import { Box, SimpleGrid, GridItem, Tabs, Tab } from '@chakra-ui/react';
import recharts_1 from 'recharts';
import WizardProvider_1 from './WizardProvider';
import WizardWebSocket_1 from './WizardWebSocket';
function GraphAnalytics() {
    var state = (0, WizardProvider_1.useWizard)().state;
    var _a = (0, WizardWebSocket_1.useWizardWebSocket)(), subscribeToEvent = _a.subscribeToEvent, unsubscribeFromEvent = _a.unsubscribeFromEvent, sendMessage = _a.sendMessage;
    var _b = (0, react_1.useState)(null), metrics = _b[0], setMetrics = _b[1];
    var _c = (0, react_1.useState)([]), nodeDistribution = _c[0], setNodeDistribution = _c[1];
    var _d = (0, react_1.useState)([]), edgeAnalytics = _d[0], setEdgeAnalytics = _d[1];
    var _e = (0, react_1.useState)([]), timeseriesData = _e[0], setTimeseriesData = _e[1];
    var _f = (0, react_1.useState)(0), selectedTab = _f[0], setSelectedTab = _f[1];
    var _g = (0, react_1.useState)(true), loading = _g[0], setLoading = _g[1];
    var _h = (0, react_1.useState)('1h'), selectedTimeRange = _h[0], setSelectedTimeRange = _h[1];
    var _j = (0, react_1.useState)('nodeCount'), selectedMetric = _j[0], setSelectedMetric = _j[1];
    var COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    (0, react_1.useEffect)(function () {
        var handleMetricsUpdate = function (data) {
            setMetrics(data.metrics);
            setNodeDistribution(data.nodeDistribution);
            setEdgeAnalytics(data.edgeAnalytics);
            setTimeseriesData(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{
                    timestamp: Date.now(),
                    nodeCount: data.metrics.nodeCount,
                    edgeCount: data.metrics.edgeCount,
                    avgDegree: data.metrics.avgDegree
                }], false).slice(-100); });
        };
        subscribeToEvent('graph_metrics', handleMetricsUpdate);
        sendMessage('request_graph_metrics', { timeRange: selectedTimeRange });
        setLoading(false);
        return function () { return unsubscribeFromEvent('graph_metrics', handleMetricsUpdate); };
    }, [subscribeToEvent, unsubscribeFromEvent, sendMessage]);
    var handleTimeRangeChange = function (range) {
        setSelectedTimeRange(range);
        sendMessage('request_graph_metrics', { timeRange: range });
    };
    var renderMetricsOverview = function () { return (_jsxs(SimpleGrid, { columns: 2, children: [_jsx(GridItem, { colSpan: 12, md: 6, children: _jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Graph Overview" }), metrics && (_jsxs(material_1.Box, { children: [_jsxs(material_1.Typography, { children: ["Nodes: ", metrics.nodeCount] }), _jsxs(material_1.Typography, { children: ["Edges: ", metrics.edgeCount] }), _jsxs(material_1.Typography, { children: ["Density: ", metrics.density.toFixed(3)] }), _jsxs(material_1.Typography, { children: ["Average Degree: ", metrics.avgDegree.toFixed(2)] }), _jsxs(material_1.Typography, { children: ["Clustering Coefficient: ", metrics.clustering.toFixed(3)] }), _jsxs(material_1.Typography, { children: ["Connected Components: ", metrics.componentCount] }), _jsxs(material_1.Typography, { children: ["Graph Diameter: ", metrics.diameter] }), _jsxs(material_1.Typography, { children: ["Avg Path Length: ", metrics.avgPathLength.toFixed(2)] })] }))] }) }) }), _jsx(GridItem, { colSpan: 12, md: 6, children: _jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Node Distribution" }), _jsx(recharts_1.ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(recharts_1.PieChart, { children: [_jsx(recharts_1.Pie, { data: nodeDistribution, dataKey: "count", nameKey: "type", cx: "50%", cy: "50%", outerRadius: 80, label: true, children: nodeDistribution.map(function (entry, index) { return (_jsx(recharts_1.Cell, { fill: COLORS[index % COLORS.length] }, "cell-".concat(index))); }) }), _jsx(recharts_1.Legend, {}), _jsx(recharts_1.Tooltip, {})] }) })] }) }) })] })); };
    var renderEdgeAnalytics = function () { return (_jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Edge Analytics" }), _jsx(recharts_1.ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(recharts_1.BarChart, { data: edgeAnalytics, children: [_jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: "type" }), _jsx(recharts_1.YAxis, { yAxisId: "left", orientation: "left", stroke: "#8884d8" }), _jsx(recharts_1.YAxis, { yAxisId: "right", orientation: "right", stroke: "#82ca9d" }), _jsx(recharts_1.Tooltip, {}), _jsx(recharts_1.Legend, {}), _jsx(recharts_1.Bar, { yAxisId: "left", dataKey: "count", fill: "#8884d8", name: "Count" }), _jsx(recharts_1.Bar, { yAxisId: "right", dataKey: "weight", fill: "#82ca9d", name: "Avg Weight" })] }) })] }) })); };
    var renderTimeseries = function () { return (_jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(material_1.Typography, { variant: "h6", children: "Time Series Analysis" }), _jsxs(material_1.Box, { display: "flex", gap: 2, children: [_jsxs(material_1.FormControl, { size: "small", children: [_jsx(material_1.InputLabel, { children: "Time Range" }), _jsxs(material_1.Select, { value: selectedTimeRange, onChange: function (e) { return handleTimeRangeChange(e.target.value); }, label: "Time Range", children: [_jsx(material_1.MenuItem, { value: "1h", children: "Last Hour" }), _jsx(material_1.MenuItem, { value: "24h", children: "Last 24 Hours" }), _jsx(material_1.MenuItem, { value: "7d", children: "Last 7 Days" }), _jsx(material_1.MenuItem, { value: "30d", children: "Last 30 Days" })] })] }), _jsxs(material_1.FormControl, { size: "small", children: [_jsx(material_1.InputLabel, { children: "Metric" }), _jsxs(material_1.Select, { value: selectedMetric, onChange: function (e) { return setSelectedMetric(e.target.value); }, label: "Metric", children: [_jsx(material_1.MenuItem, { value: "nodeCount", children: "Node Count" }), _jsx(material_1.MenuItem, { value: "edgeCount", children: "Edge Count" }), _jsx(material_1.MenuItem, { value: "avgDegree", children: "Average Degree" })] })] })] })] }), _jsx(recharts_1.ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(recharts_1.LineChart, { data: timeseriesData, children: [_jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: "timestamp", tickFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); } }), _jsx(recharts_1.YAxis, {}), _jsx(recharts_1.Tooltip, { labelFormatter: function (timestamp) { return new Date(timestamp).toLocaleString(); } }), _jsx(recharts_1.Legend, {}), _jsx(recharts_1.Line, { type: "monotone", dataKey: selectedMetric, stroke: "#8884d8", dot: false, name: selectedMetric })] }) })] }) })); };
    if (loading) {
        return (_jsx(material_1.Box, { display: "flex", justifyContent: "center", alignItems: "center", height: 400, children: _jsx(material_1.CircularProgress, {}) }));
    }
    return (_jsxs(material_1.Box, { children: [_jsx(Box, { sx: { mb: 2 }, children: _jsxs(Tabs, { value: selectedTab, onChange: function (_, newValue) { return setSelectedTab(newValue); }, variant: "fullWidth", children: [_jsx(Tab, { label: "Overview" }), _jsx(Tab, { label: "Edge Analytics" }), _jsx(Tab, { label: "Time Series" })] }) }), _jsxs(material_1.Box, { mt: 2, children: [selectedTab === 0 && renderMetricsOverview(), selectedTab === 1 && renderEdgeAnalytics(), selectedTab === 2 && renderTimeseries()] })] }));
}
