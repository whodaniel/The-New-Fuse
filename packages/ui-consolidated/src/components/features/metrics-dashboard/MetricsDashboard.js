import React, { useState, useEffect, useCallback } from 'react';
import { useMetrics } from '../../../hooks/useMetrics';
import { StepMetrics } from './StepMetrics';
import { MemoryMetrics } from './MemoryMetrics';
import { PerformanceMetrics } from './PerformanceMetrics';
import styles from './metrics-dashboard.module.css';
export const MetricsDashboard = () => {
    const { data: metrics, loading, error, refresh: refreshMetrics } = useMetrics();
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(null);
    // Auto-refresh functionality
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                refreshMetrics();
            }, 5000); // Refresh every 5 seconds
            setRefreshInterval(interval);
        }
        else {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                setRefreshInterval(null);
            }
        }
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [autoRefresh, refreshMetrics, refreshInterval]);
    const handleRefresh = useCallback(async () => {
        try {
            await refreshMetrics();
        }
        catch (error) {
            console.error('Failed to refresh metrics:', error);
        }
    }, [refreshMetrics]);
    const handleAutoRefreshToggle = useCallback(() => {
        setAutoRefresh(prev => !prev);
    }, []);
    if (error) {
        return (<div className={styles.metricsDashboard}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Error Loading Metrics</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryButton} onClick={handleRefresh}>
            Retry
          </button>
        </div>
      </div>);
    }
    return (<div className={styles.metricsDashboard}>
      <div className={styles.metricsDashboardHeader}>
        <div>
          <h1 className={styles.metricsDashboardTitle}>System Metrics Dashboard</h1>
          <p className={styles.metricsDashboardSubtitle}>
            Real-time monitoring of system performance and resource usage
          </p>
        </div>
        <div className={styles.metricsDashboardControls}>
          <label className={styles.autoRefreshToggle}>
            <input type="checkbox" checked={autoRefresh} onChange={handleAutoRefreshToggle}/>
            Auto-refresh (5s)
          </label>
          <button className={styles.refreshButton} onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {metrics && metrics.stepMetrics && (<StepMetrics metrics={metrics.stepMetrics} loading={loading}/>)}
        
        {metrics && metrics.memoryMetrics && (<MemoryMetrics metrics={metrics.memoryMetrics} loading={loading}/>)}
        
        {metrics && metrics.stepMetrics && (<PerformanceMetrics metrics={metrics.stepMetrics} loading={loading}/>)}
      </div>

      {(!metrics || (!metrics.stepMetrics && !metrics.memoryMetrics)) && (<div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📊</div>
          <h3 className={styles.emptyStateTitle}>No Metrics Available</h3>
          <p className={styles.emptyStateMessage}>
            No metrics data is currently available. This might be because:
          </p>
          <ul className={styles.emptyStateList}>
            <li>The system hasn't started collecting metrics yet</li>
            <li>Metrics collection is disabled</li>
            <li>There was an error loading the metrics</li>
          </ul>
          <button className={styles.refreshButton} onClick={handleRefresh}>
            Try Again
          </button>
        </div>)}
    </div>);
};
export default MetricsDashboard;
//# sourceMappingURL=MetricsDashboard.js.map