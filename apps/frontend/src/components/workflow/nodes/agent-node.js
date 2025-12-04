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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useState } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgentsWorkflow } from '@/hooks/useAgentsWorkflow';
var AgentNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    var _b = useAgentsWorkflow(), agents = _b.agents, loading = _b.loading;
    var _c = useState(null), selectedAgent = _c[0], setSelectedAgent = _c[1];
    // Load selected agent details
    useEffect(function () {
        var _a;
        if (((_a = data.config) === null || _a === void 0 ? void 0 : _a.agentId) && agents.length > 0) {
            var agent = agents.find(function (a) { return a.id === data.config.agentId; });
            if (agent) {
                setSelectedAgent(agent);
            }
        }
    }, [data.config, agents]);
    // Update node when agent selection changes
    var handleAgentChange = function (agentId) {
        var agent = agents.find(function (a) { return a.id === agentId; });
        setSelectedAgent(agent || null);
        if (data.onUpdate) {
            data.onUpdate({
                name: (agent === null || agent === void 0 ? void 0 : agent.name) || 'Agent',
                config: __assign(__assign({}, data.config), { agentId: agentId })
            });
        }
    };
    var inputHandles = [
        { id: 'default', label: 'Input' }
    ];
    var outputHandles = [
        { id: 'default', label: 'Output' },
        { id: 'error', label: 'Error' }
    ];
    var renderContent = function () {
        var _a;
        return (_jsx(_Fragment, { children: _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "agent-".concat(id), className: "text-xs", children: "Agent" }), _jsxs(Select, { value: ((_a = data.config) === null || _a === void 0 ? void 0 : _a.agentId) || '', onValueChange: handleAgentChange, disabled: loading, children: [_jsx(SelectTrigger, { id: "agent-".concat(id), className: "text-xs h-8", children: _jsx(SelectValue, { placeholder: "Select agent" }) }), _jsx(SelectContent, { children: agents.map(function (agent) { return (_jsx(SelectItem, { value: agent.id, className: "text-xs", children: agent.name }, agent.id)); }) })] }), selectedAgent && (_jsxs("div", { className: "text-xs text-muted-foreground mt-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", selectedAgent.type] }), selectedAgent.description && (_jsx("p", { className: "mt-1 line-clamp-2", children: selectedAgent.description }))] }))] }) }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: (selectedAgent === null || selectedAgent === void 0 ? void 0 : selectedAgent.name) || data.name || 'Agent', type: 'agent', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
AgentNode.displayName = 'AgentNode';
export { AgentNode };
