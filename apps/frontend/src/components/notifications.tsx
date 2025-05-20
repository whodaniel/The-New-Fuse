
'use client';
export {}
exports.Notifications = Notifications;
import react_1 from 'react';
import toast_1 from '@/components/ui/toast';
import use_toast_1 from '@/components/ui/use-toast';
import websocket_1 from '../services/websocket.js';
function Notifications(): any {
    const { toast } = (0, use_toast_1.useToast)();
    (0, react_1.useEffect)(() => {
        websocket_1.webSocketService.on('notification', (data) => {
            toast({
                title: data.title,
                description: data.description,
                variant: data.variant || 'default',
            });
        });
        return () => {
            websocket_1.webSocketService.off('notification', () => { });
        };
    }, [toast]);
    return (<toast_1.ToastProvider>
      <toast_1.ToastViewport />
    </toast_1.ToastProvider>);
}
export {};
//# sourceMappingURL=notifications.js.map