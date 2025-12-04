import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
export default function WorkspaceAnalytics() {
    var _a = useState(null), metrics = _a[0], setMetrics = _a[1];
    var _b = useState([]), activityData = _b[0], setActivityData = _b[1];
    var _c = useState([]), projects = _c[0], setProjects = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState('7d'), timeRange = _e[0], setTimeRange = _e[1];
    // Mock data - replace with API call
    useEffect(function () {
        setTimeout(function () {
            setMetrics({
                totalMembers: 24,
                activeMembers: 18,
                totalProjects: 8,
                activeProjects: 5,
                totalTasks: 156,
                completedTasks: 89,
                totalAgents: 12,
                activeAgents: 8,
                messagesThisWeek: 1247,
                messagesLastWeek: 1089,
                storageUsed: 12.4,
                storageLimit: 50
            });
            setActivityData([
                { date: '2024-01-10', messages: 145, tasksCompleted: 12, agentInteractions: 89 },
                { date: '2024-01-11', messages: 167, tasksCompleted: 8, agentInteractions: 102 },
                { date: '2024-01-12', messages: 198, tasksCompleted: 15, agentInteractions: 134 },
                { date: '2024-01-13', messages: 234, tasksCompleted: 18, agentInteractions: 156 },
                { date: '2024-01-14', messages: 189, tasksCompleted: 22, agentInteractions: 178 },
                { date: '2024-01-15', messages: 156, tasksCompleted: 9, agentInteractions: 145 },
                { date: '2024-01-16', messages: 178, tasksCompleted: 14, agentInteractions: 167 }
            ]);
            setProjects([
                {
                    id: '1',
                    name: 'Customer Portal Redesign',
                    status: 'active',
                    progress: 75,
                    members: 6,
                    dueDate: '2024-02-15',
                    priority: 'high'
                },
                {
                    id: '2',
                    name: 'AI Agent Integration',
                    status: 'active',
                    progress: 45,
                    members: 4,
                    dueDate: '2024-02-28',
                    priority: 'high'
                },
                {
                    id: '3',
                    name: 'Mobile App Development',
                    status: 'active',
                    progress: 20,
                    members: 8,
                    dueDate: '2024-03-30',
                    priority: 'medium'
                },
                {
                    id: '4',
                    name: 'Security Audit',
                    status: 'completed',
                    progress: 100,
                    members: 3,
                    dueDate: '2024-01-15',
                    priority: 'high'
                },
                {
                    id: '5',
                    name: 'Documentation Update',
                    status: 'on-hold',
                    progress: 60,
                    members: 2,
                    dueDate: '2024-02-10',
                    priority: 'low'
                }
            ]);
            setLoading(false);
        }, 1000);
    }, [timeRange]);
    var getStatusBadge = function (status) {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'on-hold':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getPriorityBadge = function (priority) {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var calculateGrowth = function (current, previous) {
        if (previous === 0)
            return 0;
        return ((current - previous) / previous * 100).toFixed(1);
    };
    if (loading) {
        return (_jsx("div", { className: "p-8 max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsxs("div", { className: "p-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83D\uDCCA Workspace Analytics" }), _jsx("p", { className: "text-gray-600", children: "Insights and metrics for your workspace performance" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Link, { to: "/workspace/overview", className: "bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors", children: "\u2190 Back to Overview" }), _jsxs("select", { value: timeRange, onChange: function (e) { return setTimeRange(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "7d", children: "Last 7 days" }), _jsx("option", { value: "30d", children: "Last 30 days" }), _jsx("option", { value: "90d", children: "Last 90 days" })] })] })] }) }), metrics && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.activeMembers }), _jsx("p", { className: "text-sm text-gray-600", children: "Active Members" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["of ", metrics.totalMembers, " total"] })] }), _jsx("div", { className: "text-3xl", children: "\uD83D\uDC65" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.activeProjects }), _jsx("p", { className: "text-sm text-gray-600", children: "Active Projects" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["of ", metrics.totalProjects, " total"] })] }), _jsx("div", { className: "text-3xl", children: "\uD83D\uDE80" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.completedTasks }), _jsx("p", { className: "text-sm text-gray-600", children: "Tasks Completed" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["of ", metrics.totalTasks, " total"] })] }), _jsx("div", { className: "text-3xl", children: "\u2705" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.activeAgents }), _jsx("p", { className: "text-sm text-gray-600", children: "Active Agents" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["of ", metrics.totalAgents, " total"] })] }), _jsx("div", { className: "text-3xl", children: "\uD83E\uDD16" })] }) })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Communication Activity" }), metrics && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-4 bg-blue-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-blue-900", children: metrics.messagesThisWeek.toLocaleString() }), _jsx("p", { className: "text-sm text-blue-700", children: "Messages This Week" })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-medium ".concat(parseFloat(calculateGrowth(metrics.messagesThisWeek, metrics.messagesLastWeek)) >= 0
                                                            ? 'text-green-600'
                                                            : 'text-red-600'), children: [parseFloat(calculateGrowth(metrics.messagesThisWeek, metrics.messagesLastWeek)) >= 0 ? '+' : '', calculateGrowth(metrics.messagesThisWeek, metrics.messagesLastWeek), "%"] }), _jsx("p", { className: "text-xs text-gray-500", children: "vs last week" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-gray-900", children: metrics.messagesLastWeek.toLocaleString() }), _jsx("p", { className: "text-sm text-gray-600", children: "Last Week" })] }), _jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-gray-900", children: Math.round(metrics.messagesThisWeek / 7) }), _jsx("p", { className: "text-sm text-gray-600", children: "Daily Average" })] })] })] }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Storage Usage" }), metrics && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Used Storage" }), _jsxs("span", { className: "text-sm font-medium", children: [metrics.storageUsed, " GB of ", metrics.storageLimit, " GB"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "bg-blue-600 h-3 rounded-full transition-all duration-300", style: { width: "".concat((metrics.storageUsed / metrics.storageLimit) * 100, "%") } }) }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mt-4", children: [_jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-gray-900", children: "78%" }), _jsx("p", { className: "text-sm text-gray-600", children: "Files" })] }), _jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-gray-900", children: "15%" }), _jsx("p", { className: "text-sm text-gray-600", children: "Messages" })] }), _jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-gray-900", children: "7%" }), _jsx("p", { className: "text-sm text-gray-600", children: "Other" })] })] })] }))] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Daily Activity Overview" }), _jsx("div", { className: "grid grid-cols-7 gap-2 mb-4", children: activityData.map(function (day, index) { return (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-xs text-gray-500 mb-1", children: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "bg-blue-500 rounded mx-auto", style: {
                                                height: "".concat(Math.max(20, (day.messages / 250) * 60), "px"),
                                                width: '12px'
                                            }, title: "".concat(day.messages, " messages") }), _jsx("div", { className: "bg-green-500 rounded mx-auto", style: {
                                                height: "".concat(Math.max(20, (day.tasksCompleted / 25) * 60), "px"),
                                                width: '12px'
                                            }, title: "".concat(day.tasksCompleted, " tasks completed") }), _jsx("div", { className: "bg-purple-500 rounded mx-auto", style: {
                                                height: "".concat(Math.max(20, (day.agentInteractions / 200) * 60), "px"),
                                                width: '12px'
                                            }, title: "".concat(day.agentInteractions, " agent interactions") })] })] }, index)); }) }), _jsxs("div", { className: "flex justify-center space-x-6 text-sm", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-blue-500 rounded mr-2" }), _jsx("span", { children: "Messages" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-green-500 rounded mr-2" }), _jsx("span", { children: "Tasks Completed" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-purple-500 rounded mr-2" }), _jsx("span", { children: "Agent Interactions" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Project Status" }), _jsx(Link, { to: "/tasks", className: "text-blue-600 hover:text-blue-700 text-sm font-medium", children: "View All Projects \u2192" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Project" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Priority" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Progress" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Members" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Due Date" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: projects.map(function (project) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: project.name }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getStatusBadge(project.status)), children: project.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getPriorityBadge(project.priority)), children: project.priority }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-16 bg-gray-200 rounded-full h-2 mr-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: "".concat(project.progress, "%") } }) }), _jsxs("span", { className: "text-sm text-gray-600", children: [project.progress, "%"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: project.members }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(project.dueDate).toLocaleDateString() })] }, project.id)); }) })] }) })] }), _jsxs("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs(Link, { to: "/tasks/new", className: "bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center", children: [_jsx("div", { className: "text-3xl mb-2", children: "\uD83D\uDCCB" }), _jsx("div", { className: "font-medium", children: "Create New Task" }), _jsx("div", { className: "text-sm opacity-90", children: "Start a new project task" })] }), _jsxs(Link, { to: "/agents/new", className: "bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-center", children: [_jsx("div", { className: "text-3xl mb-2", children: "\uD83E\uDD16" }), _jsx("div", { className: "font-medium", children: "Deploy New Agent" }), _jsx("div", { className: "text-sm opacity-90", children: "Add AI agent to workspace" })] }), _jsxs(Link, { to: "/workspace/members", className: "bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-center", children: [_jsx("div", { className: "text-3xl mb-2", children: "\uD83D\uDC65" }), _jsx("div", { className: "font-medium", children: "Invite Members" }), _jsx("div", { className: "text-sm opacity-90", children: "Add team members" })] })] })] }));
}
