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
import { jsx as _jsx } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
// Lazy-loaded components
export var LazyWorkflowCanvas = lazy(function () { return import('./WorkflowCanvas.js').then(function (module) { return ({ default: module.WorkflowCanvas }); }); });
export var LazyNodeToolbox = lazy(function () { return import('./NodeToolbox.js').then(function (module) { return ({ default: module.NodeToolbox }); }); });
export var LazyNodeProperties = lazy(function () { return import('./NodeProperties.js').then(function (module) { return ({ default: module.NodeProperties }); }); });
export var LazyWorkflowExecutionContext = lazy(function () { return import('./WorkflowExecutionContext.js').then(function (module) { return ({ default: module.WorkflowExecutionContext }); }); });
export var LazyWorkflowDebugger = lazy(function () { return import('./WorkflowDebugger.js').then(function (module) { return ({ default: module.WorkflowDebugger }); }); });
export var LazyWorkflowAnalytics = lazy(function () { return import('./WorkflowAnalytics.js').then(function (module) { return ({ default: module.WorkflowAnalytics }); }); });
export var LazyWorkflowTemplates = lazy(function () { return import('./WorkflowTemplates.js').then(function (module) { return ({ default: module.WorkflowTemplates }); }); });
// Lazy-loaded node components
export var LazyAgentNode = lazy(function () { return import('./nodes/agent-node.js').then(function (module) { return ({ default: module.AgentNode }); }); });
export var LazyA2ANode = lazy(function () { return import('./nodes/a2a-node.js').then(function (module) { return ({ default: module.A2ANode }); }); });
export var LazyMCPToolNode = lazy(function () { return import('./nodes/mcp-tool-node.js').then(function (module) { return ({ default: module.MCPToolNode }); }); });
export var LazyTransformNode = lazy(function () { return import('./nodes/transform-node.js').then(function (module) { return ({ default: module.TransformNode }); }); });
export var LazyConditionNode = lazy(function () { return import('./nodes/condition-node.js').then(function (module) { return ({ default: module.ConditionNode }); }); });
export var LazyNotificationNode = lazy(function () { return import('./nodes/notification-node.js').then(function (module) { return ({ default: module.NotificationNode }); }); });
export var LazyInputNode = lazy(function () { return import('./nodes/input-node.js').then(function (module) { return ({ default: module.InputNode }); }); });
export var LazyOutputNode = lazy(function () { return import('./nodes/output-node.js').then(function (module) { return ({ default: module.OutputNode }); }); });
// Loading fallback
var LoadingFallback = function () { return (_jsx("div", { className: "flex items-center justify-center h-full w-full", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })); };
// Wrapped components with Suspense
export var WorkflowCanvas = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyWorkflowCanvas, __assign({}, props)) })); };
export var NodeToolbox = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyNodeToolbox, __assign({}, props)) })); };
export var NodeProperties = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyNodeProperties, __assign({}, props)) })); };
export var WorkflowExecutionContext = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyWorkflowExecutionContext, __assign({}, props)) })); };
export var WorkflowDebugger = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyWorkflowDebugger, __assign({}, props)) })); };
export var WorkflowAnalytics = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyWorkflowAnalytics, __assign({}, props)) })); };
export var WorkflowTemplates = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyWorkflowTemplates, __assign({}, props)) })); };
// Node components
export var AgentNode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyAgentNode, __assign({}, props)) })); };
export var A2ANode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyA2ANode, __assign({}, props)) })); };
export var MCPToolNode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyMCPToolNode, __assign({}, props)) })); };
export var TransformNode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyTransformNode, __assign({}, props)) })); };
export var ConditionNode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyConditionNode, __assign({}, props)) })); };
export var NotificationNode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyNotificationNode, __assign({}, props)) })); };
export var InputNode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyInputNode, __assign({}, props)) })); };
export var OutputNode = function (props) { return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LazyOutputNode, __assign({}, props)) })); };
