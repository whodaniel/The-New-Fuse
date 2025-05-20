import React, { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket.js';

export const TraeMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<{
    responseTime: number;
    memoryUsage: number;
    activeTasks: number;
    successRate: number;
  }>({
    responseTime: 0,
    memoryUsage: 0,
    activeTasks: 0,
    successRate: 1
  });

  const [recentActions, setRecentActions] = useState<any[]>([]);

  useEffect(() => {
    webSocketService.on('trae:metrics', (data) => {
      setMetrics((prev: any) => ({
        responseTime: data.duration,
        memoryUsage: data.memoryUsage,
        activeTasks: data.activeTasks,
        successRate: data.success ? 1 : prev.successRate * 0.9
      }));

      setRecentActions((prev: any) => [data, ...prev].slice(0, 10));
    });

    return () => {
      webSocketService.off('trae:metrics');
    };
  }, []);

  return (
    <div className="trae-monitor p-4">
      <h2 className="text-xl font-bold mb-4">Trae AI Monitor</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="metric-card">
          <h3>Response Time</h3>
          <p>{metrics.responseTime}ms</p>
        </div>
        <div className="metric-card">
          <h3>Memory Usage</h3>
          <p>{(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <div className="metric-card">
          <h3>Active Tasks</h3>
          <p>{metrics.activeTasks}</p>
        </div>
        <div className="metric-card">
          <h3>Success Rate</h3>
          <p>{(metrics.successRate * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-bold">Recent Actions</h3>
        <ul className="mt-2">
          {recentActions.map((action, i) => (
            <li key={i} className="text-sm">
              {action.type} - {action.context.action} 
              ({action.success ? '✓' : '✗'})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};