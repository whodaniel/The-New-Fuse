import { UserAction, DashboardMetrics, DashboardPerformanceMetrics, UserMetrics } from './types.js';
export declare class AnalyticsManager {
    private actions;
    private dashboardMetrics;
    private performanceMetrics;
    private userMetrics;
    private storage;
    private storageKey;
    constructor(storage?: Storage, storageKey?: string);
    trackAction(action: Omit<UserAction, 'id' | 'timestamp'>): void;
    getDashboardMetrics(dashboardId: string, period: {
        start: Date;
        end: Date;
    }): DashboardMetrics;
    trackPerformance(metrics: Omit<DashboardPerformanceMetrics, 'id'>): void;
    getPerformanceMetrics(dashboardId: string, period?: {
        start?: Date;
        end?: Date;
    }): DashboardPerformanceMetrics[];
    getUserMetrics(userId: string, period: {
        start: Date;
        end: Date;
    }): UserMetrics;
    generateDashboardReport(dashboardId: string, period: {
        start: Date;
        end: Date;
    }): {
        metrics: DashboardMetrics;
        performance: DashboardPerformanceMetrics[];
        topUsers: Array<{
            userId: string;
            metrics: UserMetrics;
        }>;
    };
    generateUserReport(userId: string, period: {
        start: Date;
        end: Date;
    }): {
        metrics: UserMetrics;
        actions: UserAction[];
        topDashboards: Array<{
            dashboardId: string;
            views: number;
            interactions: number;
        }>;
    };
    trackExperimentMetrics(): Promise<void>;
}
