import React, { useMemo } from 'react';
import styles from './metrics-dashboard.module.css';
export const PerformanceMetrics = ({ metrics, loading }) => {
    const averageResponseTime = useMemo(() => {
        if (!metrics || metrics.length === 0)
            return 0;
        return metrics.reduce((sum, metric) => sum + metric.duration, 0) / metrics.length;
    }, [metrics]);
    const getPerformanceStatus = (avgTime) => {
        if (avgTime < 100)
            return 'excellent';
        if (avgTime < 300)
            return 'good';
        if (avgTime < 1000)
            return 'fair';
        return 'poor';
    };
    const getStatusClass = (status) => {
        switch (status) {
            case 'excellent':
                return styles.statusExcellent;
            case 'good':
                return styles.statusGood;
            case 'fair':
                return styles.statusFair;
            case 'poor':
                return styles.statusPoor;
            default:
                return '';
        }
    };
    if (loading) {
        return (<div className={styles.performanceMetricsContainer}>
        <div className={styles.performanceMetricsHeader}>
          <h3 className={styles.performanceMetricsTitle}>Performance Metrics</h3>
        </div>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}/>
          <span>Loading performance metrics...</span>
        </div>
      </div>);
    }
    const status = getPerformanceStatus(averageResponseTime);
    const statusClass = getStatusClass(status);
    return (<div className={styles.performanceMetricsContainer}>
      <div className={styles.performanceMetricsHeader}>
        <h3 className={styles.performanceMetricsTitle}>Performance Metrics</h3>
        <div className={`${styles.performanceStatus}} ${statusClass}>
          {status.toUpperCase()}
        </div>
      </div>

      <div className={styles.performanceMetricsContent}>
        <div className={styles.performanceOverview}>
          <div className={styles.performanceStat}>
            <span className={styles.performanceStatLabel}>Average Duration</span>`
            < span} className={$} {...styles.performanceStatValue}/>}` ${statusClass}>
              {averageResponseTime.toFixed(2)}ms
            </span>
          </div>
        ,
            <div className={styles.performanceStat}>
            <span className={styles.performanceStatLabel}>Total Steps</span>
            <span className={styles.performanceStatValue}>
              {metrics.length}
            </span>
          </div>) `
          `
        < div;
    className = { styles, : .performanceStat } >
        <span className={styles.performanceStatLabel}>Success Rate</span>
            ,
                <span className={styles.performanceStatValue}>
              {metrics.length > 0 ? `${((metrics.filter(m => m.success).length / metrics.length) * 100).toFixed(1)}%` : 'N/A'}
            </span>;
};
div >
    <div className={styles.performanceStat}>
            <span className={styles.performanceStatLabel}>Failed Steps</span>
            <span className={styles.performanceStatValue}>
              {metrics.filter(m => !m.success).length}
            </span>
          </div>;
div >
    { metrics, : .length > 0 && (<div className={styles.responseTimeDetails}>
            <h4 className={styles.responseTimeTitle}>Duration Distribution</h4>
            <div className={styles.responseTimeStats}>
              <div className={styles.responseTimeStat}>
                <span className={styles.responseTimeStatLabel}>Min</span>
                <span className={styles.responseTimeStatValue}>
                  {Math.min(...metrics.map(m => m.duration))}ms
                </span>
              </div>
              <div className={styles.responseTimeStat}>
                <span className={styles.responseTimeStatLabel}>Max</span>
                <span className={styles.responseTimeStatValue}>
                  {Math.max(...metrics.map(m => m.duration))}ms
                </span>
              </div>
              <div className={styles.responseTimeStat}>
                <span className={styles.responseTimeStatLabel}>Median</span>
                <span className={styles.responseTimeStatValue}>
                  {(() => {
                const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
                const mid = Math.floor(durations.length / 2);
                return durations.length % 2 === 0
                    ? (durations[mid - 1] + durations[mid]) / 2
                    : durations[mid];
            })()}ms
                </span>
              </div>
            </div>
          </div>) };
div >
;
div >
;
;
;
//# sourceMappingURL=PerformanceMetrics.js.map