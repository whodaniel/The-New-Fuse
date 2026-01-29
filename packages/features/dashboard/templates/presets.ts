import { DashboardPreset } from './types';

export const dashboardPresets: DashboardPreset[] = [
  {
    id: 'default',
    templateId: 'default-template',
    name: 'Default Dashboard',
    description: 'Standard dashboard layout with key metrics and charts',
    config: {},
    isDefault: true,
  },
  {
    id: 'analytics',
    templateId: 'analytics-template',
    name: 'Analytics Dashboard',
    description: 'Focused on data analytics and visualization',
    config: {},
  },
  {
    id: 'monitoring',
    templateId: 'monitoring-template',
    name: 'Monitoring Dashboard',
    description: 'Real-time system monitoring and alerts',
    config: {},
  },
  {
    id: 'development',
    templateId: 'development-template',
    name: 'Development Dashboard',
    description: 'Track development metrics and project progress',
    config: {},
  },
];
