/**
 * Cost Tracking Service
 *
 * Real-time cost tracking and budget management for generative media
 *
 * @module CostTrackingService
 * @since 2025-10-06
 */
import { MediaType } from './GenerativeMediaProviderRegistry';
export interface CostEntry {
    id: string;
    timestamp: Date;
    providerId: string;
    model: string;
    mediaType: MediaType;
    prompt: string;
    cost: number;
    currency: string;
    parameters: any;
    userId?: string;
    sessionId?: string;
    metadata?: {
        generationTime?: number;
        outputCount?: number;
        success?: boolean;
    };
}
export interface BudgetLimit {
    id: string;
    name: string;
    type: 'daily' | 'weekly' | 'monthly' | 'total';
    amount: number;
    currency: string;
    mediaTypes?: MediaType[];
    providers?: string[];
    userId?: string;
    alertThreshold?: number;
    hardLimit?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CostSummary {
    period: string;
    totalCost: number;
    currency: string;
    generationCount: number;
    averageCost: number;
    byProvider: Record<string, {
        cost: number;
        count: number;
    }>;
    byMediaType: Record<string, {
        cost: number;
        count: number;
    }>;
    byDay: Array<{
        date: string;
        cost: number;
        count: number;
    }>;
}
export interface BudgetStatus {
    limit: BudgetLimit;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'exceeded';
    daysRemaining?: number;
}
export declare class CostTrackingService {
    private costEntries;
    private budgetLimits;
    private alertCallbacks;
    constructor();
    /**
     * Record a cost entry
     */
    recordCost(entry: Omit<CostEntry, 'id' | 'timestamp'>): Promise<CostEntry>;
    /**
     * Get cost summary for a period
     */
    getCostSummary(period?: 'today' | 'week' | 'month' | 'all', userId?: string): CostSummary;
    /**
     * Create or update budget limit
     */
    setBudgetLimit(limit: Omit<BudgetLimit, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetLimit>;
    /**
     * Get budget status for all limits
     */
    getBudgetStatus(userId?: string): BudgetStatus[];
    /**
     * Check if generation is allowed within budget
     */
    canGenerate(providerId: string, estimatedCost: number, mediaType: MediaType, userId?: string): Promise<{
        allowed: boolean;
        reason?: string;
        budgetStatus?: BudgetStatus;
    }>;
}
//# sourceMappingURL=CostTrackingService.d.ts.map