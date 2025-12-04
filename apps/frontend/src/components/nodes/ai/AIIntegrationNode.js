import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from 'reactflow';
import { useAIIntegration } from '@/hooks/useAIIntegration';
export var AIIntegrationNode = function (_a) {
    var data = _a.data;
    var _b = useAIIntegration(), connect = _b.connect, status = _b.status, error = _b.error;
    return (_jsxs("div", { className: "ai-node", children: [_jsx(Handle, { type: "target", position: Position.Top }), _jsxs("div", { className: "node-content", children: [_jsx("h3", { children: data.label }), _jsx("div", { className: "status-indicator", children: status === 'connected' ? '✓' : '⚠' })] }), _jsx(Handle, { type: "source", position: Position.Bottom })] }));
};
