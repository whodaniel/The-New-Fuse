"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveTaskAllocator = PredictiveTaskAllocator;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import table_1 from '@/components/ui/table';
import websocket_1 from '../services/websocket';
function PredictiveTaskAllocator() {
    var _c = (0, react_1.useState)([]), tasks = _c[0], setTasks = _c[1];
    var _d = (0, react_1.useState)([]), agents = _d[0], setAgents = _d[1];
    var _e = (0, react_1.useState)([]), allocations = _e[0], setAllocations = _e[1];
    (0, react_1.useEffect)(function () {
        websocket_1.webSocketService.on('tasksUpdate', setTasks);
        websocket_1.webSocketService.on('agentsUpdate', setAgents);
        websocket_1.webSocketService.on('allocationsUpdate', setAllocations);
        return function () {
            websocket_1.webSocketService.off('tasksUpdate', setTasks);
            websocket_1.webSocketService.off('agentsUpdate', setAgents);
            websocket_1.webSocketService.off('allocationsUpdate', setAllocations);
        };
    }, []);
    var handleAllocate = function () {
        websocket_1.webSocketService.send('allocateTasks', {});
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-4xl", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Predictive Task Allocator" }) }), _jsxs(card_1.CardContent, { children: [_jsxs(table_1.Table, { children: [_jsx(table_1.TableHeader, { children: _jsxs(table_1.TableRow, { children: [_jsx(table_1.TableHead, { children: "Task" }), _jsx(table_1.TableHead, { children: "Predicted Agent" }), _jsx(table_1.TableHead, { children: "Confidence" })] }) }), _jsx(table_1.TableBody, { children: allocations.map(function (allocation, index) {
                                    var _a, _b;
                                    return (_jsxs(table_1.TableRow, { children: [_jsx(table_1.TableCell, { children: (_a = tasks.find(function (t) { return t.id === allocation.taskId; })) === null || _a === void 0 ? void 0 : _a.name }), _jsx(table_1.TableCell, { children: (_b = agents.find(function (a) { return a.id === allocation.agentId; })) === null || _b === void 0 ? void 0 : _b.name }), _jsx(table_1.TableCell, { children: "".concat((allocation.confidence * 100).toFixed(2), "%") })] }, index));
                                }) })] }), _jsx(button_1.Button, { onClick: handleAllocate, className: "mt-4 w-full", children: "Allocate Tasks" })] })] }));
}
