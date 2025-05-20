import React from 'react';
import { Alert } from '@/shared/ui/core/Alert';
import { Progress } from '@/shared/ui/core/Progress';
import { MetricCard } from './MetricCard.js';
export function PerformanceDashboard({ className }) {
    const [metrics, setMetrics] = React.useState(null);
    const [connected, setConnected] = React.useState(false);
    const [error, setError] = React.useState(null);
    const ws = React.useRef(null);
    const [history, setHistory] = React.useState({
        queue: [],
        latency: [],
        memory: [],
        cpu: [],
    });
    React.useEffect(() => {
        ws.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080');
        ws.current.onopen = () => {
            setConnected(true);
            setError(null);
        };
        ws.current.onclose = () => {
            setConnected(false);
            setError('WebSocket connection closed');
        };
        ws.current.onerror = () => {
            setError('WebSocket connection error');
        };
        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMetrics(data);
                const timestamp = Date.now();
                setHistory((prev: any) => ({
                    queue: [...prev.queue.slice(-19), { timestamp, value: data.avg_queue_length }],
                    latency: [...prev.latency.slice(-19), { timestamp, value: data.avg_message_latency_ms }],
                    memory: [...prev.memory.slice(-19), { timestamp, value: data.avg_memory_usage_mb }],
                    cpu: [...prev.cpu.slice(-19), { timestamp, value: data.avg_cpu_usage_percent }],
                }));
            }
            catch (err) {
                setError('Invalid metrics data received');
            }
        };
        return () => {
            var _a;
            (_a = ws.current) === null || _a === void 0 ? void 0 : _a.close();
        };
    }, []);
    if (!connected) {
        return (<div className="flex items-center justify-center h-64">
        <Progress className="w-8 h-8"/>
      </div>);
    }
    if (error) {
        return (<Alert variant="destructive">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{error}</Alert.Description>
      </Alert>);
    }
    if (!metrics) {
        return (<div className="flex items-center justify-center h-64">
        <Progress className="w-8 h-8"/>
      </div>);
    }
    return (<div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard title="Average Queue Length" value={metrics.avg_queue_length} unit="tasks" history={history.queue} color="#2563eb"/>
        
        <MetricCard title="Message Latency" value={metrics.avg_message_latency_ms} unit="ms" history={history.latency} color="#16a34a"/>
        
        <MetricCard title="Memory Usage" value={metrics.avg_memory_usage_mb} unit="MB" history={history.memory} color="#9333ea"/>
        
        <MetricCard title="CPU Usage" value={metrics.avg_cpu_usage_percent} unit="%" history={history.cpu} color="#dc2626"/>
      </div>

      {Object.entries(metrics.alerts).length > 0 && (<div className="mt-6 space-y-4">
          {Object.entries(metrics.alerts).map(([key, alert]) => (<Alert key={key} variant={alert.level === 'error' ? 'destructive' : 'warning'}>
              <Alert.Title className="capitalize">{alert.level}</Alert.Title>
              <Alert.Description>
                {alert.message} (Value: {alert.value})
              </Alert.Description>
            </Alert>))}
        </div>)}
    </div>);
}
//# sourceMappingURL=PerformanceDashboard.js.map