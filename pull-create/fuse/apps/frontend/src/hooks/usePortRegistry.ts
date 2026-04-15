// apps/frontend/src/hooks/usePortRegistry.ts

import { useState, useEffect, useCallback } from 'react';
import { portManagementApi } from '../services/port-management-api';

interface PortRegistration {
  id: string;
  port: number;
  serviceName: string;
  serviceType: 'frontend' | 'api' | 'backend' | 'broker' | 'database' | 'other';
  environment: string;
  status: 'active' | 'reserved' | 'conflict' | 'inactive';
  processId?: number;
  host: string;
  protocol: string;
  healthCheckUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

interface PortConflict {
  port: number;
  conflictingServices: PortRegistration[];
  suggestedResolutions: {
    type: 'reassign' | 'terminate' | 'merge';
    targetService: string;
    newPort?: number;
    description: string;
  }[];
}

export const usePortRegistry = () => {
  const [ports, setPorts] = useState<PortRegistration[]>([]);
  const [conflicts, setConflicts] = useState<PortConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all ports
  const refreshPorts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [portsData, conflictsData] = await Promise.all([
        portManagementApi.getAllPorts(),
        portManagementApi.getConflicts()
      ]);
      
      setPorts(portsData);
      setConflicts(conflictsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch port data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Register a new port
  const registerPort = useCallback(async (config: {
    serviceName: string;
    serviceType: PortRegistration['serviceType'];
    environment: string;
    port?: number;
    host?: string;
    protocol?: string;
    healthCheckUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<PortRegistration> => {
    try {
      const registration = await portManagementApi.registerPort(config);
      await refreshPorts(); // Refresh to get updated data
      return registration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register port');
      throw err;
    }
  }, [refreshPorts]);

  // Reassign a port
  const reassignPort = useCallback(async (portId: string, newPort: number): Promise<void> => {
    try {
      await portManagementApi.reassignPort(portId, newPort);
      await refreshPorts(); // Refresh to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign port');
      throw err;
    }
  }, [refreshPorts]);

  // Resolve a conflict
  const resolveConflict = useCallback(async (port: number, resolution: any): Promise<void> => {
    try {
      await portManagementApi.resolveConflict({ port, resolution });
      await refreshPorts(); // Refresh to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve conflict');
      throw err;
    }
  }, [refreshPorts]);

  // Find available port
  const findAvailablePort = useCallback(async (serviceName: string, environment: string): Promise<number> => {
    try {
      return await portManagementApi.findAvailablePort(serviceName, environment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find available port');
      throw err;
    }
  }, []);

  // Check port health
  const checkPortHealth = useCallback(async (port: number): Promise<any> => {
    try {
      return await portManagementApi.checkPortHealth(port);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check port health');
      throw err;
    }
  }, []);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const ws = portManagementApi.connectWebSocket();
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'portRegistered':
        case 'portReassigned':
        case 'portInactive':
        case 'healthCheckFailed':
          refreshPorts();
          break;
        
        case 'conflictDetected':
          setConflicts(prev => [...prev, data.conflict]);
          break;
          
        case 'conflictResolved':
          setConflicts(prev => prev.filter(c => c.port !== data.port));
          break;
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
    };

    return () => {
      ws.close();
    };
  }, [refreshPorts]);

  // Initial load
  useEffect(() => {
    refreshPorts();
  }, [refreshPorts]);

  return {
    ports,
    conflicts,
    loading,
    error,
    refreshPorts,
    registerPort,
    reassignPort,
    resolveConflict,
    findAvailablePort,
    checkPortHealth
  };
};
