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
import { useState, useEffect } from 'react';
import { Play, Pause, Pencil, BarChart, Clock, CheckCircle, AlertTriangle, XCircle, Cpu, Cloud, User, Cog } from 'lucide-react';
import { Link } from 'react-router-dom';
var AgentDashboard = function () {
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), searchTerm = _c[0], setSearchTerm = _c[1];
    var _d = useState('all'), statusFilter = _d[0], setStatusFilter = _d[1];
    var _e = useState('all'), typeFilter = _e[0], setTypeFilter = _e[1];
    var _f = useState('lastActive'), sortBy = _f[0], setSortBy = _f[1];
    var _g = useState(false), showFilters = _g[0], setShowFilters = _g[1];
    // Mock data for development
    var mockAgents = [
        {
            id: '1',
            name: 'Customer Support Bot',
            description: 'Handles customer inquiries and support tickets with natural language processing.',
            type: 'conversational',
            status: 'active',
            lastActive: '2024-01-15T10:30:00Z',
            totalTasks: 1247,
            successRate: 94.5,
            averageResponseTime: 1.2,
            model: 'GPT-4',
            deployment: 'cloud',
            owner: 'Sarah Johnson',
            createdAt: '2024-01-01T00:00:00Z',
            tags: ['customer-service', 'nlp', 'production'],
            metrics: {
                tasksToday: 45,
                tasksThisWeek: 312,
                errorRate: 5.5,
                uptime: 99.2
            }
        },
        {
            id: '2',
            name: 'Data Analyzer Pro',
            description: 'Automated data analysis and report generation for business intelligence.',
            type: 'data-analysis',
            status: 'active',
            lastActive: '2024-01-15T09:45:00Z',
            totalTasks: 856,
            successRate: 98.1,
            averageResponseTime: 3.7,
            model: 'Claude-3',
            deployment: 'hybrid',
            owner: 'Mike Chen',
            createdAt: '2024-01-05T00:00:00Z',
            tags: ['analytics', 'reporting', 'bi'],
            metrics: {
                tasksToday: 12,
                tasksThisWeek: 89,
                errorRate: 1.9,
                uptime: 97.8
            }
        },
        {
            id: '3',
            name: 'Content Creator',
            description: 'Generates marketing content, blog posts, and social media updates.',
            type: 'content-generation',
            status: 'inactive',
            lastActive: '2024-01-14T16:20:00Z',
            totalTasks: 423,
            successRate: 91.2,
            averageResponseTime: 2.1,
            model: 'GPT-3.5',
            deployment: 'cloud',
            owner: 'Emma Davis',
            createdAt: '2024-01-10T00:00:00Z',
            tags: ['content', 'marketing', 'social-media'],
            metrics: {
                tasksToday: 0,
                tasksThisWeek: 67,
                errorRate: 8.8,
                uptime: 95.4
            }
        },
        {
            id: '4',
            name: 'Workflow Automator',
            description: 'Automates repetitive business processes and task workflows.',
            type: 'task-automation',
            status: 'error',
            lastActive: '2024-01-15T08:15:00Z',
            totalTasks: 2134,
            successRate: 89.7,
            averageResponseTime: 0.8,
            model: 'Custom Model',
            deployment: 'local',
            owner: 'Alex Rodriguez',
            createdAt: '2023-12-20T00:00:00Z',
            tags: ['automation', 'workflows', 'rpa'],
            metrics: {
                tasksToday: 8,
                tasksThisWeek: 156,
                errorRate: 10.3,
                uptime: 87.2
            }
        }
    ];
    useEffect(function () {
        fetchAgents();
    }, []);
    var fetchAgents = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 7]);
                    return [4 /*yield*/, fetch('/api/dashboard/agents')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setAgents(data);
                    return [3 /*break*/, 4];
                case 3:
                    // Use mock data as fallback
                    setAgents(mockAgents);
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error('Failed to fetch agents:', error_1);
                    setAgents(mockAgents);
                    return [3 /*break*/, 7];
                case 6:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'active':
                return _jsx(CheckCircle, { className: "w-5 h-5 text-green-500" });
            case 'inactive':
                return _jsx(Pause, { className: "w-5 h-5 text-gray-500" });
            case 'error':
                return _jsx(XCircle, { className: "w-5 h-5 text-red-500" });
            case 'training':
                return _jsx(Clock, { className: "w-5 h-5 text-yellow-500" });
            default:
                return _jsx(AlertTriangle, { className: "w-5 h-5 text-gray-500" });
        }
    };
    var getTypeIcon = function (type) {
        switch (type) {
            case 'conversational':
                return _jsx(User, { className: "w-5 h-5" });
            case 'task-automation':
                return _jsx(Cog, { className: "w-5 h-5" });
            case 'data-analysis':
                return _jsx(BarChart, { className: "w-5 h-5" });
            case 'content-generation':
                return _jsx(Pencil, { className: "w-5 h-5" });
            default:
                return _jsx(Cpu, { className: "w-5 h-5" });
        }
    };
    var getDeploymentIcon = function (deployment) {
        switch (deployment) {
            case 'cloud':
                return _jsx(Cloud, { className: "w-4 h-4" });
            case 'local':
                return _jsx(Cpu, { className: "w-4 h-4" });
            case 'hybrid':
                return _jsxs("div", { className: "flex space-x-1", children: [_jsx(Cloud, { className: "w-3 h-3" }), _jsx(Cpu, { className: "w-3 h-3" })] });
            default:
                return _jsx(Cpu, { className: "w-4 h-4" });
        }
    };
    var formatTimeAgo = function (dateString) {
        var date = new Date(dateString);
        var now = new Date();
        var diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        if (diffInMinutes < 60) {
            return "".concat(diffInMinutes, "m ago");
        }
        else if (diffInMinutes < 1440) {
            return "".concat(Math.floor(diffInMinutes / 60), "h ago");
        }
        else {
            return "".concat(Math.floor(diffInMinutes / 1440), "d ago");
        }
    };
    var filteredAgents = agents.filter(function (agent) {
        var matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.tags.some(function (tag) { return tag.toLowerCase().includes(searchTerm.toLowerCase()); });
        var matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
        var matchesType = typeFilter === 'all' || agent.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });
    var sortedAgents = __spreadArray([], filteredAgents, true).sort(function (a, b) {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'status':
                return a.status.localeCompare(b.status);
            case 'successRate':
                return b.successRate - a.successRate;
            case 'totalTasks':
                return b.totalTasks - a.totalTasks;
            case 'lastActive':
            default:
                return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        }
    });
    var handleAgentAction = function (agentId, action) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/dashboard/agents/".concat(agentId, "/").concat(action), {
                            method: 'POST'
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        fetchAgents(); // Refresh the list
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Failed to ".concat(action, " agent:"), error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading agent dashboard..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Agent Dashboard" }), _jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-300", children: "Monitor and manage your AI agents" })] }), _jsxs(Link, { to: "/dashboard/agents/new", className: "inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(PlusIcon, { className: "w-5 h-5 mr-2" }), "Create Agent"] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-blue-100 dark:bg-blue-900 rounded-lg", children: _jsx(CpuChipIcon, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Total Agents" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: agents.length })] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-green-100 dark:bg-green-900 rounded-lg", children: _jsx(CheckCircleIcon, { className: "w-6 h-6 text-green-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Active" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: agents.filter(function (a) { return a.status === 'active'; }).length })] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg", children: _jsx(ChartBarIcon, { className: "w-6 h-6 text-yellow-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Avg Success Rate" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: [agents.length > 0 ? Math.round(agents.reduce(function (sum, a) { return sum + a.successRate; }, 0) / agents.length) : 0, "%"] })] })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-purple-100 dark:bg-purple-900 rounded-lg", children: _jsx(ClockIcon, { className: "w-6 h-6 text-purple-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Tasks Today" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: agents.reduce(function (sum, a) { return sum + a.metrics.tasksToday; }, 0) })] })] }) })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search agents...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" })] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { value: statusFilter, onChange: function (e) { return setStatusFilter(e.target.value); }, className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white", title: "Filter by status", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "error", children: "Error" }), _jsx("option", { value: "training", children: "Training" })] }), _jsxs("select", { value: typeFilter, onChange: function (e) { return setTypeFilter(e.target.value); }, className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white", title: "Filter by type", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "conversational", children: "Conversational" }), _jsx("option", { value: "task-automation", children: "Task Automation" }), _jsx("option", { value: "data-analysis", children: "Data Analysis" }), _jsx("option", { value: "content-generation", children: "Content Generation" })] }), _jsxs("select", { value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white", title: "Sort by", children: [_jsx("option", { value: "lastActive", children: "Last Active" }), _jsx("option", { value: "name", children: "Name" }), _jsx("option", { value: "status", children: "Status" }), _jsx("option", { value: "successRate", children: "Success Rate" }), _jsx("option", { value: "totalTasks", children: "Total Tasks" })] }), _jsx("button", { onClick: function () { return setShowFilters(!showFilters); }, className: "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", title: "Toggle Filters", children: _jsx(FunnelIcon, { className: "w-5 h-5" }) })] })] }) }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6", children: sortedAgents.map(function (agent) { return (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "p-2 bg-gray-100 dark:bg-gray-700 rounded-lg", children: getTypeIcon(agent.type) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: agent.name }), _jsxs("div", { className: "flex items-center space-x-2", children: [getStatusIcon(agent.status), _jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400 capitalize", children: agent.status })] })] })] }), _jsx("div", { className: "relative", children: _jsx("button", { className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded", title: "Agent Options", children: _jsx(EllipsisVerticalIcon, { className: "w-5 h-5 text-gray-500" }) }) })] }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2", children: agent.description }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Success Rate" }), _jsxs("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [agent.successRate, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Total Tasks" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: agent.totalTasks.toLocaleString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Avg Response" }), _jsxs("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [agent.averageResponseTime, "s"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Uptime" }), _jsxs("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [agent.metrics.uptime, "%"] })] })] }), _jsxs("div", { className: "flex flex-wrap gap-1 mb-4", children: [agent.tags.slice(0, 3).map(function (tag) { return (_jsx("span", { className: "px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full", children: tag }, tag)); }), agent.tags.length > 3 && (_jsxs("span", { className: "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full", children: ["+", agent.tags.length - 3] }))] }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400", children: [getDeploymentIcon(agent.deployment), _jsx("span", { children: agent.model })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [agent.status === 'active' && (_jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'pause'); }, className: "p-1 text-gray-500 hover:text-yellow-600 transition-colors", title: "Pause Agent", children: _jsx(Pause, { className: "w-4 h-4" }) })), agent.status === 'inactive' && (_jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'start'); }, className: "p-1 text-gray-500 hover:text-green-600 transition-colors", title: "Start Agent", children: _jsx(Play, { className: "w-4 h-4" }) })), _jsx(Link, { to: "/dashboard/agents/".concat(agent.id), className: "p-1 text-gray-500 hover:text-blue-600 transition-colors", title: "View Details", children: _jsx(ChartBar, { className: "w-4 h-4" }) }), _jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'edit'); }, className: "p-1 text-gray-500 hover:text-blue-600 transition-colors", title: "Edit Agent", children: _jsx(Pencil, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "mt-2 text-xs text-gray-500 dark:text-gray-400", children: ["Last active: ", formatTimeAgo(agent.lastActive)] })] }) }, agent.id)); }) }), sortedAgents.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(CpuChipIcon, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: "No agents found" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-4", children: searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by creating your first AI agent' }), _jsxs(Link, { to: "/dashboard/agents/new", className: "inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(PlusIcon, { className: "w-5 h-5 mr-2" }), "Create Agent"] })] }))] }) }));
};
export default AgentDashboard;
