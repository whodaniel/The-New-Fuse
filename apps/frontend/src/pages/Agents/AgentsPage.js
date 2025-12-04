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
import { Link } from 'react-router-dom';
export default function AgentsPage() {
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState('grid'), viewMode = _c[0], setViewMode = _c[1];
    var _d = useState(''), searchTerm = _d[0], setSearchTerm = _d[1];
    var _e = useState('all'), typeFilter = _e[0], setTypeFilter = _e[1];
    var _f = useState('all'), statusFilter = _f[0], setStatusFilter = _f[1];
    var _g = useState('lastActive'), sortBy = _g[0], setSortBy = _g[1];
    // Mock data - replace with API call
    useEffect(function () {
        setTimeout(function () {
            setAgents([
                {
                    id: '1',
                    name: 'CustomerSupport AI',
                    description: 'Handles customer inquiries and provides support solutions',
                    type: 'chat',
                    status: 'active',
                    model: 'GPT-4',
                    capabilities: ['Natural Language Processing', 'Knowledge Base', 'Ticket Creation'],
                    createdAt: '2024-01-01T00:00:00Z',
                    lastActive: '2024-01-16T10:30:00Z',
                    messagesCount: 1247,
                    successRate: 94.5,
                    avgResponseTime: 1.2,
                    version: '2.1.0',
                    workspaceId: 'ws1',
                    workspaceName: 'Customer Success',
                    owner: 'Alice Johnson'
                },
                {
                    id: '2',
                    name: 'DataAnalyst Bot',
                    description: 'Analyzes data patterns and generates insights',
                    type: 'analysis',
                    status: 'active',
                    model: 'Claude-3',
                    capabilities: ['Data Analysis', 'Report Generation', 'Visualization'],
                    createdAt: '2024-01-05T00:00:00Z',
                    lastActive: '2024-01-16T09:45:00Z',
                    messagesCount: 892,
                    successRate: 98.1,
                    avgResponseTime: 2.8,
                    version: '1.5.2',
                    workspaceId: 'ws2',
                    workspaceName: 'Analytics Team',
                    owner: 'Bob Wilson'
                },
                {
                    id: '3',
                    name: 'TaskAutomator',
                    description: 'Automates repetitive tasks and workflows',
                    type: 'automation',
                    status: 'training',
                    model: 'GPT-3.5',
                    capabilities: ['Workflow Automation', 'Task Scheduling', 'Integration'],
                    createdAt: '2024-01-10T00:00:00Z',
                    lastActive: '2024-01-15T14:20:00Z',
                    messagesCount: 234,
                    successRate: 87.3,
                    avgResponseTime: 0.8,
                    version: '1.0.1',
                    workspaceId: 'ws3',
                    workspaceName: 'Operations',
                    owner: 'Carol Brown'
                },
                {
                    id: '4',
                    name: 'CodeReviewer AI',
                    description: 'Reviews code and provides suggestions for improvements',
                    type: 'task',
                    status: 'active',
                    model: 'GPT-4',
                    capabilities: ['Code Analysis', 'Security Review', 'Best Practices'],
                    createdAt: '2024-01-08T00:00:00Z',
                    lastActive: '2024-01-16T11:15:00Z',
                    messagesCount: 567,
                    successRate: 91.7,
                    avgResponseTime: 3.2,
                    version: '1.8.0',
                    workspaceId: 'ws1',
                    workspaceName: 'Development',
                    owner: 'David Lee'
                },
                {
                    id: '5',
                    name: 'SalesAssistant',
                    description: 'Assists with lead qualification and sales processes',
                    type: 'chat',
                    status: 'inactive',
                    model: 'GPT-3.5',
                    capabilities: ['Lead Scoring', 'CRM Integration', 'Email Automation'],
                    createdAt: '2024-01-12T00:00:00Z',
                    lastActive: '2024-01-14T16:30:00Z',
                    messagesCount: 156,
                    successRate: 89.4,
                    avgResponseTime: 1.8,
                    version: '1.2.3',
                    workspaceId: 'ws4',
                    workspaceName: 'Sales Team',
                    owner: 'Eve Martinez'
                },
                {
                    id: '6',
                    name: 'ContentGenerator',
                    description: 'Generates marketing content and copy',
                    type: 'task',
                    status: 'error',
                    model: 'Claude-3',
                    capabilities: ['Content Creation', 'SEO Optimization', 'Social Media'],
                    createdAt: '2024-01-14T00:00:00Z',
                    lastActive: '2024-01-15T12:45:00Z',
                    messagesCount: 89,
                    successRate: 76.8,
                    avgResponseTime: 4.1,
                    version: '0.9.5',
                    workspaceId: 'ws5',
                    workspaceName: 'Marketing',
                    owner: 'Frank Garcia'
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);
    var getStatusBadge = function (status) {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'inactive':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'training':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'error':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getTypeBadge = function (type) {
        switch (type) {
            case 'chat':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'task':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'analysis':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'automation':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'active': return '🟢';
            case 'inactive': return '⚫';
            case 'training': return '🔵';
            case 'error': return '🔴';
            default: return '⚪';
        }
    };
    var getTypeIcon = function (type) {
        switch (type) {
            case 'chat': return '💬';
            case 'task': return '⚡';
            case 'analysis': return '📊';
            case 'automation': return '🤖';
            default: return '🔧';
        }
    };
    var filteredAgents = agents.filter(function (agent) {
        var matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.owner.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesType = typeFilter === 'all' || agent.type === typeFilter;
        var matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });
    var sortedAgents = __spreadArray([], filteredAgents, true).sort(function (a, b) {
        switch (sortBy) {
            case 'lastActive':
                return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
            case 'name':
                return a.name.localeCompare(b.name);
            case 'successRate':
                return b.successRate - a.successRate;
            case 'messagesCount':
                return b.messagesCount - a.messagesCount;
            default:
                return 0;
        }
    });
    var handleAgentAction = function (agentId, action) {
        // Instead of logging to console, we'll update state or call an API
        setLoading(true);
        // Simulate API call
        setTimeout(function () {
            // Update the agent status based on action
            setAgents(function (prev) { return prev.map(function (agent) {
                return agent.id === agentId && action === 'start'
                    ? __assign(__assign({}, agent), { status: 'active' }) : agent.id === agentId && action === 'stop'
                    ? __assign(__assign({}, agent), { status: 'inactive' }) : agent;
            }); });
            setLoading(false);
        }, 500);
        // TODO: Implement actual API calls for agent actions
    };
    if (loading) {
        return (_jsx("div", { className: "p-8 max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsxs("div", { className: "p-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83E\uDD16 AI Agents" }), _jsx("p", { className: "text-gray-600", children: "Manage and monitor all your AI agents across workspaces" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Link, { to: "/agents/new", className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "+ Create Agent" }), _jsx(Link, { to: "/dashboard/agents", className: "bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors", children: "\uD83D\uDCCA Dashboard" })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-blue-600 mr-3", children: "\uD83E\uDD16" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: agents.length }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Agents" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-green-600 mr-3", children: "\uD83D\uDFE2" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: agents.filter(function (a) { return a.status === 'active'; }).length }), _jsx("p", { className: "text-sm text-gray-600", children: "Active Agents" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-orange-600 mr-3", children: "\uD83D\uDCAC" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: agents.reduce(function (sum, a) { return sum + a.messagesCount; }, 0).toLocaleString() }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Messages" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-purple-600 mr-3", children: "\uD83D\uDCC8" }), _jsxs("div", { children: [_jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [(agents.reduce(function (sum, a) { return sum + a.successRate; }, 0) / agents.length).toFixed(1), "%"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Avg Success Rate" })] })] }) })] }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4", children: [_jsx("div", { children: _jsx("input", { type: "text", placeholder: "Search agents...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("select", { value: typeFilter, onChange: function (e) { return setTypeFilter(e.target.value); }, "aria-label": "Filter by type", title: "Filter by type", className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "chat", children: "Chat" }), _jsx("option", { value: "task", children: "Task" }), _jsx("option", { value: "analysis", children: "Analysis" }), _jsx("option", { value: "automation", children: "Automation" })] }), _jsxs("select", { value: statusFilter, onChange: function (e) { return setStatusFilter(e.target.value); }, "aria-label": "Filter by status", title: "Filter by status", className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] }), _jsxs("select", { value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, "aria-label": "Sort agents by", title: "Sort agents by", className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "name", children: "Name" }), _jsx("option", { value: "successRate", children: "Success Rate" }), _jsx("option", { value: "messagesCount", children: "Messages" })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "View:" }), _jsx("button", { onClick: function () { return setViewMode('grid'); }, className: "px-3 py-2 rounded-lg transition-colors ".concat(viewMode === 'grid'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'), children: "\u2B1C Grid" }), _jsx("button", { onClick: function () { return setViewMode('list'); }, className: "px-3 py-2 rounded-lg transition-colors ".concat(viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'), children: "\uD83D\uDCCB List" })] })] }) }), viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: sortedAgents.map(function (agent) { return (_jsx("div", { className: "bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl mr-3", children: getTypeIcon(agent.type) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: agent.name }), _jsxs("p", { className: "text-sm text-gray-500", children: ["v", agent.version] })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("span", { className: "px-2 py-1 text-xs rounded-full border ".concat(getStatusBadge(agent.status)), children: getStatusIcon(agent.status) }), _jsx("span", { className: "px-2 py-1 text-xs rounded-full border ".concat(getTypeBadge(agent.type)), children: agent.type })] })] }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: agent.description }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Model" }), _jsx("p", { className: "text-sm font-medium", children: agent.model })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Owner" }), _jsx("p", { className: "text-sm font-medium", children: agent.owner })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-xs text-gray-500 mb-2", children: "Capabilities" }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [agent.capabilities.slice(0, 3).map(function (capability, index) { return (_jsx("span", { className: "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded", children: capability }, index)); }), agent.capabilities.length > 3 && (_jsxs("span", { className: "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded", children: ["+", agent.capabilities.length - 3, " more"] }))] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mb-4 text-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Messages" }), _jsx("p", { className: "text-sm font-bold text-blue-600", children: agent.messagesCount.toLocaleString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Success Rate" }), _jsxs("p", { className: "text-sm font-bold text-green-600", children: [agent.successRate, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Avg Response" }), _jsxs("p", { className: "text-sm font-bold text-purple-600", children: [agent.avgResponseTime, "s"] })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Link, { to: "/agents/".concat(agent.id), className: "flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm", children: "View Details" }), _jsx("button", { onClick: function () { return handleAgentAction(agent.id, agent.status === 'active' ? 'stop' : 'start'); }, className: "px-4 py-2 rounded-lg text-sm transition-colors ".concat(agent.status === 'active'
                                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                            : 'bg-green-100 text-green-600 hover:bg-green-200'), children: agent.status === 'active' ? 'Stop' : 'Start' })] })] }) }, agent.id)); }) })) : (_jsx("div", { className: "bg-white rounded-lg shadow-lg overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Agent" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Model" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Messages" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Success Rate" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Last Active" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: sortedAgents.map(function (agent) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-xl mr-3", children: getTypeIcon(agent.type) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: agent.name }), _jsx("div", { className: "text-sm text-gray-500", children: agent.description }), _jsxs("div", { className: "text-xs text-gray-400", children: ["Owner: ", agent.owner] })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getTypeBadge(agent.type)), children: agent.type }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getStatusBadge(agent.status)), children: [getStatusIcon(agent.status), " ", agent.status] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: agent.model }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: agent.messagesCount.toLocaleString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-16 bg-gray-200 rounded-full h-2 mr-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded-full", style: { width: "".concat(agent.successRate, "%") } }) }), _jsxs("span", { className: "text-sm text-gray-600", children: [agent.successRate, "%"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(agent.lastActive).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Link, { to: "/agents/".concat(agent.id), className: "text-blue-600 hover:text-blue-900 px-2 py-1 text-xs", children: "View" }), _jsx("button", { onClick: function () { return handleAgentAction(agent.id, 'edit'); }, className: "text-green-600 hover:text-green-900 px-2 py-1 text-xs", children: "Edit" }), _jsx("button", { onClick: function () { return handleAgentAction(agent.id, agent.status === 'active' ? 'stop' : 'start'); }, className: "px-2 py-1 text-xs ".concat(agent.status === 'active'
                                                            ? 'text-red-600 hover:text-red-900'
                                                            : 'text-green-600 hover:text-green-900'), children: agent.status === 'active' ? 'Stop' : 'Start' })] }) })] }, agent.id)); }) })] }) }) })), sortedAgents.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-gray-400 text-6xl mb-4", children: "\uD83E\uDD16" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No agents found" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Try adjusting your search or filter criteria." }), _jsx(Link, { to: "/agents/new", className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "Create Your First Agent" })] }))] }));
}
