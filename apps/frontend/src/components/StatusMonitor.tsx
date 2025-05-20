import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { Badge } from './ui/badge.js';
import { Card, CardHeader, CardContent } from './ui/card.js';
import { Progress } from './ui/progress.js';
import { Skeleton } from './ui/skeleton.js';

interface SystemStatus {
  cpu: number;
  memory: number;
  activeConnections: number;
  queueSize: number;
  status: 'healthy' | 'degraded' | 'critical';
}

interface StatusIndicatorProps {
  status: SystemStatus['status'];
}

const StatusIndicator: React.React.FC<StatusIndicatorProps> = ({ status }) => {
  const variants = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  return (
    <Badge variant="outline" className={`${variants[status]} text-white`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export function StatusMonitor() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('system_metrics', (data: SystemStatus) => {
      setSystemStatus(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>System Status</CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!systemStatus) return null;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Status</h3>
        <StatusIndicator status={systemStatus.status} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>CPU Usage</span>
              <span>{systemStatus.cpu}%</span>
            </div>
            <Progress value={systemStatus.cpu} />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>Memory Usage</span>
              <span>{systemStatus.memory}%</span>
            </div>
            <Progress value={systemStatus.memory} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold">{systemStatus.activeConnections}</div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
            
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold">{systemStatus.queueSize}</div>
              <div className="text-sm text-gray-600">Queue Size</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}