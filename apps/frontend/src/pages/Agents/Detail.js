import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Code, CheckCircle, AlertCircle, Clock, Settings, Activity, List, History, Edit, Trash2, Play, Pause, RefreshCw } from 'lucide-react';
// Mock data for agent details
var mockAgentDetails = {
    id: 1,
    name: 'CodeAssistant',
    description: 'Helps with coding tasks and code reviews',
    type: 'Development',
    status: 'Active',
    lastActive: '2 minutes ago',
    tasks: 42,
    successRate: '98%',
    icon: Code,
    createdAt: '2023-04-15',
    createdBy: 'John Doe',
    capabilities: [
        'Code generation',
        'Code review',
        'Bug fixing',
        'Documentation',
        'Refactoring'
    ],
    configuration: {
        model: 'GPT-4',
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
    },
    recentTasks: [
        {
            id: 1,
            title: 'Implement new API endpoint',
            status: 'Completed',
            completedAt: '2023-06-10'
        },
        {
            id: 2,
            title: 'Fix authentication bug',
            status: 'In Progress',
            startedAt: '2023-06-12'
        },
        {
            id: 3,
            title: 'Optimize database queries',
            status: 'Pending',
            assignedAt: '2023-06-11'
        }
    ],
    logs: [
        {
            timestamp: '2023-06-12T14:30:00Z',
            level: 'INFO',
            message: 'Agent started task #2: Fix authentication bug'
        },
        {
            timestamp: '2023-06-12T14:35:22Z',
            level: 'INFO',
            message: 'Analyzing authentication flow'
        },
        {
            timestamp: '2023-06-12T14:40:15Z',
            level: 'WARNING',
            message: 'Detected potential security issue in token validation'
        },
        {
            timestamp: '2023-06-12T14:45:30Z',
            level: 'INFO',
            message: 'Implementing fix for token validation'
        }
    ]
};
/**
 * Agent Detail page component
 */
var AgentDetail = function () {
    var id = useParams().id;
    var _a = useState('overview'), activeTab = _a[0], setActiveTab = _a[1];
    // In a real app, we would fetch the agent details based on the ID
    var agent = mockAgentDetails;
    // Get status badge
    var getStatusBadge = function (status) {
        switch (status) {
            case 'Active':
                return (_jsxs(Badge, { className: "bg-green-100 text-green-800 hover:bg-green-100", children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Inactive':
                return (_jsxs(Badge, { className: "bg-gray-100 text-gray-800 hover:bg-gray-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Maintenance':
                return (_jsxs(Badge, { className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", children: [_jsx(AlertCircle, { className: "w-3 h-3 mr-1" }), status] }));
            default:
                return _jsx(Badge, { children: status });
        }
    };
    // Format date
    var formatDate = function (dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    // Format timestamp
    var formatTimestamp = function (timestamp) {
        var date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        });
    };
    // Get log level badge
    var getLogLevelBadge = function (level) {
        switch (level) {
            case 'INFO':
                return _jsx(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: level });
            case 'WARNING':
                return _jsx(Badge, { className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", children: level });
            case 'ERROR':
                return _jsx(Badge, { className: "bg-red-100 text-red-800 hover:bg-red-100", children: level });
            case 'DEBUG':
                return _jsx(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-100", children: level });
            default:
                return _jsx(Badge, { children: level });
        }
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-start mb-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-3 rounded-lg bg-primary/10 mr-4", children: _jsx(agent.icon, { className: "h-8 w-8 text-primary" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: agent.name }), _jsx("p", { className: "text-muted-foreground", children: agent.description })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [agent.status === 'Active' ? (_jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Pause, { className: "h-4 w-4 mr-2" }), "Pause Agent"] })) : (_jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Activate Agent"] })), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Restart"] }), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Edit"] }), _jsxs(Button, { variant: "destructive", size: "sm", children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Delete"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6", children: [_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground", children: "Status" }), getStatusBadge(agent.status)] }), _jsx("div", { className: "text-2xl font-bold", children: agent.status }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Last active: ", agent.lastActive] })] }), _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground", children: "Tasks Completed" }), _jsx(Activity, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx("div", { className: "text-2xl font-bold", children: agent.tasks }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Success rate: ", agent.successRate] })] }), _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground", children: "Created" }), _jsx(History, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx("div", { className: "text-2xl font-bold", children: formatDate(agent.createdAt) }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["By: ", agent.createdBy] })] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "mb-6", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsxs(TabsTrigger, { value: "overview", children: [_jsx(Bot, { className: "h-4 w-4 mr-2" }), "Overview"] }), _jsxs(TabsTrigger, { value: "tasks", children: [_jsx(List, { className: "h-4 w-4 mr-2" }), "Tasks"] }), _jsxs(TabsTrigger, { value: "logs", children: [_jsx(Activity, { className: "h-4 w-4 mr-2" }), "Logs"] }), _jsxs(TabsTrigger, { value: "settings", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Settings"] })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Agent Capabilities" }), _jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: agent.capabilities.map(function (capability, index) { return (_jsx(Badge, { variant: "outline", children: capability }, index)); }) }), _jsx("p", { className: "text-muted-foreground", children: "This agent is designed to assist with various coding tasks, including code generation, code review, bug fixing, documentation, and refactoring. It uses advanced AI models to understand code context and provide helpful suggestions." })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-4", children: agent.recentTasks.map(function (task) { return (_jsxs("div", { className: "flex justify-between items-center p-3 border rounded-md", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: task.title }), _jsx("div", { className: "text-sm text-muted-foreground", children: task.status === 'Completed' ? "Completed on ".concat(task.completedAt) :
                                                                                task.status === 'In Progress' ? "Started on ".concat(task.startedAt) :
                                                                                    "Assigned on ".concat(task.assignedAt) })] }), _jsx(Badge, { className: task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-gray-100 text-gray-800', children: task.status })] }, task.id)); }) })] }) })] }), _jsx(TabsContent, { value: "tasks", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Task History" }), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(List, { className: "h-4 w-4 mr-2" }), "View All Tasks"] })] }), _jsx("div", { className: "space-y-4", children: _jsx("p", { className: "text-muted-foreground", children: "Detailed task history would be displayed here, including all tasks assigned to this agent, their status, completion time, and performance metrics." }) })] }) }) }), _jsx(TabsContent, { value: "logs", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Agent Logs" }), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Refresh Logs"] })] }), _jsx("div", { className: "space-y-2", children: agent.logs.map(function (log, index) { return (_jsxs("div", { className: "flex items-start p-2 border-b last:border-0", children: [_jsx("div", { className: "w-40 shrink-0 text-sm text-muted-foreground", children: formatTimestamp(log.timestamp) }), _jsx("div", { className: "w-20 shrink-0", children: getLogLevelBadge(log.level) }), _jsx("div", { className: "flex-1 text-sm", children: log.message })] }, index)); }) })] }) }) }), _jsxs(TabsContent, { value: "settings", className: "space-y-6", children: [_jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Agent Configuration" }), _jsx("div", { className: "space-y-4", children: Object.entries(agent.configuration).map(function (_a) {
                                                            var key = _a[0], value = _a[1];
                                                            return (_jsxs("div", { className: "flex justify-between items-center p-3 border rounded-md", children: [_jsx("div", { className: "font-medium capitalize", children: key.replace(/([A-Z])/g, ' $1').trim() }), _jsx("div", { className: "text-muted-foreground", children: value })] }, key));
                                                        }) })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Advanced Settings" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Advanced settings would be displayed here, including API keys, integration settings, permissions, and other configuration options." }), _jsxs(Button, { variant: "outline", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Edit Configuration"] })] }) })] })] })] }) })] }));
};
export default AgentDetail;
