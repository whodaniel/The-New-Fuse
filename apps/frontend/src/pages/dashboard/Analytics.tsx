import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Loader } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface AnalyticsData {
  overview: {
    totalAgents: number;
    activeAgents: number;
    totalInteractions: number;
    successRate: number;
    averageResponseTime: number;
    totalWorkflows: number;
  };
  performance: {
    timeRange: string;
    dataPoints: Array<{
      timestamp: string;
      requests: number;
      responses: number;
      errors: number;
      avgResponseTime: number;
    }>;
  };
  agentMetrics: Array<{
    agentId: string;
    agentName: string;
    totalTasks: number;
    successRate: number;
    avgResponseTime: number;
    lastActive: string;
  }>;
  qualityTrends: Array<{
    date: string;
    qualityScore: number;
    userSatisfaction: number;
    errorRate: number;
  }>;
  providerPerformance: Array<{
    provider: string;
    totalRequests: number;
    successRate: number;
    avgLatency: number;
    costPerRequest: number;
  }>;
  costAnalysis: {
    totalCost: number;
    costByProvider: Array<{
      provider: string;
      cost: number;
      percentage: number;
    }>;
    dailyCosts: Array<{
      date: string;
      cost: number;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch from multiple endpoints
      await Promise.all([
        fetch(`/api/analytics/default/overview?timeframe=${timeRange}`),
        fetch(`/api/analytics/default/performance?timeframe=${timeRange}`),
        fetch(`/api/analytics/default/providers/performance?timeframe=${timeRange}`),
        fetch(`/api/analytics/default/quality-trends?timeframe=${timeRange}`)
      ]);

      // Mock data for now - replace with actual API responses
      const mockData: AnalyticsData = {
        overview: {
          totalAgents: 24,
          activeAgents: 18,
          totalInteractions: 15420,
          successRate: 98.5,
          averageResponseTime: 245,
          totalWorkflows: 156
        },
        performance: {
          timeRange: '7d',
          dataPoints: Array.from({ length: 7 }, (_, i) => ({
            timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            requests: Math.floor(Math.random() * 1000) + 500,
            responses: Math.floor(Math.random() * 900) + 450,
            errors: Math.floor(Math.random() * 50) + 5,
            avgResponseTime: Math.floor(Math.random() * 200) + 100
          }))
        },
        agentMetrics: [
          {
            agentId: 'agent-1',
            agentName: 'Data Analyzer',
            totalTasks: 342,
            successRate: 99.2,
            avgResponseTime: 156,
            lastActive: '2 minutes ago'
          },
          {
            agentId: 'agent-2',
            agentName: 'Report Generator',
            totalTasks: 289,
            successRate: 97.8,
            avgResponseTime: 203,
            lastActive: '5 minutes ago'
          },
          {
            agentId: 'agent-3',
            agentName: 'Content Creator',
            totalTasks: 198,
            successRate: 98.5,
            avgResponseTime: 189,
            lastActive: '12 minutes ago'
          }
        ],
        qualityTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          qualityScore: Math.floor(Math.random() * 10) + 90,
          userSatisfaction: Math.floor(Math.random() * 10) + 85,
          errorRate: Math.floor(Math.random() * 5) + 1
        })),
        providerPerformance: [
          {
            provider: 'OpenAI',
            totalRequests: 5420,
            successRate: 99.1,
            avgLatency: 145,
            costPerRequest: 0.002
          },
          {
            provider: 'Anthropic',
            totalRequests: 3892,
            successRate: 98.7,
            avgLatency: 203,
            costPerRequest: 0.003
          },
          {
            provider: 'Google',
            totalRequests: 2108,
            successRate: 97.9,
            avgLatency: 189,
            costPerRequest: 0.0015
          }
        ],
        costAnalysis: {
          totalCost: 2847.50,
          costByProvider: [
            { provider: 'OpenAI', cost: 1247.50, percentage: 43.8 },
            { provider: 'Anthropic', cost: 892.30, percentage: 31.3 },
            { provider: 'Google', cost: 707.70, percentage: 24.9 }
          ],
          dailyCosts: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            cost: Math.floor(Math.random() * 100) + 50
          }))
        }
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/default/export?timeframe=${timeRange}&format=json`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}-${new Date().toISOString()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Analytics data exported successfully"
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to export analytics data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics & Performance</h2>
          <p className="text-muted-foreground">Monitor your system performance and usage metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalAgents}</div>
                <p className="text-xs text-muted-foreground">
                  {data.overview.activeAgents} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalInteractions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Avg response: {data.overview.averageResponseTime}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Across all agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalWorkflows}</div>
                <p className="text-xs text-muted-foreground">
                  Executed successfully
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.performance.dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Requests" />
                  <Line type="monotone" dataKey="responses" stroke="#82ca9d" name="Responses" />
                  <Line type="monotone" dataKey="errors" stroke="#ff7300" name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Agent Name</th>
                      <th className="text-left p-2">Total Tasks</th>
                      <th className="text-left p-2">Success Rate</th>
                      <th className="text-left p-2">Avg Response Time</th>
                      <th className="text-left p-2">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agentMetrics.map((agent) => (
                      <tr key={agent.agentId} className="border-b">
                        <td className="p-2">{agent.agentName}</td>
                        <td className="p-2">{agent.totalTasks}</td>
                        <td className="p-2">{agent.successRate}%</td>
                        <td className="p-2">{agent.avgResponseTime}ms</td>
                        <td className="p-2">{agent.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.qualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="qualityScore" stackId="1" stroke="#8884d8" fill="#8884d8" name="Quality Score" />
                    <Area type="monotone" dataKey="userSatisfaction" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="User Satisfaction" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.qualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="errorRate" fill="#ff7300" name="Error Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.costAnalysis.costByProvider}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ provider, percentage }) => `${provider} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cost"
                    >
                      {data.costAnalysis.costByProvider.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.costAnalysis.dailyCosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cost" fill="#8884d8" name="Daily Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${data.costAnalysis.totalCost.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total cost for selected period</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;