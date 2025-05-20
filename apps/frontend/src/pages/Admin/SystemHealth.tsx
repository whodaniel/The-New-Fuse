import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, } from '@/components/core';
import { Cpu, CircuitBoard, HardDrive, Network, RefreshCw, AlertTriangle, } from 'lucide-react';
const SystemHealth = () => {
    const resources = [
        {
            icon: Cpu,
            label: 'CPU Usage',
            value: '68%',
            status: 'healthy',
            details: '12/16 cores active',
        },
        {
            icon: CircuitBoard,
            label: 'Memory Usage',
            value: '75%',
            status: 'warning',
            details: '24/32 GB used',
        },
        {
            icon: HardDrive,
            label: 'Disk Space',
            value: '82%',
            status: 'warning',
            details: '820/1000 GB used',
        },
        {
            icon: Network,
            label: 'Network',
            value: '2.3 Gbps',
            status: 'healthy',
            details: '1.2 Gbps in, 1.1 Gbps out',
        },
    ];
    const services = [
        {
            name: 'API Gateway',
            status: 'operational',
            uptime: '99.99%',
            lastIncident: 'None',
        },
        {
            name: 'Neural Processing',
            status: 'operational',
            uptime: '99.95%',
            lastIncident: '2 days ago',
        },
        {
            name: 'Database Cluster',
            status: 'degraded',
            uptime: '99.80%',
            lastIncident: '1 hour ago',
        },
        {
            name: 'Storage Service',
            status: 'operational',
            uptime: '99.99%',
            lastIncident: 'None',
        },
    ];
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground mt-2">
            Monitor system resources and service status
          </p>
        </div>
        <Button>
          <RefreshCw className="mr-2 h-4 w-4"/>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resources.map(({ icon: Icon, label, value, status, details }) => (<Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${status === 'healthy'
                ? 'bg-green-500'
                : status === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'}`}/>
                <p className="text-sm text-muted-foreground">{details}</p>
              </div>
            </CardContent>
          </Card>))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Current status of system services and components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (<div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Last incident: {service.lastIncident}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">
                    Uptime: {service.uptime}
                  </div>
                  <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${service.status === 'operational'
                ? 'bg-green-50 text-green-700'
                : service.status === 'degraded'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-red-50 text-red-700'}`}>
                    {service.status === 'degraded' && (<AlertTriangle className="mr-1 h-3 w-3"/>)}
                    {service.status}
                  </div>
                </div>
              </div>))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage History</CardTitle>
            <CardDescription>
              CPU and memory utilization over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center border rounded-lg">
              Chart: Resource Usage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Traffic</CardTitle>
            <CardDescription>
              Inbound and outbound network traffic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center border rounded-lg">
              Chart: Network Traffic
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default SystemHealth;
//# sourceMappingURL=SystemHealth.js.map