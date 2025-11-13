"use strict";
/**
 * Cost Tracking Service
 *
 * Real-time cost tracking and budget management for generative media
 *
 * @module CostTrackingService
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostTrackingService = void 0;
class CostTrackingService {
    costEntries = [];
    budgetLimits = [];
    alertCallbacks = [];
    constructor() {
        this.loadPersistedData();
        this.setupDefaultBudgets();
    }
    /**
     * Record a cost entry
     */
    async recordCost(entry) {
        const costEntry = {
            ...entry,
            id: this.generateId(),
            timestamp: new Date()
        };
        this.costEntries.push(costEntry);
        await this.persistData();
        // Check budget limits
        await this.checkBudgetLimits(costEntry);
        return costEntry;
    }
    /**
     * Get cost summary for a period
     */
    getCostSummary(period = 'today', userId) {
        const entries = this.getEntriesForPeriod(period, userId);
        const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0);
        const generationCount = entries.length;
        const averageCost = generationCount > 0 ? totalCost / generationCount : 0;
        // Group by provider
        const byProvider = {};
        entries.forEach(entry => {
            if (!byProvider[entry.providerId]) {
                byProvider[entry.providerId] = { cost: 0, count: 0 };
            }
            byProvider[entry.providerId].cost += entry.cost;
            byProvider[entry.providerId].count += 1;
        });
        // Group by media type
        const byMediaType = {};
        entries.forEach(entry => {
            const mediaType = entry.mediaType.toString();
            if (!byMediaType[mediaType]) {
                byMediaType[mediaType] = { cost: 0, count: 0 };
            }
            byMediaType[mediaType].cost += entry.cost;
            byMediaType[mediaType].count += 1;
        });
        // Group by day
        const byDay = [];
        const dayGroups = {};
        entries.forEach(entry => {
            const date = entry.timestamp.toISOString().split('T')[0];
            if (!dayGroups[date]) {
                dayGroups[date] = { cost: 0, count: 0 };
            }
            dayGroups[date].cost += entry.cost;
            dayGroups[date].count += 1;
        });
        Object.entries(dayGroups).forEach(([date, data]) => {
            byDay.push({ date, ...data });
        });
        byDay.sort((a, b) => a.date.localeCompare(b.date));
        return {
            period,
            totalCost,
            currency: 'USD', // Default currency
            generationCount,
            averageCost,
            byProvider,
            byMediaType,
            byDay
        };
    }
    /**
     * Create or update budget limit
     */
    async setBudgetLimit(limit) {
        const budgetLimit = {
            ...limit,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Remove existing limit of same type for same user
        this.budgetLimits = this.budgetLimits.filter(l => !(l.type === limit.type && l.userId === limit.userId));
        this.budgetLimits.push(budgetLimit);
        await this.persistData();
        return budgetLimit;
    }
    /**
     * Get budget status for all limits
     */
    getBudgetStatus(userId) {
        const userLimits = this.budgetLimits.filter(limit => !limit.userId || limit.userId === userId);
        return userLimits.map(limit => {
            const spent = this.getSpentForLimit(limit);
            const remaining = Math.max(0, limit.amount - spent);
            const percentage = (spent / limit.amount) * 100;
            let status = 'safe';
            if (percentage >= 100) {
                status = 'exceeded';
            }
            else if (percentage >= (limit.alertThreshold || 80)) {
                status = 'warning';
            }
            const daysRemaining = this.getDaysRemainingInPeriod(limit.type);
            return {
                limit,
                spent,
                remaining,
                percentage,
                status,
                daysRemaining
            };
        });
    }
    /**
     * Check if generation is allowed within budget
     */
    async canGenerate(providerId, estimatedCost, mediaType, userId) {
        const budgetStatuses = this.getBudgetStatus(userId);
        for (const status of budgetStatuses) {
            const { limit } = status;
            // Check if limit applies to this generation
            if (limit.mediaTypes && !limit.mediaTypes.includes(mediaType))
                continue;
            if (limit.providers && !limit.providers.includes(providerId))
                continue;
            // Check if hard limit would be exceeded
            if (limit.hardLimit && status.spent + estimatedCost > limit.amount) {
                return {
                    allowed: false,
                    reason: `Would exceed ${limit.type} budget limit of $${limit.amount},
          budgetStatus: status
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get cost trends and predictions
   */
  getCostTrends(userId?: string): {
    dailyAverage: number;
    weeklyTrend: number;
    monthlyProjection: number;
    topProviders: Array<{ provider: string; cost: number; percentage: number }>;
    topMediaTypes: Array<{ mediaType: string; cost: number; percentage: number }>;
  } {
    const monthSummary = this.getCostSummary('month', userId);
    const weekSummary = this.getCostSummary('week', userId);
    
    const dailyAverage = monthSummary.byDay.length > 0 
      ? monthSummary.totalCost / monthSummary.byDay.length 
      : 0;
    
    const weeklyTrend = weekSummary.totalCost;
    const monthlyProjection = dailyAverage * 30;

    // Top providers by cost
    const topProviders = Object.entries(monthSummary.byProvider)
      .map(([provider, data]) => ({
        provider,
        cost: data.cost,
        percentage: (data.cost / monthSummary.totalCost) * 100
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Top media types by cost
    const topMediaTypes = Object.entries(monthSummary.byMediaType)
      .map(([mediaType, data]) => ({
        mediaType,
        cost: data.cost,
        percentage: (data.cost / monthSummary.totalCost) * 100
      }))
      .sort((a, b) => b.cost - a.cost);

    return {
      dailyAverage,
      weeklyTrend,
      monthlyProjection,
      topProviders,
      topMediaTypes
    };
  }

  /**
   * Export cost data
   */
  exportCostData(
    format: 'json' | 'csv' = 'json',
    period: 'today' | 'week' | 'month' | 'all' = 'month',
    userId?: string
  ): string {
    const entries = this.getEntriesForPeriod(period, userId);
    
    if (format === 'csv') {
      const headers = ['Date', 'Provider', 'Model', 'Media Type', 'Cost', 'Prompt'];
      const rows = entries.map(entry => [
        entry.timestamp.toISOString(),
        entry.providerId,
        entry.model,
        entry.mediaType,
        entry.cost.toString(),
        entry.prompt.replace(/"/g, '""') // Escape quotes
      ]);
      
      return [headers, ...rows]`
                        .map(row => row.map(cell => "${cell}`" `).join(','))
        .join('\n');
    }
    
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Subscribe to budget alerts
   */
  onBudgetAlert(callback: (alert: BudgetAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  // Private methods
  private getEntriesForPeriod(period: string, userId?: string): CostEntry[] {
    let startDate: Date;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }

    return this.costEntries.filter(entry => {
      if (entry.timestamp < startDate) return false;
      if (userId && entry.userId !== userId) return false;
      return true;
    });
  }

  private getSpentForLimit(limit: BudgetLimit): number {
    const entries = this.getEntriesForPeriod(limit.type, limit.userId);
    
    return entries
      .filter(entry => {
        if (limit.mediaTypes && !limit.mediaTypes.includes(entry.mediaType)) return false;
        if (limit.providers && !limit.providers.includes(entry.providerId)) return false;
        return true;
      })
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  private getDaysRemainingInPeriod(type: string): number {
    const now = new Date();
    
    switch (type) {
      case 'daily':
        return 1;
      case 'weekly':
        return 7 - now.getDay();
      case 'monthly':
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return lastDay - now.getDate() + 1;
      default:
        return 0;
    }
  }

  private async checkBudgetLimits(entry: CostEntry): Promise<void> {
    const budgetStatuses = this.getBudgetStatus(entry.userId);
    
    for (const status of budgetStatuses) {
      if (status.status === 'warning' || status.status === 'exceeded') {
        const alert: BudgetAlert = {
          type: status.status,
          limit: status.limit,
          spent: status.spent,
          percentage: status.percentage,
          entry,
          timestamp: new Date()
        };
        
        this.alertCallbacks.forEach(callback => callback(alert));
      }
    }
  }

  private setupDefaultBudgets(): void {
    // Set up default budget limits if none exist
    if (this.budgetLimits.length === 0) {
      this.budgetLimits = [
        {
          id: this.generateId(),
          name: 'Daily Budget',
          type: 'daily',
          amount: 10.0,
          currency: 'USD',
          alertThreshold: 80,
          hardLimit: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: this.generateId(),
          name: 'Monthly Budget',
          type: 'monthly',
          amount: 100.0,
          currency: 'USD',
          alertThreshold: 80,
          hardLimit: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private async persistData(): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll use localStorage in browser environments
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tnf_cost_entries', JSON.stringify(this.costEntries));
      localStorage.setItem('tnf_budget_limits', JSON.stringify(this.budgetLimits));
    }
  }

  private loadPersistedData(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const costEntries = localStorage.getItem('tnf_cost_entries');
        if (costEntries) {
          this.costEntries = JSON.parse(costEntries).map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        }

        const budgetLimits = localStorage.getItem('tnf_budget_limits');
        if (budgetLimits) {
          this.budgetLimits = JSON.parse(budgetLimits).map((limit: any) => ({
            ...limit,
            createdAt: new Date(limit.createdAt),
            updatedAt: new Date(limit.updatedAt)
          }));
        }
      } catch (error) {
        console.error('Failed to load persisted cost data:', error);
      }
    }
  }
}

export interface BudgetAlert {
  type: 'warning' | 'exceeded';
  limit: BudgetLimit;
  spent: number;
  percentage: number;
  entry: CostEntry;
  timestamp: Date;
}
                    ))
                };
            }
        }
    }
}
exports.CostTrackingService = CostTrackingService;
//# sourceMappingURL=CostTrackingService.js.map