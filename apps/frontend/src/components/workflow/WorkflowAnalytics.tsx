import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

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

export const WorkflowAnalytics: React.React.FC<WorkflowAnalyticsProps> = ({ workflowId }) => {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, this would fetch metrics from an API
        // For now, we'll just simulate a delay and return mock data
        await new Promise(resolv(e: any) => setTimeout(resolve, 1500));
        
        // Mock data
        const mockMetrics: WorkflowMetrics = {
          executionCount: 42,
          averageExecutionTime: 1250, // ms
          successRate: 0.95, // 95%
          lastExecutionTime: Date.now() - 3600000, // 1 hour ago
          nodeMetrics: [
            {
              nodeId: 'node-1',
              nodeName: 'Input',
              nodeType: 'input',
              executionCount: 42,
              averageExecutionTime: 50,
              successRate: 1.0,
              lastExecutionTime: Date.now() - 3600000
            },
            {
              nodeId: 'node-2',
              nodeName: 'Agent',
              nodeType: 'agent',
              executionCount: 42,
              averageExecutionTime: 850,
              successRate: 0.95,
              lastExecutionTime: Date.now() - 3600000
            },
            {
              nodeId: 'node-3',
              nodeName: 'Transform',
              nodeType: 'transform',
              executionCount: 40,
              averageExecutionTime: 120,
              successRate: 0.98,
              lastExecutionTime: Date.now() - 3600000
            },
            {
              nodeId: 'node-4',
              nodeName: 'A2A',
              nodeType: 'a2a',
              executionCount: 38,
              averageExecutionTime: 950,
              successRate: 0.92,
              lastExecutionTime: Date.now() - 3600000
            },
            {
              nodeId: 'node-5',
              nodeName: 'Output',
              nodeType: 'output',
              executionCount: 35,
              averageExecutionTime: 30,
              successRate: 1.0,
              lastExecutionTime: Date.now() - 3600000
            }
          ]
        };
        
        setMetrics(mockMetrics);
      } catch (err) {
        setError('Failed to fetch metrics');
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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }
  
  if (!metrics) {
    return (
      <div className="text-center text-muted-foreground">
        No metrics available
      </div>
    );
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
      
      <Tabs defaultValue="execution-time">
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
                    <YAxis domain={[0, 1]} label={{ value: 'Success Rate', angle: -90, position: 'insideLeft' }} />
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
