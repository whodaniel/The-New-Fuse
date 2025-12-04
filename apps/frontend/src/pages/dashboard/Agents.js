import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/core';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
var agentData = [
    {
        id: 1,
        name: 'Agent Smith',
        type: 'Task Manager',
        status: 'Active',
        tasks: 12,
    },
    {
        id: 2,
        name: 'Agent Johnson',
        type: 'Data Processor',
        status: 'Idle',
        tasks: 8,
    },
    {
        id: 3,
        name: 'Agent Brown',
        type: 'Communication',
        status: 'Active',
        tasks: 15,
    },
];
var Agents = function () {
    var navigate = useNavigate();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-3xl font-bold", children: "Agents" }), _jsxs(Button, { onClick: function () { return navigate('/dashboard/agents/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Add Agent"] })] }), _jsx("div", { className: "grid gap-6", children: agentData.map(function (agent) { return (_jsxs(Card, { className: "cursor-pointer hover:bg-accent/50 transition-colors", onClick: function () { return navigate("/dashboard/agents/".concat(agent.id)); }, children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: agent.name }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Type" }), _jsx("p", { className: "text-sm font-medium", children: agent.type })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Status" }), _jsx("p", { className: "text-sm font-medium", children: agent.status })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Active Tasks" }), _jsx("p", { className: "text-sm font-medium", children: agent.tasks })] })] }) })] }, agent.id)); }) })] }));
};
export default Agents;
