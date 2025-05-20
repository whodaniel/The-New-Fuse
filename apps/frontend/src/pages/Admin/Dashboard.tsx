import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/core';
import { Users, Folders, Brain, Database, Cpu, Network, } from 'lucide-react';
const Dashboard = () => {
    const metrics = [
        {
            icon: Users,
            label: 'Total Users',
            value: '1,234',
            change: '+12.3%',
            trend: 'up',
        },
        {
            icon: Folders,
            label: 'Active Workspaces',
            value: '256',
            change: '+8.1%',
            trend: 'up',
        },
        {
            icon: Brain,
            label: 'Neural Networks',
            value: '789',
            change: '+24.5%',
            trend: 'up',
        },
        {
            icon: Database,
            label: 'Storage Used',
            value: '1.2 TB',
            change: '+15.2%',
            trend: 'up',
        },
        {
            icon: Cpu,
            label: 'CPU Usage',
            value: '68%',
            change: '-3.2%',
            trend: 'down',
        },
        {
            icon: Network,
            label: 'Network Traffic',
            value: '2.3 TB',
            change: '+18.7%',
            trend: 'up',
        },
    ];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System overview and key metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (<Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground"/>
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
            <CardTitle>System Load</CardTitle>
            <CardDescription>
              CPU, Memory, and Network utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center border rounded-lg">
              Chart: System Load
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Neural Network Activity</CardTitle>
            <CardDescription>
              Active networks and processing load
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center border rounded-lg">
              Chart: Neural Network Activity
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent System Events</CardTitle>
            <CardDescription>
              Latest alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="h-[200px] flex items-center justify-center border rounded-lg">
                Event List
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default Dashboard;
//# sourceMappingURL=Dashboard.js.map