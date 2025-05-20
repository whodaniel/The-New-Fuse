import { Schedule } from '../types.js';

export const componentAnalysisSchedule: Schedule = {
  id: 'component-analysis-schedule',
  name: 'Component Analysis Schedule',
  description: 'Runs component analysis daily to track changes in component usage',
  type: 'recurring',
  taskTemplate: {
    type: 'component-analysis',
    name: 'Daily Component Analysis',
    description: 'Analyzes component usage and tracks changes over time',
    priority: 'medium',
    metadata: {
      retention: '90days' // Keep analysis results for 90 days
    }
  },
  timing: {
    // Run daily at midnight
    cron: '0 0 * * *',
  },
  enabled: true,
  metadata: {
    owner: 'system',
    category: 'maintenance'
  }
};