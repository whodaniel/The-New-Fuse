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
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflow } from '@/hooks';
import { ChevronLeft, Play, Pause, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
/**
 * Workflow Execution page component
 */
var WorkflowExecution = function () {
    var id = useParams().id;
    var navigate = useNavigate();
    var _a = useWorkflow(), workflows = _a.workflows, loading = _a.loading, error = _a.error, executeWorkflow = _a.executeWorkflow;
    var _b = useState(null), workflow = _b[0], setWorkflow = _b[1];
    var _c = useState(false), isExecuting = _c[0], setIsExecuting = _c[1];
    var _d = useState('idle'), executionStatus = _d[0], setExecutionStatus = _d[1];
    var _e = useState([]), executionLogs = _e[0], setExecutionLogs = _e[1];
    // Find the workflow by ID
    useEffect(function () {
        if (id && workflows.length > 0) {
            var foundWorkflow = workflows.find(function (w) { return w.id === id; });
            setWorkflow(foundWorkflow || null);
        }
    }, [id, workflows]);
    // Handle execute workflow
    var handleExecuteWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _loop_1, _i, _a, node, state_1, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!workflow)
                        return [2 /*return*/];
                    setIsExecuting(true);
                    setExecutionStatus('running');
                    setExecutionLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] Starting workflow execution...")], false); });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    _loop_1 = function (node) {
                        var success;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    setExecutionLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] Executing node: ").concat(node.data.name || node.id)], false); });
                                    // Simulate execution time
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                case 1:
                                    // Simulate execution time
                                    _c.sent();
                                    success = Math.random() > 0.2;
                                    if (success) {
                                        setExecutionLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] Node ").concat(node.data.name || node.id, " completed successfully")], false); });
                                    }
                                    else {
                                        setExecutionLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] Node ").concat(node.data.name || node.id, " failed: Error executing node")], false); });
                                        setExecutionStatus('failed');
                                        setIsExecuting(false);
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _a = workflow.nodes;
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    node = _a[_i];
                    return [5 /*yield**/, _loop_1(node)];
                case 3:
                    state_1 = _b.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    setExecutionLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] Workflow execution completed successfully")], false); });
                    setExecutionStatus('completed');
                    return [3 /*break*/, 8];
                case 6:
                    err_1 = _b.sent();
                    setExecutionLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] Workflow execution failed: ").concat(err_1 instanceof Error ? err_1.message : 'Unknown error')], false); });
                    setExecutionStatus('failed');
                    return [3 /*break*/, 8];
                case 7:
                    setIsExecuting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    // Handle pause execution
    var handlePauseExecution = function () {
        setIsExecuting(false);
        setExecutionLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] Workflow execution paused")], false); });
    };
    // Handle reset execution
    var handleResetExecution = function () {
        setExecutionStatus('idle');
        setExecutionLogs([]);
    };
    if (loading) {
        return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "container mx-auto py-6", children: _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }) }) })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "container mx-auto py-6", children: _jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md", children: error.message }) }) })] }));
    }
    if (!workflow) {
        return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "container mx-auto py-6", children: [_jsx("div", { className: "bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md", children: "Workflow not found. The workflow may have been deleted or you may not have access to it." }), _jsx("div", { className: "mt-4", children: _jsxs(Button, { variant: "outline", onClick: function () { return navigate('/workflows'); }, children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-2" }), "Back to Workflows"] }) })] }) })] }));
    }
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "container mx-auto py-6 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate("/workflows/".concat(id)); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back to Workflow"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: workflow.name }), _jsx("p", { className: "text-muted-foreground", children: "Workflow Execution" })] })] }), _jsxs("div", { className: "flex space-x-2", children: [executionStatus === 'idle' || executionStatus === 'completed' || executionStatus === 'failed' ? (_jsxs(Button, { onClick: handleExecuteWorkflow, disabled: isExecuting, children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Execute"] })) : (_jsxs(Button, { variant: "outline", onClick: handlePauseExecution, disabled: !isExecuting, children: [_jsx(Pause, { className: "h-4 w-4 mr-2" }), "Pause"] })), _jsxs(Button, { variant: "outline", onClick: handleResetExecution, disabled: isExecuting || executionStatus === 'idle', children: [_jsx(RotateCcw, { className: "h-4 w-4 mr-2" }), "Reset"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Status" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center", children: [executionStatus === 'idle' && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "h-5 w-5 text-gray-500 mr-2" }), _jsx("span", { className: "font-medium", children: "Idle" })] })), executionStatus === 'running' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mr-2" }), _jsx("span", { className: "font-medium text-blue-500", children: "Running" })] })), executionStatus === 'completed' && (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2" }), _jsx("span", { className: "font-medium text-green-500", children: "Completed" })] })), executionStatus === 'failed' && (_jsxs(_Fragment, { children: [_jsx(XCircle, { className: "h-5 w-5 text-red-500 mr-2" }), _jsx("span", { className: "font-medium text-red-500", children: "Failed" })] }))] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Nodes" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: workflow.nodes.length }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Start Time" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-sm", children: executionStatus !== 'idle' ? new Date().toLocaleString() : 'Not started' }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Duration" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-sm", children: executionStatus === 'running' ? 'Running...' : executionStatus === 'idle' ? 'Not started' : '00:00:05' }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Execution Logs" }), _jsx(CardDescription, { children: "View the logs for this workflow execution." })] }), _jsx(CardContent, { children: executionLogs.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(AlertCircle, { className: "h-12 w-12 text-gray-300 mx-auto mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No logs yet. Execute the workflow to see logs here." })] })) : (_jsx("div", { className: "bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-auto max-h-96", children: executionLogs.map(function (log, index) { return (_jsx("div", { className: "py-1", children: log }, index)); }) })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Node Execution Status" }), _jsx(CardDescription, { children: "View the execution status of each node in the workflow." })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: workflow.nodes.map(function (node, index) { return (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-md", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3", children: index + 1 }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: node.data.name || node.id }), _jsx("div", { className: "text-xs text-muted-foreground", children: node.type })] })] }), _jsxs("div", { children: [executionStatus === 'idle' && (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs", children: "Pending" })), executionStatus === 'running' && index === 1 && (_jsxs("span", { className: "px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center", children: [_jsx("div", { className: "h-2 w-2 rounded-full bg-blue-500 mr-1 animate-pulse" }), "Running"] })), executionStatus === 'running' && index < 1 && (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs", children: "Completed" })), executionStatus === 'running' && index > 1 && (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs", children: "Pending" })), executionStatus === 'completed' && (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs", children: "Completed" })), executionStatus === 'failed' && index < 2 && (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs", children: "Completed" })), executionStatus === 'failed' && index === 2 && (_jsx("span", { className: "px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs", children: "Failed" })), executionStatus === 'failed' && index > 2 && (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs", children: "Skipped" }))] })] }, node.id)); }) }) })] })] }) })] }));
};
export default WorkflowExecution;
