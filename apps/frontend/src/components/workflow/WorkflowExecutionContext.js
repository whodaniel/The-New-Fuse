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
import { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { workflowExecutionService } from '@/services/WorkflowExecutionService';
import { useA2ACommunication } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { toast } from 'react-toastify';
export var WorkflowExecutionContext = function (_a) {
    var workflowId = _a.workflowId;
    var _b = useState(false), isExecuting = _b[0], setIsExecuting = _b[1];
    var _c = useState(null), executionId = _c[0], setExecutionId = _c[1];
    var _d = useState({}), nodeStates = _d[0], setNodeStates = _d[1];
    var _e = useReactFlow(), getNodes = _e.getNodes, getEdges = _e.getEdges, setNodes = _e.setNodes, setEdges = _e.setEdges;
    var a2aService = useA2ACommunication();
    // Initialize A2A service
    useEffect(function () {
        workflowExecutionService.setA2AService(a2aService);
    }, [a2aService]);
    // Subscribe to execution updates
    useEffect(function () {
        var subscription = workflowExecutionService.subscribe(function (update) {
            if (update.nodeId) {
                // Update node state
                setNodeStates(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[update.nodeId] = update.state, _a)));
                });
                // Update node UI
                setNodes(function (nodes) {
                    return nodes.map(function (node) {
                        if (node.id === update.nodeId) {
                            return __assign(__assign({}, node), { data: __assign(__assign({}, node.data), { status: update.state }) });
                        }
                        return node;
                    });
                });
                // Show toast for node completion or failure
                if (update.state === 'completed') {
                    toast.success("Node ".concat(update.nodeId, " completed"));
                }
                else if (update.state === 'failed') {
                    toast.error("Node ".concat(update.nodeId, " failed: ").concat(update.message));
                }
            }
            else {
                // Update workflow execution state
                if (update.state === 'started') {
                    setIsExecuting(true);
                    setExecutionId(update.executionId);
                    toast.info('Workflow execution started');
                }
                else if (update.state === 'completed') {
                    setIsExecuting(false);
                    toast.success('Workflow execution completed');
                }
                else if (update.state === 'failed') {
                    setIsExecuting(false);
                    toast.error("Workflow execution failed: ".concat(update.message));
                }
                else if (update.state === 'aborted') {
                    setIsExecuting(false);
                    toast.warning('Workflow execution aborted');
                }
            }
        });
        return function () {
            subscription.unsubscribe();
        };
    }, [setNodes]);
    // Execute workflow
    var handleExecuteWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var nodes, workflow, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    nodes = getNodes();
                    setNodeStates(nodes.reduce(function (acc, node) {
                        acc[node.id] = 'idle';
                        return acc;
                    }, {}));
                    // Update node UI
                    setNodes(function (nodes) {
                        return nodes.map(function (node) { return (__assign(__assign({}, node), { data: __assign(__assign({}, node.data), { status: 'idle' }) })); });
                    });
                    workflow = {
                        id: workflowId,
                        name: 'Current Workflow',
                        nodes: getNodes(),
                        edges: getEdges()
                    };
                    return [4 /*yield*/, workflowExecutionService.executeWorkflow(workflow)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to execute workflow:', error_1);
                    toast.error("Failed to execute workflow: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Abort workflow execution
    var handleAbortExecution = function () {
        if (executionId) {
            workflowExecutionService.abortExecution(executionId);
        }
    };
    return (_jsx("div", { className: "absolute bottom-4 right-4 flex space-x-2", children: isExecuting ? (_jsxs(Button, { variant: "destructive", size: "sm", onClick: handleAbortExecution, children: [_jsx(Square, { className: "h-4 w-4 mr-2" }), "Stop Execution"] })) : (_jsxs(Button, { variant: "default", size: "sm", onClick: handleExecuteWorkflow, children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Execute Workflow"] })) }));
};
export default WorkflowExecutionContext;
