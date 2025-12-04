import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from 'reactflow';
var CustomNode = memo(function (_a) {
    var data = _a.data;
    return (_jsxs("div", { className: "custom-node", children: [_jsx(Handle, { type: "target", position: Position.Top }), _jsx("div", { className: "custom-node-header", children: data.type }), _jsx("div", { className: "custom-node-label", children: data.label }), data.parameters && (_jsx("div", { className: "custom-node-params", children: Object.entries(data.parameters).map(function (_a) {
                    var key = _a[0], value = _a[1];
                    return (_jsxs("div", { className: "param-item", children: [_jsxs("span", { className: "param-key", children: [key, ":"] }), _jsx("span", { className: "param-value", children: String(value) })] }, key));
                }) })), _jsx(Handle, { type: "source", position: Position.Bottom })] }));
});
CustomNode.displayName = 'CustomNode';
export default CustomNode;
