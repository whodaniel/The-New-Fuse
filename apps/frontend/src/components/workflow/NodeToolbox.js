import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAgentsWorkflow, useMcpTools } from '@/hooks';
import { Bot, Code, GitBranch, Zap, Bell, Play, CheckCircle, Network, Repeat, Layers } from 'lucide-react';
var nodeTypes = [
    // Agent nodes
    {
        type: 'agent',
        label: 'Agent',
        icon: _jsx(Bot, { className: "h-5 w-5" }),
        description: 'Execute tasks using an AI agent',
        category: 'agent',
        color: 'bg-indigo-100 text-indigo-600'
    },
    {
        type: 'mcpTool',
        label: 'MCP Tool',
        icon: _jsx(Code, { className: "h-5 w-5" }),
        description: 'Use an MCP tool or command',
        category: 'tool',
        color: 'bg-emerald-100 text-emerald-600'
    },
    // Flow control nodes
    {
        type: 'condition',
        label: 'Condition',
        icon: _jsx(GitBranch, { className: "h-5 w-5" }),
        description: 'Branch based on a condition',
        category: 'flow',
        color: 'bg-amber-100 text-amber-600'
    },
    {
        type: 'transform',
        label: 'Transform',
        icon: _jsx(Zap, { className: "h-5 w-5" }),
        description: 'Transform data between nodes',
        category: 'flow',
        color: 'bg-purple-100 text-purple-600'
    },
    {
        type: 'loop',
        label: 'Loop',
        icon: _jsx(Repeat, { className: "h-5 w-5" }),
        description: 'Iterate over a collection or condition',
        category: 'flow',
        color: 'bg-orange-100 text-orange-600'
    },
    {
        type: 'subworkflow',
        label: 'Subworkflow',
        icon: _jsx(Layers, { className: "h-5 w-5" }),
        description: 'Execute a nested workflow',
        category: 'flow',
        color: 'bg-teal-100 text-teal-600'
    },
    // I/O nodes
    {
        type: 'input',
        label: 'Input',
        icon: _jsx(Play, { className: "h-5 w-5" }),
        description: 'Starting point of the workflow',
        category: 'io',
        color: 'bg-blue-100 text-blue-600'
    },
    {
        type: 'output',
        label: 'Output',
        icon: _jsx(CheckCircle, { className: "h-5 w-5" }),
        description: 'End point of the workflow',
        category: 'io',
        color: 'bg-red-100 text-red-600'
    },
    {
        type: 'notification',
        label: 'Notification',
        icon: _jsx(Bell, { className: "h-5 w-5" }),
        description: 'Send a notification',
        category: 'io',
        color: 'bg-sky-100 text-sky-600'
    },
    {
        type: 'a2a',
        label: 'A2A Communication',
        icon: _jsx(Network, { className: "h-5 w-5" }),
        description: 'Agent-to-Agent communication',
        category: 'agent',
        color: 'bg-pink-100 text-pink-600'
    }
];
export var NodeToolbox = function () {
    var _a = useAgentsWorkflow(), agents = _a.agents, agentsLoading = _a.loading;
    var _b = useMcpTools(), tools = _b.tools, toolsLoading = _b.loading;
    // Handle drag start
    var onDragStart = function (event, nodeType, nodeData) {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/data', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Agents & Tools" }), _jsx("div", { className: "space-y-2", children: nodeTypes
                            .filter(function (node) { return ['agent', 'tool'].includes(node.category); })
                            .map(function (node) { return (_jsxs("div", { className: "flex items-center p-2 border border-dashed rounded-md cursor-grab hover:bg-gray-50 transition-colors", draggable: true, onDragStart: function (e) { return onDragStart(e, node.type, {
                                label: node.label,
                                type: node.type,
                                status: 'idle'
                            }); }, children: [_jsx("div", { className: "p-2 rounded-md ".concat(node.color, " mr-3"), children: node.icon }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", children: node.label }), _jsx("div", { className: "text-xs text-gray-500", children: node.description })] })] }, node.type)); }) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Flow Control" }), _jsx("div", { className: "space-y-2", children: nodeTypes
                            .filter(function (node) { return node.category === 'flow'; })
                            .map(function (node) { return (_jsxs("div", { className: "flex items-center p-2 border border-dashed rounded-md cursor-grab hover:bg-gray-50 transition-colors", draggable: true, onDragStart: function (e) { return onDragStart(e, node.type, {
                                label: node.label,
                                type: node.type,
                                status: 'idle'
                            }); }, children: [_jsx("div", { className: "p-2 rounded-md ".concat(node.color, " mr-3"), children: node.icon }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", children: node.label }), _jsx("div", { className: "text-xs text-gray-500", children: node.description })] })] }, node.type)); }) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Input & Output" }), _jsx("div", { className: "space-y-2", children: nodeTypes
                            .filter(function (node) { return node.category === 'io'; })
                            .map(function (node) { return (_jsxs("div", { className: "flex items-center p-2 border border-dashed rounded-md cursor-grab hover:bg-gray-50 transition-colors", draggable: true, onDragStart: function (e) { return onDragStart(e, node.type, {
                                label: node.label,
                                type: node.type,
                                status: 'idle'
                            }); }, children: [_jsx("div", { className: "p-2 rounded-md ".concat(node.color, " mr-3"), children: node.icon }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", children: node.label }), _jsx("div", { className: "text-xs text-gray-500", children: node.description })] })] }, node.type)); }) })] })] }));
};
export default NodeToolbox;
