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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useWorkflow } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import 'reactflow/dist/style.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowCanvas, NodeToolbox, NodeProperties } from '@/components/workflow';
import { Save, Play, ChevronLeft, Download, Upload, Undo, Redo } from 'lucide-react';
/**
 * Workflow Builder page component
 */
var WorkflowBuilder = function () {
    var _a = useWorkflow(), currentWorkflow = _a.currentWorkflow, saveWorkflow = _a.saveWorkflow, executeWorkflow = _a.executeWorkflow;
    var navigate = useNavigate();
    var _b = useState((currentWorkflow === null || currentWorkflow === void 0 ? void 0 : currentWorkflow.name) || 'Untitled Workflow'), workflowName = _b[0], setWorkflowName = _b[1];
    var _c = useState((currentWorkflow === null || currentWorkflow === void 0 ? void 0 : currentWorkflow.description) || ''), workflowDescription = _c[0], setWorkflowDescription = _c[1];
    var _d = useState(null), selectedNode = _d[0], setSelectedNode = _d[1];
    var _e = useState(false), isSaving = _e[0], setIsSaving = _e[1];
    var _f = useState(false), isExecuting = _f[0], setIsExecuting = _f[1];
    // Update workflow name and description when currentWorkflow changes
    useEffect(function () {
        if (currentWorkflow) {
            setWorkflowName(currentWorkflow.name);
            setWorkflowDescription(currentWorkflow.description || '');
        }
    }, [currentWorkflow]);
    // Handle workflow save
    var handleSaveWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!currentWorkflow) return [3 /*break*/, 3];
                    return [4 /*yield*/, saveWorkflow(__assign(__assign({}, currentWorkflow), { name: workflowName, description: workflowDescription }))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    setIsSaving(false);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error saving workflow:', error_1);
                    setIsSaving(false);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Handle workflow execution
    var handleExecuteWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsExecuting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!currentWorkflow) return [3 /*break*/, 3];
                    return [4 /*yield*/, executeWorkflow(currentWorkflow)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    setIsExecuting(false);
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('Error executing workflow:', error_2);
                    setIsExecuting(false);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Handle workflow export
    var handleExportWorkflow = function () {
        // In a real app, this would export the workflow as JSON
        console.log('Exporting workflow');
    };
    // Handle workflow import
    var handleImportWorkflow = function () {
        // In a real app, this would import a workflow from JSON
        console.log('Importing workflow');
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx("div", { className: "border-b p-4 bg-white", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/workflows'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back"] }), _jsxs("div", { children: [_jsx(Input, { value: workflowName, onChange: function (e) { return setWorkflowName(e.target.value); }, className: "text-xl font-bold border-none h-auto p-0 focus-visible:ring-0", placeholder: "Untitled Workflow" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Workflow Builder" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: handleExportWorkflow, title: "Export Workflow", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleImportWorkflow, title: "Import Workflow", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Import"] }), _jsx(Button, { variant: "outline", size: "sm", onClick: function () { }, title: "Undo", disabled: true, children: _jsx(Undo, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: function () { }, title: "Redo", disabled: true, children: _jsx(Redo, { className: "h-4 w-4" }) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleExecuteWorkflow, disabled: isExecuting, children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), isExecuting ? 'Executing...' : 'Execute'] }), _jsxs(Button, { variant: "default", size: "sm", onClick: handleSaveWorkflow, disabled: isSaving, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), isSaving ? 'Saving...' : 'Save'] })] })] }) }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsxs("div", { className: "w-64 border-r bg-white p-4 overflow-y-auto", children: [_jsx("h3", { className: "font-medium mb-4", children: "Nodes" }), _jsx(NodeToolbox, {})] }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(ReactFlowProvider, { children: _jsx(WorkflowProvider, { children: _jsx(WorkflowCanvas, { onNodeSelect: setSelectedNode }) }) }) }), _jsx("div", { className: "w-80 border-l bg-white p-4 overflow-y-auto", children: selectedNode ? (_jsx(NodeProperties, { node: selectedNode })) : (_jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-4", children: "Workflow Properties" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Input, { id: "description", value: workflowDescription, onChange: function (e) { return setWorkflowDescription(e.target.value); }, placeholder: "Describe the purpose of this workflow" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "trigger", children: "Trigger" }), _jsxs("select", { id: "trigger", "aria-label": "Workflow trigger type", className: "w-full p-2 border rounded-md", children: [_jsx("option", { value: "manual", children: "Manual" }), _jsx("option", { value: "scheduled", children: "Scheduled" }), _jsx("option", { value: "webhook", children: "Webhook" }), _jsx("option", { value: "event", children: "Event" })] })] })] })] })) })] })] })] }));
};
export default WorkflowBuilder;
