import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Progress } from './ui/progress';
import { Alert } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
export function AgentWorkflowManager() {
    var _a;
    var _b = useState([]), workflows = _b[0], setWorkflows = _b[1];
    var _c = useState('all'), selectedType = _c[0], setSelectedType = _c[1];
    var _d = useState(new Set()), selectedWorkflows = _d[0], setSelectedWorkflows = _d[1];
    var _e = useState(false), showCreateDialog = _e[0], setShowCreateDialog = _e[1];
    var _f = useState(''), selectedTemplate = _f[0], setSelectedTemplate = _f[1];
    var _g = useWebSocket(), subscribe = _g.subscribe, send = _g.send;
    var templates = [
        {
            name: 'Data Analysis Pipeline',
            type: 'analysis',
            description: 'Standard data processing and analysis workflow',
            defaultAgentCount: 3
        },
        {
            name: 'Trading Strategy',
            type: 'trading',
            description: 'Automated trading workflow with market analysis',
            defaultAgentCount: 2
        },
        {
            name: 'Security Audit',
            type: 'security',
            description: 'Comprehensive security analysis workflow',
            defaultAgentCount: 4
        }
    ];
    useEffect(function () {
        var unsubscribe = subscribe('workflow_updates', function (data) {
            setWorkflows(data);
        });
        send('get_workflows');
        return function () { return unsubscribe(); };
    }, [subscribe, send]);
    var handleWorkflowAction = function (id, action) {
        send('workflow_action', { id: id, action: action });
    };
    var handleBatchAction = function (action) {
        selectedWorkflows.forEach(function (id) {
            send('workflow_action', { id: id, action: action });
        });
        setSelectedWorkflows(new Set());
    };
    var handleCreateWorkflow = function () {
        var template = templates.find(function (t) { return t.name === selectedTemplate; });
        if (template) {
            send('create_workflow', {
                template: template.name,
                type: template.type,
                agentCount: template.defaultAgentCount
            });
            setShowCreateDialog(false);
            setSelectedTemplate('');
        }
    };
    var toggleWorkflowSelection = function (id) {
        setSelectedWorkflows(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            }
            else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    var filteredWorkflows = selectedType === 'all'
        ? workflows
        : workflows.filter(function (w) { return w.type === selectedType; });
    var getStatusColor = function (status) {
        var colors = {
            running: 'bg-green-500',
            paused: 'bg-yellow-500',
            completed: 'bg-blue-500',
            failed: 'bg-red-500'
        };
        return colors[status];
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Agent Workflows" }), _jsx(Button, { size: "sm", onClick: function () { return setShowCreateDialog(true); }, children: "Create Workflow" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [selectedWorkflows.size > 0 && (_jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: function () { return handleBatchAction('pause'); }, children: "Pause Selected" }), _jsx(Button, { size: "sm", variant: "outline", onClick: function () { return handleBatchAction('resume'); }, children: "Resume Selected" }), _jsx(Button, { size: "sm", variant: "destructive", onClick: function () { return handleBatchAction('stop'); }, children: "Stop Selected" })] })), _jsxs(Select, { value: selectedType, onValueChange: setSelectedType, children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "Filter by type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "analysis", children: "Analysis" }), _jsx(SelectItem, { value: "trading", children: "Trading" }), _jsx(SelectItem, { value: "security", children: "Security" }), _jsx(SelectItem, { value: "content", children: "Content" })] })] })] })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [filteredWorkflows.map(function (workflow) { return (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("input", { type: "checkbox", checked: selectedWorkflows.has(workflow.id), onChange: function () { return toggleWorkflowSelection(workflow.id); }, className: "h-4 w-4 rounded border-gray-300" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: workflow.name }), _jsxs("div", { className: "flex space-x-2 mt-1", children: [_jsx(Badge, { className: getStatusColor(workflow.status), children: workflow.status }), _jsxs(Badge, { variant: "outline", children: [workflow.agentCount, " agents"] }), workflow.template && (_jsx(Badge, { variant: "secondary", children: workflow.template }))] })] })] }), _jsxs("div", { className: "space-x-2", children: [workflow.status === 'running' && (_jsx(Button, { size: "sm", variant: "outline", onClick: function () { return handleWorkflowAction(workflow.id, 'pause'); }, children: "Pause" })), workflow.status === 'paused' && (_jsx(Button, { size: "sm", variant: "outline", onClick: function () { return handleWorkflowAction(workflow.id, 'resume'); }, children: "Resume" })), _jsx(Button, { size: "sm", variant: "destructive", onClick: function () { return handleWorkflowAction(workflow.id, 'stop'); }, children: "Stop" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [workflow.progress, "%"] })] }), _jsx(Progress, { value: workflow.progress })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mt-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", children: workflow.metrics.tasksCompleted }), _jsx("div", { className: "text-sm text-gray-600", children: "Completed" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", children: workflow.metrics.tasksRemaining }), _jsx("div", { className: "text-sm text-gray-600", children: "Remaining" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold", children: [workflow.metrics.errorRate, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Error Rate" })] })] })] })] }, workflow.id)); }), filteredWorkflows.length === 0 && (_jsx(Alert, { children: "No workflows found for the selected type." }))] }) }), _jsx(Dialog, { open: showCreateDialog, onOpenChange: setShowCreateDialog, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Create New Workflow" }) }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs(Select, { value: selectedTemplate, onValueChange: setSelectedTemplate, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select a template" }) }), _jsx(SelectContent, { children: templates.map(function (template) { return (_jsx(SelectItem, { value: template.name, children: template.name }, template.name)); }) })] }), selectedTemplate && (_jsx("div", { className: "text-sm text-gray-600", children: (_a = templates.find(function (t) { return t.name === selectedTemplate; })) === null || _a === void 0 ? void 0 : _a.description }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: function () { return setShowCreateDialog(false); }, children: "Cancel" }), _jsx(Button, { onClick: handleCreateWorkflow, disabled: !selectedTemplate, children: "Create" })] })] }) })] }));
}
