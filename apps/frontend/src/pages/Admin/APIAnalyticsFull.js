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
import { Activity, TrendingUp, TrendingDown, RefreshCw, Download, Globe, Zap, AlertTriangle, Clock, } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
export default function APIAnalyticsFull() {
    var _this = this;
    var _a = useState(null), metrics = _a[0], setMetrics = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState('24h'), timeRange = _c[0], setTimeRange = _c[1];
    var requestData = Array.from({ length: 24 }, function (_, i) { return ({
        time: "".concat(i, ":00"),
        requests: Math.floor(Math.random() * 2000 + 1000),
        errors: Math.floor(Math.random() * 50),
        responseTime: Math.floor(Math.random() * 200 + 100),
    }); });
    var endpointData = [
        { endpoint: '/api/auth/login', requests: 12543, avgTime: 145, errors: 23 },
        { endpoint: '/api/users', requests: 8932, avgTime: 89, errors: 12 },
        { endpoint: '/api/agents', requests: 7821, avgTime: 234, errors: 45 },
        { endpoint: '/api/chat/messages', requests: 15234, avgTime: 312, errors: 67 },
        { endpoint: '/api/workspaces', requests: 4521, avgTime: 123, errors: 8 },
    ];
    var statusCodeData = [
        { name: '200 OK', value: 145234, color: '#10b981' },
        { name: '201 Created', value: 12543, color: '#3b82f6' },
        { name: '400 Bad Request', value: 234, color: '#f59e0b' },
        { name: '401 Unauthorized', value: 156, color: '#ef4444' },
        { name: '500 Server Error', value: 89, color: '#dc2626' },
    ];
    var methodData = [
        { name: 'GET', value: 98234 },
        { name: 'POST', value: 45678 },
        { name: 'PUT', value: 12345 },
        { name: 'DELETE', value: 5432 },
        { name: 'PATCH', value: 3456 },
    ];
    var COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    useEffect(function () {
        loadMetrics();
        var interval = setInterval(loadMetrics, 30000);
        return function () { return clearInterval(interval); };
    }, [timeRange]);
    var loadMetrics = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    _a.sent();
                    setMetrics({
                        totalRequests: 165234,
                        successfulRequests: 162345,
                        failedRequests: 2889,
                        avgResponseTime: 234,
                        p95ResponseTime: 567,
                        requestsPerSecond: 1.92,
                        errorRate: 1.75,
                        uptime: 99.98,
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading metrics:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Activity, { className: "h-8 w-8 mr-3 text-blue-600" }), "API Analytics"] }), _jsx("p", { className: "text-gray-600", children: "Monitor API usage, performance, and health" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("select", { value: timeRange, onChange: function (e) { return setTimeRange(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "1h", children: "Last Hour" }), _jsx("option", { value: "24h", children: "Last 24 Hours" }), _jsx("option", { value: "7d", children: "Last 7 Days" }), _jsx("option", { value: "30d", children: "Last 30 Days" })] }), _jsxs("button", { onClick: loadMetrics, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export Report"] })] })] }) }), metrics && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Globe, { className: "h-8 w-8 text-blue-500" }), _jsx(TrendingUp, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.totalRequests.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Requests" }), _jsx("div", { className: "mt-2 text-xs text-green-600 flex items-center", children: "+12% from last period" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Zap, { className: "h-8 w-8 text-green-500" }), _jsx(TrendingDown, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.avgResponseTime }), _jsx("div", { className: "text-sm text-gray-600", children: "Avg Response Time (ms)" }), _jsxs("div", { className: "mt-2 text-xs text-gray-600", children: ["P95: ", metrics.p95ResponseTime, "ms"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(AlertTriangle, { className: "h-8 w-8 text-red-500" }), _jsx(TrendingDown, { className: "h-5 w-5 text-green-500" })] }), _jsxs("div", { className: "text-3xl font-bold text-gray-900", children: [metrics.errorRate, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Error Rate" }), _jsxs("div", { className: "mt-2 text-xs text-red-600", children: [metrics.failedRequests.toLocaleString(), " failed requests"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Clock, { className: "h-8 w-8 text-purple-500" }), _jsx(TrendingUp, { className: "h-5 w-5 text-green-500" })] }), _jsxs("div", { className: "text-3xl font-bold text-gray-900", children: [metrics.uptime, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "API Uptime" }), _jsxs("div", { className: "mt-2 text-xs text-gray-600", children: [metrics.requestsPerSecond, " req/s"] })] })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Request Volume Over Time" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: requestData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "requests", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.6, name: "Requests" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Response Time & Errors" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: requestData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time" }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "responseTime", stroke: "#10b981", strokeWidth: 2, name: "Response Time (ms)" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "errors", stroke: "#ef4444", strokeWidth: 2, name: "Errors" })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "HTTP Status Codes" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: statusCodeData, cx: "50%", cy: "50%", labelLine: false, label: function (_a) {
                                                var name = _a.name, percent = _a.percent;
                                                return "".concat(name, " ").concat((percent * 100).toFixed(0), "%");
                                            }, outerRadius: 100, dataKey: "value", children: statusCodeData.map(function (entry, index) { return (_jsx(Cell, { fill: entry.color }, "cell-".concat(index))); }) }), _jsx(Tooltip, {})] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "HTTP Methods" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: methodData, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "name", type: "category" }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "value", fill: "#3b82f6" })] }) })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Top API Endpoints" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Endpoint" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Requests" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Avg Response Time" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Errors" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Error Rate" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: endpointData.map(function (endpoint, index) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900 font-mono", children: endpoint.endpoint }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-900", children: endpoint.requests.toLocaleString() }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm text-gray-900", children: [endpoint.avgTime, "ms"] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-red-600", children: endpoint.errors }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm text-gray-900", children: [((endpoint.errors / endpoint.requests) * 100).toFixed(2), "%"] }) })] }, index)); }) })] }) })] })] }));
}
