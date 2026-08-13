// @ts-nocheck
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
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
import { useWizard } from './WizardProvider';
import { useWizardWebSocket } from './WizardWebSocket';

export function GraphAnalytics() {
  const { state } = useWizard();
  const { subscribeToEvent, unsubscribeFromEvent, sendMessage } = useWizardWebSocket();
  const [metrics, setMetrics] = useState<any>(null);
  const [nodeDistribution, setNodeDistribution] = useState<any[]>([]);
  const [edgeAnalytics, setEdgeAnalytics] = useState<any[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState('nodeCount');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const handleMetricsUpdate = (data: any) => {
      setMetrics(data.metrics);
      setNodeDistribution(data.nodeDistribution);
      setEdgeAnalytics(data.edgeAnalytics);
      setTimeseriesData((prev: any) =>
        [
          ...prev,
          {
            timestamp: Date.now(),
            nodeCount: data.metrics.nodeCount,
            edgeCount: data.metrics.edgeCount,
            avgDegree: data.metrics.avgDegree,
          },
        ].slice(-100)
      );
    };

    subscribeToEvent('graph_metrics', handleMetricsUpdate);
    sendMessage('request_graph_metrics', { timeRange: selectedTimeRange });
    setLoading(false);

    return () => unsubscribeFromEvent('graph_metrics', handleMetricsUpdate);
  }, [subscribeToEvent, unsubscribeFromEvent, sendMessage, selectedTimeRange]);

  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    sendMessage('request_graph_metrics', { timeRange: range });
  };

  const renderMetricsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-transparent dark:bg-transparent rounded-md shadow p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Graph Overview</h3>
        {metrics && (
          <div className="space-y-2 text-foreground dark:text-gray-300">
            <p>
              Nodes:{' '}
              <span className="font-medium text-gray-900 dark:text-white">{metrics.nodeCount}</span>
            </p>
            <p>
              Edges:{' '}
              <span className="font-medium text-gray-900 dark:text-white">{metrics.edgeCount}</span>
            </p>
            <p>
              Density:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.density.toFixed(3)}
              </span>
            </p>
            <p>
              Average Degree:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.avgDegree.toFixed(2)}
              </span>
            </p>
            <p>
              Clustering Coefficient:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.clustering.toFixed(3)}
              </span>
            </p>
            <p>
              Connected Components:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.componentCount}
              </span>
            </p>
            <p>
              Graph Diameter:{' '}
              <span className="font-medium text-gray-900 dark:text-white">{metrics.diameter}</span>
            </p>
            <p>
              Avg Path Length:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.avgPathLength.toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="bg-transparent dark:bg-transparent rounded-md shadow p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Node Distribution
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={nodeDistribution}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {nodeDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderEdgeAnalytics = () => (
    <div className="bg-transparent dark:bg-transparent rounded-md shadow p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edge Analytics</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={edgeAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Count" />
            <Bar yAxisId="right" dataKey="weight" fill="#82ca9d" name="Avg Weight" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTimeseries = () => (
    <div className="bg-transparent dark:bg-transparent rounded-md shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Time Series Analysis
        </h3>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">
              Time Range
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">
              Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nodeCount">Node Count</option>
              <option value="edgeCount">Edge Count</option>
              <option value="avgDegree">Average Degree</option>
            </select>
          </div>
        </div>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeseriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()} />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke="#8884d8"
              dot={false}
              name={selectedMetric}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700 w-full">
          <button
            className={`flex-1 py-2 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 0
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:text-muted-foreground dark:hover:text-gray-300'
            }`}
            onClick={() => setSelectedTab(0)}
          >
            Overview
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 1
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:text-muted-foreground dark:hover:text-gray-300'
            }`}
            onClick={() => setSelectedTab(1)}
          >
            Edge Analytics
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 2
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:text-muted-foreground dark:hover:text-gray-300'
            }`}
            onClick={() => setSelectedTab(2)}
          >
            Time Series
          </button>
        </div>
      </div>

      <div>
        {selectedTab === 0 && renderMetricsOverview()}
        {selectedTab === 1 && renderEdgeAnalytics()}
        {selectedTab === 2 && renderTimeseries()}
      </div>
    </div>
  );
}
