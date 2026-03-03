import { apiService } from './api';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
}

export const FeatureFlagService = {
  getFlags: async (): Promise<FeatureFlag[]> => {
    try {
      return await apiService.get<FeatureFlag[]>('/api/features');
    } catch (error) {
      console.error('Failed to fetch feature flags', error);
      throw new Error('Feature flags are currently unavailable');
    }
  },

  toggleFlag: async (id: string, enabled: boolean): Promise<FeatureFlag> => {
    try {
      return await apiService.put<FeatureFlag>(`/api/features/${id}`, { enabled });
    } catch (error) {
      console.error(`Failed to toggle feature flag ${id}`, error);
      throw new Error('Unable to update feature flag');
    }
  },
};
