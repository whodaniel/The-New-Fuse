"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowPage = void 0;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
import useFlowRouter_1 from '../../hooks/useFlowRouter';
import core_1 from '@/components/core';
import lucide_react_1 from 'lucide-react';
require("reactflow/dist/style.css");
var FlowPage = function (_a) {
    var _b = _a.initialNodes, initialNodes = _b === void 0 ? [] : _b, _c = _a.initialEdges, initialEdges = _c === void 0 ? [] : _c, onNodesChange = _a.onNodesChange, onEdgesChange = _a.onEdgesChange;
    var _d = (0, reactflow_1.useNodesState)(initialNodes), nodes = _d[0], setNodes = _d[1], onNodesChangeInternal = _d[2];
    var _e = (0, reactflow_1.useEdgesState)(initialEdges), edges = _e[0], setEdges = _e[1], onEdgesChangeInternal = _e[2];
    var _f = (0, useFlowRouter_1.useFlowRouter)(), registerNode = _f.registerNode, updateNode = _f.updateNode, removeNode = _f.removeNode, navigateToNode = _f.navigateToNode;
    (0, react_1.useEffect)(function () {
        nodes.forEach(function (node) {
            registerNode(node);
        });
    }, []);
    var handleNodesChange = (0, react_1.useCallback)(function (changes) {
        onNodesChangeInternal(changes);
        changes.forEach(function (change) {
            if (change.type === 'position' || change.type === 'dimensions') {
                var node = nodes.find(function (n) { return n.id === change.id; });
                if (node) {
                    updateNode(node);
                }
            }
            else if (change.type === 'remove') {
                removeNode(change.id);
            }
        });
        if (onNodesChange) {
            onNodesChange(nodes);
        }
    }, [nodes, onNodesChange, onNodesChangeInternal, updateNode, removeNode]);
    var handleEdgesChange = (0, react_1.useCallback)(function (changes) {
        onEdgesChangeInternal(changes);
        if (onEdgesChange) {
            onEdgesChange(edges);
        }
    }, [edges, onEdgesChange, onEdgesChangeInternal]);
    var handleConnect = (0, react_1.useCallback)(function (connection) {
        setEdges(function (eds) { return (0, reactflow_1.addEdge)(connection, eds); });
    }, [setEdges]);
    var handleNodeClick = (0, react_1.useCallback)(function (_, node) {
        navigateToNode(node.id);
    }, [navigateToNode]);
    return (_jsx("div", { className: "w-full h-screen bg-background", children: _jsxs(reactflow_1.default, { nodes: nodes, edges: edges, onNodesChange: handleNodesChange, onEdgesChange: handleEdgesChange, onConnect: handleConnect, onNodeClick: handleNodeClick, fitView: true, className: "bg-background", children: [_jsxs(reactflow_1.Panel, { position: "top-right", className: "space-x-2", children: [_jsx(core_1.Button, { size: "sm", variant: "outline", children: _jsx(lucide_react_1.ZoomIn, { className: "h-4 w-4" }) }), _jsx(core_1.Button, { size: "sm", variant: "outline", children: _jsx(lucide_react_1.ZoomOut, { className: "h-4 w-4" }) }), _jsx(core_1.Button, { size: "sm", variant: "outline", children: _jsx(lucide_react_1.Maximize2, { className: "h-4 w-4" }) })] }), _jsx(reactflow_1.Controls, { className: "bg-card border rounded-lg shadow-sm" }), _jsx(reactflow_1.MiniMap, { className: "bg-card border rounded-lg shadow-sm" }), _jsx(reactflow_1.Background, { className: "bg-muted" })] }) }));
};
exports.FlowPage = FlowPage;
