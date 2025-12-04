import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export var Checkbox = function (_a) {
    var id = _a.id, _b = _a.checked, checked = _b === void 0 ? false : _b, onCheckedChange = _a.onCheckedChange, _c = _a.disabled, disabled = _c === void 0 ? false : _c, _d = _a.className, className = _d === void 0 ? '' : _d, children = _a.children;
    var handleChange = function (e) {
        if (onCheckedChange && !disabled) {
            onCheckedChange(e.target.checked);
        }
    };
    return (_jsxs("div", { className: "flex items-center ".concat(className), children: [_jsx("input", { id: id, type: "checkbox", checked: checked, onChange: handleChange, disabled: disabled, className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50" }), children && (_jsx("label", { htmlFor: id, className: "ml-2 text-sm text-gray-900", children: children }))] }));
};
