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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAgentsWorkflow, useMcpTools } from '@/hooks';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X } from 'lucide-react';
export var NodeProperties = function (_a) {
    var node = _a.node;
    var agents = useAgentsWorkflow().agents;
    var tools = useMcpTools().tools;
    var _b = useState(node.data), nodeData = _b[0], setNodeData = _b[1];
    var _c = useState('general'), activeTab = _c[0], setActiveTab = _c[1];
    useEffect(function () {
        setNodeData(node.data);
    }, [node]);
    var handleChange = function (field, value) {
        setNodeData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    var handleSave = function () {
        // In a real app, this would update the node in the workflow context
        console.log('Saving node data:', nodeData);
    };
    var renderAgentProperties = function () {
        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "agent", children: "Agent" }), _jsxs(Select, { id: "agent", value: nodeData.agentId || '', onChange: function (e) { return handleChange('agentId', e.target.value); }, children: [_jsx("option", { value: "", children: "Select an agent" }), agents.map(function (agent) { return (_jsx("option", { value: agent.id, children: agent.name }, agent.id)); })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "action", children: "Action" }), _jsxs(Select, { id: "action", value: nodeData.action || '', onChange: function (e) { return handleChange('action', e.target.value); }, children: [_jsx("option", { value: "", children: "Select an action" }), _jsx("option", { value: "analyze", children: "Analyze" }), _jsx("option", { value: "generate", children: "Generate" }), _jsx("option", { value: "transform", children: "Transform" }), _jsx("option", { value: "review", children: "Review" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "timeout", children: "Timeout (seconds)" }), _jsx(Input, { id: "timeout", type: "number", value: nodeData.timeout || 60, onChange: function (e) { return handleChange('timeout', parseInt(e.target.value)); }, min: 1 })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "retries", children: "Retries" }), _jsx(Input, { id: "retries", type: "number", value: nodeData.retries || 0, onChange: function (e) { return handleChange('retries', parseInt(e.target.value)); }, min: 0 })] })] }));
    };
    var renderToolProperties = function () {
        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "tool", children: "Tool" }), _jsxs(Select, { id: "tool", value: nodeData.toolId || '', onChange: function (e) { return handleChange('toolId', e.target.value); }, children: [_jsx("option", { value: "", children: "Select a tool" }), tools.map(function (tool) { return (_jsx("option", { value: tool.id, children: tool.name }, tool.id)); })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "parameters", children: "Parameters (JSON)" }), _jsx(Textarea, { id: "parameters", value: nodeData.parameters ? JSON.stringify(nodeData.parameters, null, 2) : '{}', onChange: function (e) {
                                try {
                                    var params = JSON.parse(e.target.value);
                                    handleChange('parameters', params);
                                }
                                catch (error) {
                                    // Handle invalid JSON
                                }
                            }, rows: 5 })] })] }));
    };
    var renderConditionProperties = function () {
        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "condition", children: "Condition Type" }), _jsxs(Select, { id: "condition", value: nodeData.conditionType || 'expression', onChange: function (e) { return handleChange('conditionType', e.target.value); }, children: [_jsx("option", { value: "expression", children: "Expression" }), _jsx("option", { value: "status", children: "Status Check" }), _jsx("option", { value: "data", children: "Data Check" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "expression", children: "Expression" }), _jsx(Textarea, { id: "expression", value: nodeData.expression || '', onChange: function (e) { return handleChange('expression', e.target.value); }, placeholder: "result.success === true", rows: 3 }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Use JavaScript expressions to define conditions." })] })] }));
    };
    var renderInputOutputProperties = function () {
        return (_jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx(Label, { htmlFor: "dataMapping", children: "Data Mapping (JSON)" }), _jsx(Textarea, { id: "dataMapping", value: nodeData.dataMapping ? JSON.stringify(nodeData.dataMapping, null, 2) : '{}', onChange: function (e) {
                            try {
                                var mapping = JSON.parse(e.target.value);
                                handleChange('dataMapping', mapping);
                            }
                            catch (error) {
                                // Handle invalid JSON
                            }
                        }, rows: 5 }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Define how data is mapped between nodes." })] }) }));
    };
    var renderPropertiesByType = function () {
        switch (node.type) {
            case 'agent':
                return renderAgentProperties();
            case 'mcpTool':
                return renderToolProperties();
            case 'condition':
                return renderConditionProperties();
            case 'input':
            case 'output':
                return renderInputOutputProperties();
            default:
                return (_jsx("div", { className: "text-center py-4 text-gray-500", children: "No specific properties for this node type." }));
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "font-medium", children: "Node Properties" }), _jsxs("div", { className: "text-xs text-gray-500", children: ["ID: ", node.id] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "w-full", children: [_jsx(TabsTrigger, { value: "general", className: "flex-1", children: "General" }), _jsx(TabsTrigger, { value: "specific", className: "flex-1", children: "Specific" }), _jsx(TabsTrigger, { value: "advanced", className: "flex-1", children: "Advanced" })] }), _jsxs(TabsContent, { value: "general", className: "space-y-4 pt-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "label", children: "Label" }), _jsx(Input, { id: "label", value: nodeData.label || '', onChange: function (e) { return handleChange('label', e.target.value); }, placeholder: "Node Label" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", value: nodeData.description || '', onChange: function (e) { return handleChange('description', e.target.value); }, placeholder: "Describe what this node does", rows: 3 })] })] }), _jsx(TabsContent, { value: "specific", className: "space-y-4 pt-4", children: renderPropertiesByType() }), _jsxs(TabsContent, { value: "advanced", className: "space-y-4 pt-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "errorHandling", children: "Error Handling" }), _jsxs(Select, { id: "errorHandling", value: nodeData.errorHandling || 'continue', onChange: function (e) { return handleChange('errorHandling', e.target.value); }, children: [_jsx("option", { value: "continue", children: "Continue Workflow" }), _jsx("option", { value: "stop", children: "Stop Workflow" }), _jsx("option", { value: "retry", children: "Retry Node" }), _jsx("option", { value: "custom", children: "Custom Path" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "customId", children: "Custom ID" }), _jsx(Input, { id: "customId", value: nodeData.customId || '', onChange: function (e) { return handleChange('customId', e.target.value); }, placeholder: "Optional custom identifier" })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-2 pt-4 border-t", children: [_jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(X, { className: "h-4 w-4 mr-2" }), "Cancel"] }), _jsxs(Button, { size: "sm", onClick: handleSave, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Apply"] })] })] }));
};
export default NodeProperties;
