import { Activity, Heart, RefreshCw, Zap } from 'lucide-react';

export interface AdminCommand {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  method: 'POST' | 'GET';
  icon?: any;
  category: 'System' | 'AI' | 'Maintenance';
  requiresConfirmation?: boolean;
}

export const ADMIN_COMMANDS: AdminCommand[] = [
  // AI / Jules Commands
  {
    id: 'trigger-jules-manual',
    label: 'Trigger Jules Improvement',
    description:
      'Manually initiates a Jules self-improvement cycle using a demonstration pattern. Useful for forcing the loop without waiting for automated pattern extraction.',
    endpoint: '/self-improvement/trigger/manual',
    method: 'POST',
    icon: Zap,
    category: 'AI',
    requiresConfirmation: false,
  },
  {
    id: 'trigger-patterns',
    label: 'Run Pattern Extraction',
    description:
      'Triggers the analysis of recent tasks to identify recurring workflows and update the pattern library.',
    endpoint: '/self-improvement/trigger/patterns',
    method: 'POST',
    icon: Activity,
    category: 'AI',
  },

  // Maintenance / Cron Commands
  {
    id: 'trigger-daily',
    label: 'Run Daily Maintenance',
    description:
      'Executes the daily self-improvement and maintenance routines typically scheduled for midnight.',
    endpoint: '/self-improvement/trigger/daily',
    method: 'POST',
    icon: RefreshCw,
    category: 'Maintenance',
    requiresConfirmation: true,
  },
  {
    id: 'trigger-health',
    label: 'Check System Health',
    description:
      'Forces an immediate health check of all registered agents and updates their status.',
    endpoint: '/self-improvement/trigger/health',
    method: 'POST',
    icon: Heart,
    category: 'System',
  },
];
