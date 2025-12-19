import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { webSocketService } from '@/services/websocket';
import { useEffect, useState } from 'react';

export default function AdminPanel() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusUpdate = (data: any) => {
      // ...
    };
    const handleError = (error: any) => {
      setError(error.message);
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
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to connect to websocket:', err);
    }
  }, []);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">System Status</h3>
          <div className="grid grid-cols-2 gap-4">{/* ... */}</div>
        </div>
      </CardContent>
    </Card>
  );
}
