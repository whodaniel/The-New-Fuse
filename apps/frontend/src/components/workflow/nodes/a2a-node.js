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
import { memo } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
/**
 * A2A Node Component
 *
 * This component represents an Agent-to-Agent communication node in the workflow.
 * It allows configuring communication between agents using the A2A protocol.
 */
var A2ANode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    // Get config from data or initialize with defaults
    var config = data.config || {};
    // Handle agent selection
    var handleAgentChange = function (agentId) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { agentId: agentId })
            });
        }
    };
    // Handle communication pattern change
    var handlePatternChange = function (pattern) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { communicationPattern: pattern })
            });
        }
    };
    // Handle message type change
    var handleMessageTypeChange = function (messageType) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { messageType: messageType })
            });
        }
    };
    // Handle timeout change
    var handleTimeoutChange = function (timeout) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { timeout: timeout })
            });
        }
    };
    // Handle retry count change
    var handleRetryCountChange = function (retryCount) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { retryCount: retryCount })
            });
        }
    };
    // Handle priority change
    var handlePriorityChange = function (priority) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { priority: priority })
            });
        }
    };
    // Handle payload template change
    var handlePayloadTemplateChange = function (payloadTemplate) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { payloadTemplate: payloadTemplate })
            });
        }
    };
    // Input and output handles
    var inputHandles = [
        { id: 'input', label: 'Input' },
        { id: 'context', label: 'Context' }
    ];
    var outputHandles = [
        { id: 'result', label: 'Result' },
        { id: 'error', label: 'Error' },
        { id: 'status', label: 'Status' }
    ];
    // Render node content
    var renderContent = function () {
        var _a;
        return (_jsx("div", { className: "space-y-3", children: _jsxs(Tabs, { defaultValue: "basic", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "basic", children: "Basic" }), _jsx(TabsTrigger, { value: "advanced", children: "Advanced" }), _jsx(TabsTrigger, { value: "payload", children: "Payload" }), _jsx(TabsTrigger, { value: "protocol", children: "Protocol" })] }), _jsxs(TabsContent, { value: "basic", className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "agent-select-".concat(id), className: "text-xs", children: "Target Agent" }), _jsxs("select", { id: "agent-select-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: config.agentId || '', onChange: function (e) { return handleAgentChange(e.target.value); }, children: [_jsx("option", { value: "", children: "Select Agent" }), ((_a = data.agents) === null || _a === void 0 ? void 0 : _a.map(function (agent) { return (_jsx("option", { value: agent.id, children: agent.name }, agent.id)); })) || (_jsxs(_Fragment, { children: [_jsx("option", { value: "agent-1", children: "Code Assistant" }), _jsx("option", { value: "agent-2", children: "Data Analyzer" }), _jsx("option", { value: "agent-3", children: "Content Writer" })] }))] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "pattern-select-".concat(id), className: "text-xs", children: "Communication Pattern" }), _jsxs("select", { id: "pattern-select-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: config.communicationPattern || 'direct', onChange: function (e) { return handlePatternChange(e.target.value); }, children: [_jsx("option", { value: "direct", children: "Direct" }), _jsx("option", { value: "broadcast", children: "Broadcast" }), _jsx("option", { value: "request-response", children: "Request-Response" }), _jsx("option", { value: "publish-subscribe", children: "Publish-Subscribe" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "message-type-".concat(id), className: "text-xs", children: "Message Type" }), _jsxs("select", { id: "message-type-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: config.messageType || 'TASK_REQUEST', onChange: function (e) { return handleMessageTypeChange(e.target.value); }, children: [_jsx("option", { value: "TASK_REQUEST", children: "Task Request" }), _jsx("option", { value: "QUERY", children: "Query" }), _jsx("option", { value: "NOTIFICATION", children: "Notification" }), _jsx("option", { value: "STATUS_UPDATE", children: "Status Update" }), _jsx("option", { value: "ERROR", children: "Error" })] })] })] }), _jsxs(TabsContent, { value: "advanced", className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "timeout-".concat(id), className: "text-xs", children: "Timeout (ms)" }), _jsx(Input, { id: "timeout-".concat(id), type: "number", className: "h-7 text-xs", value: config.timeout || 30000, onChange: function (e) { return handleTimeoutChange(parseInt(e.target.value)); }, min: 0, step: 1000 })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "retry-count-".concat(id), className: "text-xs", children: "Retry Count" }), _jsx(Input, { id: "retry-count-".concat(id), type: "number", className: "h-7 text-xs", value: config.retryCount || 3, onChange: function (e) { return handleRetryCountChange(parseInt(e.target.value)); }, min: 0, max: 10 })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "priority-".concat(id), className: "text-xs", children: "Priority" }), _jsxs("select", { id: "priority-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: config.priority || 'medium', onChange: function (e) { return handlePriorityChange(e.target.value); }, children: [_jsx("option", { value: "low", children: "Low" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "high", children: "High" })] })] })] }), _jsx(TabsContent, { value: "payload", className: "space-y-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "payload-template-".concat(id), className: "text-xs", children: "Payload Template" }), _jsx(Textarea, { id: "payload-template-".concat(id), className: "h-32 text-xs font-mono resize-none", placeholder: "Enter payload template in JSON format. Use {{variable}} for dynamic values.", value: config.payloadTemplate || '{\n  "data": {{input}},\n  "context": {{context}}\n}', onChange: function (e) { return handlePayloadTemplateChange(e.target.value); } }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Use ", { input: input }, " and ", { context: context }, " to reference input values."] })] }) }), _jsxs(TabsContent, { value: "protocol", className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "protocol-version-".concat(id), className: "text-xs", children: "Protocol Version" }), _jsxs("select", { id: "protocol-version-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: config.protocolVersion || '1.0', onChange: function (e) {
                                            if (data.onUpdate) {
                                                data.onUpdate({
                                                    config: __assign(__assign({}, config), { protocolVersion: e.target.value })
                                                });
                                            }
                                        }, children: [_jsx("option", { value: "1.0", children: "A2A Protocol v1.0" }), _jsx("option", { value: "2.0", children: "A2A Protocol v2.0" })] }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: config.protocolVersion === '2.0' ?
                                            'v2.0 uses a header/body structure with enhanced metadata.' :
                                            'v1.0 uses a flat message structure with basic metadata.' })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "message-encryption-".concat(id), className: "text-xs", children: "Message Encryption" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { id: "message-encryption-".concat(id), type: "checkbox", checked: config.enableEncryption || false, onChange: function (e) {
                                                    if (data.onUpdate) {
                                                        data.onUpdate({
                                                            config: __assign(__assign({}, config), { enableEncryption: e.target.checked })
                                                        });
                                                    }
                                                }, className: "h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary" }), _jsx("label", { htmlFor: "message-encryption-".concat(id), className: "text-xs", children: "Enable end-to-end encryption" })] }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Encrypts message content for secure agent-to-agent communication." })] })] })] }) }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: data.name || 'A2A Communication', type: 'a2a', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
A2ANode.displayName = 'A2ANode';
export { A2ANode };
