import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/design-system';
import { SystemHealth, SystemHealthService } from '@/services/SystemHealthService';
import { Activity, RefreshCw, Server } from 'lucide-react';
import { useEffect, useState } from 'react';

const SystemMonitoring = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await SystemHealthService.getSystemHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
      setHealth(null);
      setLoadError('System health telemetry endpoint is unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            System Monitoring
          </h1>
          <p className="text-muted-foreground">Real-time system performance and service status</p>
        </div>
        <Button variant="outline" onClick={loadHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      {loadError && (
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">{loadError}. Retry after backend recovery.</p>
        </Card>
      )}
      {!health && !loading ? (
        <Card className="p-4 text-sm text-muted-foreground">No live system metrics available.</Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">CPU Usage</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-semibold text-gray-900">{health?.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${health?.cpuUsage}%` }}
                ></div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Memory Usage</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-semibold text-gray-900">{health?.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${health?.memoryUsage}%` }}
                ></div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Disk Usage</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-semibold text-gray-900">{health?.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${health?.diskUsage}%` }}
                ></div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Uptime</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-semibold text-gray-900">
                  {health ? Math.floor(health.uptime / 3600) : 0}h
                </span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {health ? Math.floor((health.uptime % 3600) / 60) : 0}m
                </span>
              </div>
            </Card>
          </div>

          {/* Service Status */}
          <Card className="overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-200 bg-transparent">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Services Status</h3>
            </div>
            <ul className="divide-y divide-border/50">
              {health?.services.map((service, index) => (
                <li key={index} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-muted-foreground">Latency: {service.latency}ms</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                ${
                                  service.status === 'healthy'
                                    ? 'bg-green-100 text-green-800'
                                    : service.status === 'degraded'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                  >
                    {service.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
};

export default SystemMonitoring;
