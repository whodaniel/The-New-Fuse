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
import { useState, useCallback, useRef } from 'react';
import ReactFlow, { addEdge, useNodesState, useEdgesState, Controls, Background, MiniMap, Panel, ReactFlowProvider, useReactFlow, } from 'reactflow';
import 'reactflow/dist/style.css';
// Custom Node Components
var AgentNode = function (_a) {
    var data = _a.data;
    return (_jsxs("div", { className: "agent-node", children: [_jsxs("div", { className: "node-header", children: [_jsx("div", { className: "node-icon", children: "\uD83E\uDD16" }), _jsx("div", { className: "node-title", children: data.label })] }), _jsxs("div", { className: "node-content", children: [_jsxs("div", { className: "node-field", children: [_jsx("label", { children: "Agent Type:" }), _jsxs("select", { value: data.agentType || 'claude', onChange: function (e) { var _a; return (_a = data.onChange) === null || _a === void 0 ? void 0 : _a.call(data, 'agentType', e.target.value); }, children: [_jsx("option", { value: "claude", children: "Claude AI" }), _jsx("option", { value: "gemini", children: "Gemini" }), _jsx("option", { value: "chatgpt", children: "ChatGPT" }), _jsx("option", { value: "perplexity", children: "Perplexity" })] })] }), _jsxs("div", { className: "node-field", children: [_jsx("label", { children: "Prompt:" }), _jsx("textarea", { value: data.prompt || '', onChange: function (e) { var _a; return (_a = data.onChange) === null || _a === void 0 ? void 0 : _a.call(data, 'prompt', e.target.value); }, placeholder: "Enter your prompt here..." })] })] })] }));
};
var MCPToolNode = function (_a) {
    var data = _a.data;
    return (_jsxs("div", { className: "mcp-node", children: [_jsxs("div", { className: "node-header", children: [_jsx("div", { className: "node-icon", children: "\uD83D\uDD27" }), _jsx("div", { className: "node-title", children: data.label })] }), _jsxs("div", { className: "node-content", children: [_jsxs("div", { className: "node-field", children: [_jsx("label", { children: "Tool:" }), _jsxs("select", { value: data.tool || '', onChange: function (e) { var _a; return (_a = data.onChange) === null || _a === void 0 ? void 0 : _a.call(data, 'tool', e.target.value); }, children: [_jsx("option", { value: "", children: "Select a tool..." }), _jsx("option", { value: "screenshot", children: "Take Screenshot" }), _jsx("option", { value: "browser", children: "Browser Automation" }), _jsx("option", { value: "file-system", children: "File System" }), _jsx("option", { value: "database", children: "Database Query" })] })] }), _jsxs("div", { className: "node-field", children: [_jsx("label", { children: "Parameters:" }), _jsx("textarea", { value: data.parameters || '', onChange: function (e) { var _a; return (_a = data.onChange) === null || _a === void 0 ? void 0 : _a.call(data, 'parameters', e.target.value); }, placeholder: "Enter parameters as JSON..." })] })] })] }));
};
var FlowControlNode = function (_a) {
    var data = _a.data;
    return (_jsxs("div", { className: "flow-node", children: [_jsxs("div", { className: "node-header", children: [_jsx("div", { className: "node-icon", children: "\u26A1" }), _jsx("div", { className: "node-title", children: data.label })] }), _jsxs("div", { className: "node-content", children: [_jsxs("div", { className: "node-field", children: [_jsx("label", { children: "Type:" }), _jsxs("select", { value: data.type || 'condition', onChange: function (e) { var _a; return (_a = data.onChange) === null || _a === void 0 ? void 0 : _a.call(data, 'type', e.target.value); }, children: [_jsx("option", { value: "condition", children: "Condition" }), _jsx("option", { value: "loop", children: "Loop" }), _jsx("option", { value: "delay", children: "Delay" }), _jsx("option", { value: "parallel", children: "Parallel" })] })] }), _jsxs("div", { className: "node-field", children: [_jsx("label", { children: "Configuration:" }), _jsx("textarea", { value: data.config || '', onChange: function (e) { var _a; return (_a = data.onChange) === null || _a === void 0 ? void 0 : _a.call(data, 'config', e.target.value); }, placeholder: "Enter configuration..." })] })] })] }));
};
var nodeTypes = {
    agent: AgentNode,
    mcpTool: MCPToolNode,
    flowControl: FlowControlNode,
};
var initialNodes = [
    {
        id: 'start',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { label: '🚀 Start' },
        style: { background: '#10b981', color: 'white', border: 'none' },
    },
];
var initialEdges = [];
var WorkflowBuilderContent = function () {
    var _a = useNodesState(initialNodes), nodes = _a[0], setNodes = _a[1], onNodesChange = _a[2];
    var _b = useEdgesState(initialEdges), edges = _b[0], setEdges = _b[1], onEdgesChange = _b[2];
    var _c = useState(''), selectedTemplate = _c[0], setSelectedTemplate = _c[1];
    var _d = useState('Untitled Workflow'), workflowName = _d[0], setWorkflowName = _d[1];
    var _e = useState(false), isExecuting = _e[0], setIsExecuting = _e[1];
    var _f = useState([]), executionLog = _f[0], setExecutionLog = _f[1];
    var reactFlowWrapper = useRef(null);
    var project = useReactFlow().project;
    var onConnect = useCallback(function (params) { return setEdges(function (eds) { return addEdge(params, eds); }); }, [setEdges]);
    var onDragOver = useCallback(function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);
    var onDrop = useCallback(function (event) {
        var _a;
        event.preventDefault();
        var reactFlowBounds = (_a = reactFlowWrapper.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        var type = event.dataTransfer.getData('application/reactflow');
        if (typeof type === 'undefined' || !type || !reactFlowBounds) {
            return;
        }
        var position = project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        });
        var newNode = {
            id: "".concat(type, "-").concat(Date.now()),
            type: type,
            position: position,
            data: {
                label: "".concat(type.charAt(0).toUpperCase() + type.slice(1), " Node"),
                onChange: function (field, value) {
                    setNodes(function (nds) {
                        return nds.map(function (node) {
                            var _a;
                            return node.id === newNode.id
                                ? __assign(__assign({}, node), { data: __assign(__assign({}, node.data), (_a = {}, _a[field] = value, _a)) }) : node;
                        });
                    });
                }
            },
        };
        setNodes(function (nds) { return nds.concat(newNode); });
    }, [project, setNodes]);
    var onDragStart = function (event, nodeType) {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };
    var saveWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    workflow = {
                        name: workflowName,
                        nodes: nodes,
                        edges: edges,
                        createdAt: new Date().toISOString(),
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch('http://localhost:3000/api/workflows', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(workflow),
                        })];
                case 2:
                    response = _a.sent();
                    if (response.ok) {
                        alert('Workflow saved successfully!');
                    }
                    else {
                        alert('Failed to save workflow');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error saving workflow:', error_1);
                    alert('Error saving workflow');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var executeWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, response, result_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsExecuting(true);
                    setExecutionLog(['🚀 Starting workflow execution...']);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    workflow = { name: workflowName, nodes: nodes, edges: edges };
                    return [4 /*yield*/, fetch('http://localhost:3000/api/workflows/execute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(workflow),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    result_1 = _a.sent();
                    setExecutionLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['✅ Workflow executed successfully!', JSON.stringify(result_1, null, 2)], false); });
                    return [3 /*break*/, 5];
                case 4:
                    setExecutionLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['❌ Workflow execution failed'], false); });
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    console.error('Error executing workflow:', error_2);
                    setExecutionLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["\u274C Error: ".concat(error_2)], false); });
                    return [3 /*break*/, 8];
                case 7:
                    setIsExecuting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var loadTemplate = function (templateName) {
        var templates = {
            'ai-research': {
                nodes: [
                    { id: 'start', type: 'input', position: { x: 100, y: 100 }, data: { label: '🚀 Start' } },
                    { id: 'research', type: 'agent', position: { x: 300, y: 100 }, data: { label: 'Research Agent', agentType: 'perplexity', prompt: 'Research the given topic and provide comprehensive information' } },
                    { id: 'analyze', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'Analysis Agent', agentType: 'claude', prompt: 'Analyze the research data and extract key insights' } },
                    { id: 'report', type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Report Generator', agentType: 'chatgpt', prompt: 'Generate a comprehensive report based on the analysis' } },
                ],
                edges: [
                    { id: 'e1', source: 'start', target: 'research' },
                    { id: 'e2', source: 'research', target: 'analyze' },
                    { id: 'e3', source: 'analyze', target: 'report' },
                ],
            },
            'content-creation': {
                nodes: [
                    { id: 'start', type: 'input', position: { x: 100, y: 100 }, data: { label: '🚀 Start' } },
                    { id: 'ideation', type: 'agent', position: { x: 300, y: 100 }, data: { label: 'Ideation Agent', agentType: 'gemini', prompt: 'Generate creative content ideas based on the brief' } },
                    { id: 'writing', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'Writing Agent', agentType: 'chatgpt', prompt: 'Write engaging content based on the selected idea' } },
                    { id: 'editing', type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Editor Agent', agentType: 'claude', prompt: 'Edit and refine the content for clarity and impact' } },
                ],
                edges: [
                    { id: 'e1', source: 'start', target: 'ideation' },
                    { id: 'e2', source: 'ideation', target: 'writing' },
                    { id: 'e3', source: 'writing', target: 'editing' },
                ],
            },
            'data-processing': {
                nodes: [
                    { id: 'start', type: 'input', position: { x: 100, y: 100 }, data: { label: '🚀 Start' } },
                    { id: 'ingest', type: 'mcpTool', position: { x: 300, y: 100 }, data: { label: 'Data Ingestion', tool: 'file-system', parameters: '{"action": "read", "path": "data/"}' } },
                    { id: 'clean', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'Data Cleaner', agentType: 'claude', prompt: 'Clean and normalize the data' } },
                    { id: 'analyze', type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Data Analyst', agentType: 'gemini', prompt: 'Analyze the data and generate insights' } },
                    { id: 'visualize', type: 'mcpTool', position: { x: 900, y: 100 }, data: { label: 'Visualization', tool: 'database', parameters: '{"action": "create_chart"}' } },
                ],
                edges: [
                    { id: 'e1', source: 'start', target: 'ingest' },
                    { id: 'e2', source: 'ingest', target: 'clean' },
                    { id: 'e3', source: 'clean', target: 'analyze' },
                    { id: 'e4', source: 'analyze', target: 'visualize' },
                ],
            },
        };
        var template = templates[templateName];
        if (template) {
            setNodes(template.nodes.map(function (node) { return (__assign(__assign({}, node), { data: __assign(__assign({}, node.data), { onChange: function (field, value) {
                        setNodes(function (nds) {
                            return nds.map(function (n) {
                                var _a;
                                return n.id === node.id
                                    ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), (_a = {}, _a[field] = value, _a)) }) : n;
                            });
                        });
                    } }) })); }));
            setEdges(template.edges);
            setWorkflowName("".concat(templateName.replace('-', ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }), " Workflow"));
        }
    };
    return (_jsxs("div", { className: "workflow-builder", children: [_jsxs("div", { className: "builder-header", children: [_jsxs("div", { className: "header-left", children: [_jsx("input", { type: "text", value: workflowName, onChange: function (e) { return setWorkflowName(e.target.value); }, className: "workflow-name-input" }), _jsxs("div", { className: "workflow-status", children: [_jsx("span", { className: "status-dot active" }), _jsx("span", { children: "Ready" })] })] }), _jsxs("div", { className: "header-actions", children: [_jsxs("select", { value: selectedTemplate, onChange: function (e) {
                                    setSelectedTemplate(e.target.value);
                                    if (e.target.value)
                                        loadTemplate(e.target.value);
                                }, className: "template-selector", children: [_jsx("option", { value: "", children: "Load Template..." }), _jsx("option", { value: "ai-research", children: "AI Research Assistant" }), _jsx("option", { value: "content-creation", children: "Content Creation Pipeline" }), _jsx("option", { value: "data-processing", children: "Data Processing Workflow" })] }), _jsx("button", { onClick: saveWorkflow, className: "btn btn-secondary", children: "\uD83D\uDCBE Save" }), _jsx("button", { onClick: executeWorkflow, className: "btn btn-primary", disabled: isExecuting, children: isExecuting ? '⏳ Executing...' : '▶️ Execute' })] })] }), _jsxs("div", { className: "builder-content", children: [_jsxs("div", { className: "builder-sidebar", children: [_jsx("h3", { children: "Node Library" }), _jsxs("div", { className: "node-category", children: [_jsx("h4", { children: "\uD83E\uDD16 AI Agents" }), _jsxs("div", { className: "draggable-node agent-node-preview", onDragStart: function (event) { return onDragStart(event, 'agent'); }, draggable: true, children: [_jsx("div", { className: "node-icon", children: "\uD83E\uDD16" }), _jsx("span", { children: "AI Agent" })] })] }), _jsxs("div", { className: "node-category", children: [_jsx("h4", { children: "\uD83D\uDD27 MCP Tools" }), _jsxs("div", { className: "draggable-node mcp-node-preview", onDragStart: function (event) { return onDragStart(event, 'mcpTool'); }, draggable: true, children: [_jsx("div", { className: "node-icon", children: "\uD83D\uDD27" }), _jsx("span", { children: "MCP Tool" })] })] }), _jsxs("div", { className: "node-category", children: [_jsx("h4", { children: "\u26A1 Flow Control" }), _jsxs("div", { className: "draggable-node flow-node-preview", onDragStart: function (event) { return onDragStart(event, 'flowControl'); }, draggable: true, children: [_jsx("div", { className: "node-icon", children: "\u26A1" }), _jsx("span", { children: "Flow Control" })] })] }), executionLog.length > 0 && (_jsxs("div", { className: "execution-log", children: [_jsx("h4", { children: "\uD83D\uDCCB Execution Log" }), _jsx("div", { className: "log-content", children: executionLog.map(function (log, index) { return (_jsx("div", { className: "log-entry", children: log }, index)); }) })] }))] }), _jsx("div", { className: "builder-canvas", ref: reactFlowWrapper, children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onDrop: onDrop, onDragOver: onDragOver, nodeTypes: nodeTypes, fitView: true, children: [_jsx(Background, { color: "#1f2937", gap: 20 }), _jsx(Controls, {}), _jsx(MiniMap, { nodeColor: "#374151", maskColor: "rgba(0, 0, 0, 0.2)" }), _jsx(Panel, { position: "top-right", children: _jsxs("div", { className: "canvas-info", children: [_jsxs("div", { children: ["Nodes: ", nodes.length] }), _jsxs("div", { children: ["Connections: ", edges.length] })] }) })] }) })] }), _jsx("style", { jsx: true, children: "\n        .workflow-builder {\n          height: 100vh;\n          display: flex;\n          flex-direction: column;\n          background: #0f172a;\n          color: white;\n          font-family: 'Inter', sans-serif;\n        }\n\n        .builder-header {\n          display: flex;\n          justify-content: space-between;\n          align-items: center;\n          padding: 16px 24px;\n          background: rgba(255, 255, 255, 0.05);\n          border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n        }\n\n        .header-left {\n          display: flex;\n          align-items: center;\n          gap: 16px;\n        }\n\n        .workflow-name-input {\n          background: transparent;\n          border: none;\n          color: white;\n          font-size: 20px;\n          font-weight: 600;\n          padding: 8px 12px;\n          border-radius: 8px;\n          border: 1px solid transparent;\n        }\n\n        .workflow-name-input:focus {\n          outline: none;\n          border-color: #3b82f6;\n          background: rgba(59, 130, 246, 0.1);\n        }\n\n        .workflow-status {\n          display: flex;\n          align-items: center;\n          gap: 8px;\n          font-size: 14px;\n          color: #94a3b8;\n        }\n\n        .status-dot {\n          width: 8px;\n          height: 8px;\n          border-radius: 50%;\n          background: #10b981;\n        }\n\n        .header-actions {\n          display: flex;\n          align-items: center;\n          gap: 12px;\n        }\n\n        .template-selector {\n          background: rgba(255, 255, 255, 0.1);\n          border: 1px solid rgba(255, 255, 255, 0.2);\n          color: white;\n          padding: 8px 16px;\n          border-radius: 8px;\n          font-size: 14px;\n        }\n\n        .btn {\n          padding: 10px 20px;\n          border-radius: 8px;\n          border: none;\n          font-weight: 600;\n          cursor: pointer;\n          transition: all 0.2s;\n          display: flex;\n          align-items: center;\n          gap: 8px;\n        }\n\n        .btn-primary {\n          background: linear-gradient(45deg, #3b82f6, #1d4ed8);\n          color: white;\n        }\n\n        .btn-secondary {\n          background: rgba(255, 255, 255, 0.1);\n          color: white;\n          border: 1px solid rgba(255, 255, 255, 0.2);\n        }\n\n        .btn:hover {\n          transform: translateY(-1px);\n        }\n\n        .btn:disabled {\n          opacity: 0.6;\n          cursor: not-allowed;\n          transform: none;\n        }\n\n        .builder-content {\n          display: flex;\n          flex: 1;\n          overflow: hidden;\n        }\n\n        .builder-sidebar {\n          width: 300px;\n          background: rgba(255, 255, 255, 0.05);\n          border-right: 1px solid rgba(255, 255, 255, 0.1);\n          padding: 20px;\n          overflow-y: auto;\n        }\n\n        .builder-sidebar h3 {\n          margin: 0 0 20px 0;\n          color: #3b82f6;\n          font-size: 18px;\n        }\n\n        .node-category {\n          margin-bottom: 24px;\n        }\n\n        .node-category h4 {\n          margin: 0 0 12px 0;\n          font-size: 14px;\n          color: #94a3b8;\n        }\n\n        .draggable-node {\n          display: flex;\n          align-items: center;\n          gap: 12px;\n          padding: 12px 16px;\n          background: rgba(255, 255, 255, 0.08);\n          border: 1px solid rgba(255, 255, 255, 0.1);\n          border-radius: 8px;\n          cursor: grab;\n          transition: all 0.2s;\n          margin-bottom: 8px;\n        }\n\n        .draggable-node:hover {\n          background: rgba(255, 255, 255, 0.12);\n          transform: translateY(-1px);\n        }\n\n        .draggable-node:active {\n          cursor: grabbing;\n        }\n\n        .node-icon {\n          font-size: 18px;\n        }\n\n        .builder-canvas {\n          flex: 1;\n          position: relative;\n        }\n\n        .canvas-info {\n          background: rgba(0, 0, 0, 0.8);\n          padding: 8px 12px;\n          border-radius: 6px;\n          font-size: 12px;\n          color: #94a3b8;\n        }\n\n        .execution-log {\n          margin-top: 24px;\n          padding-top: 24px;\n          border-top: 1px solid rgba(255, 255, 255, 0.1);\n        }\n\n        .execution-log h4 {\n          margin: 0 0 12px 0;\n          font-size: 14px;\n          color: #94a3b8;\n        }\n\n        .log-content {\n          max-height: 200px;\n          overflow-y: auto;\n          background: rgba(0, 0, 0, 0.3);\n          border-radius: 6px;\n          padding: 12px;\n        }\n\n        .log-entry {\n          font-size: 12px;\n          font-family: 'Monaco', monospace;\n          margin-bottom: 4px;\n          color: #e2e8f0;\n        }\n\n        /* Node Styles */\n        .agent-node, .mcp-node, .flow-node {\n          background: rgba(255, 255, 255, 0.95);\n          border: 2px solid #3b82f6;\n          border-radius: 12px;\n          padding: 16px;\n          min-width: 250px;\n          color: #1f2937;\n        }\n\n        .node-header {\n          display: flex;\n          align-items: center;\n          gap: 12px;\n          margin-bottom: 12px;\n          padding-bottom: 8px;\n          border-bottom: 1px solid #e5e7eb;\n        }\n\n        .node-title {\n          font-weight: 600;\n          font-size: 16px;\n        }\n\n        .node-content {\n          display: flex;\n          flex-direction: column;\n          gap: 12px;\n        }\n\n        .node-field {\n          display: flex;\n          flex-direction: column;\n          gap: 4px;\n        }\n\n        .node-field label {\n          font-size: 12px;\n          font-weight: 600;\n          color: #6b7280;\n        }\n\n        .node-field select,\n        .node-field textarea {\n          padding: 8px;\n          border: 1px solid #d1d5db;\n          border-radius: 6px;\n          font-size: 14px;\n        }\n\n        .node-field textarea {\n          min-height: 60px;\n          resize: vertical;\n        }\n\n        .mcp-node {\n          border-color: #10b981;\n        }\n\n        .flow-node {\n          border-color: #f59e0b;\n        }\n      " })] }));
};
export var ModernWorkflowBuilder = function () {
    return (_jsx(ReactFlowProvider, { children: _jsx(WorkflowBuilderContent, {}) }));
};
export default ModernWorkflowBuilder;
