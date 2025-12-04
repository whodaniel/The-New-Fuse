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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { workflowExecutionService } from '@/services/WorkflowExecutionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, SkipForward, Bug, X } from 'lucide-react';
export var WorkflowDebugger = function (_a) {
    var workflowId = _a.workflowId;
    var _b = useState(false), isOpen = _b[0], setIsOpen = _b[1];
    var _c = useState(workflowExecutionService.getDebugOptions()), debugOptions = _c[0], setDebugOptions = _c[1];
    var _d = useState([]), selectedNodes = _d[0], setSelectedNodes = _d[1];
    var _e = useReactFlow(), getNodes = _e.getNodes, setNodes = _e.setNodes;
    // Update debug options
    var updateDebugOptions = function (options) {
        var newOptions = __assign(__assign({}, debugOptions), options);
        setDebugOptions(newOptions);
        workflowExecutionService.setDebugOptions(newOptions);
    };
    // Toggle debug mode
    var toggleDebugMode = function () {
        updateDebugOptions({ enabled: !debugOptions.enabled });
    };
    // Toggle step-by-step execution
    var toggleStepByStep = function () {
        updateDebugOptions({ stepByStep: !debugOptions.stepByStep });
    };
    // Continue execution
    var continueExecution = function () {
        workflowExecutionService.continueExecution();
    };
    // Toggle breakpoint for a node
    var toggleBreakpoint = function (nodeId) {
        var breakpoints = __spreadArray([], debugOptions.breakpoints, true);
        var index = breakpoints.indexOf(nodeId);
        if (index === -1) {
            breakpoints.push(nodeId);
        }
        else {
            breakpoints.splice(index, 1);
        }
        updateDebugOptions({ breakpoints: breakpoints });
        // Update node UI
        setNodes(function (nodes) {
            return nodes.map(function (node) {
                var _a;
                if (node.id === nodeId) {
                    return __assign(__assign({}, node), { data: __assign(__assign({}, node.data), { debug: __assign(__assign({}, (_a = node.data) === null || _a === void 0 ? void 0 : _a.debug), { breakpoint: index === -1 }) }) });
                }
                return node;
            });
        });
    };
    // Set log level
    var setLogLevel = function (level) {
        updateDebugOptions({ logLevel: level });
    };
    // Get nodes for breakpoint selection
    var nodes = getNodes();
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute bottom-4 left-4", children: _jsx(Button, { variant: isOpen ? 'default' : 'outline', size: "sm", onClick: function () { return setIsOpen(!isOpen); }, className: "h-8 w-8 p-0", children: _jsx(Bug, { className: "h-4 w-4" }) }) }), isOpen && (_jsxs(Card, { className: "absolute bottom-14 left-4 w-80 shadow-lg", children: [_jsxs(CardHeader, { className: "pb-2 flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-sm", children: "Workflow Debugger" }), _jsx(CardDescription, { children: "Debug and step through workflow execution" })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return setIsOpen(false); }, className: "h-6 w-6 p-0", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "debug-mode", className: "text-sm", children: "Debug Mode" }), _jsx(Switch, { id: "debug-mode", checked: debugOptions.enabled, onCheckedChange: toggleDebugMode })] }), debugOptions.enabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "step-by-step", className: "text-sm", children: "Step-by-Step Execution" }), _jsx(Switch, { id: "step-by-step", checked: debugOptions.stepByStep, onCheckedChange: toggleStepByStep })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Log Level" }), _jsx("div", { className: "grid grid-cols-5 gap-1", children: ['error', 'warn', 'info', 'debug', 'trace'].map(function (level) { return (_jsx(Button, { variant: debugOptions.logLevel === level ? 'default' : 'outline', size: "sm", className: "text-xs h-7", onClick: function () { return setLogLevel(level); }, children: level }, level)); }) })] }), _jsxs(Tabs, { defaultValue: "breakpoints", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "breakpoints", children: "Breakpoints" }), _jsx(TabsTrigger, { value: "controls", children: "Controls" })] }), _jsxs(TabsContent, { value: "breakpoints", className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Set Breakpoints" }), _jsx("div", { className: "max-h-40 overflow-y-auto space-y-1", children: nodes.map(function (node) {
                                                            var _a;
                                                            return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs", children: [((_a = node.data) === null || _a === void 0 ? void 0 : _a.name) || node.type, " (", node.id, ")"] }), _jsx(Switch, { checked: debugOptions.breakpoints.includes(node.id), onCheckedChange: function () { return toggleBreakpoint(node.id); } })] }, node.id));
                                                        }) })] }), _jsxs(TabsContent, { value: "controls", className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Execution Controls" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: continueExecution, className: "flex-1", children: [_jsx(Play, { className: "h-4 w-4 mr-1" }), "Continue"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: continueExecution, className: "flex-1", children: [_jsx(SkipForward, { className: "h-4 w-4 mr-1" }), "Step"] })] })] })] })] }))] })] }))] }));
};
export default WorkflowDebugger;
