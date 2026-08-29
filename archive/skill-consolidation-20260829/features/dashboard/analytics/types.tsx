export interface UserAction {
  id: string;
  type:
    | 'view_dashboard'
    | 'create_widget'
    | 'edit_widget'
    | 'delete_widget'
    | 'apply_filter'
    | 'export_data'
    | 'share_dashboard'
    | 'comment'
    | 'resolve_comment'
    | 'create_version'
    | 'switch_version'
    | 'create_branch'
    | 'merge_branch';
  userId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface DashboardMetrics {
  id: string;
  dashboardId: string;
  period: {
    start: Date;
    end: Date;
  };
  views: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  totalSessions: number;
  widgetInteractions: Record<
    string,
    {
      views: number;
      interactions: number;
      avgTimeSpent: number;
    }
  >;
  filterUsage: Array<{
    filterId: string;
    applications: number;
    uniqueUsers: number;
  }>;
  exports: {
    total: number;
    byFormat: Record<string, number>;
  };
  collaboration: {
    comments: number;
    resolvedComments: number;
    activeUsers: number;
    versions: number;
    branches: number;
  };
}

export interface DashboardPerformanceMetrics {
  id: string;
  dashboardId: string;
  timestamp: Date;
  loadTime: number;
  renderTime: number;
  dataFetchTime: number;
  memoryUsage: number;
  errorCount: number;
  warnings: number;
}

export interface UserMetrics {
  id: string;
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  dashboardViews: Record<string, number>;
  totalInteractions: number;
  activeTime: number;
  contributedComments: number;
  resolvedComments: number;
  createdVersions: number;
  mergedBranches: number;
  preferences: {
    favoriteWidgets: string[];
    commonFilters: string[];
    exportFormats: string[];
  };
}
