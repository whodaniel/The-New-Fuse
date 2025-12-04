"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineNode = PipelineNode;
import framer_motion_1 from 'framer-motion';
import card_1 from '@/components/ui/card';
function PipelineNode(_a) {
    var node = _a.node, onDrag = _a.onDrag, onConnect = _a.onConnect;
    var handleDragEnd = function (event, info) {
        onDrag({ x: info.point.x, y: info.point.y });
    };
    return (_jsx(framer_motion_1.motion.div, { drag: true, dragMomentum: false, onDragEnd: handleDragEnd, style: {
            position: 'absolute',
            left: node.position.x,
            top: node.position.y,
        }, children: _jsxs(card_1.Card, { className: "w-48", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: node.type }) }), _jsx(card_1.CardContent, { children: _jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "w-3 h-3 bg-blue-500 rounded-full cursor-pointer", onMouseDown: function () { return onConnect(node.id, 'input'); } }), _jsx("div", { className: "w-3 h-3 bg-green-500 rounded-full cursor-pointer", onMouseDown: function () { return onConnect(node.id, 'output'); } })] }) })] }) }));
}
