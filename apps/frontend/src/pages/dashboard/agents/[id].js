import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgent } from '@/hooks/useAgent';
import AgentStatus from '@/components/agents/AgentStatus';
import AgentLogs from '@/components/agents/AgentLogs';
import AgentSettings from '@/components/agents/AgentSettings';
import AgentTasks from '@/components/agents/AgentTasks';
var AgentDetails = function () {
    var id = useParams().id;
    var _a = useAgent(id), agent = _a.agent, loading = _a.loading, error = _a.error;
    var _b = useState('overview'), activeTab = _b[0], setActiveTab = _b[1];
    var getStatusBadgeVariant = function (status) {
        switch (status) {
            case "online":
                return "success";
            case "offline":
                return "error";
            case "busy":
                return "warning";
            default:
                return "error";
        }
    };
    if (loading) {
        return _jsx("div", { children: "Loading..." });
    }
    if (error || !agent) {
        return _jsx("div", { children: "Error loading agent details" });
    }
    return (_jsx("div", { className: "container mx-auto p-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-2xl font-bold", children: [agent.name, _jsx(AgentStatus, { status: agent.status, className: "ml-2", variant: getStatusBadgeVariant(agent.status) })] }) }), _jsx(CardContent, { children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "tasks", children: "Tasks" }), _jsx(TabsTrigger, { value: "logs", children: "Logs" }), _jsx(TabsTrigger, { value: "settings", children: "Settings" })] }), _jsx(TabsContent, { value: "overview", children: _jsx("div", { className: "grid gap-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Agent Information" }) }), _jsx(CardContent, { children: _jsxs("dl", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Type" }), _jsx("dd", { className: "text-lg", children: agent.type })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Created" }), _jsx("dd", { className: "text-lg", children: new Date(agent.createdAt).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Last Active" }), _jsx("dd", { className: "text-lg", children: new Date(agent.lastActiveAt).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Tasks Completed" }), _jsx("dd", { className: "text-lg", children: agent.tasksCompleted })] })] }) })] }) }) }), _jsx(TabsContent, { value: "tasks", children: _jsx(AgentTasks, { agentId: agent.id }) }), _jsx(TabsContent, { value: "logs", children: _jsx(AgentLogs, { agentId: agent.id }) }), _jsx(TabsContent, { value: "settings", children: _jsx(AgentSettings, { agent: agent }) })] }) })] }) }));
};
export default AgentDetails;
