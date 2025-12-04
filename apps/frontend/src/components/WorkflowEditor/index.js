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
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, addEdge, useNodesState, useEdgesState, ReactFlowProvider, } from 'reactflow';
import 'reactflow/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';
import './styles/WorkflowEditor.css';
import { DynamicNode } from './components/DynamicNode';
import n8nMetadataService from '../../services/n8n-metadata.service';
import { convertReactFlowToN8n } from './utils/converter';
import { validateN8nWorkflow, createDynamicValidator } from './utils/validation';
import { WorkflowValidator } from './utils/realtime-validation';
import { processErrorConnections } from './utils/special-nodes';
import { getNodeCategoryFromMetadata } from './utils/node-support';
var nodeTypes = {
    dynamicNode: DynamicNode,
};
export function WorkflowEditor() {
    var _this = this;
    var _a = useNodesState([]), nodes = _a[0], setNodes = _a[1], onNodesChange = _a[2];
    var _b = useEdgesState([]), edges = _b[0], setEdges = _b[1], onEdgesChange = _b[2];
    var _c = useState({}), nodeTypesMetadata = _c[0], setNodeTypesMetadata = _c[1];
    var _d = useState(null), dynamicNodeValidators = _d[0], setDynamicNodeValidators = _d[1];
    var _e = useState([]), validationErrors = _e[0], setValidationErrors = _e[1];
    var _f = useState('My Workflow'), workflowName = _f[0], setWorkflowName = _f[1];
    useEffect(function () {
        var fetchNodeTypes = function () { return __awaiter(_this, void 0, void 0, function () {
            var typesData_1, metadataMap_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, n8nMetadataService.getAllNodeTypes()];
                    case 1:
                        typesData_1 = _a.sent();
                        metadataMap_1 = {};
                        typesData_1.forEach(function (typeData) {
                            metadataMap_1[typeData.name] = typeData;
                        });
                        setNodeTypesMetadata(metadataMap_1);
                        setDynamicNodeValidators(function () { return createDynamicValidator(typesData_1); });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Failed to load node types metadata:", error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchNodeTypes();
    }, []);
    useEffect(function () {
        if (dynamicNodeValidators) {
            var validator_1 = new WorkflowValidator(Object.values(nodeTypesMetadata));
            var errors = validator_1.validate(nodes, edges);
            setValidationErrors(errors);
        }
    }, [nodes, edges, nodeTypesMetadata, dynamicNodeValidators]);
    var onConnect = useCallback(function (params) { return setEdges(function (eds) { return addEdge(params, eds); }); }, [setEdges]);
    var onNodeDragStop = useCallback(function (event, node) {
        setNodes(function (nds) { return nds.map(function (n) {
            if (n.id === node.id) {
                return Object.assign(Object.assign({}, n), { position: node.position });
            }
            return n;
        }); });
    }, [setNodes]);
    var onAddNode = useCallback(function (nodeType) { return __awaiter(_this, void 0, void 0, function () {
        var newNode;
        return __generator(this, function (_a) {
            if (!nodeTypesMetadata[nodeType]) {
                console.error("Metadata not found for node type: ".concat(nodeType));
                return [2 /*return*/];
            }
            newNode = {
                id: "".concat(nodeType, "_").concat(Date.now()),
                type: 'dynamicNode',
                position: { x: 250, y: 250 },
                data: { type: nodeType, name: nodeTypesMetadata[nodeType].displayName, parameters: {} },
            };
            setNodes(function (nds) { return __spreadArray(__spreadArray([], nds, true), [newNode], false); });
            return [2 /*return*/];
        });
    }); }, [nodeTypesMetadata, setNodes]);
    var handleSaveWorkflow = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var validator, currentValidationErrors, n8nWorkflowJson, connectionsWithErrorOutputs, validationResult, response, errorData, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!dynamicNodeValidators) {
                        alert("Node metadata loading is still in progress. Please wait and try again.");
                        return [2 /*return*/];
                    }
                    validator = new WorkflowValidator(Object.values(nodeTypesMetadata));
                    currentValidationErrors = validator.validate(nodes, edges);
                    if (currentValidationErrors.length > 0) {
                        alert("Workflow has validation errors:\n" + currentValidationErrors.join("\n"));
                        setValidationErrors(currentValidationErrors);
                        return [2 /*return*/];
                    }
                    n8nWorkflowJson = convertReactFlowToN8n(nodes, edges, nodeTypesMetadata);
                    connectionsWithErrorOutputs = {};
                    processErrorConnections(edges, connectionsWithErrorOutputs, nodes);
                    Object.keys(connectionsWithErrorOutputs).forEach(function (sourceNodeId) {
                        if (connectionsWithErrorOutputs[sourceNodeId].error) {
                            n8nWorkflowJson.connections[sourceNodeId] = n8nWorkflowJson.connections[sourceNodeId] || {};
                            n8nWorkflowJson.connections[sourceNodeId].error = connectionsWithErrorOutputs[sourceNodeId].error;
                        }
                    });
                    validationResult = validateN8nWorkflow(n8nWorkflowJson, dynamicNodeValidators);
                    if (!validationResult.success) {
                        console.error("n8n Workflow Validation Error:", validationResult.error);
                        alert("Error converting workflow to n8n format. See console for details.");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, fetch('/api/n8n/workflow', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(Object.assign(Object.assign({}, n8nWorkflowJson), { name: workflowName })),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    console.error("Failed to save workflow:", errorData);
                    alert("Failed to save workflow: ".concat(errorData.message || 'Unknown error'));
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    result = _a.sent();
                    alert("Workflow saved successfully! Workflow ID: ".concat(result.id));
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error("Error saving workflow:", error_2);
                    alert("Error saving workflow. Check console for details.");
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [nodes, edges, nodeTypesMetadata, dynamicNodeValidators, workflowName]);
    var nodeCategories = ['trigger', 'input', 'output', 'action', 'utility', 'advanced', 'transform', 'integration', 'flow'];
    var sortedNodeTypes = Object.entries(nodeTypesMetadata)
        .sort(function (_a, _b) {
        var a = _a[1];
        var b = _b[1];
        return a.displayName.localeCompare(b.displayName);
    });
    return (_jsxs("div", { className: "workflow-editor-container", children: [_jsxs("div", { className: "sidebar", children: [_jsx("h2", { children: "Nodes" }), _jsx("div", { className: "node-categories", children: nodeCategories.map(function (categoryKey) { return (_jsxs("div", { className: "category-section", children: [_jsxs("h3", { children: [categoryKey.toUpperCase(), " Nodes"] }), _jsx("div", { className: "node-list", children: sortedNodeTypes
                                        .filter(function (_a) {
                                        var metadata = _a[1];
                                        return getNodeCategoryFromMetadata(metadata) === categoryKey;
                                    })
                                        .map(function (_a) {
                                        var nodeTypeName = _a[0], metadata = _a[1];
                                        return (_jsx("button", { className: "node-button", onClick: function () { return onAddNode(nodeTypeName); }, children: metadata.displayName }, nodeTypeName));
                                    }) })] }, categoryKey)); }) })] }), _jsxs("div", { className: "react-flow-wrapper", children: [_jsx("input", { type: "text", className: "workflow-name-input", placeholder: "Workflow Name", value: workflowName, onChange: function (e) { return setWorkflowName(e.target.value); } }), _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, nodeTypes: nodeTypes, onNodeDragStop: onNodeDragStop, fitView: true, children: [_jsx(Background, {}), _jsx(Controls, {})] }), _jsx("div", { className: "validation-errors", children: validationErrors.map(function (error, index) { return (_jsx("div", { className: "error-message", children: error }, index)); }) }), _jsx("button", { className: "save-button", onClick: handleSaveWorkflow, children: "Save Workflow" })] })] }));
}
export default function WorkflowEditorWrapper() {
    return (_jsx(ReactFlowProvider, { children: _jsx(WorkflowEditor, {}) }));
}
