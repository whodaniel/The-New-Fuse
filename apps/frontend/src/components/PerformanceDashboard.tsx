import { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getWebSocketUrl } from '../config/ports';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  history: Array<{ timestamp: number; value: number }>;
}

const MetricCard = ({ title, value, unit, history }: MetricCardProps) => {
  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-xl text-blue-500">
        {value?.toFixed(2)} {unit}
      </p>
      <div className="h-[100px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} />
            <Line type="monotone" dataKey="value" stroke="#1976d2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface MetricsData {
  avg_queue_length: number;
  avg_message_latency_ms: number;
  avg_memory_usage_mb: number;
  avg_cpu_usage_percent: number;
  uptime_seconds: number;
  total_errors: number;
  alerts?: Record<string, { level: string; message: string; value: number }>;
}

interface HistoryData {
  queue: Array<{ timestamp: number; value: number }>;
  latency: Array<{ timestamp: number; value: number }>;
  memory: Array<{ timestamp: number; value: number }>;
  cpu: Array<{ timestamp: number; value: number }>;
}

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const [history, setHistory] = useState<HistoryData>({
    queue: [],
    latency: [],
    memory: [],
    cpu: [],
  });

  useEffect(() => {
    const connect = () => {
      // Use centralized WebSocket URL with metrics path
      const baseUrl = getWebSocketUrl();
      const metricsUrl = baseUrl.replace(/\/ws$/, '') + '/ws/metrics';
      const socket = new WebSocket(metricsUrl);
      socket.onopen = () => {
        setConnected(true);
        setError(null);
      };
      socket.onclose = () => {
        setConnected(false);
        setTimeout(connect, 5000);
      };
      socket.onerror = (event) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', event);
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MetricsData;
          setMetrics(data);
          const timestamp = Date.now();
          setHistory((prev) => ({
            queue: [...prev.queue.slice(-50), { timestamp, value: data.avg_queue_length }],
            latency: [
              ...prev.latency.slice(-50),
              { timestamp, value: data.avg_message_latency_ms },
            ],
            memory: [...prev.memory.slice(-50), { timestamp, value: data.avg_memory_usage_mb }],
            cpu: [...prev.cpu.slice(-50), { timestamp, value: data.avg_cpu_usage_percent }],
          }));
        } catch (e) {
          console.error('Error parsing metrics:', e);
        }
      };
      ws.current = socket;
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  if (!connected) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
        <p className="ml-2">Connecting to metrics service...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-2 flex items-center">
        <div className="shrink-0 w-5 h-5 text-red-600 mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grow p-3">
      {Object.entries(metrics.alerts || {}).map(([key, alert]) => {
        const alertColor =
          alert.level === 'error'
            ? 'red'
            : alert.level === 'warning'
              ? 'yellow'
              : alert.level === 'success'
                ? 'green'
                : 'blue';
        return (
          <div
            key={key}
            className={`p-4 bg-${alertColor}-50 border border-${alertColor}-200 rounded-md mb-2 flex items-center`}
          >
            <div className={`shrink-0 w-5 h-5 text-${alertColor}-600 mr-2`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {alert.level === 'error' && (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                )}
                {alert.level === 'warning' && (
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.086-1.742 3.086H4.42c-1.532 0-2.492-1.75-1.742-3.086l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                )}
                {alert.level === 'success' && (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                )}
                {(alert.level === 'info' || alert.level === 'default') && (
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </div>
            <p className="text-sm">
              {alert.message} (Current value: {alert.value})
            </p>
          </div>
        );
      })}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3">
          <MetricCard
            title="Message Queue Length"
            value={metrics.avg_queue_length}
            unit="messages"
            history={history.queue}
          />
        </div>
        <div className="col-span-3">
          <MetricCard
            title="Message Latency"
            value={metrics.avg_message_latency_ms}
            unit="ms"
            history={history.latency}
          />
        </div>
        <div className="col-span-3">
          <MetricCard
            title="Memory Usage"
            value={metrics.avg_memory_usage_mb}
            unit="MB"
            history={history.memory}
          />
        </div>
        <div className="col-span-3">
          <MetricCard
            title="CPU Usage"
            value={metrics.avg_cpu_usage_percent}
            unit="%"
            history={history.cpu}
          />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-lg font-semibold mb-2">System Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <p>Uptime: {(metrics.uptime_seconds / 3600).toFixed(2)} hours</p>
          </div>
          <div className="col-span-2">
            <p className={metrics.total_errors > 0 ? 'text-red-500' : 'text-green-500'}>
              Total Errors: {metrics.total_errors}
            </p>
          </div>
          <div className="col-span-2">
            <p className={connected ? 'text-green-500' : 'text-red-500'}>
              Status: {connected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
