"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowContainer = void 0;
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import lucide_react_1 from 'lucide-react';
import FlowPage_1 from './FlowPage';
import NodeDetails_1 from './NodeDetails';
import useFlowRouter_1 from '../../hooks/useFlowRouter';
import useFlowMemory_1 from '../../hooks/useFlowMemory';
import VectorMemoryContext_1 from '../../contexts/VectorMemoryContext';
import core_1 from '@/components/core';
var FlowContainer = function (_b) {
    var _c = _b.initialNodes, initialNodes = _c === void 0 ? [] : _c, _d = _b.initialEdges, initialEdges = _d === void 0 ? [] : _d, onSave = _b.onSave;
    var _e = (0, react_1.useState)(initialNodes), nodes = _e[0], setNodes = _e[1];
    var _f = (0, react_1.useState)(initialEdges), edges = _f[0], setEdges = _f[1];
    var navigate = (0, react_router_dom_1.useNavigate)();
    var memoryManager = (0, react_1.useContext)(VectorMemoryContext_1.VectorMemoryContext);
    var _g = (0, useFlowRouter_1.useFlowRouter)(), currentNode = _g.currentNode, navigateToNode = _g.navigateToNode;
    var _h = (0, useFlowMemory_1.useFlowMemory)(memoryManager), saveNodeMemory = _h.saveNodeMemory, loadNodeMemory = _h.loadNodeMemory, updateFlowMemoryGraph = _h.updateFlowMemoryGraph;
    var handleNodesChange = (0, react_1.useCallback)(function (newNodes) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setNodes(newNodes);
                    return [4 /*yield*/, updateFlowMemoryGraph(newNodes, edges)];
                case 1:
                    _b.sent();
                    if (onSave) {
                        onSave(newNodes, edges);
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [edges, onSave, updateFlowMemoryGraph]);
    var handleEdgesChange = (0, react_1.useCallback)(function (newEdges) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setEdges(newEdges);
                    return [4 /*yield*/, updateFlowMemoryGraph(nodes, newEdges)];
                case 1:
                    _b.sent();
                    if (onSave) {
                        onSave(nodes, newEdges);
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [nodes, onSave, updateFlowMemoryGraph]);
    var handleNodeUpdate = (0, react_1.useCallback)(function (nodeId, updates) { return __awaiter(void 0, void 0, void 0, function () {
        var updatedNodes, updatedNode;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    updatedNodes = nodes.map(function (node) { return node.id === nodeId
                        ? Object.assign(Object.assign({}, node), updates) : node; });
                    setNodes(updatedNodes);
                    updatedNode = updatedNodes.find(function (n) { return n.id === nodeId; });
                    if (!updatedNode) return [3 /*break*/, 2];
                    return [4 /*yield*/, saveNodeMemory(updatedNode)];
                case 1:
                    _b.sent();
                    _b.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); }, [nodes, saveNodeMemory]);
    var handleNodeSelect = (0, react_1.useCallback)(function (nodeId) { return __awaiter(void 0, void 0, void 0, function () {
        var memory;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, loadNodeMemory(nodeId)];
                case 1:
                    memory = _b.sent();
                    navigateToNode(nodeId);
                    return [2 /*return*/];
            }
        });
    }); }, [loadNodeMemory, navigateToNode]);
    var handleAddNode = (0, react_1.useCallback)(function () {
        var newNode = {
            id: "node-".concat(nodes.length + 1),
            type: 'default',
            position: { x: 100, y: 100 },
            data: {
                label: "Node ".concat(nodes.length + 1),
                type: 'default',
                parameters: {},
            },
        };
        setNodes(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newNode], false); });
    }, [nodes]);
    return (_jsxs("div", { className: "h-screen flex", children: [_jsxs(core_1.Card, { className: "w-64 border-r", children: [_jsx(core_1.CardHeader, { children: _jsx(core_1.CardTitle, { children: "Flow Editor" }) }), _jsxs(core_1.CardContent, { className: "space-y-4", children: [_jsxs(core_1.Button, { onClick: handleAddNode, className: "w-full", children: [_jsx(lucide_react_1.Plus, { className: "mr-2 h-4 w-4" }), "Add Node"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "Nodes" }), _jsx(core_1.ScrollArea, { className: "h-[calc(100vh-200px)]", children: _jsx("div", { className: "space-y-1", children: nodes.map(function (node) {
                                                var _a;
                                                return (_jsx(core_1.Button, { variant: "ghost", className: "w-full justify-start", onClick: function () { return handleNodeSelect(node.id); }, children: ((_a = node.data) === null || _a === void 0 ? void 0 : _a.label) || node.id }, node.id));
                                            }) }) })] })] })] }), _jsx("div", { className: "flex-1", children: _jsxs(react_router_dom_1.Routes, { children: [_jsx(react_router_dom_1.Route, { path: "/", element: _jsx(FlowPage_1.FlowPage, { initialNodes: nodes, initialEdges: edges, onNodesChange: handleNodesChange, onEdgesChange: handleEdgesChange }) }), _jsx(react_router_dom_1.Route, { path: "/node/:nodeId", element: _jsx(NodeDetails_1.NodeDetails, { nodes: nodes, onNodeUpdate: handleNodeUpdate }) })] }) })] }));
};
exports.FlowContainer = FlowContainer;
