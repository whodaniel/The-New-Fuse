'use client';
import { jsx as _jsx } from "react/jsx-runtime";
exports.Notifications = Notifications;
import react_1 from 'react';
import toast_1 from '@/components/ui/toast';
import use_toast_1 from '@/components/ui/use-toast';
import websocket_1 from '../services/websocket';
function Notifications() {
    var toast = (0, use_toast_1.useToast)().toast;
    (0, react_1.useEffect)(function () {
        websocket_1.webSocketService.on('notification', function (data) {
            toast({
                title: data.title,
                description: data.description,
                variant: data.variant || 'default',
            });
        });
        return function () {
            websocket_1.webSocketService.off('notification', function () { });
        };
    }, [toast]);
    return (_jsx(toast_1.ToastProvider, { children: _jsx(toast_1.ToastViewport, {}) }));
}
