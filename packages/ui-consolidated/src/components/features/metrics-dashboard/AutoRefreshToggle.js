import React from 'react';
import styles from './metrics-dashboard.module.css';
export const AutoRefreshToggle = ({ enabled, interval, onToggle, onIntervalChange }) => {
    const intervals = [
        { value: 1000, label: '1 second' },
        { value: 5000, label: '5 seconds' },
        { value: 10000, label: '10 seconds' },
        { value: 30000, label: '30 seconds' },
        { value: 60000, label: '1 minute' },
        { value: 300000, label: '5 minutes' }
    ];
    return (<div className={styles.autoRefreshControls}>
      <label className={styles.toggleLabel}>
        <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className={styles.toggleInput}/>
        <span className={styles.toggleSlider}/>
        <span className={styles.toggleText}>Auto Refresh</span>
      </label>
      
      {enabled && (<select value={interval} onChange={(e) => onIntervalChange(Number(e.target.value))} className={styles.intervalSelect} aria-label="Refresh interval">
          {intervals.map((interval) => (<option key={interval.value} value={interval.value}>
              {interval.label}
            </option>))}
        </select>)}
    </div>);
};
//# sourceMappingURL=AutoRefreshToggle.js.map