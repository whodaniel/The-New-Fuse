import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  lastChecked: string;
  responseTime: number;
  version: string;
  endpoint?: string;
}

export default function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchData = () => {
      setTimeout(() => {
        setMetrics([
          {
            name: 'CPU Usage',
            value: 45,
            unit: '%',
            status: 'healthy',
            threshold: { warning: 70, critical: 90 },
            trend: 'stable'
          },
          {
            name: 'Memory Usage',
            value: 68,
            unit: '%',
            status: 'warning',
            threshold: { warning: 65, critical: 85 },
            trend: 'up'
          },
          {
            name: 'Disk Usage',
            value: 34,
            unit: '%',
            status: 'healthy',
            threshold: { warning: 80, critical: 95 },
            trend: 'stable'
          },
          {
            name: 'Active Connections',
            value: 1247,
            unit: 'conn',
            status: 'healthy',
            threshold: { warning: 2000, critical: 3000 },
            trend: 'up'
          },
          {
            name: 'Response Time',
            value: 145,
            unit: 'ms',
            status: 'healthy',
            threshold: { warning: 200, critical: 500 },
            trend: 'down'
          },
          {
            name: 'Error Rate',
            value: 0.8,
            unit: '%',
            status: 'healthy',
            threshold: { warning: 2, critical: 5 },
            trend: 'stable'
          }
        ]);

        setServices([
          {
            name: 'API Gateway',
            status: 'online',
            uptime: '99.9% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 95,
            version: '2.1.0',
            endpoint: 'https://api.thenewfuse.com'
          },
          {
            name: 'Backend API',
            status: 'online',
            uptime: '99.8% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 120,
            version: '1.8.3',
            endpoint: 'https://backend.thenewfuse.com'
          },
          {
            name: 'Database (Primary)',
            status: 'online',
            uptime: '100% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 25,
            version: 'PostgreSQL 15.4'
          },
          {
            name: 'Redis Cache',
            status: 'online',
            uptime: '99.9% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 8,
            version: 'Redis 7.0.11'
          },
          {
            name: 'Vector Database',
            status: 'online',
            uptime: '99.7% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 180,
            version: 'Qdrant 1.6.0'
          },
          {
            name: 'Message Queue',
            status: 'maintenance',
            uptime: '98.5% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 45,
            version: 'RabbitMQ 3.12.0'
          },
          {
            name: 'File Storage',
            status: 'online',
            uptime: '99.9% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 200,
            version: 'MinIO 2023.10.07'
          },
          {
            name: 'Monitoring',
            status: 'online',
            uptime: '100% (7d)',
            lastChecked: new Date().toISOString(),
            responseTime: 50,
            version: 'Prometheus 2.45.0'
          }
        ]);

        setLoading(false);
        setLastRefresh(new Date());
      }, 1000);
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'warning':
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical':
      case 'offline':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('API')) return '🔌';
    if (serviceName.includes('Database')) return '🗄️';
    if (serviceName.includes('Cache')) return '⚡';
    if (serviceName.includes('Vector')) return '🔍';
    if (serviceName.includes('Queue')) return '📬';
    if (serviceName.includes('Storage')) return '💾';
    if (serviceName.includes('Monitor')) return '📊';
    return '⚙️';
  };

  const overallHealth = (() => {
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    const offlineServices = services.filter(s => s.status === 'offline').length;
    
    if (criticalCount > 0 || offlineServices > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  })();

  const refreshData = () => {
    setLoading(true);
    // Trigger data refresh
    setTimeout(() => {
      setLoading(false);
      setLastRefresh(new Date());
    }, 1000);
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💚 System Health</h1>
            <p className="text-gray-600">Monitor system performance and service status</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button onClick={refreshData} disabled={loading}>
              {loading ? '🔄' : '↻'} Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">
                {overallHealth === 'healthy' ? '✅' : overallHealth === 'warning' ? '⚠️' : '🚨'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  System Status: {overallHealth === 'healthy' ? 'Healthy' : overallHealth === 'warning' ? 'Warning' : 'Critical'}
                </h2>
                <p className="text-gray-600">
                  {services.filter(s => s.status === 'online').length}/{services.length} services online
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Average Response Time</div>
              <div className="text-2xl font-bold">
                {Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length)}ms
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <div key={metric.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{metric.name}</h3>
                  <span className="text-xl">{getTrendIcon(metric.trend)}</span>
                </div>
                <div className="flex items-end space-x-2 mb-2">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-gray-500">{metric.unit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.status === 'healthy' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (metric.value / metric.threshold.critical) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                  <span>Critical: {metric.threshold.critical}{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{getServiceIcon(service.name)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          {service.endpoint && (
                            <div className="text-xs text-gray-500">{service.endpoint}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.uptime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.responseTime}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(service.lastChecked).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="p-4 h-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">View Logs</div>
          </div>
        </Button>
        <Button variant="outline" className="p-4 h-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">🔧</div>
            <div className="font-medium">System Settings</div>
          </div>
        </Button>
        <Button variant="outline" className="p-4 h-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium">Performance</div>
          </div>
        </Button>
        <Button variant="outline" className="p-4 h-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">🚨</div>
            <div className="font-medium">Alerts</div>
          </div>
        </Button>
      </div>
    </div>
  );
}