import { Schedule } from '../types';

export const componentAnalysisSchedule: Schedule = {
  name: 'Component Analysis Schedule',
  description: 'Runs component analysis daily to track changes in component usage',
  type: 'recurring',
  task: {
    name: 'Daily Component Analysis',
    description: 'Analyzes component usage and tracks changes over time',
    priority: 'MEDIUM',
    cron: '0 0 * * *',
    owner: 'system',
    category: 'ANALYSIS',
  }
};
