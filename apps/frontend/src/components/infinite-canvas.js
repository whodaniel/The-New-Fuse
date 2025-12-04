"use strict";
'use client';
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
exports.InfiniteCanvas = InfiniteCanvas;
import react_1 from 'react';
import framer_motion_1 from 'framer-motion';
import pipeline_node_1 from './pipeline-node';
import node_connection_1 from './node-connection';
import button_1 from '@/components/ui/button';
import lucide_react_1 from 'lucide-react';
function InfiniteCanvas() {
    var _a = (0, react_1.useState)([]), nodes = _a[0], setNodes = _a[1];
    var _b = (0, react_1.useState)([]), connections = _b[0], setConnections = _b[1];
    var _c = (0, react_1.useState)(1), scale = _c[0], setScale = _c[1];
    var _d = (0, react_1.useState)({ x: 0, y: 0 }), position = _d[0], setPosition = _d[1];
    var canvasRef = (0, react_1.useRef)(null);
    var handleDragNode = function (id, newPosition) {
        setNodes(nodes.map(function (node) { return node.id === id ? Object.assign(Object.assign({}, node), { position: newPosition }) : node; }));
    };
    var handleConnect = function (fromId, toId) {
        setConnections(__spreadArray(__spreadArray([], connections, true), [{ from: fromId, to: toId }], false));
    };
    var handleAddNode = function (type) {
        var newNode = {
            id: "node_".concat(Date.now()),
            type: type,
            position: { x: 0, y: 0 },
        };
        setNodes(__spreadArray(__spreadArray([], nodes, true), [newNode], false));
    };
    var handleZoom = function (delta) {
        setScale(function (scale) { return Math.max(0.1, Math.min(2, scale + delta * 0.1)); });
    };
    var handlePan = react_1.useCallback(function (event, info) {
        setPosition(function (pos) { return ({
            x: pos.x + info.delta.x / scale,
            y: pos.y + info.delta.y / scale,
        }); });
    }, [scale]);
    return (_jsxs("div", { className: "w-full h-full overflow-hidden relative", children: [_jsxs(framer_motion_1.motion.div, { ref: canvasRef, className: "w-full h-full absolute", style: {
                    scale: scale,
                    x: position.x,
                    y: position.y,
                }, drag: true, dragMomentum: false, onDrag: handlePan, children: [nodes.map(function (node) { return (_jsx(pipeline_node_1.PipelineNode, { node: node, onDrag: function (newPosition) { return handleDragNode(node.id, newPosition); }, onConnect: handleConnect }, node.id)); }), connections.map(function (connection, index) { return (_jsx(node_connection_1.NodeConnection, { from: connection.from, to: connection.to }, index)); })] }), _jsxs("div", { className: "absolute top-4 left-4 space-x-2", children: [_jsx(button_1.Button, { onClick: function () { return handleZoom(1); }, children: _jsx(lucide_react_1.Plus, { className: "h-4 w-4" }) }), _jsx(button_1.Button, { onClick: function () { return handleZoom(-1); }, children: _jsx(lucide_react_1.Minus, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "absolute bottom-4 left-4 space-x-2", children: [_jsx(button_1.Button, { onClick: function () { return handleAddNode('huggingface'); }, children: "Add HuggingFace Node" }), _jsx(button_1.Button, { onClick: function () { return handleAddNode('langchain'); }, children: "Add LangChain Node" }), _jsx(button_1.Button, { onClick: function () { return handleAddNode('comfyui'); }, children: "Add ComfyUI Node" }), _jsx(button_1.Button, { onClick: function () { return handleAddNode('webhook'); }, children: "Add Webhook Node" }), _jsx(button_1.Button, { onClick: function () { return handleAddNode('gpu'); }, children: "Add GPU Node" })] })] }));
}
