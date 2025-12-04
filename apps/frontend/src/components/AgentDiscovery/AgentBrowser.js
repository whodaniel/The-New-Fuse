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
/**
 * Agent Browser Component
 *
 * Real-time agent discovery and capability browsing interface
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Activity, Cpu, CheckCircle, XCircle, Zap, TrendingUp, Clock, DollarSign, } from 'lucide-react';
export var AgentBrowser = function () {
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState(false), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), searchQuery = _c[0], setSearchQuery = _c[1];
    var _d = useState(null), selectedAgent = _d[0], setSelectedAgent = _d[1];
    var _e = useState({
        semanticSearch: true,
        sortBy: 'relevance',
        limit: 50,
    }), filters = _e[0], setFilters = _e[1];
    var _f = useState(false), showFilters = _f[0], setShowFilters = _f[1];
    // Fetch agents
    var fetchAgents = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var query, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    query = __assign(__assign({}, filters), { capability: searchQuery || undefined });
                    return [4 /*yield*/, fetch('/api/agents/discover', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(query),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setAgents(data.data.agents || []);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to fetch agents:', error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [searchQuery, filters]);
    // Fetch on mount and when filters change
    useEffect(function () {
        fetchAgents();
    }, [fetchAgents]);
    // Real-time updates (would connect to WebSocket)
    useEffect(function () {
        var interval = setInterval(fetchAgents, 30000); // Poll every 30s
        return function () { return clearInterval(interval); };
    }, [fetchAgents]);
    var getStatusColor = function (status) {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'busy':
                return 'bg-yellow-500';
            case 'idle':
                return 'bg-blue-500';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };
    var getStatusIcon = function (isHealthy) {
        return isHealthy ? (_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" })) : (_jsx(XCircle, { className: "w-4 h-4 text-red-500" }));
    };
    var formatUptime = function (seconds) {
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        return "".concat(hours, "h ").concat(minutes, "m");
    };
    var formatCost = function (pricing) {
        if (!pricing)
            return 'Free';
        if (pricing.perInvocation) {
            return "$".concat(pricing.perInvocation.toFixed(4), "/call");
        }
        if (pricing.perMinute) {
            return "$".concat(pricing.perMinute.toFixed(4), "/min");
        }
        if (pricing.perToken) {
            return "$".concat(pricing.perToken.toFixed(6), "/token");
        }
        return 'Free';
    };
    return (_jsxs("div", { className: "flex h-screen bg-gray-50", children: [_jsxs("div", { className: "w-1/3 bg-white border-r border-gray-200 flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search capabilities (e.g., 'review Python code')...", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsxs("button", { onClick: function () { return setShowFilters(!showFilters); }, className: "flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900", children: [_jsx(Filter, { className: "w-4 h-4" }), "Filters"] }), _jsxs("span", { className: "text-sm text-gray-500", children: [agents.length, " agents"] })] }), showFilters && (_jsxs("div", { className: "mt-4 p-4 bg-gray-50 rounded-lg space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Max CPU Usage" }), _jsx("input", { type: "number", min: "0", max: "100", value: filters.maxCpuUsage || '', onChange: function (e) {
                                                    return setFilters(__assign(__assign({}, filters), { maxCpuUsage: Number(e.target.value) || undefined }));
                                                }, className: "w-full px-3 py-1 text-sm border border-gray-300 rounded", placeholder: "e.g., 80" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Min Success Rate" }), _jsx("input", { type: "number", min: "0", max: "1", step: "0.1", value: filters.minSuccessRate || '', onChange: function (e) {
                                                    return setFilters(__assign(__assign({}, filters), { minSuccessRate: Number(e.target.value) || undefined }));
                                                }, className: "w-full px-3 py-1 text-sm border border-gray-300 rounded", placeholder: "e.g., 0.9" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Sort By" }), _jsxs("select", { value: filters.sortBy, onChange: function (e) {
                                                    return setFilters(__assign(__assign({}, filters), { sortBy: e.target.value }));
                                                }, className: "w-full px-3 py-1 text-sm border border-gray-300 rounded", children: [_jsx("option", { value: "relevance", children: "Relevance" }), _jsx("option", { value: "load", children: "Load" }), _jsx("option", { value: "successRate", children: "Success Rate" }), _jsx("option", { value: "responseTime", children: "Response Time" }), _jsx("option", { value: "uptime", children: "Uptime" })] })] })] }))] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: loading ? (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) })) : (_jsx("div", { className: "divide-y divide-gray-200", children: agents.map(function (agent) { return (_jsxs("div", { onClick: function () { return setSelectedAgent(agent); }, className: "p-4 cursor-pointer hover:bg-gray-50 transition-colors ".concat((selectedAgent === null || selectedAgent === void 0 ? void 0 : selectedAgent.registration.agentId) === agent.registration.agentId
                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                    : ''), children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 truncate", children: agent.registration.name }), _jsx("span", { className: "w-2 h-2 rounded-full ".concat(getStatusColor(agent.status)) })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1 line-clamp-2", children: agent.registration.description || 'No description' })] }), agent.score !== undefined && (_jsxs("div", { className: "ml-2 text-xs font-semibold text-blue-600", children: [(agent.score * 100).toFixed(0), "%"] }))] }), _jsxs("div", { className: "flex items-center gap-4 mt-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-xs text-gray-500", children: [_jsx(Activity, { className: "w-3 h-3" }), (agent.load * 100).toFixed(0), "%"] }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-gray-500", children: [_jsx(TrendingUp, { className: "w-3 h-3" }), (agent.metrics.successRate * 100).toFixed(0), "%"] }), getStatusIcon(agent.metrics.isHealthy)] }), _jsxs("div", { className: "flex flex-wrap gap-1 mt-2", children: [agent.registration.capabilities.slice(0, 3).map(function (cap, idx) { return (_jsx("span", { className: "px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded", children: cap.name }, idx)); }), agent.registration.capabilities.length > 3 && (_jsxs("span", { className: "px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded", children: ["+", agent.registration.capabilities.length - 3] }))] })] }, agent.registration.agentId)); }) })) })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: selectedAgent ? (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 mb-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: selectedAgent.registration.name }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: selectedAgent.registration.agentId }), selectedAgent.registration.description && (_jsx("p", { className: "text-gray-700 mt-3", children: selectedAgent.registration.description }))] }), _jsxs("div", { className: "flex flex-col items-end gap-2", children: [_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold ".concat(selectedAgent.status === 'online'
                                                        ? 'bg-green-100 text-green-800'
                                                        : selectedAgent.status === 'busy'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'), children: selectedAgent.status.toUpperCase() }), _jsxs("span", { className: "text-xs text-gray-500", children: ["v", selectedAgent.registration.version] })] })] }), selectedAgent.registration.groups && selectedAgent.registration.groups.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: selectedAgent.registration.groups.map(function (group, idx) { return (_jsx("span", { className: "px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium", children: group }, idx)); }) }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 mb-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Health Metrics" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(Cpu, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "CPU Usage" })] }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [selectedAgent.metrics.cpuUsage.toFixed(1), "%"] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(Activity, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Load" })] }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [(selectedAgent.load * 100).toFixed(1), "%"] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Success Rate" })] }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [(selectedAgent.metrics.successRate * 100).toFixed(1), "%"] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Avg Response" })] }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [selectedAgent.metrics.avgResponseTime, "ms"] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(Zap, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Active Tasks" })] }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: selectedAgent.metrics.activeTasks })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Total Tasks" })] }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: selectedAgent.metrics.totalTasks })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(XCircle, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Failed Tasks" })] }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: selectedAgent.metrics.failedTasks })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-1", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Uptime" })] }), _jsx("div", { className: "text-lg font-bold text-gray-900", children: formatUptime(selectedAgent.metrics.uptime) })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Capabilities" }), _jsx("div", { className: "space-y-4", children: selectedAgent.registration.capabilities.map(function (capability, idx) {
                                        var _a, _b;
                                        return (_jsx("div", { className: "border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: capability.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: capability.description }), (capability.languages || capability.frameworks) && (_jsxs("div", { className: "flex flex-wrap gap-2 mt-3", children: [(_a = capability.languages) === null || _a === void 0 ? void 0 : _a.map(function (lang, i) { return (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium", children: lang }, i)); }), (_b = capability.frameworks) === null || _b === void 0 ? void 0 : _b.map(function (fw, i) { return (_jsx("span", { className: "px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium", children: fw }, i)); })] }))] }), _jsxs("div", { className: "ml-4 text-right", children: [_jsxs("div", { className: "text-sm font-semibold text-gray-900", children: [(capability.confidence * 100).toFixed(0), "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "confidence" }), capability.pricing && (_jsxs("div", { className: "mt-2 flex items-center gap-1 text-sm text-gray-700", children: [_jsx(DollarSign, { className: "w-3 h-3" }), formatCost(capability.pricing)] })), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["v", capability.version] })] })] }) }, idx));
                                    }) })] })] })) : (_jsx("div", { className: "flex items-center justify-center h-full text-gray-500", children: _jsxs("div", { className: "text-center", children: [_jsx(Search, { className: "w-16 h-16 mx-auto mb-4 text-gray-400" }), _jsx("p", { className: "text-lg", children: "Select an agent to view details" })] }) })) })] }));
};
export default AgentBrowser;
