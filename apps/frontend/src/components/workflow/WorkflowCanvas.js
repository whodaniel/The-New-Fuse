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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeToolbar } from '../WorkflowBuilder/NodeToolbar';
import { WorkflowToolbar } from './WorkflowToolbar';
import { useWorkflow } from '../../hooks/useWorkflow';
import { workflowValidationService } from '../../services/WorkflowValidationService';
import { nodeTypes } from './nodes/nodeTypes';
import { edgeTypes } from './edges';
export var WorkflowCanvas = function () {
    var _a = useWorkflow(), saveWorkflow = _a.saveWorkflow, executeWorkflow = _a.executeWorkflow;
    var _b = useNodesState([]), nodes = _b[0], setNodes = _b[1], onNodesChange = _b[2];
    var _c = useEdgesState([]), edges = _c[0], setEdges = _c[1], onEdgesChange = _c[2];
    var _d = useState(null), selectedNode = _d[0], setSelectedNode = _d[1];
    var _e = useState('Untitled Workflow'), workflowName = _e[0], setWorkflowName = _e[1];
    var _f = useState(false), isSaving = _f[0], setIsSaving = _f[1];
    var _g = useState(false), isExecuting = _g[0], setIsExecuting = _g[1];
    var _h = useState(null), notification = _h[0], setNotification = _h[1];
    var showNotification = function (message, type) {
        setNotification({ message: message, type: type });
        setTimeout(function () { return setNotification(null); }, 3000);
    };
    var onConnect = useCallback(function (connection) {
        // Validate connection before adding
        var sourceNode = nodes.find(function (n) { return n.id === connection.source; });
        var targetNode = nodes.find(function (n) { return n.id === connection.target; });
        if (sourceNode && targetNode) {
            var validationErrors = workflowValidationService.validateEdgeConnection(sourceNode, targetNode);
            var hasErrors = validationErrors.some(function (e) { return e.severity === 'error'; });
            if (hasErrors) {
                showNotification(validationErrors[0].message, 'error');
                return;
            }
        }
        setEdges(function (eds) { return addEdge(connection, eds); });
    }, [setEdges, nodes]);
    var onNodeClick = useCallback(function (_, node) {
        setSelectedNode(node);
    }, []);
    // Handle dropping nodes from the node library
    var onDrop = useCallback(function (event) {
        event.preventDefault();
        var reactFlowBounds = event.currentTarget.getBoundingClientRect();
        var nodeData = event.dataTransfer.getData('application/reactflow');
        if (!nodeData)
            return;
        try {
            var nodeTemplate = JSON.parse(nodeData);
            var position = {
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            };
            var newNode_1 = {
                id: "".concat(nodeTemplate.type, "-").concat(Date.now()),
                type: nodeTemplate.type,
                position: position,
                data: __assign({ label: nodeTemplate.label, configuration: nodeTemplate.config || {} }, nodeTemplate),
            };
            setNodes(function (nds) { return nds.concat(newNode_1); });
        }
        catch (error) {
            console.error('Error parsing dropped node data:', error);
        }
    }, [setNodes]);
    var onDragOver = useCallback(function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);
    var handleSaveWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, validation, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    workflow = {
                        id: 'temp',
                        name: workflowName,
                        nodes: nodes,
                        edges: edges,
                        status: 'draft',
                        version: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: 'current-user'
                    };
                    return [4 /*yield*/, workflowValidationService.validateWorkflow(workflow)];
                case 2:
                    validation = _a.sent();
                    if (!validation.valid) {
                        showNotification("".concat(validation.errors.length, " errors found. Please fix them before saving."), 'error');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, saveWorkflow(workflow)];
                case 3:
                    _a.sent();
                    showNotification('Workflow saved', 'success');
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    showNotification(err_1.message, 'error');
                    return [3 /*break*/, 6];
                case 5:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleExecuteWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, validation, execution, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsExecuting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    workflow = {
                        id: 'temp',
                        name: workflowName,
                        nodes: nodes,
                        edges: edges,
                        status: 'draft',
                        version: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: 'current-user'
                    };
                    return [4 /*yield*/, workflowValidationService.validateWorkflow(workflow)];
                case 2:
                    validation = _a.sent();
                    if (!validation.valid) {
                        showNotification("Cannot execute workflow with ".concat(validation.errors.length, " errors."), 'error');
                        return [2 /*return*/];
                    }
                    if (!(workflow.id && workflow.id !== 'temp')) return [3 /*break*/, 4];
                    return [4 /*yield*/, executeWorkflow(workflow.id)];
                case 3:
                    execution = _a.sent();
                    showNotification("Workflow execution started. Execution ID: ".concat(execution.id), 'success');
                    return [3 /*break*/, 5];
                case 4:
                    showNotification('Please save the workflow before executing it.', 'info');
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    err_2 = _a.sent();
                    showNotification(err_2.message, 'error');
                    return [3 /*break*/, 8];
                case 7:
                    setIsExecuting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "h-[80vh] border border-gray-200 rounded-md relative", children: [notification && (_jsx("div", { className: "absolute top-4 right-4 z-50 px-4 py-2 rounded-md text-white ".concat(notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'success' ? 'bg-green-500' :
                        'bg-blue-500'), children: notification.message })), _jsx(WorkflowToolbar, { workflowName: workflowName, onNameChange: setWorkflowName, onSave: handleSaveWorkflow, onExecute: handleExecuteWorkflow, isSaving: isSaving, isExecuting: isExecuting }), _jsx(NodeToolbar, { onAddNode: function (nodeType, position) {
                    var newNode = {
                        id: "node-".concat(Date.now()),
                        type: nodeType,
                        position: position,
                        data: { label: nodeType }
                    };
                    setNodes(function (nodes) { return __spreadArray(__spreadArray([], nodes, true), [newNode], false); });
                } }), _jsx("div", { onDrop: onDrop, onDragOver: onDragOver, style: { height: '100%', width: '100%' }, children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onNodeClick: onNodeClick, nodeTypes: nodeTypes, edgeTypes: edgeTypes, fitView: true, children: [_jsx(Background, {}), _jsx(Controls, {}), _jsx(MiniMap, {})] }) })] }));
};
