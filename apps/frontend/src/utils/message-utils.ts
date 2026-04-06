export type AgentStatus = 'active' | 'idle' | 'offline' | 'error' | 'standby';

export const getAgentStatusColor = (status: AgentStatus | string): string => {
  switch (String(status || '').toLowerCase()) {
    case 'active':
      return 'bg-green-500';
    case 'idle':
    case 'standby':
      return 'bg-yellow-500';
    case 'offline':
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};
