import {
  Activity,
  AlertTriangle,
  Clock,
  Download,
  Globe,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  uptime: number;
}

interface StatusCodeData {
  name: string;
  value: number;
  color: string;
}

interface ChartData {
  time: string;
  requests: number;
  errors: number;
  responseTime: number;
}

export default function APIAnalyticsFull() {
  const [metrics, setMetrics] = useState<APIMetrics | null>(null);
  const [statusCodeData, setStatusCodeData] = useState<StatusCodeData[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);
  const [requestData, setRequestData] = useState<ChartData[]>([]);
  const [endpointData, setEndpointData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      // Append timeRange to query params if backend supports it
      const response = await fetch(`/api/admin/api-analytics/stats?range=${timeRange}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();

      const totalRequests = data.totalRequests || 0;
      const errorCount = data.errorCount || 0;
      const avgDuration = data.avgResponseTime || 0;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      // Status Codes
      const rawStatusCodes = data.statusCodes || [];
      const statusChartData = rawStatusCodes.map((s: any, index: number) => ({
        name: `${s.status}`,
        value: s.count,
        color: COLORS[index % COLORS.length] || '#000',
      }));

      // Methods
      const rawMethods = data.methods || [];
      const methodChartData = rawMethods.map((m: any) => ({
        name: m.method,
        value: m.count,
      }));

      // Time Series
      const rawTimeSeries = data.timeSeries || [];
      const seriesChartData = rawTimeSeries.map((t: any) => ({
        time: new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        requests: t.requests,
        errors: t.errors,
        responseTime: t.responseTime,
      }));

      // Top Endpoints
      const rawEndpoints = data.topEndpoints || [];

      setMetrics({
        totalRequests,
        successfulRequests: totalRequests - errorCount,
        failedRequests: errorCount,
        avgResponseTime: parseFloat(avgDuration.toFixed(2)),
        p95ResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: parseFloat(errorRate.toFixed(2)),
        uptime: 100,
      });

      setStatusCodeData(statusChartData);
      setMethodData(methodChartData);
      setRequestData(seriesChartData);
      setEndpointData(rawEndpoints);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Activity className="h-8 w-8 mr-3 text-blue-600" />
              API Analytics
            </h1>
            <p className="text-gray-600">
              Monitor API usage, performance, and health (Real-Time Data)
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={loadMetrics}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-8 w-8 text-blue-500" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {metrics.totalRequests.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.avgResponseTime}</div>
            <div className="text-sm text-gray-600">Avg Response Time (ms)</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.errorRate}%</div>
            <div className="text-sm text-gray-600">Error Rate</div>
            <div className="mt-2 text-xs text-red-600">
              {metrics.failedRequests.toLocaleString()} failed requests
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">Active</div>
            <div className="text-sm text-gray-600">System Status</div>
          </div>
        </div>
      )}

      {/* Request Volume Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Volume Over Time</h3>
          {requestData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={requestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Requests"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data available for this time range
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time & Errors</h3>
          {requestData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={requestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="errors"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Errors"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data available for this time range
            </div>
          )}
        </div>
      </div>

      {/* Status Codes and Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Status Codes</h3>
          {statusCodeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No status codes recorded
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Methods</h3>
          {methodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={methodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No method data available
            </div>
          )}
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h3>
        <div className="overflow-x-auto">
          {endpointData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {endpointData.map((endpoint, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {endpoint.endpoint}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {endpoint.requests.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{endpoint.avgTime.toFixed(1)}ms</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600">{endpoint.errors}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(endpoint.requests > 0
                          ? (endpoint.errors / endpoint.requests) * 100
                          : 0
                        ).toFixed(2)}
                        %
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-gray-400">
              No endpoint activity recorded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
