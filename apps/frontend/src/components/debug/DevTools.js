import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDebug } from '@/hooks/useDebug';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ErrorBoundary } from './ErrorBoundary';
export var DevTools = function () {
    var _a = useDebug(), enabled = _a.enabled, metrics = _a.metrics, errors = _a.errors;
    return enabled ? (_jsxs("div", { className: "dev-tools", children: [_jsx(PerformanceMonitor, { metrics: metrics }), _jsxs(ErrorBoundary, { errors: errors, children: [_jsx(ErrorLog, {}), _jsx(StateInspector, {}), _jsx(NetworkMonitor, {})] })] })) : null;
};
