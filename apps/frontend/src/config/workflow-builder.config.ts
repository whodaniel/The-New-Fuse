/**
 * Configuration for the workflow builder
 */
export const workflowBuilderConfig = {
  /**
   * API configuration
   */
  api: {
    /**
     * Base URL for API requests
     */
    baseUrl: process.env.VITE_API_BASE_URL || '/api',
    
    /**
     * WebSocket URL for real-time updates
     */
    wsUrl: process.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`,
    
    /**
     * API endpoints
     */
    endpoints: {
      workflows: '/workflows',
      executions: '/executions',
      agents: '/agents',
      tools: '/tools',
      a2a: '/a2a'
    },
    
    /**
     * API request timeout in milliseconds
     */
    timeout: 30000
  },
  
  /**
   * Performance configuration
   */
  performance: {
    /**
     * Maximum number of nodes to render before enabling performance mode
     */
    maxNodesBeforeOptimization: 50,
    
    /**
     * Whether to use virtualization for large workflows
     */
    useVirtualization: true,
    
    /**
     * Whether to use lazy loading for components
     */
    useLazyLoading: true,
    
    /**
     * Whether to use web workers for heavy computations
     */
    useWebWorkers: true
  },
  
  /**
   * UI configuration
   */
  ui: {
    /**
     * Default node width
     */
    defaultNodeWidth: 200,
    
    /**
     * Default node height
     */
    defaultNodeHeight: 100,
    
    /**
     * Default node spacing
     */
    defaultNodeSpacing: 50,
    
    /**
     * Default edge type
     */
    defaultEdgeType: 'smoothstep',
    
    /**
     * Whether to show node shadows
     */
    showNodeShadows: true,
    
    /**
     * Whether to show minimap
     */
    showMinimap: true,
    
    /**
     * Whether to show grid
     */
    showGrid: true,
    
    /**
     * Whether to snap to grid
     */
    snapToGrid: true,
    
    /**
     * Grid size
     */
    gridSize: 15
  },
  
  /**
   * Feature flags
   */
  features: {
    /**
     * Whether to enable debugging
     */
    enableDebugging: true,
    
    /**
     * Whether to enable analytics
     */
    enableAnalytics: true,
    
    /**
     * Whether to enable templates
     */
    enableTemplates: true,
    
    /**
     * Whether to enable subworkflows
     */
    enableSubworkflows: true,
    
    /**
     * Whether to enable loops
     */
    enableLoops: true,
    
    /**
     * Whether to enable A2A communication
     */
    enableA2A: true,
    
    /**
     * Whether to enable MCP tools
     */
    enableMCPTools: true,
    
    /**
     * Whether to enable keyboard shortcuts
     */
    enableKeyboardShortcuts: true
  },
  
  /**
   * Monitoring configuration
   */
  monitoring: {
    /**
     * Whether to enable error monitoring
     */
    enableErrorMonitoring: true,
    
    /**
     * Whether to enable performance monitoring
     */
    enablePerformanceMonitoring: true,
    
    /**
     * Whether to enable usage analytics
     */
    enableUsageAnalytics: true,
    
    /**
     * Error monitoring service URL
     */
    errorMonitoringUrl: process.env.VITE_ERROR_MONITORING_URL || '',
    
    /**
     * Performance monitoring service URL
     */
    performanceMonitoringUrl: process.env.VITE_PERFORMANCE_MONITORING_URL || '',
    
    /**
     * Usage analytics service URL
     */
    usageAnalyticsUrl: process.env.VITE_USAGE_ANALYTICS_URL || ''
  }
};
