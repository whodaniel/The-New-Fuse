import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var DebugPage = function () {
    // Get system and environment information
    var debugInfo = {
        browser: navigator.userAgent,
        viewport: "".concat(window.innerWidth, "x").concat(window.innerHeight),
        url: window.location.href,
        timestamp: new Date().toISOString(),
        buildId: import.meta.env.VITE_BUILD_ID || 'development',
        version: import.meta.env.VITE_VERSION || '0.1.0',
    };
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Debug Information" }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6 mb-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "System Information" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: Object.entries(debugInfo).map(function (_a) {
                            var key = _a[0], value = _a[1];
                            return (_jsxs("div", { className: "border-b pb-2", children: [_jsxs("span", { className: "font-medium text-gray-700", children: [key, ": "] }), _jsx("span", { className: "text-gray-600", children: value })] }, key));
                        }) })] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6 mb-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Local Storage" }), _jsx("div", { className: "overflow-auto max-h-60", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Key" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Value" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: Object.keys(localStorage).map(function (key) { return (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children: key }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: localStorage.getItem(key) })] }, key)); }) })] }) })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: function () { return window.history.back(); }, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", children: "Go Back" }) })] }));
};
export default DebugPage;
