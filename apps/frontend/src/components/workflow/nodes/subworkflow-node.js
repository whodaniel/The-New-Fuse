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
import { memo, useState, useEffect } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Play } from 'lucide-react';
import { workflowDatabaseService } from '@/services/WorkflowDatabaseService';
import { workflowExecutionService } from '@/services/WorkflowExecutionService';
var SubworkflowNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    var _b = useState([]), workflows = _b[0], setWorkflows = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(false), isDialogOpen = _e[0], setIsDialogOpen = _e[1];
    var _f = useState(false), isExecuting = _f[0], setIsExecuting = _f[1];
    var _g = useState(null), executionResult = _g[0], setExecutionResult = _g[1];
    var config = data.config || {};
    // Load workflows
    useEffect(function () {
        var loadWorkflows = function () { return __awaiter(void 0, void 0, void 0, function () {
            var workflows_1, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, workflowDatabaseService.getWorkflows()];
                    case 2:
                        workflows_1 = _a.sent();
                        setWorkflows(workflows_1);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        setError(err_1 instanceof Error ? err_1 : new Error('Failed to load workflows'));
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        loadWorkflows();
    }, []);
    // Handle workflow selection
    var handleWorkflowChange = function (workflowId) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { workflowId: workflowId })
            });
        }
    };
    // Handle input mapping change
    var handleInputMappingChange = function (mapping) {
        try {
            // Validate JSON
            var parsedMapping = JSON.parse(mapping);
            if (data.onUpdate) {
                data.onUpdate({
                    config: __assign(__assign({}, config), { inputMapping: mapping })
                });
            }
        }
        catch (error) {
            // Invalid JSON, don't update
            console.error('Invalid input mapping JSON:', error);
        }
    };
    // Handle output mapping change
    var handleOutputMappingChange = function (mapping) {
        try {
            // Validate JSON
            var parsedMapping = JSON.parse(mapping);
            if (data.onUpdate) {
                data.onUpdate({
                    config: __assign(__assign({}, config), { outputMapping: mapping })
                });
            }
        }
        catch (error) {
            // Invalid JSON, don't update
            console.error('Invalid output mapping JSON:', error);
        }
    };
    // Execute subworkflow
    var executeSubworkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, inputData_1, mapping, executionId_1, executionHistory, execution, outputData_1, mapping, result_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!config.workflowId) {
                        return [2 /*return*/];
                    }
                    setIsExecuting(true);
                    setExecutionResult(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, workflowDatabaseService.getWorkflow(config.workflowId)];
                case 2:
                    workflow = _a.sent();
                    inputData_1 = {};
                    if (config.inputMapping) {
                        try {
                            mapping = JSON.parse(config.inputMapping);
                            // Apply mapping to input data
                            if (data.inputs) {
                                Object.entries(mapping).forEach(function (_a) {
                                    var key = _a[0], value = _a[1];
                                    var path = value.split('.');
                                    var source = data.inputs;
                                    for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
                                        var segment = path_1[_i];
                                        if (source && typeof source === 'object' && segment in source) {
                                            source = source[segment];
                                        }
                                        else {
                                            source = undefined;
                                            break;
                                        }
                                    }
                                    if (source !== undefined) {
                                        inputData_1[key] = source;
                                    }
                                });
                            }
                        }
                        catch (error) {
                            console.error('Error applying input mapping:', error);
                        }
                    }
                    return [4 /*yield*/, workflowExecutionService.executeWorkflow(workflow, {
                            variables: inputData_1
                        })];
                case 3:
                    executionId_1 = _a.sent();
                    executionHistory = workflowExecutionService.getExecutionHistory();
                    execution = executionHistory.find(function (item) { return item.id === executionId_1; });
                    if (execution) {
                        outputData_1 = execution.nodeResults;
                        if (config.outputMapping) {
                            try {
                                mapping = JSON.parse(config.outputMapping);
                                result_1 = {};
                                Object.entries(mapping).forEach(function (_a) {
                                    var key = _a[0], value = _a[1];
                                    var path = value.split('.');
                                    var source = outputData_1;
                                    for (var _i = 0, path_2 = path; _i < path_2.length; _i++) {
                                        var segment = path_2[_i];
                                        if (source && typeof source === 'object' && segment in source) {
                                            source = source[segment];
                                        }
                                        else {
                                            source = undefined;
                                            break;
                                        }
                                    }
                                    if (source !== undefined) {
                                        result_1[key] = source;
                                    }
                                });
                                outputData_1 = result_1;
                            }
                            catch (error) {
                                console.error('Error applying output mapping:', error);
                            }
                        }
                        setExecutionResult(outputData_1);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error executing subworkflow:', error_1);
                    setExecutionResult({ error: error_1 instanceof Error ? error_1.message : 'Unknown error' });
                    return [3 /*break*/, 6];
                case 5:
                    setIsExecuting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Get selected workflow
    var selectedWorkflow = workflows.find(function (w) { return w.id === config.workflowId; });
    // Input and output handles
    var inputHandles = [
        { id: 'input', label: 'Input' }
    ];
    var outputHandles = [
        { id: 'output', label: 'Output' },
        { id: 'error', label: 'Error' }
    ];
    // Render node content
    var renderContent = function () {
        var _a;
        return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "workflow-".concat(id), className: "text-xs", children: "Subworkflow" }), _jsxs(Select, { value: config.workflowId || '', onValueChange: handleWorkflowChange, disabled: loading, children: [_jsx(SelectTrigger, { id: "workflow-".concat(id), className: "text-xs h-7", children: _jsx(SelectValue, { placeholder: "Select workflow" }) }), _jsx(SelectContent, { children: workflows.map(function (workflow) { return (_jsx(SelectItem, { value: workflow.id, className: "text-xs", children: workflow.name }, workflow.id)); }) })] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "text-xs h-7", onClick: function () { return setIsDialogOpen(true); }, children: [_jsx(Edit, { className: "h-3 w-3 mr-1" }), "Configure"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "text-xs h-7", onClick: executeSubworkflow, disabled: !config.workflowId || isExecuting, children: [_jsx(Play, { className: "h-3 w-3 mr-1" }), "Test"] })] }), selectedWorkflow && (_jsxs("div", { className: "text-xs text-muted-foreground", children: [_jsxs("div", { children: ["Workflow: ", selectedWorkflow.name] }), _jsxs("div", { children: ["Nodes: ", ((_a = selectedWorkflow.nodes) === null || _a === void 0 ? void 0 : _a.length) || 0] })] })), executionResult && (_jsx("div", { className: "text-xs bg-muted p-2 rounded-md max-h-20 overflow-auto", children: _jsx("pre", { className: "text-xs", children: JSON.stringify(executionResult, null, 2) }) })), _jsx(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Configure Subworkflow" }), _jsx(DialogDescription, { children: "Configure input and output mappings for the subworkflow." })] }), _jsxs(Tabs, { defaultValue: "input", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "input", children: "Input Mapping" }), _jsx(TabsTrigger, { value: "output", children: "Output Mapping" })] }), _jsx(TabsContent, { value: "input", className: "space-y-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "input-mapping-".concat(id), className: "text-sm", children: "Input Mapping" }), _jsx(Textarea, { id: "input-mapping-".concat(id), className: "font-mono text-xs h-40", placeholder: '{\\n  "targetField": "source.path.to.field"\\n}', value: config.inputMapping || '{\n  "input": "input"\n}', onChange: function (e) { return handleInputMappingChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Map input fields to subworkflow variables. Use JSON format with target fields as keys and source paths as values." })] }) }), _jsx(TabsContent, { value: "output", className: "space-y-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "output-mapping-".concat(id), className: "text-sm", children: "Output Mapping" }), _jsx(Textarea, { id: "output-mapping-".concat(id), className: "font-mono text-xs h-40", placeholder: '{\\n  "result": "output-node-id.result"\\n}', value: config.outputMapping || '{\n  "result": "output"\n}', onChange: function (e) { return handleOutputMappingChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Map subworkflow results to output fields. Use JSON format with output fields as keys and result paths as values." })] }) })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: function () { return setIsDialogOpen(false); }, children: "Done" }) })] }) })] }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: (selectedWorkflow === null || selectedWorkflow === void 0 ? void 0 : selectedWorkflow.name) || data.name || 'Subworkflow', type: 'subworkflow', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
SubworkflowNode.displayName = 'SubworkflowNode';
export { SubworkflowNode };
