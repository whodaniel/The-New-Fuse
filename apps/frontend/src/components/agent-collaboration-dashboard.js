import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentNetwork } from './agent-network';
import { AgentSelector } from './agent-selector';
import AgentPersonalityCustomizer from './agent-personality-customizer';
import { webSocketService } from '../services/websocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
export var AgentCollaborationDashboard = function () {
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState(null), selectedAgent = _b[0], setSelectedAgent = _b[1];
    var _c = useState([]), tasks = _c[0], setTasks = _c[1];
    var _d = useState([]), collaborationData = _d[0], setCollaborationData = _d[1];
    var _e = useState(true), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    useEffect(function () {
        var handleAgentUpdate = function (updatedAgents) {
            setAgents(updatedAgents);
        };
        var handleTaskUpdate = function (updatedTasks) {
            setTasks(updatedTasks);
        };
        var handleCollaborationUpdate = function (data) {
            setCollaborationData(data);
            setIsLoading(false);
        };
        var handleError = function (err) {
            setError(err.message);
            setIsLoading(false);
        };
        webSocketService.on('agentsUpdate', handleAgentUpdate);
        webSocketService.on('tasksUpdate', handleTaskUpdate);
        webSocketService.on('collaborationMetricsUpdate', handleCollaborationUpdate);
        webSocketService.on('error', handleError);
        webSocketService.send('getAgents', {});
        webSocketService.send('getTasks', {});
        webSocketService.send('getCollaborationMetrics', {});
        return function () {
            webSocketService.off('agentsUpdate', handleAgentUpdate);
            webSocketService.off('tasksUpdate', handleTaskUpdate);
            webSocketService.off('collaborationMetricsUpdate', handleCollaborationUpdate);
            webSocketService.off('error', handleError);
        };
    }, []);
    if (isLoading) {
        return (_jsx("div", { className: "container mx-auto p-4", children: _jsxs(Card, { className: "w-full max-w-3xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Agent Collaboration Dashboard" }) }), _jsx(CardContent, { className: "flex justify-center items-center h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" }) })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "container mx-auto p-4", children: _jsxs(Card, { className: "w-full max-w-3xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Agent Collaboration Dashboard" }) }), _jsx(CardContent, { className: "flex justify-center items-center h-[400px] text-red-500", children: error })] }) }));
    }
    var handleNodeClick = function (node) {
        var agent = agents.find(function (agent) { return agent.id === node.id; });
        if (agent) {
            setSelectedAgent(agent);
        }
    };
    var handleAgentSelect = function (agent) {
        setSelectedAgent(agent);
    };
    return (_jsx("div", { className: "p-6", children: _jsx("div", { className: "grid gap-6", children: _jsxs(Tabs, { defaultValue: "network", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "network", children: "Network View" }), _jsx(TabsTrigger, { value: "agents", children: "Agent Management" }), _jsx(TabsTrigger, { value: "tasks", children: "Task Overview" }), _jsx(TabsTrigger, { value: "collaboration", children: "Collaboration Metrics" })] }), _jsx(TabsContent, { value: "network", className: "mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Agent Collaboration Network" }) }), _jsx(CardContent, { children: _jsx(AgentNetwork, { agents: agents, tasks: tasks, onNodeClick: handleNodeClick }) })] }) }), _jsx(TabsContent, { value: "agents", className: "mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Agent Management" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4", children: [_jsx(AgentSelector, { agents: agents, selectedAgent: selectedAgent, onSelect: handleAgentSelect }), selectedAgent && (_jsx(AgentPersonalityCustomizer, { agentId: selectedAgent.id }))] }) })] }) }), _jsx(TabsContent, { value: "tasks", className: "mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Task Overview" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: tasks.map(function (task) {
                                            var assignedAgent = agents.find(function (a) { return a.id === task.assignedTo; });
                                            return (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: task.title }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Assigned to: ", assignedAgent === null || assignedAgent === void 0 ? void 0 : assignedAgent.name] })] }), _jsx("span", { className: "px-2 py-1 rounded-full text-xs capitalize", style: {
                                                                    backgroundColor: task.status === 'completed' ? '#4ade80' :
                                                                        task.status === 'in_progress' ? '#fbbf24' : '#e5e7eb',
                                                                    color: task.status === 'completed' ? '#166534' :
                                                                        task.status === 'in_progress' ? '#92400e' : '#374151'
                                                                }, children: task.status.replace('_', ' ') })] }) }) }, task.id));
                                        }) }) })] }) }), _jsx(TabsContent, { value: "collaboration", className: "mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Collaboration Metrics" }) }), _jsx(CardContent, { children: _jsxs(LineChart, { width: 800, height: 400, data: collaborationData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#8884d8", name: "Collaboration Score" })] }) })] }) })] }) }) }));
};
