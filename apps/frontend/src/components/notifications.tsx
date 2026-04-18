// @ts-nocheck
'use client';
import { default as toast_1, default as use_toast_1 } from '@/components/ui';
import react_1 from 'react';
import websocket_1 from '../services/websocket';
export function Notifications(): any {
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
      websocket_1.webSocketService.off('notification', () => {});
    };
  }, [toast]);
  return (
    <toast_1.ToastProvider>
      <toast_1.ToastViewport />
    </toast_1.ToastProvider>
  );
}
