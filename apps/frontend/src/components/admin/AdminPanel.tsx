import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { webSocketService } from '@/services/websocket';
export default function AdminPanel() {
    useEffect(() => {
        const handleStatusUpdate = (data: any) => {

        };
        const handleError = (error: any) => {
            console.error('WebSocket error:', error.message);
        };
        try {
            webSocketService.send('getSystemStatus', {});
            webSocketService.on('statusUpdate', handleStatusUpdate);
            webSocketService.on('error', handleError);
            return () => {
                webSocketService.off('statusUpdate', handleStatusUpdate);
                webSocketService.off('error', handleError);
            };
        }
        catch (err) {
            console.error('Failed to connect to websocket:', err);
        }
    }, []);
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">System Status</h3>
            <div className="grid grid-cols-2 gap-4">

            </div>
          </div>
        </CardContent>
      </Card>
    );
}
