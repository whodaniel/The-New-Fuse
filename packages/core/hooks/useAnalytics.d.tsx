import { UserAction, DashboardMetrics, PerformanceMetrics, UserMetrics } from '../analytics/types.js';
import { User } from '../collaboration/types.js';
export declare function useAnalytics(currentUser: User): {
    trackAction: (type: UserAction["type"], metadata?: Record<string, unknown>) => void;
    trackPerformance: (metrics: Omit<PerformanceMetrics, "id">) => void;
    getDashboardMetrics: (dashboardId: string, period: {
        start: Date;
        end: Date;
    }) => DashboardMetrics;
    getUserMetrics: (userId: string, period: {
        start: Date;
        end: Date;
    }) => UserMetrics;
    generateDashboardReport: (dashboardId: string, period: {
        start: Date;
        end: Date;
    }) => any;
    generateUserReport: (userId: string, period: {
        start: Date;
        end: Date;
    }) => any;
};
