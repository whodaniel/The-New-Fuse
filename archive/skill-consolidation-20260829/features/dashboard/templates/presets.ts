import { DashboardPreset } from './types.js';

export const dashboardPresets: DashboardPreset[] = [
  {
    id: default',
    name: Default Dashboard',
    description: Standard dashboard layout with key metrics and charts',
    isDefault: true,
    layout: {
      id: default-layout',
      name: Default Layout',
      widgets: [
        { id: metrics', position: { x: 0, y: 0, w: 12, h: 1 } },
        { id: activity', position: { x: 0, y: 1, w: 6, h: 2 } },
        { id: performance', position: { x: 6, y: 1, w: 6, h: 2 } },
        { id: tasks', position: { x: 0, y: 3, w: 8, h: 2 } },
        { id: notifications', position: { x: 8, y: 3, w: 4, h: 2 } },
      ],
    },
  },
  {
    id: analytics',
    name: Analytics Dashboard',
    description: Focused on data analytics and visualization',
    layout: {
      id: analytics-layout',
      name: Analytics Layout',
      widgets: [
        { id: key-metrics', position: { x: 0, y: 0, w: 12, h: 1 } },
        { id: trends', position: { x: 0, y: 1, w: 8, h: 2 } },
        { id: distribution', position: { x: 8, y: 1, w: 4, h: 2 } },
        { id: detailed-stats', position: { x: 0, y: 3, w: 12, h: 2 } },
      ],
    },
  },
  {
    id: monitoring',
    name: Monitoring Dashboard',
    description: Real-time system monitoring and alerts',
    layout: {
      id: monitoring-layout',
      name: Monitoring Layout',
      widgets: [
        { id: system-status', position: { x: 0, y: 0, w: 12, h: 1 } },
        { id: performance-metrics', position: { x: 0, y: 1, w: 6, h: 2 } },
        { id: alerts', position: { x: 6, y: 1, w: 6, h: 2 } },
        { id: logs', position: { x: 0, y: 3, w: 12, h: 2 } },
      ],
    },
  },
  {
    id: development',
    name: Development Dashboard',
    description: Track development metrics and project progress',
    layout: {
      id: development-layout',
      name: Development Layout',
      widgets: [
        { id: sprint-metrics', position: { x: 0, y: 0, w: 12, h: 1 } },
        { id: pull-requests', position: { x: 0, y: 1, w: 6, h: 2 } },
        { id: build-status', position: { x: 6, y: 1, w: 6, h: 2 } },
        { id: issues', position: { x: 0, y: 3, w: 8, h: 2 } },
        { id: code-quality', position: { x: 8, y: 3, w: 4, h: 2 } },
      ],
    },
  },
];
