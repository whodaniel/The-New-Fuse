// @ts-nocheck
import { Activity, AlertTriangle, Cpu, Gauge, RefreshCw, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWizard } from './WizardProvider';
import { useWizardWebSocket } from './WizardWebSocket';

export function WizardMonitoring() {
  const { subscribeToEvent, unsubscribeFromEvent, sendMessage } = useWizardWebSocket();
  const { state } = useWizard();
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    alertThreshold: 80,
    logRetentionDays: 7,
    metricsInterval: 5000,
  });

  useEffect(() => {
    const handleMetricsUpdate = (data: any) => {
      setMetrics(data);
      checkThresholds(data);
    };
    const handleAlert = (alert: any) => {
      setAlerts((prev: any) => [alert, ...prev]);
    };
    const handlePerformanceLog = (log: any) => {
      setLogs((prev: any) => [log, ...prev].slice(0, 1000));
    };

    subscribeToEvent('system_metrics', handleMetricsUpdate);
    subscribeToEvent('system_alert', handleAlert);
    subscribeToEvent('performance_log', handlePerformanceLog);
    sendMessage('start_monitoring', { interval: settings.metricsInterval });

    return () => {
      unsubscribeFromEvent('system_metrics', handleMetricsUpdate);
      unsubscribeFromEvent('system_alert', handleAlert);
      unsubscribeFromEvent('performance_log', handlePerformanceLog);
    };
  }, [subscribeToEvent, unsubscribeFromEvent, sendMessage, settings.metricsInterval]);

  const checkThresholds = (metrics: any) => {
    if (metrics.cpu > settings.alertThreshold) {
      createAlert('warning', `High CPU usage: ${metrics.cpu}%`);
    }
    if (metrics.memory > settings.alertThreshold) {
      createAlert('warning', `High memory usage: ${metrics.memory}%`);
    }
    if (metrics.errorRate > 5) {
      createAlert('error', `High error rate: ${metrics.errorRate}%`);
    }
  };

  const createAlert = (type: string, message: string) => {
    const alert = {
      id: `alert-${Date.now()}`,
      type,
      message,
      timestamp: Date.now(),
      resolved: false,
    };
    setAlerts((prev: any) => [alert, ...prev]);
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev: any) =>
      prev.map((alert: any) => (alert.id === alertId ? { ...alert, resolved: true } : alert))
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* CPU Usage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
          <Cpu className="w-5 h-5" />
          <h6 className="font-semibold">CPU Usage</h6>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
          <div
            className={`h-2.5 rounded-full ${
              (metrics?.cpu || 0) > 80 ? 'bg-red-600' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(metrics?.cpu || 0, 100)}%` }}
          ></div>
        </div>
        <h4 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          {metrics?.cpu?.toFixed(1) || '0.0'}%
        </h4>
      </div>

      {/* Memory Usage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
          <Gauge className="w-5 h-5" />
          <h6 className="font-semibold">Memory</h6>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
          <div
            className={`h-2.5 rounded-full ${
              (metrics?.memory || 0) > 80 ? 'bg-red-600' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(metrics?.memory || 0, 100)}%` }}
          ></div>
        </div>
        <h4 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          {metrics?.memory?.toFixed(1) || '0.0'}%
        </h4>
      </div>

      {/* Active Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
          <Activity className="w-5 h-5" />
          <h6 className="font-semibold">Active Tasks</h6>
        </div>
        <div className="flex justify-center items-center gap-2 mt-4">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Active: {metrics?.activeAgents || 0}
          </span>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Queued: {metrics?.queuedTasks || 0}
          </span>
        </div>
      </div>

      {/* Error Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
          <AlertTriangle className="w-5 h-5" />
          <h6 className="font-semibold">Error Rate</h6>
        </div>
        <h4
          className={`text-2xl font-bold text-center mt-4 ${
            (metrics?.errorRate || 0) > 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'
          }`}
        >
          {metrics?.errorRate?.toFixed(2) || '0.00'}%
        </h4>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h6 className="font-semibold text-gray-900 dark:text-white">System Alerts</h6>
        <div className="relative">
          <div className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {alerts.filter((a) => !a.resolved).length}
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No alerts</div>
        ) : (
          alerts.slice(0, 20).map((alert) => (
            <div key={alert.id} className="p-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle
                  className={`w-5 h-5 ${
                    alert.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium text-gray-900 dark:text-white ${
                    alert.resolved ? 'line-through text-gray-400 dark:text-gray-500' : ''
                  }`}
                >
                  {alert.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
              {!alert.resolved && (
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors"
                >
                  Resolve
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPerformanceLogs = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h6 className="font-semibold text-gray-900 dark:text-white">Performance Logs</h6>
        <button
          onClick={() => sendMessage('refresh_logs', {})}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No logs</div>
        ) : (
          logs.slice(0, 20).map((log, index) => (
            <div key={index} className="p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                {log.operation}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                <span>•</span>
                <span>Duration: {formatDuration(log.duration)}</span>
                <span>•</span>
                <span>Status: {log.status}</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h5 className="text-xl font-bold text-gray-900 dark:text-white">System Monitoring</h5>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Monitoring Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div>{renderMetrics()}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>{renderAlerts()}</div>
        <div>{renderPerformanceLogs()}</div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monitoring Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.alertThreshold}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      alertThreshold: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Log Retention (days)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.logRetentionDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      logRetentionDays: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Metrics Interval (ms)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.metricsInterval}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      metricsInterval: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowSettings(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
