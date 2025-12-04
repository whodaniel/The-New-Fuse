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
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
// Create context
var WorkflowContext = createContext(undefined);
export var WorkflowProvider = function (_a) {
    var children = _a.children, _b = _a.initialNodes, initialNodes = _b === void 0 ? [] : _b, _c = _a.initialEdges, initialEdges = _c === void 0 ? [] : _c, _d = _a.readOnly, readOnly = _d === void 0 ? false : _d;
    // State for nodes and edges
    var _e = useNodesState(initialNodes), nodes = _e[0], setNodes = _e[1], onNodesChange = _e[2];
    var _f = useEdgesState(initialEdges), edges = _f[0], setEdges = _f[1], onEdgesChange = _f[2];
    // State for selection and read-only mode
    var _g = useState(null), selectedNode = _g[0], setSelectedNode = _g[1];
    var _h = useState(null), selectedEdge = _h[0], setSelectedEdge = _h[1];
    var _j = useState(readOnly), isReadOnly = _j[0], setIsReadOnly = _j[1];
    // Handle connections between nodes
    var onConnect = useCallback(function (connection) {
        setEdges(function (eds) { return addEdge(__assign(__assign({}, connection), { data: { label: '', type: 'default' } }), eds); });
    }, [setEdges]);
    // Node actions
    var addNode = useCallback(function (node) {
        setNodes(function (nds) { return __spreadArray(__spreadArray([], nds, true), [node], false); });
    }, [setNodes]);
    var updateNode = useCallback(function (id, data) {
        setNodes(function (nds) {
            return nds.map(function (node) {
                if (node.id === id) {
                    return __assign(__assign({}, node), { data: __assign(__assign({}, node.data), data) });
                }
                return node;
            });
        });
        // Update selected node if it's the one being updated
        if (selectedNode && selectedNode.id === id) {
            setSelectedNode(function (prev) {
                return prev ? __assign(__assign({}, prev), { data: __assign(__assign({}, prev.data), data) }) : null;
            });
        }
    }, [setNodes, selectedNode]);
    var removeNode = useCallback(function (id) {
        setNodes(function (nds) { return nds.filter(function (node) { return node.id !== id; }); });
        setEdges(function (eds) {
            return eds.filter(function (edge) { return edge.source !== id && edge.target !== id; });
        });
        // Clear selection if the removed node was selected
        if (selectedNode && selectedNode.id === id) {
            setSelectedNode(null);
        }
    }, [setNodes, setEdges, selectedNode]);
    var executeNode = useCallback(function (id) {
        // Set node status to running
        updateNode(id, { status: 'running' });
        // Simulate node execution
        setTimeout(function () {
            // Randomly succeed or fail for demo purposes
            var success = Math.random() > 0.2;
            updateNode(id, { status: success ? 'completed' : 'error' });
        }, 2000);
    }, [updateNode]);
    // Edge actions
    var addEdgeAction = useCallback(function (edge) {
        setEdges(function (eds) { return __spreadArray(__spreadArray([], eds, true), [edge], false); });
    }, [setEdges]);
    var updateEdge = useCallback(function (id, data) {
        setEdges(function (eds) {
            return eds.map(function (edge) {
                if (edge.id === id) {
                    return __assign(__assign({}, edge), { data: __assign(__assign({}, edge.data), data) });
                }
                return edge;
            });
        });
        // Update selected edge if it's the one being updated
        if (selectedEdge && selectedEdge.id === id) {
            setSelectedEdge(function (prev) {
                return prev ? __assign(__assign({}, prev), { data: __assign(__assign({}, prev.data), data) }) : null;
            });
        }
    }, [setEdges, selectedEdge]);
    var removeEdge = useCallback(function (id) {
        setEdges(function (eds) { return eds.filter(function (edge) { return edge.id !== id; }); });
        // Clear selection if the removed edge was selected
        if (selectedEdge && selectedEdge.id === id) {
            setSelectedEdge(null);
        }
    }, [setEdges, selectedEdge]);
    // Selection actions
    var selectNode = useCallback(function (node) {
        setSelectedNode(node);
        setSelectedEdge(null);
    }, []);
    var selectEdge = useCallback(function (edge) {
        setSelectedEdge(edge);
        setSelectedNode(null);
    }, []);
    var clearSelection = useCallback(function () {
        setSelectedNode(null);
        setSelectedEdge(null);
    }, []);
    // Workflow actions
    var executeWorkflow = useCallback(function () {
        // Find start nodes (nodes with no incoming edges)
        var startNodes = nodes.filter(function (node) {
            return !edges.some(function (edge) { return edge.target === node.id; });
        });
        // Execute each start node
        startNodes.forEach(function (node) {
            executeNode(node.id);
        });
    }, [nodes, edges, executeNode]);
    var saveWorkflow = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflow;
        return __generator(this, function (_a) {
            workflow = {
                nodes: nodes,
                edges: edges
            };
            console.log('Saving workflow:', workflow);
            // Simulate API call
            return [2 /*return*/, new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve('workflow-123');
                    }, 1000);
                })];
        });
    }); }, [nodes, edges]);
    var loadWorkflow = useCallback(function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // In a real app, this would load the workflow from the server
            console.log('Loading workflow:', id);
            // Simulate API call
            return [2 /*return*/, new Promise(function (resolve) {
                    setTimeout(function () {
                        // Mock workflow data
                        var mockNodes = [
                            {
                                id: 'node-1',
                                type: 'input',
                                position: { x: 100, y: 100 },
                                data: { label: 'Start', type: 'input' }
                            },
                            {
                                id: 'node-2',
                                type: 'agent',
                                position: { x: 300, y: 100 },
                                data: { label: 'Process', type: 'agent' }
                            },
                            {
                                id: 'node-3',
                                type: 'output',
                                position: { x: 500, y: 100 },
                                data: { label: 'End', type: 'output' }
                            }
                        ];
                        var mockEdges = [
                            {
                                id: 'edge-1-2',
                                source: 'node-1',
                                target: 'node-2',
                                data: { label: '' }
                            },
                            {
                                id: 'edge-2-3',
                                source: 'node-2',
                                target: 'node-3',
                                data: { label: '' }
                            }
                        ];
                        setNodes(mockNodes);
                        setEdges(mockEdges);
                        resolve();
                    }, 1000);
                })];
        });
    }); }, [setNodes, setEdges]);
    // Create context value
    var contextValue = {
        nodes: nodes,
        edges: edges,
        onNodesChange: onNodesChange,
        onEdgesChange: onEdgesChange,
        onConnect: onConnect,
        isReadOnly: isReadOnly,
        selectedNode: selectedNode,
        selectedEdge: selectedEdge,
        actions: {
            addNode: addNode,
            updateNode: updateNode,
            removeNode: removeNode,
            executeNode: executeNode,
            addEdge: addEdgeAction,
            updateEdge: updateEdge,
            removeEdge: removeEdge,
            selectNode: selectNode,
            selectEdge: selectEdge,
            setReadOnly: setIsReadOnly,
            clearSelection: clearSelection,
            executeWorkflow: executeWorkflow,
            saveWorkflow: saveWorkflow,
            loadWorkflow: loadWorkflow
        }
    };
    return (_jsx(WorkflowContext.Provider, { value: contextValue, children: children }));
};
// Custom hook to use the workflow context
export var useWorkflow = function () {
    var context = useContext(WorkflowContext);
    if (context === undefined) {
        throw new Error('useWorkflow must be used within a WorkflowProvider');
    }
    return context;
};
export default useWorkflow;
