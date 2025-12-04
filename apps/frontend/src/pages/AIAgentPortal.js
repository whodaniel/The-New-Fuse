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
import { Link } from 'react-router-dom';
import { Bot, Plus, Settings, Activity, Zap, Brain, MessageSquare, BarChart3, Search, Filter, Grid, List } from 'lucide-react';
var AIAgentPortal = function () {
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), searchTerm = _c[0], setSearchTerm = _c[1];
    var _d = useState('all'), filterStatus = _d[0], setFilterStatus = _d[1];
    var _e = useState('grid'), viewMode = _e[0], setViewMode = _e[1];
    useEffect(function () {
        fetchAgents();
    }, []);
    var fetchAgents = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 7]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/agents', {
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('token')),
                                'Content-Type': 'application/json'
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setAgents(data);
                    return [3 /*break*/, 4];
                case 3:
                    // Mock data for development
                    setAgents([
                        {
                            id: '1',
                            name: 'Customer Support Agent',
                            description: 'Handles customer inquiries and support tickets',
                            type: 'Support',
                            status: 'active',
                            capabilities: ['Natural Language Processing', 'Ticket Management', 'FAQ Assistance'],
                            lastActive: '2 minutes ago',
                            performance: 95,
                            conversations: 1247
                        },
                        {
                            id: '2',
                            name: 'Sales Assistant',
                            description: 'Assists with lead qualification and sales processes',
                            type: 'Sales',
                            status: 'active',
                            capabilities: ['Lead Scoring', 'Product Recommendations', 'CRM Integration'],
                            lastActive: '5 minutes ago',
                            performance: 88,
                            conversations: 892
                        },
                        {
                            id: '3',
                            name: 'Content Creator',
                            description: 'Generates marketing content and social media posts',
                            type: 'Marketing',
                            status: 'training',
                            capabilities: ['Content Generation', 'SEO Optimization', 'Brand Voice'],
                            lastActive: '1 hour ago',
                            performance: 76,
                            conversations: 234
                        }
                    ]);
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error('Error fetching agents:', error_1);
                    return [3 /*break*/, 7];
                case 6:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var filteredAgents = agents.filter(function (agent) {
        var matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesFilter = filterStatus === 'all' || agent.status === filterStatus;
        return matchesSearch && matchesFilter;
    });
    var getStatusColor = function (status) {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'inactive': return 'text-gray-600 bg-gray-100';
            case 'training': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    var AgentCard = function (_a) {
        var agent = _a.agent;
        return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "p-2 bg-blue-100 dark:bg-blue-900 rounded-lg", children: _jsx(Bot, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: agent.name }), _jsx("span", { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full ".concat(getStatusColor(agent.status)), children: agent.status })] })] }), _jsx("div", { className: "flex space-x-2", children: _jsx(Link, { to: "/agents/".concat(agent.id), className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx(Settings, { className: "w-4 h-4" }) }) })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-4", children: agent.description }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1", children: [_jsx("span", { children: "Performance" }), _jsxs("span", { children: [agent.performance, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: "".concat(agent.performance, "%") } }) })] }), _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), _jsxs("span", { children: [agent.conversations, " conversations"] })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Activity, { className: "w-4 h-4" }), _jsx("span", { children: agent.lastActive })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [agent.capabilities.slice(0, 2).map(function (capability, index) { return (_jsx("span", { className: "px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded", children: capability }, index)); }), agent.capabilities.length > 2 && (_jsxs("span", { className: "px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded", children: ["+", agent.capabilities.length - 2, " more"] }))] })] }));
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300", children: "Loading AI Agents..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3", children: [_jsx(Brain, { className: "w-8 h-8 text-blue-600" }), _jsx("span", { children: "AI Agent Portal" })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mt-2", children: "Manage and monitor your AI agents" })] }), _jsxs(Link, { to: "/agents/new", className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Create Agent" })] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search agents...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Filter, { className: "w-4 h-4 text-gray-400" }), _jsxs("select", { value: filterStatus, onChange: function (e) { return setFilterStatus(e.target.value); }, className: "border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "training", children: "Training" })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: function () { return setViewMode('grid'); }, className: "p-2 rounded-lg ".concat(viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'), children: _jsx(Grid, { className: "w-4 h-4" }) }), _jsx("button", { onClick: function () { return setViewMode('list'); }, className: "p-2 rounded-lg ".concat(viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'), children: _jsx(List, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Agents" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: agents.length })] }), _jsx(Bot, { className: "w-8 h-8 text-blue-600" })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Active Agents" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: agents.filter(function (a) { return a.status === 'active'; }).length })] }), _jsx(Zap, { className: "w-8 h-8 text-green-600" })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Conversations" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: agents.reduce(function (sum, agent) { return sum + agent.conversations; }, 0) })] }), _jsx(MessageSquare, { className: "w-8 h-8 text-purple-600" })] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Avg Performance" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: [Math.round(agents.reduce(function (sum, agent) { return sum + agent.performance; }, 0) / agents.length), "%"] })] }), _jsx(BarChart3, { className: "w-8 h-8 text-orange-600" })] }) })] }), filteredAgents.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Bot, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: "No agents found" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-4", children: searchTerm || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Get started by creating your first AI agent.' }), !searchTerm && filterStatus === 'all' && (_jsxs(Link, { to: "/agents/new", className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Create Your First Agent" })] }))] })) : (_jsx("div", { className: viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                            : 'space-y-4', children: filteredAgents.map(function (agent) { return (_jsx(AgentCard, { agent: agent }, agent.id)); }) }))] })] }));
};
export default AIAgentPortal;
