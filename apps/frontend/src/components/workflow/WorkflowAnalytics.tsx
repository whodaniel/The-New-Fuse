import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface WorkflowAnalyticsProps {
  workflowId: string;
}

interface NodeMetrics {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  executionCount: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecutionTime: number;
}

interface WorkflowMetrics {
  executionCount: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecutionTime: number;
  nodeMetrics: NodeMetrics[];
}

export const WorkflowAnalytics: React.FC<WorkflowAnalyticsProps> = ({ workflowId }) => {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('execution-time');

  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(
          `/api/workflows/executions?workflowId=${encodeURIComponent(workflowId)}&limit=100`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error(`Workflow analytics endpoint unavailable (${response.status})`);
        }

        const payload = await response.json();
        const executions = Array.isArray(payload?.executions)
          ? payload.executions
          : Array.isArray(payload?.data?.executions)
            ? payload.data.executions
            : [];

        const executionCount = executions.length;
        const successfulExecutions = executions.filter((execution: any) => {
          const status = String(execution?.status || '').toUpperCase();
          return status === 'COMPLETED' || status === 'SUCCESS';
        });
        const successRate = executionCount > 0 ? successfulExecutions.length / executionCount : 0;

        const durations = successfulExecutions
          .map((execution: any) => {
            const startedAt = execution?.startedAt ? new Date(execution.startedAt).getTime() : NaN;
            const completedAt = execution?.completedAt
              ? new Date(execution.completedAt).getTime()
              : NaN;
            if (
              !Number.isFinite(startedAt) ||
              !Number.isFinite(completedAt) ||
              completedAt < startedAt
            ) {
              return null;
            }
            return completedAt - startedAt;
          })
          .filter((duration: number | null): duration is number => duration !== null);

        const averageExecutionTime =
          durations.length > 0
            ? Math.round(
                durations.reduce((sum: number, duration: number) => sum + duration, 0) /
                  durations.length
              )
            : 0;

        const lastExecutionTime = executions
          .map((execution: any) => {
            const startedAt = execution?.startedAt ? new Date(execution.startedAt).getTime() : 0;
            const completedAt = execution?.completedAt
              ? new Date(execution.completedAt).getTime()
              : 0;
            return Math.max(startedAt, completedAt);
          })
          .reduce((max: number, timestamp: number) => (timestamp > max ? timestamp : max), 0);

        const liveMetrics: WorkflowMetrics = {
          executionCount,
          averageExecutionTime,
          successRate,
          lastExecutionTime,
          nodeMetrics: [],
        };

        setMetrics(liveMetrics);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch metrics');
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [workflowId]);

  // Format time
  const formatTime = (time: number) => {
    if (time < 1000) {
      return `${time}ms`;
    } else if (time < 60000) {
      return `${(time / 1000).toFixed(1)}s`;
    } else {
      return `${(time / 60000).toFixed(1)}m`;
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">
        {error}
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center text-muted-foreground">No metrics available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
            <CardDescription>Total workflow executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.executionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Execution Time</CardTitle>
            <CardDescription>Average workflow execution time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.averageExecutionTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CardDescription>Percentage of successful executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.successRate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Execution</CardTitle>
            <CardDescription>Time of last execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{formatDate(metrics.lastExecutionTime)}</div>
          </CardContent>
        </Card>
      </div>

      {metrics.nodeMetrics.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Per-node metrics are not currently available from the backend. Showing workflow-level
          metrics only.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="execution-time">Execution Time</TabsTrigger>
          <TabsTrigger value="success-rate">Success Rate</TabsTrigger>
          <TabsTrigger value="execution-count">Execution Count</TabsTrigger>
        </TabsList>

        <TabsContent value="execution-time">
          <Card>
            <CardHeader>
              <CardTitle>Node Execution Time</CardTitle>
              <CardDescription>Average execution time per node</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.nodeMetrics}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nodeName" />
                    <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => formatTime(value as number)} />
                    <Bar dataKey="averageExecutionTime" fill="#8884d8" name="Execution Time" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success-rate">
          <Card>
            <CardHeader>
              <CardTitle>Node Success Rate</CardTitle>
              <CardDescription>Success rate per node</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.nodeMetrics}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nodeName" />
                    <YAxis
                      domain={[0, 1]}
                      label={{ value: 'Success Rate', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => formatPercentage(value as number)} />
                    <Bar dataKey="successRate" fill="#82ca9d" name="Success Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution-count">
          <Card>
            <CardHeader>
              <CardTitle>Node Execution Count</CardTitle>
              <CardDescription>Number of executions per node</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.nodeMetrics}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nodeName" />
                    <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="executionCount" fill="#ffc658" name="Execution Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowAnalytics;
