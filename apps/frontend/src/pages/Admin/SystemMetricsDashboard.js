var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Server, RefreshCw, TrendingUp, TrendingDown, Zap, Database, Globe, AlertCircle, Download, } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, } from 'recharts';
export default function SystemMetricsDashboard() {
    var _this = this;
    var _a = useState({
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        activeConnections: 0,
        requestsPerSecond: 0,
        avgResponseTime: 0,
        errorRate: 0,
    }), metrics = _a[0], setMetrics = _a[1];
    var _b = useState([]), historicalData = _b[0], setHistoricalData = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(true), autoRefresh = _d[0], setAutoRefresh = _d[1];
    var _e = useState('1h'), timeRange = _e[0], setTimeRange = _e[1];
    useEffect(function () {
        loadMetrics();
        if (autoRefresh) {
            var interval_1 = setInterval(loadMetrics, 5000);
            return function () { return clearInterval(interval_1); };
        }
    }, [autoRefresh, timeRange]);
    var loadMetrics = function () { return __awaiter(_this, void 0, void 0, function () {
        var now_1, newMetrics, historical, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Mock data - replace with real API
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 1:
                    // Mock data - replace with real API
                    _a.sent();
                    now_1 = new Date();
                    newMetrics = {
                        cpu: Math.random() * 100,
                        memory: 65 + Math.random() * 20,
                        disk: 52 + Math.random() * 10,
                        network: Math.random() * 5,
                        activeConnections: Math.floor(100 + Math.random() * 200),
                        requestsPerSecond: Math.floor(500 + Math.random() * 1000),
                        avgResponseTime: Math.floor(50 + Math.random() * 100),
                        errorRate: Math.random() * 2,
                    };
                    setMetrics(newMetrics);
                    historical = Array.from({ length: 24 }, function (_, i) { return ({
                        time: new Date(now_1.getTime() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        cpu: 30 + Math.random() * 50,
                        memory: 60 + Math.random() * 20,
                        disk: 50 + Math.random() * 10,
                        requests: 500 + Math.random() * 1500,
                        responseTime: 50 + Math.random() * 100,
                        errors: Math.random() * 50,
                    }); });
                    setHistoricalData(historical);
                    setLoading(false);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error loading metrics:', error_1);
                    setLoading(false);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var radarData = [
        { metric: 'CPU', value: metrics.cpu },
        { metric: 'Memory', value: metrics.memory },
        { metric: 'Disk', value: metrics.disk },
        { metric: 'Network', value: metrics.network * 20 },
        { metric: 'Response', value: 100 - metrics.avgResponseTime / 2 },
    ];
    var getUsageColor = function (usage) {
        if (usage < 50)
            return 'text-green-600';
        if (usage < 80)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    var getUsageBg = function (usage) {
        if (usage < 50)
            return 'bg-green-500';
        if (usage < 80)
            return 'bg-yellow-500';
        return 'bg-red-500';
    };
    var MetricCard = function (_a) {
        var title = _a.title, value = _a.value, unit = _a.unit, Icon = _a.icon, trend = _a.trend, trendValue = _a.trendValue, color = _a.color;
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4", style: { borderColor: color }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "p-3 rounded-lg bg-opacity-10", style: { backgroundColor: color + '20' }, children: _jsx(Icon, { className: "h-6 w-6", style: { color: color } }) }), trend && (_jsxs("div", { className: "flex items-center text-sm ".concat(trend === 'up' ? 'text-red-600' : 'text-green-600'), children: [trend === 'up' ? _jsx(TrendingUp, { className: "h-4 w-4 mr-1" }) : _jsx(TrendingDown, { className: "h-4 w-4 mr-1" }), trendValue] }))] }), _jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "text-3xl font-bold ".concat(getUsageColor(value)), children: [value.toFixed(1), _jsx("span", { className: "text-sm text-gray-500 ml-1", children: unit })] }), _jsx("div", { className: "text-sm text-gray-600", children: title })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "h-2 rounded-full transition-all duration-500 ".concat(getUsageBg(value)), style: { width: "".concat(Math.min(value, 100), "%") } }) })] }));
    };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Activity, { className: "h-8 w-8 mr-3 text-blue-600" }), "System Metrics Dashboard"] }), _jsx("p", { className: "text-gray-600", children: "Real-time performance monitoring and analytics" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("label", { className: "flex items-center space-x-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: autoRefresh, onChange: function (e) { return setAutoRefresh(e.target.checked); }, className: "h-4 w-4 text-blue-600 rounded" }), _jsx("span", { children: "Auto-refresh (5s)" })] }), _jsxs("select", { value: timeRange, onChange: function (e) { return setTimeRange(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "1h", children: "Last Hour" }), _jsx("option", { value: "6h", children: "Last 6 Hours" }), _jsx("option", { value: "24h", children: "Last 24 Hours" }), _jsx("option", { value: "7d", children: "Last 7 Days" })] }), _jsxs("button", { onClick: loadMetrics, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx(MetricCard, { title: "CPU Usage", value: metrics.cpu, unit: "%", icon: Cpu, trend: metrics.cpu > 70 ? 'up' : 'down', trendValue: "5.2%", color: "#3b82f6" }), _jsx(MetricCard, { title: "Memory Usage", value: metrics.memory, unit: "%", icon: Server, trend: "up", trendValue: "2.1%", color: "#10b981" }), _jsx(MetricCard, { title: "Disk Usage", value: metrics.disk, unit: "%", icon: HardDrive, trend: "down", trendValue: "0.3%", color: "#f59e0b" }), _jsx(MetricCard, { title: "Network Traffic", value: metrics.network, unit: "GB/s", icon: Globe, trend: "up", trendValue: "12%", color: "#8b5cf6" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Zap, { className: "h-6 w-6 text-yellow-500" }), _jsx(TrendingUp, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.requestsPerSecond }), _jsx("div", { className: "text-sm text-gray-600", children: "Requests/Second" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Activity, { className: "h-6 w-6 text-blue-500" }), _jsx(TrendingDown, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.avgResponseTime }), _jsx("div", { className: "text-sm text-gray-600", children: "Avg Response Time (ms)" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Database, { className: "h-6 w-6 text-green-500" }), _jsx(Activity, { className: "h-5 w-5 text-blue-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.activeConnections }), _jsx("div", { className: "text-sm text-gray-600", children: "Active Connections" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(AlertCircle, { className: "h-6 w-6 text-red-500" }), _jsx(TrendingDown, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.errorRate.toFixed(2) }), _jsx("div", { className: "text-sm text-gray-600", children: "Error Rate (%)" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Resource Utilization" }), _jsx(ResponsiveContainer, { width: "100%", height: 350, children: _jsxs(AreaChart, { data: historicalData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time", tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "cpu", stackId: "1", stroke: "#3b82f6", fill: "#3b82f6", name: "CPU %" }), _jsx(Area, { type: "monotone", dataKey: "memory", stackId: "1", stroke: "#10b981", fill: "#10b981", name: "Memory %" }), _jsx(Area, { type: "monotone", dataKey: "disk", stackId: "1", stroke: "#f59e0b", fill: "#f59e0b", name: "Disk %" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Request Volume & Response Time" }), _jsx(ResponsiveContainer, { width: "100%", height: 350, children: _jsxs(LineChart, { data: historicalData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time", tick: { fontSize: 12 } }), _jsx(YAxis, { yAxisId: "left", tick: { fontSize: 12 } }), _jsx(YAxis, { yAxisId: "right", orientation: "right", tick: { fontSize: 12 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "requests", stroke: "#8b5cf6", strokeWidth: 2, name: "Requests" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "responseTime", stroke: "#ef4444", strokeWidth: 2, name: "Response Time (ms)" })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Error Rate Trend" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: historicalData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time", tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "errors", fill: "#ef4444", name: "Errors" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "System Health Radar" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(RadarChart, { data: radarData, children: [_jsx(PolarGrid, {}), _jsx(PolarAngleAxis, { dataKey: "metric" }), _jsx(PolarRadiusAxis, { angle: 90, domain: [0, 100] }), _jsx(Radar, { name: "Health", dataKey: "value", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.6 }), _jsx(Tooltip, {})] }) })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "System Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Operating System" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "Linux Ubuntu 22.04" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Kernel Version" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "5.15.0-91-generic" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Total Memory" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "64 GB" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Total Disk Space" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "1 TB SSD" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "CPU Cores" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "16 cores (32 threads)" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Architecture" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "x86_64" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Uptime" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "45 days, 12 hours" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Load Average" }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: "2.14, 1.98, 1.82" })] })] })] }), _jsx("div", { className: "mt-6 flex justify-end", children: _jsxs("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export Metrics Data"] }) })] }));
}
