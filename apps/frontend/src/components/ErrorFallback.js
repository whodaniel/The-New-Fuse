import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var ErrorFallback = function (_a) {
    var error = _a.error, resetErrorBoundary = _a.resetErrorBoundary;
    return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen p-4", children: [_jsx("h2", { className: "text-2xl font-bold text-red-600 mb-4", children: "Something went wrong" }), _jsx("pre", { className: "text-sm bg-gray-100 p-4 rounded mb-4 overflow-auto max-w-full", children: error.message }), _jsx("button", { onClick: resetErrorBoundary, className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600", children: "Try again" })] }));
};
export default ErrorFallback;
