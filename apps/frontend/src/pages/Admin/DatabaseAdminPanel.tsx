import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Download,
  Play,
  Table,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export default function DatabaseAdminPanel() {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('users');

  const tables = [
    { name: 'users', rows: 1247, size: '12.4 MB' },
    { name: 'agents', rows: 234, size: '3.2 MB' },
    { name: 'workspaces', rows: 156, size: '2.1 MB' },
    { name: 'messages', rows: 45123, size: '234.5 MB' },
    { name: 'sessions', rows: 8542, size: '8.9 MB' },
    { name: 'audit_logs', rows: 125634, size: '89.2 MB' },
  ];

  const dbStats = [
    { metric: 'Total Size', value: '1.2 GB' },
    { metric: 'Tables', value: '24' },
    { metric: 'Connections', value: '45/100' },
    { metric: 'Cache Hit Rate', value: '94.2%' },
  ];

  const queryHistory = [
    { query: 'SELECT * FROM users WHERE role = "admin"', time: '2m ago', rows: 12, duration: 45 },
    {
      query: 'UPDATE agents SET status = "active" WHERE id = 123',
      time: '15m ago',
      rows: 1,
      duration: 23,
    },
    {
      query: 'SELECT COUNT(*) FROM messages GROUP BY workspace_id',
      time: '1h ago',
      rows: 156,
      duration: 234,
    },
  ];

  const performanceData = [
    { hour: '00:00', queries: 120, avgTime: 45 },
    { hour: '04:00', queries: 80, avgTime: 38 },
    { hour: '08:00', queries: 450, avgTime: 67 },
    { hour: '12:00', queries: 680, avgTime: 89 },
    { hour: '16:00', queries: 520, avgTime: 72 },
    { hour: '20:00', queries: 320, avgTime: 54 },
  ];

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Query execution failed');
      }

      const result: QueryResult = await response.json();
      setQueryResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
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
              <Database className="h-8 w-8 mr-3 text-blue-600" />
              Database Admin Panel
            </h1>
            <p className="text-gray-600">Query and manage database directly</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {dbStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">{stat.metric}</div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tables List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Table className="h-5 w-5 mr-2" />
            Tables
          </h3>
          <div className="space-y-2">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedTable === table.name
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{table.name}</div>
                    <div className="text-xs text-gray-500">{table.rows.toLocaleString()} rows</div>
                  </div>
                  <div className="text-xs text-gray-500">{table.size}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Editor */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Editor</h3>
          <div className="mb-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SQL query..."
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={executeQuery}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              <Play className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Executing...' : 'Execute Query'}
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Clear
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {queryResult && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    {queryResult.rowCount} rows returned
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-1" />
                    {queryResult.executionTime}ms
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">
                  <Download className="h-4 w-4 inline mr-1" />
                  Export Results
                </button>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {queryResult.columns.map((col, i) => (
                        <th
                          key={i}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queryResult.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Query History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Query History</h3>
          <div className="space-y-3">
            {queryHistory.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <div className="text-sm font-mono text-gray-900 mb-1">{item.query}</div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.time}</span>
                  <span>
                    {item.rows} rows • {item.duration}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="queries" fill="#3b82f6" name="Queries" />
              <Bar dataKey="avgTime" fill="#10b981" name="Avg Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Database Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Connection Pool</span>
              <span className="text-sm font-bold">45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Cache Hit Rate</span>
              <span className="text-sm font-bold">94.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Replication Lag</span>
              <span className="text-sm font-bold">12ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
