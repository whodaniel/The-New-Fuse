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
export declare class DashboardManager implements IDashboardManager {
    private readonly config;
    private readonly logger;
    private readonly dashboards;
    constructor(config: DashboardManagerConfig, logger?: Logger);
    /**
     * Create a dashboard
     */
    createDashboard(config: DashboardConfig): Promise<void>;
    /**
     * Update a dashboard
     */
    updateDashboard(id: string, config: Partial<DashboardConfig>): Promise<void>;
    /**
     * Delete a dashboard
     */
    deleteDashboard(id: string): Promise<void>;
    /**
     * Get dashboard
     */
    getDashboard(id: string): Promise<DashboardConfig | null>;
    /**
     * List all dashboards
     */
    listDashboards(): Promise<DashboardConfig[]>;
    /**
     * Get dashboard data
     */
    getDashboardData(id: string): Promise<any>;
    /**
     * Export dashboard
     */
    exportDashboard(id: string): Promise<string>;
    /**
     * Import dashboard
     */
    importDashboard(data: string): Promise<void>;
    /**
     * Initialize default dashboards
     */
    private initializeDefaultDashboards;
    /**
     * Generate panel data (mock implementation)
     */
    private generatePanelData;
    /**
     * Generate time series data
     */
    private generateTimeSeriesData;
    /**
     * Generate gauge data
     */
    private generateGaugeData;
    /**
     * Generate stat data
     */
    private generateStatData;
    /**
     * Generate table data
     */
    private generateTableData;
    /**
     * Generate heatmap data
     */
    private generateHeatmapData;
    /**
     * Generate bar data
     */
    private generateBarData;
    /**
     * Generate metric value (mock)
     */
    private generateMetricValue;
    /**
     * Get metric unit
     */
    private getMetricUnit;
    /**
     * Parse time range string
     */
    private parseTimeRange;
}
//# sourceMappingURL=DashboardManager.d.ts.map