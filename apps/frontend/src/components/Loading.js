import { jsx as _jsx } from "react/jsx-runtime";
var Loading = function (_a) {
    var _b = _a.size, size = _b === void 0 ? 'md' : _b, _c = _a.fullScreen, fullScreen = _c === void 0 ? true : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    // Size mapping
    var sizeClasses = {
        sm: 'h-8 w-8 border-2',
        md: 'h-12 w-12 border-4',
        lg: 'h-16 w-16 border-4'
    };
    // Container classes based on fullScreen prop
    var containerClasses = fullScreen
        ? 'flex items-center justify-center min-h-screen'
        : 'flex items-center justify-center';
    return (_jsx("div", { className: containerClasses, children: _jsx("div", { className: "\n          animate-spin \n          rounded-full \n          ".concat(sizeClasses[size], " \n          border-solid \n          border-[var(--theme-loader,#4f46e5)] \n          border-t-transparent \n          ").concat(className, "\n        "), "aria-label": "Loading", role: "status" }) }));
};
// Also export a FullScreenLoader for convenience
export var FullScreenLoader = function () { return _jsx(Loading, { fullScreen: true, size: "lg" }); };
export default Loading;
