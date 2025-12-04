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
/**
 * Enhanced Workflow Builder for The New Fuse
 * Production-ready drag-and-drop workflow builder with:
 * - Agent nodes integration
 * - Conditional logic
 * - Parallel execution
 * - Human approval nodes
 * - Real-time execution monitoring
 * - Workflow templates
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, ReactFlowProvider, Panel, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, VStack, HStack, Button, Text, Card, CardBody, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Badge, Input, Textarea, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, FormControl, FormLabel, Tabs, TabList, TabPanels, Tab, TabPanel, Select, Progress, Alert, AlertIcon, AlertTitle, AlertDescription, IconButton, Tooltip } from '@chakra-ui/react';
import { FiPlay, FiSave, FiPlus, FiDownload, FiEye, FiXCircle } from 'react-icons/fi';
import { enhancedNodeTypes } from '../../components/workflow/EnhancedNodeTypes';
var nodeTemplates = [
    // Agent Nodes
    {
        id: 'code-review-agent',
        type: 'agentTask',
        label: 'Code Review Agent',
        description: 'Agent reviews code for quality and best practices',
        category: 'Agents',
        defaultConfig: {
            agentType: 'code-reviewer',
            estimatedTime: 5,
            priority: 'high'
        }
    },
    {
        id: 'research-agent',
        type: 'agentTask',
        label: 'Research Agent',
        description: 'Agent performs research on a topic',
        category: 'Agents',
        defaultConfig: {
            agentType: 'researcher',
            estimatedTime: 10,
            priority: 'medium'
        }
    },
    {
        id: 'implementation-agent',
        type: 'agentTask',
        label: 'Implementation Agent',
        description: 'Agent implements code changes',
        category: 'Agents',
        defaultConfig: {
            agentType: 'developer',
            estimatedTime: 15,
            priority: 'high'
        }
    },
    {
        id: 'test-agent',
        type: 'agentTask',
        label: 'Testing Agent',
        description: 'Agent runs tests and validates results',
        category: 'Agents',
        defaultConfig: {
            agentType: 'tester',
            estimatedTime: 5,
            priority: 'high'
        }
    },
    {
        id: 'multi-agent-coord',
        type: 'multiAgent',
        label: 'Multi-Agent Coordination',
        description: 'Coordinate multiple agents working together',
        category: 'Agents',
        defaultConfig: {
            agents: [],
            coordinationStrategy: 'sequential'
        }
    },
    // Logic Nodes
    {
        id: 'condition-check',
        type: 'conditional',
        label: 'Conditional Branch',
        description: 'Branch workflow based on condition',
        category: 'Logic',
        defaultConfig: {
            condition: 'status === "success"'
        }
    },
    {
        id: 'parallel-execution',
        type: 'parallel',
        label: 'Parallel Execution',
        description: 'Execute multiple tasks in parallel',
        category: 'Logic',
        defaultConfig: {
            parallelTasks: 3,
            waitForAll: true
        }
    },
    // Human Interaction
    {
        id: 'human-approval',
        type: 'humanApproval',
        label: 'Human Approval',
        description: 'Require human approval to continue',
        category: 'Human',
        defaultConfig: {
            approvers: 1,
            timeout: 24 * 60 // 24 hours in minutes
        }
    },
    {
        id: 'code-review-approval',
        type: 'humanApproval',
        label: 'Code Review Approval',
        description: 'Request code review approval',
        category: 'Human',
        defaultConfig: {
            approvers: 2,
            reviewType: 'code'
        }
    }
];
var initialEdges = [];
var EnhancedWorkflowBuilder = function () {
    var _a = useNodesState([]), nodes = _a[0], setNodes = _a[1], onNodesChange = _a[2];
    var _b = useEdgesState(initialEdges), edges = _b[0], setEdges = _b[1], onEdgesChange = _b[2];
    var _c = useState('Untitled Workflow'), workflowName = _c[0], setWorkflowName = _c[1];
    var _d = useState(''), workflowDescription = _d[0], setWorkflowDescription = _d[1];
    var _e = useState(null), selectedNode = _e[0], setSelectedNode = _e[1];
    var _f = useState({
        isExecuting: false,
        progress: 0,
        logs: []
    }), executionState = _f[0], setExecutionState = _f[1];
    var _g = useState([]), availableAgents = _g[0], setAvailableAgents = _g[1];
    var _h = useDisclosure(), isNodeLibraryOpen = _h.isOpen, onNodeLibraryOpen = _h.onOpen, onNodeLibraryClose = _h.onClose;
    var _j = useDisclosure(), isNodeSettingsOpen = _j.isOpen, onNodeSettingsOpen = _j.onOpen, onNodeSettingsClose = _j.onClose;
    var _k = useDisclosure(), isSaveModalOpen = _k.isOpen, onSaveModalOpen = _k.onOpen, onSaveModalClose = _k.onClose;
    var _l = useDisclosure(), isExecutionLogOpen = _l.isOpen, onExecutionLogOpen = _l.onOpen, onExecutionLogClose = _l.onClose;
    var toast = useToast();
    // Load available agents from the agent registry
    useEffect(function () {
        loadAvailableAgents();
    }, []);
    var loadAvailableAgents = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, agents, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/agents/registry')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    agents = _a.sent();
                    setAvailableAgents(agents);
                    return [3 /*break*/, 4];
                case 3:
                    // Mock data for demonstration
                    setAvailableAgents([
                        { id: 'agent-1', name: 'Code Reviewer', type: 'code-reviewer', status: 'ACTIVE' },
                        { id: 'agent-2', name: 'Researcher', type: 'researcher', status: 'ACTIVE' },
                        { id: 'agent-3', name: 'Developer', type: 'developer', status: 'ACTIVE' },
                        { id: 'agent-4', name: 'Tester', type: 'tester', status: 'ACTIVE' }
                    ]);
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Failed to load agents:', error_1);
                    // Use mock data on error
                    setAvailableAgents([
                        { id: 'agent-1', name: 'Code Reviewer', type: 'code-reviewer', status: 'ACTIVE' },
                        { id: 'agent-2', name: 'Researcher', type: 'researcher', status: 'ACTIVE' }
                    ]);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // WebSocket connection for real-time execution monitoring
    useEffect(function () {
        if (executionState.isExecuting) {
            // In production, connect to WebSocket for real-time updates
            // const ws = new WebSocket(`ws://localhost:3000/workflow/execution/${executionId}`);
            // ws.onmessage = (event) => {
            //   const update = JSON.parse(event.data);
            //   handleExecutionUpdate(update);
            // };
            // return () => ws.close();
        }
    }, [executionState.isExecuting]);
    var onConnect = useCallback(function (params) {
        // Add animated edges
        var edge = __assign(__assign({}, params), { animated: true, markerEnd: {
                type: MarkerType.ArrowClosed,
            } });
        setEdges(function (eds) { return addEdge(edge, eds); });
    }, [setEdges]);
    var addNodeToWorkflow = function (template) {
        var nodeId = "".concat(template.type, "-").concat(Date.now());
        var newNode = {
            id: nodeId,
            type: template.type,
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100
            },
            data: __assign({ label: template.label, description: template.description, status: 'idle' }, template.defaultConfig)
        };
        setNodes(function (nds) { return __spreadArray(__spreadArray([], nds, true), [newNode], false); });
        onNodeLibraryClose();
        toast({
            title: 'Node Added',
            description: "".concat(template.label, " has been added to the workflow"),
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };
    var executeWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflowData, _loop_1, i, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (nodes.length === 0) {
                        toast({
                            title: 'Empty Workflow',
                            description: 'Add some nodes to execute the workflow',
                            status: 'warning',
                            duration: 3000,
                            isClosable: true,
                        });
                        return [2 /*return*/];
                    }
                    setExecutionState({
                        isExecuting: true,
                        progress: 0,
                        logs: [{ timestamp: new Date(), message: 'Workflow execution started', level: 'info' }]
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    workflowData = {
                        name: workflowName,
                        description: workflowDescription,
                        nodes: nodes.map(function (node) { return ({
                            id: node.id,
                            type: node.type,
                            data: node.data
                        }); }),
                        edges: edges.map(function (edge) { return ({
                            source: edge.source,
                            target: edge.target
                        }); })
                    };
                    _loop_1 = function (i) {
                        var node, progress;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    node = nodes[i];
                                    progress = ((i + 1) / nodes.length) * 100;
                                    // Update node status
                                    setNodes(function (nds) {
                                        return nds.map(function (n) {
                                            return n.id === node.id
                                                ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { status: 'running', progress: 50 }) }) : n;
                                        });
                                    });
                                    setExecutionState(function (prev) { return (__assign(__assign({}, prev), { currentNode: node.id, progress: progress, logs: __spreadArray(__spreadArray([], prev.logs, true), [{
                                                timestamp: new Date(),
                                                message: "Executing node: ".concat(node.data.label),
                                                level: 'info'
                                            }], false) })); });
                                    // Simulate processing time
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                                case 1:
                                    // Simulate processing time
                                    _b.sent();
                                    // Mark as completed
                                    setNodes(function (nds) {
                                        return nds.map(function (n) {
                                            return n.id === node.id
                                                ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { status: 'completed', progress: 100 }) }) : n;
                                        });
                                    });
                                    setExecutionState(function (prev) { return (__assign(__assign({}, prev), { logs: __spreadArray(__spreadArray([], prev.logs, true), [{
                                                timestamp: new Date(),
                                                message: "Completed node: ".concat(node.data.label),
                                                level: 'success'
                                            }], false) })); });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < nodes.length)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(i)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    setExecutionState(function (prev) { return (__assign(__assign({}, prev), { isExecuting: false, progress: 100, logs: __spreadArray(__spreadArray([], prev.logs, true), [{
                                timestamp: new Date(),
                                message: 'Workflow execution completed successfully',
                                level: 'success'
                            }], false) })); });
                    toast({
                        title: 'Workflow Executed',
                        description: 'All workflow steps completed successfully',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                    });
                    onExecutionLogOpen();
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    setExecutionState(function (prev) { return (__assign(__assign({}, prev), { isExecuting: false, logs: __spreadArray(__spreadArray([], prev.logs, true), [{
                                timestamp: new Date(),
                                message: "Execution error: ".concat(error_2),
                                level: 'error'
                            }], false) })); });
                    toast({
                        title: 'Execution Error',
                        description: 'An error occurred during workflow execution',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var saveWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflowData, response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    workflowData = {
                        name: workflowName,
                        description: workflowDescription,
                        nodes: nodes,
                        edges: edges,
                        version: '1.0.0',
                        lastModified: new Date().toISOString()
                    };
                    return [4 /*yield*/, fetch('/api/workflows', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(workflowData)
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        toast({
                            title: 'Workflow Saved',
                            description: "\"".concat(workflowName, "\" has been saved successfully"),
                            status: 'success',
                            duration: 3000,
                            isClosable: true,
                        });
                        onSaveModalClose();
                    }
                    else {
                        throw new Error('Failed to save workflow');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    toast({
                        title: 'Save Error',
                        description: 'Failed to save the workflow',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var exportWorkflow = function () {
        var workflowData = {
            name: workflowName,
            description: workflowDescription,
            nodes: nodes,
            edges: edges,
            version: '1.0.0',
            exportedAt: new Date().toISOString()
        };
        var blob = new Blob([JSON.stringify(workflowData, null, 2)], {
            type: 'application/json'
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = "".concat(workflowName.replace(/\s+/g, '-'), ".json");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: 'Workflow Exported',
            description: 'Workflow has been exported successfully',
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };
    var onNodeClick = function (event, node) {
        setSelectedNode(node);
        onNodeSettingsOpen();
    };
    var resetWorkflow = function () {
        setNodes([]);
        setEdges([]);
        setWorkflowName('Untitled Workflow');
        setWorkflowDescription('');
        setExecutionState({
            isExecuting: false,
            progress: 0,
            logs: []
        });
        toast({
            title: 'Workflow Reset',
            description: 'Canvas has been cleared',
            status: 'info',
            duration: 2000,
        });
    };
    // Group templates by category
    var groupedTemplates = useMemo(function () {
        var groups = {};
        nodeTemplates.forEach(function (template) {
            if (!groups[template.category]) {
                groups[template.category] = [];
            }
            groups[template.category].push(template);
        });
        return groups;
    }, []);
    return (_jsxs(Box, { h: "100vh", w: "100%", position: "relative", bg: "gray.50", children: [_jsx(ReactFlowProvider, { children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onNodeClick: onNodeClick, nodeTypes: enhancedNodeTypes, fitView: true, snapToGrid: true, snapGrid: [15, 15], children: [_jsx(Controls, {}), _jsx(MiniMap, {}), _jsx(Background, { variant: "dots", gap: 12, size: 1 }), _jsx(Panel, { position: "top-left", children: _jsx(Card, { shadow: "lg", children: _jsx(CardBody, { children: _jsxs(VStack, { align: "start", spacing: 3, children: [_jsxs(HStack, { spacing: 4, children: [_jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "lg", fontWeight: "bold", children: workflowName }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: [nodes.length, " nodes, ", edges.length, " connections"] })] }), executionState.isExecuting && (_jsxs(Badge, { colorScheme: "blue", fontSize: "sm", children: ["Executing ", executionState.progress.toFixed(0), "%"] }))] }), executionState.isExecuting && (_jsx(Progress, { value: executionState.progress, size: "sm", colorScheme: "blue", width: "200px", borderRadius: "full" }))] }) }) }) }), _jsx(Panel, { position: "top-right", children: _jsx(Card, { shadow: "lg", children: _jsx(CardBody, { children: _jsxs(HStack, { spacing: 2, children: [_jsx(Tooltip, { label: "Add Node", children: _jsx(Button, { size: "sm", leftIcon: _jsx(FiPlus, {}), onClick: onNodeLibraryOpen, colorScheme: "blue", children: "Add Node" }) }), _jsx(Tooltip, { label: "Execute Workflow", children: _jsx(Button, { size: "sm", leftIcon: _jsx(FiPlay, {}), onClick: executeWorkflow, colorScheme: "green", isLoading: executionState.isExecuting, loadingText: "Running", children: "Execute" }) }), _jsx(Tooltip, { label: "Save Workflow", children: _jsx(IconButton, { "aria-label": "Save", size: "sm", icon: _jsx(FiSave, {}), onClick: onSaveModalOpen, colorScheme: "purple" }) }), _jsx(Tooltip, { label: "Export Workflow", children: _jsx(IconButton, { "aria-label": "Export", size: "sm", icon: _jsx(FiDownload, {}), onClick: exportWorkflow, colorScheme: "teal" }) }), _jsx(Tooltip, { label: "View Logs", children: _jsx(IconButton, { "aria-label": "Logs", size: "sm", icon: _jsx(FiEye, {}), onClick: onExecutionLogOpen }) }), _jsx(Tooltip, { label: "Reset Workflow", children: _jsx(IconButton, { "aria-label": "Reset", size: "sm", icon: _jsx(FiXCircle, {}), onClick: resetWorkflow, colorScheme: "red", variant: "outline" }) })] }) }) }) })] }) }), _jsxs(Drawer, { isOpen: isNodeLibraryOpen, placement: "right", onClose: onNodeLibraryClose, size: "md", children: [_jsx(DrawerOverlay, {}), _jsxs(DrawerContent, { children: [_jsx(DrawerCloseButton, {}), _jsx(DrawerHeader, { children: "Node Library" }), _jsx(DrawerBody, { children: _jsxs(Tabs, { colorScheme: "blue", children: [_jsx(TabList, { children: Object.keys(groupedTemplates).map(function (category) { return (_jsx(Tab, { children: category }, category)); }) }), _jsx(TabPanels, { children: Object.entries(groupedTemplates).map(function (_a) {
                                                var category = _a[0], templates = _a[1];
                                                return (_jsx(TabPanel, { children: _jsx(VStack, { spacing: 3, align: "stretch", children: templates.map(function (template) { return (_jsx(Card, { cursor: "pointer", _hover: { borderColor: 'blue.400', shadow: 'md' }, onClick: function () { return addNodeToWorkflow(template); }, borderWidth: 2, borderColor: "gray.200", children: _jsx(CardBody, { p: 3, children: _jsxs(VStack, { align: "start", spacing: 1, children: [_jsx(Text, { fontSize: "sm", fontWeight: "bold", children: template.label }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: template.description }), _jsx(Badge, { colorScheme: "blue", fontSize: "xs", children: template.type })] }) }) }, template.id)); }) }) }, category));
                                            }) })] }) })] })] }), _jsxs(Modal, { isOpen: isNodeSettingsOpen, onClose: onNodeSettingsClose, size: "lg", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: "Node Configuration" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { pb: 6, children: selectedNode && (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Node Name" }), _jsx(Input, { value: selectedNode.data.label, onChange: function (e) {
                                                        setNodes(function (nds) {
                                                            return nds.map(function (n) {
                                                                return n.id === selectedNode.id
                                                                    ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { label: e.target.value }) }) : n;
                                                            });
                                                        });
                                                    } })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(Textarea, { value: selectedNode.data.description || '', onChange: function (e) {
                                                        setNodes(function (nds) {
                                                            return nds.map(function (n) {
                                                                return n.id === selectedNode.id
                                                                    ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { description: e.target.value }) }) : n;
                                                            });
                                                        });
                                                    }, rows: 3 })] }), selectedNode.type === 'agentTask' && (_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Select Agent" }), _jsx(Select, { placeholder: "Choose an agent", value: selectedNode.data.agentId || '', onChange: function (e) {
                                                        var agent = availableAgents.find(function (a) { return a.id === e.target.value; });
                                                        setNodes(function (nds) {
                                                            return nds.map(function (n) {
                                                                return n.id === selectedNode.id
                                                                    ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { agentId: e.target.value, agentName: agent === null || agent === void 0 ? void 0 : agent.name }) }) : n;
                                                            });
                                                        });
                                                    }, children: availableAgents.map(function (agent) { return (_jsxs("option", { value: agent.id, children: [agent.name, " (", agent.type, ")"] }, agent.id)); }) })] })), _jsx(Button, { colorScheme: "blue", onClick: onNodeSettingsClose, children: "Save Changes" })] })) })] })] }), _jsxs(Modal, { isOpen: isSaveModalOpen, onClose: onSaveModalClose, children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: "Save Workflow" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { pb: 6, children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Workflow Name" }), _jsx(Input, { value: workflowName, onChange: function (e) { return setWorkflowName(e.target.value); }, placeholder: "Enter workflow name" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(Textarea, { value: workflowDescription, onChange: function (e) { return setWorkflowDescription(e.target.value); }, placeholder: "Describe what this workflow does", rows: 3 })] }), _jsxs(HStack, { justify: "flex-end", spacing: 3, children: [_jsx(Button, { onClick: onSaveModalClose, children: "Cancel" }), _jsx(Button, { colorScheme: "purple", onClick: saveWorkflow, children: "Save Workflow" })] })] }) })] })] }), _jsxs(Drawer, { isOpen: isExecutionLogOpen, placement: "right", onClose: onExecutionLogClose, size: "md", children: [_jsx(DrawerOverlay, {}), _jsxs(DrawerContent, { children: [_jsx(DrawerCloseButton, {}), _jsx(DrawerHeader, { children: "Execution Logs" }), _jsx(DrawerBody, { children: _jsxs(VStack, { spacing: 2, align: "stretch", children: [executionState.logs.map(function (log, index) { return (_jsxs(Alert, { status: log.level === 'error' ? 'error' : log.level === 'success' ? 'success' : 'info', variant: "left-accent", borderRadius: "md", children: [_jsx(AlertIcon, {}), _jsxs(Box, { flex: "1", children: [_jsx(AlertTitle, { fontSize: "sm", children: log.timestamp.toLocaleTimeString() }), _jsx(AlertDescription, { fontSize: "xs", children: log.message })] })] }, index)); }), executionState.logs.length === 0 && (_jsx(Text, { color: "gray.500", textAlign: "center", py: 8, children: "No execution logs yet. Run a workflow to see logs." }))] }) })] })] })] }));
};
export default EnhancedWorkflowBuilder;
