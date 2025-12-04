import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export var NodeCategory = function (_a) {
    var category = _a.category, onDragStart = _a.onDragStart;
    var _b = useState(true), isExpanded = _b[0], setIsExpanded = _b[1];
    return (_jsxs("div", { className: "mb-2", children: [_jsxs("button", { className: "w-full flex items-center justify-between p-2 hover:bg-primary/5", onClick: function () { return setIsExpanded(!isExpanded); }, children: [_jsx("span", { className: "font-medium", children: category.name }), _jsx("span", { children: isExpanded ? '−' : '+' })] }), isExpanded && (_jsx("div", { className: "pl-2", children: category.nodes.map(function (node) { return (_jsxs("div", { className: "flex items-center p-2 hover:bg-primary/5 cursor-move", draggable: true, onDragStart: function (e) { return onDragStart(e, node); }, children: [_jsx("div", { className: "w-8 h-8 mr-2 flex items-center justify-center rounded bg-primary/10", children: node.icon }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: node.label }), _jsx("div", { className: "text-sm text-gray-500", children: node.description })] })] }, node.type)); }) }))] }));
};
