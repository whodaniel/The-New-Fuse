import { jsx as _jsx } from "react/jsx-runtime";
export function Switch(_a) {
    var _b = _a.checked, checked = _b === void 0 ? false : _b, onCheckedChange = _a.onCheckedChange, _c = _a.disabled, disabled = _c === void 0 ? false : _c, _d = _a.className, className = _d === void 0 ? "" : _d, id = _a.id;
    var handleClick = function () {
        if (!disabled) {
            onCheckedChange === null || onCheckedChange === void 0 ? void 0 : onCheckedChange(!checked);
        }
    };
    return (_jsx("button", { id: id, type: "button", role: "switch", "aria-checked": checked, disabled: disabled, onClick: handleClick, className: "\n        relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent\n        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2\n        ".concat(checked ? 'bg-blue-600' : 'bg-gray-200', "\n        ").concat(disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', "\n        ").concat(className, "\n      "), children: _jsx("span", { className: "\n          inline-block h-4 w-4 transform rounded-full bg-white transition-transform\n          ".concat(checked ? 'translate-x-6' : 'translate-x-1', "\n        ") }) }));
}
export default Switch;
