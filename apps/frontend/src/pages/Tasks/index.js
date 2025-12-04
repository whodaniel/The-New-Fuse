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
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, MoreVertical, CheckCircle, Clock, AlertTriangle, Calendar, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Mock data for tasks
var mockTasks = [
    {
        id: 1,
        title: 'Implement new API endpoint',
        description: 'Create a new REST API endpoint for user authentication',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2023-06-15',
        assignedTo: 'CodeAssistant',
        category: 'Development',
        createdAt: '2023-06-01',
    },
    {
        id: 2,
        title: 'Analyze user behavior data',
        description: 'Generate insights from the latest user behavior data',
        status: 'Completed',
        priority: 'Medium',
        dueDate: '2023-06-12',
        assignedTo: 'DataAnalyzer',
        category: 'Analytics',
        createdAt: '2023-06-02',
    },
    {
        id: 3,
        title: 'Write documentation for new features',
        description: 'Create comprehensive documentation for the latest features',
        status: 'Pending Review',
        priority: 'Normal',
        dueDate: '2023-06-18',
        assignedTo: 'ContentWriter',
        category: 'Documentation',
        createdAt: '2023-06-05',
    },
    {
        id: 4,
        title: 'Fix authentication bug',
        description: 'Resolve the issue with user authentication in the mobile app',
        status: 'In Progress',
        priority: 'Critical',
        dueDate: '2023-06-14',
        assignedTo: 'BugHunter',
        category: 'Bug Fixing',
        createdAt: '2023-06-07',
    },
    {
        id: 5,
        title: 'Optimize database queries',
        description: 'Improve performance of slow database queries',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: '2023-06-20',
        assignedTo: 'CodeAssistant',
        category: 'Performance',
        createdAt: '2023-06-08',
    },
    {
        id: 6,
        title: 'Update privacy policy',
        description: 'Update the privacy policy to comply with new regulations',
        status: 'Completed',
        priority: 'High',
        dueDate: '2023-06-10',
        assignedTo: 'ContentWriter',
        category: 'Legal',
        createdAt: '2023-06-03',
    },
    {
        id: 7,
        title: 'Integrate third-party payment gateway',
        description: 'Integrate with the new payment gateway for international transactions',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2023-06-22',
        assignedTo: 'APIIntegrator',
        category: 'Integration',
        createdAt: '2023-06-09',
    },
    {
        id: 8,
        title: 'Create user onboarding flow',
        description: 'Design and implement a new user onboarding experience',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: '2023-06-25',
        assignedTo: 'CodeAssistant',
        category: 'UX',
        createdAt: '2023-06-10',
    },
];
/**
 * Tasks page component
 */
var Tasks = function () {
    var navigate = useNavigate();
    var _a = useState(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = useState('All'), filterStatus = _b[0], setFilterStatus = _b[1];
    var _c = useState('All'), filterPriority = _c[0], setFilterPriority = _c[1];
    var _d = useState('All'), filterAssignee = _d[0], setFilterAssignee = _d[1];
    // Filter tasks based on search query and filters
    var filteredTasks = mockTasks.filter(function (task) {
        var matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase());
        var matchesStatus = filterStatus === 'All' || task.status === filterStatus;
        var matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
        var matchesAssignee = filterAssignee === 'All' || task.assignedTo === filterAssignee;
        return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
    // Get unique task statuses for filter
    var taskStatuses = __spreadArray(['All'], new Set(mockTasks.map(function (task) { return task.status; })), true);
    // Get unique task priorities for filter
    var taskPriorities = __spreadArray(['All'], new Set(mockTasks.map(function (task) { return task.priority; })), true);
    // Get unique assignees for filter
    var taskAssignees = __spreadArray(['All'], new Set(mockTasks.map(function (task) { return task.assignedTo; })), true);
    // Get status badge
    var getStatusBadge = function (status) {
        switch (status) {
            case 'Completed':
                return (_jsxs(Badge, { className: "bg-green-100 text-green-800 hover:bg-green-100", children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-1" }), status] }));
            case 'In Progress':
                return (_jsxs(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Pending Review':
                return (_jsxs(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Not Started':
                return (_jsxs(Badge, { className: "bg-gray-100 text-gray-800 hover:bg-gray-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            default:
                return _jsx(Badge, { children: status });
        }
    };
    // Get priority badge
    var getPriorityBadge = function (priority) {
        switch (priority) {
            case 'Critical':
                return (_jsxs(Badge, { className: "bg-red-100 text-red-800 hover:bg-red-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'High':
                return (_jsxs(Badge, { className: "bg-orange-100 text-orange-800 hover:bg-orange-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'Medium':
                return (_jsxs(Badge, { className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'Normal':
                return (_jsxs(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'Low':
                return (_jsxs(Badge, { className: "bg-green-100 text-green-800 hover:bg-green-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            default:
                return _jsx(Badge, { children: priority });
        }
    };
    // Format date
    var formatDate = function (dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    // Calculate days remaining
    var getDaysRemaining = function (dueDate) {
        var today = new Date();
        var due = new Date(dueDate);
        var diffTime = due.getTime() - today.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return _jsxs("span", { className: "text-red-600", children: ["Overdue by ", Math.abs(diffDays), " days"] });
        }
        else if (diffDays === 0) {
            return _jsx("span", { className: "text-orange-600", children: "Due today" });
        }
        else {
            return _jsxs("span", { children: [diffDays, " days remaining"] });
        }
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Tasks" }), _jsx("p", { className: "text-muted-foreground", children: "Manage and track agent tasks" })] }), _jsxs(Button, { onClick: function () { return navigate('/tasks/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Create Task"] })] }), _jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-6", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" }), _jsx(Input, { placeholder: "Search tasks...", className: "pl-10", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); } })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("div", { className: "relative", children: [_jsx("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: filterStatus, onChange: function (e) { return setFilterStatus(e.target.value); }, children: taskStatuses.map(function (status) { return (_jsx("option", { value: status, children: status }, status)); }) }), _jsx(Filter, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" })] }), _jsxs("div", { className: "relative", children: [_jsx("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: filterPriority, onChange: function (e) { return setFilterPriority(e.target.value); }, children: taskPriorities.map(function (priority) { return (_jsx("option", { value: priority, children: priority }, priority)); }) }), _jsx(Filter, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" })] }), _jsxs("div", { className: "relative", children: [_jsx("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: filterAssignee, onChange: function (e) { return setFilterAssignee(e.target.value); }, children: taskAssignees.map(function (assignee) { return (_jsx("option", { value: assignee, children: assignee }, assignee)); }) }), _jsx(Filter, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" })] })] })] }), _jsx("div", { className: "space-y-4", children: filteredTasks.map(function (task) { return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("h3", { className: "text-xl font-semibold", children: task.title }), _jsx("div", { className: "flex items-center", children: _jsx("button", { className: "text-gray-500 hover:text-gray-700", children: _jsx(MoreVertical, { className: "h-4 w-4" }) }) })] }), _jsx("p", { className: "text-muted-foreground mb-4", children: task.description }), _jsxs("div", { className: "flex flex-wrap gap-3 mb-4", children: [getStatusBadge(task.status), getPriorityBadge(task.priority), _jsx(Badge, { className: "bg-gray-100 text-gray-800 hover:bg-gray-100", children: task.category })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Assigned To" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(Bot, { className: "h-3 w-3 mr-1" }), task.assignedTo] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Created" }), _jsx("p", { className: "font-medium", children: formatDate(task.createdAt) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Due Date" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDate(task.dueDate)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Time Remaining" }), _jsx("p", { className: "font-medium", children: getDaysRemaining(task.dueDate) })] })] })] }), _jsxs("div", { className: "px-6 py-4 bg-muted/50 flex justify-end items-center", children: [_jsx(Button, { variant: "outline", size: "sm", className: "mr-2", onClick: function () { return navigate("/tasks/".concat(task.id)); }, children: "View Details" }), _jsx(Button, { size: "sm", onClick: function () { return navigate("/tasks/".concat(task.id, "/edit")); }, children: "Edit Task" })] })] }, task.id)); }) }), filteredTasks.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Clock, { className: "mx-auto h-12 w-12 text-muted-foreground mb-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No tasks found" }), _jsx("p", { className: "text-muted-foreground mb-4", children: searchQuery || filterStatus !== 'All' || filterPriority !== 'All' || filterAssignee !== 'All'
                                        ? "Try adjusting your search or filters"
                                        : "Create your first task to get started" }), _jsxs(Button, { onClick: function () { return navigate('/tasks/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Create Task"] })] }))] }) })] }));
};
export default Tasks;
