var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let UsageAnalytics = class UsageAnalytics {
    constructor() {
        this.usage = [];
        this.maxStoredEvents = 100000;
    }
    trackUsage(userId, feature, metadata, duration, success) {
        const usageEvent = {
            userId,
            feature,
            timestamp: new Date(),
            metadata,
            duration,
            success
        };
        this.usage.push(usageEvent);
        // Keep only the most recent events to prevent memory issues
        if (this.usage.length > this.maxStoredEvents) {
            this.usage = this.usage.slice(-this.maxStoredEvents);
        }
    }
    getMetrics(timeWindowHours = 24) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);
        const recentUsage = this.usage.filter(u => u.timestamp > windowStart);
        const uniqueUsers = new Set(recentUsage.map(u => u.userId)).size;
        const featuresUsed = {};
        recentUsage.forEach(usage => {
            featuresUsed[usage.feature] = (featuresUsed[usage.feature] || 0) + 1;
        });
        // Get top features
        const topFeatures = Object.entries(featuresUsed)
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Calculate active users for different time periods
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const activeUsersToday = new Set(this.usage.filter(u => u.timestamp > oneDayAgo).map(u => u.userId)).size;
        const activeUsersThisWeek = new Set(this.usage.filter(u => u.timestamp > oneWeekAgo).map(u => u.userId)).size;
        return {
            totalRequests: recentUsage.length,
            uniqueUsers,
            featuresUsed,
            averageRequestsPerUser: uniqueUsers > 0 ? recentUsage.length / uniqueUsers : 0,
            topFeatures,
            activeUsersToday,
            activeUsersThisWeek
        };
    }
    getUserMetrics(userId, timeWindowHours = 24) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);
        const userUsage = this.usage.filter(u => u.userId === userId && u.timestamp > windowStart);
        const featuresUsed = {};
        let totalDuration = 0;
        let sessionsWithDuration = 0;
        userUsage.forEach(usage => {
            featuresUsed[usage.feature] = (featuresUsed[usage.feature] || 0) + 1;
            if (usage.duration !== undefined) {
                totalDuration += usage.duration;
                sessionsWithDuration++;
            }
        });
        return {
            requestCount: userUsage.length,
            featuresUsed,
            lastActivity: userUsage.length > 0 ? userUsage[userUsage.length - 1].timestamp : null,
            averageSessionDuration: sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : undefined
        };
    }
    getFeatureMetrics(feature, timeWindowHours = 24) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);
        const featureUsage = this.usage.filter(u => u.feature === feature && u.timestamp > windowStart);
        const uniqueUsers = new Set(featureUsage.map(u => u.userId)).size;
        const successfulUsage = featureUsage.filter(u => u.success !== false).length;
        return {
            totalUsage: featureUsage.length,
            uniqueUsers,
            averageUsagePerUser: uniqueUsers > 0 ? featureUsage.length / uniqueUsers : 0,
            successRate: featureUsage.length > 0 ? successfulUsage / featureUsage.length : 0
        };
    }
    getRetentionMetrics() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const dailyActiveUsers = new Set(this.usage.filter(u => u.timestamp > oneDayAgo).map(u => u.userId)).size;
        const weeklyActiveUsers = new Set(this.usage.filter(u => u.timestamp > oneWeekAgo).map(u => u.userId)).size;
        const monthlyActiveUsers = new Set(this.usage.filter(u => u.timestamp > oneMonthAgo).map(u => u.userId)).size;
        // Calculate retention rate (users active in both week 1 and week 2)
        const week1Users = new Set(this.usage.filter(u => u.timestamp > twoWeeksAgo && u.timestamp <= oneWeekAgo).map(u => u.userId));
        const week2Users = new Set(this.usage.filter(u => u.timestamp > oneWeekAgo).map(u => u.userId));
        const retainedUsers = new Set([...week1Users].filter(x => week2Users.has(x))).size;
        const retentionRate = week1Users.size > 0 ? retainedUsers / week1Users.size : 0;
        return {
            dailyActiveUsers,
            weeklyActiveUsers,
            monthlyActiveUsers,
            retentionRate
        };
    }
    clearOldUsage(olderThanHours = 168) {
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        this.usage = this.usage.filter(u => u.timestamp > cutoff);
    }
    getTotalUsageCount() {
        return this.usage.length;
    }
    exportUsageData(timeWindowHours = 24) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);
        return this.usage.filter(u => u.timestamp > windowStart);
    }
};
UsageAnalytics = __decorate([
    Injectable()
], UsageAnalytics);
export { UsageAnalytics };
//# sourceMappingURL=UsageAnalytics.js.map