import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Dashboard update types from the sync system
 */
export type DashboardUpdateType =
  | 'sync_metrics'
  | 'sync_health'
  | 'agent_status'
  | 'task_progress'
  | 'system_alert'
  | 'file_change'
  | 'conflict_detected'
  | 'sync_operation';

/**
 * Dashboard update payload
 */
export interface DashboardUpdate {
  type: DashboardUpdateType;
  tenantId?: string;
  userId?: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
}

/**
 * Sync metrics structure
 */
export interface SyncMetrics {
  operations: {
    sync: number;
    conflicts: number;
    fileChanges: number;
  };
  performance: {
    avgSyncTime: number;
    successRate: number;
    throughput: number;
  };
  errors: {
    networkErrors: number;
    conflictErrors: number;
    validationErrors: number;
  };
}

/**
 * System health structure
 */
export interface SyncHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  clockSync: {
    status: 'synced' | 'drifted' | 'failed';
    lastSync: Date;
    drift: number;
  };
  services: {
    redis: string;
    database: string;
    fileSystem: string;
    webSocket: string;
  };
  lastCheck: Date;
}

/**
 * System alert structure
 */
export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Sync operation structure
 */
export interface SyncOperation {
  id: string;
  type: 'sync' | 'conflict_resolution' | 'file_change';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Dashboard data structure
 */
export interface DashboardData {
  metrics: SyncMetrics | null;
  health: SyncHealth | null;
  alerts: SystemAlert[];
  operations: SyncOperation[];
  lastUpdated: Date | null;
}

/**
 * Hook configuration
 */
export interface UseSyncDashboardConfig {
  tenantId?: string;
  userId?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  updateInterval?: number;
}

/**
 * Hook return type
 */
export interface UseSyncDashboardReturn {
  data: DashboardData;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  refresh: () => void;
  clearAlerts: () => void;
  acknowledgeAlert: (alertId: string) => void;
}

/**
 * React hook for integrating sync dashboard updates with existing AdminDashboard
 * Provides real-time sync metrics, health status, alerts, and operations
 */
export function useSyncDashboard(config: UseSyncDashboardConfig = {}): UseSyncDashboardReturn {
  const {
    tenantId,
    userId,
    autoConnect = true,
    reconnectAttempts = 5,
    updateInterval = 30000, // 30 seconds
  } = config;

  // State management
  const [data, setData] = useState<DashboardData>({
    metrics: null,
    health: null,
    alerts: [],
    operations: [],
    lastUpdated: null,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const socketRef = useRef<Socket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  /**
   * Initialize WebSocket connection
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create WebSocket connection to agents namespace
      const socket = io('/agents', {
        query: {
          agentId: `dashboard_${userId || 'anonymous'}`,
          tenantId: tenantId || 'global',
          capabilities: JSON.stringify(['dashboard']),
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: reconnectAttempts,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Request initial dashboard data
        socket.emit('get_dashboard_data', { tenantId });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        setError(`Connection failed: ${err.message}`);
        setIsLoading(false);
        reconnectAttemptsRef.current++;
      });

      // Dashboard update handlers
      socket.on('sync_dashboard_update', (update: DashboardUpdate) => {
        handleDashboardUpdate(update);
      });

      socket.on('dashboard_data', (dashboardData: DashboardData) => {
        setData({
          ...dashboardData,
          lastUpdated: new Date(),
        });
        setIsLoading(false);
      });

      // Error handlers
      socket.on('error', (err) => {
        setError(`Socket error: ${err.error || err.message || 'Unknown error'}`);
      });
    } catch (err) {
      setError(
        `Failed to initialize connection: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setIsLoading(false);
    }
  }, [tenantId, userId, reconnectAttempts]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Handle incoming dashboard updates
   */
  const handleDashboardUpdate = useCallback(
    (update: DashboardUpdate) => {
      setData((prevData) => {
        const newData = { ...prevData };

        switch (update.type) {
          case 'sync_metrics':
            newData.metrics = update.data;
            break;

          case 'sync_health':
            newData.health = update.data;
            break;

          case 'system_alert':
            // Add new alert to the beginning of the array
            newData.alerts = [update.data, ...prevData.alerts.slice(0, 99)]; // Keep max 100 alerts
            break;

          case 'sync_operation':
            // Add new operation to the beginning of the array
            newData.operations = [update.data, ...prevData.operations.slice(0, 49)]; // Keep max 50 operations
            break;

          case 'agent_status':
          case 'task_progress':
          case 'file_change':
          case 'conflict_detected':
            // These updates might affect metrics or health, trigger a refresh
            if (socketRef.current) {
              socketRef.current.emit('get_dashboard_data', { tenantId });
            }
            break;
        }

        newData.lastUpdated = new Date();
        return newData;
      });
    },
    [tenantId]
  );

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('get_dashboard_data', { tenantId });
    } else if (!isConnected) {
      connect();
    }
  }, [tenantId, isConnected, connect]);

  /**
   * Clear all alerts
   */
  const clearAlerts = useCallback(() => {
    setData((prevData) => ({
      ...prevData,
      alerts: [],
      lastUpdated: new Date(),
    }));
  }, []);

  /**
   * Acknowledge specific alert
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    setData((prevData) => ({
      ...prevData,
      alerts: prevData.alerts.filter((alert) => alert.id !== alertId),
      lastUpdated: new Date(),
    }));
  }, []);

  /**
   * Setup periodic refresh
   */
  useEffect(() => {
    if (isConnected && updateInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, updateInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isConnected, updateInterval, refresh]);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    refresh,
    clearAlerts,
    acknowledgeAlert,
  };
}

/**
 * Helper hook for filtering alerts by level
 */
export function useFilteredAlerts(alerts: SystemAlert[], level?: SystemAlert['level']) {
  return alerts.filter((alert) => !level || alert.level === level);
}

/**
 * Helper hook for getting recent operations
 */
export function useRecentOperations(operations: SyncOperation[], limit: number = 10) {
  return operations
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
}

/**
 * Helper hook for calculating health score
 */
export function useHealthScore(health: SyncHealth | null): number {
  if (!health) return 0;

  let score = 100;

  // Deduct points based on status
  if (health.status === 'degraded') score -= 20;
  else if (health.status === 'unhealthy') score -= 50;

  // Deduct points for service issues
  Object.values(health.services).forEach((serviceStatus) => {
    if (serviceStatus !== 'healthy') score -= 10;
  });

  // Deduct points for clock drift
  if (health.clockSync.status === 'drifted') score -= 10;
  else if (health.clockSync.status === 'failed') score -= 30;

  return Math.max(0, score);
}
