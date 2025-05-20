import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface FeatureFlag {
  name: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export function useFeatureFlags(): any {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/feature-flags');
      setFlags(response.data);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFlag = async (flagName: string, enabled: boolean) => {
    setLoading(true);
    try {
      await api.put(`/admin/feature-flags/${flagName}`, { enabled });
      setFlags((prev: any) => prev.map(flag => 
        flag.name === flagName ? { ...flag, enabled } : flag
      ));
    } finally {
      setLoading(false);
    }
  };

  return { flags, updateFlag, loading };
}
