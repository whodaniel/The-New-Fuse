import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureFlag } from '../types/featureFlags.js';

interface FeatureFlagContextType {
  features: Map<string, FeatureFlag>;
  isFeatureEnabled: (featureId: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<Map<string, FeatureFlag>>(new Map());

  const refreshFeatures = async () => {
    try {
      const response = await fetch('/api/admin/features');
      const featureList = await response.json();
      const featureMap = new Map(featureList.map((f: FeatureFlag) => [f.id, f]));
      setFeatures(featureMap);
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  };

  useEffect(() => {
    refreshFeatures();
  }, []);

  const isFeatureEnabled = (featureId: string): boolean => {
    const feature = features.get(featureId);
    if (!feature) return false;

    // If feature is not enabled at all, return false
    if (!feature.enabled) return false;

    // Check conditions if they exist
    if (feature.conditions) {
      const now = new Date();

      // Check date range if specified
      if (feature.conditions.startDate && new Date(feature.conditions.startDate) > now) return false;
      if (feature.conditions.endDate && new Date(feature.conditions.endDate) < now) return false;

      // Additional condition checks could be added here
    }

    return true;
  };

  return (
    <FeatureFlagContext.Provider value={{ features, isFeatureEnabled, refreshFeatures }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}