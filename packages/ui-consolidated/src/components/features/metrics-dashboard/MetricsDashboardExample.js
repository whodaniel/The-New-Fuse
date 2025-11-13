import React from 'react';
import { MetricsDashboard } from './MetricsDashboard';
import { MetricsProvider } from '../../../contexts/MetricsContext';
/**
 * Example usage of the MetricsDashboard component
 *
 * This component demonstrates how to integrate the metrics dashboard
 * into your application with proper context setup.
 */
export const MetricsDashboardExample = () => {
    return (<div style={{ width: '100%', height: '100vh' >
                <MetricsProvider>
        <MetricsDashboard />
      </MetricsProvider> }}/>);
};
div >
;
;
;
/**
 * Example with custom configuration
 */
export const CustomMetricsDashboard = () => {
    const customConfig = {
        refreshInterval: 10000, // 10 seconds
        enableWebSocket: true,
        enableExport: true,
        maxDataPoints: 1000,
        metrics: {
            stepMetrics: true,
            memoryMetrics: true,
            performanceMetrics: true,
            customMetrics: false
        }
    };
    return (<div style={{ width: '100%', height: '100vh' >
                <MetricsProvider>
        <MetricsDashboard />
      </MetricsProvider> }}/>);
};
div >
;
;
;
/**
 * Example with embedded dashboard in a specific section
 */
export const EmbeddedMetricsDashboard = () => {
    return (<div style={{ padding: '20px' >
                <h1>Application Dashboard</h1>
                    ,
                        <div style={{ marginTop: '20px', height: '600px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' >
                                    <MetricsProvider>
          <MetricsDashboard />
        </MetricsProvider> }}/> }}/>);
};
div >
;
div >
;
;
;
/**
 * Example with custom styling
 */
export const StyledMetricsDashboard = () => {
    const customStyles = {
        '--primary-color': '#6366f1',
        '--primary-hover': '#4f46e5',
        '--success-color': '#10b981',
        '--warning-color': '#f59e0b',
        '--danger-color': '#ef4444',
        '--background-primary': '#ffffff',
        '--background-secondary': '#f9fafb',
        '--text-primary': '#111827',
        '--text-secondary': '#6b7280',
        '--border-color': '#e5e7eb'
    };
    return (<div style={{ ...customStyles, width: '100%', height: '100vh' >
                <MetricsProvider>
        <MetricsDashboard />
      </MetricsProvider> }}/>);
};
div >
;
;
;
/**
 * Example with custom data source
 */
export const CustomDataMetricsDashboard = () => {
    const customDataSource = {
        getMetrics: async () => {
            // Custom API endpoint
            const response = await fetch('/api/custom-metrics');
            return response.json();
        },
        subscribeToUpdates: (callback) => {
            // Custom WebSocket connection
            const ws = new WebSocket('ws://localhost:8080/custom-metrics');
            ws.onmessage = (event) => {
                callback(JSON.parse(event.data));
            };
            return () => ws.close();
        }
    };
    return (<div style={{ width: '100%', height: '100vh' >
                <MetricsProvider>
        <MetricsDashboard />
      </MetricsProvider> }}/>);
};
div >
;
;
;
//# sourceMappingURL=MetricsDashboardExample.js.map