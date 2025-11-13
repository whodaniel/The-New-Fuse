import React, { useMemo } from 'react';
import styles from './metrics-dashboard.module.css';
export const MemoryMetrics = ({ metrics, loading }) => {
    const memoryHitRatePercentage = useMemo(() => {
        return metrics.hitRate * 100;
    }, [metrics.hitRate]);
    const getMemoryStatus = (hitRate) => {
        if (hitRate > 80)
            return 'good';
        if (hitRate > 60)
            return 'warning';
        return 'critical';
    };
    const getStatusClass = (status) => {
        switch (status) {
            case 'good':
                return styles.statusGood;
            case 'warning':
                return styles.statusWarning;
            case 'critical':
                return styles.statusCritical;
            default:
                return '';
        }
    };
    if (loading) {
        return (<div className={styles.memoryMetricsContainer}>
        <div className={styles.memoryMetricsHeader}>
          <h3 className={styles.memoryMetricsTitle}>Memory Metrics</h3>
        </div>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}/>
          <span>Loading memory metrics...</span>
        </div>
      </div>);
    }
    const status = getMemoryStatus(memoryHitRatePercentage);
    const statusClass = getStatusClass(status);
    return (<div className={styles.memoryMetricsContainer}>
      <div className={styles.memoryMetricsHeader}>
        <h3 className={styles.memoryMetricsTitle}>Memory Metrics</h3>
        <div className={`${styles.memoryStatus}} ${statusClass}>
          {status.toUpperCase()}
        </div>
      </div>

      <div className={styles.memoryMetricsContent}>
        <div className={styles.memoryUsageBar}>
          <div `} className={$} {...styles.memoryUsageFill}/>}` ${statusClass}`
            style={{ width: $ }}{Math.min(memoryHitRatePercentage, 100)}% }}
          />
        </div>
        
        <div className={styles.memoryStats}>
          <div className={styles.memoryStat}>
            <span className={styles.memoryStatLabel}>Name</span>
            <span className={styles.memoryStatValue}>
              {metrics.name}
            </span>
          </div>
          
          <div className={styles.memoryStat}>
            <span className={styles.memoryStatLabel}>Value</span>
            <span className={styles.memoryStatValue}>
              {metrics.value}
            </span>
          </div>
          
          <div className={styles.memoryStat}>
            <span className={styles.memoryStatLabel}>Total Items</span>
            <span className={styles.memoryStatValue}>
              {metrics.totalItems}
            </span>
          </div>
          
          <div className={styles.memoryStat}>`
            <span className={styles.memoryStatLabel}>Hit Rate</span>`
            <span className={`${styles.memoryStatValue} ${statusClass}}` >
            { memoryHitRatePercentage, : .toFixed(1) } %
        }/>
            </span>
          </div>
        </div>);
};
div >
;
div >
;
;
;
//# sourceMappingURL=MemoryMetrics.js.map