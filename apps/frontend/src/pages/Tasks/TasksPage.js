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
export default function TasksPage() {
    var _a = useState([]), tasks = _a[0], setTasks = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState('list'), viewMode = _c[0], setViewMode = _c[1];
    var _d = useState(''), searchTerm = _d[0], setSearchTerm = _d[1];
    var _e = useState('all'), statusFilter = _e[0], setStatusFilter = _e[1];
    var _f = useState('all'), priorityFilter = _f[0], setPriorityFilter = _f[1];
    var _g = useState('dueDate'), sortBy = _g[0], setSortBy = _g[1];
    // Mock data - replace with API call
    useEffect(function () {
        setTimeout(function () {
            setTasks([
                {
                    id: '1',
                    title: 'Implement user authentication system',
                    description: 'Create a secure authentication system with JWT tokens and password hashing',
                    status: 'in-progress',
                    priority: 'high',
                    assignee: 'John Doe',
                    assigneeAvatar: '👤',
                    dueDate: '2024-01-20T00:00:00Z',
                    createdAt: '2024-01-10T00:00:00Z',
                    updatedAt: '2024-01-15T00:00:00Z',
                    tags: ['backend', 'security', 'authentication'],
                    progress: 65,
                    workspaceId: 'ws1',
                    workspaceName: 'Development Team'
                },
                {
                    id: '2',
                    title: 'Design new landing page',
                    description: 'Create a modern, responsive landing page design with improved conversion rates',
                    status: 'pending',
                    priority: 'medium',
                    assignee: 'Jane Smith',
                    assigneeAvatar: '👩',
                    dueDate: '2024-01-25T00:00:00Z',
                    createdAt: '2024-01-12T00:00:00Z',
                    updatedAt: '2024-01-14T00:00:00Z',
                    tags: ['design', 'frontend', 'ui/ux'],
                    progress: 0,
                    workspaceId: 'ws2',
                    workspaceName: 'Design Team'
                },
                {
                    id: '3',
                    title: 'Setup CI/CD pipeline',
                    description: 'Configure automated testing and deployment pipeline using GitHub Actions',
                    status: 'completed',
                    priority: 'high',
                    assignee: 'Bob Wilson',
                    assigneeAvatar: '👨',
                    dueDate: '2024-01-15T00:00:00Z',
                    createdAt: '2024-01-05T00:00:00Z',
                    updatedAt: '2024-01-15T00:00:00Z',
                    tags: ['devops', 'automation', 'deployment'],
                    progress: 100,
                    workspaceId: 'ws1',
                    workspaceName: 'Development Team'
                },
                {
                    id: '4',
                    title: 'Write API documentation',
                    description: 'Document all API endpoints with examples and schema definitions',
                    status: 'in-progress',
                    priority: 'medium',
                    assignee: 'Alice Johnson',
                    assigneeAvatar: '👩‍💻',
                    dueDate: '2024-01-30T00:00:00Z',
                    createdAt: '2024-01-08T00:00:00Z',
                    updatedAt: '2024-01-16T00:00:00Z',
                    tags: ['documentation', 'api', 'backend'],
                    progress: 40,
                    workspaceId: 'ws1',
                    workspaceName: 'Development Team'
                },
                {
                    id: '5',
                    title: 'Conduct user research',
                    description: 'Interview 20 users to understand pain points and feature requests',
                    status: 'pending',
                    priority: 'urgent',
                    assignee: 'Carol Brown',
                    assigneeAvatar: '👩‍🎨',
                    dueDate: '2024-01-18T00:00:00Z',
                    createdAt: '2024-01-14T00:00:00Z',
                    updatedAt: '2024-01-16T00:00:00Z',
                    tags: ['research', 'user-experience', 'product'],
                    progress: 10,
                    workspaceId: 'ws3',
                    workspaceName: 'Product Team'
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);
    var getStatusBadge = function (status) {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getPriorityBadge = function (priority) {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getPriorityIcon = function (priority) {
        switch (priority) {
            case 'urgent': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚫';
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'pending': return '⏳';
            case 'in-progress': return '⚡';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '⚫';
        }
    };
    var filteredTasks = tasks.filter(function (task) {
        var matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.assignee.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        var matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });
    var sortedTasks = __spreadArray([], filteredTasks, true).sort(function (a, b) {
        switch (sortBy) {
            case 'dueDate':
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            case 'priority':
                var priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'progress':
                return b.progress - a.progress;
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    var tasksByStatus = {
        pending: sortedTasks.filter(function (t) { return t.status === 'pending'; }),
        'in-progress': sortedTasks.filter(function (t) { return t.status === 'in-progress'; }),
        completed: sortedTasks.filter(function (t) { return t.status === 'completed'; }),
        cancelled: sortedTasks.filter(function (t) { return t.status === 'cancelled'; })
    };
    var handleTaskAction = function (taskId, action) {
        console.log("Performing ".concat(action, " on task ").concat(taskId));
        // TODO: Implement API calls for task actions
    };
    if (loading) {
        return (_jsx("div", { className: "p-8 max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsxs("div", { className: "p-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83D\uDCCB Tasks Management" }), _jsx("p", { className: "text-gray-600", children: "Organize and track all your tasks and project work" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Link, { to: "/tasks/new", className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "+ Create Task" }), _jsx(Link, { to: "/workflows", className: "bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors", children: "\uD83D\uDD04 Workflows" })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-blue-600 mr-3", children: "\uD83D\uDCCB" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: tasks.length }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Tasks" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-yellow-600 mr-3", children: "\u23F3" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: tasks.filter(function (t) { return t.status === 'pending'; }).length }), _jsx("p", { className: "text-sm text-gray-600", children: "Pending" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-blue-600 mr-3", children: "\u26A1" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: tasks.filter(function (t) { return t.status === 'in-progress'; }).length }), _jsx("p", { className: "text-sm text-gray-600", children: "In Progress" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl text-green-600 mr-3", children: "\u2705" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: tasks.filter(function (t) { return t.status === 'completed'; }).length }), _jsx("p", { className: "text-sm text-gray-600", children: "Completed" })] })] }) })] }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4", children: [_jsx("div", { children: _jsx("input", { type: "text", placeholder: "Search tasks...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("select", { value: statusFilter, onChange: function (e) { return setStatusFilter(e.target.value); }, className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "in-progress", children: "In Progress" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] }), _jsxs("select", { value: priorityFilter, onChange: function (e) { return setPriorityFilter(e.target.value); }, className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Priority" }), _jsx("option", { value: "urgent", children: "Urgent" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] }), _jsxs("select", { value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "dueDate", children: "Due Date" }), _jsx("option", { value: "priority", children: "Priority" }), _jsx("option", { value: "progress", children: "Progress" }), _jsx("option", { value: "title", children: "Title" })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "View:" }), _jsx("button", { onClick: function () { return setViewMode('list'); }, className: "px-3 py-2 rounded-lg transition-colors ".concat(viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'), children: "\uD83D\uDCCB List" }), _jsx("button", { onClick: function () { return setViewMode('kanban'); }, className: "px-3 py-2 rounded-lg transition-colors ".concat(viewMode === 'kanban'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'), children: "\uD83D\uDCCA Kanban" })] })] }) }), viewMode === 'list' ? (_jsx("div", { className: "bg-white rounded-lg shadow-lg overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Task" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Priority" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Assignee" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Progress" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Due Date" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: sortedTasks.map(function (task) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: task.title }), _jsx("div", { className: "text-sm text-gray-500 truncate max-w-xs", children: task.description }), _jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: task.tags.slice(0, 3).map(function (tag, index) { return (_jsx("span", { className: "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded", children: tag }, index)); }) })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getStatusBadge(task.status)), children: [getStatusIcon(task.status), " ", task.status] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getPriorityBadge(task.priority)), children: [getPriorityIcon(task.priority), " ", task.priority] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-xl mr-2", children: task.assigneeAvatar }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: task.assignee }), _jsx("div", { className: "text-xs text-gray-500", children: task.workspaceName })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-16 bg-gray-200 rounded-full h-2 mr-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: "".concat(task.progress, "%") } }) }), _jsxs("span", { className: "text-sm text-gray-600", children: [task.progress, "%"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(task.dueDate).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Link, { to: "/tasks/".concat(task.id), className: "text-blue-600 hover:text-blue-900 px-2 py-1 text-xs", children: "View" }), _jsx(Link, { to: "/tasks/".concat(task.id, "/edit"), className: "text-green-600 hover:text-green-900 px-2 py-1 text-xs", children: "Edit" }), _jsx("button", { onClick: function () { return handleTaskAction(task.id, 'delete'); }, className: "text-red-600 hover:text-red-900 px-2 py-1 text-xs", children: "Delete" })] }) })] }, task.id)); }) })] }) }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: Object.entries(tasksByStatus).map(function (_a) {
                    var status = _a[0], statusTasks = _a[1];
                    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-semibold text-gray-900 capitalize", children: [getStatusIcon(status), " ", status.replace('-', ' ')] }), _jsx("span", { className: "bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs", children: statusTasks.length })] }), _jsx("div", { className: "space-y-3", children: statusTasks.map(function (task) { return (_jsxs("div", { className: "bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer", children: [_jsx("div", { className: "font-medium text-sm text-gray-900 mb-1", children: task.title }), _jsx("div", { className: "text-xs text-gray-500 mb-2 line-clamp-2", children: task.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "px-2 py-1 text-xs rounded-full ".concat(getPriorityBadge(task.priority)), children: getPriorityIcon(task.priority) }), _jsx("div", { className: "text-xs text-gray-500", children: task.assigneeAvatar })] }), _jsx("div", { className: "mt-2 w-full bg-gray-200 rounded-full h-1", children: _jsx("div", { className: "bg-blue-600 h-1 rounded-full", style: { width: "".concat(task.progress, "%") } }) })] }, task.id)); }) })] }, status));
                }) })), sortedTasks.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-gray-400 text-6xl mb-4", children: "\uD83D\uDCCB" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No tasks found" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Try adjusting your search or filter criteria." }), _jsx(Link, { to: "/tasks/new", className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "Create Your First Task" })] }))] }));
}
