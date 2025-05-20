import { useState, useEffect, useCallback } from 'react';
import { FeatureFlagContext, Environment } from '../types/featureFlags.js';

export function useFeatureFlag(featureId: string, context: FeatureFlagContext = {}): any {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    checkFeatureStatus();
  }, [featureId, JSON.stringify(context)]);

  const checkFeatureStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/features/${featureId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch feature status');
      }
      
      const { enabled } = await response.json();
      setIsEnabled(enabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [featureId, context]);

  const toggleFeature = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isEnabled })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle feature');
      }
      
      const feature = await response.json();
      setIsEnabled(feature.enabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [featureId, isEnabled]);

  return {
    isEnabled,
    isLoading,
    error,
    toggleFeature,
    checkFeatureStatus
  };
}