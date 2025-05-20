import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface AuditLog {
  id: string;
  timestamp: string;
  type: 'user' | 'system' | 'security';
  user: string;
  action: string;
  details: string;
}

interface LogFilters {
  type: string;
  search: string;
  startDate?: string;
  endDate?: string;
}

export function useAuditLogs(): any {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<LogFilters>({
    type: '',
    search: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs', { params: filters });
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return { logs, filters, setFilters, loading };
}
