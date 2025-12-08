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
      console.warn('Failed to fetch feature flags, returning mock data', error);
      return [
        {
          id: 'new-ui',
          name: 'New UI Layout',
          description: 'Enable the redesigned user interface',
          enabled: true,
          rolloutPercentage: 100,
        },
        {
          id: 'beta-workflows',
          name: 'Beta Workflow Engine',
          description: 'Access to experimental workflow features',
          enabled: false,
          rolloutPercentage: 0,
        },
      ];
    }
  },

  toggleFlag: async (id: string, enabled: boolean): Promise<FeatureFlag> => {
    try {
      return await apiService.put<FeatureFlag>(`/api/features/${id}`, { enabled });
    } catch (error) {
      console.warn('Failed to toggle flag, simulating success');
      return {
        id,
        name: 'Mock Flag',
        description: 'Mock Description',
        enabled,
        rolloutPercentage: 0,
      };
    }
  },
};
