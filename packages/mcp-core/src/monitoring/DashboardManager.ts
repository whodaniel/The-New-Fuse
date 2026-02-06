/**
 * Dashboard Management System
 */

import { IDashboardManager } from '../interfaces/IMonitoring';
import { DashboardConfig } from '../types/monitoring';
import { Logger } from '../utils/Logger';

export interface DashboardManagerConfig {
  /** Dashboard refresh interval (ms) */
  refreshInterval: number;
  /** Storage configuration */
  storage: {
    type: 'memory' | 'file' | 'database';
    options?: Record<string, any>;
  };
}

/**
 * Dashboard manager implementation
 */
export class DashboardManager implements IDashboardManager {
  private readonly config: DashboardManagerConfig;
  private readonly logger: Logger;
  private readonly dashboards = new Map<string, DashboardConfig>();

  constructor(config: DashboardManagerConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('DashboardManager');
    this.initializeDefaultDashboards();
  }

  /**
   * Create a dashboard
   */
  async createDashboard(config: DashboardConfig): Promise<void> {
    this.dashboards.set(config.id, config);
    this.logger.info(`Created dashboard: ${config.name}`, { id: config.id });
  }

  /**
   * Update a dashboard
   */
  async updateDashboard(id: string, config: Partial<DashboardConfig>): Promise<void> {
    const existing = this.dashboards.get(id);
    if (!existing) {
      throw new Error(`Dashboard not found: ${id}`);
    }

    const updated = { ...existing, ...config };
    this.dashboards.set(id, updated);
    this.logger.info(`Updated dashboard: ${updated.name}`, { id });
  }

  /**
   * Delete a dashboard
   */
  async deleteDashboard(id: string): Promise<void> {
    const deleted = this.dashboards.delete(id);
    if (!deleted) {
      throw new Error(`Dashboard not found: ${id}`);
    }
    this.logger.info(`Deleted dashboard: ${id}`);
  }

  /**
   * Get dashboard
   */
  async getDashboard(id: string): Promise<DashboardConfig | null> {
    return this.dashboards.get(id) || null;
  }

  /**
   * List all dashboards
   */
  async listDashboards(): Promise<DashboardConfig[]> {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(id: string): Promise<any> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${id}`);
    }

    // Generate mock data for each panel
    const data: Record<string, any> = {};

    for (const panel of dashboard.panels) {
      data[panel.id] = await this.generatePanelData(panel);
    }

    return {
      dashboard,
      data,
      timestamp: new Date(),
    };
  }

  /**
   * Export dashboard
   */
  async exportDashboard(id: string): Promise<string> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${id}`);
    }

    return JSON.stringify(dashboard, null, 2);
  }

  /**
   * Import dashboard
   */
  async importDashboard(data: string): Promise<void> {
    try {
      const dashboard: DashboardConfig = JSON.parse(data);
      await this.createDashboard(dashboard);
    } catch (error) {
      throw new Error(`Failed to import dashboard: ${error}`);
    }
  }

  /**
   * Initialize default dashboards
   */
  private initializeDefaultDashboards(): void {
    // System Overview Dashboard
    const systemOverview: DashboardConfig = {
      id: 'system-overview',
      name: 'System Overview',
      description: 'High-level system metrics and health',
      refreshInterval: 30000,
      autoRefresh: true,
      panels: [
        {
          id: 'health-score',
          title: 'System Health Score',
          type: 'gauge',
          position: { x: 0, y: 0, width: 6, height: 4 },
          config: {
            metrics: ['system.healthScore'],
            timeRange: '1h',
            thresholds: [
              { value: 70, color: 'red', label: 'Critical' },
              { value: 85, color: 'yellow', label: 'Warning' },
              { value: 100, color: 'green', label: 'Healthy' },
            ],
          },
        },
        {
          id: 'requests-per-second',
          title: 'Requests per Second',
          type: 'line',
          position: { x: 6, y: 0, width: 6, height: 4 },
          config: {
            metrics: ['requests.rps'],
            timeRange: '1h',
          },
        },
        {
          id: 'response-time',
          title: 'Response Time',
          type: 'line',
          position: { x: 0, y: 4, width: 6, height: 4 },
          config: {
            metrics: ['requests.avgResponseTime', 'requests.p95ResponseTime'],
            timeRange: '1h',
          },
        },
        {
          id: 'error-rate',
          title: 'Error Rate',
          type: 'line',
          position: { x: 6, y: 4, width: 6, height: 4 },
          config: {
            metrics: ['requests.errorRate'],
            timeRange: '1h',
            thresholds: [
              { value: 0.05, color: 'yellow', label: 'Warning' },
              { value: 0.1, color: 'red', label: 'Critical' },
            ],
          },
        },
      ],
    };

    // Performance Dashboard
    const performance: DashboardConfig = {
      id: 'performance',
      name: 'Performance Metrics',
      description: 'Detailed performance monitoring',
      refreshInterval: 15000,
      autoRefresh: true,
      panels: [
        {
          id: 'response-time-histogram',
          title: 'Response Time Distribution',
          type: 'heatmap',
          position: { x: 0, y: 0, width: 12, height: 4 },
          config: {
            metrics: ['requests.responseTimeHistogram'],
            timeRange: '1h',
          },
        },
        {
          id: 'throughput-stats',
          title: 'Throughput Statistics',
          type: 'stat',
          position: { x: 0, y: 4, width: 3, height: 2 },
          config: {
            metrics: ['requests.rps'],
            timeRange: '1h',
          },
        },
        {
          id: 'connection-stats',
          title: 'Active Connections',
          type: 'stat',
          position: { x: 3, y: 4, width: 3, height: 2 },
          config: {
            metrics: ['connections.active'],
            timeRange: '1h',
          },
        },
        {
          id: 'cache-hit-rate',
          title: 'Cache Hit Rate',
          type: 'stat',
          position: { x: 6, y: 4, width: 3, height: 2 },
          config: {
            metrics: ['resources.cacheHitRate'],
            timeRange: '1h',
          },
        },
        {
          id: 'tool-success-rate',
          title: 'Tool Success Rate',
          type: 'stat',
          position: { x: 9, y: 4, width: 3, height: 2 },
          config: {
            metrics: ['tools.successRate'],
            timeRange: '1h',
          },
        },
      ],
    };

    // System Resources Dashboard
    const systemResources: DashboardConfig = {
      id: 'system-resources',
      name: 'System Resources',
      description: 'System resource utilization',
      refreshInterval: 10000,
      autoRefresh: true,
      panels: [
        {
          id: 'memory-usage',
          title: 'Memory Usage',
          type: 'line',
          position: { x: 0, y: 0, width: 6, height: 4 },
          config: {
            metrics: ['system.memoryUsage'],
            timeRange: '1h',
          },
        },
        {
          id: 'cpu-usage',
          title: 'CPU Usage',
          type: 'line',
          position: { x: 6, y: 0, width: 6, height: 4 },
          config: {
            metrics: ['system.cpuUsage'],
            timeRange: '1h',
          },
        },
        {
          id: 'uptime',
          title: 'System Uptime',
          type: 'stat',
          position: { x: 0, y: 4, width: 4, height: 2 },
          config: {
            metrics: ['system.uptime'],
            timeRange: '1h',
          },
        },
        {
          id: 'resource-counts',
          title: 'Resource Counts',
          type: 'table',
          position: { x: 4, y: 4, width: 8, height: 4 },
          config: {
            metrics: ['resources.total', 'tools.total', 'connections.total'],
            timeRange: '1h',
          },
        },
      ],
    };

    // Add dashboards
    this.dashboards.set(systemOverview.id, systemOverview);
    this.dashboards.set(performance.id, performance);
    this.dashboards.set(systemResources.id, systemResources);

    this.logger.info(`Initialized ${this.dashboards.size} default dashboards`);
  }

  /**
   * Generate panel data (mock implementation)
   */
  private async generatePanelData(panel: any): Promise<any> {
    const now = Date.now();
    const timeRange = this.parseTimeRange(panel.config.timeRange || '1h');

    switch (panel.type) {
      case 'line':
        return this.generateTimeSeriesData(panel.config.metrics, timeRange);
      case 'gauge':
        return this.generateGaugeData(panel.config.metrics[0]);
      case 'stat':
        return this.generateStatData(panel.config.metrics[0]);
      case 'table':
        return this.generateTableData(panel.config.metrics);
      case 'heatmap':
        return this.generateHeatmapData(panel.config.metrics[0], timeRange);
      case 'bar':
        return this.generateBarData(panel.config.metrics);
      default:
        return { error: `Unsupported panel type: ${panel.type}` };
    }
  }

  /**
   * Generate time series data
   */
  private generateTimeSeriesData(metrics: string[], timeRange: number): any {
    const now = Date.now();
    const points = 50;
    const interval = timeRange / points;

    const series = metrics.map((metric) => ({
      name: metric,
      data: Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i) * interval),
        value: this.generateMetricValue(metric, i),
      })),
    }));

    return { series };
  }

  /**
   * Generate gauge data
   */
  private generateGaugeData(metric: string): any {
    return {
      value: this.generateMetricValue(metric),
      min: 0,
      max: 100,
      unit: this.getMetricUnit(metric),
    };
  }

  /**
   * Generate stat data
   */
  private generateStatData(metric: string): any {
    const current = this.generateMetricValue(metric);
    const previous = this.generateMetricValue(metric) * 0.9;
    const change = ((current - previous) / previous) * 100;

    return {
      value: current,
      change: change,
      unit: this.getMetricUnit(metric),
    };
  }

  /**
   * Generate table data
   */
  private generateTableData(metrics: string[]): any {
    const rows = metrics.map((metric) => ({
      metric,
      value: this.generateMetricValue(metric),
      unit: this.getMetricUnit(metric),
    }));

    return {
      columns: ['Metric', 'Value', 'Unit'],
      rows,
    };
  }

  /**
   * Generate heatmap data
   */
  private generateHeatmapData(metric: string, timeRange: number): any {
    const buckets = 20;
    const timePoints = 30;
    const now = Date.now();
    const interval = timeRange / timePoints;

    const data = Array.from({ length: timePoints }, (_, t) =>
      Array.from({ length: buckets }, (_, b) => ({
        x: new Date(now - (timePoints - t) * interval),
        y: b * 50, // Response time buckets
        value: Math.random() * 100,
      }))
    ).flat();

    return { data };
  }

  /**
   * Generate bar data
   */
  private generateBarData(metrics: string[]): any {
    const data = metrics.map((metric) => ({
      name: metric,
      value: this.generateMetricValue(metric),
    }));

    return { data };
  }

  /**
   * Generate metric value (mock)
   */
  private generateMetricValue(metric: string, index?: number): number {
    const base = index !== undefined ? index : 0;

    switch (metric) {
      case 'system.healthScore':
        return 85 + Math.random() * 15;
      case 'requests.rps':
        return 50 + Math.random() * 100 + Math.sin(base * 0.1) * 20;
      case 'requests.avgResponseTime':
        return 100 + Math.random() * 200 + Math.sin(base * 0.2) * 50;
      case 'requests.p95ResponseTime':
        return 200 + Math.random() * 300 + Math.sin(base * 0.2) * 100;
      case 'requests.errorRate':
        return Math.random() * 0.05;
      case 'connections.active':
        return Math.floor(10 + Math.random() * 50);
      case 'resources.cacheHitRate':
        return 0.7 + Math.random() * 0.3;
      case 'tools.successRate':
        return 0.9 + Math.random() * 0.1;
      case 'system.memoryUsage':
        return 500 * 1024 * 1024 + Math.random() * 200 * 1024 * 1024;
      case 'system.cpuUsage':
        return 20 + Math.random() * 60;
      case 'system.uptime':
        return Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      case 'resources.total':
        return Math.floor(100 + Math.random() * 50);
      case 'tools.total':
        return Math.floor(20 + Math.random() * 10);
      case 'connections.total':
        return Math.floor(1000 + Math.random() * 500);
      default:
        return Math.random() * 100;
    }
  }

  /**
   * Get metric unit
   */
  private getMetricUnit(metric: string): string {
    if (metric.includes('Time')) return 'ms';
    if (metric.includes('Rate') || metric.includes('Percent')) return '%';
    if (metric.includes('rps')) return 'req/s';
    if (metric.includes('memoryUsage')) return 'bytes';
    if (metric.includes('uptime')) return 'ms';
    return '';
  }

  /**
   * Parse time range string
   */
  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/^(\d+)([smhd])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }
}
