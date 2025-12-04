import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { webSocketService } from '@/services/websocket';
export default function AdminPanel() {
    useEffect(function () {
        var handleStatusUpdate = function (data) {
        };
        var handleError = function (error) {
            console.error('WebSocket error:', error.message);
        };
        try {
            webSocketService.send('getSystemStatus', {});
            webSocketService.on('statusUpdate', handleStatusUpdate);
            webSocketService.on('error', handleError);
            return function () {
                webSocketService.off('statusUpdate', handleStatusUpdate);
                webSocketService.off('error', handleError);
            };
        }
        catch (err) {
            console.error('Failed to connect to websocket:', err);
        }
    }, []);
    return (_jsxs(Card, { className: "w-full max-w-3xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Admin Panel" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "System Status" }), _jsx("div", { className: "grid grid-cols-2 gap-4" })] }) })] }));
}
