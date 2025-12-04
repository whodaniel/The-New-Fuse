"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowNode = void 0;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
import WorkflowContext_1 from '@/contexts/WorkflowContext';
import Badge_1 from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
// Temporarily using local components instead of ui-consolidated
// import { Card } from '@the-new-fuse/ui-consolidated'; // Import consolidated Card
import Button_1 from '@/components/ui/Button';
import lucide_react_1 from 'lucide-react';
import DropdownMenu_1 from '@/components/ui/DropdownMenu';
exports.WorkflowNode = (0, react_1.memo)(function (_a) {
    var id = _a.id, data = _a.data, selected = _a.selected;
    var _b = (0, WorkflowContext_1.useWorkflow)(), _c = _b.actions, removeNode = _c.removeNode, updateNode = _c.updateNode, executeNode = _c.executeNode, isReadOnly = _b.isReadOnly;
    var handleExecute = (0, react_1.useCallback)(function () {
        executeNode(id);
    }, [executeNode, id]);
    var handleRemove = (0, react_1.useCallback)(function () {
        removeNode(id);
    }, [removeNode, id]);
    var handleConfig = (0, react_1.useCallback)(function () {
    }, []);
    var getNodeStyle = function () {
        var baseStyle = {
            padding: '10px',
            borderRadius: '8px',
            minWidth: '150px',
        };
        var typeStyles = {
            agent: {
                backgroundColor: '#818cf8',
                borderColor: '#6366f1',
            },
            tool: {
                backgroundColor: '#34d399',
                borderColor: '#10b981',
            },
            condition: {
                backgroundColor: '#fbbf24',
                borderColor: '#f59e0b',
            },
        };
        var statusStyles = {
            idle: { opacity: 0.8 },
            running: { animation: 'pulse 2s infinite' },
            completed: { opacity: 1 },
            error: { borderColor: '#ef4444' },
        };
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseStyle), typeStyles[data.type]), (data.status ? statusStyles[data.status] : {})), (selected ? { boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' } : {}));
    };
    return (_jsxs(Card, { className: "relative", style: getNodeStyle(), children: [_jsx(reactflow_1.Handle, { type: "target", position: reactflow_1.Position.Top, className: "w-3 h-3 bg-blue-500" }), _jsxs("div", { className: "flex items-center justify-between p-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "font-medium text-white", children: data.label }), data.status && (_jsx(Badge_1.Badge, { variant: data.status === 'completed'
                                    ? 'success'
                                    : data.status === 'error'
                                        ? 'destructive'
                                        : 'secondary', children: data.status }))] }), _jsxs(DropdownMenu_1.DropdownMenu, { children: [_jsx(DropdownMenu_1.DropdownMenuTrigger, { asChild: true, children: _jsx(Button_1.Button, { variant: "ghost", className: "h-8 w-8 p-0", disabled: isReadOnly, children: _jsx(lucide_react_1.MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenu_1.DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenu_1.DropdownMenuLabel, { children: "Actions" }), _jsx(DropdownMenu_1.DropdownMenuSeparator, {}), _jsxs(DropdownMenu_1.DropdownMenuItem, { onClick: handleExecute, children: [_jsx(lucide_react_1.Play, { className: "mr-2 h-4 w-4" }), "Execute"] }), _jsxs(DropdownMenu_1.DropdownMenuItem, { onClick: handleConfig, children: [_jsx(lucide_react_1.Settings, { className: "mr-2 h-4 w-4" }), "Configure"] }), _jsx(DropdownMenu_1.DropdownMenuSeparator, {}), _jsxs(DropdownMenu_1.DropdownMenuItem, { onClick: handleRemove, className: "text-red-600", children: [_jsx(lucide_react_1.Trash2, { className: "mr-2 h-4 w-4" }), "Remove"] })] })] })] }), _jsx(reactflow_1.Handle, { type: "source", position: reactflow_1.Position.Bottom, className: "w-3 h-3 bg-blue-500" })] }));
});
