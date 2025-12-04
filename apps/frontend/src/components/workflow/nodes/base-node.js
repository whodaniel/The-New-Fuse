import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
export var BaseNode = memo(function (_a) {
    var id = _a.id, data = _a.data, _b = _a.inputHandles, inputHandles = _b === void 0 ? [{ id: 'default', label: 'Input' }] : _b, _c = _a.outputHandles, outputHandles = _c === void 0 ? [{ id: 'default', label: 'Output' }] : _c;
    var _d = useState(false), expanded = _d[0], setExpanded = _d[1];
    return (_jsxs(Card, { className: "w-64 shadow-md", children: [_jsxs(CardHeader, { className: "p-3 pb-2 flex flex-row items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: data.name }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: function () { return setExpanded(!expanded); }, children: expanded ? _jsx(ChevronUp, { className: "h-4 w-4" }) : _jsx(ChevronDown, { className: "h-4 w-4" }) }), data.onDelete && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 text-destructive hover:text-destructive", onClick: data.onDelete, children: _jsx(Trash2, { className: "h-4 w-4" }) }))] })] }), expanded && (_jsx(CardContent, { className: "p-3 pt-0", children: data.type && (_jsxs("div", { className: "text-xs text-muted-foreground mb-2", children: ["Type: ", data.type] })) })), inputHandles.map(function (handle) { return (_jsx(Handle, { id: handle.id, type: "target", position: Position.Left, className: "w-2 h-2 rounded-full bg-primary border-2 border-background", style: { left: -3, top: "".concat((1 + inputHandles.indexOf(handle)) / (inputHandles.length + 1) * 100, "%") } }, "input-".concat(handle.id))); }), outputHandles.map(function (handle) { return (_jsx(Handle, { id: handle.id, type: "source", position: Position.Right, className: "w-2 h-2 rounded-full bg-primary border-2 border-background", style: { right: -3, top: "".concat((1 + outputHandles.indexOf(handle)) / (outputHandles.length + 1) * 100, "%") } }, "output-".concat(handle.id))); })] }));
});
BaseNode.displayName = 'BaseNode';
