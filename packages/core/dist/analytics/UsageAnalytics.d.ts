export interface UsageMetrics {
    totalRequests: number;
    uniqueUsers: number;
    featuresUsed: Record<string, number>;
    averageRequestsPerUser: number;
    topFeatures: Array<{
        feature: string;
        count: number;
    }>;
    activeUsersToday: number;
    activeUsersThisWeek: number;
}
export interface UsageEvent {
    userId: string;
    feature: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    duration?: number;
    success?: boolean;
}
export declare class UsageAnalytics {
    private usage;
    private readonly maxStoredEvents;
    trackUsage(userId: string, feature: string, metadata?: Record<string, any>, duration?: number, success?: boolean): void;
    getMetrics(timeWindowHours?: number): UsageMetrics;
    getUserMetrics(userId: string, timeWindowHours?: number): {
        requestCount: number;
        featuresUsed: Record<string, number>;
        lastActivity: Date | null;
        averageSessionDuration?: number;
    };
    getFeatureMetrics(feature: string, timeWindowHours?: number): {
        totalUsage: number;
        uniqueUsers: number;
        averageUsagePerUser: number;
        successRate: number;
    };
    getRetentionMetrics(): {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        monthlyActiveUsers: number;
        retentionRate: number;
    };
    clearOldUsage(olderThanHours?: number): void;
    getTotalUsageCount(): number;
    exportUsageData(timeWindowHours?: number): UsageEvent[];
}
//# sourceMappingURL=UsageAnalytics.d.ts.map