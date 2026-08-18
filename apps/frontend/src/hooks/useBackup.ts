// @ts-nocheck
import {
  BackupConfig,
  BackupResult,
  BackupSnapshot,
  createBackupService,
  StorageInventory,
} from '@the-new-fuse/api-client';
import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { useToast } from './useToast';

/**
 * Hook for managing backup and storage operations
 */
export function useBackup() {
  const { api, isAuthenticated } = useApi();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create backup service instance
  const backupService = useCallback(() => {
    if (!api) return null;
    return createBackupService(api);
  }, [api]);

  // Generic API call wrapper with loading and error handling
  const callApi = useCallback(
    async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
      if (!isAuthenticated) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access backup features.',
          variant: 'destructive',
        });
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });

        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, toast]
  );

  // Get storage inventory
  const getInventory = useCallback(async (): Promise<StorageInventory | null> => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.getInventory();
    });
  }, [backupService, callApi]);

  // List all backups
  const getBackups = useCallback(async (): Promise<BackupSnapshot[] | null> => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.getBackups();
    });
  }, [backupService, callApi]);

  // Get full status
  const getStatus = useCallback(async () => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.getStatus();
    });
  }, [backupService, callApi]);

  // Get backup config
  const getConfig = useCallback(async (): Promise<BackupConfig | null> => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.getConfig();
    });
  }, [backupService, callApi]);

  // Trigger a new backup
  const createBackup = useCallback(async (): Promise<BackupResult | null> => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.createBackup();
    });
  }, [backupService, callApi]);

  // Update backup destination
  const updateDestination = useCallback(
    async (destination: string) => {
      return callApi(async () => {
        const service = backupService();
        if (!service) return null;
        return service.updateDestination(destination);
      });
    },
    [backupService, callApi]
  );

  // Update cron expression
  const updateCronExpression = useCallback(
    async (expression: string) => {
      return callApi(async () => {
        const service = backupService();
        if (!service) return null;
        return service.updateCronExpression(expression);
      });
    },
    [backupService, callApi]
  );

  // Enable cron
  const enableCron = useCallback(async () => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.enableCron();
    });
  }, [backupService, callApi]);

  // Disable cron
  const disableCron = useCallback(async () => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.disableCron();
    });
  }, [backupService, callApi]);

  // Sync cron
  const syncCron = useCallback(async () => {
    return callApi(async () => {
      const service = backupService();
      if (!service) return null;
      return service.syncCron();
    });
  }, [backupService, callApi]);

  // Update retention
  const updateRetention = useCallback(
    async (count: number) => {
      return callApi(async () => {
        const service = backupService();
        if (!service) return null;
        return service.updateRetention(count);
      });
    },
    [backupService, callApi]
  );

  return {
    loading,
    error,
    getInventory,
    getBackups,
    getStatus,
    getConfig,
    createBackup,
    updateDestination,
    updateCronExpression,
    enableCron,
    disableCron,
    syncCron,
    updateRetention,
  };
}

export default useBackup;

export type {
  BackupConfig,
  BackupResult,
  BackupSnapshot,
  StorageInventory,
} from '@the-new-fuse/api-client';
