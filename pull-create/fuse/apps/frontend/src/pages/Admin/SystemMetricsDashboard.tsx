// @ts-nocheck
import {
  Activity,
  AlertCircle,
  Cpu,
  Database,
  Download,
  Globe,
  HardDrive,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeConnections: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  errorRate: number;
}

export default function SystemMetricsDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    activeConnections: 0,
    requestsPerSecond: 0,
    avgResponseTime: 0,
    errorRate: 0,
  });
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  useEffect(() => {
    loadMetrics();
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/system/metrics', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API response to match UI interface
      const newMetrics: SystemMetrics = {
        cpu: data.cpu?.usagePercent || 0,
        memory: data.memory?.usagePercent || 0,
        disk: data.disk?.usagePercent || 0,
        network: (data.network?.totalTraffic || 0) / (1024 * 1024 * 1024), // Convert to GB
        activeConnections: data.database?.activeConnections || 0,
        requestsPerSecond: Math.floor((data.api?.requestsPerMinute || 0) / 60),
        avgResponseTime: data.api?.avgResponseTime || 0,
        errorRate: data.api?.errorRate || 0,
      };

      setMetrics(newMetrics);

      // TODO: Fetch historical data from backend when available
      // For now, create a simple history array with current values
      const now = new Date();
      const historical = Array.from({ length: 24 }, (_, i) => ({
        time: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        cpu: newMetrics.cpu,
        memory: newMetrics.memory,
        disk: newMetrics.disk,
        requests: 0,
        responseTime: 0,
        errors: 0,
      }));

      setHistoricalData(historical);
      setLoading(false);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setLoading(false);
    }
  };

  const radarData = [
    { metric: 'CPU', value: metrics.cpu },
    { metric: 'Memory', value: metrics.memory },
    { metric: 'Disk', value: metrics.disk },
    { metric: 'Network', value: metrics.network * 20 },
    { metric: 'Response', value: 100 - metrics.avgResponseTime / 2 },
  ];

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUsageBg = (usage: number) => {
    if (usage < 50) return 'bg-green-500';
    if (usage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const MetricCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    trendValue,
    color,
  }: {
    title: string;
    value: number;
    unit: string;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10`} style={{ backgroundColor: color + '20' }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        {trend && (
          <div
            className={`flex items-center text-sm ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mb-2">
        <div className={`text-3xl font-bold ${getUsageColor(value)}`}>
          {value.toFixed(1)}
          <span className="text-sm text-gray-500 ml-1">{unit}</span>
        </div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getUsageBg(value)}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Activity className="h-8 w-8 mr-3 text-blue-600" />
              System Metrics Dashboard
            </h1>
            <p className="text-gray-600">Real-time performance monitoring and analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span>Auto-refresh (5s)</span>
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
            <button
              onClick={loadMetrics}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu}
          unit="%"
          icon={Cpu}
          trend={metrics.cpu > 70 ? 'up' : 'down'}
          trendValue="5.2%"
          color="#3b82f6"
        />
        <MetricCard
          title="Memory Usage"
          value={metrics.memory}
          unit="%"
          icon={Server}
          trend="up"
          trendValue="2.1%"
          color="#10b981"
        />
        <MetricCard
          title="Disk Usage"
          value={metrics.disk}
          unit="%"
          icon={HardDrive}
          trend="down"
          trendValue="0.3%"
          color="#f59e0b"
        />
        <MetricCard
          title="Network Traffic"
          value={metrics.network}
          unit="GB/s"
          icon={Globe}
          trend="up"
          trendValue="12%"
          color="#8b5cf6"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{metrics.requestsPerSecond}</div>
          <div className="text-sm text-gray-600">Requests/Second</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-6 w-6 text-blue-500" />
            <TrendingDown className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{metrics.avgResponseTime}</div>
          <div className="text-sm text-gray-600">Avg Response Time (ms)</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Database className="h-6 w-6 text-green-500" />
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{metrics.activeConnections}</div>
          <div className="text-sm text-gray-600">Active Connections</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <TrendingDown className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{metrics.errorRate.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Error Rate (%)</div>
        </div>
      </div>

      {/* Performance Charts - Historical Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center min-h-[300px] opacity-75">
          <Activity className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Resource Utilization History</h3>
          <p className="text-gray-500 text-center">
            Historical metrics retention is not currently enabled.
          </p>
          <p className="text-sm text-gray-400 mt-1">Real-time monitoring is active.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center min-h-[300px] opacity-75">
          <Zap className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Volume History</h3>
          <p className="text-gray-500 text-center">Traffic history data is not available.</p>
          <p className="text-sm text-gray-400 mt-1">Real-time stats are shown above.</p>
        </div>
      </div>

      {/* Error Rate & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center min-h-[300px] opacity-75">
          <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Rate Trend</h3>
          <p className="text-gray-500 text-center">Historical error tracking is not available.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Health Radar (Real-time)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Health"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-600">Operating System</div>
            <div className="text-lg font-semibold text-gray-900">Linux Ubuntu 22.04</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Kernel Version</div>
            <div className="text-lg font-semibold text-gray-900">5.15.0-91-generic</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Memory</div>
            <div className="text-lg font-semibold text-gray-900">64 GB</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Disk Space</div>
            <div className="text-lg font-semibold text-gray-900">1 TB SSD</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">CPU Cores</div>
            <div className="text-lg font-semibold text-gray-900">16 cores (32 threads)</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Architecture</div>
            <div className="text-lg font-semibold text-gray-900">x86_64</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Uptime</div>
            <div className="text-lg font-semibold text-gray-900">45 days, 12 hours</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Load Average</div>
            <div className="text-lg font-semibold text-gray-900">2.14, 1.98, 1.82</div>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="mt-6 flex justify-end">
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm">
          <Download className="h-4 w-4 mr-2" />
          Export Metrics Data
        </button>
      </div>
    </div>
  );
}
