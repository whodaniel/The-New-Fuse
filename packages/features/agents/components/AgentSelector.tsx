'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';
import { Agent } from './types';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelect: (agent: Agent) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgent,
  onSelect,
}) => {
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
    <ScrollArea className="h-[500px]">
      <div className="space-y-2 p-2">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-all hover:bg-gray-50 ${
              selectedAgent?.id === agent.id ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => onSelect(agent)}
          >
            <CardContent className="flex items-center p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={agent.avatar} />
                <AvatarFallback>{agent.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{agent.name}</h3>
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                </div>
                <p className="text-sm text-gray-500 truncate">{agent.type}</p>
              </div>
              <div className="flex flex-wrap gap-1 ml-2">
                {agent.capabilities?.slice(0, 2).map((capability) => (
                  <Badge key={capability} variant="secondary" className="text-xs">
                    {capability}
                  </Badge>
                ))}
                {agent.capabilities && agent.capabilities.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{agent.capabilities.length - 2}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
