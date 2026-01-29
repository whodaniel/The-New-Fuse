'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Agent } from './types';

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      case 'idle':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        onClick ? 'hover:border-primary' : ''
      }`}
      onClick={() => onClick?.(agent)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          <div className={`h-3 w-3 rounded-full ${getStatusColor(agent.status)}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {agent.description || 'No description'}
        </p>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities?.map((capability) => (
            <Badge key={capability} variant="secondary" className="text-xs">
              {capability}
            </Badge>
          ))}
        </div>
        {agent.metrics && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Calls: {agent.metrics.totalCalls}</span>
              <span>Success: {agent.metrics.successRate}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
