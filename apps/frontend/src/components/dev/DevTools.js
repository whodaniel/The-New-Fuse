import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '@/store';
import { PerformanceMonitor } from './PerformanceMonitor';
export var DevTools = function () {
    var isDevelopment = useStore(function (state) { return state.system; }).isDevelopment;
    if (!isDevelopment)
        return null;
    return (_jsxs("div", { className: "dev-tools-panel fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg", children: [_jsx(PerformanceMonitor, {}), _jsxs("div", { className: "dev-tools-controls space-y-2", children: [_jsx("h3", { className: "font-semibold", children: "Development Tools" }), _jsx("button", { className: "px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90", onClick: function () { }, children: "Log Store State" })] })] }));
};
