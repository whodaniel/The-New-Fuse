"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPUManager = GPUManager;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import table_1 from '@/components/ui/table';
import websocket_1 from '../services/websocket';
function GPUManager() {
    var _a = (0, react_1.useState)([]), gpus = _a[0], setGPUs = _a[1];
    (0, react_1.useEffect)(function () {
        websocket_1.webSocketService.send('getAvailableGPUs', {});
        websocket_1.webSocketService.on('gpuListUpdate', setGPUs);
        return function () {
            websocket_1.webSocketService.off('gpuListUpdate', function () { });
        };
    }, []);
    var handleRentGPU = function (gpuId) {
        websocket_1.webSocketService.send('rentGPU', { gpuId: gpuId });
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-2xl", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "GPU Manager" }) }), _jsx(card_1.CardContent, { children: _jsxs(table_1.Table, { children: [_jsx(table_1.TableHeader, { children: _jsxs(table_1.TableRow, { children: [_jsx(table_1.TableHead, { children: "GPU Model" }), _jsx(table_1.TableHead, { children: "VRAM" }), _jsx(table_1.TableHead, { children: "Status" }), _jsx(table_1.TableHead, { children: "Action" })] }) }), _jsx(table_1.TableBody, { children: gpus.map(function (gpu) { return (_jsxs(table_1.TableRow, { children: [_jsx(table_1.TableCell, { children: gpu.model }), _jsxs(table_1.TableCell, { children: [gpu.vram, " GB"] }), _jsx(table_1.TableCell, { children: gpu.status }), _jsx(table_1.TableCell, { children: _jsx(button_1.Button, { onClick: function () { return handleRentGPU(gpu.id); }, disabled: gpu.status !== 'available', children: "Rent" }) })] }, gpu.id)); }) })] }) })] }));
}
