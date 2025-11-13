import React, { useState, useMemo } from 'react';
import styles from './metrics-dashboard.module.css';
export const StepMetrics = ({ metrics, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const filteredAndSortedMetrics = useMemo(() => {
        let filtered = metrics;
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(metric => metric.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(metric => {
                const status = metric.success ? 'success' : 'failed';
                return status === statusFilter;
            });
        }
        // Apply sorting
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'duration':
                    return b.duration - a.duration;
                case 'status':
                    return a.success === b.success ? 0 : (a.success ? -1 : 1);
                default:
                    return 0;
            }
        });
    }, [metrics, searchTerm, statusFilter, sortBy]);
    const getStatusClass = (success) => {
        if (success) {
            return styles.statusSuccess || styles.statusGood;
        }
        else {
            return styles.statusFailed || styles.statusCritical;
        }
    };
    if (loading) {
        return (<div className={styles.stepMetricsContainer}>
        <div className={styles.stepMetricsHeader}>
          <h3 className={styles.stepMetricsTitle}>Step Metrics</h3>
        </div>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}/>
          <span>Loading step metrics...</span>
        </div>
      </div>);
    }
    return (<div className={styles.stepMetricsContainer}>
      <div className={styles.stepMetricsHeader}>
        <h3 className={styles.stepMetricsTitle}>Step Metrics</h3>
        <div className={styles.metricsControls}>
          <input type="text" placeholder="Search steps..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} aria-label="Search steps"/>
          <label className={styles.controlLabel}>
            Status:
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect} aria-label="Filter by status">
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className={styles.controlLabel}>
            Sort:
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect} aria-label="Sort metrics">
              <option value="name">Sort by Name</option>
              <option value="duration">Sort by Duration</option>
              <option value="status">Sort by Status</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.metricsList}>
        {filteredAndSortedMetrics.length === 0 ? (<div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' >
                    { searchTerm } || statusFilter !== 'all' ? 'No metrics match your filters' : 'No step metrics available' }}/>)
            :
        }
          </div>
        ) : (
          filteredAndSortedMetrics.map((metric) => (
            <div key={metric.id} className={styles.metricItem}>
              <div className={styles.metricInfo}>
                <div className={styles.metricName}>{metric.name}</div>
                <div className={styles.metricDetails}>
                  <span>Duration: {metric.duration.toFixed(2)}ms</span>
                  <span>Value: {metric.value}</span>
                  <span>Node: {metric.nodeId}</span>
                </div>
              </div>
              <div className={styles.metricValue}>
                <span className={`${styles.metricStatus}} ${getStatusClass(metric.success)}` >
            { metric, : .success ? 'success' : 'failed' }}/>
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
//# sourceMappingURL=StepMetrics.js.map