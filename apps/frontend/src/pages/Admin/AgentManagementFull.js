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
import { Bot, Play, Pause, StopCircle, RefreshCw, Settings, Eye, Trash2, Plus, Activity, AlertCircle, CheckCircle, XCircle, } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export default function AgentManagementFull() {
    var _this = this;
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(null), selectedAgent = _c[0], setSelectedAgent = _c[1];
    var _d = useState([]), performanceData = _d[0], setPerformanceData = _d[1];
    useEffect(function () {
        loadAgents();
        var interval = setInterval(loadAgents, 10000);
        return function () { return clearInterval(interval); };
    }, []);
    var loadAgents = function () { return __awaiter(_this, void 0, void 0, function () {
        var mockAgents, perfData, error_1;
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
                    mockAgents = [
                        {
                            id: '1',
                            name: 'ChatBot Pro',
                            type: 'chatbot',
                            status: 'running',
                            uptime: '12d 5h 32m',
                            requestsHandled: 145234,
                            avgResponseTime: 342,
                            errorRate: 0.12,
                            lastActive: new Date(),
                            cpuUsage: 45,
                            memoryUsage: 512,
                        },
                        {
                            id: '2',
                            name: 'Research Assistant',
                            type: 'assistant',
                            status: 'running',
                            uptime: '8d 2h 15m',
                            requestsHandled: 8542,
                            avgResponseTime: 1240,
                            errorRate: 0.05,
                            lastActive: new Date(Date.now() - 5 * 60000),
                            cpuUsage: 32,
                            memoryUsage: 768,
                        },
                        {
                            id: '3',
                            name: 'Workflow Automation',
                            type: 'automation',
                            status: 'stopped',
                            uptime: '0m',
                            requestsHandled: 2341,
                            avgResponseTime: 189,
                            errorRate: 0.0,
                            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
                            cpuUsage: 0,
                            memoryUsage: 0,
                        },
                        {
                            id: '4',
                            name: 'Analytics Engine',
                            type: 'analytics',
                            status: 'error',
                            uptime: '0m',
                            requestsHandled: 45123,
                            avgResponseTime: 523,
                            errorRate: 15.2,
                            lastActive: new Date(Date.now() - 30 * 60000),
                            cpuUsage: 0,
                            memoryUsage: 0,
                        },
                        {
                            id: '5',
                            name: 'Code Assistant',
                            type: 'assistant',
                            status: 'starting',
                            uptime: '0m',
                            requestsHandled: 0,
                            avgResponseTime: 0,
                            errorRate: 0,
                            lastActive: new Date(),
                            cpuUsage: 12,
                            memoryUsage: 128,
                        },
                    ];
                    setAgents(mockAgents);
                    perfData = Array.from({ length: 24 }, function (_, i) { return ({
                        time: "".concat(i, ":00"),
                        requests: Math.floor(Math.random() * 1000 + 500),
                        responseTime: Math.floor(Math.random() * 500 + 200),
                        errors: Math.floor(Math.random() * 20),
                    }); });
                    setPerformanceData(perfData);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading agents:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var getStatusBadge = function (status) {
        var badges = {
            running: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            stopped: { bg: 'bg-gray-100', text: 'text-gray-800', icon: StopCircle },
            error: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
            starting: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
        };
        return badges[status];
    };
    var getTypeBadge = function (type) {
        var badges = {
            chatbot: 'bg-blue-100 text-blue-800',
            assistant: 'bg-purple-100 text-purple-800',
            automation: 'bg-green-100 text-green-800',
            analytics: 'bg-orange-100 text-orange-800',
        };
        return badges[type];
    };
    var handleAgentAction = function (agentId, action) {
        console.log("".concat(action, " agent ").concat(agentId));
        // Implement agent actions
    };
    var formatTimestamp = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / 60000);
        if (minutes < 1)
            return 'Just now';
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        var hours = Math.floor(minutes / 60);
        if (hours < 24)
            return "".concat(hours, "h ago");
        var days = Math.floor(hours / 24);
        return "".concat(days, "d ago");
    };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Bot, { className: "h-8 w-8 mr-3 text-blue-600" }), "Agent Management"] }), _jsx("p", { className: "text-gray-600", children: "Monitor and control AI agents across the platform" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: loadAgents, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Deploy Agent"] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Agents" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: agents.length })] }), _jsx(Bot, { className: "h-12 w-12 text-blue-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Running" }), _jsx("p", { className: "text-3xl font-bold text-green-600", children: agents.filter(function (a) { return a.status === 'running'; }).length })] }), _jsx(Play, { className: "h-12 w-12 text-green-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "With Errors" }), _jsx("p", { className: "text-3xl font-bold text-red-600", children: agents.filter(function (a) { return a.status === 'error'; }).length })] }), _jsx(AlertCircle, { className: "h-12 w-12 text-red-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Requests" }), _jsx("p", { className: "text-3xl font-bold text-purple-600", children: agents.reduce(function (sum, a) { return sum + a.requestsHandled; }, 0).toLocaleString() })] }), _jsx(Activity, { className: "h-12 w-12 text-purple-500 opacity-20" })] }) })] }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden mb-8", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Agent" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Uptime" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Requests" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Response Time" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Resources" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: agents.map(function (agent) {
                                    var statusBadge = getStatusBadge(agent.status);
                                    var StatusIcon = statusBadge.icon;
                                    return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center", children: _jsx(Bot, { className: "h-6 w-6 text-blue-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: agent.name }), _jsxs("div", { className: "text-xs text-gray-500", children: ["ID: ", agent.id] })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(getTypeBadge(agent.type)), children: agent.type }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(statusBadge.bg, " ").concat(statusBadge.text), children: [_jsx(StatusIcon, { className: "h-3 w-3 mr-1" }), agent.status] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: agent.uptime }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: agent.requestsHandled.toLocaleString() }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsxs("div", { className: "text-sm text-gray-900", children: [agent.avgResponseTime, "ms"] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Error: ", agent.errorRate, "%"] })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-xs text-gray-600", children: [_jsxs("div", { children: ["CPU: ", agent.cpuUsage, "%"] }), _jsxs("div", { children: ["Mem: ", agent.memoryUsage, "MB"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex items-center justify-end space-x-2", children: [agent.status === 'running' ? (_jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'stop'); }, className: "text-yellow-600 hover:text-yellow-900", title: "Stop", children: _jsx(Pause, { className: "h-4 w-4" }) })) : (_jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'start'); }, className: "text-green-600 hover:text-green-900", title: "Start", children: _jsx(Play, { className: "h-4 w-4" }) })), _jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'restart'); }, className: "text-blue-600 hover:text-blue-900", title: "Restart", children: _jsx(RefreshCw, { className: "h-4 w-4" }) }), _jsx("button", { onClick: function () { return setSelectedAgent(agent); }, className: "text-purple-600 hover:text-purple-900", title: "View Details", children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx("button", { className: "text-gray-600 hover:text-gray-900", title: "Settings", children: _jsx(Settings, { className: "h-4 w-4" }) }), _jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'delete'); }, className: "text-red-600 hover:text-red-900", title: "Delete", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, agent.id));
                                }) })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Request Volume" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: performanceData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "requests", stroke: "#3b82f6", strokeWidth: 2 })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Response Time & Errors" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: performanceData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time" }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "responseTime", stroke: "#10b981", strokeWidth: 2, name: "Response Time (ms)" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "errors", stroke: "#ef4444", strokeWidth: 2, name: "Errors" })] }) })] })] })] }));
}
