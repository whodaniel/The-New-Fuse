"use strict";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEdge = void 0;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
import WorkflowContext_1 from '@/contexts/WorkflowContext';
import Button_1 from '@/components/ui/Button';
import lucide_react_1 from 'lucide-react';
exports.WorkflowEdge = (0, react_1.memo)(function (_a) {
    var id = _a.id, source = _a.source, target = _a.target, sourceX = _a.sourceX, sourceY = _a.sourceY, targetX = _a.targetX, targetY = _a.targetY, sourcePosition = _a.sourcePosition, targetPosition = _a.targetPosition, data = _a.data, _b = _a.style, style = _b === void 0 ? {} : _b, markerEnd = _a.markerEnd;
    var _c = (0, WorkflowContext_1.useWorkflow)(), removeEdge = _c.actions.removeEdge, isReadOnly = _c.isReadOnly;
    var _d = (0, reactflow_1.getBezierPath)({
        sourceX: sourceX,
        sourceY: sourceY,
        sourcePosition: sourcePosition,
        targetX: targetX,
        targetY: targetY,
        targetPosition: targetPosition,
    }), edgePath = _d[0], labelX = _d[1], labelY = _d[2];
    var isConditional = (data === null || data === void 0 ? void 0 : data.type) === 'conditional';
    var edgeColor = isConditional ? '#f59e0b' : '#64748b';
    return (_jsxs(_Fragment, { children: [_jsx(reactflow_1.BaseEdge, { path: edgePath, markerEnd: markerEnd, style: Object.assign(Object.assign({}, style), { stroke: edgeColor, strokeWidth: 2, animation: (data === null || data === void 0 ? void 0 : data.animated) ? 'flowAnimation 1s infinite' : undefined }) }), (data === null || data === void 0 ? void 0 : data.label) && (_jsx(reactflow_1.EdgeLabelRenderer, { children: _jsx("div", { style: {
                        position: 'absolute',
                        transform: "translate(-50%, -50%) translate(".concat(labelX, "px,").concat(labelY, "px)"),
                        fontSize: 12,
                        pointerEvents: 'all',
                    }, className: "nodrag nopan", children: _jsx("div", { className: "px-2 py-1 rounded-md ".concat(isConditional ? 'bg-amber-100' : 'bg-slate-100'), children: data.label }) }) })), !isReadOnly && (_jsx(reactflow_1.EdgeLabelRenderer, { children: _jsx("div", { style: {
                        position: 'absolute',
                        transform: "translate(-50%, -50%) translate(".concat(labelX, "px,").concat(labelY, "px)"),
                        pointerEvents: 'all',
                    }, className: "nodrag nopan", children: _jsx(Button_1.Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity", onClick: function () { return removeEdge(id); }, children: _jsx(lucide_react_1.X, { className: "h-4 w-4" }) }) }) }))] }));
});
exports.WorkflowEdge.displayName = 'WorkflowEdge';
