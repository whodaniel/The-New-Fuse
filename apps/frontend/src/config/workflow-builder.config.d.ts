/**
 * Configuration for the workflow builder
 */
export declare const workflowBuilderConfig: {
    /**
     * API configuration
     */
    api: {
        /**
         * Base URL for API requests
         */
        baseUrl: string;
        /**
         * WebSocket URL for real-time updates
         */
        wsUrl: string;
        /**
         * API endpoints
         */
        endpoints: {
            workflows: string;
            executions: string;
            agents: string;
            tools: string;
            a2a: string;
        };
        /**
         * API request timeout in milliseconds
         */
        timeout: number;
    };
    /**
     * Performance configuration
     */
    performance: {
        /**
         * Maximum number of nodes to render before enabling performance mode
         */
        maxNodesBeforeOptimization: number;
        /**
         * Whether to use virtualization for large workflows
         */
        useVirtualization: boolean;
        /**
         * Whether to use lazy loading for components
         */
        useLazyLoading: boolean;
        /**
         * Whether to use web workers for heavy computations
         */
        useWebWorkers: boolean;
    };
    /**
     * UI configuration
     */
    ui: {
        /**
         * Default node width
         */
        defaultNodeWidth: number;
        /**
         * Default node height
         */
        defaultNodeHeight: number;
        /**
         * Default node spacing
         */
        defaultNodeSpacing: number;
        /**
         * Default edge type
         */
        defaultEdgeType: string;
        /**
         * Whether to show node shadows
         */
        showNodeShadows: boolean;
        /**
         * Whether to show minimap
         */
        showMinimap: boolean;
        /**
         * Whether to show grid
         */
        showGrid: boolean;
        /**
         * Whether to snap to grid
         */
        snapToGrid: boolean;
        /**
         * Grid size
         */
        gridSize: number;
    };
    /**
     * Feature flags
     */
    features: {
        /**
         * Whether to enable debugging
         */
        enableDebugging: boolean;
        /**
         * Whether to enable analytics
         */
        enableAnalytics: boolean;
        /**
         * Whether to enable templates
         */
        enableTemplates: boolean;
        /**
         * Whether to enable subworkflows
         */
        enableSubworkflows: boolean;
        /**
         * Whether to enable loops
         */
        enableLoops: boolean;
        /**
         * Whether to enable A2A communication
         */
        enableA2A: boolean;
        /**
         * Whether to enable MCP tools
         */
        enableMCPTools: boolean;
        /**
         * Whether to enable keyboard shortcuts
         */
        enableKeyboardShortcuts: boolean;
    };
    /**
     * Monitoring configuration
     */
    monitoring: {
        /**
         * Whether to enable error monitoring
         */
        enableErrorMonitoring: boolean;
        /**
         * Whether to enable performance monitoring
         */
        enablePerformanceMonitoring: boolean;
        /**
         * Whether to enable usage analytics
         */
        enableUsageAnalytics: boolean;
        /**
         * Error monitoring service URL
         */
        errorMonitoringUrl: string;
        /**
         * Performance monitoring service URL
         */
        performanceMonitoringUrl: string;
        /**
         * Usage analytics service URL
         */
        usageAnalyticsUrl: string;
    };
};
