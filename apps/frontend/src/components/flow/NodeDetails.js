"use strict";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeDetails = void 0;
import react_router_dom_1 from 'react-router-dom';
import core_1 from '@/components/core';
var NodeDetails = function (_d) {
    var nodes = _d.nodes, onNodeUpdate = _d.onNodeUpdate;
    var _a, _b, _c;
    var nodeId = (0, react_router_dom_1.useParams)().nodeId;
    var node = nodes.find(function (n) { return n.id === nodeId; });
    if (!node) {
        return (_jsx(core_1.Card, { children: _jsxs(core_1.CardHeader, { children: [_jsx(core_1.CardTitle, { children: "Error" }), _jsx(core_1.CardDescription, { children: "Node not found" })] }) }));
    }
    var handleParameterChange = function (paramKey, value) {
        var _d;
        var _a;
        if (onNodeUpdate) {
            onNodeUpdate(node.id, {
                data: Object.assign(Object.assign({}, node.data), { parameters: Object.assign(Object.assign({}, (_a = node.data) === null || _a === void 0 ? void 0 : _a.parameters), (_d = {}, _d[paramKey] = value, _d)) }),
            });
        }
    };
    return (_jsxs(core_1.Card, { className: "max-w-2xl mx-auto", children: [_jsxs(core_1.CardHeader, { children: [_jsx(core_1.CardTitle, { children: ((_a = node.data) === null || _a === void 0 ? void 0 : _a.label) || 'Unnamed Node' }), _jsxs(core_1.CardDescription, { children: ["ID: ", node.id, " \u2022 Type: ", ((_b = node.data) === null || _b === void 0 ? void 0 : _b.type) || 'Unknown'] })] }), _jsxs(core_1.CardContent, { className: "space-y-6", children: [((_c = node.data) === null || _c === void 0 ? void 0 : _c.parameters) && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Parameters" }), _jsx("div", { className: "space-y-4", children: Object.entries(node.data.parameters).map(function (_d) {
                                            var key = _d[0], value = _d[1];
                                            return (_jsxs("div", { className: "space-y-2", children: [_jsx(core_1.Label, { children: key }), typeof value === 'boolean' ? (_jsx(core_1.Switch, { checked: value, onCheckedChange: function (checked) { return handleParameterChange(key, checked); } })) : typeof value === 'number' ? (_jsx(core_1.Input, { type: "number", value: value, onChange: function (e) { return handleParameterChange(key, parseFloat(e.target.value)); } })) : (_jsx(core_1.Input, { type: "text", value: value, onChange: function (e) { return handleParameterChange(key, e.target.value); } }))] }, key));
                                        }) })] }), _jsx(core_1.Separator, {})] })), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Position" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(core_1.Label, { children: "X" }), _jsx(core_1.Input, { type: "number", value: node.position.x, readOnly: true, disabled: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(core_1.Label, { children: "Y" }), _jsx(core_1.Input, { type: "number", value: node.position.y, readOnly: true, disabled: true })] })] })] })] })] }));
};
exports.NodeDetails = NodeDetails;
