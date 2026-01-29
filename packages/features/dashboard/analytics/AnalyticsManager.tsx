import { DashboardMetrics, DashboardPerformanceMetrics, UserAction, UserMetrics } from './types';

export class AnalyticsManager {
  private actions: UserAction[];
  private dashboardMetrics: Map<string, DashboardMetrics>;
  private performanceMetrics: Map<string, DashboardPerformanceMetrics[]>;
  private userMetrics: Map<string, UserMetrics>;
  private storage: Storage;
  private storageKey: string;

  constructor(
    storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any),
    storageKey = 'dashboard_analytics'
  ) {
    this.actions = [];
    this.dashboardMetrics = new Map();
    this.performanceMetrics = new Map();
    this.userMetrics = new Map();
    this.storage = storage;
    this.storageKey = storageKey;
    this.loadState();
  }

  public trackAction(action: Omit<UserAction, 'id' | 'timestamp'>): void {
    const newAction: UserAction = {
      ...action,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    this.actions.push(newAction);
    this.updateMetrics(newAction);
    this.saveState();
  }

  public getDashboardMetrics(
    dashboardId: string,
    period: { start: Date; end: Date }
  ): DashboardMetrics {
    const metrics = this.dashboardMetrics.get(dashboardId);
    if (!metrics) {
      return this.createDashboardMetrics(dashboardId);
    }
    return metrics;
  }

  public trackPerformance(metrics: Omit<DashboardPerformanceMetrics, 'id'>): void {
    const newMetrics: DashboardPerformanceMetrics = {
      ...metrics,
      id: Math.random().toString(36).substr(2, 9),
    };

    const dashboardId = metrics.dashboardId;
    const existingMetrics = this.performanceMetrics.get(dashboardId) || [];
    existingMetrics.push(newMetrics);
    this.performanceMetrics.set(dashboardId, existingMetrics);
    this.saveState();
  }

  public getPerformanceMetrics(
    dashboardId: string,
    period?: { start?: Date; end?: Date }
  ): DashboardPerformanceMetrics[] {
    const metrics = this.performanceMetrics.get(dashboardId) || [];
    if (!period) return metrics;

    return metrics.filter((m) => {
      const timestamp = new Date(m.timestamp);
      return (
        (!period.start || timestamp >= period.start) && (!period.end || timestamp <= period.end)
      );
    });
  }

  public trackExperimentMetrics(
    experimentId: string,
    variantId: string,
    metrics: Record<string, number>
  ): void {
    // Basic implementation
    console.log(`Tracking experiment ${experimentId} variant ${variantId}`, metrics);
  }

  private updateMetrics(action: UserAction): void {
    const dashboardId = action.metadata?.dashboardId as string | undefined;
    if (dashboardId) {
      const metrics =
        this.dashboardMetrics.get(dashboardId) || this.createDashboardMetrics(dashboardId);
      this.updateDashboardMetrics(metrics, action);
    }

    const userMetrics =
      this.userMetrics.get(action.userId) || this.createUserMetrics(action.userId);
    this.updateUserMetrics(userMetrics, action);
  }

  private updateDashboardMetrics(metrics: DashboardMetrics, action: UserAction): void {
    switch (action.type) {
      case 'view_dashboard':
        metrics.views++;
        metrics.uniqueUsers++; // Simplified
        break;
      case 'comment':
        metrics.collaboration.comments++;
        break;
      case 'resolve_comment':
        metrics.collaboration.resolvedComments++;
        break;
    }
    this.dashboardMetrics.set(metrics.id, metrics);
  }

  private updateUserMetrics(metrics: UserMetrics, action: UserAction): void {
    metrics.totalInteractions++;
    this.userMetrics.set(action.userId, metrics);
  }

  private createDashboardMetrics(dashboardId: string): DashboardMetrics {
    const metrics: DashboardMetrics = {
      id: dashboardId,
      dashboardId: dashboardId,
      period: {
        start: new Date(0),
        end: new Date(),
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
        start: new Date(0),
        end: new Date(),
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
    if (this.storage && typeof this.storage.getItem === 'function') {
      const savedState = this.storage.getItem(this.storageKey);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          this.actions = state.actions || [];
        } catch (e) {
          console.error('Failed to load analytics state', e);
        }
      }
    }
  }

  private saveState(): void {
    if (this.storage && typeof this.storage.setItem === 'function') {
      const state = {
        actions: this.actions,
      };
      this.storage.setItem(this.storageKey, JSON.stringify(state));
    }
  }
}
