import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useState } from 'react';

interface PerformanceDataPoint {
  time: string;
  responseTime: number;
}

interface ResourceUsage {
  name: string;
  usage: number;
  color: string;
}

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [activeTab, setActiveTab] = useState<string>('performance');

  // Sample data for charts
  const performanceData: PerformanceDataPoint[] = [
    { time: '00:00', responseTime: 150 },
    { time: '04:00', responseTime: 230 },
    { time: '08:00', responseTime: 180 },
    { time: '12:00', responseTime: 400 },
    { time: '16:00', responseTime: 280 },
    { time: '20:00', responseTime: 250 },
  ];

  const resourceUsage: ResourceUsage[] = [
    { name: 'CPU', usage: 65, color: 'red' },
    { name: 'Memory', usage: 78, color: 'blue' },
    { name: 'GPU', usage: 45, color: 'yellow' },
    { name: 'Network', usage: 88, color: 'green' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-36 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="tasks">Task Analysis</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-100 rounded-md p-4 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Performance chart visualization</p>
                  <div className="text-sm space-y-1">
                    {performanceData.map((point, idx) => (
                      <div key={idx}>
                        {point.time}: {point.responseTime}ms
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {resourceUsage.map((resource) => (
                  <div key={resource.name} className="p-4 bg-gray-50 rounded-md text-center">
                    <div className="font-medium">{resource.name}</div>
                    <div className="text-2xl font-bold text-blue-600">{resource.usage}%</div>
                  </div>
                ))}
              </div>
              <div className="h-72 bg-gray-100 rounded-md p-4 flex items-center justify-center">
                <p className="text-gray-500">Resource usage chart visualization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Graph Tab */}
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-md p-4 flex items-center justify-center">
                <p className="text-gray-500">Knowledge graph visualization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Analysis Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Allocation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-md p-4 flex items-center justify-center">
                <p className="text-gray-500">Task allocation visualization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
