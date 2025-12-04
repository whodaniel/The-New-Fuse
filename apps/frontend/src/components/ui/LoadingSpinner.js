import { jsx as _jsx } from "react/jsx-runtime";
export var LoadingSpinner = function (_a) {
    var _b = _a.size, size = _b === void 0 ? 'md' : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    return (_jsx("div", { className: "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ".concat(sizeClasses[size], " ").concat(className), role: "status", "aria-label": "Loading", children: _jsx("span", { className: "sr-only", children: "Loading..." }) }));
};
export default LoadingSpinner;
