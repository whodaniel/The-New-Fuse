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
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, ReactFlowProvider, Panel } from 'reactflow';
// ReactFlow styles will be imported via the build system
import { Box, VStack, HStack, Button, Text, Card, CardBody, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Badge, Input, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, FormControl, FormLabel, Textarea } from '@chakra-ui/react';
import { FiPlay, FiSave, FiPlus, FiCode, FiDatabase, FiMail, FiCloud, FiGitBranch, FiMessageSquare, FiCalendar, FiUser } from 'react-icons/fi';
// Custom Node Types
var nodeTypes = {
    trigger: function (_a) {
        var data = _a.data;
        return (_jsx(Card, { bg: "green.50", borderColor: "green.200", borderWidth: 2, children: _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Box, { color: "green.600", children: data.icon }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", children: data.label })] }) }) }));
    },
    action: function (_a) {
        var data = _a.data;
        return (_jsx(Card, { bg: "blue.50", borderColor: "blue.200", borderWidth: 2, children: _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Box, { color: "blue.600", children: data.icon }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", children: data.label }), data.status && (_jsx(Badge, { size: "sm", colorScheme: data.status === 'completed' ? 'green' : 'yellow', children: data.status }))] }) }) }));
    },
    condition: function (_a) {
        var data = _a.data;
        return (_jsx(Card, { bg: "orange.50", borderColor: "orange.200", borderWidth: 2, children: _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Box, { color: "orange.600", children: data.icon }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", children: data.label })] }) }) }));
    },
    ai: function (_a) {
        var data = _a.data;
        return (_jsx(Card, { bg: "purple.50", borderColor: "purple.200", borderWidth: 2, children: _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Box, { color: "purple.600", children: data.icon }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", children: data.label }), data.model && (_jsx(Badge, { size: "sm", colorScheme: "purple", children: data.model }))] }) }) }));
    }
};
var availableNodes = [
    {
        id: 'webhook-trigger',
        type: 'trigger',
        label: 'Webhook Trigger',
        icon: _jsx(FiCloud, {}),
        description: 'Triggered by HTTP webhook calls',
        category: 'Triggers'
    },
    {
        id: 'schedule-trigger',
        type: 'trigger',
        label: 'Schedule Trigger',
        icon: _jsx(FiCalendar, {}),
        description: 'Triggered on a schedule (cron)',
        category: 'Triggers'
    },
    {
        id: 'ai-chat',
        type: 'ai',
        label: 'AI Chat',
        icon: _jsx(FiMessageSquare, {}),
        description: 'Chat with AI models',
        category: 'AI'
    },
    {
        id: 'ai-code-gen',
        type: 'ai',
        label: 'Code Generation',
        icon: _jsx(FiCode, {}),
        description: 'Generate code using AI',
        category: 'AI'
    },
    {
        id: 'database-query',
        type: 'action',
        label: 'Database Query',
        icon: _jsx(FiDatabase, {}),
        description: 'Query database records',
        category: 'Data'
    },
    {
        id: 'send-email',
        type: 'action',
        label: 'Send Email',
        icon: _jsx(FiMail, {}),
        description: 'Send email notifications',
        category: 'Communication'
    },
    {
        id: 'condition-check',
        type: 'condition',
        label: 'Condition',
        icon: _jsx(FiGitBranch, {}),
        description: 'Conditional branching logic',
        category: 'Logic'
    },
    {
        id: 'user-approval',
        type: 'action',
        label: 'User Approval',
        icon: _jsx(FiUser, {}),
        description: 'Require user approval to continue',
        category: 'Human'
    }
];
var initialNodes = [];
var initialEdges = [];
var WorkflowBuilder = function () {
    var _a = useNodesState(initialNodes), nodes = _a[0], setNodes = _a[1], onNodesChange = _a[2];
    var _b = useEdgesState(initialEdges), edges = _b[0], setEdges = _b[1], onEdgesChange = _b[2];
    var _c = useState('Untitled Workflow'), workflowName = _c[0], setWorkflowName = _c[1];
    var _d = useState(''), workflowDescription = _d[0], setWorkflowDescription = _d[1];
    var _e = useState(null), selectedNode = _e[0], setSelectedNode = _e[1];
    var _f = useState(false), isExecuting = _f[0], setIsExecuting = _f[1];
    var _g = useState([]), executionResults = _g[0], setExecutionResults = _g[1];
    var _h = useDisclosure(), isNodePanelOpen = _h.isOpen, onNodePanelOpen = _h.onOpen, onNodePanelClose = _h.onClose;
    var _j = useDisclosure(), isSettingsOpen = _j.isOpen, onSettingsOpen = _j.onOpen, onSettingsClose = _j.onClose;
    var _k = useDisclosure(), isSaveModalOpen = _k.isOpen, onSaveModalOpen = _k.onOpen, onSaveModalClose = _k.onClose;
    var toast = useToast();
    useEffect(function () {
        // Load existing workflow if editing
        loadWorkflow();
    }, []);
    var loadWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var urlParams, workflowId;
        return __generator(this, function (_a) {
            urlParams = new URLSearchParams(window.location.search);
            workflowId = urlParams.get('id');
            if (workflowId) {
                // Load workflow from API
                console.log('Loading workflow:', workflowId);
            }
            return [2 /*return*/];
        });
    }); };
    var onConnect = useCallback(function (params) { return setEdges(function (eds) { return addEdge(params, eds); }); }, [setEdges]);
    var addNode = function (nodeTemplate) {
        var newNode = {
            id: "".concat(nodeTemplate.id, "-").concat(Date.now()),
            type: nodeTemplate.type,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: {
                label: nodeTemplate.label,
                icon: nodeTemplate.icon,
                description: nodeTemplate.description,
                category: nodeTemplate.category
            }
        };
        setNodes(function (nds) { return __spreadArray(__spreadArray([], nds, true), [newNode], false); });
        onNodePanelClose();
        toast({
            title: 'Node Added',
            description: "".concat(nodeTemplate.label, " has been added to the workflow"),
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };
    var executeWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _loop_1, i, error_1;
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
                    setIsExecuting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    _loop_1 = function (i) {
                        var node;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    node = nodes[i];
                                    // Update node status
                                    setNodes(function (nds) {
                                        return nds.map(function (n) {
                                            return n.id === node.id
                                                ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { status: 'executing' }) }) : n;
                                        });
                                    });
                                    // Simulate processing time
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                case 1:
                                    // Simulate processing time
                                    _b.sent();
                                    // Mark as completed
                                    setNodes(function (nds) {
                                        return nds.map(function (n) {
                                            return n.id === node.id
                                                ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { status: 'completed' }) }) : n;
                                        });
                                    });
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
                    toast({
                        title: 'Workflow Executed',
                        description: 'All workflow steps completed successfully',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                    });
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    toast({
                        title: 'Execution Error',
                        description: 'An error occurred during workflow execution',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                    return [3 /*break*/, 8];
                case 7:
                    setIsExecuting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var saveWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflowData;
        return __generator(this, function (_a) {
            try {
                workflowData = {
                    name: workflowName,
                    description: workflowDescription,
                    nodes: nodes,
                    edges: edges,
                    version: '1.0.0',
                    lastModified: new Date().toISOString()
                };
                // Simulate API save
                console.log('Saving workflow:', workflowData);
                toast({
                    title: 'Workflow Saved',
                    description: "\"".concat(workflowName, "\" has been saved successfully"),
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onSaveModalClose();
            }
            catch (error) {
                toast({
                    title: 'Save Error',
                    description: 'Failed to save the workflow',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
            return [2 /*return*/];
        });
    }); };
    var onNodeClick = function (event, node) {
        setSelectedNode(node);
        onSettingsOpen();
    };
    return (_jsxs(Box, { h: "100vh", w: "100%", position: "relative", children: [_jsx(ReactFlowProvider, { children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onNodeClick: onNodeClick, nodeTypes: nodeTypes, fitView: true, children: [_jsx(Controls, {}), _jsx(MiniMap, {}), _jsx(Background, { variant: "dots", gap: 12, size: 1 }), _jsx(Panel, { position: "top-left", children: _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(HStack, { spacing: 4, children: [_jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "lg", fontWeight: "bold", children: workflowName }), _jsxs(Text, { fontSize: "sm", color: "gray.600", children: [nodes.length, " nodes, ", edges.length, " connections"] })] }), _jsxs(HStack, { children: [_jsx(Button, { size: "sm", leftIcon: _jsx(FiPlus, {}), onClick: onNodePanelOpen, colorScheme: "blue", children: "Add Node" }), _jsx(Button, { size: "sm", leftIcon: _jsx(FiPlay, {}), onClick: executeWorkflow, colorScheme: "green", isLoading: isExecuting, loadingText: "Executing", children: "Execute" }), _jsx(Button, { size: "sm", leftIcon: _jsx(FiSave, {}), onClick: onSaveModalOpen, colorScheme: "purple", children: "Save" })] })] }) }) }) })] }) }), _jsxs(Drawer, { isOpen: isNodePanelOpen, placement: "right", onClose: onNodePanelClose, size: "md", children: [_jsx(DrawerOverlay, {}), _jsxs(DrawerContent, { children: [_jsx(DrawerCloseButton, {}), _jsx(DrawerHeader, { children: "Workflow Nodes" }), _jsx(DrawerBody, { children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Drag and drop nodes onto the canvas to build your workflow" }), ['Triggers', 'AI', 'Data', 'Communication', 'Logic', 'Human'].map(function (category) {
                                            var categoryNodes = availableNodes.filter(function (node) { return node.category === category; });
                                            if (categoryNodes.length === 0)
                                                return null;
                                            return (_jsxs(VStack, { align: "stretch", spacing: 2, children: [_jsx(Text, { fontWeight: "bold", color: "gray.700", fontSize: "sm", textTransform: "uppercase", children: category }), categoryNodes.map(function (node) { return (_jsx(Card, { cursor: "pointer", _hover: { borderColor: 'blue.300' }, onClick: function () { return addNode(node); }, children: _jsx(CardBody, { p: 3, children: _jsxs(HStack, { children: [_jsx(Box, { color: "blue.600", children: node.icon }), _jsxs(VStack, { align: "start", spacing: 0, flex: 1, children: [_jsx(Text, { fontSize: "sm", fontWeight: "bold", children: node.label }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: node.description })] })] }) }) }, node.id)); })] }, category));
                                        })] }) })] })] }), _jsxs(Modal, { isOpen: isSettingsOpen, onClose: onSettingsClose, size: "lg", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: "Node Settings" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { pb: 6, children: selectedNode && (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsx(Text, { fontSize: "lg", fontWeight: "bold", children: selectedNode.data.label }), _jsx(Text, { color: "gray.600", children: selectedNode.data.description }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Node Name" }), _jsx(Input, { defaultValue: selectedNode.data.label })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Configuration" }), _jsx(Textarea, { placeholder: "Enter node configuration (JSON)", rows: 6, fontFamily: "mono", fontSize: "sm" })] }), _jsx(Button, { colorScheme: "blue", children: "Update Node" })] })) })] })] }), _jsxs(Modal, { isOpen: isSaveModalOpen, onClose: onSaveModalClose, children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: "Save Workflow" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { pb: 6, children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Workflow Name" }), _jsx(Input, { value: workflowName, onChange: function (e) { return setWorkflowName(e.target.value); }, placeholder: "Enter workflow name" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(Textarea, { value: workflowDescription, onChange: function (e) { return setWorkflowDescription(e.target.value); }, placeholder: "Describe what this workflow does", rows: 3 })] }), _jsxs(HStack, { justify: "flex-end", spacing: 3, children: [_jsx(Button, { onClick: onSaveModalClose, children: "Cancel" }), _jsx(Button, { colorScheme: "purple", onClick: saveWorkflow, children: "Save Workflow" })] })] }) })] })] })] }));
};
export default WorkflowBuilder;
