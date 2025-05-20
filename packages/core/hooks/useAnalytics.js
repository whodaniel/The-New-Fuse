import { useState, useEffect, useCallback } from 'react';
import { AnalyticsManager } from '../analytics/AnalyticsManager.js';
export function useAnalytics(currentUser) {
    const [manager] = useState(() => new AnalyticsManager());
    const trackAction = useCallback((type, metadata = {}) => {
        manager.trackAction({
            type,
            userId: currentUser.id,
            metadata,
        });
    }, [manager, currentUser]);
    const trackPerformance = useCallback((metrics) => {
        manager.trackPerformance(metrics);
    }, [manager]);
    const getDashboardMetrics = useCallback((dashboardId, period) => {
        return manager.getDashboardMetrics(dashboardId, period);
    }, [manager]);
    const getUserMetrics = useCallback((userId, period) => {
        return manager.getUserMetrics(userId, period);
    }, [manager]);
    const generateDashboardReport = useCallback((dashboardId, period) => {
        return manager.generateDashboardReport(dashboardId, period);
    }, [manager]);
    const generateUserReport = useCallback((userId, period) => {
        return manager.generateUserReport(userId, period);
    }, [manager]);
    // Track page views and performance automatically
    useEffect(() => {
        const startTime = performance.now();
        // Track page view
        trackAction('view_dashboard', {
            url: window.location.href,
            referrer: document.referrer,
        });
        // Track initial page load performance
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (entry.entryType === 'navigation') {
                    trackPerformance({
                        dashboardId: window.location.pathname,
                        timestamp: new Date(),
                        loadTime: entry.duration,
                        renderTime: entry.domComplete - entry.domInteractive,
                        dataFetchTime: entry.responseEnd - entry.requestStart,
                        memoryUsage: performance.memory?.usedJSHeapSize || 0,
                        errorCount: 0,
                        warnings: 0,
                    });
                }
            });
        });
        observer.observe({ entryTypes: ['navigation'] });
        return () => {
            // Track session duration on unmount
            const duration = performance.now() - startTime;
            trackAction('view_dashboard', {
                duration,
                url: window.location.href,
            });
            observer.disconnect();
        };
    }, [trackAction, trackPerformance]);
    return {
        trackAction,
        trackPerformance,
        getDashboardMetrics,
        getUserMetrics,
        generateDashboardReport,
        generateUserReport,
    };
}
//# sourceMappingURL=useAnalytics.js.map