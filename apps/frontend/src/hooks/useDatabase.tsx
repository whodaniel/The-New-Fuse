import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface TableInfo {
  name: string;
  rowCount: number;
  size: string;
  lastUpdated: string;
}

interface MigrationInfo {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

interface BackupInfo {
  id: string;
  timestamp: string;
  size: string;
  status: 'available' | 'creating' | 'failed';
}

export function useDatabase(): any {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [migrations, setMigrations] = useState<MigrationInfo[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      const [tablesData, migrationsData, backupsData] = await Promise.all([
        api.get('/admin/database/tables'),
        api.get('/admin/database/migrations'),
        api.get('/admin/database/backups')
      ]);

      setTables(tablesData.data);
      setMigrations(migrationsData.data);
      setBackups(backupsData.data);
    } catch (error) {
      console.error('Error loading database info:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async (migrationId: string) => {
    setLoading(true);
    try {
      await api.post(`/admin/database/migrations/${migrationId}/run`);
      await loadDatabaseInfo();
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      await api.post('/admin/database/backups');
      await loadDatabaseInfo();
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    setLoading(true);
    try {
      await api.post(`/admin/database/backups/${backupId}/restore`);
      await loadDatabaseInfo();
    } finally {
      setLoading(false);
    }
  };

  return {
    tables,
    migrations,
    backups,
    runMigration,
    createBackup,
    restoreBackup,
    loading
  };
}
