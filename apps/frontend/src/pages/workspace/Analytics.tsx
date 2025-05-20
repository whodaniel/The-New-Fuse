import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/core';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Calendar, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const WorkspaceAnalytics = () => {
    const { currentWorkspace, loading, error } = useWorkspace();
    if (loading) {
        return (<div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading analytics...</div>
      </div>);
    }
    if (error) {
        return (<div className="flex items-center justify-center h-full">
        <div className="text-lg text-red-500">Error loading analytics: {error.message}</div>
      </div>);
    }
    const metrics = [
        {
            label: 'Total Projects',
            value: (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.projectCount) || 0,
            change: '+12.3%',
            trend: 'up',
        },
        {
            label: 'Active Neural Networks',
            value: (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.neuralNetworkCount) || 0,
            change: '+8.1%',
            trend: 'up',
        },
        {
            label: 'Memory Usage',
            value: '85.2 GB',
            change: '+24.5%',
            trend: 'up',
        },
        {
            label: 'API Calls',
            value: '1.2M',
            change: '-3.2%',
            trend: 'down',
        },
    ];
    const renderChart = (data, title) => (<ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="date"/>
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2}/>
      </LineChart>
    </ResponsiveContainer>);
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your workspace performance and usage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4"/>
            Last 30 days
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4"/>
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (<Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs ${metric.trend === 'up'
                ? 'text-green-500'
                : 'text-red-500'}`}>
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Neural Network Performance</CardTitle>
            <CardDescription>
              Average response time and accuracy over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderChart([], 'Neural Network Performance')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>
              Storage utilization by project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderChart([], 'Memory Usage')}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>
              API calls and response times over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderChart([], 'API Usage')}
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default WorkspaceAnalytics;
//# sourceMappingURL=Analytics.js.map