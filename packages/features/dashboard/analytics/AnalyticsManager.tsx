import {
  UserAction,
  DashboardMetrics,
  DashboardPerformanceMetrics,
  UserMetrics,
} from './types.js';

export class AnalyticsManager {
  private actions: UserAction[];
  private dashboardMetrics: Map<string, DashboardMetrics>;
  private performanceMetrics: Map<string, DashboardPerformanceMetrics[]>;
  private userMetrics: Map<string, UserMetrics>;
  private storage: Storage;
  private storageKey: string;

  constructor(storage: Storage = localStorage, storageKey = 'dashboard_analytics') {
    this.actions = [];
    this.dashboardMetrics = new Map();
    this.performanceMetrics = new Map();
    this.userMetrics = new Map();
    this.storage = storage;
    this.storageKey = storageKey;
    this.loadState();
  }
  
  trackAction(action: Omit<UserAction, 'id' | 'timestamp'>): void {
    const newAction: UserAction = {
      ...action,
      id: (crypto as any).randomUUID(),
      timestamp: new Date(),
    };

    this.actions.push(newAction);
    this.updateMetrics(newAction);
    this.saveState();
  }

  // Dashboard Metrics
  getDashboardMetrics(
    dashboardId: string,
    period: { start: Date; end: Date }
  ): DashboardMetrics {
    const metrics = this.dashboardMetrics.get(dashboardId);
    if (!metrics) {
      return this.createDashboardMetrics(dashboardId);
    }
    return metrics;
  }

  // Performance Metrics
  trackPerformance(
    metrics: Omit<DashboardPerformanceMetrics, 'id'>
  ): void {
    const newMetrics: DashboardPerformanceMetrics = {
      ...metrics,
      id: (crypto as any).randomUUID()
    };
    
    const dashboardId = metrics.dashboardId;
    const existingMetrics = this.performanceMetrics.get(dashboardId) || [];
    existingMetrics.push(newMetrics);
    this.performanceMetrics.set(dashboardId, existingMetrics);
    this.saveState();
  }

  getPerformanceMetrics(
    dashboardId: string,
    period?: { start?: Date; end?: Date }
  ): DashboardPerformanceMetrics[] {
    const metrics = this.performanceMetrics.get(dashboardId) || [];
    if (!period) return metrics;
    
    return metrics.filter(
      (m) => {
        const timestamp = new Date(m.timestamp);
        return (!period.start || timestamp >= period.start) && 
               (!period.end || timestamp <= period.end);
      }
    );
  }

  // User Metrics
  getUserMetrics(
    userId: string,
    period: { start: Date; end: Date }
  ): UserMetrics {
    const metrics = this.userMetrics.get(userId);
    if (!metrics) {
      return this.createUserMetrics(userId);
    }
    return metrics;
  }

  // Dashboard Report
  generateDashboardReport(
    dashboardId: string,
    period: { start: Date; end: Date }
  ): {
    metrics: DashboardMetrics;
    performance: DashboardPerformanceMetrics[];
    topUsers: Array<{ userId: string; metrics: UserMetrics }>;
  } {
    const metrics = this.getDashboardMetrics(dashboardId, period);
    const performance = this.getPerformanceMetrics(dashboardId, period);
    
    // Get top users based on interactions
    const userMetricsArray = Array.from(this.userMetrics.entries())
      .map(([userId, metrics]) => ({ userId, metrics }))
      .filter(
        ({ metrics }) => metrics.dashboardViews && metrics.dashboardViews[dashboardId]
      )
      .sort(
        (a, b) => 
          (b.metrics.dashboardViews[dashboardId] || 0) - 
          (a.metrics.dashboardViews[dashboardId] || 0)
      )
      .slice(0, 10);

    return {
      metrics,
      performance,
      topUsers: userMetricsArray
    };
  }

  generateUserReport(
    userId: string,
    period: { start: Date; end: Date }
  ): {
    metrics: UserMetrics;
    actions: UserAction[];
    topDashboards: Array<{
      dashboardId: string;
      views: number;
      interactions: number;
    }>;
  } {
    const metrics = this.getUserMetrics(userId, period);
    
    // Filter actions by user and period
    const actions = this.actions.filter(
      (a) => a.userId === userId && 
             a.timestamp >= period.start && 
             a.timestamp <= period.end
    );
    
    // Get top dashboards for this user
    const topDashboards = Object.entries(metrics.dashboardViews || {})
      .map(([dashboardId, views]) => ({
        dashboardId,
        views,
        interactions: actions.filter(a => 
          a.metadata && a.metadata.dashboardId === dashboardId
        ).length,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      metrics,
      actions,
      topDashboards,
    };
  }

  // Track experiment metrics
  async trackExperimentMetrics(): Promise<void> {
    experimentId: string,
    variantId: string,
    metrics: Record<string, number>
  ): Promise<void> {
    // Implementation for tracking experiment metrics
    // This would store metrics for A/B testing analysis
  }

  // Get experiment metrics for analysis
  async getExperimentMetrics(): Promise<void> {experimentId: string): Promise<any> {
    // Implementation to retrieve experiment metrics
    // This would return metrics for experiment analysis
    return {};
  }

  // Private Helper Methods
  private updateMetrics(action: UserAction): void {
    const dashboardId = action.metadata?.dashboardId as string | undefined;
    if (dashboardId) {
      const metrics = this.dashboardMetrics.get(dashboardId) || 
                     this.createDashboardMetrics(dashboardId);
      this.updateDashboardMetrics(metrics, action);
    }
    
    const userMetrics = this.userMetrics.get(action.userId) || 
                        this.createUserMetrics(action.userId);
    this.updateUserMetrics(userMetrics, action);
  }

  private updateDashboardMetrics(metrics: DashboardMetrics, action: UserAction): void {
    switch(action.type) {
      case 'view_dashboard':
        metrics.views++;
        // Convert uniqueUsers to a Set temporarily for deduplication
        const uniqueUserSet = new Set<string>();
        // If we have existing unique users, we need to add them to our set
        if (metrics.uniqueUsers > 0) {
          // This is a simplification since we don't track individual users
          uniqueUserSet.add(action.userId);
        } else {
          uniqueUserSet.add(action.userId);
        }
        metrics.uniqueUsers = uniqueUserSet.size;
        break;
        
      case 'edit_widget':
      case 'delete_widget':
        const widgetId = action.metadata?.widgetId as string | undefined;
        if (widgetId) {
          metrics.widgetInteractions[widgetId] = metrics.widgetInteractions[widgetId] || {
            views: 0,
            interactions: 0,
            avgTimeSpent: 0,
          };
          metrics.widgetInteractions[widgetId].interactions++;
        }
        break;

      case 'apply_filter':
        const filterId = action.metadata?.filterId as string | undefined;
        if (filterId) {
          const filterUsage = metrics.filterUsage.find(f => f.filterId === filterId);
          if (filterUsage) {
            filterUsage.applications++;
            // Increment unique users count - in a real app we'd track individual users
            filterUsage.uniqueUsers++;
          } else {
            metrics.filterUsage.push({
              filterId: filterId,
              applications: 1,
              uniqueUsers: 1
            });
          }
        }
        break;
        
      case 'export_data': // Changed to match the type definition
        metrics.exports.total++;
        const format = action.metadata?.format as string | undefined;
        if (format) {
          metrics.exports.byFormat[format] = (metrics.exports.byFormat[format] || 0) + 1;
        }
        break;
        
      case 'comment':
        metrics.collaboration.comments++;
        break;

      case 'resolve_comment':
        metrics.collaboration.resolvedComments++;
        break;

      case 'create_version':
        metrics.collaboration.versions++;
        break;

      case 'create_branch':
        metrics.collaboration.branches++;
        break;
    }

    this.dashboardMetrics.set(metrics.id, metrics);
  }

  private updateUserMetrics(metrics: UserMetrics, action: UserAction): void {
    const dashboardId = action.metadata?.dashboardId as string | undefined;
    if (dashboardId) {
      metrics.dashboardViews[dashboardId] = (metrics.dashboardViews[dashboardId] || 0) + 1;
    }
    
    metrics.totalInteractions++;
    
    switch(action.type) {
      case 'comment':
        metrics.contributedComments++;
        break;

      case 'resolve_comment':
        metrics.resolvedComments++;
        break;

      case 'create_version':
        metrics.createdVersions++;
        break;

      case 'merge_branch':
        metrics.mergedBranches++;
        break;
    }

    this.userMetrics.set(action.userId, metrics);
  }

  private createDashboardMetrics(dashboardId: string): DashboardMetrics {
    const metrics: DashboardMetrics = {
      id: dashboardId,
      dashboardId: dashboardId,
      period: {
        start: new Date(0), // Set to epoch start
        end: new Date(),    // Set to current date
      },
      views: 0,
      uniqueUsers: 0,
      avgSessionDuration: 0,
      totalSessions: 0,
      widgetInteractions: {},
      filterUsage: [],
      exports: {
        total: 0,
        byFormat: {},
      },
      collaboration: {
        comments: 0,
        resolvedComments: 0,
        activeUsers: 0,
        versions: 0,
        branches: 0,
      },
    };

    this.dashboardMetrics.set(dashboardId, metrics);
    return metrics;
  }

  private createUserMetrics(userId: string): UserMetrics {
    const metrics: UserMetrics = {
      id: userId,
      userId: userId,
      period: {
        start: new Date(0), // Set to epoch start
        end: new Date(),    // Set to current date
      },
      dashboardViews: {},
      totalInteractions: 0,
      activeTime: 0,
      contributedComments: 0,
      resolvedComments: 0,
      createdVersions: 0,
      mergedBranches: 0,
      preferences: {
        favoriteWidgets: [],
        commonFilters: [],
        exportFormats: [],
      },
    };

    this.userMetrics.set(userId, metrics);
    return metrics;
  }

  private loadState(): void {
    const savedState = this.storage.getItem(this.storageKey);
    if (savedState) {
      const state = JSON.parse(savedState);
      this.actions = state.actions || [];
      this.dashboardMetrics = new Map(Object.entries(state.dashboardMetrics || {}));
      this.performanceMetrics = new Map(Object.entries(state.performanceMetrics || {}));
      this.userMetrics = new Map(Object.entries(state.userMetrics || {}));
    }
  }

  private saveState(): void {
    const state = {
      actions: this.actions,
      dashboardMetrics: Object.fromEntries(this.dashboardMetrics),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      userMetrics: Object.fromEntries(this.userMetrics)
    };
    this.storage.setItem(this.storageKey, JSON.stringify(state));
  }
}
