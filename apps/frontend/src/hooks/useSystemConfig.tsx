import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface SystemConfig {
  logLevel: string;
  cacheTTL: number;
  rateLimit: number;
  // Add other config properties
}

export function useSystemConfig(): any {
  const [config, setConfig] = useState<SystemConfig>({
    logLevel: 'info',
    cacheTTL: 3600,
    rateLimit: 100
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<SystemConfig>) => {
    setLoading(true);
    try {
      await api.put('/admin/config', newConfig);
      setConfig((prev: any) => ({ ...prev, ...newConfig }));
    } finally {
      setLoading(false);
    }
  };

  return { config, updateConfig, loading };
}
