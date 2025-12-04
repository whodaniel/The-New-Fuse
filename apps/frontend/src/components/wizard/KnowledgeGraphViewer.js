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
exports.KnowledgeGraphViewer = KnowledgeGraphViewer;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
require("reactflow/dist/style.css");
import { Box } from '@chakra-ui/react';
import WizardProvider_1 from './WizardProvider';
var nodeTypes = {
    concept: ConceptNode,
    relation: RelationNode,
    entity: EntityNode
};
function KnowledgeGraphViewer() {
    var _this = this;
    var state = (0, WizardProvider_1.useWizard)().state;
    var _b = (0, reactflow_1.useNodesState)([]), nodes = _b[0], setNodes = _b[1], onNodesChange = _b[2];
    var _c = (0, reactflow_1.useEdgesState)([]), edges = _c[0], setEdges = _c[1], onEdgesChange = _c[2];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(true), autoLayout = _e[0], setAutoLayout = _e[1];
    var _f = (0, react_1.useState)(''), searchTerm = _f[0], setSearchTerm = _f[1];
    var _g = (0, react_1.useState)(null), selectedNode = _g[0], setSelectedNode = _g[1];
    (0, react_1.useEffect)(function () {
        var _a;
        if ((_a = state.session) === null || _a === void 0 ? void 0 : _a.knowledge_graph) {
            loadGraphData(state.session.knowledge_graph);
        }
    }, [state.session]);
    var loadGraphData = function (graph) { return __awaiter(_this, void 0, void 0, function () {
        var graphData, formattedNodes, formattedEdges, layoutedElements, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, graph.exportGraph()];
                case 2:
                    graphData = _b.sent();
                    formattedNodes = formatNodes(graphData.nodes);
                    formattedEdges = formatEdges(graphData.edges);
                    if (autoLayout) {
                        layoutedElements = applyForceLayout(formattedNodes, formattedEdges);
                        setNodes(layoutedElements.nodes);
                        setEdges(layoutedElements.edges);
                    }
                    else {
                        setNodes(formattedNodes);
                        setEdges(formattedEdges);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _b.sent();
                    console.error('Error loading graph data:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var formatNodes = function (knowledgeNodes) {
        return knowledgeNodes.map(function (node) { return ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: Object.assign({ label: node.label }, node.data)
        }); });
    };
    var formatEdges = function (knowledgeEdges) {
        return knowledgeEdges.map(function (edge) { return ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: edge.type,
            markerEnd: {
                type: reactflow_1.MarkerType.ArrowClosed
            },
            style: { stroke: '#555' }
        }); });
    };
    var applyForceLayout = function (nodes, edges) {
        var nodeSpacing = 150;
        var centerX = window.innerWidth / 2;
        var centerY = window.innerHeight / 2;
        nodes.forEach(function (node, index) {
            var angle = (2 * Math.PI * index) / nodes.length;
            node.position = {
                x: centerX + Math.cos(angle) * nodeSpacing,
                y: centerY + Math.sin(angle) * nodeSpacing
            };
        });
        return { nodes: nodes, edges: edges };
    };
    var handleNodeClick = function (event, node) {
        setSelectedNode(node);
    };
    var handleAddNode = function () {
        var newNode = {
            id: "node-".concat(Date.now()),
            type: 'concept',
            position: { x: 100, y: 100 },
            data: { label: 'New Concept' }
        };
        setNodes(__spreadArray(__spreadArray([], nodes, true), [newNode], false));
    };
    var handleSearch = (0, react_1.useCallback)(function () {
        if (!searchTerm) {
            setNodes(function (nodes) { return nodes.map(function (node) { return (Object.assign(Object.assign({}, node), { style: undefined })); }); });
            return;
        }
        setNodes(function (nodes) { return nodes.map(function (node) { return (Object.assign(Object.assign({}, node), { style: node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
                ? { background: '#ff8', border: '2px solid #aa5' }
                : { opacity: 0.3 } })); }); });
    }, [searchTerm]);
    if (loading) {
        return (_jsx(material_1.Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "400px", children: _jsx(material_1.CircularProgress, {}) }));
    }
    return (_jsxs(Box, { elevation: 3, sx: { height: '600px', position: 'relative' }, children: [_jsxs(material_1.Box, { position: "absolute", top: 16, left: 16, zIndex: 5, display: "flex", gap: 2, children: [_jsx(material_1.TextField, { size: "small", placeholder: "Search nodes...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, onKeyUp: function (e) { return e.key === 'Enter' && handleSearch(); } }), _jsx(material_1.Button, { variant: "contained", size: "small", startIcon: _jsx(icons_material_1.Add, {}), onClick: handleAddNode, children: "Add Node" }), _jsx(material_1.FormControlLabel, { control: _jsx(material_1.Switch, { checked: autoLayout, onChange: function (e) { return setAutoLayout(e.target.checked); }, size: "small" }), label: "Auto Layout" })] }), _jsxs(reactflow_1.default, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onNodeClick: handleNodeClick, nodeTypes: nodeTypes, connectionMode: reactflow_1.ConnectionMode.LOOSE, fitView: true, children: [_jsx(reactflow_1.Background, {}), _jsx(reactflow_1.Controls, {})] }), selectedNode && (_jsx(NodeDetailsPanel, { node: selectedNode, onClose: function () { return setSelectedNode(null); }, onUpdate: function (updatedData) {
                    setNodes(nodes.map(function (n) { return n.id === selectedNode.id
                        ? Object.assign(Object.assign({}, n), { data: Object.assign(Object.assign({}, n.data), updatedData) }) : n; }));
                    setSelectedNode(null);
                } }))] }));
}
function ConceptNode(_b) {
    var data = _b.data;
    return (_jsxs("div", { className: "concept-node", children: [_jsx("div", { className: "header", children: data.label }), _jsx("div", { className: "body", children: data.description })] }));
}
function RelationNode(_b) {
    var data = _b.data;
    return (_jsxs("div", { className: "relation-node", children: [_jsx("div", { className: "header", children: data.label }), _jsx("div", { className: "type", children: data.relationType })] }));
}
function EntityNode(_b) {
    var data = _b.data;
    return (_jsxs("div", { className: "entity-node", children: [_jsx("div", { className: "header", children: data.label }), _jsx("div", { className: "properties", children: Object.entries(data.properties || {}).map(function (_b) {
                    var key = _b[0], value = _b[1];
                    return (_jsxs("div", { className: "property", children: [key, ": ", String(value)] }, key));
                }) })] }));
}
function NodeDetailsPanel(_b) {
    var node = _b.node, onClose = _b.onClose, onUpdate = _b.onUpdate;
    var _c = (0, react_1.useState)(node.data), editData = _c[0], setEditData = _c[1];
    return (_jsxs(Box, { sx: {
            position: 'absolute',
            right: 16,
            top: 16,
            width: 300,
            p: 2,
            zIndex: 10
        }, children: [_jsxs(material_1.Typography, { variant: "h6", gutterBottom: true, children: ["Node Details", _jsx(material_1.IconButton, { size: "small", onClick: onClose, sx: { float: 'right' }, children: _jsx(icons_material_1.Delete, {}) })] }), _jsx(material_1.TextField, { fullWidth: true, label: "Label", value: editData.label, onChange: function (e) { return setEditData(Object.assign(Object.assign({}, editData), { label: e.target.value })); }, margin: "normal", size: "small" }), _jsx(material_1.TextField, { fullWidth: true, label: "Description", value: editData.description || '', onChange: function (e) { return setEditData(Object.assign(Object.assign({}, editData), { description: e.target.value })); }, margin: "normal", size: "small", multiline: true, rows: 3 }), _jsxs(material_1.Box, { mt: 2, display: "flex", justifyContent: "flex-end", gap: 1, children: [_jsx(material_1.Button, { variant: "outlined", onClick: onClose, children: "Cancel" }), _jsx(material_1.Button, { variant: "contained", onClick: function () { return onUpdate(editData); }, children: "Update" })] })] }));
}
