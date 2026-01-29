'use client';

import { Badge } from '@/components/ui/badge';
import React from 'react';
import { Agent, AgentStatus as AgentStatusType } from './types';

interface AgentStatusProps {
  status: AgentStatusType;
  showLabel?: boolean;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ status, showLabel = true }) => {
  const getStatusConfig = (status: AgentStatusType) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' };
      case 'inactive':
        return { variant: 'secondary' as const, className: '' };
      case 'error':
        return { variant: 'destructive' as const, className: '' };
      case 'idle':
        return { variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' };
      case 'offline':
        return { variant: 'outline' as const, className: 'border-gray-500 text-gray-500' };
      default:
        return { variant: 'secondary' as const, className: '' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={`capitalize ${config.className}`}>
      {showLabel ? status : '●'}
    </Badge>
  );
};

interface AgentStatusBadgeProps {
  agent: Agent;
  showLabel?: boolean;
}

export const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({ agent, showLabel = true }) => {
  return <AgentStatus status={agent.status} showLabel={showLabel} />;
};
